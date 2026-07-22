import { Text, View } from 'react-native';
import { Message } from '../../../lib/api/types';
import { formatTime } from '../../../lib/format';

export function MessageBubble({
  message,
  mine,
}: {
  message: Message;
  mine: boolean;
}) {
  return (
    <View className={`w-full ${mine ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[82%] gap-1 rounded-[20px] px-4 py-3 ${
          mine
            ? 'bg-hercules-red'
            : 'border border-hercules-blue/20 bg-hercules-white'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            mine ? 'text-hercules-white' : 'text-hercules-ink'
          }`}
        >
          {message.body}
        </Text>
        <Text
          className={`text-xs font-bold ${
            mine ? 'text-hercules-white/75' : 'text-hercules-muted'
          }`}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
