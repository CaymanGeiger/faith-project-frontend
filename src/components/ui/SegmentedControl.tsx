import { Pressable, Text, View } from 'react-native';

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'compact' | 'regular';
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'compact',
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-[18px] border border-hercules-blue bg-hercules-white p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={`${size === 'regular' ? 'min-h-11' : 'min-h-10'} flex-1 items-center justify-center rounded-[14px] ${
              active ? 'bg-hercules-blue' : ''
            }`}
          >
            <Text
              numberOfLines={1}
              className={`text-center font-extrabold ${
                size === 'regular' ? 'text-sm' : 'text-[10px]'
              } ${
                active ? 'text-hercules-white' : 'text-hercules-blue'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
