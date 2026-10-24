import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { isValidTrainingSelection } from './trainingAvailability';
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
const gettingStartedSecureDraftKey = (userId: string) =>
  `hercules.getting-started-draft.${userId}`;

async function hasSecureDraftStorage() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export const gettingStartedSteps = [
  'Business Profile',
  'Training',
  'JB Warranties',
  'Marketing Consultation',
  'First LG System',
  'Review',
] as const;

export const gettingStartedStepKeys = [
  'profile',
  'training',
  'warranties',
  'marketing',
  'equipment',
] as const;

export function getGettingStartedStepIndex(step?: string) {
  if (!step) {
    return null;
  }

  const index = gettingStartedStepKeys.indexOf(
    step as (typeof gettingStartedStepKeys)[number],
  );
  return index === -1 ? null : index;
}

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
  const secureStorageKey = gettingStartedSecureDraftKey(userId);
  const secureStorageAvailable = await hasSecureDraftStorage();
  let stored = secureStorageAvailable
    ? await SecureStore.getItemAsync(secureStorageKey)
    : null;
  if (!stored) {
    const legacyStored = await AsyncStorage.getItem(storageKey);
    if (legacyStored && secureStorageAvailable) {
      await SecureStore.setItemAsync(secureStorageKey, legacyStored);
      await AsyncStorage.removeItem(storageKey);
    }
    stored = legacyStored;
  }
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as GettingStartedDraft;
  } catch {
    await Promise.all(
      [
        secureStorageAvailable
          ? SecureStore.deleteItemAsync(secureStorageKey)
          : null,
        AsyncStorage.removeItem(storageKey),
      ].filter((operation): operation is Promise<void> => Boolean(operation)),
    );
    return null;
  }
}

export async function saveGettingStartedDraft(
  userId: string,
  update: Partial<GettingStartedDraft>,
) {
  const existing = (await getGettingStartedDraft(userId)) ?? {};
  const storageKey = gettingStartedDraftKey(userId);
  const secureStorageKey = gettingStartedSecureDraftKey(userId);
  const value = JSON.stringify({ ...existing, ...update });
  if (await hasSecureDraftStorage()) {
    await SecureStore.setItemAsync(secureStorageKey, value);
    await AsyncStorage.removeItem(storageKey);
    return;
  }
  await AsyncStorage.setItem(storageKey, value);
}

export async function clearGettingStartedDraftFields(
  userId: string,
  ...fields: (keyof GettingStartedDraft)[]
) {
  const storageKey = gettingStartedDraftKey(userId);
  const secureStorageKey = gettingStartedSecureDraftKey(userId);
  const existing = await getGettingStartedDraft(userId);
  if (!existing) {
    return;
  }

  fields.forEach((field) => {
    delete existing[field];
  });

  if (Object.keys(existing).length === 0) {
    await clearGettingStartedDraft(userId);
    return;
  }

  const value = JSON.stringify(existing);
  if (await hasSecureDraftStorage()) {
    await SecureStore.setItemAsync(secureStorageKey, value);
    await AsyncStorage.removeItem(storageKey);
    return;
  }
  await AsyncStorage.setItem(storageKey, value);
}

export async function clearGettingStartedDraft(userId: string) {
  const storageKey = gettingStartedDraftKey(userId);
  const secureStorageKey = gettingStartedSecureDraftKey(userId);
  const secureStorageAvailable = await hasSecureDraftStorage();
  await Promise.all(
    [
      secureStorageAvailable
        ? SecureStore.deleteItemAsync(secureStorageKey)
        : null,
      AsyncStorage.removeItem(storageKey),
    ].filter((operation): operation is Promise<void> => Boolean(operation)),
  );
}

export function getGettingStartedCompletion(data: GettingStartedData) {
  const profile = data.user.prospectProfile;
  return [
    Boolean(
        data.user.email &&
        data.user.firstName &&
        data.user.lastName &&
        profile?.companyName,
    ),
    data.user.onboarding?.state === 'TRAINING_VERIFIED' || data.classes.some(isValidTrainingSelection),
    data.todos.some(
      (todo) => todo.type === 'JB_WARRANTIES' && todo.status === 'COMPLETED',
    ),
    Boolean(data.consultation.submittedAt),
    data.equipment.length > 0,
  ];
}

export function getFirstIncompleteStep(completion: boolean[]) {
  const incomplete = completion.findIndex((complete) => !complete);
  return incomplete === -1 ? gettingStartedSteps.length - 1 : incomplete;
}

export function getGettingStartedResumeStep(
  completion: boolean[],
  savedStep?: number,
) {
  if (
    typeof savedStep === 'number' &&
    Number.isInteger(savedStep) &&
    savedStep >= 0 &&
    savedStep < gettingStartedSteps.length
  ) {
    return savedStep;
  }
  return getFirstIncompleteStep(completion);
}
