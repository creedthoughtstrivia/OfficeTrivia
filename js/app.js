// app.js
// Solo play logic for the enhanced Creed Thoughts trivia game. This module
// handles question selection, timing, scoring and integrates audio feedback.

// When running without module support, use globals assigned by config.js,
// rt.js and sound.js.
const APP = window.APP;
const fbReady = window.fbReady;
const addSoloScore = window.addSoloScore;
const getSoloTop = window.getSoloTop;
const playSound = window.playSound;

const el = s => document.querySelector(s);
const nameSolo = el('#nameSolo');
const setSolo  = el('#setSolo');
const countSolo= el('#countSolo');
const btnStart = el('#btnStartSolo');
const lbDiv    = el('#leaderboard');

const quizCard = el('#quizCard');
const resultCard = el('#resultCard');
const qBox = el('#questionBox');
const btnNext = el('#btnNext');
const resultSummary = el('#resultSummary');
const quizMeta = el('#quizMeta');
const btnShare = el('#btnShare');

// Load settings from localStorage with defaults from config
let settings = loadSettings();
function loadSettings(){
  try {
    const override = JSON.parse(localStorage.getItem('ct_settings')||'{}');
    return { ...APP.DEFAULTS, ...override };
  } catch { return APP.DEFAULTS; }
}

// Initialize select list and leaderboard
(function init(){
  APP.QUESTION_SETS.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.title;
    setSolo.appendChild(o);
  });
  refreshLB();
})();

async function refreshLB(){
  lbDiv.innerHTML = fbReady() ? 'Loading…' : 'Local‑only (enable Firebase in config.js)';
  const rows = fbReady() ? await getSoloTop(20) : [];
  if (!rows.length) { lbDiv.textContent = 'No scores yet.'; return; }
  const ol = document.createElement('ol');
  rows.forEach(r=>{
    const li = document.createElement('li');
    li.textContent = `${r.name}: ${r.score} pts (${Math.round(r.durationMs/1000)}s)`;
    ol.appendChild(li);
  });
  lbDiv.innerHTML = '';
  lbDiv.appendChild(ol);
}

// Start quiz on button click
btnStart.addEventListener('click', async ()=>{
  playSound('click');
  const name = (nameSolo.value||'Player').trim().slice(0,20);
  const setId = setSolo.value;
  const count = Math.max(5, Math.min(50, parseInt(countSolo.value||'12',10)));
  const set = APP.QUESTION_SETS.find(s=>s.id===setId);
  const data = await (await fetch(set.path)).json();

  let qs = data.questions.slice();
  if (settings.SHUFFLE_Q) shuffle(qs);
  qs = qs.slice(0, count);
  qs.forEach(q=>{
    if (settings.SHUFFLE_A && Array.isArray(q.answers)) {
      q._answerMap = q.answers.map((a,i)=>({a,i}));
      shuffle(q._answerMap);
      q._correctIndexShuffled = q._answerMap.findIndex(x=>x.i===q.correctIndex);
    } else {
      q._answerMap = q.answers.map((a,i)=>({a,i}));
      q._correctIndexShuffled = q.correctIndex;
    }
  });
  startQuiz({ name, qs });
});

let state = null;
function startQuiz({ name, qs }){
  state = {
    name, qs, idx:0, score:0, startAt: performance.now(), perQ: []
  };
  quizCard.classList.remove('hidden');
  resultCard.classList.add('hidden');
  renderQ();
}

let timerId=null, timeLeft=0;
function renderQ(){
  const q = state.qs[state.idx];
  quizMeta.innerHTML = `${state.name} • Q ${state.idx+1}/${state.qs.length}`;
  qBox.innerHTML = `${q.prompt}`;
  if (q.image) qBox.insertAdjacentHTML('beforeend', `<img src="${q.image}" alt="" style="max-width:100%;margin-top:8px;">`);
  if (q.audio) qBox.insertAdjacentHTML('beforeend', `<audio controls src="${q.audio}"></audio>`);
  q._selected = null;
  q._start = performance.now();
  const answersDiv = document.createElement('div');
  q._answerMap.forEach((row, idx)=>{
    const d = document.createElement('div');
    d.className = 'answer';
    d.textContent = row.a;
    d.addEventListener('click', ()=>selectAns(idx));
    answersDiv.appendChild(d);
  });
  qBox.appendChild(answersDiv);
  btnNext.disabled = true;
  btnNext.onclick = nextQ;
  timeLeft = q.timeLimitSec || settings.TIME_PER_Q;
  updateTimer();
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
}

function updateTimer(){
  const t = document.getElementById('timer');
  if (!t) return;
  t.textContent = `${timeLeft}s`;
  if (timeLeft <= 0) {
    clearInterval(timerId);
    lockQuestion();
  }
  timeLeft--;
}

function selectAns(shuffledIdx){
  const q = state.qs[state.idx];
  if (q._locked) return;
  q._selected = shuffledIdx;
  [...qBox.querySelectorAll('.answer')].forEach((d,i)=>{
    d.classList.toggle('selected', i===shuffledIdx);
  });
  lockQuestion();
}

function lockQuestion(){
  const q = state.qs[state.idx];
  if (q._locked) return;
  q._locked = true;
  clearInterval(timerId);
  const ms = Math.max(0, performance.now() - q._start);
  const correct = q._selected === q._correctIndexShuffled;
  if (correct) playSound('correct'); else playSound('wrong');
  const base = correct ? settings.BASE_CORRECT : 0;
  let speed = 0;
  if (correct) {
    const maxMs = 5000;
    const ratio = Math.max(0, Math.min(1, (maxMs - Math.min(ms,maxMs)) / maxMs));
    speed = Math.round(settings.SPEED_MAX * ratio);
  }
  const qScore = base + speed;
  state.score += qScore;
  state.perQ.push({ correct, ms, qScore });
  const nodes = qBox.querySelectorAll('.answer');
  nodes.forEach((d,i)=>{
    if (i===q._correctIndexShuffled) d.classList.add('correct');
    if (i===q._selected && i!==q._correctIndexShuffled) d.classList.add('wrong');
  });
  btnNext.disabled = false;
}

function nextQ(){
  if (state.idx < state.qs.length-1) {
    state.idx++;
    renderQ();
  } else {
    finishQuiz();
  }
}

async function finishQuiz(){
  quizCard.classList.add('hidden');
  resultCard.classList.remove('hidden');
  const durationMs = Math.max(0, performance.now() - state.startAt);
  resultSummary.innerHTML = `${state.name} scored ${state.score} in ${Math.round(durationMs/1000)}s.`;
  if (fbReady()) {
    await addSoloScore({ name: state.name, score: state.score, durationMs });
  }
  refreshLB();
}

btnShare.addEventListener('click', async ()=>{
  playSound('click');
  const txt = resultSummary.textContent.trim() + ' #CreedThoughtsTrivia';
  try {
    await navigator.clipboard.writeText(txt);
    alert('Copied to clipboard!');
  } catch { alert('Could not copy.'); }
});

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }