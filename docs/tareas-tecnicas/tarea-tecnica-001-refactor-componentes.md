# Tarea técnica 1: Dividir App.tsx en componentes

**Tipo:** Deuda técnica (no es una historia de usuario — no agrega
funcionalidad nueva).

**Motivo:** `App.tsx` llegó a 666 líneas tras 7 historias. Seguir
agregando funcionalidad ahí encima hace cada vez más lento y riesgoso el
trabajo (más contexto para procesar, más probabilidad de romper algo al
tocar el archivo).

## Regla no negociable

**Cero cambios de comportamiento.** Este refactor NO debe alterar
absolutamente nada de lo que el usuario ve o hace — ni un texto, ni un
orden de botones, ni un mensaje de error. Si algo se ve o se comporta
distinto después del refactor, es un bug del refactor, no una mejora
bienvenida.

## Estructura objetivo

```
app/
  App.tsx                          (orquestador delgado: estado de
                                     navegación + sesión activa, decide
                                     qué pantalla renderizar)
  screens/
    IdeasScreen.tsx                (lista de ideas, agregar, eliminar,
                                     convertir en meta)
    MetasScreen.tsx                (lista de metas, seleccionar una)
    MetaDetalleScreen.tsx          (objetivos de la meta seleccionada,
                                     agregar objetivo, volver)
    ObjetivoDetalleScreen.tsx      (tareas del objetivo seleccionado,
                                     agregar tarea con fecha/duración,
                                     alternar estado, iniciar/detener
                                     sesión, total acumulado, volver)
  db/                              (sin cambios — ya estaba separado)
```

`App.tsx` debe quedar como un componente pequeño que:
- Mantiene el estado de navegación (`vistaActual: 'ideas' | 'metas'`,
  `metaSeleccionada`, `objetivoSeleccionado`) y el estado de sesión activa
  (`sesionActiva`), ya que estos se comparten entre pantallas.
- Decide qué componente de `screens/` renderizar según ese estado.
- Pasa como props lo que cada pantalla necesita (datos + funciones
  callback), en vez de que cada pantalla acceda directamente al estado
  global de forma implícita.

## Criterios de aceptación

1. **Regresión completa:** repetir manualmente (aunque sea rápido) los
   escenarios centrales de las 7 historias anteriores — crear idea,
   convertir en meta, agregar objetivo, agregar tarea con fecha/duración,
   alternar estado de tarea, iniciar/detener sesión, ver totales — y
   confirmar que **todo se comporta exactamente igual** que antes del
   refactor.
2. Ningún archivo de `screens/` debe superar ~150-200 líneas. Si alguno
   lo hace, es señal de que se necesita dividir más (ej. extraer el
   formulario de "agregar tarea" como su propio componente pequeño
   dentro de `ObjetivoDetalleScreen.tsx` o en un archivo aparte).
3. No debe haber lógica de negocio duplicada entre pantallas — las
   funciones de `db/*.ts` siguen siendo la única fuente de acceso a
   datos, como ya era el caso.
4. `npx tsc --noEmit` sin errores.
5. La app sigue funcionando 100% offline, sin cambios de dependencias.

## Fuera de alcance

- Cualquier funcionalidad nueva (eso espera a la siguiente historia real).
- Instalar librería de navegación — el mismo patrón de estado local que
  ya existía se mantiene, solo se reorganiza en archivos separados.
- Cambiar nombres de funciones en `db/*.ts` o su comportamiento.
