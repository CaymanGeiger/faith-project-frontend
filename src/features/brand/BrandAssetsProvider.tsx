import { Image, type ImageRef } from 'expo-image';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  brandAssets,
  type BrandAssetKey,
} from '../../lib/theme/assets';

export type PreparedBrandAssets = Record<BrandAssetKey, number | ImageRef>;

const fallbackBrandAssets: PreparedBrandAssets = brandAssets;
const BrandAssetsContext =
  createContext<PreparedBrandAssets>(fallbackBrandAssets);

let retainedBrandAssets: PreparedBrandAssets | null = null;
let brandAssetLoadPromise: Promise<PreparedBrandAssets> | null = null;

function prepareBrandAssets() {
  if (retainedBrandAssets) {
    return Promise.resolve(retainedBrandAssets);
  }

  if (!brandAssetLoadPromise) {
    const keys = Object.keys(brandAssets) as BrandAssetKey[];

    brandAssetLoadPromise = Promise.allSettled(
      keys.map((key) => Image.loadAsync(brandAssets[key])),
    )
      .then((results) => {
        const prepared: PreparedBrandAssets = { ...fallbackBrandAssets };

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            prepared[keys[index]] = result.value;
          }
        });

        retainedBrandAssets = prepared;
        return prepared;
      })
      .catch(() => {
        retainedBrandAssets = fallbackBrandAssets;
        return fallbackBrandAssets;
      });
  }

  return brandAssetLoadPromise;
}

export function usePreparedBrandAssets() {
  const [prepared, setPrepared] = useState<PreparedBrandAssets | null>(
    retainedBrandAssets,
  );

  useEffect(() => {
    let mounted = true;
    const watchdog = setTimeout(() => {
      if (mounted) {
        setPrepared((current) => current ?? fallbackBrandAssets);
      }
    }, 1200);

    void prepareBrandAssets().then((assets) => {
      if (mounted) {
        clearTimeout(watchdog);
        setPrepared(assets);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(watchdog);
    };
  }, []);

  return prepared;
}

type BrandAssetsProviderProps = PropsWithChildren<{
  assets: PreparedBrandAssets;
}>;

export function BrandAssetsProvider({
  assets,
  children,
}: BrandAssetsProviderProps) {
  return (
    <BrandAssetsContext.Provider value={assets}>
      {children}
    </BrandAssetsContext.Provider>
  );
}

export function useBrandAsset(key: BrandAssetKey) {
  return useContext(BrandAssetsContext)[key];
}
