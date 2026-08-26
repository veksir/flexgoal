# Tarea técnica 9: Eliminar código muerto copy-paste (ternario idéntico)

**Tipo:** Limpieza de código — no agrega funcionalidad, no cambia el
modelo de datos.

## Contexto

La auditoría de código detectó código muerto en `HoyScreen.tsx` y
`ObjetivoDetalleScreen.tsx`:

```tsx
{sesionActiva.modo === 'pomodoro'
  ? formatearCronometro(tiempoSegundos)
  : formatearCronometro(tiempoSegundos)}
```

Ambas ramas del ternario son idénticas — resto de una refactorización
anterior.

## Cambio

- `HoyScreen.tsx`: reemplazar ternario por `formatearCronometro(tiempoSegundos)`.
- `ObjetivoDetalleScreen.tsx`: mismo cambio.

## Criterios de aceptación

1. El cronómetro sigue funcionando igual en ambas pantallas.
2. La app compila sin errores TypeScript.
3. Las 147 pruebas existentes siguen pasando.

## Alcance técnico adicional

- Sin migración de base de datos.
- Sin cambios en la lógica de negocio.

## Definition of Done aplicable

- Verificar los 3 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `fix/codigo-muerto-hoyscreen`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
