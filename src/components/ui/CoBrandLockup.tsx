import { nativeStyles } from '../../lib/theme/nativeStyles';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandImage } from './BrandImage';

type CoBrandLockupProps = {
  variant?: 'auth' | 'home';
};

export const CoBrandLockup = memo(function CoBrandLockup({
  variant = 'auth',
}: CoBrandLockupProps) {
  const isAuth = variant === 'auth';

  return (
    <View
      accessible
      accessibilityLabel="Hercules Industries and LG"
      accessibilityRole="image"
      className={`flex-row items-center justify-center ${
        isAuth ? 'h-16 w-full max-w-[320px]' : 'h-10 w-full'
      }`}
    >
      <View className={isAuth ? 'h-[52px] w-[196px]' : 'h-8 w-[121px]'}>
        <BrandImage
          asset="logoHeader"
          accessibilityIgnoresInvertColors
          style={styles.image}
        />
      </View>

      <View
        className={`w-px bg-hercules-blue/20 ${
          isAuth ? 'mx-3 h-8' : 'mx-2.5 h-5'
        }`}
      />

      <View className={isAuth ? 'h-[45px] w-[84px]' : 'h-[31px] w-[58px]'}>
        <BrandImage
          asset="lgLogo"
          accessibilityIgnoresInvertColors
          style={styles.image}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create(nativeStyles.branding);
