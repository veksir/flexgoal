import { useEffect, useRef, useState } from 'react';
import { Alert, Vibration } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  iniciarSesionActiva,
  finalizarSesionActiva,
  iniciarPomodoro,
  avanzarFasePomodoro,
  obtenerSesionActiva,
  resolverSesionActivaAlAbrir,
  obtenerConfiguracionPomodoro,
  type ModoSesion,
  type FasePomodoro,
} from '../db/sesiones';
import type { Tarea } from '../db/tareas';

export interface SesionActiva {
  tareaId: number;
  inicioTimestamp: number;
  modo: ModoSesion;
  fase: FasePomodoro | null;
  finEsperadoTimestamp: number | null;
}

export function useSesion(db: SQLiteDatabase | null) {
  const [sesionActiva, setSesionActiva] = useState<SesionActiva | null>(null);
  const [tiempoSegundos, setTiempoSegundos] = useState(0);
  const [duracionTrabajo, setDuracionTrabajo] = useState('25');
  const [duracionDescanso, setDuracionDescanso] = useState('5');
  const sesionActivaRef = useRef<SesionActiva | null>(null);

  useEffect(() => {
    if (!db) return;
    resolverSesionActivaAlAbrir(db).then((sesion) => {
      if (sesion) {
        const inicioTimestamp = new Date(sesion.inicio).getTime();
        const finEsperadoTimestamp = sesion.finEsperado
          ? new Date(sesion.finEsperado).getTime()
          : null;
        const nueva: SesionActiva = {
          tareaId: sesion.tareaId,
          inicioTimestamp,
          modo: sesion.modo,
          fase: sesion.fase,
          finEsperadoTimestamp,
        };
        setSesionActiva(nueva);
        sesionActivaRef.current = nueva;
      }
    });
  }, [db]);

  useEffect(() => {
    if (!db || sesionActiva?.modo !== 'pomodoro' || !sesionActiva.finEsperadoTimestamp) return;
    let avanzando = false;
    const intervalo = setInterval(async () => {
      if (avanzando) return;
      if (!sesionActivaRef.current?.finEsperadoTimestamp) return;
      if (Date.now() >= sesionActivaRef.current.finEsperadoTimestamp) {
        avanzando = true;
        try {
          const resultado = await avanzarFasePomodoro(db);
          if (resultado) {
            if (resultado.minutosTrabajo > 0) Vibration.vibrate();
            const nuevaSesion = await obtenerSesionActiva(db);
            if (nuevaSesion) {
              const inicioTimestamp = new Date(nuevaSesion.inicio).getTime();
              const finEsperadoTimestamp = nuevaSesion.finEsperado
                ? new Date(nuevaSesion.finEsperado).getTime()
                : null;
              const nueva: SesionActiva = {
                tareaId: nuevaSesion.tareaId,
                inicioTimestamp,
                modo: nuevaSesion.modo,
                fase: nuevaSesion.fase,
                finEsperadoTimestamp,
              };
              setSesionActiva(nueva);
              sesionActivaRef.current = nueva;
            } else {
              Vibration.vibrate();
              setSesionActiva(null);
              sesionActivaRef.current = null;
            }
          }
        } finally {
          avanzando = false;
        }
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [db, sesionActiva?.finEsperadoTimestamp, sesionActiva?.modo]);

  useEffect(() => {
    if (!sesionActiva) return;
    const actualizarCronometro = () => {
      if (sesionActiva.modo === 'pomodoro' && sesionActiva.finEsperadoTimestamp) {
        setTiempoSegundos(Math.max(0, Math.floor((sesionActiva.finEsperadoTimestamp - Date.now()) / 1000)));
      } else {
        setTiempoSegundos(Math.floor((Date.now() - sesionActiva.inicioTimestamp) / 1000));
      }
    };
    actualizarCronometro();
    const intervalo = setInterval(actualizarCronometro, 1000);
    return () => clearInterval(intervalo);
  }, [sesionActiva]);

  async function cargarConfigPomodoro() {
    if (db) {
      const config = await obtenerConfiguracionPomodoro(db);
      setDuracionTrabajo(String(config.duracionTrabajoMinutos));
      setDuracionDescanso(String(config.duracionDescansoMinutos));
    }
  }

  async function iniciarSesion(tarea: Tarea, modo: ModoSesion = 'libre') {
    if (sesionActiva && sesionActiva.tareaId !== tarea.id) {
      Alert.alert('Sesión activa', 'Ya hay una sesión en curso. Detén la sesión activa antes de iniciar otra.');
      return;
    }
    if (!db) return;
    try {
      if (modo === 'pomodoro') {
        const trabajo = parseInt(duracionTrabajo, 10);
        const descanso = parseInt(duracionDescanso, 10);
        if (isNaN(trabajo) || trabajo < 1 || isNaN(descanso) || descanso < 1) {
          Alert.alert('Duración inválida', 'Las duraciones deben ser números positivos.');
          return;
        }
        await iniciarPomodoro(db, tarea.id, trabajo, descanso);
        const ahora = Date.now();
        const nueva: SesionActiva = {
          tareaId: tarea.id,
          inicioTimestamp: ahora,
          modo: 'pomodoro',
          fase: 'trabajo',
          finEsperadoTimestamp: ahora + trabajo * 60000,
        };
        setSesionActiva(nueva);
        sesionActivaRef.current = nueva;
        setTiempoSegundos(trabajo * 60);
      } else {
        await iniciarSesionActiva(db, tarea.id);
        const nueva: SesionActiva = {
          tareaId: tarea.id,
          inicioTimestamp: Date.now(),
          modo: 'libre',
          fase: null,
          finEsperadoTimestamp: null,
        };
        setSesionActiva(nueva);
        sesionActivaRef.current = nueva;
        setTiempoSegundos(0);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo iniciar la sesión. Intentá de nuevo.');
    }
  }

  async function detenerSesion() {
    if (!sesionActiva || !db) return;
    if (sesionActiva.modo === 'pomodoro' && sesionActiva.fase === 'descanso') {
      await db.runAsync('DELETE FROM sesion_activa WHERE tarea_id = ?', sesionActiva.tareaId);
      setSesionActiva(null);
      sesionActivaRef.current = null;
      setTiempoSegundos(0);
      return;
    }
    const minutos = Math.round((Date.now() - sesionActiva.inicioTimestamp) / 60000);
    if (minutos < 1) {
      Alert.alert('Sesión muy corta', 'La sesión duró menos de 1 minuto y no se guardó.');
      await finalizarSesionActiva(db, sesionActiva.tareaId);
      setSesionActiva(null);
      sesionActivaRef.current = null;
      setTiempoSegundos(0);
      return;
    }
    await finalizarSesionActiva(db, sesionActiva.tareaId);
    setSesionActiva(null);
    sesionActivaRef.current = null;
    setTiempoSegundos(0);
  }

  return {
    sesionActiva,
    tiempoSegundos,
    duracionTrabajo,
    setDuracionTrabajo,
    duracionDescanso,
    setDuracionDescanso,
    cargarConfigPomodoro,
    iniciarSesion,
    detenerSesion,
  };
}
