import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  crearObjetivo,
  listarObjetivosPorMeta,
  type Objetivo,
} from '../db/objetivos';
import {
  actualizarCategoriaMeta,
  actualizarEstadoMeta,
  actualizarFechaObjetivoMeta,
  actualizarPrioridadMeta,
  type Meta,
} from '../db/metas';
import type { Prioridad } from '../db/tareas';
import { esFechaValida } from '../db/tareas';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';

const ESTADOS_META = ['activa', 'pausada', 'completada', 'abandonada'] as const;
const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function etiquetaEstado(estado: string): string {
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

interface Props {
  db: SQLiteDatabase;
  meta: Meta;
  onVolver: () => void;
  onSeleccionarObjetivo: (objetivo: Objetivo) => void;
  textoObjetivo: string;
  setTextoObjetivo: (texto: string) => void;
}

export default function MetaDetalleScreen({
  db,
  meta,
  onVolver,
  onSeleccionarObjetivo,
  textoObjetivo,
  setTextoObjetivo,
}: Props) {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [estado, setEstado] = useState(meta.estado);
  const [textoCategoria, setTextoCategoria] = useState(meta.categoria ?? '');
  const [prioridad, setPrioridad] = useState<Prioridad | null>(meta.prioridad);
  const [textoFechaObjetivo, setTextoFechaObjetivo] = useState(meta.fecha_objetivo ?? '');
  const [errorFechaObjetivo, setErrorFechaObjetivo] = useState('');

  useEffect(() => {
    cargarObjetivos();
  }, []);

  async function cambiarEstado(nuevoEstado: string) {
    await actualizarEstadoMeta(db, meta.id, nuevoEstado);
    setEstado(nuevoEstado);
  }

  async function cambiarPrioridad(nuevaPrioridad: Prioridad) {
    await actualizarPrioridadMeta(db, meta.id, nuevaPrioridad);
    setPrioridad(nuevaPrioridad);
  }

  async function guardarCategoria() {
    const textoCategoriaLimpio = textoCategoria.trim();
    await actualizarCategoriaMeta(
      db,
      meta.id,
      textoCategoriaLimpio === '' ? null : textoCategoriaLimpio
    );
    setTextoCategoria(textoCategoriaLimpio);
  }

  async function guardarFechaObjetivo() {
    const fechaLimpia = textoFechaObjetivo.trim();
    if (fechaLimpia && !esFechaValida(fechaLimpia)) {
      setErrorFechaObjetivo(
        'Fecha inválida. Usa el formato AAAA-MM-DD (ej. 2026-12-31) o déjalo vacío.'
      );
      return;
    }
    setErrorFechaObjetivo('');
    await actualizarFechaObjetivoMeta(
      db,
      meta.id,
      fechaLimpia === '' ? null : fechaLimpia
    );
    setTextoFechaObjetivo(fechaLimpia);
  }

  async function cargarObjetivos() {
    const lista = await listarObjetivosPorMeta(db, meta.id);
    setObjetivos(lista);
  }

  async function guardarObjetivo() {
    const textoLimpio = textoObjetivo.trim();
    if (!textoLimpio) {
      return;
    }
    await crearObjetivo(db, meta.id, textoLimpio);
    setTextoObjetivo('');
    await cargarObjetivos();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={estilos.botonVolver} onPress={onVolver}>
        <Text style={estilos.botonVolverTexto}>← Volver a Metas</Text>
      </Pressable>
      <Text style={estilos.tituloDetalle}>{meta.nombre}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Categoría</Text>
          <TextInput
            style={estilos.input}
            value={textoCategoria}
            onChangeText={setTextoCategoria}
            placeholder="Ej. Salud, Trabajo, Finanzas..."
            placeholderTextColor="#999"
          />
          <Pressable style={[estilos.botonSesion, { marginTop: 0 }]} onPress={guardarCategoria}>
            <Text style={estilos.botonSesionTexto}>Guardar categoría</Text>
          </Pressable>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Prioridad</Text>
          <View style={[estilos.estadoContenedor, { marginBottom: 0 }]}>
            {PRIORIDADES.map((opcion) => {
              const activo = opcion === prioridad;
              return (
                <Pressable
                  key={opcion}
                  style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
                  onPress={() => cambiarPrioridad(opcion)}
                >
                  <Text
                    style={[
                      estilos.estadoBotonTexto,
                      activo && estilos.estadoBotonTextoActivo,
                    ]}
                  >
                    {etiquetaEstado(opcion)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Fecha objetivo</Text>
          <TextInput
            style={estilos.input}
            value={textoFechaObjetivo}
            onChangeText={setTextoFechaObjetivo}
            placeholder="AAAA-MM-DD, ej. 2026-12-31"
            placeholderTextColor="#999"
            keyboardType="numbers-and-punctuation"
          />
          {errorFechaObjetivo ? (
            <Text style={estilos.textoError}>{errorFechaObjetivo}</Text>
          ) : null}
          <Pressable style={[estilos.botonSesion, { marginTop: 0 }]} onPress={guardarFechaObjetivo}>
            <Text style={estilos.botonSesionTexto}>Guardar fecha objetivo</Text>
          </Pressable>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Estado</Text>
          <View style={[estilos.estadoContenedor, { marginBottom: 0 }]}>
            {ESTADOS_META.map((opcion) => {
              const activo = opcion === estado;
              return (
                <Pressable
                  key={opcion}
                  style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
                  onPress={() => cambiarEstado(opcion)}
                >
                  <Text
                    style={[
                      estilos.estadoBotonTexto,
                      activo && estilos.estadoBotonTextoActivo,
                    ]}
                  >
                    {etiquetaEstado(opcion)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estilos.divisor} />

        <Text style={estilos.subtitulo}>Objetivos</Text>
        <View style={estilos.composerFila}>
          <TextInput
            style={[estilos.input, estilos.composerInput]}
            value={textoObjetivo}
            onChangeText={setTextoObjetivo}
            placeholder="Nuevo objetivo..."
            placeholderTextColor="#999"
            multiline
          />
          <Pressable
            style={[estilos.composerBoton, !textoObjetivo.trim() && { opacity: 0.4 }]}
            onPress={guardarObjetivo}
            disabled={!textoObjetivo.trim()}
            accessibilityLabel="Agregar objetivo"
          >
            <Text style={estilos.composerBotonTexto}>+</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 14 }}>
          {objetivos.length === 0 ? (
            <View style={estilos.vacioContenedor}>
              <Text style={estilos.vacioIcono}>🧭</Text>
              <Text style={estilos.vacioTitulo}>
                Esta meta no tiene objetivos todavía
              </Text>
              <Text style={estilos.vacioSubtexto}>¡Agrega el primero arriba!</Text>
            </View>
          ) : (
            objetivos.map((item) => (
              <Pressable
                key={item.id}
                style={estilos.item}
                onPress={() => onSeleccionarObjetivo(item)}
              >
                <View style={estilos.itemContenido}>
                  <Text style={[estilos.itemTexto, { flex: 1 }]}>{item.nombre}</Text>
                  <Text style={{ color: '#ced4da', fontSize: 18 }}>›</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}