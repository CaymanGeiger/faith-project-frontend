import { apiFetch } from './client';
import type { OnboardingAccess } from '../../features/onboarding/access';
import {
  AssignedProspect,
  Benefit,
  ClassEnrollment,
  ClassSession,
  Conversation,
  EquipmentRegistration,
  LeadRecord,
  MarketingConsultation,
  Message,
  OnboardingSummary,
  ProspectProfile,
  Resource,
  TodoItem,
  User,
} from './types';

export const accountApi = {
  me: () => apiFetch<{ user: User & { prospectProfile?: ProspectProfile } }>('/me'),
  update: (body: Partial<User> & { companyName?: string }) =>
    apiFetch<{ user: User }>('/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  acceptLegalTerms: () =>
    apiFetch<{ user: User }>('/me/legal-acceptance', {
      method: 'PATCH',
    }),
  requestDeletion: () =>
    apiFetch<{ completed: boolean; message: string }>(
      '/me/account-deletion-request',
      { method: 'POST' },
    ),
  requestExternalDeletion: (email: string) =>
    apiFetch<{ message: string }>('/account-deletion-requests', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  onboarding: () =>
    apiFetch<{
      profile: ProspectProfile;
      summary: OnboardingSummary;
      access: OnboardingAccess;
    }>('/me/onboarding-status'),
};

export const classesApi = {
  list: (options: RequestInit = {}) =>
    apiFetch<{ classes: ClassSession[] }>('/classes', options),
  enroll: (id: string) =>
    apiFetch<{ enrollment: ClassEnrollment }>(`/classes/${id}/enroll`, {
      method: 'POST',
    }),
  myEnrollments: () =>
    apiFetch<{ enrollments: ClassEnrollment[] }>('/me/classes'),
};

export const equipmentApi = {
  update: (id: string, body: { equipmentName: string; modelNumber: string; serialNumber: string }) => apiFetch<{ equipment: EquipmentRegistration }>(`/me/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  list: () => apiFetch<{ equipment: EquipmentRegistration[] }>('/me/equipment'),
  create: (body: {
    equipmentName: string;
    modelNumber: string;
    serialNumber: string;
  }) =>
    apiFetch<{ equipment: EquipmentRegistration }>('/me/equipment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const resourcesApi = {
  list: () => apiFetch<{ resources: Resource[] }>('/resources'),
};

export const todosApi = {
  list: () => apiFetch<{ todos: TodoItem[] }>('/me/todos'),
  update: (id: string, completed: boolean) =>
    apiFetch<{ todo: TodoItem }>(`/me/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
};

export const benefitsApi = {
  list: () => apiFetch<{ benefits: Benefit[] }>('/benefits'),
};

export const marketingApi = {
  get: () =>
    apiFetch<{ consultation: MarketingConsultation }>(
      '/me/marketing-consultation',
    ),
  handoff: (body: {
    availabilityOptionOne: string;
    availabilityOptionTwo: string;
    availabilityOptionThree: string;
  }) =>
    apiFetch<{ consultation: MarketingConsultation }>(
      '/me/marketing-consultation/handoff',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
};

export const leadsApi = {
  prospects: () =>
    apiFetch<{ prospects: AssignedProspect[] }>('/manager/prospects'),
  prospect: (prospectUserId: string) =>
    apiFetch<{ prospect: AssignedProspect }>(
      `/manager/prospects/${prospectUserId}`,
    ),
  lead: (prospectUserId: string) =>
    apiFetch<{ lead: LeadRecord }>(
      `/manager/prospects/${prospectUserId}/lead`,
    ),
  updateLead: (
    prospectUserId: string,
    body: Pick<Partial<LeadRecord>, 'status' | 'notes'>,
  ) =>
    apiFetch<{ lead: LeadRecord; sync: { synced: boolean; reason?: string } }>(
      `/manager/prospects/${prospectUserId}/lead`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    ),
};

export const conversationsApi = {
  list: (options: RequestInit = {}) =>
    apiFetch<{ conversations: Conversation[] }>('/conversations', options),
  get: (conversationId: string) =>
    apiFetch<{ conversation: Conversation }>(`/conversations/${conversationId}`),
  messages: (conversationId: string, cursor?: string) =>
    apiFetch<{ messages: Message[]; nextCursor: string | null }>(
      `/conversations/${conversationId}/messages${
        cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      }`,
    ),
  reportMessage: (conversationId: string, messageId: string) =>
    apiFetch<{ message: string }>(
      `/conversations/${conversationId}/messages/${messageId}/report`,
      { method: 'POST' },
    ),
  blockParticipant: (conversationId: string) =>
    apiFetch<{ blocked: boolean }>(`/conversations/${conversationId}/block`, {
      method: 'POST',
    }),
  unblockParticipant: (conversationId: string) =>
    apiFetch<{ blocked: boolean }>(`/conversations/${conversationId}/block`, {
      method: 'DELETE',
    }),
};
