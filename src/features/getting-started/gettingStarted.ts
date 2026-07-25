import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ClassSession,
  EquipmentRegistration,
  MarketingConsultation,
  ProspectProfile,
  TodoItem,
  User,
} from '../../lib/api/types';

const gettingStartedDraftKey = (userId: string) =>
  `@hercules/getting-started-draft:${userId}`;

export const gettingStartedSteps = [
  'Business Profile',
  'Equipment',
  'Certification',
  'JB Warranties',
  'Marketing',
  'Review',
] as const;

export type GettingStartedData = {
  user: User & { prospectProfile?: ProspectProfile };
  classes: ClassSession[];
  equipment: EquipmentRegistration[];
  todos: TodoItem[];
  consultation: MarketingConsultation;
};

export type GettingStartedAction = {
  label: string;
  onPress: () => void;
  onSaveForLater?: () => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
};

export type GettingStartedActionChange = (
  action: GettingStartedAction,
) => void;

export type GettingStartedDraft = {
  currentStep?: number;
  profile?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    companyName: string;
  };
  equipment?: {
    equipmentName: string;
    modelNumber: string;
    serialNumber: string;
  };
  classSessionId?: string;
  marketing?: {
    optionOne: string;
    optionTwo: string;
    optionThree: string;
  };
};

export async function getGettingStartedDraft(
  userId: string,
): Promise<GettingStartedDraft | null> {
  const storageKey = gettingStartedDraftKey(userId);
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as GettingStartedDraft;
  } catch {
    await AsyncStorage.removeItem(storageKey);
    return null;
  }
}

export async function saveGettingStartedDraft(
  userId: string,
  update: Partial<GettingStartedDraft>,
) {
  const existing = (await getGettingStartedDraft(userId)) ?? {};
  await AsyncStorage.setItem(
    gettingStartedDraftKey(userId),
    JSON.stringify({ ...existing, ...update }),
  );
}

export async function clearGettingStartedDraftFields(
  userId: string,
  ...fields: (keyof GettingStartedDraft)[]
) {
  const storageKey = gettingStartedDraftKey(userId);
  const existing = await getGettingStartedDraft(userId);
  if (!existing) {
    return;
  }

  fields.forEach((field) => {
    delete existing[field];
  });

  if (Object.keys(existing).length === 0) {
    await AsyncStorage.removeItem(storageKey);
    return;
  }

  await AsyncStorage.setItem(storageKey, JSON.stringify(existing));
}

export async function clearGettingStartedDraft(userId: string) {
  await AsyncStorage.removeItem(gettingStartedDraftKey(userId));
}

export function getGettingStartedCompletion(data: GettingStartedData) {
  const profile = data.user.prospectProfile;
  return [
    Boolean(
      data.user.email &&
        data.user.firstName &&
        data.user.lastName &&
        data.user.phone &&
        profile?.companyName,
    ),
    data.equipment.length > 0,
    data.classes.some((session) => session.isEnrolled),
    data.todos.some(
      (todo) => todo.type === 'JB_WARRANTIES' && todo.status === 'COMPLETED',
    ),
    Boolean(data.consultation.submittedAt),
  ];
}

export function getFirstIncompleteStep(completion: boolean[]) {
  const incomplete = completion.findIndex((complete) => !complete);
  return incomplete === -1 ? gettingStartedSteps.length - 1 : incomplete;
}
