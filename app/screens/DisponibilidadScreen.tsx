import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
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

interface Props {
  db: SQLiteDatabase;
}

const DIAS = [1, 2, 3, 4, 5, 6, 0];

export default function DisponibilidadScreen({ db }: Props) {
  const [bloques, setBloques] = useState<BloqueDisponibilidad[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(1);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarBloques();
  }, []);

  async function cargarBloques() {
    const lista = await listarDisponibilidad(db);
    setBloques(lista);
  }

  async function agregarBloque() {
    setError('');
    const resultado = await agregarBloqueDisponibilidad(
      db,
      diaSeleccionado,
      horaInicio.trim(),
      horaFin.trim()
    );
    if (!resultado.ok) {
      setError(resultado.error!);
      return;
    }
    setHoraInicio('');
    setHoraFin('');
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
        <View style={estilos.horaFila}>
          <TextInput
            style={estilos.horaInput}
            value={horaInicio}
            onChangeText={setHoraInicio}
            placeholder="HH:MM"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={estilos.horaSeparador}>a</Text>
          <TextInput
            style={estilos.horaInput}
            value={horaFin}
            onChangeText={setHoraFin}
            placeholder="HH:MM"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
          />
          <Pressable style={estilos.botonAgregar} onPress={agregarBloque}>
            <Text style={estilos.botonAgregarTexto}>+</Text>
          </Pressable>
        </View>
        {error ? <Text style={estilos.textoError}>{error}</Text> : null}
      </View>
      <FlatList
        data={bloquesPorDia}
        keyExtractor={(item) => String(item.dia)}
        renderItem={({ item }) => (
          <View style={estilos.bloqueDia}>
            <Text style={estilos.bloqueDiaNombre}>{item.nombre}</Text>
            {item.bloques.length === 0 ? (
              <Text style={estilos.bloqueVacio}>Sin disponibilidad</Text>
            ) : (
              item.bloques.map((bloque) => (
                <View key={bloque.id} style={estilos.bloqueItem}>
                  <Text style={estilos.bloqueHorario}>
                    {bloque.hora_inicio} — {bloque.hora_fin}
                  </Text>
                  <Pressable
                    onPress={() => eliminarBloque(bloque.id)}
                    hitSlop={8}
                  >
                    <Text style={estilos.botonBasuraTexto}>🗑️</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      />
    </View>
  );
}
