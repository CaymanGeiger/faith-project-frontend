import { motionConfig } from '../../lib/motionConfig';
import { Image, type ImageProps } from 'expo-image';
import type { BrandAssetKey } from '../../lib/theme/assets';
import { useBrandAsset } from '../../features/brand/BrandAssetsProvider';

type BrandImageProps = Omit<ImageProps, 'source'> & {
  asset: BrandAssetKey;
};

export function BrandImage({
  asset,
  cachePolicy = 'memory-disk',
  contentFit = 'contain',
  priority = 'high',
  transition = motionConfig.native.imageTransition,
  ...props
}: BrandImageProps) {
  const source = useBrandAsset(asset);

  return (
    <Image
      {...props}
      cachePolicy={cachePolicy}
      contentFit={contentFit}
      priority={priority}
      source={source}
      transition={transition}
    />
  );
}
