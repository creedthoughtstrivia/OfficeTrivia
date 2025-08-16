// Configuration file for Creed Thoughts trivia game.
// Adjust these values before deploying to production. The OWNER_PASSCODE should
// be randomized and kept secret. QUESTION_SETS can be extended with
// additional JSON files placed under a `questions/` directory.
export const APP = {
  // Replace with your randomized value before deploy
  OWNER_PASSCODE: "change-me-483920",
  DEFAULTS: {
    BASE_CORRECT: 100,
    SPEED_MAX: 50,
    FIRST_CORRECT: 100,
    TIME_PER_Q: 25,
    SHUFFLE_Q: true,
    SHUFFLE_A: true,
    DAILY_SEED: false,
    SOLO_RETENTION_DAYS: 7
  },
  QUESTION_SETS: [
    { id: "creed-basics-001", title: "Creed Basics Vol. 1", path: "questions/creed-basics-001.json" },
    { id: "creed-pack-001A", title: "Creed Pack 001A — Creed & Office General", path: "questions/creed-pack-001A.json" }
  ]
};

// Firebase configuration. Paste values from your Firebase console here. Set
// `enabled` to false to run the game locally without persistence.
export const FB = {
  enabled: true,
  config: {
    apiKey: "PASTE_HERE",
    authDomain: "PASTE_HERE.firebaseapp.com",
    projectId: "PASTE_HERE",
    storageBucket: "PASTE_HERE.appspot.com",
    messagingSenderId: "PASTE_HERE",
    appId: "PASTE_HERE",
    databaseURL: ""
  },
  paths: {
    soloScores: "soloScores",
    matches: "matches"
  }
};