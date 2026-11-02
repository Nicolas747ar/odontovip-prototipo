/* Núcleo do protótipo: estado, regras, eventos, desfazer, tarefas de teste. */
const E = { d: JSON.parse(JSON.stringify(DADOS)), ui: null, undo: null };
const A = {}; // ações (data-a)

E.ui = {
  vista: 'pc',
  pc: { tela: 'hoje', usuario: 'u-rec', fichaId: null, aba: 'resumo', agendaVer: 'prof', painel: null, modal: null,
        sobre: 'splash', pinUsu: null, pinBuf: '', pinErro: '', dente: null, denteFaces: [], denteProc: null, buscaPac: '',
        novoPac: null, anamForm: null, evoForm: null, novoAlerta: null },
  cel: { usuario: null, tela: 'splash', pacId: null, pinUsu: null, pinBuf: '', pinErro: '', evo: null, foto: null,
         busca: '', fila: [], diaDono: 'hoje', ultimaEvo: null,
         dente: null, denteFaces: [], denteProc: null, denteCond: null, arcada: 'sup', denticao: null, anamForm: null, dados: null, novoAlerta: null },
  celForaWifi: false, clinicaSemInternet: false,
  ultimaOrigem: 'Demanda espontânea (WhatsApp)',
  testes: { aberto: false, atual: null, inicio: 0, resultados: {} },
};

/* ---------- utilidades ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => 'x' + Math.random().toString(36).slice(2, 9);
const brl = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const paraMin = s => { const [h, m] = String(s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const dataBR = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '';
const dataBRc = iso => iso ? dataBR(iso) + '/' + iso.slice(0, 4) : '';
const idade = nasc => { const h = E.d.hoje; let a = +h.slice(0, 4) - +nasc.slice(0, 4); if (h.slice(5) < nasc.slice(5)) a--; return a; };
/* dia 29/30/31 num mês mais curto cai no último dia do mês (29/10 + 4 meses = 28/02, não 01/03) */
const somaMeses = (iso, n) => { const [a, m, d] = iso.split('-').map(Number), alvo = new Date(a, m - 1 + n, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  return `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`; };
const ult4 = cel => '···-' + String(cel).slice(-4);
const iniciais = n => n.replace(/^(Dra?\.|Sr\.)\s*/, '').split(' ').map(p => p[0]).slice(0, 2).join('');
const DIA = 'qui 29/10';

const pac = id => E.d.pacientes.find(p => p.id === id);
const prof = id => E.d.profissionais.find(p => p.id === id);
const proc = id => E.d.procedimentos.find(p => p.id === id);
const cad = id => E.d.cadeiras.find(c => c.id === id);
const usu = id => E.d.usuarios.find(u => u.id === id);
const conv = id => E.d.convenios.find(c => c.id === id);
const plano = pid => (E.d.planos[pid] = E.d.planos[pid] || []);
const parcelas = pid => (E.d.parcelas[pid] = E.d.parcelas[pid] || []);
const alertas = pid => { const p = pac(pid); return (p.alertas = p.alertas || []); };
/* a mesma alerta duas vezes só enfraquece a faixa vermelha */
function addAlerta(pid, texto, nivel = 'grave') { if (!alertas(pid).some(a => a.texto === texto)) alertas(pid).push({ id: uid(), texto, nivel }); }

/* ---------- regras de negócio (no sistema real: packages/dominio) ---------- */
const ESTADOS = {
  a_confirmar: ['relogio', 'A confirmar'], confirmado: ['check', 'Confirmado'], chegou: ['chegou', 'Chegou'],
  em_atendimento: ['atendendo', 'Em atendimento'], atendido: ['checks', 'Atendido'], faltou: ['x', 'Faltou'],
  desmarcou: ['desmarcar', 'Desmarcou'], remarcado: ['remarcar', 'Remarcado'],
};
const estadoHTML = e => `<span class="est est-${e}">${ic(ESTADOS[e][0], 13)} ${ESTADOS[e][1]}</span>`;
const ATIVOS = ['a_confirmar', 'confirmado', 'chegou', 'em_atendimento'];
/* estado do item do plano: ícone + palavra, nunca um círculo que parece botão de opção */
const PLANO_EST = { indicado: ['indicado', 'Indicado'], aprovado: ['aprovado', 'Aprovado'], realizado: ['feito', 'Feito'], recusado: ['recusado', 'Paciente não quis'], observado: ['aprovado', 'Aprovado'] };
const pilulaPlano = e => `<span class="pl-est pl-${e}">${ic(PLANO_EST[e][0], 13)} ${PLANO_EST[e][1]}</span>`;
/* modo celular de verdade: tela cheia, sem a barra do protótipo */
const MODO_CEL = matchMedia('(max-width: 520px)').matches;
if (MODO_CEL) { E.ui.vista = 'cel'; document.documentElement.classList.add('modo-cel'); }

/* tabela de preços: um valor por procedimento e por convênio (no sistema real vem do Excel do
   Dental Office). A restauração tem uma linha por número de faces: chave "restauracao#2".
   Sem valor num convênio = o convênio não cobre → o paciente paga o preço particular. */
const chavePreco = (pr, nFaces) => pr.tipo === 'faces' ? `${pr.id}#${Math.max(1, Math.min(5, nFaces || 1))}` : pr.id;
function montarPrecos() {
  const t = {};
  E.d.procedimentos.forEach(pr => {
    const linhas = pr.tipo === 'faces' ? [1, 2, 3, 4, 5].map(n => [`${pr.id}#${n}`, pr.precoFaces[n]]) : [[pr.id, pr.preco]];
    linhas.forEach(([k, base]) => { t[k] = {}; E.d.convenios.forEach(c => { t[k][c.id] = Math.round(base * c.fator / 100) * 100; }); });
  });
  return t;
}
if (!E.d.precos) E.d.precos = montarPrecos();
function precoDe(pr, pid, nFaces) {
  const linha = E.d.precos[chavePreco(pr, nFaces)] || {}, c = pac(pid).conv;
  return linha[c] ?? linha.part ?? 0;
}
/* o que ainda não foi aprovado mostra sempre o preço de hoje da tabela */
const valorItem = (i, pid) => i.estado === 'indicado' ? precoDe(proc(i.proc), pid, i.faces.length) : i.valor;
function nomeItem(it) {
  const pr = proc(it.proc);
  let n = pr.tipo === 'faces' ? `Restauração ${it.faces.length} face${it.faces.length > 1 ? 's' : ''}` : pr.nome;
  if (it.dente) n += ` · ${typeof REGIOES !== 'undefined' && REGIOES[it.dente] ? REGIOES[it.dente] : it.dente}` + (it.faces.length ? ` (${it.faces.join('')})` : '');
  return n;
}
function conflitos(f, ignorarId) {
  const fim = f.ini + f.dur;
  return E.d.agendamentos.filter(a => a.id !== ignorarId && !['desmarcou', 'remarcado', 'faltou'].includes(a.estado)
    && (a.prof === f.prof || (f.cad && a.cad === f.cad)) && a.ini < fim && f.ini < a.ini + a.dur);
}
function proximoLivre(f, ignorarId) {
  for (let m = f.ini; m <= 18 * 60 - f.dur; m += 10) {
    if (m < 13 * 60 && m + f.dur > 12 * 60) continue;
    if (!conflitos({ ...f, ini: m }, ignorarId).length) return m;
  }
  return null;
}
function saldoParcela(p) { return p.valor - p.pago; }
function parcelasAbertas(pid) {
  return parcelas(pid).filter(p => saldoParcela(p) > 0).sort((a, b) => a.venc.localeCompare(b.venc));
}
function distribuir(pid, valor) { // aplica do mais antigo ao mais novo
  const res = []; let resto = valor;
  for (const p of parcelasAbertas(pid)) {
    if (resto <= 0) break;
    const s = saldoParcela(p), usa = Math.min(s, resto);
    res.push({ p, usa, quita: usa === s }); resto -= usa;
  }
  return { res, sobra: resto };
}
/* de qual profissional é o pagamento (conta para "Por profissional" e comissão):
   1º quem atendeu hoje; 2º quem fez o último item do plano; 3º quem indicou o último aprovado.
   No sistema real o pagamento deve apontar para os itens do orçamento — ver AUDITORIA-QA.md */
function profDoPagamento(pid) {
  const hoje = E.d.agendamentos.filter(a => a.pac === pid && ['atendido', 'em_atendimento', 'chegou'].includes(a.estado)).sort((a, b) => b.ini - a.ini)[0];
  if (hoje) return hoje.prof;
  const pl = plano(pid).filter(i => i.estado !== 'recusado');
  const feito = pl.filter(i => i.feitoPor).sort((a, b) => (b.dataFeito || '').localeCompare(a.dataFeito || ''))[0];
  if (feito) return feito.feitoPor;
  const aprov = pl.filter(i => i.estado === 'aprovado').sort((a, b) => (b.dataApr || b.dataInd || '').localeCompare(a.dataApr || a.dataInd || ''))[0];
  return aprov ? aprov.indicadoPor : null;
}
function receber(pid, valor, forma) {
  const { res, sobra } = distribuir(pid, valor);
  res.forEach(r => { r.p.pago += r.usa; });
  // pagou mais do que devia: a sobra fica como crédito (a tela avisa "ficam como crédito").
  // Sem nada em aberto é um pagamento avulso, não crédito.
  if (sobra > 0 && res.length) { const p = pac(pid); p.credito = (p.credito || 0) + sobra; }
  E.d.recebimentos.push({ id: uid(), hora: E.d.agoraMin, pac: pid, valor, forma, por: E.ui.pc.usuario, prof: profDoPagamento(pid), depoisFechamento: E.d.caixa.fechado });
}
function gerarParcelas(pid, total, n, primeiro) {
  const base = Math.floor(total / n / 100) * 100;
  for (let i = 1; i <= n; i++) {
    const v = i === n ? total - base * (n - 1) : base;
    parcelas(pid).push({ id: uid(), n: i, de: n, venc: somaMeses(primeiro, i - 1), valor: v, pago: 0 });
  }
}
function hojeDoPaciente(pid) { return E.d.agendamentos.filter(a => a.pac === pid).sort((a, b) => a.ini - b.ini); }
function proximaConsulta(pid) { return hojeDoPaciente(pid).find(a => ATIVOS.includes(a.estado) && a.ini >= E.d.agoraMin - 60); }
/* dígitos verificadores do CPF (recusa 111.111.111-11 e números digitados errado) */
function cpfValido(cpf) {
  const d = String(cpf || '').replace(/\D/g, ''); if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); return (s * 10) % 11 % 10; };
  return dv(9) === +d[9] && dv(10) === +d[10];
}
const semAcento = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/* número exato primeiro; sem acento; telefone/CPF só com 3+ dígitos */
function buscarPacientes(t) {
  const q = semAcento(t).trim(); if (q.length < 2) return [];
  const num = q.replace(/^n[ºo°.]?\s*/, '').trim(), so = q.replace(/\D/g, '');
  const vivos = E.d.pacientes.filter(p => !p.excluido); // excluído só aparece em Pacientes → Excluídos
  const exato = /^\d+$/.test(num) ? vivos.filter(p => String(p.numero) === num) : [];
  const outros = vivos.filter(p => !exato.includes(p) && (semAcento(p.nome).includes(q) ||
    (so.length >= 3 && (p.cel.replace(/\D/g, '').includes(so) || p.cpf.replace(/\D/g, '').includes(so)))));
  return [...exato, ...outros].slice(0, 7);
}
function totaisDia() {
  const ag = E.d.agendamentos.filter(a => a.pac);
  const rec = E.d.recebimentos;
  const porForma = {}; rec.forEach(r => { porForma[r.forma] = (porForma[r.forma] || 0) + r.valor; });
  const porProf = {}; rec.forEach(r => { const k = r.prof || '—'; porProf[k] = (porProf[k] || 0) + r.valor; });
  const aReceberHoje = Object.values(E.d.parcelas).flat().filter(p => p.venc === E.d.hoje).reduce((s, p) => s + saldoParcela(p), 0);
  return {
    total: rec.reduce((s, r) => s + r.valor, 0), porForma, porProf, aReceberHoje,
    agendados: ag.filter(a => !['desmarcou', 'remarcado'].includes(a.estado)).length,
    confirmados: ag.filter(a => ['confirmado', 'chegou', 'em_atendimento', 'atendido'].includes(a.estado)).length,
    aConfirmar: ag.filter(a => a.estado === 'a_confirmar').length,
    naClinica: ag.filter(a => ['chegou', 'em_atendimento'].includes(a.estado)).length,
    atendidos: ag.filter(a => a.estado === 'atendido').length,
    faltas: ag.filter(a => a.estado === 'faltou').length,
  };
}

/* ---------- render ---------- */
function render() {
  const keep = {};
  document.querySelectorAll('[data-scroll]').forEach(el => keep[el.dataset.scroll] = el.scrollTop);
  const v = E.ui.vista;
  document.querySelectorAll('.proto-vistas button').forEach(b => b.classList.toggle('ativo', b.dataset.v === v));
  let h = '';
  if (v === 'pc' || v === 'lado') h += pcHTML();
  if (v === 'cel' || v === 'lado') h += `<div class="cel-moldura">${celHTML()}</div>`;
  document.getElementById('palco').innerHTML = h;
  document.querySelectorAll('[data-scroll]').forEach(el => { if (E.ui.zerarScroll === el.dataset.scroll) el.scrollTop = 0; else if (keep[el.dataset.scroll] != null) el.scrollTop = keep[el.dataset.scroll]; });
  E.ui.zerarScroll = null;
  const ag = document.querySelector('[data-scroll="agenda"]');
  if (ag && keep.agenda == null) ag.scrollTop = Math.max(0, (E.d.agoraMin - 480) * K - 120);
  if (E.ui.foco) { const f = document.getElementById(E.ui.foco); if (f) { f.focus(); if (f.dataset.selecionar != null) f.select(); else if (f.setSelectionRange && f.type === 'text') f.setSelectionRange(f.value.length, f.value.length); } E.ui.foco = null; }
  if (E.ui.rolarPara) { const r = document.querySelector(E.ui.rolarPara); if (r) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); E.ui.rolarPara = null; }
  renderTestes();
}

/* ---------- toast + desfazer ---------- */
let toastTimer = null;
function toast(texto, desfazer, extra) {
  const el = document.getElementById('toast');
  // um aviso novo tira o botão Desfazer da tela: o desfazer antigo deixa de valer
  if (!desfazer) { E.undo = null; E.undoFn = null; E.undoExtra = null; }
  el.innerHTML = `<div class="toast"><span>${texto}</span>${desfazer ? '<button data-a="desfazer">Desfazer</button>' : ''}${extra || ''}</div>`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.innerHTML = ''; E.undo = null; E.undoFn = null; E.undoExtra = null; }, desfazer ? 10000 : 4000);
}
/* depois de desfazer, um painel ou ficha aberta pode apontar para algo que deixou de existir */
function limparTelasOrfas() {
  const pc = E.ui.pc;
  if (pc.painel && pc.painel.tipo === 'det' && !E.d.agendamentos.some(a => a.id === pc.painel.id)) pc.painel = null;
  if (pc.fichaId && !pac(pc.fichaId)) { pc.fichaId = null; if (pc.tela === 'ficha') pc.tela = 'pacientes'; }
  if (pc.modal && pc.modal.pac && !pac(pc.modal.pac)) pc.modal = null;
}
function comDesfazer(texto, fn, extra) { const snap = JSON.stringify(E.d); fn(); E.undo = snap; E.undoFn = null; E.undoExtra = extra || null; render(); toast(texto, true); }
/* algo salvo sem Desfazer: o Desfazer anterior voltaria a um estado que já não existe */
function semDesfazer() { E.undo = null; E.undoFn = null; E.undoExtra = null; document.getElementById('toast').innerHTML = ''; }
/* desfazer algo que não está em E.d (ex.: um rascunho na tela) */
function desfazivel(texto, desfazer) { E.undo = null; E.undoFn = desfazer; E.undoExtra = null; toast(texto, true); }
A.desfazer = () => {
  if (E.undoFn) { const f = E.undoFn; E.undoFn = null; f(); render(); toast('Desfeito.'); return; }
  if (!E.undo) return; E.d = JSON.parse(E.undo); E.undo = null;
  if (E.undoExtra) { E.undoExtra(); E.undoExtra = null; }
  limparTelasOrfas();
  render(); toast('Desfeito.'); };

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (fn) { if (!(el.tagName === 'INPUT' && el.type === 'checkbox')) e.preventDefault(); fn(el.dataset, el, e); }
});
function setCampo(caminho, valor) {
  const ps = caminho.split('.'); let o = E.ui;
  for (let i = 0; i < ps.length - 1; i++) o = o[ps[i]];
  o[ps[ps.length - 1]] = valor;
}
function aoDigitar(e) {
  const el = e.target;
  if (el.dataset.campo) setCampo(el.dataset.campo, el.type === 'checkbox' ? el.checked : el.value);
  if (el.dataset.ao && A[el.dataset.ao]) A[el.dataset.ao](el.dataset, el, e);
}
document.addEventListener('input', aoDigitar);
document.addEventListener('change', e => { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'time') aoDigitar(e); });
document.addEventListener('keydown', e => {
  const ativo = document.activeElement, tag = ativo.tagName;
  // PIN pelo teclado físico
  for (const alvo of ['pc', 'cel']) { const st = alvo === 'pc' ? E.ui.pc : E.ui.cel;
    if (st.pinUsu && ((alvo === 'pc' && st.sobre === 'usuarios') || (alvo === 'cel' && st.tela === 'login')) && !['INPUT', 'TEXTAREA'].includes(tag)) {
      if (/^[0-9]$/.test(e.key)) { A.pinTecla({ alvo, k: e.key }); e.preventDefault(); return; }
      if (e.key === 'Backspace') { A.pinTecla({ alvo, k: 'apagar' }); e.preventDefault(); return; }
    } }
  // busca: "/" ou Ctrl/Cmd+K
  if ((e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
    const b = document.getElementById('busca-global'); if (b) { e.preventDefault(); b.focus(); b.select(); } return;
  }
  if (ativo.id === 'busca-global' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
    const itens = [...document.querySelectorAll('#busca-res [data-a="abrirFicha"]')];
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = itens.find(i => i.classList.contains('sel'));
      if (sel) A.abrirFicha({ id: sel.dataset.id });
      else if (itens.length === 1) A.abrirFicha({ id: itens[0].dataset.id });
      else if (itens.length > 1) { itens[0].classList.add('sel'); toast('Há mais de um paciente. Use as setas ou clique no certo.'); }
      return;
    }
    e.preventDefault(); if (!itens.length) return;
    let i = itens.findIndex(x => x.classList.contains('sel'));
    i = e.key === 'ArrowDown' ? Math.min(itens.length - 1, i + 1) : Math.max(0, i - 1);
    itens.forEach(x => x.classList.remove('sel')); itens[i].classList.add('sel'); return;
  }
  // Enter/Espaço em elementos focáveis com ação (ex.: dentes do odontograma)
  if ((e.key === 'Enter' || e.key === ' ') && ativo.dataset && ativo.dataset.a && !['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'].includes(tag)) {
    e.preventDefault(); ativo.dispatchEvent(new MouseEvent('click', { bubbles: true })); return;
  }
  if (e.key === 'Escape') { E.ui.pc.painel = null; E.ui.pc.modal = null; render(); }
});
// fecha os resultados da busca ao clicar fora
document.addEventListener('click', e => { if (!e.target.closest('.busca')) { const r = document.getElementById('busca-res'); if (r) r.classList.remove('aberto'); } }, true);
A.vista = ds => { E.ui.vista = ds.v; render(); };

/* ---------- tarefas de teste ---------- */
const TAREFAS = [
  { id: 'T1', meta: 60, onde: 'Computador', txt: 'A paciente nova <b>Mariana Alves</b> liga e quer uma <b>limpeza hoje às 15:00 com a Dra. Helena</b>. Cadastre e agende.' },
  { id: 'T2', meta: 5, onde: 'Computador', txt: 'O paciente <b>nº 105</b> acabou de chegar. Marque a chegada.' },
  { id: 'T3', meta: 30, onde: 'Celular', txt: 'Você é a <b>Dra. Marcelly</b> (PIN 1234). Atenda o paciente que já chegou e registre a evolução marcando o que foi feito.' },
  { id: 'T4', meta: 60, onde: 'Computador', txt: 'A <b>Ana Lima (nº 112)</b> aprovou a restauração e a limpeza, <b>não</b> o clareamento, em <b>3x</b>. Hoje ela paga <b>R$ 50,00 no Pix</b>. Faça o orçamento e receba.' },
  { id: 'T5', meta: 10, onde: 'Computador', txt: 'Abra a ficha da <b>Beatriz Santos que tem 52 anos</b>.' },
  { id: 'T6', meta: 10, onde: 'Computador', txt: 'Uma paciente da manhã <b>não veio</b>. Encontre e marque a falta.' },
  { id: 'T7', meta: 10, onde: 'Computador', txt: 'Troque o usuário do computador para a <b>Dra. Helena</b> (PIN 1234).' },
  { id: 'T8', meta: 120, onde: 'Computador', txt: 'Feche o caixa do dia. Na gaveta tem <b>R$ 300,00</b> em dinheiro.' },
  { id: 'T9', meta: 10, onde: 'Celular', txt: 'Você é o <b>dono</b> (PIN 1234): veja <b>quanto entrou hoje no Pix</b>.' },
  { id: 'T10', meta: 45, onde: 'Celular', txt: 'Você é a <b>Dra. Marcelly</b> (PIN 1234). Na <b>Ana Lima (nº 112)</b>, o <b>dente 26</b> está com cárie na face <b>oclusal</b>: registre e indique uma restauração.' },
  { id: 'T11', meta: 90, onde: 'Celular', txt: 'Você é a <b>Dra. Marcelly</b>. Preencha a <b>História Médica</b> da <b>Rita Moura (nº 103)</b> — ela é alérgica a <b>látex</b> — e peça a assinatura dela.' },
];
let relogio = null;
A.abrirTestes = () => { E.ui.testes.aberto = !E.ui.testes.aberto; renderTestes(); };
A.comecar = ds => {
  E.ui.testes.atual = ds.id; E.ui.testes.inicio = Date.now();
  clearInterval(relogio); relogio = setInterval(renderTestes, 500); renderTestes();
};
A.conclui = ds => {
  const t = TAREFAS.find(x => x.id === ds.id), s = Math.round((Date.now() - E.ui.testes.inicio) / 1000);
  E.ui.testes.resultados[ds.id] = { s, ok: s <= t.meta };
  E.ui.testes.atual = null; clearInterval(relogio); renderTestes();
};
A.desisti = ds => { E.ui.testes.resultados[ds.id] = { s: null, ok: false, travou: true }; E.ui.testes.atual = null; clearInterval(relogio); renderTestes(); };
A.copiarResultados = () => {
  const txt = TAREFAS.map(t => { const r = E.ui.testes.resultados[t.id]; return `${t.id} (meta ${t.meta}s): ` + (!r ? 'não feita' : r.travou ? 'TRAVOU' : `${r.s}s ${r.ok ? 'OK' : 'ACIMA DA META'}`); }).join('\n');
  const ta = document.getElementById('resultados-txt'); ta.value = txt; ta.style.display = 'block'; ta.select();
  try { document.execCommand('copy'); toast('Resultados copiados.'); } catch (e) { toast('Selecione e copie o texto.'); }
};
A.recomecar = () => { location.reload(); };
A.simCel = (ds, el) => {
  E.ui.celForaWifi = el.checked;
  if (!el.checked && E.ui.cel.fila.length) { const n = E.ui.cel.fila.length; E.ui.cel.fila.forEach(f => f()); E.ui.cel.fila = []; toast(`${n} registro(s) enviado(s) do celular.`); }
  render();
};
A.simNet = (ds, el) => { E.ui.clinicaSemInternet = el.checked; render(); };
function renderTestes() {
  const el = document.getElementById('testes'); const T = E.ui.testes;
  if (!T.aberto) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="testes"><div class="painel-cab"><h2>Tarefas de teste</h2><button class="fechar" data-a="abrirTestes" aria-label="Fechar">${ic('x', 20)}</button></div>
  <div class="sim-toggles mini">
    <b>Simular</b>
    <label><input type="checkbox" data-ao="simCel" ${E.ui.celForaWifi ? 'checked' : ''}> Celular fora do Wi-Fi da clínica</label>
    <label><input type="checkbox" data-ao="simNet" ${E.ui.clinicaSemInternet ? 'checked' : ''}> Clínica sem internet</label>
  </div>
  ${TAREFAS.map(t => {
    const r = T.resultados[t.id], rod = T.atual === t.id;
    const seg = rod ? Math.round((Date.now() - T.inicio) / 1000) : 0;
    return `<div class="tarefa ${rod ? 'rodando' : ''}"><b>${t.id}</b> · <span class="meta">${t.onde} · meta ${t.meta}s</span>
      <p>${t.txt}</p>
      ${rod ? `<b class="num">${seg}s</b> <button class="btn btn-pri btn-peq" data-a="conclui" data-id="${t.id}">Concluí</button> <button class="btn btn-peq" data-a="desisti" data-id="${t.id}">Travei</button>`
        : `<button class="btn btn-peq" data-a="comecar" data-id="${t.id}" ${T.atual ? 'disabled' : ''}>Começar</button>
           ${r ? (r.travou ? '<span class="res-ruim">Travou</span>' : `<span class="${r.ok ? 'res-ok' : 'res-ruim'}">${r.s}s ${r.ok ? 'dentro da meta' : 'acima da meta'}</span>`) : ''}`}
    </div>`; }).join('')}
  <div class="tarefa"><button class="btn btn-peq" data-a="copiarResultados">Copiar resultados</button> <button class="btn btn-peq" data-a="recomecar">Recomeçar com dados novos</button>
  <textarea id="resultados-txt" style="display:none;width:100%;height:120px;margin-top:8px"></textarea></div></div>`;
}

function iniciar() {
  render();
  setTimeout(() => { if (E.ui.pc.sobre === 'splash') { E.ui.pc.sobre = null; render(); } }, 1400);
}
