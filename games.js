/* =====================================================================
   슬기로운 인천 세계시민 탐방 — AI 누리와의 대결 + 스크래치 복권
   난이도: 아래 숫자(함정 수, 시간, 목표 점수, 수 제한, 누리 실수 확률)를 바꾸면 돼요.
   ===================================================================== */
'use strict';
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n) => shuffle(arr.slice()).slice(0, n);

/* ---------- 공통: 대결 소개 · 결과 ---------- */
function gameIntro(title, rules){
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim"><div class="card vs">
      <div class="vs-row"><div class="vs-av">${charSVG(G.avatar, 'happy')}</div><div class="vs-mark">VS</div><div class="vs-av ai">${charSVG('nuri', 'think')}</div></div>
      <h2>${esc(title)}</h2><p>${fmt(rules)}</p>
      <div class="btns"><button class="btn big">도전! ▶</button></div></div></div>`);
    el.querySelector('.btn').onclick = () => { snd('sfx_click'); closeOverlay(); resolve(); };
  });
}
function gameOver(result, detail){
  const T = { win:['승리!', '#25a174', '황금 스크래치 복권 획득! 🎫'], draw:['무승부!', '#e09a12', '스크래치 복권 1장 획득'], lose:['누리 승리…', '#e2584f', '위로의 스크래치 복권 1장'] }[result];
  if(result === 'win'){ snd('sfx_fanfare'); confetti(180); } else snd(result === 'draw' ? 'sfx_ok' : 'sfx_low');
  return new Promise(resolve => {
    const el = document.createElement('div'); el.className = 'dim top';
    el.innerHTML = `<div class="card go"><div class="go-av">${charSVG(result === 'win' ? G.avatar : 'nuri', result === 'win' ? 'happy' : result === 'draw' ? 'think' : 'happy')}</div>
      <h2 style="color:${T[1]}">${T[0]}</h2><p class="go-reward">${T[2]}</p><p>${fmt(detail)}</p><div class="btns"><button class="btn">확인 ▶</button></div></div>`;
    overlay.appendChild(el);
    el.querySelector('.btn').onclick = () => { snd('sfx_click'); closeOverlay(); resolve(result); };
  });
}

/* =====================================================================
   1) 함정 상자 복불복 (지뢰찾기)
   ===================================================================== */
async function gameMine(){
  const N = 16, MINES = 4, NEED = 3;
  await gameIntro('함정 상자 복불복', `누리가 선물 상자 **${N}개** 중 **${MINES}개**에 함정을 숨겼어요.\n함정을 피해 **안전한 상자 ${NEED}개**를 열면 승리!\n(10번 중 4번 정도만 이겨요… 운을 믿어 봐요!)`);
  const mines = new Set(sample([...Array(N).keys()], MINES));
  return new Promise(resolve => {
    let safe = 0, over = false;
    const el = openOverlay(`<div class="dim game"><div class="g-bar"><b>🎁 함정 상자 복불복</b><span>안전한 상자 <em id="mSafe">0</em> / ${NEED}</span><span class="g-sub">함정 ${MINES}개 숨어 있음</span></div>
      <div class="boxes">${[...Array(N).keys()].map(i => `<button class="gift" data-i="${i}" style="--d:${(i % 4) * .06 + Math.floor(i / 4) * .06}s"><span class="lid"></span><span class="base"></span><span class="ribbon"></span><span class="in"></span></button>`).join('')}</div></div>`);
    el.querySelectorAll('.gift').forEach(b => b.onclick = async () => {
      if(over || b.classList.contains('open')) return;
      const i = +b.dataset.i; b.classList.add('open');
      if(mines.has(i)){
        over = true; b.querySelector('.in').textContent = '💥'; b.classList.add('boom'); snd('sfx_low'); shake(); flash('rgba(226,88,79,.3)');
        await wait(700);
        el.querySelectorAll('.gift').forEach(g => { if(mines.has(+g.dataset.i) && !g.classList.contains('open')){ g.classList.add('open', 'reveal'); g.querySelector('.in').textContent = '💣'; } });
        await wait(900);
        resolve(await gameOver('lose', `안전한 상자 ${safe}개를 열었어요. 복불복은 운이 따라야 해요!`));
      } else {
        safe++; b.querySelector('.in').textContent = '⭐'; snd('sfx_coin'); el.querySelector('#mSafe').textContent = safe;
        if(safe >= NEED){ over = true; await wait(600); resolve(await gameOver('win', '함정을 모두 피했어요! 오늘 운이 좋은데요?')); }
      }
    });
  });
}

/* =====================================================================
   2) SDGs 빙고
   ===================================================================== */
const SDGS = ['빈곤 퇴치', '기아 종식', '건강과 웰빙', '양질의 교육', '성평등', '깨끗한 물', '깨끗한 에너지', '좋은 일자리', '산업과 혁신',
  '불평등 감소', '지속가능 도시', '책임 소비', '기후 행동', '바다 생태계', '육지 생태계', '평화와 정의', '파트너십'];
const SDG_ICON = ['🍚', '🌾', '❤️', '📖', '⚖️', '💧', '☀️', '💼', '🏭', '🤝', '🏙️', '♻️', '🌍', '🐟', '🌳', '🕊️', '🌐'];
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
async function gameBingo(){
  await gameIntro('SDGs 빙고 대결', '나와 누리의 빙고판에 **지속가능발전목표(SDGs)** 가 9개씩 있어요.\n**번호 뽑기**를 누를 때마다 목표가 하나씩 나와요.\n가로·세로·대각선 **한 줄**을 먼저 채우면 승리!');
  const me = sample([...Array(17).keys()].map(i => i + 1), 9), ai = sample([...Array(17).keys()].map(i => i + 1), 9);
  const pool = shuffle([...Array(17).keys()].map(i => i + 1)); const called = new Set();
  const lines = b => LINES.filter(L => L.every(k => called.has(b[k]))).length;
  const board = (b, who) => `<div class="bboard ${who}">${b.map(n => `<div class="bcell" data-n="${n}"><span class="bi">${SDG_ICON[n - 1]}</span><b>${n}</b><small>${SDGS[n - 1]}</small></div>`).join('')}</div>`;
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim game bingo"><div class="g-bar"><b>🎱 SDGs 빙고 대결</b><span>뽑은 횟수 <em id="bCnt">0</em></span><span class="g-sub">먼저 한 줄 완성!</span></div>
      <div class="bwrap"><div><h3 class="me">${esc(G.name)}</h3>${board(me, 'me')}</div>
      <div class="bmid"><div class="ball" id="ball"><span>?</span></div><div class="bname" id="bName">공을 뽑아요!</div><button class="btn big" id="bDraw">번호 뽑기! 🎱</button></div>
      <div><h3 class="ai">누리 (AI)</h3>${board(ai, 'ai')}</div></div></div>`);
    const draw = el.querySelector('#bDraw'), ball = el.querySelector('#ball');
    draw.onclick = async () => {
      draw.disabled = true; ball.classList.remove('roll'); void ball.offsetWidth; ball.classList.add('roll'); snd('sfx_click');
      await wait(650);
      const n = pool.pop(); called.add(n);
      ball.querySelector('span').textContent = n; el.querySelector('#bName').innerHTML = `${SDG_ICON[n - 1]} ${SDGS[n - 1]}`;
      el.querySelector('#bCnt').textContent = called.size;
      el.querySelectorAll(`.bcell[data-n="${n}"]`).forEach(c => { c.classList.add('hit'); snd('sfx_coin', .5); });
      const m = lines(me), a = lines(ai);
      if(m || a || !pool.length){
        await wait(900);
        const r = m && !a ? 'win' : a && !m ? 'lose' : 'draw';
        resolve(await gameOver(r, `${called.size}번 뽑았어요. 마지막 목표: ${SDG_ICON[n - 1]} ${SDGS[n - 1]}`));
      } else draw.disabled = false;
    };
  });
}

/* =====================================================================
   3) 가짜 뉴스 슈팅
   ===================================================================== */
const FAKES = ['공유만 하면 1번에 100원 기부!', '강화도 갯벌에 공룡 출현 (AI 사진)', '초콜릿 먹으면 키가 10cm 쑥쑥', '내일부터 전국 학교 영원히 방학',
  '이 링크 누르면 게임 아이템 공짜', '송도 G타워는 초콜릿으로 지었다', '월미도 바다가 내일 사라진다?!'];
const TRUES = ['1902년 인천에서 하와이 이민 출발', '송도에 녹색기후기금 사무국이 있다', '공정무역은 농부에게 정당한 값을', '함박마을엔 고려인 이웃이 산다', '인천대교는 바다 위를 지나는 다리'];
async function gameShooter(){
  const DUR = 18, NEED = 4;
  await gameIntro('가짜 뉴스 슈팅', `뉴스 말풍선이 날아가요! **가짜 뉴스**만 눌러서 격파하세요.\n진짜 뉴스를 누르면 **1점 감점!**\n${DUR}초 안에 **${NEED}점** 이상이면 승리!`);
  const items = shuffle(FAKES.map(t => ({ t, fake:true })).concat(TRUES.map(t => ({ t, fake:false }))));
  const LANES = [170, 340, 510, 680];
  const bs = items.map((it, i) => ({ ...it, x:1960, y:LANES[i % 4] + rnd(-16, 16), v:rnd(360, 480), spawn:.5 + i * 1.3, st:'wait' }));
  return new Promise(resolve => {
    let fakeHit = 0, trueHit = 0, over = false;
    const el = openOverlay(`<div class="dim game shooter"><div class="g-bar"><b>📰 가짜 뉴스 슈팅</b><span>남은 시간 <em id="sTime">${DUR}</em>초</span><span>격파 <em id="sHit">0</em> · 실수 <em id="sMiss">0</em></span><span>점수 <em id="sNet">0</em> / ${NEED}</span></div>
      <div class="sky" id="sky">${bs.map((b, i) => `<button class="news" data-i="${i}">${esc(b.t)}</button>`).join('')}</div><div class="aim">🎯 가짜만 콕!</div></div>`);
    const btns = [...el.querySelectorAll('.news')];
    btns.forEach((btn, i) => btn.onpointerdown = e => {
      e.stopPropagation(); const b = bs[i]; if(over || b.st !== 'fly') return;
      b.st = 'hit'; btn.classList.add(b.fake ? 'pop' : 'oops');
      if(b.fake){ fakeHit++; snd('sfx_coin'); floater('+1', b.x + 200, b.y, '#25a174'); btn.textContent = '가짜 뉴스 격파! 💥'; }
      else { trueHit++; snd('sfx_low'); floater('−1', b.x + 200, b.y, '#e2584f'); btn.textContent = '앗! 진짜 뉴스야 😵'; shake(); }
      el.querySelector('#sHit').textContent = fakeHit; el.querySelector('#sMiss').textContent = trueHit; el.querySelector('#sNet').textContent = fakeHit - trueHit;
      setTimeout(() => { b.st = 'gone'; btn.style.display = 'none'; }, 600);
    });
    const t0 = performance.now(); let last = t0;
    const loop = async now => {
      if(over) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now; const el2 = (now - t0) / 1000;
      el.querySelector('#sTime').textContent = Math.max(0, Math.ceil(DUR - el2));
      bs.forEach((b, i) => {
        if(b.st === 'wait' && el2 >= b.spawn) b.st = 'fly';
        if(b.st === 'fly'){ b.x -= b.v * dt; if(b.x < -560){ b.st = 'gone'; btns[i].style.display = 'none'; } }
        if(b.st === 'fly' || b.st === 'hit') btns[i].style.transform = `translate(${b.x}px, ${b.y + Math.sin(el2 * 3 + i) * 10}px)`;
      });
      if(el2 >= DUR || bs.every(b => b.st === 'gone')){
        over = true; const net = fakeHit - trueHit;
        resolve(await gameOver(net >= NEED ? 'win' : 'lose', `가짜 뉴스 ${fakeHit}개 격파, 진짜 뉴스 ${trueHit}개 실수 → ${net}점`));
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

/* =====================================================================
   4) 사목 대결 (7×7, 4개 연속) — 누리 AI
   ===================================================================== */
class Omok{
  constructor(n = 7, k = 4, maxMoves = 12, blunder = .55){
    Object.assign(this, { n, k, maxMoves, blunder, b:Array(n * n).fill(0), moves:0, done:false, result:null, win:[] });
    this.c = Math.floor(n / 2) * n + Math.floor(n / 2); this.b[this.c] = 2; this.last = this.c;
  }
  rc(i){ return [Math.floor(i / this.n), i % this.n]; }
  inb(r, c){ return r >= 0 && r < this.n && c >= 0 && c < this.n; }
  lineAt(i, p){
    const [r0, c0] = this.rc(i);
    for(const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]){
      const cells = [i];
      for(const s of [1, -1]){ let r = r0 + dr * s, c = c0 + dc * s; while(this.inb(r, c) && this.b[r * this.n + c] === p){ cells.push(r * this.n + c); r += dr * s; c += dc * s; } }
      if(cells.length >= this.k) return cells;
    }
    return [];
  }
  wouldWin(i, p){ this.b[i] = p; const ok = this.lineAt(i, p).length > 0; this.b[i] = 0; return ok; }
  shape(i, p){
    const [r0, c0] = this.rc(i); let s = 0;
    for(const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]){
      let cnt = 1, opens = 0;
      for(const sg of [1, -1]){ let r = r0 + dr * sg, c = c0 + dc * sg; while(this.inb(r, c) && this.b[r * this.n + c] === p){ cnt++; r += dr * sg; c += dc * sg; }
        if(this.inb(r, c) && this.b[r * this.n + c] === 0) opens++; }
      if(cnt >= this.k) s += 10000; else if(cnt === this.k - 1) s += opens === 2 ? 800 : opens === 1 ? 100 : 0;
      else if(cnt === this.k - 2) s += opens === 2 ? 40 : opens === 1 ? 8 : 0; else s += opens === 2 ? 2 : 0;
    }
    return s;
  }
  score(i){ const [r, c] = this.rc(i), m = Math.floor(this.n / 2); return 1.1 * this.shape(i, 2) + this.shape(i, 1) + (3 - (Math.abs(r - m) + Math.abs(c - m)) * .5); }
  aiMove(){
    const em = this.b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    for(const i of em) if(this.wouldWin(i, 2)) return i;
    for(const i of em) if(this.wouldWin(i, 1)) return i;
    const ranked = em.sort((a, b) => this.score(b) - this.score(a));
    if(ranked.length > 3 && Math.random() < this.blunder) return ranked[1 + Math.floor(Math.random() * 3)];
    return ranked[0];
  }
  playMe(i){
    if(this.done || this.b[i]) return false;
    this.b[i] = 1; this.moves++;
    const l = this.lineAt(i, 1); if(l.length){ Object.assign(this, { done:true, result:'win', win:l }); return true; }
    if(!this.b.includes(0)){ Object.assign(this, { done:true, result:'draw' }); }
    return true;
  }
  playAI(){
    const j = this.aiMove(); this.b[j] = 2; this.last = j;
    const l = this.lineAt(j, 2); if(l.length){ Object.assign(this, { done:true, result:'lose', win:l }); return; }
    if(!this.b.includes(0)) Object.assign(this, { done:true, result:'draw' });
    else if(this.moves >= this.maxMoves) Object.assign(this, { done:true, result:'lose' });
  }
}
async function gameOmok(){
  await gameIntro('AI 누리와 사목 대결', '7×7 판에서 내 돌 **4개**를 한 줄로 먼저 이으면 승리!\n누리가 먼저 가운데에 둬요. 내 돌은 **12번**까지만!\n누리의 수를 잘 읽고 막으면서 공격해요.');
  const g = new Omok();
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim game omok"><div class="g-bar"><b>⚫ AI 누리와 사목 대결</b><span>남은 수 <em id="oLeft">${g.maxMoves}</em></span><span id="oMsg" class="g-sub">내 차례예요!</span></div>
      <div class="owrap"><div class="side">${charSVG(G.avatar, 'think')}<div class="tag me">${esc(G.name)} <i class="st me"></i></div></div>
      <div class="oboard">${g.b.map((_, i) => `<button class="ocell" data-i="${i}"></button>`).join('')}</div>
      <div class="side">${charSVG('nuri', 'normal')}<div class="tag ai">누리 <i class="st ai"></i></div></div></div></div>`);
    const cells = [...el.querySelectorAll('.ocell')]; let lock = false;
    const draw = () => cells.forEach((c, i) => { c.className = 'ocell' + (g.b[i] === 1 ? ' me' : g.b[i] === 2 ? ' ai' : '') + (i === g.last && g.b[i] === 2 ? ' last' : '') + (g.win.includes(i) ? ' win' : ''); });
    draw();
    cells.forEach((c, i) => c.onclick = async () => {
      if(lock || g.done || !g.playMe(i)) return;
      snd('sfx_click'); draw(); el.querySelector('#oLeft').textContent = g.maxMoves - g.moves;
      if(!g.done){
        lock = true; el.querySelector('#oMsg').textContent = '누리가 생각 중… 🤔'; await wait(520);
        g.playAI(); snd('sfx_click', .5); draw(); lock = false; el.querySelector('#oMsg').textContent = g.done ? '' : '내 차례예요!';
      }
      if(g.done){ await wait(900); resolve(await gameOver(g.result, `내가 둔 수: ${g.moves}번`)); }
    });
  });
}

/* =====================================================================
   스크래치 복권 — 진짜로 긁어요!
   ===================================================================== */
const SCRATCH_TABLE = {
  free: [['★', .08, 10], ['♥', .14, 6], ['▲', .20, 3]],      // 일반 (점수)
  gold: [['★', .20, 10], ['♥', .25, 6], ['▲', .25, 3]],      // 황금 (점수, 잘 당첨)
  shop: [['★', .05, 5000], ['♥', .10, 2000], ['▲', .15, 1000]], // 복권방 (돈, 1장 1,000원)
};
const SYMS = ['★', '♥', '▲', '●'];
function makeTicket(kind){
  let prizeSym = null, prize = 0, r = Math.random(), acc = 0;
  for(const [s, p, a] of SCRATCH_TABLE[kind]){ acc += p; if(r < acc){ prizeSym = s; prize = a; break; } }
  let cells;
  if(prizeSym){ const others = SYMS.filter(s => s !== prizeSym); cells = [prizeSym, prizeSym, prizeSym].concat(shuffle(others.concat(others)).slice(0, 3)); }
  else if(Math.random() < .5) cells = ['★', '★'].concat(shuffle(['♥', '♥', '▲', '▲', '●', '●']).slice(0, 4));   // 아깝다!
  else cells = shuffle(SYMS.concat(SYMS)).slice(0, 6);
  return { kind, prizeSym, prize, cells:shuffle(cells), near:!prizeSym && cells.filter(c => c === '★').length === 2 };
}
const TICKET = { free:['세계시민 스크래치 복권', '★ +10점 · ♥ +6점 · ▲ +3점'], gold:['✨ 황금 스크래치 복권 ✨', '★ +10점 · ♥ +6점 · ▲ +3점 (당첨 확률 UP!)'], shop:['인생역전 즉석 복권', '★ 5,000원 · ♥ 2,000원 · ▲ 1,000원'] };
const SYM_COL = { '★':'#f0a400', '♥':'#ff5a6e', '▲':'#25a174', '●':'#8f6bff' };
function scratch(kind, countText = ''){
  const t = makeTicket(kind);
  return new Promise(resolve => {
    const el = openOverlay(`<div class="dim"><div class="ticket t-${kind}">
      <div class="t-head"><b>${TICKET[kind][0]}</b>${countText ? `<span>${esc(countText)}</span>` : ''}</div>
      <div class="t-rule">같은 그림 <b>3개</b>가 나오면 당첨! &nbsp; ${TICKET[kind][1]}</div>
      <div class="t-area"><div class="t-cells">${t.cells.map(c => `<div class="t-cell" style="color:${SYM_COL[c]}">${c}</div>`).join('')}</div><canvas id="scr" width="900" height="420"></canvas></div>
      <div class="t-foot"><span id="tMsg">🪙 손가락이나 마우스로 은박을 문질러 긁어요!</span><button class="btn sub" id="tAll">한 번에 긁기</button><button class="btn" id="tOk" style="display:none">확인 ▶</button></div></div></div>`);
    const cv = el.querySelector('#scr'), cx = cv.getContext('2d');
    const grd = cx.createLinearGradient(0, 0, 900, 420); grd.addColorStop(0, '#c9cdd6'); grd.addColorStop(.5, '#eef0f4'); grd.addColorStop(1, '#b4b9c4');
    cx.fillStyle = grd; cx.fillRect(0, 0, 900, 420);
    cx.globalAlpha = .35; cx.strokeStyle = '#fff'; for(let i = 0; i < 160; i++){ cx.beginPath(); const x = rnd(0, 900), y = rnd(0, 420); cx.moveTo(x, y); cx.lineTo(x + rnd(10, 30), y - rnd(4, 12)); cx.stroke(); }
    cx.globalAlpha = 1; cx.fillStyle = 'rgba(80,86,100,.55)'; cx.font = '64px Jua, sans-serif'; cx.textAlign = 'center'; cx.fillText('여기를 긁어 보세요!', 450, 230);
    cx.globalCompositeOperation = 'destination-out';
    let down = false, lastP = null, moves = 0, revealed = false;
    const pos = e => { const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) * 900 / r.width, y:(e.clientY - r.top) * 420 / r.height }; };
    const rub = p => { cx.lineWidth = 76; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo((lastP || p).x, (lastP || p).y); cx.lineTo(p.x, p.y); cx.stroke(); lastP = p;
      if(++moves % 8 === 0){ if(moves % 24 === 0) snd('sfx_click', .25); checkCleared(); } };
    const checkCleared = () => { const d = cx.getImageData(0, 0, 900, 420).data; let clear = 0, tot = 0; for(let i = 3; i < d.length; i += 4 * 97){ tot++; if(d[i] < 40) clear++; } if(clear / tot > .58) reveal(); };
    cv.onpointerdown = e => { e.preventDefault(); down = true; lastP = null; cv.setPointerCapture?.(e.pointerId); rub(pos(e)); };
    cv.onpointermove = e => { if(down) rub(pos(e)); else if(e.pointerType === 'mouse' && e.buttons === 0 && e.altKey) rub(pos(e)); };
    cv.onpointerup = cv.onpointercancel = () => { down = false; lastP = null; };
    const reveal = () => {
      if(revealed) return; revealed = true; cv.classList.add('gone');
      el.querySelectorAll('.t-cell').forEach(c => { if(t.prizeSym && c.textContent === t.prizeSym) c.classList.add('win'); });
      const msg = el.querySelector('#tMsg');
      if(t.prizeSym){ msg.innerHTML = `<b class="t-win">🎉 당첨! ${kind === 'shop' ? '상금 ' + t.prize.toLocaleString('ko-KR') + '원' : '보너스 +' + t.prize + '점'}</b>`; snd('sfx_fanfare'); confetti(160); }
      else if(t.near){ msg.innerHTML = '<b class="t-lose">아깝다! ★이 2개… 꽝!</b>'; snd('sfx_low'); }
      else { msg.innerHTML = '<b class="t-lose">꽝! 다음 기회에…</b>'; snd('sfx_low'); }
      el.querySelector('#tAll').style.display = 'none'; el.querySelector('#tOk').style.display = '';
    };
    el.querySelector('#tAll').onclick = reveal;
    el.querySelector('#tOk').onclick = () => {
      snd('sfx_click'); closeOverlay();
      if(kind === 'shop'){ G.lotteryWon += t.prize; if(t.prize) addMoney(t.prize); }
      else if(t.prize){ G.score.challenge += t.prize; bumpStar(); }
      G.tickets.push({ kind, won:!!t.prizeSym, prize:t.prize });
      resolve(t);
    };
  });
}
