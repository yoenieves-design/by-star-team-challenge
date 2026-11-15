import assert from 'node:assert/strict';
import test from 'node:test';
import { createVoiceController, parseVoiceCommand, type RecognitionInstance, type VoiceState } from '../../src/adapters/voice.ts';

test('Voice commands accept only complete read-only requests', () => {
  assert.equal(parseVoiceCommand('By Star, read my heart rate.'), 'read-heart-rate');
  assert.equal(parseVoiceCommand('  Please SHOW my next CHECK! '), 'show-next-check');
  assert.equal(parseVoiceCommand('Open Sensors'), 'open-sensors');
  for (const request of ['Do not read my heart rate', 'Open sensors and close my incident', 'Send medical alert', 'Complete follow-up', 'Read Maya’s heart rate', 'Show my blood results']) {
    assert.equal(parseVoiceCommand(request), null, request);
  }
});

class FakeRecognition implements RecognitionInstance {
  static latest: FakeRecognition;
  lang = '';
  continuous = true;
  interimResults = true;
  maxAlternatives = 0;
  onresult: RecognitionInstance['onresult'] = null;
  onerror: RecognitionInstance['onerror'] = null;
  onend: RecognitionInstance['onend'] = null;
  aborted = false;
  started = false;
  constructor() { FakeRecognition.latest = this; }
  start() { this.started = true; }
  abort() { this.aborted = true; }
}

test('Listening is opt-in, and a result produces a suggestion without executing it', () => {
  const states: VoiceState[] = [];
  const controller = createVoiceController(state => states.push(state), FakeRecognition);
  assert.equal(states.length, 0);
  controller.start();
  const recognition = FakeRecognition.latest;
  assert.equal(recognition.started, true);
  assert.equal(recognition.lang, 'en-US');
  assert.equal(recognition.continuous, false);
  recognition.onresult!({ results: [{ isFinal: false, 0: { transcript: 'Open Sensors' } }] });
  assert.equal(states.at(-1)?.command, null);
  recognition.onresult!({ results: [{ isFinal: true, 0: { transcript: 'Open Sensors' } }] });
  assert.equal(states.at(-1)?.command, 'open-sensors');
  assert.equal(states.at(-1)?.transcript, 'Open Sensors');
  assert.equal(recognition.aborted, true);
  controller.dispose();
});

test('Canceled and obsolete recognition events cannot restore a pending command', () => {
  const states: VoiceState[] = [];
  const controller = createVoiceController(state => states.push(state), FakeRecognition);
  controller.start();
  const oldHandler = FakeRecognition.latest.onresult!;
  controller.stop();
  oldHandler({ results: [{ isFinal: true, 0: { transcript: 'Read my heart rate' } }] });
  assert.equal(states.at(-1)?.command, null);
  assert.equal(states.at(-1)?.phase, 'idle');
  controller.start();
  FakeRecognition.latest.onerror!({ error: 'network' });
  assert.equal(states.at(-1)?.phase, 'error');
  assert.match(states.at(-1)!.message, /could not connect/);
  controller.dispose();
});
