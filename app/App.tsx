import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { SQLiteDatabase } from 'expo-sqlite';

import IdeasScreen from './screens/IdeasScreen';
import MetasScreen from './screens/MetasScreen';
import HoyScreen from './screens/HoyScreen';
import MetaDetalleScreen from './screens/MetaDetalleScreen';
import ObjetivoDetalleScreen from './screens/ObjetivoDetalleScreen';
import DisponibilidadScreen from './screens/DisponibilidadScreen';
import { getDb } from './db/database';
import {
  crearSesion,
  iniciarSesionActiva,
  obtenerSesionActiva,
  finalizarSesionActiva,
  iniciarPomodoro,
  avanzarFasePomodoro,
  resolverSesionActivaAlAbrir,
  obtenerConfiguracionPomodoro,
  type ModoSesion,
  type FasePomodoro,
} from './db/sesiones';
import type { Meta } from './db/metas';
import type { Objetivo } from './db/objetivos';
import type { Prioridad, Tarea } from './db/tareas';

type Vista = 'hoy' | 'ideas' | 'metas' | 'disponibilidad';

export interface SesionActiva {
  tareaId: number;
  inicioTimestamp: number;
  modo: ModoSesion;
  fase: FasePomodoro | null;
  finEsperadoTimestamp: number | null;
}

export default function App() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [vista, setVista] = useState<Vista>('hoy');
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null);
  const [objetivoSeleccionado, setObjetivoSeleccionado] =
    useState<Objetivo | null>(null);
  const [sesionActiva, setSesionActiva] = useState<SesionActiva | null>(null);
  const [tiempoSegundos, setTiempoSegundos] = useState(0);
  const [texto, setTexto] = useState('');
  const [textoObjetivo, setTextoObjetivo] = useState('');
  const [textoTarea, setTextoTarea] = useState('');
  const [textoFechaTarea, setTextoFechaTarea] = useState('');
  const [errorFechaTarea, setErrorFechaTarea] = useState('');
  const [textoDuracionTarea, setTextoDuracionTarea] = useState('');
  const [errorDuracionTarea, setErrorDuracionTarea] = useState('');
  const [prioridadTarea, setPrioridadTarea] = useState<Prioridad | null>(null);
  const [modoSesion, setModoSesion] = useState<ModoSesion>('libre');
  const [duracionTrabajo, setDuracionTrabajo] = useState('25');
  const [duracionDescanso, setDuracionDescanso] = useState('5');
  const sesionActivaRef = useRef<SesionActiva | null>(null);

  useEffect(() => {
    getDb().then(setDb);
  }, []);

  useEffect(() => {
    if (!db) {
      return;
    }
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
    if (!db || sesionActiva?.modo !== 'pomodoro' || !sesionActiva.finEsperadoTimestamp) {
      return;
    }
    let avanzando = false;
    const intervalo = setInterval(async () => {
      if (avanzando) return;
      if (!sesionActivaRef.current?.finEsperadoTimestamp) return;
      if (Date.now() >= sesionActivaRef.current.finEsperadoTimestamp) {
        avanzando = true;
        try {
          const resultado = await avanzarFasePomodoro(db);
          if (resultado) {
            if (resultado.minutosTrabajo > 0) {
              Vibration.vibrate();
            }
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
    if (!sesionActiva) {
      return;
    }
    const actualizarCronometro = () => {
      if (sesionActiva.modo === 'pomodoro' && sesionActiva.finEsperadoTimestamp) {
        const restante = Math.max(
          0,
          Math.floor((sesionActiva.finEsperadoTimestamp - Date.now()) / 1000)
        );
        setTiempoSegundos(restante);
      } else {
        setTiempoSegundos(
          Math.floor((Date.now() - sesionActiva.inicioTimestamp) / 1000)
        );
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

  function iniciarSesion(tarea: Tarea) {
    if (sesionActiva && sesionActiva.tareaId !== tarea.id) {
      Alert.alert(
        'Sesión activa',
        'Ya hay una sesión en curso. Detén la sesión activa antes de iniciar otra.'
      );
      return;
    }
    if (modoSesion === 'pomodoro') {
      const trabajo = parseInt(duracionTrabajo, 10);
      const descanso = parseInt(duracionDescanso, 10);
      if (isNaN(trabajo) || trabajo < 1 || isNaN(descanso) || descanso < 1) {
        Alert.alert('Duración inválida', 'Las duraciones deben ser números positivos.');
        return;
      }
      if (db) {
        iniciarPomodoro(db, tarea.id, trabajo, descanso);
      }
      const ahora = Date.now();
      const finEsperado = ahora + trabajo * 60000;
      const nueva: SesionActiva = {
        tareaId: tarea.id,
        inicioTimestamp: ahora,
        modo: 'pomodoro',
        fase: 'trabajo',
        finEsperadoTimestamp: finEsperado,
      };
      setSesionActiva(nueva);
      sesionActivaRef.current = nueva;
      setTiempoSegundos(trabajo * 60);
    } else {
      if (db) {
        iniciarSesionActiva(db, tarea.id);
      }
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
  }

  async function detenerSesion() {
    if (!sesionActiva || !db) {
      return;
    }
    if (sesionActiva.modo === 'pomodoro' && sesionActiva.fase === 'descanso') {
      await db.runAsync('DELETE FROM sesion_activa WHERE tarea_id = ?', sesionActiva.tareaId);
      setSesionActiva(null);
      sesionActivaRef.current = null;
      setTiempoSegundos(0);
      return;
    }
    const ahora = Date.now();
    const minutos = Math.round(
      (ahora - sesionActiva.inicioTimestamp) / 60000
    );
    if (minutos < 1) {
      Alert.alert('Sesión muy corta', 'La sesión duró menos de 30 segundos y no se guardó.');
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Flexgoal</Text>
      {!db ? null : objetivoSeleccionado && metaSeleccionada ? (
        <ObjetivoDetalleScreen
          db={db}
          objetivo={objetivoSeleccionado}
          nombreMeta={metaSeleccionada.nombre}
          onVolver={() => setObjetivoSeleccionado(null)}
          sesionActiva={sesionActiva}
          tiempoSegundos={tiempoSegundos}
          onIniciarSesion={iniciarSesion}
          onDetenerSesion={detenerSesion}
          textoTarea={textoTarea}
          setTextoTarea={setTextoTarea}
          textoFechaTarea={textoFechaTarea}
          setTextoFechaTarea={setTextoFechaTarea}
          errorFechaTarea={errorFechaTarea}
          setErrorFechaTarea={setErrorFechaTarea}
          textoDuracionTarea={textoDuracionTarea}
          setTextoDuracionTarea={setTextoDuracionTarea}
          errorDuracionTarea={errorDuracionTarea}
          setErrorDuracionTarea={setErrorDuracionTarea}
          prioridadTarea={prioridadTarea}
          setPrioridadTarea={setPrioridadTarea}
          modoSesion={modoSesion}
          setModoSesion={setModoSesion}
          duracionTrabajo={duracionTrabajo}
          setDuracionTrabajo={setDuracionTrabajo}
          duracionDescanso={duracionDescanso}
          setDuracionDescanso={setDuracionDescanso}
          onCargarConfigPomodoro={cargarConfigPomodoro}
        />
      ) : metaSeleccionada ? (
        <MetaDetalleScreen
          db={db}
          meta={metaSeleccionada}
          onVolver={() => setMetaSeleccionada(null)}
          onSeleccionarObjetivo={(objetivo) => setObjetivoSeleccionado(objetivo)}
          textoObjetivo={textoObjetivo}
          setTextoObjetivo={setTextoObjetivo}
        />
      ) : (
        <>
          <ViewToggle vista={vista} onChangeVista={setVista} />
          {vista === 'hoy' ? (
            <HoyScreen
              db={db}
              sesionActiva={sesionActiva}
              tiempoSegundos={tiempoSegundos}
              onIniciarSesion={iniciarSesion}
              onDetenerSesion={detenerSesion}
              modoSesion={modoSesion}
              setModoSesion={setModoSesion}
              duracionTrabajo={duracionTrabajo}
              setDuracionTrabajo={setDuracionTrabajo}
              duracionDescanso={duracionDescanso}
              setDuracionDescanso={setDuracionDescanso}
              onCargarConfigPomodoro={cargarConfigPomodoro}
            />
          ) : vista === 'ideas' ? (
            <IdeasScreen db={db} texto={texto} setTexto={setTexto} />
          ) : vista === 'metas' ? (
            <MetasScreen
              db={db}
              onSeleccionarMeta={(meta) => setMetaSeleccionada(meta)}
            />
          ) : (
            <DisponibilidadScreen db={db} />
          )}
        </>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function ViewToggle({
  vista,
  onChangeVista,
}: {
  vista: Vista;
  onChangeVista: (vista: Vista) => void;
}) {
  return (
    <View style={styles.tabs}>
      <Pressable
        style={[styles.tab, vista === 'hoy' && styles.tabActiva]}
        onPress={() => onChangeVista('hoy')}
      >
        <Text
          style={[styles.tabTexto, vista === 'hoy' && styles.tabTextoActivo]}
        >
          Hoy
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, vista === 'ideas' && styles.tabActiva]}
        onPress={() => onChangeVista('ideas')}
      >
        <Text
          style={[
            styles.tabTexto,
            vista === 'ideas' && styles.tabTextoActivo,
          ]}
        >
          Ideas
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, vista === 'metas' && styles.tabActiva]}
        onPress={() => onChangeVista('metas')}
      >
        <Text style={[styles.tabTexto, vista === 'metas' && styles.tabTextoActivo]}>
          Metas
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, vista === 'disponibilidad' && styles.tabActiva]}
        onPress={() => onChangeVista('disponibilidad')}
      >
        <Text
          style={[
            styles.tabTexto,
            vista === 'disponibilidad' && styles.tabTextoActivo,
          ]}
        >
          Horario
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  tabActiva: {
    backgroundColor: '#fff',
  },
  tabTexto: {
    fontSize: 15,
    color: '#666',
  },
  tabTextoActivo: {
    color: '#1c7ed6',
    fontWeight: '600',
  },
});
