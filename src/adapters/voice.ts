/** Optional spoken copy uses the same text shown on screen. */
export function canSpeak() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
