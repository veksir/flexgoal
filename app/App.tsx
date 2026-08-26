import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { SQLiteDatabase } from 'expo-sqlite';

import IdeasScreen from './screens/IdeasScreen';
import MetasScreen from './screens/MetasScreen';
import HoyScreen from './screens/HoyScreen';
import MetaDetalleScreen from './screens/MetaDetalleScreen';
import ObjetivoDetalleScreen from './screens/ObjetivoDetalleScreen';
import DisponibilidadScreen from './screens/DisponibilidadScreen';
import SemanaScreen from './screens/SemanaScreen';
import ConfiguracionScreen from './screens/ConfiguracionScreen';
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
import { color, espacio, radio } from './screens/theme';

type Vista = 'hoy' | 'ideas' | 'metas' | 'disponibilidad' | 'semana';

const VISTAS: { id: Vista; etiqueta: string; icono: string; subtitulo: string }[] = [
  { id: 'hoy', etiqueta: 'Hoy', icono: '☀️', subtitulo: 'Tus tareas para hoy' },
  { id: 'ideas', etiqueta: 'Ideas', icono: '💡', subtitulo: 'Bandeja de ideas' },
  { id: 'metas', etiqueta: 'Metas', icono: '🎯', subtitulo: 'Tus metas y objetivos' },
  { id: 'disponibilidad', etiqueta: 'Horario', icono: '🗓️', subtitulo: 'Disponibilidad semanal' },
  { id: 'semana', etiqueta: 'Semana', icono: '📊', subtitulo: 'Carga planificada vs. disponible' },
];

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
  const [mostrarConfig, setMostrarConfig] = useState(false);
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

  const enDetalle = Boolean(metaSeleccionada || objetivoSeleccionado);
  const vistaActual = VISTAS.find((v) => v.id === vista);

  if (mostrarConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerFila}>
            <Text style={styles.titulo}>Flexgoal</Text>
          </View>
          <Text style={styles.headerSubtitulo}>Configuración</Text>
        </View>
        <View style={styles.contenido}>
          <ConfiguracionScreen onVolver={() => setMostrarConfig(false)} />
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerFila}>
          <Text style={styles.titulo}>Flexgoal</Text>
          <Pressable
            onPress={() => setMostrarConfig(true)}
            hitSlop={8}
            style={{ padding: espacio.sm }}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </Pressable>
        </View>
        {!enDetalle && vistaActual ? (
          <Text style={styles.headerSubtitulo}>{vistaActual.subtitulo}</Text>
        ) : null}
      </View>
      <View style={styles.contenido}>
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
          ) : vista === 'disponibilidad' ? (
            <DisponibilidadScreen db={db} />
          ) : (
            <SemanaScreen db={db} />
          )}
        </>
      )}
      </View>
      {!enDetalle ? (
        <BottomNav vista={vista} onChangeVista={setVista} />
      ) : null}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function BottomNav({
  vista,
  onChangeVista,
}: {
  vista: Vista;
  onChangeVista: (vista: Vista) => void;
}) {
  return (
    <View style={styles.tabs}>
      {VISTAS.map((item) => {
        const activo = vista === item.id;
        return (
          <Pressable
            key={item.id}
            style={styles.tab}
            onPress={() => onChangeVista(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={item.etiqueta}
          >
            {activo ? <View style={styles.tabIndicador} /> : null}
            <Text style={[styles.tabIcono, activo && styles.tabIconoActivo]}>
              {item.icono}
            </Text>
            <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>
              {item.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.fondo,
  },
  header: {
    paddingHorizontal: espacio.base,
    paddingTop: espacio.sm,
    paddingBottom: espacio.md,
    borderBottomWidth: 1,
    borderBottomColor: color.borde,
  },
  headerFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: color.textoPrimario,
    letterSpacing: -0.3,
  },
  headerSubtitulo: {
    fontSize: 13.5,
    color: color.textoTerciario,
    marginTop: 2,
  },
  contenido: {
    flex: 1,
    paddingHorizontal: espacio.base,
    paddingTop: espacio.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: color.fondo,
    borderTopWidth: 1,
    borderTopColor: color.borde,
    paddingTop: espacio.xs,
    paddingBottom: espacio.sm,
    paddingHorizontal: espacio.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espacio.xs + 2,
    gap: 2,
  },
  tabIndicador: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    borderRadius: radio.completo,
    backgroundColor: color.primario,
  },
  tabIcono: {
    fontSize: 19,
    opacity: 0.5,
  },
  tabIconoActivo: {
    opacity: 1,
  },
  tabTexto: {
    fontSize: 11,
    color: color.textoTerciario,
    fontWeight: '600',
  },
  tabTextoActivo: {
    color: color.primario,
    fontWeight: '700',
  },
});
