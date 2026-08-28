import { Pressable, Text, View } from 'react-native';
import { Message } from '../../../lib/api/types';
import { formatTime } from '../../../lib/format';

export function MessageBubble({
  message,
  mine,
  onReport,
}: {
  message: Message;
  mine: boolean;
  onReport?: (message: Message) => void;
}) {
  return (
    <View className={`w-full ${mine ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] gap-1 rounded-[18px] px-4 py-[10px] ${
          mine
            ? 'bg-hercules-red'
            : 'border border-hercules-blue/15 bg-hercules-white'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            mine ? 'text-hercules-white' : 'text-hercules-ink'
          }`}
        >
          {message.body}
        </Text>
        <View className={`flex-row items-center gap-3 ${mine ? 'self-end' : 'self-start'}`}>
          <Text
            className={`text-[11px] font-bold leading-4 ${
              mine ? 'text-hercules-white/75' : 'text-hercules-muted'
            }`}
          >
            {formatTime(message.createdAt)}
          </Text>
          {!mine && onReport ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Report this message"
              onPress={() => onReport(message)}
              className="min-h-6 justify-center"
            >
              <Text className="text-[11px] font-extrabold text-hercules-red">
                Report
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
