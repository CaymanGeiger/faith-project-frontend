import type {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
} from 'react';
import {
  createContext,
  useContext,
  useMemo,
} from 'react';
import {
  benefitsApi,
  classesApi,
  leadsApi,
  resourcesApi,
} from '../../lib/api/endpoints';
import { useAsyncData } from '../../lib/hooks/useAsyncData';
import type { MessagingSocket } from '../../lib/messagingSocket';
import { useConversations, useMessagingSocket } from '../messaging/hooks';

export type ManagerProspectsData = Awaited<
  ReturnType<typeof leadsApi.prospects>
>;

export type ManagerSupportData = {
  resources: Awaited<ReturnType<typeof resourcesApi.list>>;
  classes: Awaited<ReturnType<typeof classesApi.list>>;
  benefits: Awaited<ReturnType<typeof benefitsApi.list>>;
};

export type ManagerAsyncData<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
};

export type ManagerConversationsData = ReturnType<typeof useConversations>;

export type ManagerDataContextValue = {
  userId: string;
  prospects: ManagerAsyncData<ManagerProspectsData>;
  support: ManagerAsyncData<ManagerSupportData>;
  socket: MessagingSocket | null;
  conversations: ManagerConversationsData;
};

type ManagerDataProviderProps = PropsWithChildren<{
  userId: string;
  token: string | null;
}>;

const ManagerDataContext = createContext<ManagerDataContextValue | null>(null);

async function loadManagerSupport(): Promise<ManagerSupportData> {
  const [resources, classes, benefits] = await Promise.all([
    resourcesApi.list(),
    classesApi.list(),
    benefitsApi.list(),
  ]);

  return { resources, classes, benefits };
}

export function ManagerDataProvider({
  children,
  userId,
  token,
}: ManagerDataProviderProps) {
  const prospectsQuery = useAsyncData(leadsApi.prospects, [userId]);
  const supportQuery = useAsyncData(loadManagerSupport, [userId]);
  const socket = useMessagingSocket(token);
  const conversationsQuery = useConversations(socket);

  const prospects = useMemo<ManagerAsyncData<ManagerProspectsData>>(
    () => ({
      data: prospectsQuery.data,
      loading: prospectsQuery.loading,
      error: prospectsQuery.error,
      reload: prospectsQuery.reload,
      setData: prospectsQuery.setData,
    }),
    [
      prospectsQuery.data,
      prospectsQuery.error,
      prospectsQuery.loading,
      prospectsQuery.reload,
      prospectsQuery.setData,
    ],
  );
  const support = useMemo<ManagerAsyncData<ManagerSupportData>>(
    () => ({
      data: supportQuery.data,
      loading: supportQuery.loading,
      error: supportQuery.error,
      reload: supportQuery.reload,
      setData: supportQuery.setData,
    }),
    [
      supportQuery.data,
      supportQuery.error,
      supportQuery.loading,
      supportQuery.reload,
      supportQuery.setData,
    ],
  );
  const conversations = useMemo<ManagerConversationsData>(
    () => ({
      conversations: conversationsQuery.conversations,
      loading: conversationsQuery.loading,
      error: conversationsQuery.error,
      reload: conversationsQuery.reload,
    }),
    [
      conversationsQuery.conversations,
      conversationsQuery.error,
      conversationsQuery.loading,
      conversationsQuery.reload,
    ],
  );

  const value = useMemo<ManagerDataContextValue>(
    () => ({
      userId,
      prospects,
      support,
      socket,
      conversations,
    }),
    [conversations, prospects, socket, support, userId],
  );

  return (
    <ManagerDataContext.Provider value={value}>
      {children}
    </ManagerDataContext.Provider>
  );
}

export function useManagerData(): ManagerDataContextValue {
  const context = useContext(ManagerDataContext);

  if (!context) {
    throw new Error('useManagerData must be used inside ManagerDataProvider');
  }

  return context;
}
