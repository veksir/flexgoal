# Tarea técnica 13: Aplicar toqueMinimo (44px) en todos los targets

**Tipo:** Corrección de accesibilidad — no agrega funcionalidad, no
cambia el modelo de datos.

## Contexto

La auditoría de código detectó que `toqueMinimo = 44` está definido
en `theme.ts` pero aplicado solo en 6 de más de 30 estilos de botón.
El picker de hora tiene touch targets de ~22px, muy por debajo del
mínimo recomendado de 44px.

## Cambio

- `estilos.ts`: actualizar estilo `pickerBoton` para usar `minHeight: toqueMinimo` y `justifyContent: 'center'`.

## Criterios de aceptación

1. Los botones del picker de hora tienen al menos 44px de alto.
2. La app compila sin errores TypeScript.
3. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Cambio parcial: otros estilos se actualizarán gradualmente.

## Definition of Done aplicable

- Verificar los 3 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `fix/toque-minimo-consistente`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
