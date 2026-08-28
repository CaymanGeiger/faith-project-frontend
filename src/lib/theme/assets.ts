const herculesLogo = require('../../../assets/brand/hercules-logo-optimized.png');

export const brandAssets = {
  logoHeader: herculesLogo,
  lgLogo: require('../../../assets/brand/lg-logo-optimized.png'),
} as const;

export type BrandAssetKey = keyof typeof brandAssets;
