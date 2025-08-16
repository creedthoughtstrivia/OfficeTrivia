// room.js
// Player client for live matches. Subscribes to match updates and allows
// answering questions. Plays subtle sounds on interactions and updates
// leaderboard in real time.

// Use global functions instead of module imports when running from a file.
const subscribeMatch = window.subscribeMatch;
const submitAnswer = window.submitAnswer;
const playSound = window.playSound;

// Extract query parameters (matchId and playerId) from the URL
const params = new URLSearchParams(location.search);
const matchId = params.get('mid');
const playerId = params.get('pid');

const infoEl = document.getElementById('roomInfo');
const qBox   = document.getElementById('playerQuestion');
const timerEl= document.getElementById('playerTimer');
const lbEl   = document.getElementById('roomLeaderboard');

let match = null;
let timerId=null, timeLeft=0;
let currentQIdx = -1;
let answered = false;

subscribeMatch(matchId, m=>{
  match = m;
  const d = m.data;
  infoEl.textContent = `Match ${d.code || ''} • State: ${d.state}`;
  renderLeaderboard();
  // When a new question opens, re‑render it
  if (d.state === 'open' && d.qIndex !== currentQIdx) {
    currentQIdx = d.qIndex;
    answered = false;
    renderQuestion();
  }
  // When not open, clear question and timer
  if (d.state !== 'open') {
    qBox.innerHTML = '<em>Waiting for next question…</em>';
    clearInterval(timerId);
    timerEl.textContent = '';
  }
});

function renderLeaderboard(){
  const arr = Object.entries(match.data.players||{}).map(([id,p])=>({id,...p}));
  arr.sort((a,b)=> b.score - a.score);
  lbEl.innerHTML = '<ol>' + arr.map(p=>`<li>${escapeHtml(p.name)} — ${p.score}</li>`).join('') + '</ol>';
}

function renderQuestion(){
  const d = match.data;
  const q = d.questions[d.qIndex];
  if (!q) return;
  qBox.innerHTML = `<h3>${q.prompt}</h3>`;
  const ansDiv = document.createElement('div');
  q.answers.forEach((text, idx)=>{
    const btn = document.createElement('div');
    btn.className = 'answer';
    btn.textContent = text;
    btn.addEventListener('click', ()=>answer(idx));
    ansDiv.appendChild(btn);
  });
  qBox.appendChild(ansDiv);
  timeLeft = q.timeLimitSec;
  updateTimer();
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
}

function answer(idx){
  if (answered) return;
  answered = true;
  playSound('click');
  const d = match.data;
  const q = d.questions[d.qIndex];
  const correct = (idx === q.correctIndex);
  // Highlight selection
  [...qBox.querySelectorAll('.answer')].forEach((el,i)=>{
    el.classList.toggle('selected', i===idx);
  });
  // Submit answer; ms can be approximated client‑side (here omitted for simplicity)
  submitAnswer({ matchId: match.id, playerId, idx, correct, ms: 0 });
}

function updateTimer(){
  if (timeLeft <= 0) {
    clearInterval(timerId);
    timerEl.textContent = '0s';
    return;
  }
  timerEl.textContent = `${timeLeft}s`;
  timeLeft--;
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({ '&':'&','<':'<','>':'>','"':'"','\'':'\'' }[c])); }