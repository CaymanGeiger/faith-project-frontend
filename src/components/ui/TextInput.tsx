import { Text, TextInput as RNTextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration, motionEasing } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';
import { inputStyles } from './inputStyles';

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

type AppTextInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
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
}: AppTextInputProps) {
  const semanticProps = inputSemantics(label, Boolean(secureTextEntry));
  const focusProgress = useSharedValue(0);

  const focusStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(10, 45, 127, 0.22)', colors.blue],
    ),
  }));

  const setFocused = (focused: boolean) => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: motionDuration.micro,
      easing: focused ? motionEasing.enter : motionEasing.exit,
      reduceMotion: ReduceMotion.System,
    });
  };

  return (
    <View className={compact ? 'gap-1.5' : 'gap-2'}>
      <Text className="text-sm font-bold text-hercules-ink">{label}</Text>
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
        autoComplete={semanticProps.autoComplete}
        textContentType={semanticProps.textContentType}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[
          multiline ? inputStyles.multiline : inputStyles.singleLine,
          focusStyle,
        ]}
        className={`rounded-[14px] border border-hercules-blue bg-hercules-white px-4 text-base text-hercules-ink ${
          multiline
            ? 'min-h-24 py-3'
            : compact
              ? 'h-12 py-0'
              : 'h-14 py-0'
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
