import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type Props = {
  title: string;
  subtitle?: string;
};

const BRAND_GREEN = '#038c34';
const BRAND_ORANGE = '#fe790f';

export function AppHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      
      <View style={styles.texts}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>
      <Image source={require('../assets/images/logogreenex.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  logo: {
    width: 200,
    height: 128,
    borderRadius: 6,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  subtitle: {
    color: BRAND_ORANGE,
    fontSize: 12,
  },
});
