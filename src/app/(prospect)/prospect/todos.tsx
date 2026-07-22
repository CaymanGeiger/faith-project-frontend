import { Href, router } from 'expo-router';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { Badge } from '../../../components/ui/Badge';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { PageHero } from '../../../components/ui/PageHero';
import { todosApi } from '../../../lib/api/endpoints';
import { TodoItem } from '../../../lib/api/types';
import { formatShortDate } from '../../../lib/format';
import { colors } from '../../../lib/theme/theme';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

const todoDestinations: Record<TodoItem['type'], Href> = {
  CLASS_SIGNUP: '/prospect/classes',
  EQUIPMENT_REGISTRATION: '/prospect/inbox',
  MARKETING_CONSULTATION: '/prospect/marketing',
  JB_WARRANTIES: '/prospect/benefits',
  RESOURCE_REVIEW: '/prospect/resources',
};

export default function ProspectTodosScreen() {
  const todos = useAsyncData(() => todosApi.list(), []);

  const toggle = async (id: string, completed: boolean) => {
    await todosApi.update(id, completed);
    await todos.reload();
  };

  return (
    <AppScreen
      title="To-Do"
      quickLinks={prospectQuickLinks}
      alertHref="/prospect/inbox"
    >
      <PageHero
        icon={CheckCircle2}
        title="To-Do"
        subtitle="Required onboarding actions and deadlines."
      />

      {todos.loading ? <LoadingState label="Loading to-do items" /> : null}
      {todos.error ? <ErrorState message={todos.error} onRetry={todos.reload} /> : null}
      {todos.data ? (
        <View className="gap-3">
          {todos.data.todos.map((todo, index) => {
            const complete = todo.status === 'COMPLETED';
            const Icon = complete ? CheckCircle2 : Circle;
            return (
              <AnimatedCard key={todo.id} index={index + 1}>
                <View className="flex-row items-center gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Mark ${todo.title} as ${complete ? 'open' : 'done'}`}
                    accessibilityState={{ checked: complete }}
                    hitSlop={10}
                    onPress={() => void toggle(todo.id, !complete)}
                    className="active:opacity-60"
                  >
                    <Icon
                      size={28}
                      color={complete ? colors.blue : colors.red}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${todo.title}`}
                    onPress={() => router.push(todoHref(todo.type))}
                    className="flex-1 flex-row items-center gap-3 active:opacity-70"
                  >
                    <View className="flex-1 gap-2">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="flex-1 text-lg font-extrabold text-hercules-ink">
                          {todo.title}
                        </Text>
                        <Badge
                          label={complete ? 'Done' : 'Open'}
                          tone={complete ? 'blue' : 'red'}
                        />
                      </View>
                      <Text className="text-sm leading-5 text-hercules-muted">
                        {todo.description}
                      </Text>
                      <Text className="text-xs font-bold text-hercules-blue">
                        Due {formatShortDate(todo.dueAt)}
                      </Text>
                    </View>
                    <ChevronRight size={21} color={colors.ink} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </AnimatedCard>
            );
          })}
        </View>
      ) : null}
    </AppScreen>
  );
}

function todoHref(type: TodoItem['type']): Href {
  return todoDestinations[type];
}
