import type { Metric, Mission, Scenario, Session, Snapshot } from '../domain/types.ts';
import type { WorkItem } from '../services/follow-up.ts';
import type { ClinicalData } from '../domain/clinical.ts';
import type { ExerciseData } from '../domain/exercise.ts';
import type { VoiceState } from '../adapters/voice.ts';

export const pageNames = { health: 'Health', assist: 'Assist', exercise: 'Exercise', profiles: 'Profiles' };
export type Page = keyof typeof pageNames;

export const concerns = [
  'Feeling unwell',
  'Vision or balance concern',
  'Pain or injury',
  'Device concern',
  'Other concern',
];

export interface ViewState {
  healthMode: 'crew' | 'personal';
  profileTab: 'overview' | 'crew' | 'mission' | 'sensors';
  trendMetric: Metric;
  trendWindow: 'recent' | 'full';
  workId: string | null;
  reportOpen: boolean;
  notice: string;
  error: string;
  saving: boolean;
  voice: VoiceState;
}

export interface ViewModel {
  page: Page;
  mission: Mission;
  scenario: Scenario;
  session: Session;
  snapshot: Snapshot;
  state: ViewState;
  work: WorkItem[];
  playing: boolean;
  persistent: boolean;
  clinical: ClinicalData | null;
  clinicalError: string;
  exercise: ExerciseData | null;
  exerciseError: string;
  guided: boolean;
  tourStep: number;
  nextEvent?: Scenario['milestones'][number];
  href: (page: Page, workId?: string) => string;
  asset: (path: string) => string;
}

export function currentPerson(vm: ViewModel) {
  return vm.mission.crew.find(person => person.id === vm.session.crewId)!;
}

function profileHref(vm: ViewModel, section: 'mission' | 'sensors') {
  const url = new URL(vm.href('profiles'));
  url.searchParams.set('by_star_profile', section);
  return url.href;
}

export function sensorsHref(vm: ViewModel) {
  return profileHref(vm, 'sensors');
}

export function missionScheduleHref(vm: ViewModel) {
  return profileHref(vm, 'mission');
}

export function checkInHref(vm: ViewModel) {
  const url = new URL(vm.href('health'));
  url.searchParams.set('by_star_health', 'personal');
  url.searchParams.set('by_star_checkin', '1');
  return url.href;
}

export function personName(vm: ViewModel, id: string | undefined) {
  return vm.mission.crew.find(person => person.id === id)?.name ?? 'Unassigned';
}

export function zoneName(vm: ViewModel, id: string | undefined) {
  return vm.mission.zones.find(zone => zone.id === id)?.name ?? 'Unknown zone';
}

export function clock(mission: Mission, atS: number, seconds = true) {
  return new Date(Date.parse(mission.startUtc) + atS * 1000).toISOString().slice(11, seconds ? 19 : 16);
}

export function elapsed(atS: number) {
  return Math.floor(atS / 60).toString().padStart(2, '0') + ':' + (atS % 60).toString().padStart(2, '0');
}
