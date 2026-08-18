# ADR-001: Enfoque local-first como principio arquitectónico base

- **Estado:** Aprobado
- **Fecha:** 2026-08-18
- **Autores:** Kevin Sena Molina

## 1. Contexto
El producto necesita ser sostenible sin depender de infraestructura de
servidor permanente ni de servicios de pago, y debe funcionar completamente
offline desde el día uno.

## 2. Opciones Consideradas
1. **Cloud-first (backend obligatorio desde v1):** simplifica sincronización
   y actualizaciones de IA, pero introduce dependencia de infraestructura,
   costos recurrentes y falla si no hay conexión.
2. **Local-first con sincronización opcional futura:** todas las funciones
   base viven en el dispositivo; el backend se añade después solo para sync.
   Mayor complejidad inicial en el motor local, pero mayor resiliencia,
   privacidad y costo cero de operación.

## 3. Decisión Elegida
Local-first con sincronización opcional diferida a una fase posterior
(Fase 6 del roadmap). Justificación: alinea con el requisito de no depender
de servidores pagos ni IA obligatoria, y protege la privacidad del usuario
por diseño.

## 4. Consecuencias e Impacto
- **Positivas:** cero costo de infraestructura en v1, funcionamiento offline
  garantizado, privacidad por defecto.
- **Riesgos / Trade-offs:** mayor complejidad en el motor de planificación
  local; la sincronización multi-dispositivo futura requerirá resolver
  conflictos de escritura (last-write-wins u otra estrategia, a definir en
  un ADR posterior).
