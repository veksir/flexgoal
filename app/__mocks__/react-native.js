const React = require('react');

function createComponent(name) {
  const Component = React.forwardRef(({ children, testID, accessibilityLabel, accessibilityRole, accessibilityState, accessibilityHint, onPress, onLongPress, style, hitSlop, delayLongPress, disabled, ...props }, ref) => {
    return React.createElement(
      'View',
      {
        testID,
        accessibilityLabel,
        accessibilityRole,
        accessibilityState,
        accessibilityHint,
        onPress,
        onLongPress,
        style,
        hitSlop,
        delayLongPress,
        disabled,
        ref,
        ...props,
      },
      children
    );
  });
  Component.displayName = name;
  return Component;
}

module.exports = {
  View: createComponent('View'),
  Text: createComponent('Text'),
  Pressable: createComponent('Pressable'),
  TouchableOpacity: createComponent('TouchableOpacity'),
  TextInput: createComponent('TextInput'),
  ScrollView: createComponent('ScrollView'),
  FlatList: createComponent('FlatList'),
  Modal: createComponent('Modal'),
  ActivityIndicator: createComponent('ActivityIndicator'),
  SafeAreaView: createComponent('SafeAreaView'),
  KeyboardAvoidingView: createComponent('KeyboardAvoidingView'),
  Platform: { OS: 'ios', select: (obj) => obj.ios },
  Alert: { alert: jest.fn() },
  Vibration: { vibrate: jest.fn() },
  StyleSheet: {
    create: (styles) => styles,
  },
};
