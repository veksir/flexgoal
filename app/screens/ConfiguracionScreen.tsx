import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  obtenerClaveAPI,
  guardarClaveAPI,
  borrarClaveAPI,
  listarModelosDisponibles,
} from '../ia/gemini';
import Button from '../components/Button';
import { estilos } from './estilos';
import { color, espacio, radio } from './theme';

interface Props {
  onVolver: () => void;
}

export default function ConfiguracionScreen({ onVolver }: Props) {
  const [clave, setClave] = useState('');
  const [claveGuardada, setClaveGuardada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [modelos, setModelos] = useState<string | null>(null);

  useEffect(() => {
    cargarClave();
  }, []);

  async function cargarClave() {
    const existente = await obtenerClaveAPI();
    if (existente) {
      setClave(existente);
      setClaveGuardada(true);
    }
    setCargando(false);
  }

  async function verificarModelos() {
    const lista = await listarModelosDisponibles();
    setModelos(lista);
  }

  async function guardar() {
    const limpia = clave.trim();
    if (!limpia) {
      Alert.alert('Clave vacía', 'Pegá tu clave de Gemini antes de guardar.');
      return;
    }
    await guardarClaveAPI(limpia);
    setClave(limpia);
    setClaveGuardada(true);
    Alert.alert('Guardado', 'Tu clave de Gemini quedó guardada en este dispositivo.');
  }

  async function borrar() {
    Alert.alert(
      'Borrar clave',
      '¿Seguro que querés borrar la clave de Gemini? Perderás la función de IA.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await borrarClaveAPI();
            setClave('');
            setClaveGuardada(false);
          },
        },
      ]
    );
  }

  if (cargando) {
    return (
      <View style={estilos.vacioContenedor}>
        <Text style={estilos.vacioSubtexto}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable
        style={estilos.botonVolver}
        onPress={onVolver}
        accessibilityLabel="Volver"
        accessibilityRole="button"
      >
        <Text style={estilos.botonVolverTexto}>← Volver</Text>
      </Pressable>

      <Text style={estilos.tituloDetalle}>Configuración de IA</Text>
      <Text style={[estilos.vacioSubtexto, { marginBottom: espacio.xl, marginTop: -espacio.sm }]}>
        Pegá tu clave de API de Gemini (Google AI Studio) para usar la función de IA.
      </Text>

      <View style={estilos.seccion}>
        <Text style={estilos.seccionTitulo}>Clave de Gemini</Text>
        <TextInput
          style={estilos.input}
          value={clave}
          onChangeText={setClave}
          placeholder="Pegá tu clave aquí..."
          placeholderTextColor={color.textoDeshabilitado}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <View style={{ flexDirection: 'row', gap: espacio.sm }}>
          <Button
            title="Guardar"
            onPress={guardar}
            style={{ flex: 1, marginBottom: 0 }}
          />

          {claveGuardada && (
            <Button
              title="Borrar"
              onPress={borrar}
              variant="danger"
              style={{ flex: 1, marginBottom: 0 }}
            />
          )}
        </View>
      </View>

      {claveGuardada && (
        <View style={[estilos.seccion, { backgroundColor: color.exito + '10' }]}>
          <Text style={[estilos.seccionTitulo, { color: color.exito }]}>Estado</Text>
          <Text style={estilos.itemTexto}>
            ✅ Clave configurada — la función de IA está disponible
          </Text>
          <Button
            title="Verificar modelos disponibles"
            onPress={verificarModelos}
            variant="secondary"
            style={{ marginTop: espacio.sm, alignSelf: 'flex-start' }}
          />
          {modelos && (
            <Text style={[estilos.vacioSubtexto, { marginTop: espacio.sm }]}>
              Modelos con flash/pro: {modelos}
            </Text>
          )}
        </View>
      )}

      <View style={estilos.seccion}>
        <Text style={estilos.seccionTitulo}>¿Cómo obtener una clave?</Text>
        <Text style={[estilos.itemTexto, { lineHeight: 22 }]}>
          1. Entrá a Google AI Studio (aistudio.google.com){'\n'}
          2. Creá una clave de API (es gratis){'\n'}
          3. Pegala aquí y guardala
        </Text>
        <Text style={[estilos.vacioSubtexto, { marginTop: espacio.sm }]}>
          La clave se guarda solo en este dispositivo, nunca se envía a ningún lado.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
