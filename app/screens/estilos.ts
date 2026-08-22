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
  sesionInicio: {
    marginTop: 8,
  },
  modoSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modoBoton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modoBotonActivo: {
    backgroundColor: '#1c7ed6',
    borderColor: '#1c7ed6',
  },
  modoBotonTexto: {
    fontSize: 13,
    color: '#666',
  },
  modoBotonTextoActivo: {
    color: '#fff',
    fontWeight: '600',
  },
  pomodoroInputs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  pomodoroInputFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pomodoroLabel: {
    fontSize: 13,
    color: '#666',
  },
  pomodoroInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 48,
    fontSize: 14,
    textAlign: 'center',
  },
  pomodoroUnidad: {
    fontSize: 13,
    color: '#666',
  },
  faseEtiqueta: {
    fontSize: 12,
    color: '#1971c2',
    fontWeight: '600',
    marginBottom: 2,
  },
  formularioDisponibilidad: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  diaSelector: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  diaBoton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  diaBotonActivo: {
    backgroundColor: '#1c7ed6',
    borderColor: '#1c7ed6',
  },
  diaBotonTexto: {
    fontSize: 12,
    color: '#666',
  },
  diaBotonTextoActivo: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pickerGrupo: {
    alignItems: 'center',
  },
  pickerGrupoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pickerGrupoSeparador: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerBoton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pickerBotonTexto: {
    fontSize: 14,
    color: '#1c7ed6',
  },
  pickerValor: {
    fontSize: 22,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  pickerSeparador: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  pickerEtiqueta: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  bloqueDia: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bloqueDiaNombre: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bloqueVacio: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  bloqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingLeft: 12,
  },
  bloqueHorario: {
    fontSize: 15,
  },
  semanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  semanaNavBoton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  semanaNavBotonTexto: {
    fontSize: 14,
    color: '#1c7ed6',
  },
  semanaTitulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  semanaDia: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  semanaDiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  semanaDiaNombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  semanaDiaFecha: {
    fontSize: 13,
    color: '#666',
  },
  semanaDiaCuerpo: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  semanaColumna: {
    flex: 1,
  },
  semanaColumnaTitulo: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  semanaTarea: {
    fontSize: 13,
    marginBottom: 2,
  },
  semanaVacio: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  semanaTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  semanaDiferencia: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  semanaDiferenciaExceso: {
    color: '#e03131',
  },
  semanaDiferenciaFaltante: {
    color: '#2b8a3e',
  },
});