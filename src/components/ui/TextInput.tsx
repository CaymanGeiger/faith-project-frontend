import { Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { feedbackTiming } from '../../lib/feedbackMotion';
import { motionConfig } from '../../lib/motionConfig';
import { colors } from '../../lib/theme/theme';
import { inputStyles } from './inputStyles';
import { componentStyles } from '../../lib/theme/componentStyles';

const motion = motionConfig.feedback;


const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);
const styles = componentStyles.input;

type AppTextInputProps = {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  maxLength?: number;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  compact?: boolean;
};

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize,
  multiline,
  compact = false,
  editable,
  autoCorrect,
  autoComplete,
  textContentType,
  maxLength,
}: AppTextInputProps) {
  const semanticProps = inputSemantics(label, Boolean(secureTextEntry));
  const focusProgress = useSharedValue<number>(motion.progress.idle);

  const focusStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [motion.progress.idle, motion.progress.active],
      [styles.unfocusedBorderColor, colors.blue],
    ),
  }));

  const setFocused = (focused: boolean) => {
    focusProgress.value = withTiming(
      focused ? motion.progress.active : motion.progress.idle,
      focused ? feedbackTiming.focus : feedbackTiming.blur,
    );
  };

  return (
    <View className={compact ? styles.compactWrapper : styles.wrapper}>
      <Text className={styles.label}>{label}</Text>
      <AnimatedTextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        selectionColor={colors.blue}
        secureTextEntry={secureTextEntry === true}
        editable={editable}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        autoComplete={autoComplete ?? semanticProps.autoComplete}
        textContentType={textContentType ?? semanticProps.textContentType}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[
          multiline ? inputStyles.multiline : inputStyles.singleLine,
          focusStyle,
        ]}
        className={`${styles.container} ${
          multiline
            ? styles.size.multiline
            : compact
              ? styles.size.compact
              : styles.size.regular
        }`}
      />
    </View>
  );
}

function inputSemantics(label: string, secure: boolean) {
  if (secure) {
    return { autoComplete: 'current-password' as const, textContentType: 'password' as const };
  }
  if (label === 'Email') {
    return { autoComplete: 'email' as const, textContentType: 'emailAddress' as const };
  }
  if (label === 'First Name') {
    return { autoComplete: 'given-name' as const, textContentType: 'givenName' as const };
  }
  if (label === 'Last Name') {
    return { autoComplete: 'family-name' as const, textContentType: 'familyName' as const };
  }
  if (label === 'Phone') {
    return { autoComplete: 'tel' as const, textContentType: 'telephoneNumber' as const };
  }
  return { autoComplete: 'off' as const, textContentType: 'none' as const };
}
