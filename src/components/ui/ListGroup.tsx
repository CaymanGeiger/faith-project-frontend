import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { componentStyles } from '../../lib/theme/componentStyles';

export function ListGroup({ children }: PropsWithChildren) {
  return (
    <View className={componentStyles.listItem.group}>
      {children}
    </View>
  );
}
