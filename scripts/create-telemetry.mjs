import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../public/', import.meta.url);
const mission = JSON.parse(await readFile(new URL('data/mission.json', root), 'utf8'));
const scenario = JSON.parse(await readFile(new URL('simulation/eva-return.json', root), 'utf8'));
const output = new URL('simulation/streams/', root);
await mkdir(output, { recursive: true });

function measurement(metric, value, unit, quality = 'good') {
  return { metric, value, unit, quality };
}

function emit(device, sequence, time, measurements, delay = 1) {
  // The local link goes down mid-replay. Buffered packets retain their original sample times.
  const receivedAtS = time >= 134 && time < 154 ? 154 + time % 3 : time + delay;
  return {
    schemaVersion: 1,
    id: device.id + ':' + sequence,
    sequence,
    deviceId: device.id,
    subject: device.subject,
    measuredAtS: time,
    receivedAtS,
    origin: 'synthetic',
    measurements,
  };
}

function personalMeasurements(crew, time) {
  const onEva = ['alex', 'maya'].includes(crew.id);
  const exertion = onEva && time >= 34 && time < 88 ? 37 : 0;
  const recovery = onEva && time >= 88 ? Math.max(6, 29 - Math.floor((time - 88) / 3)) : 0;
  const variation = [0, 2, 1, 3, -1, 1][Math.floor(time / 6) % 6];
  // The same mission clock drives the cycle workload and its independent chest sensor.
  // These illustrative responses are deterministic, not a physiological model.
  const cycling = crew.id === 'yoe' && time >= 30 && time < 210
    ? time < 60 ? 20 + (time - 30) : time < 150 ? 50 : Math.max(8, 50 - (time - 150) * 0.7)
    : 0;
  const pulse = Math.round(crew.reference.restingHeartRate + variation + exertion + recovery + cycling + (crew.id === 'samira' ? 11 : 0));
  const skin = 32 + (crew.reference.restingHeartRate - 62) / 10 + (exertion + recovery) / 30;
  const movement = 7 + Math.floor((exertion + recovery + cycling) * 5 / 2) + variation * 3;
  return [
    measurement('heart_rate', pulse, 'bpm'),
    measurement('skin_temperature', Number(skin.toFixed(1)), '°C'),
    measurement('activity', movement, 'counts/min'),
  ];
}

function ambientMeasurements(zoneId, time) {
  const suited = zoneId.startsWith('suit-');
  let carbonDioxide = 0.22 + [0, 0.01, 0, -0.01][Math.floor(time / 8) % 4];
  // An illustrative excursion after arrival. These values convey change, not safety limits.
  if (zoneId === 'habitat' && time >= 96 && time <= 136) {
    carbonDioxide = 0.41 + Math.min(0.05, (time - 96) * 0.002);
  }
  if (zoneId === 'habitat' && time > 136) {
    carbonDioxide = Math.max(0.23, 0.46 - (time - 136) * 0.003);
  }
  return [
    measurement('oxygen', suited ? 99 : zoneId === 'habitat' ? 28.2 : 21.1, '%'),
    measurement('carbon_dioxide', Number(carbonDioxide.toFixed(2)), 'kPa'),
    measurement('pressure', suited ? 30.1 : zoneId === 'habitat' ? 70.4 : 101.3, 'kPa'),
  ];
}

const personal = [];
const environment = [];
for (const device of mission.devices) {
  if (device.subject.type === 'crew') {
    const crew = mission.crew.find(item => item.id === device.subject.id);
    for (let time = 0; time < scenario.durationS; time += 6) {
      // Maya’s receiver loses signal after the airlock return and gets a delayed packet.
      if (crew.id === 'maya' && time > 78 && time < 156) continue;
      personal.push(emit(device, time / 6 + 1, time, personalMeasurements(crew, time).filter(reading => device.metrics.includes(reading.metric))));
    }
    if (crew.id === 'maya') {
      personal.push({ ...emit(device, 15, 84, personalMeasurements(crew, 84)), receivedAtS: 158 });
    }
  } else {
    for (let time = 0; time < scenario.durationS; time += 8) {
      environment.push(emit(device, time / 8 + 1, time, ambientMeasurements(device.subject.id, time)));
    }
  }
}

// A retransmission keeps its sequence. The monitor should ignore it after the original.
personal.push({ ...personal[4], id: personal[4].id + ':retry', receivedAtS: personal[4].receivedAtS + 2 });

async function writeStream(name, packets) {
  packets.sort((left, right) => left.receivedAtS - right.receivedAtS
    || left.deviceId.localeCompare(right.deviceId) || left.sequence - right.sequence);
  const lines = packets.map(packet => '  ' + JSON.stringify(packet));
  await writeFile(new URL(name + '.json', output), '[\n' + lines.join(',\n') + '\n]\n');
}

await Promise.all([writeStream('personal', personal), writeStream('environment', environment)]);
