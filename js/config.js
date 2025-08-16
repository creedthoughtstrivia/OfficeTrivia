// Configuration file for Creed Thoughts trivia game.
// Adjust these values before deploying to production. The OWNER_PASSCODE should
// be randomized and kept secret. QUESTION_SETS can be extended with
// additional JSON files placed under a `questions/` directory.
// In a traditional ES module environment the constants below would be exported.
// However, when loading this file directly via `file://` without a web server
// module imports are disallowed. We instead define the objects and then
// assign them to the global `window` so other scripts can access them.
const APP = {
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
    { id: "creed-pack-001A", title: "Creed Pack 001A — Creed & Office General", path: "questions/creed-pack-001A.json" },
    { id: "office-pack-002", title: "Office Pack Vol. 2", path: "questions/office-pack-002.json" },
    // Mega mixed pack combines 100 Office trivia and 400 arithmetic questions.
    { id: "mega-pack-500", title: "Mega Mixed Pack (500)", path: "questions/mega-pack-500.json" }
  ]
};

// Firebase configuration. Paste values from your Firebase console here. Set
// `enabled` to false to run the game locally without persistence.
const FB = {
  // Disable Firebase by default in the offline edition. When enabled is
  // true the game will attempt to load the Firebase SDK via dynamic import,
  // which is only supported in module contexts.
  enabled: false,
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

// Expose configuration objects globally. Doing this allows the game to run
// without ES module imports when loaded from a local file.
window.APP = APP;
window.FB = FB;