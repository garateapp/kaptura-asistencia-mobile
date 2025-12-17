import { Pressable, StyleSheet, Text } from 'react-native';

const BRAND_GREEN = '#038c34';
const BRAND_ORANGE = '#fe790f';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function ThemedButton({ title, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? BRAND_ORANGE : BRAND_GREEN },
        pressed && styles.buttonPressed,
      ]}>
      <Text style={[styles.label, { color: '#fff' }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
});
