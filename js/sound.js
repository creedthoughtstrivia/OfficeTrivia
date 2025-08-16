// sound.js
// A lightweight sound manager for the Creed Thoughts trivia game. Because
// storing audio files in the repository can be restrictive, this module
// synthesizes simple tones using the Web Audio API. You can replace these
// implementations with actual audio samples by loading Audio objects from
// `/assets/audio` and playing them in the functions below.

export function playSound(type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  function beep(freq, duration = 0.2) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
  switch (type) {
    case 'correct':
      beep(800, 0.3);
      break;
    case 'wrong':
      beep(200, 0.3);
      break;
    case 'click':
      beep(400, 0.05);
      break;
    default:
      beep(300, 0.05);
  }
}