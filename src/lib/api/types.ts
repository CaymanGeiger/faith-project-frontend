export type UserRole = 'PROSPECT' | 'SALES_MANAGER';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  termsAcceptedAt: string | null;
  termsVersion: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type ProspectProfile = {
  id: string;
  userId: string;
  companyName: string;
  signupDate: string;
  assignedSalesManagerId: string;
  certificationStatus: string;
  marketingConsultationDueAt: string;
  marketingConsultationCompletedAt: string | null;
  jbWarrantiesDueAt: string;
  jbWarrantiesCompletedAt: string | null;
};

export type ClassSession = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  virtualUrl: string;
  status: string;
  isEnrolled?: boolean;
  enrollmentStatus?: 'ENROLLED' | 'COMPLETED' | 'CANCELED' | null;
};

export type ClassEnrollment = {
  id: string;
  status: string;
  classSession: ClassSession;
};

export type EquipmentRegistration = {
  id: string;
  equipmentName: string;
  modelNumber: string;
  serialNumber: string;
  status: string;
  createdAt: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  url: string;
  category: string;
};

export type TodoItem = {
  id: string;
  title: string;
  description: string;
  type:
    | 'CLASS_SIGNUP'
    | 'EQUIPMENT_REGISTRATION'
    | 'MARKETING_CONSULTATION'
    | 'JB_WARRANTIES'
    | 'RESOURCE_REVIEW';
  dueAt: string;
  completedAt: string | null;
  status: 'OPEN' | 'COMPLETED';
};

export type Benefit = {
  id: string;
  title: string;
  description: string;
  benefitType: string;
  url: string;
};

export type MarketingConsultation = {
  id: string;
  availabilityOptionOne: string | null;
  availabilityOptionTwo: string | null;
  availabilityOptionThree: string | null;
  externalSubmissionStatus: string;
  submittedAt: string | null;
  completedAt: string | null;
};

export type OnboardingSummary = {
  openTodos: number;
  completedTodos: number;
  classEnrollments: number;
  equipmentRegistrations: number;
  marketingConsultationStatus: string;
  trainingSelected: boolean;
  trainingCompleted: boolean;
  firstEquipmentRegistered: boolean;
  jbWarrantiesCompleted: boolean;
  marketingConsultationSubmitted: boolean;
  marketingConsultationCompleted: boolean;
};

export type LeadRecord = {
  id: string;
  prospectUserId: string;
  assignedSalesManagerId: string;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CERTIFIED' | 'LOST';
  notes: string | null;
  externalLeadId: string | null;
};

export type AssignedProspect = ProspectProfile & {
  user: User;
};

export type ConversationParticipant = {
  id: string;
  userId: string;
  lastReadAt: string | null;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'role'>;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  currentUserLastReadAt?: string | null;
  unreadCount?: number;
  lastMessage?: Message | null;
  currentUserHasBlockedParticipant?: boolean;
  currentUserIsBlocked?: boolean;
  participants: ConversationParticipant[];
};
