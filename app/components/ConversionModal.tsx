import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function ConversionModal({
  visible,
  ideaTexto,
  onCancel,
  onConvertir,
  onGuardar,
  isSaving,
}: Props) {
  const [paso, setPaso] = useState<'seleccion' | 'configuracion' | 'plantillas'>('seleccion');
  const [configuracionIA, setConfiguracionIA] = useState<ConfiguracionIA>({
    cantidadObjetivos: 4,
    tareasPorObjetivo: 3,
  });

  function handleSeleccion(tipo: 'ia' | 'plantillas') {
    if (tipo === 'ia') {
      onConvertir();
    } else {
      setPaso('plantillas');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={estilos.modalFondo}>
        <View style={[estilos.modalContenido, { maxHeight: '92%', height: '92%', padding: espacio.base }]}>

          {paso === 'seleccion' && (
            <>
              <Text style={[estilos.subtitulo, { marginBottom: espacio.base }]}>
                ¿Cómo querés organizar tu idea?
              </Text>
              <Pressable
                style={[styles.boton, { marginBottom: espacio.sm, borderColor: color.primario }]}
                onPress={() => handleSeleccion('ia')}
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
              >
                <Text style={styles.botonTexto}>📋 Plantillas</Text>
                <Text style={styles.botonSubtexto}>
                  Elegí una categoría predefinida
                </Text>
              </Pressable>
              <Pressable
                style={[styles.botonCancelar, { marginTop: espacio.xs }]}
                onPress={onCancel}
              >
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
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
                onPress={() => onConvertir()}
              >
                <Text style={styles.botonTexto}>Empezar vacío</Text>
                <Text style={styles.botonSubtexto}>Solo crear la meta, sin objetivos</Text>
              </Pressable>
              {PLANTILLAS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.boton, { marginBottom: espacio.sm }]}
                  onPress={() => onConvertir(p.id)}
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
});
