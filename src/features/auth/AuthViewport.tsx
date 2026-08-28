import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren, RefObject } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import { CoBrandLockup } from '../../components/ui/CoBrandLockup';

type AuthViewportContextValue = {
  resetViewport: () => void;
  setBrandVisible: (visible: boolean) => void;
};

const AuthViewportContext = createContext<AuthViewportContextValue | null>(
  null,
);

type AuthViewportProviderProps = PropsWithChildren<{
  scrollRef: RefObject<ScrollView | null>;
}>;

export function AuthViewportProvider({
  scrollRef,
  children,
}: AuthViewportProviderProps) {
  const [brandVisible, setBrandVisible] = useState(true);
  const resetViewport = useCallback(() => {
    Keyboard.dismiss();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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
