import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { QuickLink } from './QuickLinksMenu';

type AppScreenProps = PropsWithChildren<{
  title: string;
  quickLinks: QuickLink[];
  alertHref: string;
  scroll?: boolean;
  surface?: 'white';
  contentContainerClassName?: string;
}>;

export function AppScreen({
  scroll = true,
  surface = 'white',
  contentContainerClassName = 'gap-4 px-5 pb-28 pt-4',
  children,
}: AppScreenProps) {
  const backgroundClass = 'bg-hercules-white';

  return (
    <View className={`flex-1 ${backgroundClass}`}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={contentContainerClassName}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${contentContainerClassName}`}>
          {children}
        </View>
      )}
    </View>
  );
}
