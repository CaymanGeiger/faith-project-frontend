import { Text } from 'react-native';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { chatStyles } from '../../../lib/theme/chatStyles';

export function ChatHeading() {
  return (
    <AnimatedCard index={0} className={chatStyles.heading.container}>
      <Text accessibilityRole="header" className={chatStyles.heading.title}>Chat</Text>
    </AnimatedCard>
  );
}
