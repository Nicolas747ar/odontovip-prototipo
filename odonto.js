/* Odontograma com desenho anatômico — blueprint/06-pantallas-pc.md §5c
   Notação FDI: quadrante (1–4 permanentes, 5–8 decíduos) + posição (1 incisivo central … 8 terceiro molar). */
const REGIOES = { ASAI: 'Boca completa', AS: 'Arcada superior', AI: 'Arcada inferior' };
const ehRegiao = n => n in REGIOES;
const quad = n => Math.floor(n / 10), pos = n => n % 10;
const ehSup = n => [1, 2, 5, 6].includes(quad(n));
const ehDecid = n => quad(n) >= 5;
const naEsquerdaDaTela = n => [1, 4, 5, 8].includes(quad(n)); // lado direito do paciente
const ehAnterior = n => pos(n) <= 3;

function tipoDente(n) {
  const p = pos(n);
  if (p <= 2) return 'incisivo';
  if (p === 3) return 'canino';
  if (ehDecid(n)) return 'molar';
  return p <= 5 ? 'premolar' : 'molar';
}
function geometria(n) {
  const t = tipoDente(n), p = pos(n), sup = ehSup(n), d = ehDecid(n), k = d ? 0.72 : 1;
  let w, h, r, raizes;
  if (t === 'incisivo') { w = sup ? (p === 1 ? 22 : 18) : 15; h = 26; r = 30; raizes = 1; }
  else if (t === 'canino') { w = 20; h = 28; r = 39; raizes = 1; }
  else if (t === 'premolar') { w = 21; h = 24; r = 30; raizes = sup && p === 4 ? 2 : 1; }
  else { w = d ? (p === 4 ? 30 : 33) : (p === 6 ? 33 : p === 7 ? 31 : 28); h = 22; r = 26; raizes = sup ? 3 : 2; }
  return { t, w: w * k, h: h * k, r: r * k, raizes };
}
function coroaPath(t, w, h) {
  const x0 = -w / 2, x1 = w / 2;
  if (t === 'incisivo') return `M${x0},0 C${x0},${h * .55} ${x0 + 1.5},${h} ${x0 + 4},${h} L${x1 - 4},${h} C${x1 - 1.5},${h} ${x1},${h * .55} ${x1},0 Z`;
  if (t === 'canino') return `M${x0},0 C${x0},${h * .5} ${x0 + w * .2},${h * .82} 0,${h + 2} C${x1 - w * .2},${h * .82} ${x1},${h * .5} ${x1},0 Z`;
  if (t === 'premolar') return `M${x0},0 C${x0},${h * .6} ${x0 + 1},${h * .9} ${x0 + w * .28},${h + 1.5} Q0,${h - 3} ${x1 - w * .28},${h + 1.5} C${x1 - 1},${h * .9} ${x1},${h * .6} ${x1},0 Z`;
  return `M${x0},0 C${x0},${h * .6} ${x0 + 1},${h * .92} ${x0 + w * .2},${h + 1.5} Q${x0 + w * .35},${h - 3} 0,${h + 1.5} Q${x1 - w * .35},${h - 3} ${x1 - w * .2},${h + 1.5} C${x1 - 1},${h * .92} ${x1},${h * .6} ${x1},0 Z`;
}
function raizesPath(qtd, w, r) {
  const b = w * .78;
  const uma = (x0, x1, ax, rr) => `M${x0},0 C${x0},${-rr * .55} ${ax - (x1 - x0) * .18},${-rr} ${ax},${-rr} C${ax + (x1 - x0) * .18},${-rr} ${x1},${-rr * .55} ${x1},0 Z`;
  if (qtd === 1) return [uma(-b / 2, b / 2, 0, r)];
  const ps = [uma(-b / 2, -0.8, -b * .3, r), uma(0.8, b / 2, b * .3, r)];
  if (qtd === 3) ps.unshift(uma(-b * .18, b * .18, 0, r * .82));
  return ps;
}
/* ---------- condições: o que o dente É (cor de preenchimento) ---------- */
const CONDICOES = {
  higido: ['Hígido', '#2e9e5b'], cariado: ['Cariado', '#d6342c'], restaurado: ['Restaurado', '#2f6fd6'],
  fraturado: ['Fraturado', '#1f2328'] /* preto, como pediu a Dra. Marcelly (R19) */, acompanhamento: ['Em acompanhamento', '#d29b1f'], canal: ['Canal tratado', '#e0702a'],
  coroa: ['Coroa', '#a8792c'], implante: ['Implante', '#7b4fd6'], extraido: ['Extraído', '#ffffff'], ausente: ['Ausente', '#8a96a8'],
};
const ABREV = { higido: 'H', cariado: 'C', restaurado: 'R', fraturado: 'F', acompanhamento: 'A', canal: 'Ca', coroa: 'Co', implante: 'I', extraido: 'X', ausente: 'Au' };
const corTexto = k => k === 'extraido' ? '#5b6b82' : k === 'acompanhamento' ? '#8a5a00' : CONDICOES[k][1];
function condicoesPac(pid) {
  let c = E.d.existentes[pid];
  if (!c) c = E.d.existentes[pid] = [];
  if (!Array.isArray(c)) c = E.d.existentes[pid] = Object.entries(c).map(([n, cond]) => ({ id: uid(), n, cond, faces: [], data: '2026-09-01', por: 'p-mar' }));
  return c;
}
/* estado de hoje: último registro vence; tratamentos feitos viram condição */
function estadoDente(pid, n) {
  n = String(n);
  const regs = condicoesPac(pid).filter(r => r.n === n).sort((a, b) => a.data.localeCompare(b.data));
  let geral = null, canal = false; const faces = {};
  regs.forEach(r => { if (r.cond === 'canal') canal = true; else if (r.faces.length) r.faces.forEach(f => faces[f] = r.cond); else geral = r.cond; });
  plano(pid).filter(i => i.dente === n && i.estado === 'realizado').forEach(i => {
    const t = proc(i.proc).tipo;
    if (t === 'faces') i.faces.forEach(f => faces[f] = 'restaurado');
    else if (t === 'canal') canal = true;
    else if (i.proc === 'coroa') geral = 'coroa';
    else if (i.proc === 'implante') geral = 'implante';
    else if (i.proc === 'exodontia') geral = 'extraido';
  });
  return { geral, faces, canal, regs };
}
/* estado mais avançado dos itens do plano num dente/face */
function itensDoDente(pid, n) { return plano(pid).filter(i => i.dente === String(n) && i.estado !== 'recusado'); }
function pendentes(pid, n) { return itensDoDente(pid, n).filter(i => ['indicado', 'aprovado', 'observado'].includes(i.estado)); }
function estadoTopo(its) {
  if (its.some(i => i.estado === 'realizado')) return 'realizado';
  if (its.some(i => i.estado === 'aprovado' || i.estado === 'observado')) return 'aprovado';
  return its.length ? 'indicado' : null;
}
const COR = {
  borda: '#93a2b6', indicado: '#1880BF', aprovado: '#1880BF', realizado: '#157F3B',
  fIndicado: '#EDF4FB', fAprovado: '#9cc9e8', fRealizado: '#9fd8b2', fExiste: '#cfd6e0', fSel: '#0A5C96',
};

/* até 2 condições, para a letra ao lado do número */
const condsDente = est => [...new Set([est.geral, ...Object.values(est.faces), est.canal ? 'canal' : null].filter(Boolean))].slice(0, 2);
/* desenho de um dente. op: { escala, rotulos, sel: [faces], clicavel, cel } — cel: usa o estado e as ações do celular */
function denteSVG(pid, n, op = {}) {
  const g = geometria(n), sup = ehSup(n), dec = ehDecid(n), esc = op.escala || 1;
  const W = dec ? 38 : 46, H = dec ? 100 : 122, S = dec ? 18 : 24, a = S * .34;
  const CY = sup ? (dec ? 34 : 44) : H - (dec ? 34 : 44);
  const GAP = op.rotulos ? 12 : 7;
  const FY = sup ? CY + g.h + GAP : CY - g.h - GAP - S;
  const NY = sup ? H - 3 : 11;
  const est = estadoDente(pid, n), pend = pendentes(pid, n);
  const temPend = pend.length, aprovado = pend.some(i => i.estado !== 'indicado');
  const facesPend = new Set(pend.flatMap(i => i.faces));
  const sel = (op.cel ? E.ui.cel.dente : E.ui.pc.dente) === String(n);
  const aDente = op.cel ? 'celDente' : 'dente';
  const flip = sup ? '' : ' scale(1,-1)';
  const sumido = est.geral === 'ausente' || est.geral === 'extraido';
  // condição escolhida sem nenhuma face marcada = vale para o dente todo: mostra a prévia na coroa
  const geralVista = op.previa && !(op.sel || []).length ? op.previa : est.geral;
  const corCoroaCond = geralVista && !sumido ? CONDICOES[geralVista][1] : null;
  const fillCoroa = corCoroaCond ? corCoroaCond + '55' : '#fffdf8';
  const bordaCoroa = temPend ? '#1880BF' : corCoroaCond || '#93a2b6';
  const tracejado = temPend && !aprovado ? 'stroke-dasharray="3 2"' : '';
  const raiz = est.geral === 'implante'
    ? `<g>${Array.from({ length: 6 }, (_, i) => `<rect x="${-g.w * .18}" y="${-(i + 1) * g.r / 6.5}" width="${g.w * .36}" height="${g.r / 9}" rx="1" fill="#b6a3e6"/>`).join('')}</g>`
    : raizesPath(g.raizes, g.w, g.r).map(d => `<path d="${d}" fill="#f4efe2" stroke="#a3afbf" stroke-width="1"/>`).join('');
  const canalPend = pend.some(i => proc(i.proc).tipo === 'canal');
  const canal = est.canal || canalPend ? `<path d="M0,-2 L0,${-g.r * .8}" stroke="${est.canal ? CONDICOES.canal[1] : '#1880BF'}" stroke-width="2.6" stroke-linecap="round" ${!est.canal ? 'stroke-dasharray="3 2"' : ''}/>` : '';
  // cáries/restaurações por face também aparecem no perfil (faixa na borda oclusal)
  const fOcl = est.faces.O || est.faces.D || est.faces.M;
  const marcaPerfil = fOcl && !sumido ? `<path d="M${-g.w / 2 + 2},${g.h * .62} L${g.w / 2 - 2},${g.h * .62} L${g.w / 2 - 2},${g.h - 1} L${-g.w / 2 + 2},${g.h - 1} Z" fill="${CONDICOES[fOcl][1]}" opacity=".75"/>` : '';
  const perfil = `<g transform="translate(${W / 2},${CY})${flip}">${raiz}${canal}
    <path d="${coroaPath(g.t, g.w, g.h)}" fill="${fillCoroa}" stroke="${bordaCoroa}" stroke-width="${temPend ? 2 : 1.1}" ${tracejado}/>${marcaPerfil}</g>`;

  const mesialDir = naEsquerdaDaTela(n);
  const lado = { top: sup ? 'V' : 'L', bottom: sup ? 'L' : 'V', right: mesialDir ? 'M' : 'D', left: mesialDir ? 'D' : 'M' };
  const rotFace = f => f === 'L' ? (sup ? 'P' : 'L') : f === 'O' ? (ehAnterior(n) ? 'I' : 'O') : f;
  const fillFace = f => {
    if ((op.sel || []).includes(f)) return op.previa ? CONDICOES[op.previa][1] : '#dbe9f6'; // prévia da condição escolhida
    if (est.faces[f]) return CONDICOES[est.faces[f]][1];
    if (corCoroaCond && ['coroa', 'fraturado', 'acompanhamento', 'cariado', 'restaurado'].includes(geralVista)) return corCoroaCond + '88';
    return '#fffdf8';
  };
  const fx = (W - S) / 2, fy = FY;
  const poly = (f, pts) => { const p = facesPend.has(f), sf = (op.sel || []).includes(f);
    return `<polygon points="${pts}" fill="${fillFace(f)}" stroke="${sf ? '#0B1F3F' : p ? '#1880BF' : '#aeb9c8'}" stroke-width="${sf ? 2.6 : p ? 1.8 : .8}" ${p && !aprovado && !sf ? 'stroke-dasharray="2 1.5"' : ''} ${op.clicavel ? `data-a="${op.cel ? 'celFace' : 'faceDente'}" data-n="${n}" data-f="${f}" style="cursor:pointer"` : ''}><title>${{ V: 'Vestibular', M: 'Mesial', D: 'Distal', L: sup ? 'Palatina' : 'Lingual', O: ehAnterior(n) ? 'Incisal' : 'Oclusal' }[f]}${est.faces[f] ? ' · ' + CONDICOES[est.faces[f]][0] : ''}</title></polygon>`; };
  const P = (x, y) => `${fx + x},${fy + y}`;
  const cid = `cl${n}-${String(esc).replace('.', '_')}`;
  const faces = `<g clip-path="url(#${cid})">
    ${poly(lado.top, [P(0, 0), P(S, 0), P(S - a, a), P(a, a)].join(' '))}
    ${poly(lado.right, [P(S, 0), P(S, S), P(S - a, S - a), P(S - a, a)].join(' '))}
    ${poly(lado.bottom, [P(S, S), P(0, S), P(a, S - a), P(S - a, S - a)].join(' '))}
    ${poly(lado.left, [P(0, S), P(0, 0), P(a, a), P(a, S - a)].join(' '))}
    ${poly('O', [P(a, a), P(S - a, a), P(S - a, S - a), P(a, S - a)].join(' '))}</g>
    <circle cx="${fx + S / 2}" cy="${fy + S / 2}" r="${S / 2 - .4}" fill="none" stroke="#93a2b6" stroke-width="1" pointer-events="none"/>`;
  const rotulos = op.rotulos ? [['top', S / 2, -3], ['bottom', S / 2, S + 8], ['left', -5, S / 2 + 3], ['right', S + 5, S / 2 + 3]]
    .map(([k, x, y]) => `<text x="${fx + x}" y="${fy + y}" font-size="6" text-anchor="middle" fill="#40536F" font-weight="700">${rotFace(lado[k])}</text>`).join('')
    + `<text x="${fx + S / 2}" y="${fy + S / 2 + 2}" font-size="5.5" text-anchor="middle" fill="${fillFace('O') === '#fffdf8' ? '#40536F' : '#fff'}" font-weight="700" pointer-events="none">${rotFace('O')}</text>` : '';
  const xis = sumido ? `<path d="M7,${sup ? 6 : H - 6} L${W - 7},${sup ? CY + g.h : CY - g.h} M${W - 7},${sup ? 6 : H - 6} L7,${sup ? CY + g.h : CY - g.h}" stroke="#5b6b82" stroke-width="2.2" stroke-linecap="round" pointer-events="none"/>` : '';
  // cor nunca sozinha: letra da condição ao lado do número (C = cariado, R = restaurado…)
  const conds = condsDente(est);
  const letras = conds.map(k => `<tspan dx="1.5" font-size="${dec ? 9 : 10}" fill="${corTexto(k)}">${ABREV[k]}</tspan>`).join('');
  const rotuloAria = `Dente ${n}${conds.length ? ': ' + conds.map(k => CONDICOES[k][0]).join(', ') : ''}${pend.length ? ', ' + pend.length + ' tratamento(s) no plano' : ''}`;
  return `<svg class="dente-svg ${sel ? 'sel' : ''}" width="${W * esc}" height="${H * esc}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dente ${n}">
    <defs><clipPath id="${cid}"><circle cx="${fx + S / 2}" cy="${fy + S / 2}" r="${S / 2}"/></clipPath></defs>
    ${sel && !op.rotulos ? `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="7" fill="#EDF4FB" stroke="#1880BF" stroke-width="1.5"/>` : ''}
    <g data-a="${aDente}" data-n="${n}" tabindex="${op.rotulos ? -1 : 0}" role="button" aria-label="${rotuloAria}" style="cursor:pointer;outline:none" opacity="${sumido ? .32 : 1}"><rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>${perfil}</g>
    ${faces}${rotulos}${xis}
    ${op.rotulos || op.semNumero ? '' : `<text x="${W / 2}" y="${NY}" font-size="${dec ? 10.5 : 12}" text-anchor="middle" font-weight="700" fill="${sel ? '#0A5C96' : '#40536F'}" data-a="${aDente}" data-n="${n}" style="cursor:pointer">${n}${letras}</text>`}
  </svg>`;
}

const ARCADAS = {
  supPerm: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  supDec: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  infDec: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  infPerm: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};
function denticaoPadrao(pid) { const i = idade(pac(pid).nasc); return i < 6 ? 'dec' : i < 12 ? 'mista' : 'perm'; }
function linhaArcada(pid, arr) {
  const meio = arr.length / 2, cl = pode('indicar');
  return `<div class="arcada-svg">${arr.slice(0, meio).map(n => denteSVG(pid, n, { clicavel: cl })).join('')}<span class="linha-media"></span>${arr.slice(meio).map(n => denteSVG(pid, n, { clicavel: cl })).join('')}</div>`;
}
function odontogramaHTML(pid) {
  const pc = E.ui.pc, den = pc.denticao || denticaoPadrao(pid);
  const linhas = den === 'perm' ? [ARCADAS.supPerm, ARCADAS.infPerm] : den === 'dec' ? [ARCADAS.supDec, ARCADAS.infDec] : [ARCADAS.supPerm, ARCADAS.supDec, ARCADAS.infDec, ARCADAS.infPerm];
  const bot = (v, t) => `<button class="${den === v ? 'ativo' : ''}" data-a="denticao" data-v="${v}">${t}</button>`;
  const reg = k => `<button class="proc-btn ${pc.dente === k ? 'on' : ''}" data-a="dente" data-n="${k}">${REGIOES[k]}</button>`;
  return `<div class="odonto-topo"><span class="seg">${bot('perm', 'Permanente')}${bot('mista', 'Mista')}${bot('dec', 'Decídua')}</span>
      ${reg('ASAI')}${reg('AS')}${reg('AI')}</div>
    <div class="odonto-arcadas">
      <div class="lado-paciente"><span>← direito do paciente</span><span>esquerdo do paciente →</span></div>
      ${linhas.map((arr, i) => (i === linhas.length / 2 ? '<div class="plano-oclusal"></div>' : '') + linhaArcada(pid, arr)).join('')}
    </div>
    <details class="leg-odonto" ${E.ui.pc.legOdonto ? 'open' : ''} ontoggle="E.ui.pc.legOdonto = this.open"><summary>O que significam as cores e letras</summary>
      <div class="leg-grade">${Object.entries(CONDICOES).map(([k, [n, c]]) => `<span><i style="background:${c}"></i><b style="color:${corTexto(k)}">${ABREV[k]}</b> ${n}</span>`).join('')}
      <span><i style="background:#fff;border:1.5px dashed #1880BF"></i>contorno tracejado: indicado</span><span><i style="background:#fff;border:2px solid #1880BF"></i>contorno cheio: aprovado</span></div></details>`;
}
A.denticao = ds => { E.ui.pc.denticao = ds.v; E.ui.pc.dente = null; render(); };
A.faceDente = ds => {
  const pc = E.ui.pc, n = String(ds.n);
  if (pc.dente !== n) { pc.dente = n; pc.denteFaces = []; pc.denteProc = null; pc.denteCond = null; E.ui.rolarPara = '.painel-dente'; }
  const i = pc.denteFaces.indexOf(ds.f); i >= 0 ? pc.denteFaces.splice(i, 1) : pc.denteFaces.push(ds.f);
  render();
};
A.dente = ds => { const pc = E.ui.pc, n = String(ds.n);
  if (pc.dente === n) pc.dente = null; else { pc.dente = n; pc.denteFaces = []; pc.denteProc = null; pc.denteCond = null; E.ui.rolarPara = '.painel-dente'; } render(); };
A.condSel = ds => { const pc = E.ui.pc; pc.denteCond = pc.denteCond === ds.c ? null : ds.c; render(); };
A.registrarCond = () => { const pc = E.ui.pc, pid = pc.fichaId;
  comDesfazer(`Condição registrada: ${CONDICOES[pc.denteCond][0]} no ${pc.dente}.`, () => {
    condicoesPac(pid).push({ id: uid(), n: pc.dente, cond: pc.denteCond, faces: [...pc.denteFaces], data: E.d.hoje, por: usuPC().prof });
    pc.denteCond = null; pc.denteFaces = []; }); };

/* ---------- aba "Odontograma e Plano" ---------- */
const NOMES_POS = { 1: 'Incisivo central', 2: 'Incisivo lateral', 3: 'Canino', 4: '1º pré-molar', 5: '2º pré-molar', 6: '1º molar', 7: '2º molar', 8: '3º molar' };
const NOMES_QUAD = { 1: 'superior direito', 2: 'superior esquerdo', 3: 'inferior esquerdo', 4: 'inferior direito' };
function nomeDente(n) { n = +n; const p = pos(n), q = quad(n), dec = ehDecid(n);
  const nome = dec && p >= 4 ? `${p - 3}º molar decíduo` : NOMES_POS[p] + (dec ? ' decíduo' : '');
  return `${nome} ${NOMES_QUAD[dec ? q - 4 : q]}`; }
function painelDente(pid, n, podeInd) {
  const pc = E.ui.pc, regiao = ehRegiao(n);
  const tipos = regiao ? ['arcada', 'geral'] : ['dente', 'faces', 'canal'];
  const pr = pc.denteProc && proc(pc.denteProc), nf = pc.denteFaces.length;
  const its = plano(pid).filter(i => i.dente === String(n));
  const procBtns = `<div class="procs">${E.d.procedimentos.filter(x => tipos.includes(x.tipo)).map(x => `<button class="proc-btn ${pc.denteProc === x.id ? 'on' : ''}" data-a="denteProc" data-p="${x.id}">${x.nome}</button>`).join('')}</div>`;
  const sv = rotuloSalvarDente(pid, n);
  const salvar = `<div class="acoes-dente"><button class="btn btn-pri" data-a="salvarDente" ${sv.ok ? '' : 'disabled'}>${sv.txt}</button>${sv.dica ? `<span class="mini muted">${sv.dica}</span>` : ''}</div>`;
  const lista = its.length ? `<div class="grupo-tit">${regiao ? 'Nesta região' : 'Tratamentos neste dente'}</div>${its.map(itemPlano).join('')}` : '';
  if (regiao) return `<div class="painel-dente" style="grid-template-columns:1fr"><div><b style="font-size:17px">${REGIOES[n]}</b>
    ${podeInd ? `<div class="grupo-tit">O que vai ser feito</div>${procBtns}${salvar}` : '<div class="muted">Somente dentistas indicam tratamentos.</div>'}${lista}</div></div>`;
  const est = estadoDente(pid, n);
  const hoje = [...(est.geral ? [[est.geral, 'dente inteiro']] : []), ...(est.canal ? [['canal', 'raiz']] : []), ...Object.entries(est.faces).map(([f, c]) => [c, 'face ' + f])];
  return `<div class="painel-dente">
    <div style="text-align:center">${denteSVG(pid, n, { escala: 2.3, rotulos: true, sel: pc.denteFaces, previa: pc.denteCond, clicavel: podeInd })}
      <div class="mini muted">${podeInd ? (nf ? 'Faces marcadas: <b>' + pc.denteFaces.join(', ') + '</b>' : 'Toque nas faces para marcar') : ''}</div></div>
    <div><b style="font-size:17px">Dente ${n}</b> <span class="muted">· ${nomeDente(n)}</span>
      <div class="grupo-tit">Como está hoje</div>
      <div class="procs">${hoje.map(([k, onde]) => `<span class="chip-cond"><i style="background:${CONDICOES[k][1]}"></i><b style="color:${corTexto(k)}">${ABREV[k]}</b> ${CONDICOES[k][0]} <span class="muted">· ${onde}</span></span>`).join('') || '<span class="muted mini">Sem registro.</span>'}</div>
      ${podeInd ? `<div class="duas-dente">
          <div><div class="grupo-tit">1. O que tem no dente <span class="muted">(opcional)</span></div>
            <div class="procs">${Object.entries(CONDICOES).map(([k, [nome, cor]]) => `<button class="proc-btn ${pc.denteCond === k ? 'on' : ''}" data-a="condSel" data-c="${k}"><i class="sw" style="background:${cor}"></i>${nome}</button>`).join('')}</div></div>
          <div><div class="grupo-tit">2. O que vai ser feito <span class="muted">(opcional)</span></div>${procBtns}</div>
        </div>${salvar}` : '<div class="muted" style="margin-top:8px">Somente dentistas registram condições e indicam tratamentos.</div>'}
      ${lista}
      ${est.regs.length ? `<div class="grupo-tit">Histórico do dente</div>${est.regs.slice().reverse().map(r => `<div class="mini" style="padding:3px 0">${dataBRc(r.data)} · <b>${CONDICOES[r.cond][0]}</b>${r.faces.length ? ' (' + r.faces.join(', ') + ')' : ''} · ${esc(prof(r.por).curto)}</div>`).join('')}` : ''}
    </div></div>`;
}
/* um só botão: registra a condição e/ou indica o tratamento, com as mesmas faces */
function rotuloSalvarDente(pid, n, pc = E.ui.pc) {
  const nf = pc.denteFaces.length, pr = pc.denteProc && proc(pc.denteProc), partes = [];
  const onde = ehRegiao(n) ? REGIOES[n] : `dente ${n}${nf ? ' (' + pc.denteFaces.join('') + ')' : ''}`;
  if (pc.denteCond) partes.push(CONDICOES[pc.denteCond][0]);
  let dica = '';
  if (pr) { if (pr.tipo === 'faces' && !nf) dica = 'Para a restauração, marque as faces no desenho.';
    else partes.push(`${pr.tipo === 'faces' ? `Restauração ${nf} face${nf > 1 ? 's' : ''}` : pr.nome} (${brl(precoDe(pr, pid, nf))})`); }
  if (dica && !partes.length) return { ok: false, txt: 'Marque as faces no desenho', dica };
  if (!partes.length) return { ok: false, txt: 'Escolha o que tem no dente ou o que vai ser feito', dica };
  return { ok: !dica, txt: `Salvar no ${onde}: ${partes.join(' + ')}`, dica };
}
A.salvarDente = () => { const pc = E.ui.pc, pid = pc.fichaId, sv = rotuloSalvarDente(pid, pc.dente); if (!sv.ok) return;
  comDesfazer('Salvo no odontograma.', () => {
    if (pc.denteCond) condicoesPac(pid).push({ id: uid(), n: pc.dente, cond: pc.denteCond, faces: [...pc.denteFaces], data: E.d.hoje, por: usuPC().prof });
    if (pc.denteProc) novoItem(pid, pc.denteProc, pc.dente, pc.denteFaces);
    pc.denteCond = null; pc.denteProc = null; pc.denteFaces = [];
  }); };
function abaOdonto(p) {
  const pc = E.ui.pc, pl = plano(p.id), podeInd = pode('indicar');
  const grupo = (est, tit) => { const g = pl.filter(i => i.estado === est); return g.length ? `<div class="grupo-tit">${tit} (${g.length})</div>${g.map(i => itemPlano(i, 'semPil')).join('')}` : ''; };
  const geral = E.d.procedimentos.filter(x => x.tipo === 'geral');
  return `<div class="odonto">${odontogramaHTML(p.id)}
    ${pc.dente ? painelDente(p.id, pc.dente, podeInd) : `<div class="mini muted" style="text-align:center;margin-top:10px">Toque num dente ou numa face.</div>`}</div>
  <div class="cartao" style="margin-top:12px"><div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0">Plano de tratamento</h3>
    ${podeInd ? `<span style="margin-left:auto" class="mini">Sem dente: <select id="sel-geral">${geral.map(x => `<option value="${x.id}">${x.nome}</option>`).join('')}</select> <button class="btn btn-peq" data-a="addItemGeral">Adicionar</button></span>` : ''}</div>
    ${grupo('indicado', 'Indicados — aguardando o paciente aprovar')}${grupo('aprovado', 'Aprovados — falta fazer')}${grupo('realizado', 'Feitos')}${grupo('recusado', 'Paciente não quis')}
    ${!pl.length ? '<div class="vazio">Sem procedimentos no plano.</div>' : ''}
    ${pl.some(i => i.estado === 'indicado') && pode('finPac') ? '<div style="margin-top:12px"><button class="btn btn-pri" data-a="abrirOrc">Gerar orçamento</button></div>' : ''}
    ${pl.some(i => i.estado === 'indicado') && !pode('finPac') ? '<div class="mini muted" style="margin-top:10px">A recepção gera o orçamento com o paciente.</div>' : ''}</div>`;
}
