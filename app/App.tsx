import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useSesion } from './hooks/useSesion';
import BottomNav, { VISTAS, type Vista } from './components/BottomNav';
import type { Meta } from './db/metas';
import type { Objetivo } from './db/objetivos';
import type { Prioridad } from './db/tareas';
import { color, espacio } from './screens/theme';

export type { SesionActiva } from './hooks/useSesion';

export default function App() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [vista, setVista] = useState<Vista>('hoy');
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null);
  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState<Objetivo | null>(null);
  const [texto, setTexto] = useState('');
  const [textoObjetivo, setTextoObjetivo] = useState('');
  const [textoTarea, setTextoTarea] = useState('');
  const [textoFechaTarea, setTextoFechaTarea] = useState('');
  const [errorFechaTarea, setErrorFechaTarea] = useState('');
  const [textoDuracionTarea, setTextoDuracionTarea] = useState('');
  const [errorDuracionTarea, setErrorDuracionTarea] = useState('');
  const [prioridadTarea, setPrioridadTarea] = useState<Prioridad | null>(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);

  const {
    sesionActiva,
    tiempoSegundos,
    duracionTrabajo,
    setDuracionTrabajo,
    duracionDescanso,
    setDuracionDescanso,
    cargarConfigPomodoro,
    iniciarSesion,
    detenerSesion,
  } = useSesion(db);

  useEffect(() => {
    getDb().then(setDb);
  }, []);

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
            accessibilityLabel="Configuración"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </Pressable>
        </View>
        {!enDetalle && vistaActual ? (
          <Text style={styles.headerSubtitulo}>{vistaActual.subtitulo}</Text>
        ) : null}
      </View>
      <View style={styles.contenido}>
        {!db ? (
          <ActivityIndicator size="large" color={color.primario} style={styles.spinner} />
        ) : objetivoSeleccionado && metaSeleccionada ? (
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
  spinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
