/** Shared navigation and demonstration-only rules. No clinical thresholds. */
export const pages = [
  ['dashboard', 'My status', 'star_dashboard'],
  ['daily-log', 'Daily log', 'star_daily_log'],
  ['indicators', 'Indicators', 'star_indicators'],
  ['actions', 'Alerts & actions', 'star_actions'],
  ['environment', 'Environment', 'star_environment'],
  ['wellbeing', 'Wellbeing plan', 'star_wellbeing'],
  ['report', 'Health report', 'star_report'],
  ['profile', 'Profile & mission', 'star_profile'],
];
export const fields = [
  { key: 'sleep', label: 'Sleep', unit: 'hours', min: 0, max: 24, step: 0.1 },
  { key: 'fatigue', label: 'Fatigue', unit: '1 low – 5 high', min: 1, max: 5, step: 1 },
  { key: 'mood', label: 'Mood', unit: '1 low – 5 high', min: 1, max: 5, step: 1 },
  { key: 'exercise', label: 'Exercise', unit: 'minutes', min: 0, max: 1440, step: 1 },
  { key: 'pulse', label: 'Resting heart rate', unit: 'bpm', min: 20, max: 250, step: 1 },
];
export const ruleVersion = 'demo-1';
