import type { Metric, Mission, Scenario, Session, Snapshot } from '../domain/types.ts';
import type { WorkItem } from '../services/follow-up.ts';

export const pageNames = { health: 'Health', assist: 'Assist', profiles: 'Profiles' };
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
  profileTab: 'overview' | 'crew' | 'mission' | 'evidence';
  trendMetric: Metric;
  trendWindow: 'recent' | 'full';
  workId: string | null;
  reportOpen: boolean;
  notice: string;
  error: string;
  saving: boolean;
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
  nextEvent?: Scenario['milestones'][number];
  href: (page: Page, workId?: string) => string;
  asset: (path: string) => string;
}

export function currentPerson(vm: ViewModel) {
  return vm.mission.crew.find(person => person.id === vm.session.crewId)!;
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
