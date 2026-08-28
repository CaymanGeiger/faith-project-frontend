import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch, setApiToken } from '../../lib/api/client';
import { AuthResponse, User } from '../../lib/api/types';
import { clearGettingStartedDraft } from '../getting-started/gettingStarted';

const TOKEN_KEY = 'faith_project_access_token';

type RegisterInput = {
  accountType: 'PROSPECT' | 'SALES_MANAGER';
  token: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  termsAccepted: boolean;
};

type InviteDetails = {
  accountType: 'PROSPECT' | 'SALES_MANAGER';
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  getInviteDetails: (token: string) => Promise<InviteDetails>;
  registerFromInvite: (input: RegisterInput) => Promise<User>;
  acceptLegalTerms: () => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void restoreSession();
  }, []);

  const persistAuth = useCallback(async (response: AuthResponse) => {
    setApiToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
    await SecureStore.setItemAsync(TOKEN_KEY, response.accessToken);
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!storedToken) {
        return;
      }

      setApiToken(storedToken);
      setToken(storedToken);
      const response = await apiFetch<{ user: User }>('/auth/me');
      setUser(response.user);
    } catch {
      setApiToken(null);
      setToken(null);
      setUser(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await persistAuth(response);
      return response.user;
    },
    [persistAuth],
  );

  const registerFromInvite = useCallback(
    async (input: RegisterInput) => {
      const response = await apiFetch<AuthResponse>('/auth/register-from-invite', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await persistAuth(response);
      return response.user;
    },
    [persistAuth],
  );

  const getInviteDetails = useCallback(async (inviteToken: string) => {
    return apiFetch<InviteDetails>('/auth/invite-details', {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken }),
    });
  }, []);

  const refreshMe = useCallback(async () => {
    const response = await apiFetch<{ user: User }>('/auth/me');
    setUser(response.user);
  }, []);

  const acceptLegalTerms = useCallback(async () => {
    const response = await apiFetch<{ user: User }>('/me/legal-acceptance', {
      method: 'PATCH',
    });
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    const userId = user?.id;
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Stateless local logout still succeeds if the network is unavailable.
    }

    setApiToken(null);
    setToken(null);
    setUser(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      userId ? clearGettingStartedDraft(userId) : Promise.resolve(),
    ]);
  }, [user?.id]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      getInviteDetails,
      registerFromInvite,
      acceptLegalTerms,
      logout,
      refreshMe,
    }),
    [
      user,
      token,
      loading,
      login,
      getInviteDetails,
      registerFromInvite,
      acceptLegalTerms,
      logout,
      refreshMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
