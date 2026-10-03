/* =====================================================================
   슬기로운 인천 세계시민 탐방 — 게임 엔진 (외부 라이브러리 없음)
   무대는 1920×1080 크기로 만들고, 화면 크기에 맞춰 자동으로 늘리고 줄여요.
   ===================================================================== */
'use strict';
const $ = s => document.querySelector(s);
const stage = $('#stage'), overlay = $('#overlay');
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = (a, b) => a + Math.random() * (b - a);
const LS = { get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
             set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };

/* ---------- 화면 맞추기 ---------- */
let SCALE = 1;
function fit(){
  SCALE = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.transform = `translate(-50%,-50%) scale(${SCALE})`;
}
window.addEventListener('resize', fit); fit();
/* 화면 좌표 → 무대 좌표 */
function toStage(e){ const r = stage.getBoundingClientRect(); return { x:(e.clientX - r.left) / SCALE, y:(e.clientY - r.top) / SCALE }; }

/* ---------- 소리 ---------- */
let muted = LS.get('sg-muted', false), music = null, musicName = null;
function snd(name, vol = .8){ if(muted) return; try{ const a = new Audio(`assets/audio/${name}.mp3`); a.volume = vol; a.play().catch(()=>{}); }catch(e){} }
function playMusic(name){
  if(musicName === name && music) { if(!muted) music.play().catch(()=>{}); return; }
  if(music) music.pause();
  musicName = name;
  try{ music = new Audio(`assets/audio/${name}.mp3`); music.loop = true; music.volume = .38; if(!muted) music.play().catch(()=>{}); }catch(e){}
}
function toggleSound(){
  muted = !muted; LS.set('sg-muted', muted);
  document.querySelectorAll('.sound-btn').forEach(b => b.textContent = muted ? '🔇' : '🔊');
  if(music){ if(muted) music.pause(); else music.play().catch(()=>{}); }
}

/* ---------- 배경 (천천히 움직이는 켄번스 효과) ---------- */
let bgFront = 'A';
function bg(name){
  const next = $(bgFront === 'A' ? '#bgB' : '#bgA'), cur = $(bgFront === 'A' ? '#bgA' : '#bgB');
  next.src = `assets/bg/${name}.webp`;
  next.classList.remove('kb'); void next.offsetWidth; next.classList.add('kb');
  next.style.opacity = 1; cur.style.opacity = 0;
  bgFront = bgFront === 'A' ? 'B' : 'A';
}

/* ---------- 상태 ---------- */
const G = {};
function resetState(){
  Object.assign(G, { name:'탐방대원', avatar:'harin', money:START_MONEY,
    score:Object.fromEntries(CATS.map(([k]) => [k, 0])), log:[], quizLog:[], gameLog:[], tickets:[],
    flags:{}, passed:0, combo:0, maxCombo:0, stamps:{}, stop:-1, lotterySpent:0, lotteryWon:0 });
}
const total = () => Object.values(G.score).reduce((a, b) => a + b, 0);

/* ---------- 등장인물 ---------- */
const SLOT = { left:330, cleft:720, center:960, cright:1200, right:1590 };
const NAMES = { nuri:'누리', anya:'아냐', taeo:'태오', mom:'엄마', guide:'해설사 선생님', shop:'가게 사장님', lotto:'복권방 아저씨' };
const NPC_ICON = { mom:'👩', guide:'👩‍🏫', shop:'🧑‍🍳', lotto:'🎰' };
const actors = {};
function actorId(id){ return id === 'me' ? G.avatar : id; }
function show(id, expr = 'normal', slot){
  const key = id;
  let el = actors[key];
  const svg = charSVG(actorId(id), expr);
  if(!el){
    el = document.createElement('div'); el.className = 'actor enter'; el.dataset.id = key;
    el.innerHTML = svg; $('#actors').appendChild(el); actors[key] = el;
    el.addEventListener('animationend', ev => { if(ev.animationName === 'enter') el.classList.remove('enter'); });
  } else {
    if(el.dataset.expr !== expr){ el.innerHTML = svg; el.classList.remove('squash'); void el.offsetWidth; el.classList.add('squash'); }
    el.classList.remove('gone');
  }
  el.dataset.expr = expr;
  if(slot) el.dataset.slot = slot;
  el.style.left = (SLOT[el.dataset.slot || 'right'] - 210) + 'px';
  if(id === 'me') el.classList.add('flip');
  return el;
}
function hide(id){ const el = actors[id]; if(el){ el.classList.add('gone'); setTimeout(() => { if(el.classList.contains('gone')){ el.remove(); delete actors[id]; } }, 420); } }
function hideAll(){ Object.keys(actors).forEach(hide); }
function jump(id){ const el = actors[id]; if(!el) return; el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump'); }

/* ---------- 대사 (말풍선) ---------- */
let advance = null, typing = null;
function fmt(s){ return esc(String(s).replace(/\{name\}/g, G.name)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
function tokens(html){ const out = []; const re = /(<[^>]+>|&[a-z#0-9]+;|[\s\S])/g; let m; while((m = re.exec(html))) out.push(m[0]); return out; }

function say(who, text, expr){
  if(expr && (actors[who] || who === 'me' || who === 'nuri')) show(who, expr);
  return new Promise(resolve => {
    const b = $('#bubble'), cap = $('#caption'), npc = $('#npc');
    b.className = 'hidden'; cap.className = 'hidden'; npc.className = 'hidden';
    Object.values(actors).forEach(a => a.classList.remove('talk'));
    let box, txt;
    if(!who){ box = cap; txt = cap.querySelector('.text'); }
    else if(actors[who]){
      box = b; txt = b.querySelector('.text');
      const nm = b.querySelector('.name'); nm.textContent = who === 'me' ? G.name : (NAMES[who] || who);
      nm.className = 'name n-' + (who === 'me' ? 'me' : who);
      actors[who].classList.add('talk');
    } else {
      box = npc; txt = npc.querySelector('.text');
      npc.querySelector('.icon').textContent = NPC_ICON[who] || '💬';
      npc.querySelector('.name').textContent = NAMES[who] || who;
    }
    const html = fmt(text), toks = tokens(html);
    txt.querySelector('.ghost').innerHTML = html;
    const typed = txt.querySelector('.typed'); typed.innerHTML = '';
    box.className = '';
    if(box === b){
      const x = SLOT[actors[who].dataset.slot || 'right'];
      const w = b.offsetWidth; const left = Math.max(30, Math.min(1890 - w, x - w / 2));
      b.style.left = left + 'px';
      b.querySelector('.tail').style.left = Math.max(40, Math.min(w - 80, x - left - 30)) + 'px';
    }
    box.classList.add('pop');
    let i = 0; const ctc = box.querySelector('.ctc'); ctc.style.visibility = 'hidden';
    const finish = () => { clearInterval(typing); typing = null; typed.innerHTML = html; ctc.style.visibility = 'visible';
      Object.values(actors).forEach(a => a.classList.remove('talk')); };
    typing = setInterval(() => { i++; typed.innerHTML = toks.slice(0, i).join(''); if(i >= toks.length) finish(); }, 24);
    advance = () => { if(typing){ finish(); return; } advance = null; resolve(); };
  });
}
const narr = t => say(null, t);
function hideTalk(){ ['#bubble', '#caption', '#npc'].forEach(s => $(s).className = 'hidden'); Object.values(actors).forEach(a => a.classList.remove('talk')); }
stage.addEventListener('pointerup', e => {
  if(e.target.closest('#overlay > *') || e.target.closest('#hud')) return;
  if(advance) advance();
});
document.addEventListener('keydown', e => {
  if((e.key === ' ' || e.key === 'Enter') && advance && !overlay.children.length){ e.preventDefault(); advance(); }
});

/* ---------- 효과 ---------- */
const fxc = $('#fx'), fx = fxc.getContext('2d'); let parts = [], fxRun = false;
function confetti(n = 140, x = 960, y = 420){
  const cols = ['#ff6f59', '#ffc93c', '#4fb3ff', '#5ad1a8', '#b48cff', '#ff8fb1'];
  for(let i = 0; i < n; i++) parts.push({ x, y, vx:rnd(-16, 16), vy:rnd(-24, -6), g:rnd(.5, .8), s:rnd(10, 20), r:rnd(0, 6.28), vr:rnd(-.3, .3), c:cols[i % cols.length], life:rnd(80, 140), sh:Math.random() < .5 });
  if(!fxRun){ fxRun = true; requestAnimationFrame(fxLoop); }
}
function fxLoop(){
  fx.clearRect(0, 0, 1920, 1080);
  parts = parts.filter(p => p.life > 0 && p.y < 1160);
  for(const p of parts){
    p.vy += p.g; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
    fx.save(); fx.translate(p.x, p.y); fx.rotate(p.r); fx.fillStyle = p.c; fx.globalAlpha = Math.min(1, p.life / 30);
    if(p.sh) fx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); else { fx.beginPath(); fx.arc(0, 0, p.s / 3, 0, 6.3); fx.fill(); }
    fx.restore();
  }
  if(parts.length) requestAnimationFrame(fxLoop); else { fxRun = false; fx.clearRect(0, 0, 1920, 1080); }
}
function shake(){ stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
function flash(color){ const f = $('#flash'); f.style.background = color; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
function floater(text, x, y, color = '#ffc93c'){
  const d = document.createElement('div'); d.className = 'floater'; d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = color;
  stage.appendChild(d); setTimeout(() => d.remove(), 1500);
}
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2400); }

/* ---------- 상단 정보 ---------- */
function hud(on = true){ $('#hud').classList.toggle('hidden', !on); if(on) refreshHud(); }
function refreshHud(){
  $('#hudAvatar').innerHTML = charSVG(G.avatar, 'normal');
  $('#hudName').textContent = G.name;
  $('#hudMoney').textContent = G.money.toLocaleString('ko-KR') + '원';
  $('#hudStar').textContent = total();
  $('#hudStamps').innerHTML = STOPS.map((s, i) => {
    const t = G.stamps[s.id]; return `<i class="${t ? (t === 'best' ? 'ok' : 'no') : (i === G.stop ? 'now' : '')}" title="${esc(s.short)}">${t ? (t === 'best' ? '✓' : '✗') : i + 1}</i>`; }).join('');
  const c = $('#hudCombo'); c.textContent = G.combo >= 2 ? `🔥 ${G.combo}콤보` : ''; c.classList.toggle('hot', G.combo >= 2);
}
function addMoney(n){ G.money += n; refreshHud(); const m = $('#hudMoney'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }
function bumpStar(){ refreshHud(); const m = $('#hudStar').parentElement; m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }

/* ---------- 오버레이 ---------- */
function openOverlay(html){ overlay.innerHTML = html; return overlay.firstElementChild; }
function closeOverlay(){ overlay.innerHTML = ''; }
function confirmBox(msg){
  return new Promise(resolve => {
    const prev = overlay.innerHTML;
    const box = document.createElement('div'); box.className = 'dim top';
    box.innerHTML = `<div class="card small"><p>${fmt(msg)}</p><div class="btns"><button class="btn sub" data-v="0">아니요</button><button class="btn" data-v="1">예</button></div></div>`;
    overlay.appendChild(box);
    box.querySelectorAll('button').forEach(b => b.onclick = () => { box.remove(); resolve(b.dataset.v === '1'); });
  });
}

/* ---------- 장소 카드 ---------- */
async function placeCard(s){
  snd('sfx_whoosh');
  const el = document.createElement('div'); el.className = 'placecard';
  el.innerHTML = `<div class="pc-icon">${s.icon}</div><div><div class="pc-step">읽걷쓰 4P · ${esc(s.step)}</div><div class="pc-name">${esc(s.place)}</div><div class="pc-topic">${esc(s.topic)}</div></div>`;
  stage.appendChild(el); setTimeout(() => el.remove(), 3300);
  await wait(700);
}

/* ---------- 미션 카드 (제한시간 4지선다) ---------- */
const LETTERS = ['A', 'B', 'C', 'D'];
function mission({ q, opts, seconds = 0, head = '', kind = 'mission' }){
  hideTalk();
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim mission ${kind}">
      <div class="m-head"><span class="m-tag">${esc(head)}</span>${seconds ? `<div class="timer"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" class="t-bg"/><circle cx="60" cy="60" r="50" class="t-fg" id="tRing"/></svg><b id="tNum">${seconds}</b></div>` : ''}</div>
      <div class="m-q">${fmt(q)}</div>
      <div class="m-grid ${opts.length === 3 ? 'three' : ''}">${opts.map((o, i) => `<button class="m-opt c${i}" data-i="${i}" style="animation-delay:${.08 * i}s"><span class="m-letter">${LETTERS[i]}</span><span class="m-text">${fmt(o)}</span></button>`).join('')}</div>
    </div>`);
    let done = false, left = seconds, tick = null;
    const ring = el.querySelector('#tRing'), num = el.querySelector('#tNum'), C = 2 * Math.PI * 50;
    const pick = i => {
      if(done) return; done = true; clearInterval(tick); document.removeEventListener('keydown', key);
      if(i >= 0){ const b = el.querySelector(`.m-opt[data-i="${i}"]`); b.classList.add('picked'); snd('sfx_click'); }
      setTimeout(() => { closeOverlay(); resolve(i); }, i >= 0 ? 380 : 600);
    };
    const key = e => { const n = '1234abcdABCD'.indexOf(e.key); if(n >= 0){ const i = n % 4; if(i < opts.length) pick(i); } };
    document.addEventListener('keydown', key);
    el.querySelectorAll('.m-opt').forEach(b => b.onclick = () => pick(+b.dataset.i));
    if(seconds){
      ring.style.strokeDasharray = C;
      const t0 = performance.now();
      tick = setInterval(() => {
        const el2 = (performance.now() - t0) / 1000; left = Math.max(0, seconds - el2);
        ring.style.strokeDashoffset = C * (1 - left / seconds);
        num.textContent = Math.ceil(left);
        el.classList.toggle('hurry', left <= 5);
        if(left <= 5 && Math.ceil(left) !== +num.dataset.last){ num.dataset.last = Math.ceil(left); snd('sfx_click', .4); }
        if(left <= 0){ el.classList.add('boom'); pick(-1); }
      }, 50);
    }
  });
}

/* 결과 카드: 도장 쾅! */
function resultCard({ tag, head, text, chips = [], answer = '', btn = '다음으로 ▶' }){
  const COL = { best:'#25a174', ok:'#e09a12', low:'#e2584f', timeout:'#8a8796' };
  const STAMP = { best:'통과', ok:'아쉬움', low:'실패', timeout:'시간초과' };
  if(tag === 'best'){ snd('sfx_best'); confetti(120); } else { snd(tag === 'ok' ? 'sfx_ok' : 'sfx_low'); shake(); flash('rgba(226,88,79,.25)'); }
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim"><div class="card result">
      <div class="stamp s-${tag}">${STAMP[tag] || ''}</div>
      <h2 style="color:${COL[tag] || '#24304a'}">${fmt(head)}</h2>
      ${answer ? `<div class="answer">정답: ${fmt(answer)}</div>` : ''}
      ${chips.length ? `<div class="chips">${chips.map(c => `<span class="chip ${c.cls || ''}">${esc(c.t)}</span>`).join('')}</div>` : ''}
      <p>${fmt(text)}</p>
      <div class="btns"><button class="btn">${esc(btn)}</button></div></div></div>`);
    const b = el.querySelector('.btn');
    const go = () => { document.removeEventListener('keydown', key); snd('sfx_click'); closeOverlay(); resolve(); };
    const key = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
    setTimeout(() => document.addEventListener('keydown', key), 300);
    b.onclick = go;
  });
}

/* ---------- 탐방 버스 지도 ---------- */
const ROUTE_PTS = [[170,840],[430,640],[720,780],[980,560],[760,330],[1180,250],[1500,420],[1730,700]];
function routePath(){
  let d = `M${ROUTE_PTS[0][0]} ${ROUTE_PTS[0][1]}`;
  for(let i = 1; i < ROUTE_PTS.length; i++){
    const [x0, y0] = ROUTE_PTS[i - 1], [x1, y1] = ROUTE_PTS[i];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + (i % 2 ? -90 : 90);
    d += ` Q${mx} ${my} ${x1} ${y1}`;
  }
  return d;
}
const BUS = `<g id="bus"><ellipse cx="0" cy="40" rx="78" ry="12" fill="#000" opacity=".2"/>
  <rect x="-80" y="-56" width="160" height="92" rx="26" fill="url(#busG)"/><rect x="-80" y="-56" width="160" height="22" rx="11" fill="#fff" opacity=".35"/>
  <rect x="-66" y="-36" width="38" height="30" rx="8" fill="#cfefff"/><rect x="-20" y="-36" width="38" height="30" rx="8" fill="#cfefff"/><rect x="26" y="-36" width="40" height="30" rx="8" fill="#cfefff"/>
  <text x="0" y="22" font-family="Jua" font-size="20" fill="#fff" text-anchor="middle">탐방 버스</text>
  <circle cx="-46" cy="38" r="17" fill="#2b2533"/><circle cx="-46" cy="38" r="7" fill="#cfcfd8"/><circle cx="46" cy="38" r="17" fill="#2b2533"/><circle cx="46" cy="38" r="7" fill="#cfcfd8"/></g>`;
function travel(toIdx){
  hideTalk();
  return new Promise(resolve => {
    const from = Math.max(0, toIdx - 1);
    const nodes = STOPS.map((s, i) => { const [x, y] = ROUTE_PTS[i]; const st = G.stamps[s.id];
      return `<g class="node ${i === toIdx ? 'next' : ''} ${st ? 'done' : ''}" transform="translate(${x} ${y})">
        <circle r="64" fill="${st ? (st === 'best' ? '#5ad1a8' : '#ffb3a8') : '#fffaf2'}" stroke="#fff" stroke-width="8"/>
        <text y="22" font-size="58" text-anchor="middle">${s.icon}</text>
        <rect x="-118" y="76" width="236" height="56" rx="28" fill="#24304a" opacity=".85"/>
        <text y="114" font-family="Jua" font-size="32" fill="#fff" text-anchor="middle">${esc(s.short)}</text>
        ${st ? `<g transform="translate(46 -48) rotate(-14)"><circle r="30" fill="${st === 'best' ? '#25a174' : '#e2584f'}"/><text y="12" font-family="Jua" font-size="34" fill="#fff" text-anchor="middle">${st === 'best' ? '✓' : '✗'}</text></g>` : ''}
      </g>`; }).join('');
    const el = openOverlay(`<div class="mapscreen"><svg viewBox="0 0 1920 1080" class="mapsvg">
      <defs><linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd7ff"/><stop offset="1" stop-color="#4fb3ff"/></linearGradient>
      <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff0a6"/><stop offset="1" stop-color="#8fd67a"/></linearGradient>
      <linearGradient id="busG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd64d"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient></defs>
      <rect width="1920" height="1080" fill="url(#seaG)"/>
      <g class="waves">${Array.from({ length:14 }, (_, i) => `<path d="M${(i * 157) % 1900} ${80 + (i * 97) % 960} q20 -14 40 0 t40 0" stroke="#fff" stroke-width="6" fill="none" opacity=".5"/>`).join('')}</g>
      <path d="M60 980 C40 760 220 560 330 520 C420 300 640 200 900 220 C1100 120 1500 120 1700 280 C1880 420 1900 700 1820 860 C1700 1040 1300 1000 1100 960 C800 1060 300 1080 60 980Z" fill="url(#landG)" stroke="#fff" stroke-width="10"/>
      <ellipse cx="470" cy="210" rx="150" ry="70" fill="url(#landG)" stroke="#fff" stroke-width="8"/>
      <text x="470" y="222" font-family="Jua" font-size="30" fill="#3f7a4a" text-anchor="middle">섬마을</text>
      <path d="${routePath()}" stroke="#fffaf2" stroke-width="44" fill="none" stroke-linecap="round" opacity=".9"/>
      <path id="road" d="${routePath()}" stroke="#f0b65a" stroke-width="14" fill="none" stroke-dasharray="26 22" stroke-linecap="round"/>
      ${nodes}
      ${BUS}
    </svg>
    <div class="map-title">🚌 탐방 버스 노선도 <small>${toIdx + 1} / ${STOPS.length}번째 정류장</small></div>
    <div class="map-next"><div class="mn-icon">${STOPS[toIdx].icon}</div><div><small>다음 정류장</small><b>${esc(STOPS[toIdx].place)}</b></div><button class="btn" id="mapGo" disabled>도착! ▶</button></div>
    <div class="map-note">※ 그림 지도예요. 실제 위치·거리와는 달라요.</div></div>`);
    const road = el.querySelector('#road'), bus = el.querySelector('#bus'), L = road.getTotalLength();
    // 각 정류장에 해당하는 길 위치 찾기
    const lenAt = i => { let best = 0, bd = 1e9; for(let s = 0; s <= L; s += 6){ const p = road.getPointAtLength(s); const d = (p.x - ROUTE_PTS[i][0]) ** 2 + (p.y - ROUTE_PTS[i][1]) ** 2; if(d < bd){ bd = d; best = s; } } return best; };
    const a = lenAt(from), b = lenAt(toIdx);
    const place = s => { const p = road.getPointAtLength(s), q = road.getPointAtLength(Math.min(L, s + 4)); const flip = q.x < p.x ? -1 : 1;
      bus.setAttribute('transform', `translate(${p.x} ${p.y - 60}) scale(${flip} 1) translate(0 ${Math.sin(s / 14) * 3})`); };
    place(a); snd('sfx_whoosh');
    const t0 = performance.now(), dur = toIdx === from ? 400 : 2200;
    const go = el.querySelector('#mapGo');
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      place(a + (b - a) * e);
      if(t < 1) requestAnimationFrame(step); else { go.disabled = false; el.querySelector('.node.next')?.classList.add('arrived'); snd('sfx_ok'); }
    };
    requestAnimationFrame(step);
    go.onclick = () => { snd('sfx_click'); closeOverlay(); resolve(); };
  });
}

/* ---------- 탐방 여권 ---------- */
function openPassport(){
  if(overlay.children.length && !overlay.querySelector('.passport')) return;
  const el = openOverlay(`<div class="dim"><div class="passport">
    <div class="pp-cover"><div class="pp-av">${charSVG(G.avatar, 'happy')}</div><div><small>INCHEON GLOBAL CITIZEN</small><h2>세계시민 탐방 여권</h2><b>${esc(G.name)}</b></div></div>
    <div class="pp-grid">${STOPS.map(s => { const t = G.stamps[s.id];
      return `<div class="pp-slot ${t ? 'has' : ''}"><div class="pp-icon">${s.icon}</div><div class="pp-name">${esc(s.short)}</div>${t ? `<div class="pp-stamp ${t === 'best' ? 'ok' : 'no'}">${t === 'best' ? '통과' : '도전'}</div>` : ''}</div>`; }).join('')}</div>
    <div class="pp-stats"><span>⭐ ${total()}점</span><span>💰 ${G.money.toLocaleString('ko-KR')}원</span><span>🏆 대결 승리 ${G.gameLog.filter(g => g.result === 'win').length}</span><span>🔥 최고 콤보 ${G.maxCombo}</span></div>
    <button class="btn sub" id="ppClose">닫기</button></div></div>`);
  el.querySelector('#ppClose').onclick = closeOverlay;
}
