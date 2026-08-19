# Historia 3: Objetivos dentro de una meta

**Como** usuario
**Quiero** dividir una meta en objetivos concretos
**Para** empezar a descomponerla en pasos manejables, en vez de que quede como una idea abstracta

## Contexto de diseño

Del TDD (jerarquía funcional, sección 3.3): Meta → Objetivo → Tarea →
Sesión. Esta historia implementa el segundo nivel: Objetivo, como hijo
directo de una Meta.

**No implementa todavía:** estado del objetivo, fecha, prioridad, ni
Tareas (siguiente nivel de la jerarquía, historia futura).

## Criterios de aceptación (Given-When-Then)

1. **Given** que estoy en la vista de Metas
   **When** toco una meta de la lista
   **Then** entro a una vista de detalle de esa meta, con la lista de sus objetivos.

2. **Given** que estoy en el detalle de una meta
   **When** escribo un texto y presiono "Agregar objetivo"
   **Then** el objetivo aparece en la lista, asociado únicamente a esa meta.

3. **Given** que una meta no tiene objetivos todavía
   **When** entro a su detalle
   **Then** veo un estado vacío apropiado.

4. **Given** que agregué objetivos a una meta específica
   **When** cierro la app completamente, la reabro, y vuelvo a entrar a esa misma meta
   **Then** sus objetivos siguen ahí — y si entro a otra meta distinta, NO veo los objetivos de la primera (aislamiento correcto por `meta_id`).

5. **Given** que estoy en el detalle de una meta
   **When** presiono "Volver"
   **Then** regreso a la lista de Metas sin perder ningún dato.

## Alcance técnico

- Nueva tabla:
  ```sql
  CREATE TABLE IF NOT EXISTS objetivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meta_id INTEGER NOT NULL REFERENCES metas(id),
    nombre TEXT NOT NULL,
    creado_en TEXT NOT NULL
  );
  ```
- Habilitar `PRAGMA foreign_keys = ON;` en la apertura de la conexión si
  no está ya habilitado (revisar `database.ts` — probablemente no se
  necesitó hasta ahora porque `ideas` y `metas` no tenían relaciones).
- Navegación al detalle: sigue sin usar librería de navegación. Basta con
  un estado `metaSeleccionada: Meta | null` — si no es null, se muestra la
  vista de detalle; si es null, se muestra la lista de Metas. Un botón
  "Volver" limpia ese estado.
- `listarObjetivosPorMeta(metaId)` debe filtrar estrictamente por
  `meta_id`, no traer todos los objetivos.

## Fuera de alcance (explícitamente)

- Estado, fecha, prioridad o descripción del objetivo.
- Editar o eliminar objetivos.
- Tareas (siguiente nivel de la jerarquía).
- Áreas.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar específicamente el aislamiento por `meta_id` (criterio 4) —
  es el punto más fácil de romper sin darse cuenta.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57) antes de dar por terminada la historia.
