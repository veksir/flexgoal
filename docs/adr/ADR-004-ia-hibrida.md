# ADR-004: IA híbrida — motor determinístico vs. LLM

- **Estado:** Aprobado (principio de diseño, no requiere spike)
- **Fecha:** 2026-08-18
- **Autores:** Kevin Sena Molina

## 1. Contexto
No todas las funciones del sistema requieren un LLM. Cálculos de fechas,
carga semanal, detección de sobrecarga y reprogramación son deterministas
por naturaleza.

## 2. Opciones Consideradas
1. **Todo vía LLM:** más simple de conceptualizar, pero costoso
   computacionalmente, menos predecible y más lento en dispositivo.
2. **Motor híbrido:** lógica determinística para cálculos y reglas; LLM
   solo para lenguaje natural, estructuración de ideas e interpretación de
   intenciones.

## 3. Decisión Elegida
Motor híbrido. El motor determinístico maneja fechas, horarios, duración,
cálculo de carga, progreso y detección de sobrecarga. La IA se reserva
para comprensión de lenguaje natural, generación de propuestas y
explicaciones.

## 4. Consecuencias e Impacto
- **Positivas:** reduce drásticamente el costo computacional y la
  dependencia de IA; garantiza que la app funcione sin IA.
- **Riesgos / Trade-offs:** requiere mantener dos sistemas de lógica
  coordinados (reglas + IA), con una interfaz clara entre ambos.
