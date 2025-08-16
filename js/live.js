// live.js
// Host and join logic for live matches in Creed Thoughts trivia. This module
// connects to Firestore to create matches, manage players and control game
// progression. It integrates simple audio feedback for UI interactions.

// When running without module support, use global objects/functions attached to window.
const APP = window.APP;
const fbReady = window.fbReady;
const createMatch = window.createMatch;
const findMatchByCode = window.findMatchByCode;
const joinMatch = window.joinMatch;
const subscribeMatch = window.subscribeMatch;
const hostAction = window.hostAction;
const submitAnswer = window.submitAnswer;
const endMatch = window.endMatch;
const playSound = window.playSound;

const el = s => document.querySelector(s);
const hostPin = el('#hostPin'), matchCode=el('#matchCode'), setLive=el('#setLive'),
      countLive=el('#countLive'), timePerQ=el('#timePerQ'), btnCreate=el('#btnCreateMatch');
const btnOpenQ = el('#btnOpenQ'), btnCloseQ=el('#btnCloseQ'), btnNextQ=el('#btnNextQ'), btnEnd=el('#btnEnd');
const playerCount = el('#playerCount'), qIdxEl=el('#qIdx'), liveInfo=el('#liveInfo'), lbLive=el('#lbLive');
const hostControls = el('#hostControls');

// Populate question set dropdown
APP.QUESTION_SETS.forEach(s=>{
  const o=document.createElement('option');
  o.value=s.id;
  o.textContent=s.title;
  setLive.appendChild(o);
});

let match = { id:null, data:null };

btnCreate.addEventListener('click', async ()=>{
  playSound('click');
  if (!fbReady()) { alert('Enable Firebase in config.js'); return; }
  const code = (matchCode.value||'CREED8').toUpperCase();
  const pin  = (hostPin.value||'000000').trim();
  const set  = APP.QUESTION_SETS.find(s=>s.id===setLive.value);
  const all  = await (await fetch(set.path)).json();
  let qs = all.questions.slice();
  if (APP.DEFAULTS.SHUFFLE_Q) shuffle(qs);
  const count = Math.max(5, Math.min(50, parseInt(countLive.value||'12',10)));
  qs = qs.slice(0, count).map(q=>{
    const map = q.answers.map((a,i)=>({a,i})); shuffle(map);
    const correctIdx = map.findIndex(x=>x.i===q.correctIndex);
    return {
      id: q.id, prompt: q.prompt, answers: map.map(x=>x.a),
      correctIndex: correctIdx, timeLimitSec: q.timeLimitSec || parseInt(timePerQ.value||'25',10)
    };
  });
  const config = {
    base: APP.DEFAULTS.BASE_CORRECT,
    speedMax: APP.DEFAULTS.SPEED_MAX,
    first: APP.DEFAULTS.FIRST_CORRECT
  };
  const id = await createMatch({ code, hostPin: pin, config, questions: qs });
  // Show host controls and subscribe to match updates
  hostControls.classList.remove('hidden');
  subscribe(id);
});

async function subscribe(id){
  const unsub = subscribeMatch(id, (m)=>{
    match = m;
    const d = m.data;
    playerCount.textContent = Object.keys(d.players||{}).length;
    qIdxEl.textContent = d.qIndex;
    renderLiveBoard(d);
    liveInfo.textContent = `State: ${d.state}`;
    btnOpenQ.disabled = !(d.state==='lobby' || d.state==='closed');
    btnCloseQ.disabled = !(d.state==='open');
    btnNextQ.disabled = !(d.state==='closed' && d.qIndex < d.questions.length-1);
    btnEnd.disabled = (d.state==='ended');
  });
  match.unsub = unsub;
}

btnOpenQ.addEventListener('click', async ()=>{
  playSound('click');
  await hostAction(match.id, hostPin.value.trim(), {
    state: 'open',
    qIndex: match.data.qIndex+1,
    firstCorrect: null,
    questionStartAt: new Date().toISOString(),
  });
});
btnCloseQ.addEventListener('click', async ()=>{
  playSound('click');
  const d = match.data;
  const q = d.questions[d.qIndex];
  const answers = (d.answers && d.answers[d.qIndex]) || {};
  const updates = {};
  Object.entries(d.players||{}).forEach(([pid, p])=>{
    const a = answers[pid];
    const correct = a?.correct===true;
    const ms = a?.ms ?? 999999;
    const maxMs = 5000;
    const ratio = Math.max(0, Math.min(1, (maxMs - Math.min(ms,maxMs)) / maxMs));
    const speed = correct ? Math.round(d.config.speedMax * ratio) : 0;
    const base = correct ? d.config.base : 0;
    const inc = base + speed + ((d.firstCorrect && d.firstCorrect.playerId===pid) ? d.config.first : 0);
    updates[`players.${pid}.score`] = (p.score||0) + inc;
  });
  await hostAction(match.id, hostPin.value.trim(), { state:'closed', ...updates });
});
btnNextQ.addEventListener('click', async ()=>{
  playSound('click');
  await hostAction(match.id, hostPin.value.trim(), { firstCorrect:null });
});
btnEnd.addEventListener('click', async ()=>{
  playSound('click');
  await endMatch(match.id);
});

function renderLiveBoard(d){
  const arr = Object.entries(d.players||{}).map(([id,p])=>({id, ...p}));
  arr.sort((a,b)=> b.score - a.score);
  lbLive.innerHTML = '<ol>' +
    arr.map((p,i)=>`<li>${escapeHtml(p.name)} — ${p.score}${p.firsts?` • ${p.firsts}\u2b50`:''}</li>`).join('') +
    '</ol>';
}

function escapeHtml(s){
  return (s || '').replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

// Join button logic
const joinBtn = document.getElementById('btnJoinLive');
if (joinBtn) {
  joinBtn.addEventListener('click', async (e)=>{
    e.preventDefault();
    playSound('click');
    const name = (document.getElementById('nameLive').value||'Player').trim().slice(0,20);
    const code = (document.getElementById('codeLive').value||'').toUpperCase();
    if (!fbReady()) { alert('Enable Firebase in config.js'); return; }
    const found = await findMatchByCode(code);
    if (!found) { alert('No match for that code.'); return; }
    const playerId = localStorage.getItem('ct_player_id') || `p_${crypto.randomUUID().slice(0,8)}`;
    localStorage.setItem('ct_player_id', playerId);
    // Open room in new tab
    window.open(`room.html?mid=${found.id}&pid=${playerId}`, '_blank');
  });
}