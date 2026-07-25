import {
  Award,
  BadgeDollarSign,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Gift,
  Home,
  LifeBuoy,
  ListChecks,
  MessageCircle,
  PackageCheck,
  User,
  Users,
} from 'lucide-react-native';
import { NavItem } from './BottomNav';
import { QuickLink } from './QuickLinksMenu';

export const prospectNavItems: NavItem[] = [
  { label: 'Home', href: '/prospect', icon: Home },
  { label: 'Support', href: '/prospect/resources', icon: BookOpen },
  { label: 'Classes', href: '/prospect/classes', icon: CalendarDays },
  { label: 'Profile', href: '/prospect/account', icon: User },
];

export const prospectQuickLinks: QuickLink[] = [
  { label: 'Getting Started', href: '/prospect/getting-started', icon: ListChecks },
  { label: 'Benefits', href: '/prospect/benefits', icon: Gift },
  { label: 'Rebates', href: '/prospect/rebates', icon: BadgeDollarSign },
  { label: 'Classes', href: '/prospect/classes', icon: CalendarDays },
  { label: 'Technical Support', href: '/prospect/resources', icon: BookOpen },
  { label: 'Marketing Consultation', href: '/prospect/marketing', icon: Award },
  { label: 'Messages', href: '/prospect/messages', icon: MessageCircle },
  { label: 'Account', href: '/prospect/account', icon: User },
];

export const managerNavItems: NavItem[] = [
  { label: 'Prospects', href: '/manager', icon: Users },
  { label: 'Leads', href: '/manager/prospects', icon: BriefcaseBusiness },
  { label: 'Messages', href: '/manager/messages', icon: MessageCircle },
  { label: 'Account', href: '/manager/account', icon: User },
];

export const managerQuickLinks: QuickLink[] = [
  { label: 'Assigned Prospects', href: '/manager/prospects', icon: Users },
  { label: 'Messages', href: '/manager/messages', icon: MessageCircle },
  { label: 'Support Resources', href: '/manager/resources', icon: BookOpen },
  { label: 'Classes', href: '/manager/resources', icon: CalendarDays },
  { label: 'Benefits', href: '/manager/resources', icon: PackageCheck },
  { label: 'Account', href: '/manager/account', icon: User },
  { label: 'Support', href: '/manager/messages', icon: LifeBuoy },
];

const normalizePath = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

const prospectHeaderTitles: Record<string, string> = {
  '/prospect': 'LG Dealer Portal',
  '/prospect/account': 'Profile',
  '/prospect/benefits': 'Benefits',
  '/prospect/classes': 'Classes',
  '/prospect/getting-started': 'Getting Started',
  '/prospect/marketing': 'Marketing',
  '/prospect/messages': 'Messages',
  '/prospect/rebates': 'Rebates',
  '/prospect/resources': 'Technical Support',
};

const managerHeaderTitles: Record<string, string> = {
  '/manager': 'Hercules Internal',
  '/manager/account': 'Account',
  '/manager/messages': 'Messages',
  '/manager/prospects': 'Assigned Prospects',
  '/manager/resources': 'Support Resources',
};

export const getProspectHeaderTitle = (pathname: string) =>
  prospectHeaderTitles[normalizePath(pathname)] ?? 'LG Dealer Portal';

export const getManagerHeaderTitle = (pathname: string) =>
  managerHeaderTitles[normalizePath(pathname)] ?? 'Hercules Internal';
