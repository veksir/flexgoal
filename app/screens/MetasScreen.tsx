import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';

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

  return (
    <FlatList
      data={metas}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => {
        const resumen = resumenProgreso(progresos[item.id]);
        const inactiva = item.estado !== 'activa';
        return (
          <Pressable
            style={estilos.item}
            onPress={() => onSeleccionarMeta(item)}
          >
            <Text
              style={[estilos.itemTexto, inactiva && estilos.itemTextoInactivo]}
            >
              {item.nombre}
              {item.categoria ? ` · ${item.categoria}` : ''}
              {item.prioridad ? ` · ${etiquetaPrioridad(item.prioridad)}` : ''}
            </Text>
            <Text style={estilos.itemFecha}>
              Estado: {etiquetaEstado(item.estado)}
            </Text>
            {resumen ? (
              <Text style={[estilos.sesionTotal, inactiva && estilos.itemTextoInactivo]}>
                {resumen}
              </Text>
            ) : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <Text style={estilos.vacio}>
          Aún no tienes metas. Convierte una idea en meta para empezar.
        </Text>
      }
    />
  );
}