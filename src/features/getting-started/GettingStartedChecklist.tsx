import { useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  Wind,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { componentStyles } from '../../lib/theme/componentStyles';
import { colors } from '../../lib/theme/theme';
import { gettingStartedSteps } from './gettingStarted';

const tasks = [
  { index: 0, icon: Building2, description: 'Add your business and contact details.' },
  { index: 1, icon: GraduationCap, description: 'Choose an LG training session.' },
  { index: 2, icon: ShieldCheck, description: 'Record your completed warranty setup.' },
  { index: 3, icon: Megaphone, description: 'Find a time to talk marketing.' },
  { index: 4, icon: Wind, description: 'Add your first LG equipment record.' },
] as const;

const taskGroups = [
  { title: 'Start here', tasks: tasks.slice(0, 2) },
  { title: 'Next steps', tasks: tasks.slice(2) },
];

type GettingStartedChecklistProps = {
  completion: boolean[];
  nextStep: number;
  onSelectStep: (index: number) => void;
  onFinish: () => void;
  finishing?: boolean;
};

const listStyles = componentStyles.listItem;

export function GettingStartedChecklist({
  completion,
  nextStep,
  onSelectStep,
  onFinish,
  finishing = false,
}: GettingStartedChecklistProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const completedTasks = tasks.filter((task) => completion[task.index]);
  const completedCount = completedTasks.length;
  const allComplete = completedCount === tasks.length;
  const pendingGroups = taskGroups
    .map((group) => ({
      ...group,
      tasks: group.tasks.filter((task) => !completion[task.index]),
    }))
    .filter((group) => group.tasks.length > 0);
  const recommendedTask = tasks.some(
    (task) => task.index === nextStep && !completion[task.index],
  )
    ? nextStep
    : tasks.find((task) => !completion[task.index])?.index;
  const CompletedChevron = showCompleted ? ChevronUp : ChevronDown;

  return (
    <View className="gap-6">
      <AnimatedCard index={0} className="gap-3 px-1">
        <View className="gap-1">
          <Text className="text-[24px] font-extrabold leading-7 text-hercules-ink">
            {allComplete ? 'You’re all set' : 'One step at a time'}
          </Text>
          <Text className="text-sm leading-5 text-hercules-muted">
            {allComplete
              ? 'Your setup is complete. You can revisit any task below.'
              : 'Start with one task. Come back for the rest when you’re ready.'}
          </Text>
        </View>
        <View className="gap-2">
          <Text className="text-xs font-bold text-hercules-blue">
            {completedCount} of {tasks.length} complete
          </Text>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Getting Started completion"
            accessibilityValue={{ min: 0, max: tasks.length, now: completedCount }}
            className="h-1.5 overflow-hidden rounded-pill bg-hercules-blue/10"
          >
            <View
              className="h-full rounded-pill bg-hercules-blue"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </View>
        </View>
      </AnimatedCard>

      {allComplete ? (
        <AnimatedCard index={1}>
          <PrimaryButton
            label="Back to Home"
            onPress={onFinish}
            loading={finishing}
          />
        </AnimatedCard>
      ) : (
        pendingGroups.map((group, groupIndex) => {
          const pendingTasks = group.tasks;

          return (
            <AnimatedCard key={group.title} index={groupIndex + 1} className="gap-2">
              <Text
                accessibilityRole="header"
                className="px-1 text-base font-extrabold text-hercules-ink"
              >
                {group.title}
              </Text>
              <View className="rounded-[20px] border border-hercules-blue/15 bg-hercules-white">
                {pendingTasks.map((task, index) => {
                  const Icon = task.icon;
                  const recommended = task.index === recommendedTask;

                  return (
                    <View
                      key={task.index}
                      className={
                        index < pendingTasks.length - 1
                          ? listStyles.rowDivider
                          : undefined
                      }
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${gettingStartedSteps[task.index]}${recommended ? ', your next task' : ''}`}
                        accessibilityHint="Opens this setup task"
                        onPress={() => onSelectStep(task.index)}
                        className={`${listStyles.compact.row} ${listStyles.pressed}`}
                      >
                        <View className={`${listStyles.compact.icon} ${listStyles.iconContainer} bg-hercules-blue/5`}>
                          <Icon
                            size={listStyles.compact.iconSize}
                            color={colors.blue}
                            strokeWidth={listStyles.iconStrokeWidth}
                          />
                        </View>
                        <View className={listStyles.content}>
                          {recommended ? (
                            <Text className="text-[10px] font-extrabold uppercase tracking-[1px] text-hercules-red">
                              Up next
                            </Text>
                          ) : null}
                          <Text className={listStyles.compact.title}>
                            {gettingStartedSteps[task.index]}
                          </Text>
                          {recommended ? (
                            <Text className={listStyles.subtitle}>
                              {task.description}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight
                          size={listStyles.chevronSize}
                          color={colors.blue}
                          strokeWidth={listStyles.iconStrokeWidth}
                        />
                      </Pressable>
                      {recommended ? (
                        <View className="px-4 pb-4">
                          <PrimaryButton
                            label="Continue"
                            onPress={() => onSelectStep(task.index)}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </AnimatedCard>
          );
        })
      )}

      {completedTasks.length ? (
        <AnimatedCard index={allComplete ? 2 : pendingGroups.length + 1} className="rounded-[20px] border border-hercules-blue/15 bg-hercules-white">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Completed tasks, ${completedCount}`}
            accessibilityState={{ expanded: showCompleted }}
            accessibilityHint={showCompleted ? 'Hides completed tasks' : 'Shows completed tasks to review or edit'}
            onPress={() => setShowCompleted((expanded) => !expanded)}
            className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:opacity-70"
          >
            <Check size={19} color={colors.blue} strokeWidth={2.5} />
            <Text className="min-w-0 flex-1 text-sm font-bold text-hercules-blue">
              Completed ({completedCount})
            </Text>
            <CompletedChevron
              size={listStyles.chevronSize}
              color={colors.blue}
              strokeWidth={listStyles.iconStrokeWidth}
            />
          </Pressable>
          {showCompleted
            ? completedTasks.map((task) => (
                <Pressable
                  key={task.index}
                  accessibilityRole="button"
                  accessibilityLabel={`Review ${gettingStartedSteps[task.index]}, completed`}
                  onPress={() => onSelectStep(task.index)}
                  className="min-h-14 flex-row items-center gap-3 border-t border-hercules-blue/10 px-4 py-3 active:opacity-70"
                >
                  <Check size={17} color={colors.muted} strokeWidth={2.3} />
                  <Text className="min-w-0 flex-1 text-sm font-semibold leading-5 text-hercules-blue">
                    {gettingStartedSteps[task.index]}
                  </Text>
                  <ChevronRight
                    size={listStyles.chevronSize}
                    color={colors.blue}
                    strokeWidth={listStyles.iconStrokeWidth}
                  />
                </Pressable>
              ))
            : null}
        </AnimatedCard>
      ) : null}
    </View>
  );
}
