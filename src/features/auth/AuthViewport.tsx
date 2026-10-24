import { motionConfig } from '../../lib/motionConfig';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren, RefObject } from 'react';
import { Keyboard, View, type ScrollViewInstance } from 'react-native';
import { CoBrandLockup } from '../../components/ui/CoBrandLockup';

type AuthViewportContextValue = {
  resetViewport: () => void;
  setBrandVisible: (visible: boolean) => void;
};

const AuthViewportContext = createContext<AuthViewportContextValue | null>(
  null,
);

type AuthViewportProviderProps = PropsWithChildren<{
  scrollRef: RefObject<ScrollViewInstance | null>;
}>;

export function AuthViewportProvider({
  scrollRef,
  children,
}: AuthViewportProviderProps) {
  const [brandVisible, setBrandVisible] = useState(true);
  const resetViewport = useCallback(() => {
    Keyboard.dismiss();
    scrollRef.current?.scrollTo({ y: 0, animated: motionConfig.native.animateScrollReset });
  }, [scrollRef]);
  const value = useMemo(
    () => ({ resetViewport, setBrandVisible }),
    [resetViewport],
  );

  return (
    <AuthViewportContext.Provider value={value}>
      <View
        pointerEvents={brandVisible ? 'auto' : 'none'}
        className={brandVisible ? 'items-center' : 'absolute opacity-0'}
      >
        <CoBrandLockup />
      </View>
      {children}
    </AuthViewportContext.Provider>
  );
}

export function useAuthViewport() {
  const value = useContext(AuthViewportContext);
  if (!value) {
    throw new Error('useAuthViewport must be used inside AuthViewportProvider');
  }
  return value;
}
