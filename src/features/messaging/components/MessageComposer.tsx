import { ArrowUp } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { inputStyles } from '../../../components/ui/inputStyles';
import { colors } from '../../../lib/theme/theme';
import { chatStyles } from '../../../lib/theme/chatStyles';

const styles = chatStyles.composer;

type MessageComposerProps = {
  onSend: (body: string, clientMessageId: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  recipientName?: string;
};

export function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  recipientName,
}: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const pending = useRef<{ body: string; id: string } | null>(null);
  const inFlight = useRef(false);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || disabled || inFlight.current) return;
    inFlight.current = true;
    if (pending.current?.body !== trimmed) {
      pending.current = { body: trimmed, id: `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}` };
    }
    setSending(true);
    try {
      await onSend(trimmed, pending.current.id);
      pending.current = null;
      setBody('');
      onTypingStop();
    } catch {
      // The thread displays the delivery error. Keep both draft and retry ID.
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };
  const canSend = body.trim().length > 0 && !disabled && !sending;

  return (
    <View className={styles.container}>
      <TextInput
        value={body}
        onChangeText={(value) => {
          setBody(value);
          if (value.length > 0) onTypingStart();
          if (value.length === 0) onTypingStop();
        }}
        accessibilityLabel="Message"
        placeholder={recipientName ? `Message ${recipientName}…` : 'Message…'}
        placeholderTextColor={colors.muted}
        selectionColor={colors.blue}
        multiline
        maxLength={2_000}
        editable={!disabled && !sending}
        style={inputStyles.multiline}
        className={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={() => void send()}
        className={`${styles.send} ${
          canSend ? styles.enabled : styles.disabled
        }`}
      >
        <ArrowUp size={styles.sendIconSize} color={colors.white} strokeWidth={styles.sendIconStrokeWidth} />
      </Pressable>
    </View>
  );
}
