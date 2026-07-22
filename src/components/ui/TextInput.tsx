import { Text, TextInput as RNTextInput, View } from 'react-native';
import { colors } from '../../lib/theme/theme';
import { inputStyles } from './inputStyles';

type AppTextInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
};

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  multiline,
}: AppTextInputProps) {
  const semanticProps = inputSemantics(label, Boolean(secureTextEntry));

  return (
    <View className="gap-2">
      <Text className="text-sm font-bold text-hercules-ink">{label}</Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry === true}
        autoComplete={semanticProps.autoComplete}
        textContentType={semanticProps.textContentType}
        keyboardType={keyboardType}
        multiline={multiline}
        style={multiline ? inputStyles.multiline : inputStyles.singleLine}
        className={`rounded-[18px] border border-hercules-blue bg-hercules-white px-4 text-base text-hercules-ink ${
          multiline ? 'min-h-24 py-3' : 'h-14 py-0'
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
