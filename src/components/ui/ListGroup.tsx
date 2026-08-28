import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function ListGroup({ children }: PropsWithChildren) {
  return (
    <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
      {children}
    </View>
  );
}
