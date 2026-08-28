import type {
  OnboardingSummary,
  ProspectProfile,
  TodoItem,
  User,
} from '../../lib/api/types';

export type JourneyDestination =
  | '/prospect/getting-started'
  | '/prospect/classes'
  | '/prospect/benefits'
  | '/prospect/marketing';

export type JourneyStep = {
  title: string;
  description: string;
  support: string;
  href: JourneyDestination;
  dueAt?: string;
};

export type DealerJourney = {
  completed: number;
  total: number;
  nextStep: JourneyStep;
  phases: Array<{
    title: string;
    description: string;
    complete: boolean;
    active: boolean;
  }>;
};

type JourneyInput = {
  user: User & { prospectProfile?: ProspectProfile };
  summary: OnboardingSummary;
  todos: TodoItem[];
};

export function deriveDealerJourney({
  user,
  summary,
  todos,
}: JourneyInput): DealerJourney {
  const profile = user.prospectProfile;
  const profileComplete = Boolean(
    user.email &&
      user.firstName &&
      user.lastName &&
      profile?.companyName,
  );
  const warrantyTodo = todos.find((todo) => todo.type === 'JB_WARRANTIES');
  const marketingTodo = todos.find(
    (todo) => todo.type === 'MARKETING_CONSULTATION',
  );
  const equipmentTodo = todos.find(
    (todo) => todo.type === 'EQUIPMENT_REGISTRATION',
  );

  const milestones = [
    profileComplete,
    summary.trainingSelected,
    summary.trainingCompleted,
    summary.jbWarrantiesCompleted,
    summary.marketingConsultationSubmitted,
    summary.firstEquipmentRegistered,
  ];

  let nextStep: JourneyStep;

  if (!profileComplete) {
    nextStep = {
      title: 'Confirm Your Business Profile',
      description:
        'Add your contact and company details so Hercules can support Getting Started.',
      support: 'Keeps your onboarding record ready for the next step.',
      href: '/prospect/getting-started',
    };
  } else if (!summary.trainingSelected) {
    nextStep = {
      title: 'Choose Your LG Training',
      description:
        'Save a preferred session, then wait for Hercules to confirm enrollment and logistics.',
      support: 'Helps Hercules guide you to the appropriate training path.',
      href: '/prospect/classes',
      dueAt: todos.find((todo) => todo.type === 'CLASS_SIGNUP')?.dueAt,
    };
  } else if (!summary.trainingCompleted) {
    nextStep = {
      title: 'Training Preference Saved',
      description:
        'Hercules will confirm your session enrollment and next steps.',
      support: 'Complete confirmed training and review current program information.',
      href: '/prospect/classes',
    };
  } else if (!summary.jbWarrantiesCompleted) {
    nextStep = {
      title: 'Enroll in JB Warranties',
      description:
        'Finish your warranty setup and confirm enrollment in Getting Started.',
      support: 'Records your completed warranty setup in the dealer onboarding workflow.',
      href: '/prospect/getting-started',
      dueAt: warrantyTodo?.dueAt ?? profile?.jbWarrantiesDueAt,
    };
  } else if (!summary.marketingConsultationSubmitted) {
    nextStep = {
      title: 'Share Marketing Availability',
      description:
        'Share three times that work for you, then contact Hercules about available support.',
      support: 'Gives Hercules the availability needed to discuss appropriate marketing resources.',
      href: '/prospect/marketing',
      dueAt:
        marketingTodo?.dueAt ?? profile?.marketingConsultationDueAt,
    };
  } else if (!summary.firstEquipmentRegistered) {
    nextStep = {
      title: 'Add Your First LG System',
      description:
        'Save an equipment record in this app for your dealer onboarding.',
      support: 'Completes the current in-app dealer setup.',
      href: '/prospect/getting-started',
      dueAt: equipmentTodo?.dueAt,
    };
  } else {
    nextStep = {
      title: 'Explore Your Dealer Benefits',
      description:
        'Review the programs, support, and tools available through Hercules.',
      support: 'Keeps current program resources and dealer support easy to find.',
      href: '/prospect/benefits',
    };
  }

  const becomeDealerComplete =
    profileComplete && summary.trainingSelected && summary.trainingCompleted;
  const activateBenefitsComplete =
    summary.jbWarrantiesCompleted &&
    summary.marketingConsultationSubmitted &&
    summary.firstEquipmentRegistered;

  return {
    completed: milestones.filter(Boolean).length,
    total: milestones.length,
    nextStep,
    phases: [
      {
        title: 'Become a Dealer',
        description: 'Profile, training selection, and completion',
        complete: becomeDealerComplete,
        active: !becomeDealerComplete,
      },
      {
        title: 'Continue Your Setup',
        description: 'Warranty, marketing, and first-system records',
        complete: activateBenefitsComplete,
        active: becomeDealerComplete && !activateBenefitsComplete,
      },
      {
        title: 'Grow Your Business',
        description: 'Benefits, updates, training, and ongoing support',
        complete: false,
        active: becomeDealerComplete && activateBenefitsComplete,
      },
    ],
  };
}
