import type { ClassSession } from '../../lib/api/types';
export const isUpcomingTraining = (session: ClassSession) => session.status === 'SCHEDULED' && Date.parse(session.startsAt) > Date.now();
export const isSavedTraining = (session: ClassSession) => session.enrollmentStatus === 'ENROLLED' || session.enrollmentStatus === 'COMPLETED' || (!session.enrollmentStatus && Boolean(session.isEnrolled));
export const isValidTrainingSelection = (session: ClassSession) => session.enrollmentStatus === 'COMPLETED' || (session.status !== 'CANCELED' && isSavedTraining(session));
