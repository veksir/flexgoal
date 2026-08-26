# Tarea técnica 5: SafeAreaView → react-native-safe-area-context

**Tipo:** Corrección de responsividad — no agrega funcionalidad, no
cambia el modelo de datos.

## Contexto

La auditoría de código detectó que `App.tsx` importa `SafeAreaView`
desde `react-native`, no desde `react-native-safe-area-context`.

El componente nativo de RN solo respeta áreas seguras en iOS; en
Android es una `View` normal. Esto significa que en Android (especialmente
con edge-to-edge en Android 15+), el header puede quedar pegado o
tapado por la barra de estado.

`react-native-safe-area-context` es la librería estándar del ecosistema
Expo/React Native para manejar áreas seguras en ambas plataformas.

## Cambio

- `App.tsx`: cambiar import de `SafeAreaView` de `react-native` a
  `react-native-safe-area-context`.
- `package.json`: agregar dependencia `react-native-safe-area-context`
  (instalada vía `npx expo install`).

## Criterios de aceptación

1. La app compila sin errores TypeScript.
2. Las 147 pruebas existentes siguen pasando.
3. No hay cambios visuales en iOS (comportamiento equivalente).
4. En Android, el header respeta la barra de estado correctamente.

## Alcance técnico adicional

- Sin migración de base de datos.
- Sin cambios en ninguna pantalla fuera de `App.tsx`.

## Definition of Done aplicable

- Verificar los 4 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `fix/safe-area-view`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
