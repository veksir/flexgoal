# Tarea técnica 14: Reemplazar input fecha por DateTimePicker nativo

**Tipo:** Mejora de UX — no cambia el modelo de datos.

## Contexto

La auditoría de código detectó que las fechas se ingresan como texto
libre ("AAAA-MM-DD"), propenso a error de tecleo.

## Cambio

- Nueva dependencia: `@react-native-community/datetimepicker`.
- Nuevo archivo `app/components/DatePicker.tsx`: componente que
  envuelve el DateTimePicker nativo con UI consistente.
- `FormularioTarea.tsx`: reemplazar `TextInput` de fecha por `DatePicker`.
- `MetaDetalleScreen.tsx`: reemplazar `TextInput` de fecha objetivo
  por `DatePicker`.

## Criterios de aceptación

1. Al tocar el campo de fecha, se abre el selector nativo.
2. La fecha seleccionada se muestra en formato AAAA-MM-DD.
3. La app compila sin errores TypeScript.
4. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.

## Definition of Done aplicable

- Verificar los 4 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `feat/datepicker-nativo`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
