import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  calcularCargaSemana,
  inicioDeSemana,
  type DiaCarga,
} from '../db/carga';
import { formatearDuracion, formatearDiferencia } from '../db/tareas';
import { estilos } from './estilos';

interface Props {
  db: SQLiteDatabase;
}

function semanaAnterior(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  d.setDate(d.getDate() - 7);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function semanaSiguiente(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  d.setDate(d.getDate() + 7);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatearRangoSemana(inicio: string): string {
  const [anio, mes, dia] = inicio.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  const fin = new Date(d);
  fin.setDate(d.getDate() + 6);
  const mInicio = String(d.getMonth() + 1).padStart(2, '0');
  const dInicio = String(d.getDate()).padStart(2, '0');
  const mFin = String(fin.getMonth() + 1).padStart(2, '0');
  const dFin = String(fin.getDate()).padStart(2, '0');
  return `${dInicio}/${mInicio} — ${dFin}/${mFin}`;
}

export default function SemanaScreen({ db }: Props) {
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState(() => inicioDeSemana(hoy));
  const [dias, setDias] = useState<DiaCarga[]>([]);

  useEffect(() => {
    cargarSemana();
  }, [fechaInicio]);

  async function cargarSemana() {
    const resultado = await calcularCargaSemana(db, fechaInicio);
    setDias(resultado);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.semanaHeader}>
        <Pressable
          style={estilos.semanaNavBoton}
          onPress={() => setFechaInicio(semanaAnterior(fechaInicio))}
          accessibilityLabel="Semana anterior"
          accessibilityRole="button"
        >
          <Text style={estilos.semanaNavBotonTexto}>← Anterior</Text>
        </Pressable>
        <Text style={estilos.semanaTitulo}>
          {formatearRangoSemana(fechaInicio)}
        </Text>
        <Pressable
          style={estilos.semanaNavBoton}
          onPress={() => setFechaInicio(semanaSiguiente(fechaInicio))}
          accessibilityLabel="Semana siguiente"
          accessibilityRole="button"
        >
          <Text style={estilos.semanaNavBotonTexto}>Siguiente →</Text>
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {dias.map((dia) => (
          <View key={dia.fecha} style={estilos.semanaDia}>
            <View style={estilos.semanaDiaHeader}>
              <Text style={estilos.semanaDiaNombre}>
                {dia.nombreDia}
              </Text>
              <Text style={estilos.semanaDiaFecha}>{dia.fecha}</Text>
            </View>
            <View style={estilos.semanaDiaCuerpo}>
              <View style={estilos.semanaColumna}>
                <Text style={estilos.semanaColumnaTitulo}>Tareas</Text>
                {dia.tareas.length === 0 ? (
                  <Text style={estilos.semanaVacio}>Sin tareas</Text>
                ) : (
                  dia.tareas.map((t) => (
                    <View key={t.id} style={estilos.item}>
                      <Text style={estilos.semanaTarea}>
                        {t.nombre}
                        {t.duracion_estimada_minutos == null
                          ? ' (sin estimar)'
                          : ''}
                      </Text>
                    </View>
                  ))
                )}
              </View>
              <View style={estilos.semanaColumna}>
                <Text style={estilos.semanaColumnaTitulo}>Disponible</Text>
                {dia.minutosDisponibles > 0 ? (
                  <Text style={estilos.semanaTotal}>
                    {formatearDuracion(dia.minutosDisponibles)}
                  </Text>
                ) : (
                  <Text style={estilos.semanaVacio}>Sin disponibilidad</Text>
                )}
              </View>
              <View style={estilos.semanaColumna}>
                <Text style={estilos.semanaColumnaTitulo}>Balance</Text>
                <Text style={estilos.semanaTotal}>
                  {formatearDuracion(dia.minutosPlanificados)} /{' '}
                  {formatearDuracion(dia.minutosDisponibles)}
                </Text>
                <Text style={estilos.semanaDiferencia}>
                  {formatearDiferencia(dia.diferencia)}
                </Text>
                {dia.estaSobrecargado ? (
                  <Text style={estilos.textoAviso}>Sobrecargado</Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
