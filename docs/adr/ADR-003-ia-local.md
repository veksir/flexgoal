# ADR-003: Estrategia de IA local/open source

- **Estado:** Propuesto (pendiente de evaluación)
- **Fecha:** 2026-08-18
- **Autores:** Kevin Sena Molina

## 1. Contexto
La IA debe ejecutarse localmente siempre que sea técnicamente viable, sin
depender de APIs de pago, y debe funcionar dentro de las restricciones de
RAM/batería/almacenamiento de dispositivos móviles Android/iOS de gama
media.

## 2. Opciones Consideradas
1. **llama.cpp con modelos pequeños (Qwen, Gemma, SmolLM):** buen soporte
   comunitario, cuantización agresiva posible, pero integración nativa en
   RN requiere bindings.
2. **MLC (Machine Learning Compilation):** optimizado para móvil, pero
   ecosistema y documentación menos maduros.
3. **ONNX Runtime / MediaPipe:** buena integración multiplataforma, pero
   puede requerir más trabajo de conversión de modelos.

## 3. Decisión Elegida
Pendiente — requiere una fase de evaluación técnica (Fase 5 del roadmap)
comparando al menos dos runtimes y dos tamaños de modelo en un dispositivo
Android de gama media real, midiendo: tiempo de respuesta, consumo de
batería, tamaño de descarga y calidad de las respuestas para las tareas
concretas de la IA (dividir metas, detectar ambigüedad, sugerir
reorganización).

## 4. Consecuencias e Impacto
- **Positivas:** decisión basada en datos reales de dispositivo, evita
  comprometerse prematuramente con un stack que no rinda en gama media.
- **Riesgos / Trade-offs:** la app debe diseñarse desde el inicio para
  funcionar sin IA (ver ADR-004 y NFR de resiliencia en `docs/TDD.md`), de
  modo que este ADR no bloquee el desarrollo de Fases 1–4.
