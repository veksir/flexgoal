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
import { color } from './theme';

interface Props {
  db: SQLiteDatabase;
}

// Abreviatura de un día de la semana (0=Domingo … 6=Sábado, igual que
// Date.getDay() y que db/disponibilidad.ts). Estándar de calendario en
// español: L M X J V S D.
const ABREVIATURA_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    cargarSemana();
  }, [fechaInicio]);

  async function cargarSemana() {
    const resultado = await calcularCargaSemana(db, fechaInicio);
    setDias(resultado);
    // Si el día antes seleccionado ya no pertenece a la semana visible
    // (cambiamos de semana), volvemos a elegir un día por defecto.
    const siguePerteneciendo = resultado.some((d) => d.fecha === fechaSeleccionada);
    if (!siguePerteneciendo) {
      const diaHoyEnSemana = resultado.find((d) => d.fecha === hoy);
      setFechaSeleccionada(diaHoyEnSemana ? diaHoyEnSemana.fecha : (resultado[0]?.fecha ?? null));
    }
  }

  const diaActivo = dias.find((d) => d.fecha === fechaSeleccionada) ?? null;

  const maxMinutos = Math.max(
    1,
    ...dias.map((d) => Math.max(d.minutosPlanificados, d.minutosDisponibles))
  );

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
        <View style={estilos.semanaBarrasFila}>
          {dias.map((dia) => {
            const esHoy = dia.fecha === hoy;
            const seleccionado = dia.fecha === fechaSeleccionada;
            const alturaPorcentaje = Math.round(
              (Math.max(dia.minutosPlanificados, 1) / maxMinutos) * 100
            );
            return (
              <Pressable
                key={dia.fecha}
                style={estilos.semanaBarraColumna}
                onPress={() => setFechaSeleccionada(dia.fecha)}
                accessibilityLabel={`Ver ${dia.nombreDia} ${dia.fecha}`}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
              >
                <View
                  style={[
                    estilos.semanaBarraFondo,
                    esHoy && estilos.semanaBarraFondoHoy,
                    seleccionado && !esHoy && { borderColor: color.bordeFuerte },
                  ]}
                >
                  {dia.minutosPlanificados > 0 ? (
                    <View
                      style={[
                        estilos.semanaBarraRelleno,
                        esHoy && estilos.semanaBarraRellenoHoy,
                        dia.estaSobrecargado && estilos.semanaBarraRellenoSobrecarga,
                        { height: `${alturaPorcentaje}%` },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    estilos.semanaBarraEtiqueta,
                    esHoy && estilos.semanaBarraEtiquetaHoy,
                  ]}
                >
                  {ABREVIATURA_DIA[dia.diaSemana]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={estilos.semanaLeyendaFila}>
          <View style={estilos.semanaLeyendaItem}>
            <View style={[estilos.semanaLeyendaPunto, { backgroundColor: color.primario, opacity: 0.4 }]} />
            <Text style={estilos.semanaLeyendaTexto}>Carga normal</Text>
          </View>
          <View style={estilos.semanaLeyendaItem}>
            <View style={[estilos.semanaLeyendaPunto, { backgroundColor: color.advertencia, opacity: 0.55 }]} />
            <Text style={estilos.semanaLeyendaTexto}>Sobrecargado</Text>
          </View>
        </View>

        {diaActivo ? (
          <View style={{ marginTop: 20 }}>
            <View style={estilos.semanaDiaHeader}>
              <Text style={estilos.semanaDiaNombre}>{diaActivo.nombreDia}</Text>
              <Text style={estilos.semanaDiaFecha}>{diaActivo.fecha}</Text>
            </View>

            <Text style={estilos.semanaTotal}>
              {formatearDuracion(diaActivo.minutosPlanificados)} planificados de{' '}
              {formatearDuracion(diaActivo.minutosDisponibles)} disponibles
            </Text>
            <Text style={estilos.semanaDiferencia}>
              {formatearDiferencia(diaActivo.diferencia)}
            </Text>
            {diaActivo.estaSobrecargado ? (
              <View style={estilos.avisoSobrecarga}>
                <Text style={estilos.avisoSobrecargaIcono}>⚠️</Text>
                <Text style={estilos.avisoSobrecargaTexto}>Este día está sobrecargado</Text>
              </View>
            ) : null}

            <Text style={[estilos.semanaColumnaTitulo, { marginTop: 12 }]}>Tareas</Text>
            {diaActivo.tareas.length === 0 ? (
              <Text style={estilos.semanaVacio}>Sin tareas planificadas</Text>
            ) : (
              diaActivo.tareas.map((t) => (
                <View key={t.id} style={estilos.item}>
                  <Text style={estilos.semanaTarea}>
                    {t.nombre}
                    {t.duracion_estimada_minutos == null ? ' (sin estimar)' : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
