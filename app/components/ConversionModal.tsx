import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import { estilos } from '../screens/estilos';
import { color, espacio, radio } from '../screens/theme';
import Button from '../components/Button';

interface Props {
  visible: boolean;
  ideaTexto: string;
  onCancel: () => void;
  onConvertir: (plantillaId?: string) => void;
  onGuardar: (propuesta: PropuestaIA) => void;
  isSaving: boolean;
}

type Paso =
  | 'seleccion'
  | 'configuracion'
  | 'plantillas'
  | 'cargando'
  | 'revision'
  | 'corrigiendo';

export default function ConversionModal({
  visible,
  ideaTexto,
  onCancel,
  onConvertir,
  onGuardar,
  isSaving,
}: Props) {
  const [paso, setPaso] = useState<Paso>('seleccion');
  const [propuestaIA, setPropuestaIA] = useState<PropuestaIA | null>(null);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const [configuracionIA, setConfiguracionIA] = useState<ConfiguracionIA>({
    cantidadObjetivos: 4,
    tareasPorObjetivo: 3,
  });
  const [feedback, setFeedback] = useState('');
  const [objetivosAceptados, setObjetivosAceptados] = useState<Record<number, boolean>>({});
  const [tareasAceptadas, setTareasAceptadas] = useState<Record<string, boolean>>({});

  function reiniciar() {
    setPaso('seleccion');
    setPropuestaIA(null);
    setErrorIA(null);
    setFeedback('');
    setObjetivosAceptados({});
    setTareasAceptadas({});
  }

  function handleCancel() {
    reiniciar();
    onCancel();
  }

  function handleSeleccion(tipo: 'ia' | 'plantillas') {
    if (tipo === 'ia') {
      setPaso('configuracion');
      setErrorIA(null);
    } else {
      setPaso('plantillas');
    }
  }

  async function generarConIA() {
    setPaso('cargando');
    setErrorIA(null);
    try {
      const clave = await obtenerClaveAPI();
      if (!clave) throw new ErrorClaveNoConfigurada();
      const propuesta = await generarEstructuraDesdeIdea(ideaTexto, configuracionIA);
      setPropuestaIA(propuesta);
      inicializarAceptados(propuesta);
      setPaso('revision');
    } catch (error) {
      manejarErrorIA(error);
      setPaso('configuracion');
    }
  }

  async function pedirCorreccion() {
    if (!propuestaIA || !feedback.trim()) return;
    setPaso('corrigiendo');
    setErrorIA(null);
    try {
      const clave = await obtenerClaveAPI();
      if (!clave) throw new ErrorClaveNoConfigurada();
      const propuesta = await corregirEstructura(
        ideaTexto,
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
      setErrorIA('No hay clave de Gemini configurada. Configurala en el icono ⚙️ o usá Plantillas.');
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

  function handleGuardar() {
    const aceptada = propuestaAceptada();
    if (aceptada.objetivos.length === 0) return;
    onGuardar(aceptada);
    reiniciar();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
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
                style={[styles.boton, { marginBottom: espacio.sm, borderColor: color.primario }]}
                onPress={() => handleSeleccion('ia')}
                accessibilityLabel="Automático con IA"
                accessibilityRole="button"
              >
                <Text style={[styles.botonTexto, { color: color.primario }]}>
                  ✨ Automático (IA)
                </Text>
                <Text style={styles.botonSubtexto}>
                  La IA propone objetivos y tareas según tu idea
                </Text>
              </Pressable>
              <Pressable
                style={[styles.boton, { marginBottom: espacio.sm }]}
                onPress={() => handleSeleccion('plantillas')}
                accessibilityLabel="Plantillas"
                accessibilityRole="button"
              >
                <Text style={styles.botonTexto}>📋 Plantillas</Text>
                <Text style={styles.botonSubtexto}>
                  Elegí una categoría predefinida
                </Text>
              </Pressable>
              <Pressable
                style={[styles.botonCancelar, { marginTop: espacio.xs }]}
                onPress={handleCancel}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
              >
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
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
                        styles.botonNumerico,
                        configuracionIA.cantidadObjetivos === num && styles.botonNumericoActivo,
                      ]}
                      onPress={() => setConfiguracionIA({ ...configuracionIA, cantidadObjetivos: num })}
                    >
                      <Text style={[
                        styles.botonNumericoTexto,
                        configuracionIA.cantidadObjetivos === num && styles.botonNumericoTextoActivo,
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
                        styles.botonNumerico,
                        configuracionIA.tareasPorObjetivo === num && styles.botonNumericoActivo,
                      ]}
                      onPress={() => setConfiguracionIA({ ...configuracionIA, tareasPorObjetivo: num })}
                    >
                      <Text style={[
                        styles.botonNumericoTexto,
                        configuracionIA.tareasPorObjetivo === num && styles.botonNumericoTextoActivo,
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
              <Button
                title="✨ Generar con IA"
                onPress={generarConIA}
                style={{ marginBottom: espacio.sm }}
              />
              <Pressable
                style={[styles.botonCancelar, { marginTop: espacio.xs }]}
                onPress={() => setPaso('seleccion')}
              >
                <Text style={styles.botonCancelarTexto}>← Volver</Text>
              </Pressable>
            </>
          )}

          {paso === 'plantillas' && (
            <>
              <Text style={[estilos.subtitulo, { marginBottom: espacio.base }]}>
                Elegí una plantilla
              </Text>
              <Pressable
                style={[styles.boton, { marginBottom: espacio.sm }]}
                onPress={() => { reiniciar(); onConvertir(); }}
                accessibilityLabel="Empezar vacío"
                accessibilityRole="button"
              >
                <Text style={styles.botonTexto}>Empezar vacío</Text>
                <Text style={styles.botonSubtexto}>Solo crear la meta, sin objetivos</Text>
              </Pressable>
              {PLANTILLAS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.boton, { marginBottom: espacio.sm }]}
                  onPress={() => { reiniciar(); onConvertir(p.id); }}
                  accessibilityLabel={`Plantilla: ${p.nombre}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.botonTexto}>{p.nombre}</Text>
                  <Text style={styles.botonSubtexto}>
                    {p.objetivos.length} objetivos ·{' '}
                    {p.objetivos.reduce((acc, o) => acc + o.tareas.length, 0)} tareas
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.botonCancelar, { marginTop: espacio.xs }]}
                onPress={() => setPaso('seleccion')}
              >
                <Text style={styles.botonCancelarTexto}>← Volver</Text>
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
                <Button
                  title="🔄 Pedir corrección"
                  onPress={pedirCorreccion}
                  disabled={!feedback.trim()}
                  style={{ marginBottom: espacio.sm }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: espacio.sm, marginTop: espacio.sm }}>
                <Button
                  title="Guardar"
                  onPress={handleGuardar}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancelar"
                  onPress={handleCancel}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
