import { StyleSheet } from 'react-native';
import { color, espacio, radio, sombraTarjeta, sombraSuave, sombraFlotante, toqueMinimo } from './theme';

export const estilos = StyleSheet.create({
  // ---------------------------------------------------------------------
  // Encabezados de pantalla / detalle
  // ---------------------------------------------------------------------
  tituloDetalle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: espacio.md,
    color: color.textoPrimario,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: espacio.md,
    color: color.textoPrimario,
  },

  // ---------------------------------------------------------------------
  // Selectores tipo "pill" (estado, prioridad, día, modo)
  // ---------------------------------------------------------------------
  estadoEtiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: color.textoTerciario,
    marginBottom: espacio.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  estadoContenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacio.sm,
    marginBottom: espacio.base,
  },
  estadoBoton: {
    borderWidth: 1.5,
    borderColor: color.bordeFuerte,
    borderRadius: radio.completo,
    paddingVertical: espacio.sm,
    paddingHorizontal: espacio.md,
    backgroundColor: color.fondo,
    minHeight: 36,
    justifyContent: 'center',
  },
  estadoBotonActivo: {
    backgroundColor: color.primario,
    borderColor: color.primario,
  },
  estadoBotonTexto: {
    fontSize: 13,
    color: color.textoTerciario,
    fontWeight: '500',
  },
  estadoBotonTextoActivo: {
    color: color.fondo,
    fontWeight: '700',
  },

  // ---------------------------------------------------------------------
  // Navegación (volver, encabezado de sección)
  // ---------------------------------------------------------------------
  botonVolver: {
    alignSelf: 'flex-start',
    marginBottom: espacio.sm,
    paddingVertical: espacio.xs,
    paddingRight: espacio.sm,
    minHeight: toqueMinimo,
    justifyContent: 'center',
  },
  botonVolverTexto: {
    fontSize: 16,
    color: color.primario,
    fontWeight: '600',
  },

  // ---------------------------------------------------------------------
  // Campos de formulario
  // ---------------------------------------------------------------------
  input: {
    borderWidth: 1.5,
    borderColor: color.bordeInput,
    backgroundColor: color.fondoSutil,
    borderRadius: radio.md,
    padding: espacio.md,
    minHeight: 50,
    fontSize: 16,
    color: color.textoPrimario,
    marginBottom: espacio.md,
  },

  // ---------------------------------------------------------------------
  // Botones
  // ---------------------------------------------------------------------
  boton: {
    backgroundColor: color.primario,
    borderRadius: radio.md,
    paddingVertical: espacio.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacio.base,
    minHeight: toqueMinimo,
    ...sombraSuave,
  },
  botonTexto: {
    color: color.fondo,
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundario: {
    backgroundColor: color.exito,
    borderRadius: radio.completo,
    paddingVertical: espacio.sm,
    paddingHorizontal: espacio.md,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonSecundarioTexto: {
    color: color.fondo,
    fontSize: 13,
    fontWeight: '700',
  },
  botonBasura: {
    padding: espacio.sm,
    minWidth: toqueMinimo - 8,
    minHeight: toqueMinimo - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radio.completo,
  },
  botonBasuraTexto: {
    fontSize: 18,
  },

  // ---------------------------------------------------------------------
  // Tarjetas de lista (ideas, metas, objetivos, tareas, bloques...)
  // ---------------------------------------------------------------------
  item: {
    backgroundColor: color.fondo,
    borderRadius: radio.lg,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    marginBottom: espacio.sm,
    borderWidth: 1,
    borderColor: color.borde,
    ...sombraTarjeta,
  },
  itemContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.md,
  },
  itemTextoWrapper: {
    flex: 1,
  },
  itemTexto: {
    fontSize: 16,
    color: color.textoPrimario,
    lineHeight: 21,
  },
  itemTextoInactivo: {
    color: color.textoInactivo,
  },
  itemFecha: {
    fontSize: 12.5,
    color: color.textoInactivo,
    marginTop: espacio.xs,
  },

  // ---------------------------------------------------------------------
  // Tareas (checkbox + estado)
  // ---------------------------------------------------------------------
  tareaContenido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
  },
  tareaCheck: {
    fontSize: 22,
    width: 28,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    color: color.bordeFuerte,
  },
  tareaCheckbox: {
    padding: espacio.xs,
    marginRight: espacio.xs,
  },
  tareaCheckCompletado: {
    color: color.exito,
  },
  tareaCompletada: {
    textDecorationLine: 'line-through',
    color: color.textoInactivo,
  },

  // ---------------------------------------------------------------------
  // Sesión de tiempo (cronómetro / pomodoro)
  // ---------------------------------------------------------------------
  sesionTotal: {
    fontSize: 13,
    color: color.primarioOscuro,
    marginTop: espacio.xs,
    fontWeight: '600',
  },
  sesionHistorialEnlace: {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  sesionHistorialItem: {
    paddingVertical: espacio.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: color.borde,
  },
  sesionHistorialTexto: {
    fontSize: 16,
    color: color.textoSecundario,
  },
  sesionContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: espacio.sm + 2,
    backgroundColor: color.primarioSuave,
    borderRadius: radio.md,
    paddingVertical: espacio.sm + 2,
    paddingHorizontal: espacio.md,
  },
  cronometro: {
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    color: color.primarioOscuro,
  },
  botonSesion: {
    alignSelf: 'flex-start',
    backgroundColor: color.primarioOscuro,
    borderRadius: radio.completo,
    paddingVertical: espacio.sm,
    paddingHorizontal: espacio.md,
    marginTop: espacio.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  botonSesionTexto: {
    color: color.fondo,
    fontSize: 13,
    fontWeight: '700',
  },
  botonDetener: {
    backgroundColor: color.peligro,
    borderRadius: radio.completo,
    paddingVertical: espacio.sm,
    paddingHorizontal: espacio.md + 2,
    minHeight: 36,
    justifyContent: 'center',
  },
  botonDetenerTexto: {
    color: color.fondo,
    fontSize: 13,
    fontWeight: '700',
  },
  sesionInicio: {
    marginTop: espacio.sm,
    paddingTop: espacio.sm + 2,
    borderTopWidth: 1,
    borderTopColor: color.borde,
  },

  // ---------------------------------------------------------------------
  // Modal
  // ---------------------------------------------------------------------
  modalFondo: {
    flex: 1,
    backgroundColor: color.overlay,
    justifyContent: 'center',
    padding: espacio.xl,
  },
  modalContenido: {
    backgroundColor: color.fondo,
    borderRadius: radio.xl,
    padding: espacio.xl,
    maxHeight: '70%',
    ...sombraFlotante,
  },

  // ---------------------------------------------------------------------
  // Estados vacíos / errores / avisos
  // ---------------------------------------------------------------------
  vacio: {
    textAlign: 'center',
    color: color.textoTerciario,
    fontSize: 16,
    marginTop: espacio.xxl,
  },
  vacioContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espacio.xxl,
    paddingHorizontal: espacio.xl,
    gap: espacio.xs,
  },
  vacioIcono: {
    fontSize: 34,
    marginBottom: espacio.sm,
    opacity: 0.7,
  },
  vacioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: color.textoSecundario,
    textAlign: 'center',
  },
  vacioSubtexto: {
    fontSize: 13.5,
    color: color.textoDeshabilitado,
    textAlign: 'center',
    marginTop: 2,
  },
  textoError: {
    color: color.peligro,
    fontSize: 14,
    marginBottom: espacio.md,
  },
  textoAviso: {
    color: color.advertencia,
    fontSize: 14,
    marginBottom: espacio.md,
  },
  sugerenciaContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.sm,
    marginBottom: espacio.md,
    backgroundColor: color.advertenciaSuave,
    borderRadius: radio.md,
    padding: espacio.sm + 2,
  },
  botonSugerencia: {
    backgroundColor: color.advertencia,
    borderRadius: radio.completo,
    paddingVertical: espacio.xs + 2,
    paddingHorizontal: espacio.sm + 2,
  },
  botonSugerenciaTexto: {
    color: color.fondo,
    fontSize: 12,
    fontWeight: '700',
  },

  // ---------------------------------------------------------------------
  // Selector de modo de sesión (libre / pomodoro)
  // ---------------------------------------------------------------------
  modoSelector: {
    flexDirection: 'row',
    gap: espacio.sm,
    marginBottom: espacio.sm,
    backgroundColor: color.fondoTab,
    borderRadius: radio.md,
    padding: 4,
  },
  modoBoton: {
    flex: 1,
    borderRadius: radio.sm,
    paddingVertical: espacio.sm,
    alignItems: 'center',
  },
  modoBotonActivo: {
    backgroundColor: color.fondo,
    ...sombraSuave,
  },
  modoBotonTexto: {
    fontSize: 13,
    color: color.textoTerciario,
    fontWeight: '600',
  },
  modoBotonTextoActivo: {
    color: color.primario,
    fontWeight: '700',
  },
  pomodoroInputs: {
    flexDirection: 'row',
    gap: espacio.base,
    marginBottom: espacio.sm,
  },
  pomodoroInputFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
  },
  pomodoroLabel: {
    fontSize: 13,
    color: color.textoTerciario,
  },
  pomodoroInput: {
    borderWidth: 1.5,
    borderColor: color.bordeInput,
    borderRadius: radio.sm,
    paddingHorizontal: espacio.sm,
    paddingVertical: espacio.xs,
    width: 50,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: color.fondoSutil,
  },
  pomodoroUnidad: {
    fontSize: 13,
    color: color.textoTerciario,
  },
  faseEtiqueta: {
    fontSize: 12,
    color: color.primarioOscuro,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ---------------------------------------------------------------------
  // Disponibilidad
  // ---------------------------------------------------------------------
  formularioDisponibilidad: {
    marginBottom: espacio.base,
    padding: espacio.base,
    borderRadius: radio.lg,
    backgroundColor: color.fondoSutil,
    borderWidth: 1,
    borderColor: color.borde,
  },
  diaSelector: {
    flexDirection: 'row',
    gap: espacio.xs,
    marginBottom: espacio.md,
  },
  diaBoton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: color.bordeFuerte,
    borderRadius: radio.sm,
    paddingVertical: espacio.sm,
    alignItems: 'center',
    backgroundColor: color.fondo,
  },
  diaBotonActivo: {
    backgroundColor: color.primario,
    borderColor: color.primario,
  },
  diaBotonTexto: {
    fontSize: 12,
    color: color.textoTerciario,
    fontWeight: '600',
  },
  diaBotonTextoActivo: {
    color: color.fondo,
    fontWeight: '700',
  },
  pickerFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.md,
    marginBottom: espacio.md,
  },
  pickerGrupo: {
    alignItems: 'center',
  },
  pickerGrupoLabel: {
    fontSize: 12,
    color: color.textoTerciario,
    fontWeight: '600',
    marginBottom: espacio.xs,
  },
  pickerGrupoSeparador: {
    fontSize: 18,
    color: color.textoTerciario,
    marginTop: espacio.base,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: color.fondo,
    borderRadius: radio.md,
    paddingHorizontal: espacio.xs,
    borderWidth: 1,
    borderColor: color.borde,
  },
  pickerColumn: {
    alignItems: 'center',
    paddingVertical: espacio.xs,
  },
  pickerBoton: {
    minHeight: toqueMinimo,
    justifyContent: 'center',
    paddingHorizontal: espacio.sm,
  },
  pickerBotonTexto: {
    fontSize: 14,
    color: color.primario,
  },
  pickerValor: {
    fontSize: 22,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
    color: color.textoPrimario,
  },
  pickerSeparador: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: espacio.base,
    color: color.textoTerciario,
  },
  pickerEtiqueta: {
    fontSize: 10,
    color: color.textoDeshabilitado,
    marginTop: 2,
  },
  bloqueDia: {
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    marginBottom: espacio.sm,
    backgroundColor: color.fondo,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: color.borde,
    ...sombraTarjeta,
  },
  bloqueDiaNombre: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: espacio.xs + 2,
    color: color.textoPrimario,
  },
  bloqueVacio: {
    fontSize: 14,
    color: color.textoDeshabilitado,
    fontStyle: 'italic',
  },
  bloqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: espacio.sm,
    paddingLeft: espacio.md,
    borderTopWidth: 1,
    borderTopColor: color.borde,
    marginTop: espacio.xs,
  },
  bloqueHorario: {
    fontSize: 15,
    color: color.textoSecundario,
    fontVariant: ['tabular-nums'],
  },

  // ---------------------------------------------------------------------
  // Vista Semana
  // ---------------------------------------------------------------------
  semanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacio.base,
    backgroundColor: color.fondoSutil,
    borderRadius: radio.md,
    paddingVertical: espacio.xs,
    paddingHorizontal: espacio.xs,
  },
  semanaNavBoton: {
    paddingVertical: espacio.sm,
    paddingHorizontal: espacio.md,
    minHeight: toqueMinimo - 8,
    justifyContent: 'center',
  },
  semanaNavBotonTexto: {
    fontSize: 14,
    color: color.primario,
    fontWeight: '600',
  },
  semanaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: color.textoPrimario,
  },
  semanaDia: {
    marginBottom: espacio.md,
    backgroundColor: color.fondo,
    borderWidth: 1,
    borderColor: color.borde,
    borderRadius: radio.lg,
    overflow: 'hidden',
    ...sombraTarjeta,
  },
  semanaDiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: color.fondoSutil,
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm + 2,
  },
  semanaDiaNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: color.textoPrimario,
  },
  semanaDiaFecha: {
    fontSize: 13,
    color: color.textoTerciario,
  },
  semanaDiaCuerpo: {
    flexDirection: 'row',
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm + 2,
    gap: espacio.md,
  },
  semanaColumna: {
    flex: 1,
  },
  semanaColumnaTitulo: {
    fontSize: 11,
    color: color.textoDeshabilitado,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: espacio.xs + 2,
  },
  semanaTarea: {
    fontSize: 13,
    marginBottom: 2,
    color: color.textoSecundario,
  },
  semanaVacio: {
    fontSize: 12,
    color: color.textoDeshabilitado,
    fontStyle: 'italic',
  },
  semanaTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: color.textoPrimario,
  },
  semanaDiferencia: {
    fontSize: 13,
    color: color.textoTerciario,
    marginTop: 2,
  },
  semanaDiferenciaExceso: {
    color: color.peligro,
  },
  semanaDiferenciaFaltante: {
    color: color.exito,
  },

  // ---------------------------------------------------------------------
  // Encabezado general de pantalla (usado por App.tsx)
  // ---------------------------------------------------------------------
  screenHeader: {
    paddingHorizontal: espacio.base,
    paddingTop: espacio.sm,
    paddingBottom: espacio.md,
  },
  screenHeaderFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenHeaderTitulo: {
    fontSize: 26,
    fontWeight: '800',
    color: color.textoPrimario,
    letterSpacing: -0.3,
  },
  screenHeaderSubtitulo: {
    fontSize: 13.5,
    color: color.textoTerciario,
    marginTop: 2,
  },
  screenHeaderBadge: {
    backgroundColor: color.primarioSuave,
    borderRadius: radio.completo,
    paddingVertical: espacio.xs,
    paddingHorizontal: espacio.sm + 2,
  },
  screenHeaderBadgeTexto: {
    fontSize: 12.5,
    fontWeight: '700',
    color: color.primarioOscuro,
  },

  // ---------------------------------------------------------------------
  // Barra de navegación inferior
  // ---------------------------------------------------------------------
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: color.fondo,
    borderTopWidth: 1,
    borderTopColor: color.borde,
    paddingTop: espacio.xs + 2,
    paddingHorizontal: espacio.xs,
    ...sombraFlotante,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espacio.xs + 2,
    gap: 2,
    minHeight: toqueMinimo,
  },
  bottomNavIcono: {
    fontSize: 19,
    opacity: 0.55,
  },
  bottomNavIconoActivo: {
    opacity: 1,
  },
  bottomNavTexto: {
    fontSize: 11,
    color: color.textoTerciario,
    fontWeight: '600',
  },
  bottomNavTextoActivo: {
    color: color.primario,
    fontWeight: '700',
  },
  bottomNavIndicador: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    borderRadius: radio.completo,
    backgroundColor: color.primario,
  },

  // ---------------------------------------------------------------------
  // Tarjetas de sección (agrupan campos relacionados, p.ej. detalle de meta)
  // ---------------------------------------------------------------------
  seccion: {
    backgroundColor: color.fondo,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: color.borde,
    padding: espacio.base,
    marginBottom: espacio.md,
    ...sombraTarjeta,
  },
  seccionTitulo: {
    fontSize: 12.5,
    fontWeight: '700',
    color: color.textoTerciario,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: espacio.sm + 2,
  },
  seccionEncabezadoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacio.sm,
  },

  // ---------------------------------------------------------------------
  // Insignias de prioridad / categoría
  // ---------------------------------------------------------------------
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingVertical: 3,
    paddingHorizontal: espacio.sm,
    borderRadius: radio.completo,
    backgroundColor: color.fondoTab,
    alignSelf: 'flex-start',
  },
  insigniaPunto: {
    width: 7,
    height: 7,
    borderRadius: radio.completo,
  },
  insigniaPuntoAlta: {
    backgroundColor: color.peligro,
  },
  insigniaPuntoMedia: {
    backgroundColor: color.advertencia,
  },
  insigniaPuntoBaja: {
    backgroundColor: color.exito,
  },
  insigniaTexto: {
    fontSize: 11.5,
    fontWeight: '700',
    color: color.textoSecundario,
  },

  // ---------------------------------------------------------------------
  // Barra de progreso (estimado vs. real)
  // ---------------------------------------------------------------------
  progresoFila: {
    marginTop: espacio.sm + 2,
  },
  progresoFondo: {
    height: 6,
    borderRadius: radio.completo,
    backgroundColor: color.fondoTab,
    overflow: 'hidden',
  },
  progresoRelleno: {
    height: '100%',
    borderRadius: radio.completo,
    backgroundColor: color.primario,
  },
  progresoRellenoExceso: {
    backgroundColor: color.peligro,
  },
  progresoTexto: {
    fontSize: 12.5,
    color: color.textoTerciario,
    marginTop: espacio.xs,
  },

  // ---------------------------------------------------------------------
  // Compositor (fila de agregar rápido, p.ej. ideas / objetivos)
  // ---------------------------------------------------------------------
  composerFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espacio.sm,
  },
  composerInput: {
    flex: 1,
    marginBottom: 0,
  },
  composerBoton: {
    width: toqueMinimo + 6,
    height: toqueMinimo + 6,
    borderRadius: radio.md,
    backgroundColor: color.primario,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombraSuave,
  },
  composerBotonTexto: {
    fontSize: 20,
    color: color.fondo,
    fontWeight: '700',
  },

  // ---------------------------------------------------------------------
  // Tarjeta de tiempo total (encabezado con resumen) y separadores
  // ---------------------------------------------------------------------
  contadorTexto: {
    fontSize: 13,
    color: color.textoTerciario,
  },
  divisor: {
    height: 1,
    backgroundColor: color.borde,
    marginVertical: espacio.md,
  },

  // ---------------------------------------------------------------------
  // Aviso de sobrecarga (Hoy, Disponibilidad al crear/editar tarea)
  // ---------------------------------------------------------------------
  avisoSobrecarga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    backgroundColor: color.advertenciaSuave,
    borderRadius: radio.md,
    paddingVertical: espacio.sm,
    paddingHorizontal: espacio.base,
    marginBottom: espacio.base,
  },
  avisoSobrecargaIcono: {
    fontSize: 16,
  },
  avisoSobrecargaTexto: {
    flex: 1,
    fontSize: 12.5,
    color: color.advertencia,
    fontWeight: '600',
  },

  // ---------------------------------------------------------------------
  // Línea de tiempo del día (HoyScreen) — riel dibujado por fila (sin
  // posicionamiento absoluto ni medición de alturas, seguro dentro de
  // una FlatList virtualizada).
  // ---------------------------------------------------------------------
  lineaTiempoFila: {
    flexDirection: 'row',
    marginBottom: espacio.sm + 2,
  },
  lineaTiempoRielColumna: {
    width: 22,
    alignItems: 'center',
  },
  lineaTiempoRielSegmento: {
    width: 1,
    flex: 1,
    backgroundColor: color.borde,
  },
  lineaTiempoRielSegmentoInvisible: {
    backgroundColor: 'transparent',
  },
  lineaTiempoPunto: {
    width: 9,
    height: 9,
    borderRadius: radio.completo,
    backgroundColor: color.bordeFuerte,
    borderWidth: 2,
    borderColor: color.fondo,
  },
  lineaTiempoPuntoCompletada: {
    backgroundColor: color.exito,
  },
  lineaTiempoPuntoActiva: {
    width: 11,
    height: 11,
    backgroundColor: color.primario,
  },
  lineaTiempoPuntoVencida: {
    backgroundColor: color.peligro,
  },
  lineaTiempoTarjetaWrapper: {
    flex: 1,
    paddingLeft: espacio.sm,
  },
  lineaTiempoTarjeta: {
    backgroundColor: color.fondo,
    borderRadius: radio.lg,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    borderWidth: 1,
    borderColor: color.borde,
    ...sombraSuave,
  },
  lineaTiempoTarjetaCompletada: {
    opacity: 0.55,
  },
  lineaTiempoTarjetaActiva: {
    borderWidth: 1.5,
    borderColor: color.primario,
  },
  lineaTiempoEtiquetaGrupo: {
    fontSize: 12,
    fontWeight: '700',
    color: color.textoTerciario,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: espacio.sm,
    marginTop: espacio.xs,
  },

  // ---------------------------------------------------------------------
  // Columnas de carga semanal (SemanaScreen)
  // ---------------------------------------------------------------------
  semanaBarrasFila: {
    flexDirection: 'row',
    gap: espacio.xs + 2,
    paddingHorizontal: espacio.xs,
    height: 170,
    alignItems: 'flex-end',
  },
  semanaBarraColumna: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  semanaBarraFondo: {
    flex: 1,
    borderRadius: radio.sm,
    backgroundColor: color.fondoSutil,
    borderWidth: 1,
    borderColor: color.borde,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  semanaBarraFondoHoy: {
    borderWidth: 1.5,
    borderColor: color.primario,
    backgroundColor: color.primarioSuave,
  },
  semanaBarraRelleno: {
    width: '100%',
    backgroundColor: color.primario,
    opacity: 0.4,
    borderRadius: radio.sm,
  },
  semanaBarraRellenoHoy: {
    opacity: 1,
  },
  semanaBarraRellenoSobrecarga: {
    backgroundColor: color.advertencia,
    opacity: 0.55,
  },
  semanaBarraEtiqueta: {
    fontSize: 11,
    color: color.textoInactivo,
    textAlign: 'center',
    marginTop: espacio.xs,
  },
  semanaBarraEtiquetaHoy: {
    fontWeight: '700',
    color: color.primario,
  },
  semanaLeyendaFila: {
    flexDirection: 'row',
    gap: espacio.base,
    marginTop: espacio.base,
    paddingHorizontal: espacio.xs,
  },
  semanaLeyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
  },
  semanaLeyendaPunto: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  semanaLeyendaTexto: {
    fontSize: 11.5,
    color: color.textoTerciario,
  },

  // ---------------------------------------------------------------------
  // Grilla semanal de disponibilidad (vista previa, DisponibilidadScreen)
  // ---------------------------------------------------------------------
  dispGrillaContenedor: {
    marginBottom: espacio.lg,
  },
  dispGrillaCabeceraFila: {
    flexDirection: 'row',
  },
  dispGrillaCabeceraHueco: {
    width: 26,
  },
  dispGrillaCabeceraDia: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: color.textoInactivo,
  },
  dispGrillaCabeceraDiaHoy: {
    fontWeight: '700',
    color: color.primario,
  },
  dispGrillaCuerpoFila: {
    flexDirection: 'row',
    marginTop: espacio.xs + 2,
  },
  dispGrillaEtiquetasHora: {
    width: 26,
    justifyContent: 'space-between',
  },
  dispGrillaEtiquetaHora: {
    fontSize: 10,
    color: color.textoInactivo,
  },
  dispGrillaColumnas: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    height: 160,
  },
  dispGrillaColumna: {
    flex: 1,
    borderRadius: radio.sm,
    backgroundColor: color.fondoSutil,
    borderWidth: 1,
    borderColor: color.borde,
    borderStyle: 'dashed',
  },
  dispGrillaColumnaHoy: {
    borderStyle: 'solid',
    borderColor: color.bordeFuerte,
  },
  dispGrillaBloque: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: color.primario,
    opacity: 0.45,
    borderRadius: radio.sm - 2,
  },
});
