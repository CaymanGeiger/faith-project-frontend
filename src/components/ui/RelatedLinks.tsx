import { router } from 'expo-router';
import type { Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { ListItem } from './ListItem';
import { SectionHeader } from './SectionHeader';

export type RelatedLink = {
  title: string;
  description: string;
  href: Href;
  icon: LucideIcon;
  tone: 'red' | 'blue';
};

type RelatedLinksProps = {
  title: string;
  links: RelatedLink[];
};

export function RelatedLinks({ title, links }: RelatedLinksProps) {
  return (
    <View className="gap-3">
      <SectionHeader title={title} />
      <View className="gap-3">
        {links.map((link) => (
          <ListItem
            key={link.title}
            title={link.title}
            subtitle={link.description}
            icon={link.icon}
            iconTone={link.tone}
            onPress={() => router.push(link.href)}
          />
        ))}
      </View>
    </View>
  );
}
