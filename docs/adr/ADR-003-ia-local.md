# ADR-003: Estrategia de IA — Gemini API (tier gratuito)

- **Estado:** Aprobado
- **Fecha original:** 2026-08-18
- **Fecha de decisión final:** 2026-08-25
- **Autores:** Kevin Sena Molina

## 1. Contexto

Planteo original (2026-08-18): la IA debía ejecutarse localmente siempre
que fuera técnicamente viable, sin depender de APIs de pago, dentro de
las restricciones de RAM/batería/almacenamiento de dispositivos móviles
de gama media. Ese planteo asumía correr un modelo *on-device* (ver
opciones consideradas abajo).

El spike técnico de evaluación en dispositivo real nunca se ejecutó —
Fases 1-4 se completaron sin necesitarlo (ADR-004 garantiza que la app
funciona sin IA). Al llegar a Fase 5, Kevin revisó el planteo original
y decidió reemplazarlo: en vez de correr un modelo local en el
dispositivo, usar una API externa que sea **gratuita de forma
permanente** (no un crédito de prueba que se agota), aceptando que
implica depender de internet y de un proveedor externo para esa
función puntual.

## 2. Opciones Consideradas

**Modelos on-device (planteo original, descartado):**
1. **llama.cpp con modelos pequeños (Qwen, Gemma, SmolLM):** buen
   soporte comunitario, pero integración nativa en RN requiere
   bindings, y la calidad de modelos suficientemente pequeños para
   gama media es limitada para tareas de comprensión de lenguaje
   natural con matices (dividir una meta ambigua, por ejemplo).
2. **MLC (Machine Learning Compilation):** ecosistema y documentación
   menos maduros.
3. **ONNX Runtime / MediaPipe:** requiere más trabajo de conversión de
   modelos.

**APIs externas evaluadas (2026-08-25):**
4. **OpenAI / Anthropic:** ambas ofrecen solo créditos de prueba con
   vencimiento (ej. USD 5 a 30 días) — una vez agotados, quedan de pago
   inmediato. No cumplen el requisito de "gratis para siempre".
5. **Google Gemini API (Google AI Studio):** único proveedor grande con
   tier gratuito permanente, sin tarjeta de crédito, sin fecha de
   vencimiento (a diferencia de un crédito de prueba). Modelos Flash y
   Flash-Lite disponibles gratis (Pro dejó de estar en el tier gratuito
   desde abril 2026). Límites del tier gratuito: aprox. 5-15
   solicitudes por minuto, hasta ~1000-1500 por día — más que
   suficiente para el uso de una sola persona creando/organizando
   metas.

## 3. Decisión Elegida

**Gemini API (Google AI Studio), tier gratuito**, usando los modelos
Flash/Flash-Lite. Se descarta correr un modelo local on-device.

Esto revierte el requisito original de "IA debe ejecutarse localmente
siempre que sea técnicamente viable" — se documenta como una decisión
consciente y explícita de Kevin, no como un olvido del principio
original.

## 4. Consecuencias e Impacto

- **Positivas:** integración simple (una llamada HTTP), calidad de
  respuesta muy superior a cualquier modelo on-device viable en gama
  media, cero costo mientras el uso se mantenga dentro del tier
  gratuito, sin gestión de descarga/actualización de modelos ni
  consumo de almacenamiento del dispositivo.
- **Riesgos / Trade-offs (aceptados explícitamente por Kevin):**
  - **Requiere internet.** Las funciones de IA dejan de estar
    disponibles sin conexión. El resto de la app sigue siendo 100%
    offline (ADR-004 ya lo garantiza) — el diseño debe manejar con
    gracia la ausencia de conexión para estas funciones puntuales
    (mensaje claro, no un error críptico).
  - **Privacidad:** en el tier gratuito, Google puede usar los prompts
    y respuestas para mejorar sus productos. Los datos que se envíen
    (texto de ideas/metas) salen del dispositivo. No se envía la base
    de datos completa, solo lo estrictamente necesario para cada
    llamada puntual (a definir con precisión en la historia de
    implementación).
  - **Límites de tasa compartidos si la app se distribuye a más
    personas.** El tier gratuito es por proyecto/clave de API, no
    ilimitado. Para uso personal de Kevin (estado actual del proyecto)
    no es un problema. Si `flexgoal` llegara a tener más usuarios
    (Fase 6, cuentas/multi-dispositivo), cada usuario debería usar su
    propia clave de Gemini (vinculada a su propia cuenta de Google), no
    una clave compartida embebida en la app — a definir en el momento
    en que eso se vuelva relevante, no ahora.
  - **Dependencia de un tercero:** si Google descontinuara o cambiara
    las condiciones del tier gratuito, la función de IA dejaría de
    funcionar gratis. La app debe seguir funcionando sin IA (ADR-004)
    para que esto no sea una falla catastrófica, solo la pérdida de una
    función puntual.
- **No bloquea nada de lo ya construido:** Fases 1-4 no dependen de
  este ADR, siguen funcionando igual.
