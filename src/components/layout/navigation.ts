import {
  Award,
  BadgeDollarSign,
  BookOpen,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  Gift,
  Home,
  ListChecks,
  MessageCircle,
  PackageCheck,
  User,
  Users,
} from 'lucide-react-native';
import type { NavItem } from './BottomNav';
import type { QuickLink } from './QuickLinksMenu';

export const prospectNavItems: NavItem[] = [
  { label: 'Home', href: '/prospect', icon: Home },
  { label: 'Support', href: '/prospect/resources', icon: BookOpen },
  { label: 'Training', href: '/prospect/classes', icon: CalendarDays },
  { label: 'Profile', href: '/prospect/account', icon: User },
];

export const prospectQuickLinks: QuickLink[] = [
  { label: 'Get Started', href: '/prospect/getting-started', icon: ListChecks },
  { label: 'Existing Dealer', href: '/prospect/already-a-dealer', icon: Building2 },
  { label: 'Benefits', href: '/prospect/benefits', icon: Gift },
  { label: 'Rebates', href: '/prospect/rebates', icon: BadgeDollarSign },
  { label: 'Training', href: '/prospect/classes', icon: CalendarDays },
  { label: 'Technical Support', href: '/prospect/resources', icon: BookOpen },
  { label: 'Marketing consultation', href: '/prospect/marketing', icon: Award },
  { label: 'Chat', href: '/prospect/messages', icon: MessageCircle },
  { label: 'Account', href: '/prospect/account', icon: User },
];

export const managerNavItems: NavItem[] = [
  { label: 'Success', href: '/manager', icon: Users },
  { label: 'Dealers', href: '/manager/prospects', icon: BriefcaseBusiness },
  { label: 'Chat', href: '/manager/messages', icon: MessageCircle },
  { label: 'Account', href: '/manager/account', icon: User },
];

export const managerQuickLinks: QuickLink[] = [
  { label: 'Dealer Success', href: '/manager/prospects', icon: Users },
  { label: 'Chat', href: '/manager/messages', icon: MessageCircle },
  { label: 'Support Resources', href: '/manager/resources', icon: BookOpen },
  { label: 'Training', href: '/manager/resources', icon: CalendarDays },
  { label: 'Benefits', href: '/manager/resources', icon: PackageCheck },
  { label: 'Account', href: '/manager/account', icon: User },
];

const normalizePath = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

const prospectHeaderTitles: Record<string, string> = {
  '/prospect': 'Home',
  '/prospect/already-a-dealer': 'Existing Dealer',
  '/prospect/account': 'Profile',
  '/prospect/benefits': 'Benefits',
  '/prospect/classes': 'Training',
  '/prospect/getting-started': 'Getting Started',
  '/prospect/marketing': 'Marketing consultation',
  '/prospect/messages': 'Chat',
  '/prospect/rebates': 'Rebates',
  '/prospect/resources': 'Technical Support',
};

const managerHeaderTitles: Record<string, string> = {
  '/manager': 'Dealer Success',
  '/manager/account': 'Account',
  '/manager/messages': 'Chat',
  '/manager/prospects': 'Dealers',
  '/manager/resources': 'Support Resources',
};

export const getProspectHeaderTitle = (pathname: string) =>
  prospectHeaderTitles[normalizePath(pathname)] ?? 'Home';

export const getManagerHeaderTitle = (pathname: string) =>
  managerHeaderTitles[normalizePath(pathname)] ?? 'Dealer Success';
