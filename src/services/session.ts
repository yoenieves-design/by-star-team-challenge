import type { Scenario, Session } from '../domain/types.ts';

export function newSession(scenario: Scenario, anchorS = scenario.briefingAtS): Session {
  return {
    version: 1, scenarioId: scenario.id, anchorS, playingSince: null,
    speed: 1, crewId: scenario.defaultCrewId, simple: false, activity: [],
  };
}

export function position(session: Session, scenario: Scenario, now: number) {
  const elapsed = session.playingSince === null ? 0 : Math.max(0, (now - session.playingSince) / 1000) * session.speed;
  return Math.max(0, Math.min(scenario.durationS, session.anchorS + elapsed));
}

export function isPlaying(session: Session, scenario: Scenario, now: number) {
  return session.playingSince !== null && position(session, scenario, now) < scenario.durationS;
}

export function stopAt(session: Session, anchorS: number): Session {
  return { ...session, anchorS, playingSince: null };
}
