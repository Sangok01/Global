/* =====================================================================
   슬기로운 인천 세계시민 탐방 — 이야기 진행
   등장: 나(고른 캐릭터) · AI 친구 누리 · 아냐(고려인 친구) · 태오(반 친구)
   ===================================================================== */
'use strict';

/* ---------- 시작 화면 ---------- */
function titleScreen(){
  hud(false); hideTalk(); hideAll(); bg('title'); playMusic('bgm_main');
  const title1 = '슬기로운', title2 = '인천 세계시민 탐방';
  const letters = (s, d0) => [...s].map((ch, i) => ch === ' ' ? '<span class="sp"> </span>' : `<span style="animation-delay:${d0 + i * .06}s">${ch}</span>`).join('');
  const cast = ['harin', 'junu', 'nuri', 'jia', 'dohyun'];
  return new Promise(resolve => {
    const el = openOverlay(`<div class="title">
      <div class="t-sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
      <div class="t-bus">🚌</div>
      <div class="logo"><div class="l1">${letters(title1, .1)}</div><div class="l2">${letters(title2, .45)}</div>
        <div class="l3">읽고 · 걷고 · 쓰는 <b>읽걷쓰 AI</b>와 함께하는 10분 도전!</div></div>
      <div class="t-cast">${cast.map((c, i) => `<div class="t-kid" style="--d:${i * .18}s">${charSVG(c, i === 2 ? 'happy' : (i % 2 ? 'happy' : 'normal'))}</div>`).join('')}</div>
      <div class="t-menu">
        <button class="btn big shine" id="tStart">🎒 탐방 출발!</button>
        <div class="t-sub"><button class="btn sub" id="tBoard">🏅 명예의 전당</button><button class="btn sub sound-btn" id="tSound">${muted ? '🔇' : '🔊'}</button></div>
        <div class="t-info">미션 8 · 넌센스 4 · AI 대결 4 · 스크래치 복권 &nbsp;|&nbsp; <b>통과율 절반 이하!</b></div>
      </div></div>`);
    el.querySelector('#tStart').onclick = () => { snd('sfx_best'); playMusic('bgm_main'); resolve(); };
    el.querySelector('#tBoard').onclick = () => { snd('sfx_click'); boardModal(); };
    el.querySelector('#tSound').onclick = toggleSound;
    el.querySelectorAll('.t-kid').forEach(k => k.onclick = () => { k.classList.remove('boing'); void k.offsetWidth; k.classList.add('boing'); snd('sfx_coin', .5); });
  });
}
function boardModal(){
  const board = LS.get('sg-board', []), plays = LS.get('sg-plays', 0), passes = LS.get('sg-passes', 0);
  const box = document.createElement('div'); box.className = 'dim top';
  box.innerHTML = `<div class="card board"><h2>🏅 명예의 전당 TOP 10</h2>
    ${plays ? `<p class="b-rate">이 기기 누적 참가 <b>${plays}</b>명 · 인증 통과 <b>${passes}</b>명 (${Math.round(100 * passes / plays)}%)</p>` : ''}
    ${board.length ? `<table>${board.slice(0, 10).map((e, i) => `<tr><td>${['🥇','🥈','🥉'][i] || (i + 1) + '위'}</td><td class="b-av">${charSVG(e.avatar || 'harin', 'normal')}</td><td>${esc(e.name)}</td><td>${esc(e.tier)}</td><td><b>${e.score}점</b></td></tr>`).join('')}</table>`
      : '<p>아직 기록이 없어요. 첫 번째 탐방대원이 되어 보세요!</p>'}
    <div class="btns"><button class="btn sub">닫기</button></div></div>`;
  overlay.appendChild(box);
  box.querySelector('button').onclick = () => box.remove();
}

/* ---------- 캐릭터 고르기 ---------- */
function pickAvatar(){
  return new Promise(resolve => {
    let sel = 'harin';
    const el = openOverlay(`<div class="dim pick"><h1 class="pick-t">나와 함께 탐방할 캐릭터를 골라요!</h1>
      <div class="pick-row">${Object.entries(AVATARS).map(([id, a]) => `<button class="pcard ${id === sel ? 'on' : ''}" data-id="${id}"><div class="p-av">${charSVG(id, id === sel ? 'happy' : 'normal')}</div><b>${a.name}</b><small>${a.desc}</small></button>`).join('')}</div>
      <div class="pick-name"><label>탐방대원 이름</label><input id="pName" maxlength="8" placeholder="이름을 쓰세요" autocomplete="off">
        <div class="pick-chips">${['하늘', '바다', '별빛', '새싹', '무지개'].map(n => `<button class="pchip">${n}</button>`).join('')}</div></div>
      <button class="btn big shine" id="pGo">이 캐릭터로 출발! 🚌</button></div>`);
    const nm = el.querySelector('#pName');
    nm.value = AVATARS[sel].name;
    el.querySelectorAll('.pcard').forEach(c => c.onclick = () => {
      const prev = sel; sel = c.dataset.id;
      el.querySelectorAll('.pcard').forEach(x => x.classList.toggle('on', x.dataset.id === sel));
      el.querySelector(`.pcard[data-id="${prev}"] .p-av`).innerHTML = charSVG(prev, 'normal');
      c.querySelector('.p-av').innerHTML = charSVG(sel, 'happy');
      if(Object.values(AVATARS).some(a => a.name === nm.value) || !nm.value) nm.value = AVATARS[sel].name;
      snd('sfx_coin', .6);
    });
    el.querySelectorAll('.pchip').forEach(c => c.onclick = () => { nm.value = c.textContent; snd('sfx_click'); });
    nm.addEventListener('keydown', e => { e.stopPropagation(); if(e.key === 'Enter') el.querySelector('#pGo').click(); });
    el.querySelector('#pGo').onclick = () => {
      G.avatar = sel; G.name = (nm.value.trim().replace(/[<>{}\[\]]/g, '') || AVATARS[sel].name).slice(0, 8);
      snd('sfx_best'); closeOverlay(); resolve();
    };
  });
}

/* ---------- 진행 도우미 ---------- */
async function arrive(i){
  G.stop = i; refreshHud();
  await travel(i);
  hideAll(); bg(STOPS[i].bg); refreshHud(); await wait(300);
  await placeCard(STOPS[i]);
}
async function askMission(sid, q){
  const n = STOPS.findIndex(s => s.id === sid) + 1;
  return mission({ q, opts:CHOICES[sid].map(c => c.text), seconds:MISSION_TIME, head:`미션 ${n}/8 · 읽걷쓰 ${STOPS[n - 1].step}` });
}
async function missionResult(sid, idx){
  let tag, chips = [], text;
  if(idx < 0){ tag = 'timeout'; text = TIMEOUT_FB; G.log.push({ sid, label:'시간 초과', tag, gained:0 }); }
  else {
    const c = CHOICES[sid][idx]; tag = c.tag; text = c.fb;
    let gained = 0;
    for(const [k, v] of Object.entries(c.pts)){ G.score[k] += v; gained += v; if(v > 0) chips.push({ t:`${CATNAME[k]} +${v}` }); }
    if(c.cost){ addMoney(-c.cost); chips.push({ t:`용돈 −${c.cost.toLocaleString('ko-KR')}원`, cls:'minus' }); }
    if(c.flag) G.flags[c.flag] = true;
    G.log.push({ sid, label:c.label, tag, gained });
  }
  if(sid !== 'shop'){
    G.stamps[sid] = tag;
    if(tag === 'best'){ G.passed++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); } else G.combo = 0;
  }
  bumpStar();
  const HEAD = { best:'미션 통과!', ok:'아쉬워요! 미션 실패', low:'미션 실패…', timeout:'시간 초과! 미션 실패' };
  await resultCard({ tag, head:HEAD[tag], text, chips });
  if(tag === 'best' && G.combo >= 2){ toast(`🔥 <b>${G.combo}연속 통과!</b> 콤보 행진 중!`); }
}
async function quiz(qid){
  const q = QUIZZES[qid], n = QUIZ_ORDER.indexOf(qid) + 1;
  const idx = await mission({ q:q.q, opts:q.opts, seconds:QUIZ_TIME, head:`🤪 넌센스 퀴즈 ${n}/4 · 10초 안에!`, kind:'quiz' });
  const ok = idx === q.ans; G.quizLog.push(ok);
  if(ok){ G.score.challenge += QUIZ_PTS; }
  await resultCard({ tag:ok ? 'best' : (idx < 0 ? 'timeout' : 'low'), head:ok ? '딩동댕! 정답!' : idx < 0 ? '시간 초과!' : '땡! 틀렸어요',
    answer:q.opts[q.ans], text:q.why, chips:ok ? [{ t:`도전·행운 +${QUIZ_PTS}` }] : [] });
}
async function aiGame(name){
  hideTalk();
  const fn = { mine:gameMine, bingo:gameBingo, shooter:gameShooter, omok:gameOmok }[name];
  const r = await fn();
  G.score.challenge += GAME_PTS[r]; G.gameLog.push({ name, result:r }); bumpStar();
  await scratch(r === 'win' ? 'gold' : 'free');
}

/* =====================================================================
   본 이야기
   ===================================================================== */
async function ch_home(){
  await arrive(0);
  await narr('토요일 아침. 오늘은 인천 곳곳을 탐방하는 **‘세계시민 인증 챌린지’** 날!');
  show('me', 'happy', 'left');
  await say('mom', '{name}, 용돈 10,000원이야. 오늘 하루 잘 계획해서 써 보렴.');
  snd('sfx_coin'); floater('+10,000원', 300, 300);
  show('nuri', 'happy', 'right');
  await say('nuri', '삐리리~ 안녕, {name}! 나는 읽걷쓰 AI 친구 **누리**야. 오늘 탐방 버스 안내를 맡았어!');
  await say('nuri', '오늘 미션은 모두 **제한시간**이 있어. 인증을 통과하는 친구는 **절반도 안 된대!**', 'wow');
  await say('nuri', '중간중간 나랑 **대결**도 하고, 이기면 **황금 복권**도 줄게. 첫 미션! 용돈 계획부터!', 'think');
  const i = await askMission('plan', '오늘 용돈 10,000원, 어떻게 쓸까?');
  const R = [
    ['nuri', '음… 그때그때 쓰면 편하긴 한데, 끝나고 나면 어디에 썼는지 모를걸?', 'think'],
    ['me', '교통비·물 5,000원, 간식 3,000원, 나눔 2,000원! 이렇게 적어 둘래.', 'happy'],
    ['nuri', '몽땅 저금? 그럼 오늘 버스비는 어떡하지?', 'wow'],
    ['nuri', '친구가 사는 게 나한테도 꼭 필요할까?', 'think'],
  ];
  if(i >= 0) await say(...R[i]); else await say('nuri', '앗, 시간이 다 됐어! 고민만 하다 끝나 버렸네.', 'wow');
  if(i === 1){ await say('nuri', '와, 벌써 예산표 완성이야!', 'happy'); }
  await missionResult('plan', i);
}

async function ch_museum(){
  await arrive(1);
  show('me', 'happy', 'left'); show('nuri', 'happy', 'right');
  await say('me', '월미도에 도착! 바다 냄새가 솔솔 난다~');
  await say('nuri', '바다를 보니 **넌센스 퀴즈**가 떠올랐어! 딱 10초!', 'happy');
  await quiz('q_sea');
  await say('guide', '1902년 겨울, 이곳 인천 제물포항에서 100여 명이 배를 타고 하와이로 떠났어요. 우리나라 첫 공식 이민이랍니다.');
  await say('nuri', '그런데 AI 검색창에 이런 답이 떴어. **“옛날 이민자들은 편하게 돈 벌러 간 거예요.”**', 'think');
  await say('me', '음… 이 말, 정말 맞을까? 확인해 봐야겠다.', 'think');
  const i = await askMission('museum', 'AI가 알려 준 정보, 어떻게 확인할까?');
  if(i === 0) await say('nuri', '“네, 정말이에요!” …어라? 나한테 물으면 나는 또 같은 말을 할 수밖에 없는데?', 'wow');
  else if(i === 1) await say('me', '블로그에도 비슷하게 써 있네… 그런데 누가 쓴 글이지?', 'think');
  else if(i === 2){ await say('guide', '이민자들은 뜨거운 사탕수수 농장에서 하루 10시간씩 일했어요. 편한 길이 아니었지요.'); await say('me', '직접 확인하길 잘했다!', 'happy'); }
  else if(i === 3) await say('guide', '어머, 그건 사실과 달라요. 이민자들은 아주 힘들게 일했답니다.');
  else await say('nuri', '시간 초과! 확인할 기회를 놓쳤어.', 'sad');
  await missionResult('museum', i);
}

async function ch_hambak(){
  await arrive(2);
  show('me', 'wow', 'left');
  await say('me', '함박마을이다! 러시아어 간판이랑 우즈베키스탄 빵집이 가득해!');
  show('anya', 'normal', 'cleft');
  await say('anya', '안녕! 나는 아냐야. 우리 할머니는 고려인이셔. 우즈베키스탄에서 왔어.');
  show('taeo', 'happy', 'right');
  await say('taeo', '아냐는 말투가 이상해~ 학교 알림장도 못 읽는대!');
  await say('anya', '……엄마가 한국어 가정통신문을 읽기 어려워하셔서, 준비물을 자주 빠뜨려.', 'sad');
  const i = await askMission('hambak', '아냐를 위해 나는 어떻게 할까?');
  if(i === 0) await say('anya', '고마워… 그런데 나도 스스로 해 보고 싶어.', 'think');
  else if(i === 1) await say('anya', '……할머니랑은 고려말로 이야기하는데, 그것도 쓰면 안 돼?', 'sad');
  else if(i === 2){ await say('taeo', '어… 그렇네. 아냐야, 미안해.', 'sad'); show('anya', 'happy'); jump('anya'); await say('anya', '고마워! 번역 앱으로 가정통신문을 같이 읽어 주면 정말 좋겠어!', 'happy'); }
  else if(i === 3){ hide('taeo'); await narr('뒤돌아 걷는데, 아냐의 작은 목소리가 자꾸 귀에 남는다.'); }
  else await narr('머뭇거리는 사이 아냐가 고개를 숙이고 가게 안으로 들어갔다.');
  await missionResult('hambak', i);
  hide('anya'); hide('taeo'); await wait(400);
  show('nuri', 'happy', 'right');
  await say('nuri', '잠깐 쉬어 가자! 나 누리와 **첫 번째 대결!** 상자 속 함정을 피해 봐!', 'happy');
  await aiGame('mine');
}

async function ch_sinpo(){
  await arrive(3);
  show('me', 'happy', 'left'); show('nuri', 'normal', 'right');
  await say('me', '신포국제시장이다! 닭강정 냄새가 솔솔~');
  await say('nuri', '시장에 왔으니 **돈**에 관한 넌센스 퀴즈! 10초!', 'happy');
  await quiz('q_king');
  await say('mom', '(문자) {name}, 시장에서 달걀 10개만 사 올래? 심부름 돈 5,000원 줄게.');
  await say('shop', '달걀 사러 왔니? 종류가 많단다. 골라 보렴!');
  await say('nuri', '힌트! 포장 그림보다 **달걀 껍데기에 적힌 번호**를 읽어 봐.', 'think');
  const i = await askMission('sinpo', '달걀 10개, 어떤 걸 살까? (심부름 예산 5,000원)');
  if(i === 0) await say('shop', '제일 싸지? 대신 좁은 철창에서 키운 닭들 달걀이란다.');
  else if(i === 1) await say('shop', '오, 번호를 읽을 줄 아는구나! 1번은 닭들이 밖에서 뛰어놀며 낳은 달걀이야.');
  else if(i === 2){ snd('sfx_coin'); await say('me', '500원이 모자라서… 내 용돈으로 냈다.', 'sad'); }
  else if(i === 3) await say('shop', '포장이 예쁘지? 그런데 껍데기 번호를 한번 보렴.');
  else await say('shop', '얘야, 뒤에 손님 기다린다~ 시간이 다 됐어!');
  await missionResult('sinpo', i);

  // 유혹의 복권방
  await say('lotto', '어이, 꼬마 손님! **‘인생역전 즉석 복권’** 1장에 1,000원! 1등은 5,000원이야!');
  await say('me', '우와, 1,000원으로 5,000원을…?', 'wow');
  await say('nuri', '{name}, 잘 생각해 봐. 이건 **제한시간이 없어.**', 'think');
  const s = await mission({ q:'인생역전 즉석 복권, 살까?', opts:CHOICES.shop.map(c => c.text), head:`🎰 유혹의 복권방 · 내 용돈 ${G.money.toLocaleString('ko-KR')}원`, kind:'shop' });
  const n = [0, 1, 2][s]; const c = CHOICES.shop[s];
  for(const [k, v] of Object.entries(c.pts)) G.score[k] += v;
  if(c.cost){ addMoney(-c.cost); G.lotterySpent += c.cost; }
  G.log.push({ sid:'shop', label:c.label, tag:c.tag, gained:Object.values(c.pts).reduce((a, b) => a + b, 0) });
  for(let k = 0; k < n; k++) await scratch('shop', `${k + 1}/${n}장`);
  await resultCard({ tag:c.tag, head:'복권의 진실', text:c.fb + (n ? ` (오늘 결과: 쓴 돈 ${G.lotterySpent.toLocaleString('ko-KR')}원 → 당첨금 ${G.lotteryWon.toLocaleString('ko-KR')}원)` : ''),
    chips:c.pts.money ? [{ t:`금융 +${c.pts.money}` }] : [] });
}

async function ch_baengnyeong(){
  await arrive(4);
  show('nuri', 'normal', 'right');
  await say('nuri', '여긴 인천의 가장 북쪽 섬, **백령도!** 내 드론 카메라로 바닷가를 탐방 중이야.', 'happy');
  show('me', 'wow', 'left');
  await say('me', '점박이물범이 쉬고 있어! 그런데… 해변에 쓰레기가 가득하네.');
  await say('nuri', '병에 여러 나라 글자가 적혀 있어. 중국어, 일본어, 영어… **한글도** 있어.', 'think');
  const i = await askMission('baengnyeong', '외국 글자가 적힌 쓰레기가 가득! 어떻게 할까?');
  if(i === 0) await say('nuri', '잠깐! 한글이 적힌 병도 있었잖아. 우리 쓰레기도 바다를 건너가.', 'wow');
  else if(i === 1) await say('nuri', '주운 건 멋져! 그런데 이 쓰레기, 계속 또 밀려오지 않을까?', 'think');
  else if(i === 2){ await say('me', '나라별로 세어 보니 플라스틱병이 제일 많아. 이웃 나라 친구들에게 같이 줄이자고 편지를 써야지!', 'happy'); await say('nuri', '지역 문제를 세계와 연결했어!', 'happy'); }
  else if(i === 3) await say('nuri', '물범들한텐 여기가 집인데…', 'sad');
  else await say('nuri', '시간 초과! 파도가 쓰레기를 다시 바다로 데려가 버렸어.', 'sad');
  await missionResult('baengnyeong', i);
}

async function ch_songdo(){
  await arrive(5);
  show('me', 'wow', 'left'); show('nuri', 'normal', 'right');
  await say('me', '송도 G타워! **녹색기후기금(GCF)** 사무국이 있는 곳이다.');
  await say('nuri', 'GCF는 개발도상국이 기후 위기에 대응하도록 돈을 지원하는 국제기구야. 기후 하면… 넌센스 퀴즈!', 'happy');
  await quiz('q_hot');
  await say('nuri', '로비에 **‘AI와 함께 기후 위기에 강한 집 짓기’** 전시가 있어. 내가 설계 아이디어를 4개 냈는데…', 'think');
  await say('nuri', '사실 그중 **3개는 틀렸어.** AI 말이라고 다 믿으면 안 되겠지? 과학으로 골라 봐!', 'wow');
  const i = await askMission('songdo', 'AI 누리의 제안 중 과학적으로 맞는 것은?');
  if(i === 2) await say('nuri', '정답! 전통 한옥의 처마에도 숨어 있는 과학이야.', 'happy');
  else if(i < 0) await say('nuri', '시간 초과! 집이 완성되지 못했어.', 'sad');
  else await say('nuri', '땡! 내 말을 그대로 믿었구나. 그 집에선 여름에 엄청 더울걸?', 'wow');
  await missionResult('songdo', i);
  await say('nuri', '두 번째 대결! 지속가능발전목표, **SDGs 빙고**로 붙어 보자!', 'happy');
  await aiGame('bingo');
}

async function ch_ganghwa(){
  await arrive(6);
  show('me', 'normal', 'left'); show('nuri', 'normal', 'right');
  await say('me', '강화 평화전망대. 강 건너 북한 땅이 손에 잡힐 듯 가깝다.', 'think');
  await say('nuri', '남과 북이 나뉜 지 70년이 넘었어. 지금도 세계 곳곳에 전쟁으로 집을 잃은 어린이들이 있어.', 'sad');
  snd('sfx_click');
  await narr('그때 휴대폰 알림이 울렸다. 충격적인 전쟁 사진과 함께 **‘공유 1번에 100원 기부! 지금 후원하기 ▶ 링크’**');
  const i = await askMission('ganghwa', '돕고 싶은데… 어떻게 할까?');
  if(i === 0) await say('nuri', '잠깐, 이 글 누가 만들었는지 확인해 봤어?', 'think');
  else if(i === 1) await say('nuri', '좋아요 100개가 모여도 실제로 전해지는 건 없대.', 'think');
  else if(i === 2){ snd('sfx_coin'); await say('me', '사진 출처가 없네. 대신 공식 구호 기관 누리집에서 나눔 예산으로 기부할래.', 'happy'); }
  else if(i === 3) await say('nuri', '안 돼!! 그 링크, 주소가 이상해! **피싱** 사이트일 수 있어!', 'wow');
  else await say('nuri', '시간 초과! 알림이 사라져 버렸어.', 'sad');
  await missionResult('ganghwa', i);
  await say('nuri', '세 번째 대결! 날아다니는 말풍선 중 **가짜 뉴스만** 골라 쏘는 슈팅 게임!', 'happy');
  await aiGame('shooter');
}

async function ch_library(){
  await arrive(7);
  show('me', 'normal', 'left'); show('nuri', 'normal', 'right');
  await say('me', '노을이 질 무렵, 도서관에 도착했다. 다리가 뻐근하다~');
  if(G.flags.anyaFriend){ show('anya', 'happy', 'cleft'); await say('anya', '{name}! 나도 세계시민 다짐 쓰러 왔어. 같이 쓰자!'); }
  if(G.flags.sharedFake){ await say('nuri', '아 참, 아까 공유한 전쟁 사진… 알고 보니 **AI로 만든 가짜 사진**이었대.', 'sad'); await say('me', '으… 친구들한테 사과 문자 보내야겠다.', 'sad'); }
  await say('nuri', '마지막 넌센스 퀴즈야! **다양성**과 관련 있어!', 'happy');
  await quiz('q_dog');
  hide('anya');
  await say('nuri', '그리고 마지막 대결… 나 누리는 계산이 아주 빨라. **사목**으로 붙어 보자!', 'think');
  await aiGame('omok');
  await say('nuri', '진짜 마지막 미션! **‘나의 세계시민 다짐’**을 써서 축제 게시판에 붙이자.', 'happy');
  await say('nuri', '나는 AI니까 글을 대신 써 줄 수도 있는데… 어떻게 할래?', 'think');
  const i = await askMission('library', '다짐글, 어떻게 쓸까?');
  if(i === 0) await say('nuri', '단어만 바꾼다고 내 생각이 되진 않는데…', 'think');
  else if(i === 1){ await say('me', '‘다르다고 놀리지 않고, 사실을 확인하고, 돈을 계획해서 나누는 세계시민이 되겠습니다! (맞춤법: 누리 도움)’', 'happy'); await say('nuri', '오늘 하루가 다 들어 있는 멋진 글이야!', 'happy'); }
  else if(i === 2) await say('nuri', '솔직하게 밝힌 건 좋아. 그런데 이 글엔 {name}의 이야기가 없는걸?', 'think');
  else if(i === 3) await say('nuri', '앗, 그건 다른 사람이 쓴 글이잖아!', 'wow');
  else await say('nuri', '시간 초과! 게시판이 닫혀 버렸어.', 'sad');
  await missionResult('library', i);
}

/* ---------- 엔딩 ---------- */
function tierOf(s){ const r = s / MAX_SCORE; return TIERS.find(t => r >= t[0]); }
async function ending(){
  hideTalk(); hideAll(); hud(false);
  playMusic('bgm_calm'); bg('ending'); await wait(700);
  show('me', 'happy', 'left'); show('nuri', 'happy', 'right');
  await say('nuri', '{name}, 오늘 정말 긴 하루였지?');
  await say('me', '인천에서 읽고, 걷고, 쓰면서 세계를 만났어!', 'happy');
  await say('nuri', '과연 **세계시민 인증**을 통과했을까? 두구두구두구…', 'wow');
  hideTalk(); hideAll();
  const bonus = G.flags.madePlan && G.money >= 5000 ? PLAN_BONUS : 0; G.score.money += bonus;
  const score = total(), [, tier, icon, msg] = tierOf(score), passed = score >= PASS_SCORE;
  const board = LS.get('sg-board', []); const me = { id:Date.now(), name:G.name, avatar:G.avatar, score, tier, passed };
  board.push(me); board.sort((a, b) => b.score - a.score || a.id - b.id); LS.set('sg-board', board.slice(0, 300));
  LS.set('sg-plays', LS.get('sg-plays', 0) + 1); LS.set('sg-passes', LS.get('sg-passes', 0) + (passed ? 1 : 0));
  const rank = board.findIndex(e => e.id === me.id) + 1;
  snd(passed ? 'sfx_fanfare' : 'sfx_low'); if(passed) confetti(260);
  const wins = G.gameLog.filter(g => g.result === 'win').length, qok = G.quizLog.filter(Boolean).length, tw = G.tickets.filter(t => t.won).length;
  return new Promise(resolve => {
    const render = page => {
      const el = openOverlay(`<div class="dim endscreen"><div class="card cert">
        ${page === 1 ? `
        <div class="c-top"><div class="c-av">${charSVG(G.avatar, passed ? 'happy' : 'sad')}</div>
          <div><small>슬기로운 인천 세계시민 탐방</small><h1>${esc(G.name)}의 인증 결과</h1>
          <div class="c-stamp ${passed ? 'ok' : 'no'}">${passed ? '인증 통과!' : '아쉽게 탈락…'}</div></div>
          <div class="c-av">${charSVG('nuri', passed ? 'happy' : 'sad')}</div></div>
        <div class="c-tier">${icon} ${esc(tier)}</div><p class="c-msg">${esc(msg)}</p>
        <div class="c-score">총점 <b>${score}</b>점 · 통과 기준 ${PASS_SCORE}점 · 만점 ${MAX_SCORE}점</div>
        <div class="c-stats"><span>📍 미션 통과 ${G.passed}/8</span><span>🤪 넌센스 ${qok}/4</span><span>🤖 대결 승리 ${wins}/4</span><span>🎫 복권 당첨 ${tw}/${G.tickets.length}</span><span>🔥 최고 콤보 ${G.maxCombo}</span></div>
        <div class="c-stats"><span>💰 남은 용돈 ${G.money.toLocaleString('ko-KR')}원</span>${G.lotterySpent ? `<span>🎰 복권에 쓴 돈 ${G.lotterySpent.toLocaleString('ko-KR')}원 → 당첨금 ${G.lotteryWon.toLocaleString('ko-KR')}원</span>` : ''}${bonus ? `<span>💡 예산 지킴 보너스 +${bonus}</span>` : ''}</div>
        <div class="c-rank">🏅 이 기기 참가자 ${board.length}명 중 <b>${rank}위</b>!</div>
        <div class="c-pass">${STOPS.map(s => { const t = G.stamps[s.id]; return `<div class="cp ${t === 'best' ? 'ok' : 'no'}"><span>${s.icon}</span><small>${esc(s.short)}</small></div>`; }).join('')}</div>
        <div class="c-msg2">우리 동네 인천에서 <b>읽고 · 걷고 · 쓰며</b> 세계를 만나는 너는, 이미 슬기로운 세계시민!</div>
        <div class="btns"><button class="btn sub" id="eNext">자세히 보기 ▶</button><button class="btn" id="eAgain">처음으로 ↺</button></div>`
        : `
        <h1>📊 영역별 점수 & 나의 선택</h1>
        <div class="c-two"><div class="bars">${CATS.map(([k, n]) => `<div class="bar"><label>${n}</label><div class="track"><div class="fill" style="width:${Math.min(100, Math.round(100 * G.score[k] / CATMAX[k]))}%"></div></div><em>${G.score[k]}/${CATMAX[k]}</em></div>`).join('')}</div>
        <ul class="review">${G.log.map(l => `<li class="${l.tag}"><span>${l.sid === 'shop' ? '🎰' : STOPS.find(s => s.id === l.sid).icon}</span>${esc(l.label)}<b>+${l.gained}</b></li>`).join('')}</ul></div>
        <h3>🏅 명예의 전당 TOP 5</h3>
        <table class="top5">${board.slice(0, 5).map((e, i) => `<tr class="${e.id === me.id ? 'me' : ''}"><td>${['🥇','🥈','🥉'][i] || (i + 1) + '위'}</td><td class="b-av">${charSVG(e.avatar || 'harin', 'normal')}</td><td>${esc(e.name)}</td><td>${esc(e.tier)}</td><td><b>${e.score}점</b></td></tr>`).join('')}</table>
        <div class="btns"><button class="btn sub" id="ePrev">◀ 이전</button><button class="btn sub" id="eClear">순위 초기화(선생님용)</button><button class="btn" id="eAgain">처음으로 ↺</button></div>`}
      </div></div>`);
      el.querySelector('#eNext')?.addEventListener('click', () => { snd('sfx_click'); render(2); });
      el.querySelector('#ePrev')?.addEventListener('click', () => { snd('sfx_click'); render(1); });
      el.querySelector('#eClear')?.addEventListener('click', async () => { if(await confirmBox('이 기기에 저장된 순위와 통과율 기록을 모두 지울까요?')){ LS.set('sg-board', []); LS.set('sg-plays', 0); LS.set('sg-passes', 0); toast('순위를 초기화했어요.'); } });
      el.querySelector('#eAgain').addEventListener('click', () => { snd('sfx_click'); closeOverlay(); resolve(); });
    };
    render(1);
  });
}

/* ---------- 실행 ---------- */
const CHAPTERS = [ch_home, ch_museum, ch_hambak, ch_sinpo, ch_baengnyeong, ch_songdo, ch_ganghwa, ch_library];
$('#hudPass').onclick = e => { e.stopPropagation(); snd('sfx_click'); openPassport(); };
$('#hudSound').onclick = e => { e.stopPropagation(); toggleSound(); };
async function main(){
  while(true){
    resetState();
    await titleScreen();
    closeOverlay();
    await pickAvatar();
    hud(true);
    for(const ch of CHAPTERS) await ch();
    await ending();
  }
}
main();
