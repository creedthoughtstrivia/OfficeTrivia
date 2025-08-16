// sound.js
// A lightweight sound manager for the Creed Thoughts trivia game. Because
// storing audio files in the repository can be restrictive, this module
// synthesizes simple tones using the Web Audio API. You can replace these
// implementations with actual audio samples by loading Audio objects from
// `/assets/audio` and playing them in the functions below.

// Create a single AudioContext instance so browsers don’t block repeated instantiations.
let _ctx;

/**
 * Play a short synthesised tone. Browsers often require that an AudioContext
 * be resumed in response to user interaction (e.g. a click). This function
 * resumes the context if it’s suspended before playing the tone.
 *
 * @param {string} type One of 'click', 'correct', 'wrong', or any other key
 */
function playSound(type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!_ctx) _ctx = new AudioContext();
  const ctx = _ctx;
  // Resume context on user gesture
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
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

// Attach the playSound function to the global window object so that pages
// loaded without module support can call it directly.
window.playSound = playSound;