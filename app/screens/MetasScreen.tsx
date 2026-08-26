import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import {
  listarMetas,
  progresoPorMeta,
  type Meta,
  type ProgresoMeta,
} from '../db/metas';
import {
  calcularDiferencia,
  formatearDuracion,
  formatearDiferencia,
  type Prioridad,
} from '../db/tareas';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';

function etiquetaEstado(estado: string): string {
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function etiquetaPrioridad(prioridad: Prioridad): string {
  return prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
}

interface Props {
  db: SQLiteDatabase;
  onSeleccionarMeta: (meta: Meta) => void;
}

export default function MetasScreen({ db, onSeleccionarMeta }: Props) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [progresos, setProgresos] = useState<Record<number, ProgresoMeta>>({});

  useEffect(() => {
    cargarMetas();
  }, []);

  async function cargarMetas() {
    const lista = await listarMetas(db);
    setMetas(lista);
    const nuevosProgresos: Record<number, ProgresoMeta> = {};
    for (const meta of lista) {
      nuevosProgresos[meta.id] = await progresoPorMeta(db, meta.id);
    }
    setProgresos(nuevosProgresos);
  }

  function resumenProgreso(p: ProgresoMeta | undefined): string | null {
    if (!p) {
      return null;
    }
    const diferencia = calcularDiferencia(p.estimadoTotal, p.realTotal);
    if (p.estimadoTotal != null && p.realTotal > 0 && diferencia != null) {
      return `Estimado: ${formatearDuracion(p.estimadoTotal)} · Real: ${formatearDuracion(
        p.realTotal
      )} · ${formatearDiferencia(diferencia)}`;
    }
    if (p.estimadoTotal != null) {
      return `Estimado: ${formatearDuracion(p.estimadoTotal)}`;
    }
    if (p.realTotal > 0) {
      return `Real: ${formatearDuracion(p.realTotal)}`;
    }
    return null;
  }

  function estiloPunto(prioridad: Prioridad) {
    if (prioridad === 'alta') return estilos.insigniaPuntoAlta;
    if (prioridad === 'media') return estilos.insigniaPuntoMedia;
    return estilos.insigniaPuntoBaja;
  }

  return (
    <FlatList
      data={metas}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => {
        const resumen = resumenProgreso(progresos[item.id]);
        const p = progresos[item.id];
        const inactiva = item.estado !== 'activa';
        const proporcion =
          p && p.estimadoTotal ? Math.min(1, p.realTotal / p.estimadoTotal) : null;
        const excedido = p && p.estimadoTotal != null && p.realTotal > p.estimadoTotal;
        return (
          <Pressable
            style={estilos.item}
            onPress={() => onSeleccionarMeta(item)}
            accessibilityLabel={`Meta: ${item.nombre}`}
            accessibilityRole="button"
          >
            <View style={estilos.seccionEncabezadoFila}>
              <Text
                style={[
                  estilos.itemTexto,
                  { fontWeight: '600', flex: 1 },
                  inactiva && estilos.itemTextoInactivo,
                ]}
                numberOfLines={2}
              >
                {item.nombre}
              </Text>
              <Text style={estilos.itemFecha}>{etiquetaEstado(item.estado)}</Text>
            </View>
            <View style={[estilos.itemContenido, { marginTop: 6, justifyContent: 'flex-start' }]}>
              {item.prioridad ? (
                <View style={estilos.insignia}>
                  <View style={[estilos.insigniaPunto, estiloPunto(item.prioridad)]} />
                  <Text style={estilos.insigniaTexto}>
                    {etiquetaPrioridad(item.prioridad)}
                  </Text>
                </View>
              ) : null}
              {item.categoria ? (
                <View style={estilos.insignia}>
                  <Text style={estilos.insigniaTexto}>{item.categoria}</Text>
                </View>
              ) : null}
              {item.fecha_objetivo ? (
                <View style={estilos.insignia}>
                  <Text style={estilos.insigniaTexto}>🗓 {item.fecha_objetivo}</Text>
                </View>
              ) : null}
            </View>
            {proporcion != null ? (
              <View style={estilos.progresoFila}>
                <View style={estilos.progresoFondo}>
                  <View
                    style={[
                      estilos.progresoRelleno,
                      excedido && estilos.progresoRellenoExceso,
                      { width: `${Math.round(proporcion * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}
            {resumen ? (
              <Text style={[estilos.sesionTotal, inactiva && estilos.itemTextoInactivo]}>
                {resumen}
              </Text>
            ) : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={estilos.vacioContenedor}>
          <Text style={estilos.vacioIcono}>🎯</Text>
          <Text style={estilos.vacioTitulo}>Aún no tienes metas</Text>
          <Text style={estilos.vacioSubtexto}>
            Convierte una idea en meta desde la pestaña Ideas para empezar.
          </Text>
        </View>
      }
      contentContainerStyle={metas.length === 0 ? { flexGrow: 1 } : { paddingBottom: 8 }}
    />
  );
}