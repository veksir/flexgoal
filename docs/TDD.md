# Technical Design Document (TDD)
## Aplicación de Planificación Adaptativa de Metas

**Estado:** Borrador inicial
**Fecha:** 2026-08-18
**Autor:** Kevin Sena Molina

---

## 1. Contexto y Objetivos

### 1.1 Resumen del Problema

Las personas suelen tener múltiples ideas y objetivos de largo plazo (aprender una habilidad, desarrollar un proyecto, mejorar profesionalmente), pero carecen de un mecanismo claro para traducir esas metas en acciones diarias concretas. El problema no es la falta de objetivos, sino la falta de claridad sobre qué hacer con el tiempo disponible para acercarse a ellos.

Adicionalmente, las herramientas de productividad tradicionales (listas de tareas, Pomodoro, gestores de hábitos) son rígidas: asumen que el usuario cumplirá el plan tal como fue diseñado. Cuando la realidad no coincide con lo planificado (lo cual es la norma, no la excepción), estas herramientas generan acumulación de tareas atrasadas, frustración y abandono.

**Insight central:** el usuario no necesariamente carece de motivación o tiempo; carece de claridad sobre qué hacer con el tiempo que tiene. Una meta general se vuelve ejecutable solo cuando se descompone en pasos pequeños y medibles, y el plan debe aprender de la diferencia entre lo planificado y lo realizado para reajustarse.

### 1.2 Objetivos e Indicadores Clave

**Objetivo principal:** construir una aplicación móvil local-first que convierta ideas y metas de largo plazo en un plan de acción diario, y que adapte ese plan comparando continuamente lo planificado contra lo realmente ejecutado.

**Métricas de éxito (a definir con más precisión en Fase 2 en adelante):**
- Tasa de retención de metas activas después de 4 semanas (¿el usuario sigue trabajando en la meta o la abandonó?).
- Desviación promedio entre tiempo planificado y tiempo realizado por meta.
- % de tareas reprogramadas vs. eliminadas vs. completadas (señal de si el sistema de adaptación está funcionando).
- Uso de la app sin conexión (validación del enfoque local-first).
- Latencia de la pantalla principal ("¿Qué debería hacer ahora?") — debe cargar de forma instantánea, sin depender de red.

---

## 2. Alcance (Scope)

| Dentro del Alcance (In-Scope) | Fuera del Alcance (Out-of-Scope) |
|---|---|
| App móvil Android/iOS local-first | Backend obligatorio o servidor siempre activo |
| Bandeja de ideas → metas → objetivos → tareas | Red social, rankings, gamificación excesiva |
| Planificación por horario y por disponibilidad | Colaboración multiusuario / equipos |
| Pomodoro + time tracking integrado a metas/tareas | Marketplace o integraciones con servicios externos (v1) |
| Motor determinístico de cálculo (tiempo, carga, desviación) | Modelos de IA de pago o dependientes de servicios cloud |
| Asistente de IA local/open source integrado a funciones puntuales | Chat de IA independiente / genérico |
| Modo mínimo y manejo de días libres/excepciones | Sincronización multi-dispositivo (se difiere a Fase 6) |
| Funcionamiento 100% offline para todas las funciones fundamentales | Visión por computadora (explícitamente diferida a v2 en la idea original) |

---

## 3. Arquitectura del Sistema

### 3.1 Stack Tecnológico Seleccionado (tentativo)

- **Capa de presentación:** React Native + Expo (mobile-first, Android/iOS).
- **Motor de planificación local:** módulo determinístico embebido en el cliente — sin LLM — encargado de fechas, cálculo de carga semanal, detección de sobreplanificación, reprogramación y progreso.
- **Persistencia local:** base de datos embebida en el dispositivo (a evaluar: SQLite/WatermelonDB/Realm — pendiente de decisión técnica, ver ADR-002).
- **Asistente de IA:** modelo pequeño open source ejecutado localmente vía runtime móvil (candidatos: llama.cpp, MLC, ONNX Runtime, MediaPipe; modelos candidatos: Qwen, Gemma, Llama, SmolLM — ver ADR-003).
- **Backend opcional (fase posterior):** FastAPI + PostgreSQL, únicamente para sincronización entre dispositivos, nunca requerido para el funcionamiento base.
- **Contenedores:** Docker, principalmente para entornos de desarrollo y para los servicios opcionales de backend.

### 3.2 Diagrama Estructural de Componentes

```
                 📱 MOBILE APP
            React Native + Expo
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
   Local Database         Local Planning
    (SQLite/otro)             Engine
          │              (determinístico)
          └──────────┬──────────┘
                     │
                     ▼
               AI Assistant
             (capa de interpretación
              de lenguaje natural)
                     │
                     ▼
              Local LLM
        (llama.cpp / MLC / ONNX)

Opcional, no requerido para funciones base:

                 ☁️ BACKEND
                     │
        ┌────────────┴────────────┐
        │                         │
    Sync API (FastAPI)      PostgreSQL
```

**Principio de capas — jerarquía obligatoria del proyecto:**

```
                 FUNCIONALIDAD
                      │
          ┌───────────┴───────────┐
          │                       │
      LOCAL                    ONLINE
     (siempre)                (opcional)
          │
          ▼
      IA local
          │
          ▼
   IA remota (si algún día existe)
```

Regla de diseño no negociable: **primero local, después online — nunca al revés.** Si la IA no está disponible, todas las funciones fundamentales (crear metas, tareas, Pomodoro, registrar tiempo, ver progreso, reorganizar manualmente) deben seguir operando.

### 3.3 Modelo conceptual de datos (jerarquía funcional)

```
💡 IDEA → 🎯 META → 🧩 OBJETIVOS → 📋 TAREAS → 🍅 SESIONES → ⏱️ TIEMPO
```

Una meta incluye: nombre, descripción, fecha de inicio, fecha objetivo, prioridad, categoría/área, tiempo estimado, estado (Activa/Pausada/Completada/Abandonada/Archivada) y progreso. El historial de metas abandonadas se conserva, no se elimina.

### 3.4 Sistema adaptativo (ciclo central del producto)

```
🎯 META → 📅 PLANIFICAR → ▶️ ACTUAR → ⏱️ MEDIR → 📊 ANALIZAR → 🔄 ADAPTAR → (vuelve a PLANIFICAR)
```

El motor determinístico compara planificado vs. realizado; cuando detecta una desviación sostenida, la IA (o reglas simples si la IA no está disponible) genera una propuesta de ajuste, que el usuario siempre debe aprobar, modificar o rechazar explícitamente. **Ninguna modificación silenciosa de datos importantes está permitida.**

---

## 4. Requisitos No Funcionales (NFRs)

- **Rendimiento:** la pantalla principal ("¿Qué debería hacer ahora?") debe renderizar sin llamadas de red; toda operación local (crear tarea, iniciar Pomodoro, registrar tiempo) debe sentirse instantánea.
- **Disponibilidad offline:** 100% de las funciones fundamentales (ideas, metas, tareas, Pomodoro, time tracking, estadísticas, planificación) deben operar sin conexión.
- **Escalabilidad:** no aplica escalado de servidores en v1 (no hay servidor obligatorio); la sincronización futura debe diseñarse para escalar por usuario, no por carga concurrente masiva.
- **Privacidad:** los datos personales (metas, horarios, tareas, historial, hábitos) permanecen en el dispositivo por defecto; si la IA corre localmente, ningún dato debe salir del teléfono para generar recomendaciones.
- **Recursos del dispositivo:** el modelo de IA local debe evaluarse contra restricciones reales de RAM, almacenamiento, batería y velocidad en gama media de Android/iOS (no solo en gama alta).
- **Resiliencia del producto ante el usuario:** el sistema debe tolerar comportamiento imperfecto (tareas no completadas, sobreplanificación, abandono temporal) sin generar mensajes punitivos ni acumulación descontrolada de pendientes.

---

# PARTE 2: Architecture Decision Records (ADRs)

## ADR-001: Enfoque local-first como principio arquitectónico base

- **Estado:** Propuesto
- **Fecha:** 2026-08-18
- **Autores:** Kevin Sena Molina

### 1. Contexto
El producto necesita ser sostenible sin depender de infraestructura de servidor permanente ni de servicios de pago, y debe funcionar completamente offline desde el día uno.

### 2. Opciones Consideradas
1. **Cloud-first (backend obligatorio desde v1):** simplifica sincronización y actualizaciones de IA, pero introduce dependencia de infraestructura, costos recurrentes y falla si no hay conexión.
2. **Local-first con sincronización opcional futura:** todas las funciones base viven en el dispositivo; el backend se añade después solo para sync. Mayor complejidad inicial en el motor local, pero mayor resiliencia, privacidad y costo cero de operación.

### 3. Decisión Elegida
Local-first con sincronización opcional diferida a una fase posterior (Fase 6 del roadmap). Justificación: alinea con el requisito de no depender de servidores pagos ni IA obligatoria, y protege la privacidad del usuario por diseño.

### 4. Consecuencias e Impacto
- **Positivas:** cero costo de infraestructura en v1, funcionamiento offline garantizado, privacidad por defecto.
- **Riesgos / Trade-offs:** mayor complejidad en el motor de planificación local; la sincronización multi-dispositivo futura requerirá resolver conflictos de escritura (last-write-wins u otra estrategia, a definir en un ADR posterior).

---

## ADR-002: Selección de base de datos local para React Native

- **Estado:** Aprobado
- **Fecha:** 2026-08-18 (propuesto) — 2026-08-19 (aprobado, tras spike)
- **Autores:** Kevin Sena Molina

### 1. Contexto
Se necesita persistencia local robusta para el modelo Idea → Meta → Objetivo → Tarea → Sesión, con consultas relacionales (progreso agregado, tiempo por meta) y buen soporte en React Native/Expo.

### 2. Opciones Consideradas
1. **SQLite (vía expo-sqlite):** maduro, relacional, control total de queries; requiere más código para migraciones y sincronización futura.
2. **WatermelonDB:** pensado para apps offline-first reactivas, buena integración con sync futuro, pero con curva de aprendizaje y menos flexible para queries ad-hoc.
3. **Realm:** descartado sin spike — licenciamiento y roadmap de producto (propiedad de MongoDB) generaban incertidumbre adicional que no se justificaba frente a las otras dos opciones.

### 3. Decisión Elegida
**SQLite vía `expo-sqlite`.** Se ejecutó un spike comparando SQLite y WatermelonDB implementando el mismo escenario (Meta→Objetivo→Tarea→Sesión, ~30 tareas, ~30 sesiones) y las 3 queries críticas del sistema adaptativo: progreso agregado por meta, tareas pendientes por rango de fechas, y desviación planificado-vs-realizado.

**Resultado del spike:** SQLite 28/30 vs. WatermelonDB 21/30.

- Las 3 queries se resuelven en SQL directo en SQLite (1–2 ms medidos); en WatermelonDB requieren agregación manual en JS por falta de soporte de JOIN/agregaciones en el query builder (11–25 ms medidos, ~10x más lento en el mismo harness).
- SQLite funciona en Expo Go sin configuración adicional; WatermelonDB requiere dev build nativo (`expo prebuild`) y configuración manual de Babel (decorators, class-properties).
- WatermelonDB ganó en migraciones (declarativas, se auto-aplican) y quedó empatado en tipado de TypeScript, pero ninguno de los dos compensa el costo de setup y la debilidad en las queries agregadas, que son el núcleo del producto.

### 4. Consecuencias e Impacto
- **Positivas:** decisión informada por prueba real y medida, no por popularidad. Se elimina la dependencia de dev build nativo en Fase 1, permitiendo seguir usando Expo Go durante el desarrollo temprano. Menor boilerplate y menor superficie de configuración.
- **Riesgos / Trade-offs:** las migraciones en SQLite son manuales (`PRAGMA user_version` + `ALTER TABLE`), por lo que la disciplina de versionado de esquema recae en el equipo, no en el framework. Si en el futuro (Fase 6, sincronización) se necesita reactividad tipo-ORM u observación de cambios en tiempo real, esta decisión debería revisitarse — no está descartado reevaluar WatermelonDB en ese punto específico.

---

## ADR-003: Estrategia de IA local/open source

- **Estado:** Propuesto (pendiente de evaluación)
- **Fecha:** 2026-08-18
- **Autores:** Kevin Sena Molina

### 1. Contexto
La IA debe ejecutarse localmente siempre que sea técnicamente viable, sin depender de APIs de pago, y debe funcionar dentro de las restricciones de RAM/batería/almacenamiento de dispositivos móviles Android/iOS de gama media.

### 2. Opciones Consideradas
1. **llama.cpp con modelos pequeños (Qwen, Gemma, SmolLM):** buen soporte comunitario, cuantización agresiva posible, pero integración nativa en RN requiere bindings.
2. **MLC (Machine Learning Compilation):** optimizado para móvil, pero ecosistema y documentación menos maduros.
3. **ONNX Runtime / MediaPipe:** buena integración multiplataforma, pero puede requerir más trabajo de conversión de modelos.

### 3. Decisión Elegida
Pendiente — requiere una fase de evaluación técnica (Fase 5 del roadmap) comparando al menos dos runtimes y dos tamaños de modelo en un dispositivo Android de gama media real, midiendo: tiempo de respuesta, consumo de batería, tamaño de descarga y calidad de las respuestas para las tareas concretas de la IA (dividir metas, detectar ambigüedad, sugerir reorganización).

### 4. Consecuencias e Impacto
- **Positivas:** decisión basada en datos reales de dispositivo, evita comprometerse prematuramente con un stack que no rinda en gama media.
- **Riesgos / Trade-offs:** la app debe diseñarse desde el inicio para funcionar sin IA (ver Sección 3.4 y NFR de resiliencia), de modo que este ADR no bloquee el desarrollo de Fases 1–4.

---

## ADR-004: IA híbrida — motor determinístico vs. LLM

- **Estado:** Aprobado (principio de diseño, no requiere spike)
- **Fecha:** 2026-08-18
- **Autores:** Kevin Sena Molina

### 1. Contexto
No todas las funciones del sistema requieren un LLM. Cálculos de fechas, carga semanal, detección de sobrecarga y reprogramación son deterministas por naturaleza.

### 2. Opciones Consideradas
1. **Todo vía LLM:** más simple de conceptualizar, pero costoso computacionalmente, menos predecible y más lento en dispositivo.
2. **Motor híbrido:** lógica determinística para cálculos y reglas; LLM solo para lenguaje natural, estructuración de ideas e interpretación de intenciones.

### 3. Decisión Elegida
Motor híbrido. El motor determinístico maneja fechas, horarios, duración, cálculo de carga, progreso y detección de sobrecarga. La IA se reserva para comprensión de lenguaje natural, generación de propuestas y explicaciones.

### 4. Consecuencias e Impacto
- **Positivas:** reduce drásticamente el costo computacional y la dependencia de IA; garantiza que la app funcione sin IA (requisito de la Sección 28 de la idea original).
- **Riesgos / Trade-offs:** requiere mantener dos sistemas de lógica coordinados (reglas + IA), con una interfaz clara entre ambos.

---

# PARTE 3: Governance de Calidad y Criterios de Aceptación

## Definition of Ready (DoR)

Antes de que una historia de usuario entre a desarrollo:

- Historia descrita en formato **Como... Quiero... Para...** (ej.: *Como usuario que tuvo una semana ocupada, quiero que la app detecte la desviación entre plan y realidad, para que me proponga un ajuste realista en vez de acumular tareas atrasadas*).
- Criterios de aceptación en formato **Given-When-Then**.
- Dependencias identificadas (ej.: si la historia depende del ADR-002 o ADR-003, estos deben estar resueltos o explícitamente marcados como bloqueo conocido).
- Diseños de UI/UX aprobados cuando la historia toca pantalla principal, flujo de creación de metas o propuestas de la IA (dado el principio "el usuario decide, la IA nunca modifica silenciosamente").
- Estimación de esfuerzo acordada.

## Definition of Done (DoD)

Para considerar una historia completada:

- Código implementado siguiendo linters/guías de estilo del proyecto.
- Pruebas unitarias/integración para el motor determinístico (fechas, cálculo de carga, detección de sobrecarga) con cobertura ≥ 80%, dado que es la parte crítica del producto y debe funcionar sin IA.
- Si la historia involucra la IA: validado que el flujo de "proponer → aplicar/modificar/cancelar" está implementado y que ninguna acción de la IA modifica datos sin confirmación explícita del usuario.
- Verificado funcionamiento offline completo de la funcionalidad (sin red disponible).
- Code review aprobado.
- Documentación actualizada en `CLAUDE.md` (o el documento canónico del proyecto) incluyendo decisiones de arquitectura relevantes.
- Desplegado/verificado en build de staging (Expo Go / build interno) sin errores críticos.

---

## Roadmap de referencia (resumen de fases)

| Fase | Foco |
|---|---|
| 1 | Fundamentos: ideas, metas, áreas, objetivos, tareas, estados, fechas, prioridades, DB local |
| 2 | Tiempo: Pomodoro, time tracking, sesiones, historial, estadísticas |
| 3 | Planificación: disponibilidad, horarios, planificación semanal/diaria, reprogramación |
| 4 | Adaptación: plan vs. realidad, detección de sobrecarga, modo mínimo, días libres |
| 5 | IA: creación de metas en lenguaje natural, división de metas, detección de ambigüedad, análisis de comportamiento |
| 6 | Sincronización: cuentas, backup, multi-dispositivo |

**Explícitamente fuera de alcance temprano:** red social, rankings, gamificación excesiva, chat de IA independiente, colaboración multiusuario, marketplace, integraciones masivas, servidor obligatorio, IA obligatoria, dependencia de APIs de pago.
