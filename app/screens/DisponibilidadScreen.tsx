import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  agregarBloqueDisponibilidad,
  listarDisponibilidad,
  eliminarBloqueDisponibilidad,
  nombreDia,
  type BloqueDisponibilidad,
} from '../db/disponibilidad';
import { estilos } from './estilos';
import Button from '../components/Button';

interface Props {
  db: SQLiteDatabase;
}

const DIAS = [1, 2, 3, 4, 5, 6, 0];
const MINUTOS = [0, 15, 30, 45];

function formatearNumero(n: number): string {
  return String(n).padStart(2, '0');
}

function PickerHora({
  hora,
  onChange,
}: {
  hora: { h: number; m: number };
  onChange: (h: number, m: number) => void;
}) {
  return (
    <View style={estilos.pickerContainer}>
      <View style={estilos.pickerColumn}>
        <Pressable
          style={estilos.pickerBoton}
          onPress={() => onChange((hora.h + 1) % 24, hora.m)}
          accessibilityLabel="Subir hora"
          accessibilityRole="button"
        >
          <Text style={estilos.pickerBotonTexto}>▲</Text>
        </Pressable>
        <Text style={estilos.pickerValor}>{formatearNumero(hora.h)}</Text>
        <Pressable
          style={estilos.pickerBoton}
          onPress={() => onChange((hora.h + 23) % 24, hora.m)}
          accessibilityLabel="Bajar hora"
          accessibilityRole="button"
        >
          <Text style={estilos.pickerBotonTexto}>▼</Text>
        </Pressable>
        <Text style={estilos.pickerEtiqueta}>hora</Text>
      </View>
      <Text style={estilos.pickerSeparador}>:</Text>
      <View style={estilos.pickerColumn}>
        <Pressable
          style={estilos.pickerBoton}
          onPress={() => {
            const idx = MINUTOS.indexOf(hora.m);
            const siguiente = (idx + 1) % MINUTOS.length;
            onChange(hora.h, MINUTOS[siguiente]);
          }}
          accessibilityLabel="Subir minutos"
          accessibilityRole="button"
        >
          <Text style={estilos.pickerBotonTexto}>▲</Text>
        </Pressable>
        <Text style={estilos.pickerValor}>{formatearNumero(hora.m)}</Text>
        <Pressable
          style={estilos.pickerBoton}
          onPress={() => {
            const idx = MINUTOS.indexOf(hora.m);
            const anterior = (idx + MINUTOS.length - 1) % MINUTOS.length;
            onChange(hora.h, MINUTOS[anterior]);
          }}
          accessibilityLabel="Bajar minutos"
          accessibilityRole="button"
        >
          <Text style={estilos.pickerBotonTexto}>▼</Text>
        </Pressable>
        <Text style={estilos.pickerEtiqueta}>min</Text>
      </View>
    </View>
  );
}

export default function DisponibilidadScreen({ db }: Props) {
  const [bloques, setBloques] = useState<BloqueDisponibilidad[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(1);
  const [inicio, setInicio] = useState({ h: 9, m: 0 });
  const [fin, setFin] = useState({ h: 12, m: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    cargarBloques();
  }, []);

  async function cargarBloques() {
    const lista = await listarDisponibilidad(db);
    setBloques(lista);
  }

  function horaAString(h: number, m: number): string {
    return `${formatearNumero(h)}:${formatearNumero(m)}`;
  }

  async function agregarBloque() {
    setError('');
    const resultado = await agregarBloqueDisponibilidad(
      db,
      diaSeleccionado,
      horaAString(inicio.h, inicio.m),
      horaAString(fin.h, fin.m)
    );
    if (!resultado.ok) {
      setError(resultado.error!);
      return;
    }
    await cargarBloques();
  }

  async function eliminarBloque(id: number) {
    Alert.alert('Eliminar bloque', '¿Seguro que quieres eliminar este bloque?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarBloqueDisponibilidad(db, id);
          await cargarBloques();
        },
      },
    ]);
  }

  const bloquesPorDia = DIAS.map((dia) => ({
    dia,
    nombre: nombreDia(dia),
    bloques: bloques.filter((b) => b.dia_semana === dia),
  }));

  return (
    <View style={{ flex: 1 }}>
      <Text style={estilos.tituloDetalle}>Disponibilidad semanal</Text>
      <View style={estilos.formularioDisponibilidad}>
        <View style={estilos.diaSelector}>
          {DIAS.map((dia) => (
            <Pressable
              key={dia}
              style={[
                estilos.diaBoton,
                diaSeleccionado === dia && estilos.diaBotonActivo,
              ]}
              onPress={() => setDiaSeleccionado(dia)}
              accessibilityLabel={nombreDia(dia)}
              accessibilityRole="button"
              accessibilityState={{ selected: diaSeleccionado === dia }}
            >
              <Text
                style={[
                  estilos.diaBotonTexto,
                  diaSeleccionado === dia && estilos.diaBotonTextoActivo,
                ]}
              >
                {nombreDia(dia).slice(0, 2)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={estilos.pickerFila}>
          <View style={estilos.pickerGrupo}>
            <Text style={estilos.pickerGrupoLabel}>Inicio</Text>
            <PickerHora hora={inicio} onChange={(h, m) => setInicio({ h, m })} />
          </View>
          <Text style={estilos.pickerGrupoSeparador}>a</Text>
          <View style={estilos.pickerGrupo}>
            <Text style={estilos.pickerGrupoLabel}>Fin</Text>
            <PickerHora hora={fin} onChange={(h, m) => setFin({ h, m })} />
          </View>
        </View>
        {error ? <Text style={estilos.textoError}>{error}</Text> : null}
        <Button
          title="Agregar bloque"
          onPress={agregarBloque}
          accessibilityLabel="Agregar bloque de disponibilidad"
        />
      </View>
      <Text style={estilos.subtitulo}>Bloques por día</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {bloquesPorDia.map((dia) => (
          <View key={dia.dia} style={estilos.bloqueDia}>
            <Text style={estilos.bloqueDiaNombre}>{dia.nombre}</Text>
            {dia.bloques.length === 0 ? (
              <Text style={estilos.bloqueVacio}>Sin disponibilidad</Text>
            ) : (
              dia.bloques.map((bloque) => (
                <View key={bloque.id} style={estilos.bloqueItem}>
                  <Text style={estilos.bloqueHorario}>
                    {bloque.hora_inicio} — {bloque.hora_fin}
                  </Text>
                  <Pressable
                    onPress={() => eliminarBloque(bloque.id)}
                    hitSlop={8}
                    accessibilityLabel={`Eliminar bloque ${bloque.hora_inicio} a ${bloque.hora_fin}`}
                    accessibilityRole="button"
                  >
                    <Text style={estilos.botonBasuraTexto}>🗑️</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
