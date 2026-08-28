import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { inputStyles } from '../../../components/ui/inputStyles';
import { colors } from '../../../lib/theme/theme';

type MessageComposerProps = {
  onSend: (body: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
};

export function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || disabled || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setBody('');
      onTypingStop();
    } finally {
      setSending(false);
    }
  };
  const canSend = body.trim().length > 0 && !disabled && !sending;

  return (
    <View className="flex-row items-end gap-2 border-t border-hercules-blue/10 pt-3">
      <TextInput
        value={body}
        onChangeText={(value) => {
          setBody(value);
          if (value.length > 0) onTypingStart();
          if (value.length === 0) onTypingStop();
        }}
        placeholder="Message"
        placeholderTextColor={colors.muted}
        selectionColor={colors.blue}
        multiline
        maxLength={2_000}
        editable={!disabled && !sending}
        style={inputStyles.multiline}
        className="max-h-28 min-h-12 flex-1 rounded-[20px] border border-hercules-blue/20 bg-hercules-white px-4 py-[13px] text-base text-hercules-ink"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={() => void send()}
        className={`h-12 w-12 items-center justify-center rounded-full bg-hercules-blue active:opacity-80 ${
          canSend ? 'opacity-100' : 'opacity-40'
        }`}
      >
        <Send size={20} color={colors.white} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
