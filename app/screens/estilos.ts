import { StyleSheet } from 'react-native';

export const estilos = StyleSheet.create({
  tituloDetalle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  estadoEtiqueta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  estadoContenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  estadoBoton: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  estadoBotonActivo: {
    backgroundColor: '#1c7ed6',
    borderColor: '#1c7ed6',
  },
  estadoBotonTexto: {
    fontSize: 13,
    color: '#666',
  },
  estadoBotonTextoActivo: {
    color: '#fff',
    fontWeight: '600',
  },
  botonVolver: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  botonVolverTexto: {
    fontSize: 16,
    color: '#1c7ed6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    fontSize: 16,
    marginBottom: 12,
  },
  boton: {
    backgroundColor: '#1c7ed6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTextoWrapper: {
    flex: 1,
  },
  tareaContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tareaCheck: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
    color: '#666',
  },
  tareaCheckCompletado: {
    color: '#2b8a3e',
  },
  tareaCompletada: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  sesionTotal: {
    fontSize: 13,
    color: '#1971c2',
    marginTop: 4,
    fontWeight: '600',
  },
  sesionHistorialEnlace: {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  sesionHistorialItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sesionHistorialTexto: {
    fontSize: 16,
    color: '#333',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContenido: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxHeight: '70%',
  },
  sesionContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: '#e7f5ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cronometro: {
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    color: '#1971c2',
  },
  botonSesion: {
    alignSelf: 'flex-start',
    backgroundColor: '#1971c2',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  botonSesionTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  botonDetener: {
    backgroundColor: '#e03131',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  botonDetenerTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  itemTexto: {
    fontSize: 16,
  },
  itemTextoInactivo: {
    color: '#888',
  },
  itemFecha: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  botonSecundario: {
    backgroundColor: '#2b8a3e',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botonSecundarioTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  botonBasura: {
    padding: 8,
  },
  botonBasuraTexto: {
    fontSize: 18,
  },
  vacio: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 32,
  },
  textoError: {
    color: '#e03131',
    fontSize: 14,
    marginBottom: 12,
  },
});