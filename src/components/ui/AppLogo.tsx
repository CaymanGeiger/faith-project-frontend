import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { BrandImage } from './BrandImage';

const herculesMark = require('../../../assets/brand/hercules-mark-optimized.png');

type AppLogoProps = {
  compact?: boolean;
  size?: 'compact' | 'standard' | 'auth' | 'home' | 'header';
};

export function AppLogo({ compact = false, size }: AppLogoProps) {
  const logoSize = size ?? (compact ? 'compact' : 'standard');
  const className =
    logoSize === 'home'
      ? 'h-24 w-[320px]'
      : logoSize === 'auth'
        ? 'h-16 w-[240px]'
      : logoSize === 'header'
        ? 'h-8 w-8'
      : logoSize === 'compact'
        ? 'h-12 w-40'
        : 'h-16 w-56';

  return (
    <View className={className}>
      {logoSize === 'header' ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          priority="high"
          source={herculesMark}
          style={styles.image}
          transition={0}
        />
      ) : (
        <BrandImage asset="logoHeader" style={styles.image} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
  },
});
