import { Pressable, Text, View } from 'react-native';
import { Message } from '../../../lib/api/types';
import { formatTime } from '../../../lib/format';
import { chatStyles } from '../../../lib/theme/chatStyles';

const styles = chatStyles.message;

export function MessageBubble({ message, mine, senderName, onReport }: {
  message: Message;
  mine: boolean;
  senderName: string;
  onReport?: (message: Message) => void;
}) {
  const bubbleClass = `${styles.bubble} ${mine
    ? styles.outgoing.bubble
    : styles.incoming.bubble}`;
  const body = <Text className={`${styles.body} ${mine ? styles.outgoing.body : styles.incoming.body}`}>{message.body}</Text>;
  return <View className={`${styles.row} ${mine ? styles.outgoing.alignment : styles.incoming.alignment}`}>
    <View className={styles.container}>
      {!mine && onReport ? <Pressable
        accessibilityRole="text"
        accessibilityLabel={`${senderName}: ${message.body}`}
        accessibilityHint="Touch and hold to report this message."
        accessibilityActions={[{ name: 'report', label: 'Report message' }]}
        onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'report') onReport(message); }}
        onLongPress={() => onReport(message)}
        className={bubbleClass}
      >{body}</Pressable> : <View className={bubbleClass}>{body}</View>}
      <Text className={`${styles.metadata} ${mine ? styles.outgoing.metadata : styles.incoming.metadata}`}>
        {mine ? 'You' : senderName} · {formatTime(message.createdAt)}
      </Text>
    </View>
  </View>;
}
