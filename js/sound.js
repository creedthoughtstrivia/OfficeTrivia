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
  // Resume the context on the next user gesture.  Without this the
  // AudioContext stays suspended in some browsers until an explicit resume.
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  /**
   * Produce a tone that can sweep in frequency and fade out gently.  The
   * envelope uses an exponential decay for a pleasing effect.  Both
   * freqStart and freqEnd are in Hz.  Duration is in seconds.
   */
  function sweep(freqStart, freqEnd = freqStart, duration = 0.25) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
  switch (type) {
    case 'correct':
      // Ascending pleasant tone
      sweep(523.25, 659.25, 0.4);
      break;
    case 'wrong':
      // Descending tone to indicate error
      sweep(300, 150, 0.4);
      break;
    case 'click':
      // Short neutral click
      sweep(440, 440, 0.05);
      break;
    default:
      sweep(400, 350, 0.1);
  }
}

// Attach the playSound function to the global window object so that pages
// loaded without module support can call it directly.
window.playSound = playSound;