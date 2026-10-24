import { nativeStyles } from '../../lib/theme/nativeStyles';
import { Sparkles, Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../lib/theme/theme';

type HeroSparklesProps = {
  emphasis?: 'red' | 'blue';
};

export function HeroSparkles({ emphasis = 'red' }: HeroSparklesProps) {
  const accent = emphasis === 'blue' ? colors.blue : colors.red;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Sparkles size={23} color={accent} strokeWidth={2.2} style={styles.left} />
      <Star size={12} color={colors.blue} fill={colors.blue} strokeWidth={1.4} style={styles.leftSmall} />
      <Sparkles size={20} color={colors.blue} strokeWidth={2.1} style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create(nativeStyles.heroSparkles);
