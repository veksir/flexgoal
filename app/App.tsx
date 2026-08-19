import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import IdeasScreen from './screens/IdeasScreen';
import MetasScreen from './screens/MetasScreen';
import MetaDetalleScreen from './screens/MetaDetalleScreen';
import ObjetivoDetalleScreen from './screens/ObjetivoDetalleScreen';
import { crearSesion } from './db/sesiones';
import type { Meta } from './db/metas';
import type { Objetivo } from './db/objetivos';
import type { Tarea } from './db/tareas';

type Vista = 'ideas' | 'metas';

export interface SesionActiva {
  tareaId: number;
  inicioTimestamp: number;
}

export default function App() {
  const [vista, setVista] = useState<Vista>('ideas');
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null);
  const [objetivoSeleccionado, setObjetivoSeleccionado] =
    useState<Objetivo | null>(null);
  const [sesionActiva, setSesionActiva] = useState<SesionActiva | null>(null);
  const [tiempoSegundos, setTiempoSegundos] = useState(0);

  useEffect(() => {
    if (!sesionActiva) {
      return;
    }
    const actualizarCronometro = () => {
      setTiempoSegundos(
        Math.floor((Date.now() - sesionActiva.inicioTimestamp) / 1000)
      );
    };
    actualizarCronometro();
    const intervalo = setInterval(actualizarCronometro, 1000);
    return () => clearInterval(intervalo);
  }, [sesionActiva]);

  function iniciarSesion(tarea: Tarea) {
    if (sesionActiva && sesionActiva.tareaId !== tarea.id) {
      Alert.alert(
        'Sesión activa',
        'Ya hay una sesión en curso. Detén la sesión activa antes de iniciar otra.'
      );
      return;
    }
    setSesionActiva({ tareaId: tarea.id, inicioTimestamp: Date.now() });
    setTiempoSegundos(0);
  }

  async function detenerSesion() {
    if (!sesionActiva) {
      return;
    }
    const minutos = Math.round(
      (Date.now() - sesionActiva.inicioTimestamp) / 60000
    );
    if (minutos < 1) {
      Alert.alert('Sesión muy corta', 'La sesión duró menos de 30 segundos y no se guardó.');
      setSesionActiva(null);
      setTiempoSegundos(0);
      return;
    }
    await crearSesion(sesionActiva.tareaId, minutos);
    setSesionActiva(null);
    setTiempoSegundos(0);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Flexgoal</Text>
      {objetivoSeleccionado ? (
        <ObjetivoDetalleScreen
          objetivo={objetivoSeleccionado}
          onVolver={() => setObjetivoSeleccionado(null)}
          sesionActiva={sesionActiva}
          tiempoSegundos={tiempoSegundos}
          onIniciarSesion={iniciarSesion}
          onDetenerSesion={detenerSesion}
        />
      ) : metaSeleccionada ? (
        <MetaDetalleScreen
          meta={metaSeleccionada}
          onVolver={() => setMetaSeleccionada(null)}
          onSeleccionarObjetivo={(objetivo) => setObjetivoSeleccionado(objetivo)}
        />
      ) : (
        <>
          <ViewToggle vista={vista} onChangeVista={setVista} />
          {vista === 'ideas' ? (
            <IdeasScreen />
          ) : (
            <MetasScreen
              onSeleccionarMeta={(meta) => setMetaSeleccionada(meta)}
            />
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
        <Text
          style={[styles.tabTexto, vista === 'metas' && styles.tabTextoActivo]}
        >
          Metas
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