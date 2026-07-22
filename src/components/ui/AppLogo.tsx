import { Image, View } from 'react-native';
import { brandAssets } from '../../lib/theme/assets';

type AppLogoProps = {
  compact?: boolean;
  size?: 'compact' | 'standard' | 'home' | 'header';
};

export function AppLogo({ compact = false, size }: AppLogoProps) {
  const logoSize = size ?? (compact ? 'compact' : 'standard');
  const className =
    logoSize === 'home'
      ? 'h-24 w-[320px]'
      : logoSize === 'header'
        ? 'h-8 w-8'
      : logoSize === 'compact'
        ? 'h-12 w-40'
        : 'h-16 w-56';
  const source =
    logoSize === 'header' ? brandAssets.logoHeaderMark : brandAssets.logo;

  return (
    <View className={className}>
      <Image
        source={source}
        resizeMode="contain"
        className="h-full w-full"
      />
    </View>
  );
}
