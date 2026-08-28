import { useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { PageHero } from '../../../components/ui/PageHero';
import { SkeletonLine } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { ConversationList } from '../../../features/messaging/components/ConversationList';
import { MessagingModal } from '../../../features/messaging/components/MessagingModal';
import { Conversation } from '../../../lib/api/types';

export default function ManagerMessagesScreen() {
  const { user } = useAuth();
  const { conversations, socket } = useManagerData();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const conversationsReady = Boolean(
    user &&
      (!conversations.loading || conversations.conversations.length > 0),
  );

  return (
    <AppScreen
      title="Chat"
      quickLinks={managerQuickLinks}
    >
      <PageHero
        title="Chat"
        subtitle="Connect with your assigned prospects."
        reveal={false}
      />

      {conversations.error && conversations.conversations.length === 0 ? (
        <ErrorState message={conversations.error} onRetry={conversations.reload} />
      ) : (
        <AsyncContent
          ready={conversationsReady}
          fallback={<ManagerConversationListSkeleton />}
        >
          {user ? (
            <ConversationList
              conversations={conversations.conversations}
              currentUser={user}
              onSelect={setSelected}
            />
          ) : null}
        </AsyncContent>
      )}
      {user ? (
        <MessagingModal
          conversation={selected}
          currentUser={user}
          socket={socket}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </AppScreen>
  );
}

function ManagerConversationListSkeleton() {
  return (
    <SkeletonReveal label="Loading conversations" className="w-full">
      <View className="gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <View
            key={`manager-conversation-${index}`}
            className="min-h-20 flex-row items-center gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4"
          >
            <View className="h-12 w-12 rounded-full bg-hercules-blue/15" />
            <View className="min-w-0 flex-1 gap-1">
              <View className="h-6 justify-center">
                <SkeletonLine className="h-5 w-3/4" />
              </View>
              <View className="h-5 justify-center">
                <SkeletonLine className="h-3 w-4/5" subtle />
              </View>
            </View>
            {index === 0 ? (
              <View className="h-4 w-12 items-end justify-center">
                <SkeletonLine className="h-3 w-full" subtle />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </SkeletonReveal>
  );
}
