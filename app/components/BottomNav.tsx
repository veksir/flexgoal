import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, espacio, radio } from '../screens/theme';

export type Vista = 'hoy' | 'ideas' | 'metas' | 'disponibilidad' | 'semana';

export const VISTAS: { id: Vista; etiqueta: string; icono: string; subtitulo: string }[] = [
  { id: 'hoy', etiqueta: 'Hoy', icono: '☀️', subtitulo: 'Tus tareas para hoy' },
  { id: 'ideas', etiqueta: 'Ideas', icono: '💡', subtitulo: 'Bandeja de ideas' },
  { id: 'metas', etiqueta: 'Metas', icono: '🎯', subtitulo: 'Tus metas y objetivos' },
  { id: 'disponibilidad', etiqueta: 'Horario', icono: '🗓️', subtitulo: 'Disponibilidad semanal' },
  { id: 'semana', etiqueta: 'Semana', icono: '📊', subtitulo: 'Carga planificada vs. disponible' },
];

interface Props {
  vista: Vista;
  onChangeVista: (vista: Vista) => void;
}

export default function BottomNav({ vista, onChangeVista }: Props) {
  return (
    <View style={styles.tabs}>
      {VISTAS.map((item) => {
        const activo = vista === item.id;
        return (
          <Pressable
            key={item.id}
            style={styles.tab}
            onPress={() => onChangeVista(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={item.etiqueta}
          >
            {activo ? <View style={styles.tabIndicador} /> : null}
            <Text style={[styles.tabIcono, activo && styles.tabIconoActivo]}>
              {item.icono}
            </Text>
            <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>
              {item.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: color.fondo,
    borderTopWidth: 1,
    borderTopColor: color.borde,
    paddingTop: espacio.xs,
    paddingBottom: espacio.sm,
    paddingHorizontal: espacio.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espacio.xs + 2,
    gap: 2,
  },
  tabIndicador: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    borderRadius: radio.completo,
    backgroundColor: color.primario,
  },
  tabIcono: {
    fontSize: 19,
    opacity: 0.5,
  },
  tabIconoActivo: {
    opacity: 1,
  },
  tabTexto: {
    fontSize: 11,
    color: color.textoTerciario,
    fontWeight: '600',
  },
  tabTextoActivo: {
    color: color.primario,
    fontWeight: '700',
  },
});
