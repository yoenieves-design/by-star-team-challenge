import { readFile, writeFile } from 'node:fs/promises';

const publicFiles = new URL('../public/', import.meta.url);
const plan = JSON.parse(await readFile(new URL('data/exercise-plan.json', publicFiles), 'utf8'));
const session = plan.sessions.find(item => item.id === 'yoe-cevis-replay');
if (!session) throw new Error('The exercise replay is missing its planned cycle session.');

const packets = [];
for (let measuredAtS = session.startAtS; measuredAtS <= session.endAtS; measuredAtS += session.samplePeriodS) {
  // A machine-only drop leaves the independent body stream available.
  if (measuredAtS >= 90 && measuredAtS < 114) continue;
  const sequence = (measuredAtS - session.startAtS) / session.samplePeriodS + 1;
  const warmup = Math.min(1, (measuredAtS - session.startAtS) / (session.warmupEndsAtS - session.startAtS));
  const cooldown = Math.max(0, (measuredAtS - session.steadyEndsAtS) / (session.endAtS - session.steadyEndsAtS));
  const variation = [0, 2, -1, 1][sequence % 4];
  // Buffer machine packets through the same local outage as the crew sensors.
  const receivedAtS = measuredAtS >= 134 && measuredAtS < 154 ? 154 + measuredAtS % 3 : measuredAtS + 1;
  packets.push({
    schemaVersion: 1, id: session.id + '-' + sequence, sequence, crewId: session.crewId,
    sessionId: session.id, equipmentId: session.equipmentId, measuredAtS, receivedAtS,
    origin: 'synthetic', quality: 'good',
    power: { value: Math.round(46 + (warmup - cooldown) * 77 + variation), unit: 'W' },
    cadence: { value: Math.round(52 + (warmup - cooldown) * 21 + variation), unit: 'rpm' },
  });
}

const lines = packets.map(packet => '  ' + JSON.stringify(packet));
await writeFile(new URL('simulation/streams/exercise.json', publicFiles), '[\n' + lines.join(',\n') + '\n]\n');
