import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { inputStyles } from '../../../components/ui/inputStyles';
import { colors } from '../../../lib/theme/theme';

type MessageComposerProps = {
  onSend: (body: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
};

export function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
}: MessageComposerProps) {
  const [body, setBody] = useState('');

  const send = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setBody('');
    onTypingStop();
  };

  return (
    <View className="flex-row items-end gap-3 rounded-[22px] bg-hercules-white p-3">
      <TextInput
        value={body}
        onChangeText={(value) => {
          setBody(value);
          if (value.length > 0) onTypingStart();
          if (value.length === 0) onTypingStop();
        }}
        placeholder="Message"
        placeholderTextColor={colors.muted}
        multiline
        style={inputStyles.multiline}
        className="max-h-28 min-h-11 flex-1 rounded-[18px] border border-hercules-blue bg-hercules-white px-4 py-3 text-base text-hercules-ink"
      />
      <Pressable
        accessibilityLabel="Send message"
        onPress={send}
        className="h-11 w-11 items-center justify-center rounded-full bg-hercules-blue active:opacity-80"
      >
        <Send size={20} color={colors.white} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
