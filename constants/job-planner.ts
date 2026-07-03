import { PlannerSafetyChecklistItem } from '@/types/index';

// Default pre-job checklist template applied to every new job — not mock data, this is a
// real static safety checklist, just seeded with default completion state.
export const DEFAULT_PLANNER_SAFETY_CHECKLIST: PlannerSafetyChecklistItem[] = [
  { id: 'pcl-1', label: 'PPE confirmed', required: true, completed: true, appliesTo: 'all' },
  { id: 'pcl-2', label: 'Ventilation verified', required: true, completed: true, appliesTo: ['A2L', 'A3'] },
  { id: 'pcl-3', label: 'Ignition sources isolated', required: true, completed: false, appliesTo: ['A2L', 'A3'] },
  { id: 'pcl-4', label: 'Leak detector available', required: true, completed: true, appliesTo: 'all' },
  { id: 'pcl-5', label: 'Pre-job briefing signed', required: true, completed: true, appliesTo: 'all' },
];
