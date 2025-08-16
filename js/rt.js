// Real‑time and persistence logic for Creed Thoughts trivia.
// This module wraps Firebase Firestore and Realtime Database APIs. It is
// imported by other modules and should be loaded exactly once. See
// config.js to enable/disable Firebase integration.
// Do not import FB; instead obtain it from the global scope. When running from
// the file system the module system isn’t available, so config.js assigns
// FB to window.
const FB = window.FB;

let fb = { app:null, db:null, rtdb:null, firestore:null, now:null };

function fbReady() { return FB.enabled && fb.db; }

async function fbInit() {
  if (!FB.enabled) return;
  // Lazy load Firebase modules from CDN
  const app = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const fs  = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const rtdb= await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
  const appInst = app.initializeApp(FB.config);
  const db = fs.getFirestore(appInst);
  const realtime = rtdb.getDatabase(appInst);
  fb = {
    app: appInst,
    db,
    rtdb: realtime,
    firestore: fs,
    now: fs.serverTimestamp
  };
}
// Kick off Firebase initialisation without awaiting it. Browsers running
// scripts on the file protocol can’t use top‑level await. If Firebase is
// enabled, the returned promise will initialise the SDK.
fbInit();

// ---- SOLO LEADERBOARD ----
async function addSoloScore(doc) {
  if (!fbReady()) return;
  const { firestore } = fb;
  await firestore.addDoc(firestore.collection(fb.db, FB.paths.soloScores), {
    ...doc, createdAt: firestore.serverTimestamp()
  });
}
async function getSoloTop(limitN=20) {
  if (!fbReady()) return [];
  const { firestore } = fb;
  const q = firestore.query(
    firestore.collection(fb.db, FB.paths.soloScores),
    firestore.orderBy('score','desc'),
    firestore.orderBy('durationMs','asc'),
    firestore.limit(limitN)
  );
  const snap = await firestore.getDocs(q);
  return snap.docs.map(d => d.data());
}
async function clearSoloScores() {
  if (!fbReady()) return;
  const { firestore } = fb;
  const col = firestore.collection(fb.db, FB.paths.soloScores);
  const snap = await firestore.getDocs(col);
  const batch = firestore.writeBatch(fb.db);
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

// ---- LIVE MATCH (Firestore) ----
async function createMatch({ code, hostPin, config, questions }) {
  const { firestore } = fb;
  const ref = firestore.doc(firestore.collection(fb.db, FB.paths.matches));
  await firestore.setDoc(ref, {
    code,
    hostPin,
    state: 'lobby',
    qIndex: -1,
    config,
    createdAt: firestore.serverTimestamp(),
    players: {},
    firstCorrect: null,
    questionStartAt: null,
    questions
  });
  return ref.id;
}

async function findMatchByCode(code) {
  const { firestore } = fb;
  const q = firestore.query(
    firestore.collection(fb.db, FB.paths.matches),
    firestore.where('code','==', code),
    firestore.limit(1)
  );
  const snap = await firestore.getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

async function joinMatch(matchId, playerId, name) {
  const { firestore } = fb;
  const ref = firestore.doc(fb.db, `${FB.paths.matches}/${matchId}`);
  await firestore.updateDoc(ref, { [`players.${playerId}`]: { name, score:0, answered:false, avgMs:0, firsts:0 } });
}

function subscribeMatch(matchId, handler) {
  const { firestore } = fb;
  const ref = firestore.doc(fb.db, `${FB.paths.matches}/${matchId}`);
  return firestore.onSnapshot(ref, snap => handler({ id: snap.id, data: snap.data() }));
}

async function hostAction(matchId, hostPin, patch) {
  const { firestore } = fb;
  const ref = firestore.doc(fb.db, `${FB.paths.matches}/${matchId}`);
  const snap = await firestore.getDoc(ref);
  if (!snap.exists()) throw new Error("Match not found");
  if (snap.data().hostPin !== hostPin) throw new Error("Invalid Host PIN");
  await firestore.updateDoc(ref, patch);
}

async function submitAnswer({ matchId, playerId, idx, correct, ms }) {
  const { firestore } = fb;
  const ref = firestore.doc(fb.db, `${FB.paths.matches}/${matchId}`);
  await firestore.runTransaction(fb.db, async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists()) throw new Error("Match missing");
    const d = doc.data();
    const qIdx = d.qIndex;
    const key = `answers.${qIdx}.${playerId}`;
    const updates = {};
    updates[key] = { idx, correct, ms, at: fb.now() };
    if (correct && (!d.firstCorrect || d.firstCorrect.qIdx !== qIdx)) {
      updates['firstCorrect'] = { qIdx, playerId };
      const p = d.players[playerId] || { name:"?", score:0, answered:false, avgMs:0, firsts:0 };
      updates[`players.${playerId}.firsts`] = (p.firsts||0)+1;
    }
    updates[`players.${playerId}.answered`] = true;
    tx.update(ref, updates);
  });
}

async function endMatch(matchId) {
  const { firestore } = fb;
  const ref = firestore.doc(fb.db, `${FB.paths.matches}/${matchId}`);
  await firestore.updateDoc(ref, { state: 'ended' });
}

// Expose the API functions globally. This is necessary for pages loaded
// directly via the file system that cannot use ES module imports. Other
// scripts can access these functions via `window.fbReady()`, etc.
window.fbReady = fbReady;
window.fbInit = fbInit;
window.addSoloScore = addSoloScore;
window.getSoloTop = getSoloTop;
window.clearSoloScores = clearSoloScores;
window.createMatch = createMatch;
window.findMatchByCode = findMatchByCode;
window.joinMatch = joinMatch;
window.subscribeMatch = subscribeMatch;
window.hostAction = hostAction;
window.submitAnswer = submitAnswer;
window.endMatch = endMatch;