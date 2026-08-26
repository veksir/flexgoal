import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { crearIdea, eliminarIdea, listarIdeas, type Idea } from '../db/ideas';
import { convertirIdeaEnMeta } from '../db/conversiones';
import { PLANTILLAS } from '../db/plantillasMeta';
import {
  generarEstructuraDesdeIdea,
  corregirEstructura,
  obtenerClaveAPI,
  ErrorClaveNoConfigurada,
  ErrorSinConexion,
  type PropuestaIA,
  type PropuestaObjetivo,
  type ConfiguracionIA,
} from '../ia/gemini';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';
import { color, espacio, radio } from './theme';

interface Props {
  db: SQLiteDatabase;
  texto: string;
  setTexto: (texto: string) => void;
}

export default function IdeasScreen({ db, texto, setTexto }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaAConvertir, setIdeaAConvertir] = useState<Idea | null>(null);
  const [paso, setPaso] = useState<'seleccion' | 'configuracion' | 'plantillas' | 'cargando' | 'revision' | 'corrigiendo'>('seleccion');
  const [propuestaIA, setPropuestaIA] = useState<PropuestaIA | null>(null);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const [configuracionIA, setConfiguracionIA] = useState<ConfiguracionIA>({
    cantidadObjetivos: 4,
    tareasPorObjetivo: 3,
  });
  const [feedback, setFeedback] = useState('');
  const [objetivosAceptados, setObjetivosAceptados] = useState<Record<number, boolean>>({});
  const [tareasAceptadas, setTareasAceptadas] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    cargarIdeas();
  }, []);

  async function cargarIdeas() {
    const lista = await listarIdeas(db);
    setIdeas(lista);
  }

  async function guardarIdea() {
    const textoLimpio = texto.trim();
    if (!textoLimpio || isSaving) return;
    setIsSaving(true);
    try {
      await crearIdea(db, textoLimpio);
      setTexto('');
      await cargarIdeas();
    } finally {
      setIsSaving(false);
    }
  }

  async function convertir(plantillaId?: string) {
    if (!ideaAConvertir) return;
    await convertirIdeaEnMeta(db, ideaAConvertir, plantillaId);
    setIdeaAConvertir(null);
    setPaso('seleccion');
    await cargarIdeas();
  }

  async function iniciarIA() {
    if (!ideaAConvertir) return;
    setPaso('configuracion');
    setErrorIA(null);
  }

  async function generarConIA() {
    if (!ideaAConvertir) return;
    setPaso('cargando');
    setErrorIA(null);

    try {
      const clave = await obtenerClaveAPI();
      if (!clave) throw new ErrorClaveNoConfigurada();
      const propuesta = await generarEstructuraDesdeIdea(ideaAConvertir.texto, configuracionIA);
      setPropuestaIA(propuesta);
      inicializarAceptados(propuesta);
      setPaso('revision');
    } catch (error) {
      manejarErrorIA(error);
      setPaso('configuracion');
    }
  }

  async function pedirCorreccion() {
    if (!ideaAConvertir || !propuestaIA || !feedback.trim()) return;
    setPaso('corrigiendo');
    setErrorIA(null);

    try {
      const clave = await obtenerClaveAPI();
      if (!clave) throw new ErrorClaveNoConfigurada();
      const propuesta = await corregirEstructura(
        ideaAConvertir.texto,
        propuestaAceptada(),
        feedback.trim(),
        configuracionIA
      );
      setPropuestaIA(propuesta);
      inicializarAceptados(propuesta);
      setFeedback('');
      setPaso('revision');
    } catch (error) {
      manejarErrorIA(error);
      setPaso('revision');
    }
  }

  function manejarErrorIA(error: unknown) {
    if (error instanceof ErrorClaveNoConfigurada) {
      setErrorIA('No hay clave de Gemini configurada. Configurala en ⚙️ o usá Plantillas.');
    } else if (error instanceof ErrorSinConexion) {
      setErrorIA('No hay conexión a internet. Usá Plantillas en su lugar.');
    } else if (error instanceof Error) {
      setErrorIA(error.message);
    } else {
      setErrorIA('Error desconocido. Probá con Plantillas.');
    }
  }

  function inicializarAceptados(propuesta: PropuestaIA) {
    const nuevosObjetivos: Record<number, boolean> = {};
    const nuevasTareas: Record<string, boolean> = {};
    propuesta.objetivos.forEach((obj, i) => {
      nuevosObjetivos[i] = true;
      obj.tareas.forEach((_, j) => {
        nuevasTareas[`${i}-${j}`] = true;
      });
    });
    setObjetivosAceptados(nuevosObjetivos);
    setTareasAceptadas(nuevasTareas);
  }

  function toggleObjetivo(index: number) {
    setObjetivosAceptados((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function toggleTarea(objIndex: number, tareaIndex: number) {
    const key = `${objIndex}-${tareaIndex}`;
    setTareasAceptadas((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function propuestaAceptada(): PropuestaIA {
    if (!propuestaIA) return { objetivos: [] };
    const objetivos: PropuestaObjetivo[] = [];
    propuestaIA.objetivos.forEach((obj, i) => {
      if (!objetivosAceptados[i]) return;
      const tareas = obj.tareas.filter((_, j) => tareasAceptadas[`${i}-${j}`]);
      if (tareas.length > 0) {
        objetivos.push({ nombre: obj.nombre, tareas });
      }
    });
    return { objetivos };
  }

  function agregarObjetivo() {
    if (!propuestaIA) return;
    const newIndex = propuestaIA.objetivos.length;
    setPropuestaIA({
      objetivos: [
        ...propuestaIA.objetivos,
        { nombre: '', tareas: [{ nombre: '' }] },
      ],
    });
    setObjetivosAceptados((prev) => ({ ...prev, [newIndex]: true }));
  }

  function eliminarObjetivo(index: number) {
    if (!propuestaIA) return;
    const nuevos = propuestaIA.objetivos.filter((_, i) => i !== index);
    if (nuevos.length === 0) return;
    setPropuestaIA({ objetivos: nuevos });
    const nuevosAceptados: Record<number, boolean> = {};
    const nuevasTareasAceptadas: Record<string, boolean> = {};
    nuevos.forEach((obj, i) => {
      nuevosAceptados[i] = objetivosAceptados[i] ?? true;
      obj.tareas.forEach((_, j) => {
        nuevasTareasAceptadas[`${i}-${j}`] = tareasAceptadas[`${i}-${j}`] ?? true;
      });
    });
    setObjetivosAceptados(nuevosAceptados);
    setTareasAceptadas(nuevasTareasAceptadas);
  }

  function actualizarObjetivo(index: number, nombre: string) {
    if (!propuestaIA) return;
    const nuevos = [...propuestaIA.objetivos];
    nuevos[index] = { ...nuevos[index], nombre };
    setPropuestaIA({ objetivos: nuevos });
  }

  function agregarTarea(objetivoIndex: number) {
    if (!propuestaIA) return;
    const nuevos = [...propuestaIA.objetivos];
    const obj = nuevos[objetivoIndex];
    const newTareaIndex = obj.tareas.length;
    nuevos[objetivoIndex] = {
      ...obj,
      tareas: [...obj.tareas, { nombre: '' }],
    };
    setPropuestaIA({ objetivos: nuevos });
    setTareasAceptadas((prev) => ({ ...prev, [`${objetivoIndex}-${newTareaIndex}`]: true }));
  }

  function eliminarTarea(objetivoIndex: number, tareaIndex: number) {
    if (!propuestaIA) return;
    const nuevos = [...propuestaIA.objetivos];
    const obj = nuevos[objetivoIndex];
    if (obj.tareas.length <= 1) return;
    nuevos[objetivoIndex] = {
      ...obj,
      tareas: obj.tareas.filter((_, i) => i !== tareaIndex),
    };
    setPropuestaIA({ objetivos: nuevos });
    const nuevasTareasAceptadas: Record<string, boolean> = {};
    nuevos[objetivoIndex].tareas.forEach((_, j) => {
      nuevasTareasAceptadas[`${objetivoIndex}-${j}`] = tareasAceptadas[`${objetivoIndex}-${j}`] ?? true;
    });
    setTareasAceptadas((prev) => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach((k) => {
        if (k.startsWith(`${objetivoIndex}-`)) delete cleaned[k];
      });
      return { ...cleaned, ...nuevasTareasAceptadas };
    });
  }

  function actualizarTarea(objetivoIndex: number, tareaIndex: number, nombre: string) {
    if (!propuestaIA) return;
    const nuevos = [...propuestaIA.objetivos];
    const obj = nuevos[objetivoIndex];
    const tareas = [...obj.tareas];
    tareas[tareaIndex] = { ...tareas[tareaIndex], nombre };
    nuevos[objetivoIndex] = { ...obj, tareas };
    setPropuestaIA({ objetivos: nuevos });
  }

  function actualizarDuracionTarea(objetivoIndex: number, tareaIndex: number, duracion: string) {
    if (!propuestaIA) return;
    const nuevos = [...propuestaIA.objetivos];
    const obj = nuevos[objetivoIndex];
    const tareas = [...obj.tareas];
    const num = parseInt(duracion, 10);
    tareas[tareaIndex] = {
      ...tareas[tareaIndex],
      duracion_estimada_minutos: isNaN(num) || num <= 0 ? undefined : num,
    };
    nuevos[objetivoIndex] = { ...obj, tareas };
    setPropuestaIA({ objetivos: nuevos });
  }

  async function guardarPropuestaIA() {
    if (!ideaAConvertir || !propuestaIA || isSaving) return;
    const aceptada = propuestaAceptada();
    if (aceptada.objetivos.length === 0) {
      Alert.alert('Sin elementos', 'No seleccionaste ningún objetivo o tarea para guardar.');
      return;
    }
    setIsSaving(true);
    try {
      await convertirIdeaEnMeta(db, ideaAConvertir, undefined, aceptada);
      setIdeaAConvertir(null);
      setPropuestaIA(null);
      setFeedback('');
      setPaso('seleccion');
      await cargarIdeas();
    } finally {
      setIsSaving(false);
    }
  }

  function cancelarConversion() {
    setIdeaAConvertir(null);
    setPropuestaIA(null);
    setFeedback('');
    setPaso('seleccion');
    setErrorIA(null);
  }

  function confirmarEliminacion(idea: Idea) {
    Alert.alert('Eliminar idea', '¿Seguro que quieres eliminar esta idea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarIdea(db, idea.id);
          await cargarIdeas();
        },
      },
    ]);
  }

  function contarAceptados(): { obj: number; tareas: number } {
    if (!propuestaIA) return { obj: 0, tareas: 0 };
    let objCount = 0;
    let tareasCount = 0;
    propuestaIA.objetivos.forEach((obj, i) => {
      if (objetivosAceptados[i]) {
        objCount++;
        obj.tareas.forEach((_, j) => {
          if (tareasAceptadas[`${i}-${j}`]) tareasCount++;
        });
      }
    });
    return { obj: objCount, tareas: tareasCount };
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={estilos.composerFila}>
        <TextInput
          style={[estilos.input, estilos.composerInput]}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe una idea..."
          placeholderTextColor="#999"
          multiline
        />
        <Pressable
          style={[estilos.composerBoton, (!texto.trim() || isSaving) && { opacity: 0.4 }]}
          onPress={guardarIdea}
          disabled={!texto.trim() || isSaving}
          accessibilityLabel="Guardar idea"
        >
          <Text style={estilos.composerBotonTexto}>➤</Text>
        </Pressable>
      </View>
      <FlatList
        data={ideas}
        keyExtractor={(item) => String(item.id)}
        style={{ marginTop: 14 }}
        renderItem={({ item }) => (
          <Pressable
            style={estilos.item}
            onLongPress={() => confirmarEliminacion(item)}
            delayLongPress={500}
          >
            <View style={estilos.itemTextoWrapper}>
              <Text style={estilos.itemTexto}>{item.texto}</Text>
            </View>
            <View style={[estilos.itemContenido, { marginTop: 10, justifyContent: 'flex-end' }]}>
              <Pressable
                style={estilos.botonSecundario}
                onPress={() => setIdeaAConvertir(item)}
              >
                <Text style={estilos.botonSecundarioTexto}>Convertir en meta</Text>
              </Pressable>
              <Pressable
                style={estilos.botonBasura}
                onPress={() => confirmarEliminacion(item)}
                hitSlop={8}
              >
                <Text style={estilos.botonBasuraTexto}>🗑️</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={estilos.vacioContenedor}>
            <Text style={estilos.vacioIcono}>💡</Text>
            <Text style={estilos.vacioTitulo}>Aún no tienes ideas guardadas</Text>
            <Text style={estilos.vacioSubtexto}>¡Escribe la primera arriba!</Text>
          </View>
        }
        contentContainerStyle={ideas.length === 0 ? { flexGrow: 1 } : { paddingBottom: 8 }}
      />

      <Modal
        visible={ideaAConvertir !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelarConversion}
      >
        <View style={estilos.modalFondo}>
          <View style={[estilos.modalContenido, { maxHeight: '92%', height: '92%', padding: espacio.base }]}>

            {paso === 'seleccion' && (
              <>
                <Text style={[estilos.subtitulo, { marginBottom: espacio.base }]}>
                  ¿Cómo querés organizar tu idea?
                </Text>
                {errorIA && (
                  <View style={[estilos.sugerenciaContenedor, { marginBottom: espacio.base }]}>
                    <Text style={[estilos.textoAviso, { flex: 1 }]}>{errorIA}</Text>
                  </View>
                )}
                <Pressable
                  style={[plantillaBoton, { marginBottom: espacio.sm, borderColor: color.primario }]}
                  onPress={iniciarIA}
                >
                  <Text style={[plantillaBotonTexto, { color: color.primario }]}>
                    ✨ Automático (IA)
                  </Text>
                  <Text style={plantillaBotonSubtexto}>
                    La IA propone objetivos y tareas según tu idea
                  </Text>
                </Pressable>
                <Pressable
                  style={[plantillaBoton, { marginBottom: espacio.sm }]}
                  onPress={() => setPaso('plantillas')}
                >
                  <Text style={plantillaBotonTexto}>📋 Plantillas</Text>
                  <Text style={plantillaBotonSubtexto}>
                    Elegí una categoría predefinida
                  </Text>
                </Pressable>
                <Pressable
                  style={[plantillaBotonCancelar, { marginTop: espacio.xs }]}
                  onPress={cancelarConversion}
                >
                  <Text style={plantillaBotonCancelarTexto}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {paso === 'configuracion' && (
              <>
                <Text style={[estilos.subtitulo, { marginBottom: espacio.base }]}>
                  Configurá la estructura
                </Text>
                {errorIA && (
                  <View style={[estilos.sugerenciaContenedor, { marginBottom: espacio.base }]}>
                    <Text style={[estilos.textoAviso, { flex: 1 }]}>{errorIA}</Text>
                  </View>
                )}
                <View style={{ marginBottom: espacio.base }}>
                  <Text style={{ marginBottom: espacio.sm, fontWeight: '600', color: color.textoPrimario }}>
                    Objetivos: {configuracionIA.cantidadObjetivos}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: espacio.sm }}>
                    {[2, 3, 4, 5, 6].map((num) => (
                      <Pressable
                        key={num}
                        style={[
                          configuracionStyles.botonNumerico,
                          configuracionIA.cantidadObjetivos === num && configuracionStyles.botonNumericoActivo,
                        ]}
                        onPress={() => setConfiguracionIA({ ...configuracionIA, cantidadObjetivos: num })}
                      >
                        <Text style={[
                          configuracionStyles.botonNumericoTexto,
                          configuracionIA.cantidadObjetivos === num && configuracionStyles.botonNumericoTextoActivo,
                        ]}>
                          {num}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={{ marginBottom: espacio.base }}>
                  <Text style={{ marginBottom: espacio.sm, fontWeight: '600', color: color.textoPrimario }}>
                    Tareas por objetivo: {configuracionIA.tareasPorObjetivo}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: espacio.sm }}>
                    {[2, 3, 4, 5].map((num) => (
                      <Pressable
                        key={num}
                        style={[
                          configuracionStyles.botonNumerico,
                          configuracionIA.tareasPorObjetivo === num && configuracionStyles.botonNumericoActivo,
                        ]}
                        onPress={() => setConfiguracionIA({ ...configuracionIA, tareasPorObjetivo: num })}
                      >
                        <Text style={[
                          configuracionStyles.botonNumericoTexto,
                          configuracionIA.tareasPorObjetivo === num && configuracionStyles.botonNumericoTextoActivo,
                        ]}>
                          {num}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Text style={{ marginBottom: espacio.base, color: color.textoTerciario }}>
                  Total: {configuracionIA.cantidadObjetivos} × {configuracionIA.tareasPorObjetivo} = {configuracionIA.cantidadObjetivos * configuracionIA.tareasPorObjetivo} tareas
                </Text>
                <Pressable
                  style={[estilos.boton, { marginBottom: espacio.sm }]}
                  onPress={generarConIA}
                >
                  <Text style={estilos.botonTexto}>✨ Generar con IA</Text>
                </Pressable>
                <Pressable
                  style={[plantillaBotonCancelar, { marginTop: espacio.xs }]}
                  onPress={() => setPaso('seleccion')}
                >
                  <Text style={plantillaBotonCancelarTexto}>← Volver</Text>
                </Pressable>
              </>
            )}

            {paso === 'plantillas' && (
              <>
                <Text style={[estilos.subtitulo, { marginBottom: espacio.base }]}>
                  Elegí una plantilla
                </Text>
                <Pressable
                  style={[plantillaBoton, { marginBottom: espacio.sm }]}
                  onPress={() => convertir()}
                >
                  <Text style={plantillaBotonTexto}>Empezar vacío</Text>
                  <Text style={plantillaBotonSubtexto}>Solo crear la meta, sin objetivos</Text>
                </Pressable>
                {PLANTILLAS.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[plantillaBoton, { marginBottom: espacio.sm }]}
                    onPress={() => convertir(p.id)}
                  >
                    <Text style={plantillaBotonTexto}>{p.nombre}</Text>
                    <Text style={plantillaBotonSubtexto}>
                      {p.objetivos.length} objetivos ·{' '}
                      {p.objetivos.reduce((acc, o) => acc + o.tareas.length, 0)} tareas
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[plantillaBotonCancelar, { marginTop: espacio.xs }]}
                  onPress={() => setPaso('seleccion')}
                >
                  <Text style={plantillaBotonCancelarTexto}>← Volver</Text>
                </Pressable>
              </>
            )}

            {(paso === 'cargando' || paso === 'corrigiendo') && (
              <View style={{ alignItems: 'center', paddingVertical: espacio.xxl }}>
                <ActivityIndicator size="large" color={color.primario} />
                <Text style={[estilos.vacioSubtexto, { marginTop: espacio.base }]}>
                  {paso === 'corrigiendo' ? 'La IA está corrigiendo...' : 'La IA está pensando en tu idea...'}
                </Text>
              </View>
            )}

            {paso === 'revision' && propuestaIA && (
              <View style={{ flex: 1 }}>
                <Text style={[estilos.subtitulo, { marginBottom: espacio.sm }]}>
                  Revisá la propuesta
                </Text>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: espacio.base }} showsVerticalScrollIndicator={true}>
                  {propuestaIA.objetivos.map((obj, objIndex) => (
                    <View key={objIndex} style={[estilos.seccion, { marginBottom: espacio.sm, opacity: objetivosAceptados[objIndex] ? 1 : 0.5, backgroundColor: color.fondoSutil, borderRadius: radio.md, padding: espacio.sm }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espacio.sm }}>
                        <Pressable
                          onPress={() => toggleObjetivo(objIndex)}
                          hitSlop={8}
                        >
                          <Text style={{ fontSize: 20 }}>
                            {objetivosAceptados[objIndex] ? '✅' : '⬜'}
                          </Text>
                        </Pressable>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: color.primario, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          OBJETIVO {objIndex + 1}
                        </Text>
                      </View>
                      <TextInput
                        style={[estilos.input, { marginBottom: 0, marginTop: espacio.xs, fontWeight: '600', fontSize: 15 }]}
                        value={obj.nombre}
                        onChangeText={(t) => actualizarObjetivo(objIndex, t)}
                        placeholder="Nombre del objetivo..."
                        placeholderTextColor={color.textoDeshabilitado}
                        multiline
                      />
                      {propuestaIA.objetivos.length > 2 && (
                        <Pressable onPress={() => eliminarObjetivo(objIndex)} hitSlop={8} style={{ position: 'absolute', right: espacio.sm, top: espacio.sm }}>
                          <Text style={{ fontSize: 16, color: color.textoTerciario }}>🗑️</Text>
                        </Pressable>
                      )}

                      {obj.tareas.map((tarea, tareaIndex) => (
                        <View
                          key={tareaIndex}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: espacio.xs, marginTop: espacio.sm, marginLeft: espacio.lg, backgroundColor: color.fondo, borderRadius: radio.sm, padding: espacio.xs, paddingLeft: espacio.sm }}
                        >
                          <Pressable
                            onPress={() => toggleTarea(objIndex, tareaIndex)}
                            hitSlop={8}
                          >
                            <Text style={{ fontSize: 16 }}>
                              {tareasAceptadas[`${objIndex}-${tareaIndex}`] ? '✅' : '⬜'}
                            </Text>
                          </Pressable>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: color.textoTerciario, marginRight: espacio.xs }}>
                            T{tareaIndex + 1}
                          </Text>
                          <TextInput
                            style={[estilos.input, { flex: 1, marginBottom: 0, fontSize: 13, minHeight: 36, backgroundColor: 'transparent' }]}
                            value={tarea.nombre}
                            onChangeText={(t) => actualizarTarea(objIndex, tareaIndex, t)}
                            placeholder="Tarea..."
                            placeholderTextColor={color.textoDeshabilitado}
                            multiline
                          />
                          <TextInput
                            style={[estilos.input, { width: 50, marginBottom: 0, fontSize: 12, textAlign: 'center', backgroundColor: 'transparent' }]}
                            value={tarea.duracion_estimada_minutos?.toString() ?? ''}
                            onChangeText={(t) => actualizarDuracionTarea(objIndex, tareaIndex, t)}
                            placeholder="min"
                            placeholderTextColor={color.textoDeshabilitado}
                            keyboardType="numeric"
                          />
                          {obj.tareas.length > 1 && (
                            <Pressable onPress={() => eliminarTarea(objIndex, tareaIndex)} hitSlop={8}>
                              <Text style={{ fontSize: 13, color: color.textoTerciario }}>✕</Text>
                            </Pressable>
                          )}
                        </View>
                      ))}

                      {obj.tareas.length < configuracionIA.tareasPorObjetivo + 2 && (
                        <Pressable onPress={() => agregarTarea(objIndex)} style={{ marginTop: espacio.sm, marginLeft: espacio.lg }}>
                          <Text style={{ color: color.primario, fontSize: 12, fontWeight: '600' }}>
                            + Agregar tarea
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}

                  {propuestaIA.objetivos.length < 8 && (
                    <Pressable onPress={agregarObjetivo} style={{ paddingVertical: espacio.sm, alignItems: 'center' }}>
                      <Text style={{ color: color.primario, fontSize: 14, fontWeight: '600' }}>
                        + Agregar objetivo
                      </Text>
                    </Pressable>
                  )}
                </ScrollView>

                <View style={{ borderTopWidth: 1, borderTopColor: color.borde, paddingTop: espacio.sm, marginTop: espacio.sm }}>
                  <Text style={{ marginBottom: espacio.xs, fontWeight: '600', color: color.textoPrimario, fontSize: 14 }}>
                    Pedir corrección a la IA
                  </Text>
                  <TextInput
                    style={[estilos.input, { marginBottom: espacio.sm, fontSize: 13 }]}
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder='Ej: "Demasiado difícil", "No me gusta el objetivo 2"...'
                    placeholderTextColor={color.textoDeshabilitado}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', gap: espacio.sm }}>
                    <Pressable
                      style={[estilos.boton, { flex: 1, marginBottom: 0, opacity: feedback.trim() ? 1 : 0.5 }]}
                      onPress={pedirCorreccion}
                      disabled={!feedback.trim()}
                    >
                      <Text style={estilos.botonTexto}>🔄 Pedir corrección</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: espacio.sm, marginTop: espacio.sm }}>
                  <Pressable
                    style={[estilos.boton, { flex: 1, marginBottom: 0, opacity: isSaving ? 0.5 : 1 }]}
                    onPress={guardarPropuestaIA}
                    disabled={isSaving}
                  >
                    <Text style={estilos.botonTexto}>Guardar</Text>
                  </Pressable>
                  <Pressable
                    style={[plantillaBotonCancelar, { flex: 1 }]}
                    onPress={cancelarConversion}
                  >
                    <Text style={plantillaBotonCancelarTexto}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

import { StyleSheet } from 'react-native';

const plantillaEstilos = StyleSheet.create({
  boton: {
    borderWidth: 1.5,
    borderColor: color.bordeFuerte,
    borderRadius: radio.md,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    backgroundColor: color.fondo,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: color.textoPrimario,
  },
  botonSubtexto: {
    fontSize: 13,
    color: color.textoTerciario,
    marginTop: 2,
  },
  botonCancelar: {
    borderWidth: 1.5,
    borderColor: color.borde,
    borderRadius: radio.md,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    alignItems: 'center',
  },
  botonCancelarTexto: {
    fontSize: 14,
    color: color.textoTerciario,
    fontWeight: '600',
  },
});

const plantillaBoton = plantillaEstilos.boton;
const plantillaBotonTexto = plantillaEstilos.botonTexto;
const plantillaBotonSubtexto = plantillaEstilos.botonSubtexto;
const plantillaBotonCancelar = plantillaEstilos.botonCancelar;
const plantillaBotonCancelarTexto = plantillaEstilos.botonCancelarTexto;

const configuracionStyles = StyleSheet.create({
  botonNumerico: {
    width: 44,
    height: 44,
    borderRadius: radio.md,
    borderWidth: 1.5,
    borderColor: color.borde,
    backgroundColor: color.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonNumericoActivo: {
    backgroundColor: color.primario,
    borderColor: color.primario,
  },
  botonNumericoTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: color.textoPrimario,
  },
  botonNumericoTextoActivo: {
    color: '#fff',
  },
});
