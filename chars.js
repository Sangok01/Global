/* =====================================================================
   슬기로운 인천 세계시민 탐방 — 3D 점토 스타일 캐릭터 (SVG, 그림 파일 없음)
   char(id, expr) 를 부르면 SVG 문자열이 나와요.  expr: normal · happy · sad · wow · think
   ===================================================================== */
'use strict';

let _uid = 0;
function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* 공통 정의: 3D 느낌 그라데이션 */
function defs(p, colors){
  let s = `<defs><filter id="${p}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>`;
  for(const [k, c] of Object.entries(colors)){
    s += `<radialGradient id="${p}${k}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="${shade(c, .42)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.32)}"/></radialGradient>`;
    s += `<linearGradient id="${p}${k}L" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(c, .28)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.3)}"/></linearGradient>`;
  }
  s += `<radialGradient id="${p}iris" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="${colors.eye || '#5a4030'}"/><stop offset="1" stop-color="#1d1824"/></radialGradient>`;
  s += `</defs>`;
  return s;
}

/* 표정 */
function face(p, expr, eye){
  const L = 155, R = 245, Y = 196;
  let eyes = '', brows = '', mouth = '';
  const openEye = (x, sx = 1, sy = 1, look = 0) => `
    <ellipse cx="${x + look}" cy="${Y}" rx="${21 * sx}" ry="${28 * sy}" fill="url(#${p}iris)"/>
    <ellipse cx="${x + look}" cy="${Y + 10 * sy}" rx="${13 * sx}" ry="${10 * sy}" fill="${eye}" opacity=".55"/>
    <circle cx="${x - 7 * sx + look}" cy="${Y - 11 * sy}" r="${8 * sx}" fill="#fff"/>
    <circle cx="${x + 8 * sx + look}" cy="${Y + 9 * sy}" r="${3.6 * sx}" fill="#fff" opacity=".9"/>`;
  const smileEye = x => `<path d="M${x - 22} ${Y + 4} Q${x} ${Y - 22} ${x + 22} ${Y + 4}" stroke="#2a2230" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  const brow = (x, tilt) => `<path d="M${x - 22} ${150 + tilt} Q${x} ${140} ${x + 22} ${150 - tilt}" stroke="#4a3528" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>`;
  switch(expr){
    case 'happy':
      eyes = smileEye(L) + smileEye(R);
      brows = brow(L, 0) + brow(R, 0);
      mouth = `<path d="M170 236 Q200 278 230 236 Z" fill="#b8434f"/><path d="M180 252 Q200 268 220 252 Q200 258 180 252Z" fill="#ff8f9b"/>`;
      break;
    case 'sad':
      eyes = openEye(L, 1, .9) + openEye(R, 1, .9);
      brows = `<path d="M134 152 L176 142" stroke="#4a3528" stroke-width="7" stroke-linecap="round" opacity=".8"/><path d="M266 152 L224 142" stroke="#4a3528" stroke-width="7" stroke-linecap="round" opacity=".8"/>`;
      mouth = `<path d="M182 250 Q200 236 218 250" stroke="#8a3a44" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      break;
    case 'wow':
      eyes = openEye(L, 1.12, 1.12) + openEye(R, 1.12, 1.12);
      brows = brow(L, -4) + brow(R, -4);
      mouth = `<ellipse cx="200" cy="248" rx="14" ry="18" fill="#9c3442"/><ellipse cx="200" cy="254" rx="8" ry="7" fill="#ff8f9b"/>`;
      break;
    case 'think':
      eyes = openEye(L, 1, 1, 8) + openEye(R, 1, 1, 8);
      brows = brow(L, 4) + `<path d="M224 144 Q246 136 268 146" stroke="#4a3528" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>`;
      mouth = `<path d="M186 246 Q200 242 216 248" stroke="#8a3a44" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      break;
    default:
      eyes = openEye(L) + openEye(R);
      brows = brow(L, 0) + brow(R, 0);
      mouth = `<path d="M182 238 Q200 256 218 238" stroke="#8a3a44" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  }
  return `<g class="blink">${eyes}</g>${brows}${mouth}`;
}

/* 머리 모양 (뒤 / 앞) */
function hair(p, style){
  const H = `url(#${p}hair)`;
  const shine = `<path d="M128 92 Q170 66 222 70" stroke="#fff" stroke-opacity=".35" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  switch(style){
    case 'ponytail': return {
      back: `<g class="sway"><ellipse cx="318" cy="150" rx="46" ry="84" transform="rotate(28 318 150)" fill="${H}"/><circle cx="292" cy="96" r="17" fill="url(#${p}acc)"/></g>`,
      front: `<path d="M80 196 C66 92 130 46 202 46 C276 46 334 92 320 196 C308 146 276 112 236 112 C220 140 172 152 146 124 C118 138 96 162 80 196Z" fill="${H}"/>${shine}` };
    case 'cap': return {
      back: `<path d="M86 200 C80 120 130 70 200 70 C270 70 320 120 314 200 Z" fill="${H}"/>`,
      front: `<path d="M84 150 C84 70 140 40 200 40 C262 40 318 70 316 150 C270 128 130 128 84 150Z" fill="url(#${p}acc)"/>
              <path d="M84 150 C130 130 270 130 316 150" stroke="${'#fff'}" stroke-opacity=".5" stroke-width="5" fill="none"/>
              <ellipse cx="128" cy="150" rx="88" ry="22" transform="rotate(-8 128 150)" fill="url(#${p}accL)"/>
              <circle cx="200" cy="44" r="10" fill="url(#${p}acc)"/>
              <path d="M150 70 Q200 54 252 66" stroke="#fff" stroke-opacity=".35" stroke-width="9" fill="none" stroke-linecap="round"/>
              <path d="M302 166 Q308 182 304 194 M98 166 Q92 182 96 194" stroke="${H}" stroke-width="10" stroke-linecap="round" fill="none"/>` };
    case 'bob': return {
      back: `<path d="M70 190 C60 80 130 40 200 40 C270 40 340 80 330 190 L334 286 Q300 300 280 268 L120 268 Q100 300 66 286Z" fill="${H}"/>`,
      front: `<path d="M78 200 C70 86 132 48 200 48 C268 48 330 86 322 200 C314 160 306 132 290 120 L276 150 L258 118 L238 150 L220 116 L200 150 L180 116 L162 150 L142 118 L124 150 L110 120 C94 132 86 160 78 200Z" fill="${H}"/>
              <g transform="translate(278 108) rotate(20)"><rect x="-26" y="-9" width="52" height="18" rx="9" fill="url(#${p}accL)"/><circle cx="-26" cy="0" r="12" fill="url(#${p}acc)"/></g>${shine}` };
    case 'curly': {
      let c = '';
      const pts = [[96,150],[100,112],[124,82],[156,62],[194,54],[232,58],[266,74],[292,100],[306,134],[308,166],[90,186]];
      for(const [x, y] of pts) c += `<circle cx="${x}" cy="${y}" r="34" fill="${H}"/>`;
      return { back: `<path d="M84 200 C80 110 130 60 200 60 C270 60 320 110 316 200Z" fill="${H}"/>`,
        front: c + `<circle cx="150" cy="96" r="28" fill="${H}"/><circle cx="196" cy="88" r="30" fill="${H}"/><circle cx="244" cy="96" r="28" fill="${H}"/>
          <circle cx="182" cy="74" r="9" fill="#fff" opacity=".25"/><circle cx="232" cy="82" r="8" fill="#fff" opacity=".22"/>` };
    }
    case 'beret': return {
      back: `<path d="M74 196 C62 110 120 56 200 56 C280 56 338 110 326 196 C340 240 330 280 304 300 C300 250 290 220 280 200 L120 200 C110 220 100 250 96 300 C70 280 60 240 74 196Z" fill="${H}"/>`,
      front: `<path d="M82 196 C74 100 132 62 200 62 C268 62 326 100 318 196 C300 150 264 124 230 128 C206 150 160 142 140 128 C112 140 92 166 82 196Z" fill="${H}"/>
              <ellipse cx="214" cy="68" rx="118" ry="44" transform="rotate(-10 214 68)" fill="url(#${p}acc)"/>
              <circle cx="232" cy="26" r="9" fill="url(#${p}acc)"/>
              <path d="M140 60 Q200 34 270 44" stroke="#fff" stroke-opacity=".35" stroke-width="9" fill="none" stroke-linecap="round"/>` };
    case 'spiky': return {
      back: `<path d="M84 200 C80 110 130 64 200 64 C270 64 320 110 316 200Z" fill="${H}"/>`,
      front: `<path d="M80 190 L84 120 L60 104 L106 92 L98 56 L144 70 L156 30 L190 62 L214 22 L236 64 L272 34 L270 78 L314 70 L300 108 L336 126 L318 150 L320 190 C300 150 270 130 236 126 L220 150 L196 124 L170 150 L150 124 C120 132 96 160 80 190Z" fill="${H}"/>
              <path d="M150 74 L170 56 M206 52 L218 36" stroke="#fff" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/>` };
  }
  return { back:'', front:'' };
}

/* 초등학생 캐릭터 */
function kid(c, expr = 'normal'){
  const p = 'k' + (++_uid) + '_';
  const hr = hair(p, c.hair);
  const waving = expr === 'happy';
  const armL = `<g class="arm-l"><rect x="98" y="300" width="44" height="132" rx="22" transform="rotate(14 120 306)" fill="url(#${p}shirtL)"/>
                <circle cx="94" cy="430" r="25" fill="url(#${p}skin)"/></g>`;
  const sc = shade(c.shirt, -.08);
  const armR = waving
    ? `<g class="wave"><path d="M270 320 L356 214" stroke="${sc}" stroke-width="44" stroke-linecap="round"/>
       <path d="M266 316 L346 222" stroke="#fff" stroke-opacity=".18" stroke-width="12" stroke-linecap="round"/>
       <circle cx="362" cy="204" r="27" fill="url(#${p}skin)"/></g>`
    : expr === 'think' ? ''
    : `<g class="arm-r"><rect x="258" y="300" width="44" height="132" rx="22" transform="rotate(-14 280 306)" fill="url(#${p}shirtL)"/>
       <circle cx="306" cy="430" r="25" fill="url(#${p}skin)"/></g>`;
  const thinkArm = expr === 'think'
    ? `<path d="M268 322 Q306 300 256 274" stroke="${sc}" stroke-width="42" fill="none" stroke-linecap="round"/><circle cx="244" cy="268" r="25" fill="url(#${p}skin)"/>` : '';
  const acc = [];
  if(c.glasses) acc.push(`<g fill="none" stroke="#3a3346" stroke-width="7"><rect x="122" y="166" width="66" height="58" rx="22"/><rect x="212" y="166" width="66" height="58" rx="22"/><path d="M188 190 Q200 182 212 190"/></g>
     <path d="M132 176 L150 172" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/><path d="M222 176 L240 172" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`);
  const badge = `<circle cx="236" cy="350" r="18" fill="url(#${p}acc)"/><path d="M228 350 l6 6 l10 -12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" class="kidsvg">${defs(p, { skin:c.skin, hair:c.hairColor, shirt:c.shirt, pants:c.pants, acc:c.acc, shoe:c.shoe || '#f4f1ea', eye:c.eye })}
    <ellipse cx="200" cy="584" rx="108" ry="14" fill="#2b2533" opacity=".2" filter="url(#${p}blur)"/>
    <g class="body">
      ${hr.back}
      <rect x="146" y="440" width="46" height="120" rx="22" fill="url(#${p}pantsL)"/>
      <rect x="208" y="440" width="46" height="120" rx="22" fill="url(#${p}pantsL)"/>
      <ellipse cx="166" cy="566" rx="38" ry="20" fill="url(#${p}shoe)"/><ellipse cx="234" cy="566" rx="38" ry="20" fill="url(#${p}shoe)"/>
      <path d="M150 562 Q166 554 186 562" stroke="${shade(c.acc, -.1)}" stroke-width="5" fill="none"/><path d="M214 562 Q234 554 252 562" stroke="${shade(c.acc, -.1)}" stroke-width="5" fill="none"/>
      ${armL}
      <rect x="124" y="282" width="152" height="196" rx="66" fill="url(#${p}shirt)"/>
      <path d="M160 290 Q200 318 240 290" stroke="${shade(c.shirt, .55)}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M146 300 L150 440 M254 300 L250 440" stroke="${shade(c.acc, -.15)}" stroke-width="13" stroke-linecap="round"/>
      <ellipse cx="170" cy="336" rx="22" ry="40" fill="#fff" opacity=".18" filter="url(#${p}soft)"/>
      ${badge}
      ${armR}
      <g class="head">
        <circle cx="86" cy="196" r="24" fill="url(#${p}skin)"/><circle cx="314" cy="196" r="24" fill="url(#${p}skin)"/>
        <circle cx="200" cy="180" r="120" fill="url(#${p}skin)"/>
        <ellipse cx="150" cy="120" rx="46" ry="30" fill="#fff" opacity=".22" filter="url(#${p}soft)"/>
        <ellipse cx="128" cy="232" rx="24" ry="14" fill="#ff8d8d" opacity=".42" filter="url(#${p}soft)"/>
        <ellipse cx="272" cy="232" rx="24" ry="14" fill="#ff8d8d" opacity=".42" filter="url(#${p}soft)"/>
        ${face(p, expr, c.eye)}
        ${acc.join('')}
        ${hr.front}
      </g>
      ${thinkArm}
    </g></svg>`;
}

/* AI 친구 누리 (둥근 드론 로봇) */
function nuri(expr = 'normal'){
  const p = 'n' + (++_uid) + '_';
  const glow = '#7ff0e0';
  let eyes, mouth;
  switch(expr){
    case 'happy': eyes = `<path d="M146 236 Q166 210 186 236" stroke="${glow}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M214 236 Q234 210 254 236" stroke="${glow}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
      mouth = `<path d="M178 262 Q200 290 222 262" stroke="${glow}" stroke-width="10" fill="none" stroke-linecap="round"/>`; break;
    case 'wow': eyes = `<circle cx="166" cy="230" r="22" fill="${glow}"/><circle cx="234" cy="230" r="22" fill="${glow}"/><circle cx="166" cy="230" r="9" fill="#173040"/><circle cx="234" cy="230" r="9" fill="#173040"/>`;
      mouth = `<ellipse cx="200" cy="276" rx="12" ry="14" fill="${glow}"/>`; break;
    case 'think': eyes = `<rect x="146" y="226" width="40" height="10" rx="5" fill="${glow}"/><ellipse cx="234" cy="230" rx="16" ry="20" fill="${glow}"/>`;
      mouth = `<path d="M182 272 L218 266" stroke="${glow}" stroke-width="9" stroke-linecap="round"/>`; break;
    case 'sad': eyes = `<ellipse cx="166" cy="234" rx="15" ry="18" fill="${glow}"/><ellipse cx="234" cy="234" rx="15" ry="18" fill="${glow}"/>`;
      mouth = `<path d="M182 280 Q200 262 218 280" stroke="${glow}" stroke-width="9" fill="none" stroke-linecap="round"/>`; break;
    default: eyes = `<ellipse cx="166" cy="232" rx="16" ry="21" fill="${glow}"/><ellipse cx="234" cy="232" rx="16" ry="21" fill="${glow}"/><circle cx="160" cy="222" r="6" fill="#fff"/><circle cx="228" cy="222" r="6" fill="#fff"/>`;
      mouth = `<path d="M182 266 Q200 282 218 266" stroke="${glow}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" class="kidsvg nurisvg">${defs(p, { body:'#e9f7f6', ring:'#3fb6a8', ear:'#ffb547', visor:'#22324a' })}
    <ellipse cx="200" cy="584" rx="96" ry="12" fill="#2b2533" opacity=".18" filter="url(#${p}blur)"/>
    <g class="hover">
      <ellipse cx="200" cy="496" rx="74" ry="18" fill="${glow}" opacity=".45" filter="url(#${p}blur)"/>
      <ellipse cx="200" cy="470" rx="62" ry="24" fill="url(#${p}ring)"/>
      <ellipse cx="200" cy="462" rx="46" ry="12" fill="#fff" opacity=".35"/>
      <g class="ears">
        <rect x="30" y="226" width="48" height="96" rx="24" fill="url(#${p}ear)"/><rect x="322" y="226" width="48" height="96" rx="24" fill="url(#${p}ear)"/>
        <path d="M136 150 L104 74" stroke="url(#${p}ringL)" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="66" r="17" fill="url(#${p}ear)"/>
        <path d="M264 150 L296 74" stroke="url(#${p}ringL)" stroke-width="10" stroke-linecap="round"/><circle cx="300" cy="66" r="17" fill="url(#${p}ear)"/>
      </g>
      <circle cx="200" cy="270" r="150" fill="url(#${p}body)"/>
      <ellipse cx="146" cy="176" rx="58" ry="34" fill="#fff" opacity=".6" filter="url(#${p}soft)"/>
      <path d="M62 300 Q200 360 338 300" stroke="url(#${p}ringL)" stroke-width="12" fill="none" opacity=".9"/>
      <rect x="104" y="180" width="192" height="130" rx="64" fill="url(#${p}visor)"/>
      <path d="M128 200 Q176 182 236 190" stroke="#fff" stroke-opacity=".25" stroke-width="10" fill="none" stroke-linecap="round"/>
      <g class="blink">${eyes}</g>${mouth}
      <ellipse cx="128" cy="300" rx="16" ry="10" fill="#ff9aa8" opacity=".55"/><ellipse cx="272" cy="300" rx="16" ry="10" fill="#ff9aa8" opacity=".55"/>
      <circle cx="200" cy="364" r="20" fill="url(#${p}ring)"/><text x="200" y="372" font-family="Jua, sans-serif" font-size="22" fill="#fff" text-anchor="middle">AI</text>
    </g></svg>`;
}

/* 캐릭터 설정 */
const AVATARS = {
  harin: { name:'하린', desc:'씩씩한 탐험 리더', hair:'ponytail', skin:'#ffd9bf', hairColor:'#5b3a29', shirt:'#ff7f7f', pants:'#4f6ad6', acc:'#ffc93c', eye:'#7a4b2a' },
  junu:  { name:'준우', desc:'뭐든 궁금한 질문왕', hair:'cap', skin:'#f7cfae', hairColor:'#2d2430', shirt:'#4fb3ff', pants:'#3e4a66', acc:'#ff6f59', eye:'#4a3a2a' },
  jia:   { name:'지아', desc:'꼼꼼한 기록 담당', hair:'bob', skin:'#ffe0c9', hairColor:'#3a2a24', shirt:'#b48cff', pants:'#ff8fb1', acc:'#5ad1a8', eye:'#5a3a2a' },
  dohyun:{ name:'도현', desc:'AI 척척박사', hair:'curly', skin:'#eec39c', hairColor:'#4a2f22', shirt:'#59cf8c', pants:'#5b5f7a', acc:'#ffb547', eye:'#3a2a1a', glasses:true },
};
const NPC_KIDS = {
  anya: { name:'아냐', hair:'beret', skin:'#ffe6d3', hairColor:'#b9763d', shirt:'#ffcf4d', pants:'#4aa58f', acc:'#e2584f', eye:'#3f7f62' },
  taeo: { name:'태오', hair:'spiky', skin:'#f4cba6', hairColor:'#2c2a33', shirt:'#ff9f43', pants:'#4b5ca8', acc:'#4fb3ff', eye:'#3a2a1a' },
};
function charSVG(id, expr){
  if(id === 'nuri') return nuri(expr);
  const c = AVATARS[id] || NPC_KIDS[id];
  return kid(c, expr);
}
