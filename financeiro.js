/* Carril A — hackintosh (T-019): Financeiro (fluxo de caixa, despesas, cartões), recibo de pagamento,
   exportar para Excel (CSV), auditoria, dados da dentista. Registra a tela em TELAS_EXTRA e o menu em MENU_EXTRA. */

MENU_EXTRA.push(['financeiro', 'dinheiro', 'Contas e fluxo', 'gestao', () => pode('finPac')]); // não 'Financeiro': já é o nome da aba de Hoje e da ficha (S8)
TELAS_EXTRA.financeiro = () => telaFinanceiro();

/* ---------- exportar para Excel: CSV com ; e vírgula decimal, que o Excel em português abre direto ---------- */
const csvVal = v => { const t = String(v ?? '').replace(/"/g, '""'); return /[;"\n]/.test(t) ? `"${t}"` : t; };
const reais = c => (c / 100).toFixed(2).replace('.', ',');
function baixarCSV(nome, cab, linhas) {
  const txt = '﻿' + [cab, ...linhas].map(l => l.map(csvVal).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
  a.download = `odontovip-${nome}-${E.d.hoje}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  registrarAudit(`Exportou ${nome} para Excel`);
  toast(`Planilha “${nome}” baixada. Abre no Excel.`);
}
const botaoExcel = (acao, extra = '') => `<button class="btn btn-sec" data-a="${acao}" ${extra}>${ic('arquivo', 16)} Exportar Excel</button>`;

/* ---------- auditoria: quem fez o quê e quando. Fica fora de E.d, para o Desfazer não apagar o registro ---------- */
E.audit = [
  { hora: '09:12', quem: 'Dra. Marcelly', txt: 'Evolução salva · Rita Moura' },
  { hora: '08:45', quem: 'Suely Maria', txt: 'Recebido R$ 150,00 de Carlos Andrade (Pix)' },
  { hora: '08:40', quem: 'Suely Maria', txt: 'Recebido R$ 180,00 de Beatriz Santos (Dinheiro)' },
  { hora: '08:02', quem: 'Suely Maria', txt: 'Abriu o caixa do dia' },
];
let ultimaAcao = '';
let origemClique = 'pc';
document.addEventListener('click', e => { origemClique = e.target.closest && e.target.closest('.cel') ? 'cel' : 'pc'; }, true);
const quemAgora = () => ((E.ui.vista === 'cel' || (E.ui.vista === 'lado' && origemClique === 'cel')) && E.ui.cel.usuario ? usu(E.ui.cel.usuario) : usuPC()).nome;
/* o texto vem do aviso, que já está escapado: desfaz as entidades antes de guardar (o esc() da tela escapa de novo) */
const semTags = t => String(t).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function registrarAudit(txt) { E.audit.unshift({ hora: hhmm(E.d.agoraMin), quem: quemAgora(), txt: semTags(txt) }); }
{ const original = comDesfazer; comDesfazer = (texto, fn, extra) => { ultimaAcao = semTags(texto); registrarAudit(texto); original(texto, fn, extra); }; }
{ const original = desfazivel; desfazivel = (texto, desfazer) => { ultimaAcao = semTags(texto); original(texto, desfazer); }; }
{ const fixoOriginal = A.desfazerFixo; A.desfazerFixo = ds => { const f = (E.ui.pc.fixos || {})[ds.id]; if (f && Date.now() - f.criado >= 700) registrarAudit(`Desfez: ${f.txt}`); fixoOriginal(ds); }; }
{ const desfazerOriginal = A.desfazer; A.desfazer = (...a) => { if (E.undo || E.undoFn) registrarAudit(`Desfez: ${ultimaAcao || 'a última ação'}`); desfazerOriginal(...a); }; }

/* ---------- recibo de pagamento (o comprovante de atendimento é outra coisa: o que foi feito) ---------- */
function textoRecibo(r) {
  const p = pac(r.pac);
  const cl = E.d.clinica;
  return `${cl.nome} · CNPJ ${cl.cnpj || '__.___.___/____-__'} · ${cl.endereco}

Recebi de ${p.nome}${p.cpf ? `, CPF ${p.cpf},` : ''} a quantia de ${brl(r.valor)} (${valorExtenso(r.valor)}), em ${r.forma}, referente a tratamento odontológico${r.prof ? ` com ${prof(r.prof).nome} (CRO-PE ${prof(r.prof).cro || '______'})` : ''}.\n\nPago em ${dataBR(E.d.hoje)}/2026 às ${hhmm(r.hora)}.`;
}
/* valor por extenso, até milhares — basta para recibo de clínica */
function valorExtenso(c) {
  const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const ce = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const ate999 = n => { if (n === 100) return 'cem'; const p = []; if (n >= 100) p.push(ce[Math.floor(n / 100)]); const r = n % 100;
    if (r) p.push(r < 20 ? u[r] : d[Math.floor(r / 10)] + (r % 10 ? ' e ' + u[r % 10] : '')); return p.join(' e '); };
  const reaisN = Math.floor(c / 100), cent = c % 100, mil = Math.floor(reaisN / 1000), resto = reaisN % 1000;
  const parteR = [mil ? (mil === 1 ? 'mil' : ate999(mil) + ' mil') : '', resto ? ate999(resto) : ''].filter(Boolean).join(resto && (resto < 100 || resto % 100 === 0) ? ' e ' : ' ');
  const txt = (parteR ? `${parteR} ${reaisN === 1 ? 'real' : 'reais'}` : '') + (cent ? `${parteR ? ' e ' : ''}${ate999(cent)} centavo${cent === 1 ? '' : 's'}` : '');
  return txt || 'zero reais';
}
A.abrirRecibo = ds => { const r = E.d.recebimentos.find(x => x.id === ds.id); if (!r) return; E.ui.pc.modal = { tipo: 'recibo', id: ds.id, pac: r.pac }; render(); };
const MODAL_RECIBO = () => { const r = E.d.recebimentos.find(x => x.id === E.ui.pc.modal.id); if (!r) { E.ui.pc.modal = null; return ''; } // o pagamento foi desfeito
  const p = pac(r.pac);
  return `<div class="modal"><div class="painel-cab"><h2>Recibo de pagamento</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="recibo-folha"><div class="recibo-cab"><span class="recibo-marca"><img src="selo.png" alt=""><b>${esc(E.d.clinica.nome)}</b></span><span>Unidade ${esc(E.d.unidade)}</span></div><h3>Recibo · ${brl(r.valor)}</h3><p>${esc(textoRecibo(r)).replace(/\n/g, '<br>')}</p>
      <div class="recibo-ass">Suely Maria · Recepção</div></div>
    <p class="nota-leve" style="margin-top:12px">${ic('alerta', 15)} O recibo é do pagamento. O comprovante de atendimento (o que foi feito) continua em Arquivos.</p>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="reciboWa">${ic('msg', 18)} Enviar pelo WhatsApp</button><button class="btn btn-pri" data-a="reciboImprimir">${ic('imprimir', 18)} Imprimir</button></div></div>`; };
A.reciboImprimir = () => { const r = E.d.recebimentos.find(x => x.id === E.ui.pc.modal.id); if (!r) return;
  imprimirDoc('Recibo', textoRecibo(r), null); guardarDoc(r.pac, 'Recibo', textoRecibo(r), null); registrarAudit(`Imprimiu recibo de ${brl(r.valor)} · ${pac(r.pac).nome}`);
  E.ui.pc.modal = null; semDesfazer(); render(); toast('Recibo impresso e guardado em Arquivos.'); };
A.reciboWa = () => { const r = E.d.recebimentos.find(x => x.id === E.ui.pc.modal.id); if (!r) return; guardarDoc(r.pac, 'Recibo', textoRecibo(r), null);
  registrarAudit(`Enviou recibo pelo WhatsApp · ${pac(r.pac).nome}`); E.ui.pc.modal = null; semDesfazer(); render();
  toast('No sistema real abre o WhatsApp da clínica com o recibo em PDF. Ficou guardado em Arquivos.'); };
{ const modalOriginal = modalHTML; modalHTML = () => E.ui.pc.modal && E.ui.pc.modal.tipo === 'recibo' ? MODAL_RECIBO() : E.ui.pc.modal && E.ui.pc.modal.tipo === 'dentista' ? MODAL_DENTISTA() : modalOriginal(); }

/* ---------- cartões: quanto cai, quando e quanto fica com a maquininha ---------- */
const BANDEIRAS = ['Visa', 'Mastercard', 'Elo'];
function movCartoes() {
  const T = E.d.taxasCartao, hoje = E.d.recebimentos.filter(r => T[r.forma]).map((r, i) => ({ id: r.id, data: E.d.hoje, pac: r.pac, forma: r.forma, band: BANDEIRAS[i % 3], valor: r.valor, n: r.forma === 'Crédito parcelado' ? 3 : 1 }));
  return [...hoje, ...E.d.cartoesAntes.map(k => ({ n: 1, ...k }))].map(k => { const t = T[k.forma], taxa = Math.round(k.valor * t.taxa / 100);
    const cai = somaDias(k.data, t.dias), liquido = k.valor - taxa;
    return { ...k, taxa, liquido, cai, parcelas: t.porParcela ? Array.from({ length: k.n }, (_, i) => ({ venc: somaDias(k.data, 30 * (i + 1)), v: Math.round(liquido / k.n) })) : [{ venc: cai, v: liquido }] }; })
    .sort((a, b) => b.data.localeCompare(a.data));
}

const pctBR = n => `${String(n).replace('.', ',')}%`;
/* ---------- a tela ---------- */
function telaFinanceiro() {
  const aba = E.ui.pc.finAba || 'fluxo';
  const tabs = `<span class="tabs" role="tablist">${[['fluxo', 'Fluxo de caixa'], ['despesas', 'Despesas'], ['cartoes', 'Cartões'], ['carteira', 'Carteira a receber']].map(([k, t]) => `<button role="tab" aria-selected="${aba === k}" class="${aba === k ? 'on' : ''}" data-a="finAba" data-v="${k}">${t}</button>`).join('')}</span>`;
  const corpo = { fluxo: finFluxo, despesas: finDespesas, cartoes: finCartoes, carteira: finCarteira }[aba]();
  const exp = { fluxo: 'exportFluxo', despesas: 'exportDespesas', cartoes: 'exportCartoes', carteira: 'exportCarteira' }[aba];
  return `<div class="titulo-tela"><h1>Contas e fluxo</h1><span class="sub">${esc(E.d.unidade)}${aba === 'carteira' ? '' : ' · outubro'}</span><span class="titulo-acoes">${botaoExcel(exp)}${tabs}</span></div>${corpo}`;
}
A.finAba = ds => { E.ui.pc.finAba = ds.v; render(); };

/* ---------- carteira a receber (T-021): quem deve, quantas parcelas, quanto falta, a data combinada e quem já pagou.
   Só o que a própria clínica financia; cartão é com a maquininha ---------- */
const CART_SIT = { vencida: ['alerta', 'Vencida'], hoje: ['relogio', 'Vence hoje'], avencer: ['agenda', 'A vencer'], quitada: ['check', 'Quitada'] };
function cartSituacao(x) { return saldoParcela(x) <= 0 ? 'quitada' : x.venc < E.d.hoje ? 'vencida' : x.venc === E.d.hoje ? 'hoje' : 'avencer'; }
function cartParcelas() { const { cartDe: de, cartAte: ate } = E.ui.pc;
  return Object.entries(E.d.parcelas).flatMap(([pid, ps]) => ps.filter(x => x.carteira && (!de || x.venc >= de) && (!ate || x.venc <= ate)).map(x => ({ pid, x, sit: cartSituacao(x), falta: saldoParcela(x) }))).sort((a, b) => a.x.venc.localeCompare(b.x.venc) || a.pid.localeCompare(b.pid)); }
const cartDaAba = (l, aba) => l.filter(({ sit }) => aba === 'todas' || (aba === 'aberto' ? sit !== 'quitada' : aba === 'avencer' ? sit === 'avencer' || sit === 'hoje' : sit === aba));
const cartTotais = l => ({ aReceber: l.reduce((s, r) => s + r.falta, 0), vencido: l.filter(r => r.sit === 'vencida').reduce((s, r) => s + r.falta, 0), recebido: l.reduce((s, r) => s + r.x.pago, 0), pacientes: new Set(l.filter(r => r.falta > 0).map(r => r.pid)).size });
const cartFaltaPac = pid => parcelas(pid).filter(x => x.carteira).reduce((s, x) => s + saldoParcela(x), 0);
function cartCorpo() {
  const pc = E.ui.pc, aba = pc.cartAba || 'aberto';
  if (pc.cartDe && pc.cartAte && pc.cartDe > pc.cartAte) return '<div class="cartao"><div class="vazio">A data inicial está depois da data final.</div></div>';
  const todas = cartParcelas(), t = cartTotais(todas), lista = cartDaAba(todas, aba);
  const kpi = (n, txt, ico, cls) => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 22)}</span><span><b class="num">${n}</b><span>${txt}</span></span></div>`;
  return `<div class="kpis-h cart-kpis">${kpi(brl(t.aReceber), `a receber · ${t.pacientes} ${t.pacientes === 1 ? 'paciente' : 'pacientes'}`, 'caixa', 'azul')}${kpi(brl(t.vencido), 'vencido', 'alerta', t.vencido ? 'vermelho' : 'verde')}${kpi(brl(t.recebido), 'já recebido', 'sobe', 'verde')}</div>
  <table class="tab cart-tab"><thead><tr><th>Paciente</th><th>Parcela</th><th>Data combinada</th><th class="dir col-valor">Valor</th><th class="dir">Pago</th><th class="dir">Falta</th><th>Situação</th><th></th></tr></thead><tbody>
  ${lista.map(({ pid, x, sit, falta }) => { const p = pac(pid), [i, rot] = CART_SIT[sit], dias = sit === 'vencida' ? Math.round((new Date(E.d.hoje + 'T12:00') - new Date(x.venc + 'T12:00')) / 864e5) : 0;
    return `<tr><td><button class="btn-link cart-pac" data-a="abrirFicha" data-id="${pid}">${esc(p.nome)}</button><small class="cart-sub">nº ${p.numero} · falta ${brl(cartFaltaPac(pid))} no total</small></td><td class="num">${x.n} de ${x.de}</td><td class="num">${dataBRc(x.venc)}</td><td class="num dir col-valor">${brl(x.valor)}</td><td class="num dir">${brl(x.pago)}</td><td class="num dir"><b>${brl(falta)}</b></td>
      <td><span class="cart-sit ${sit}">${ic(i, 15)} ${rot}${dias ? ` há ${dias} ${dias === 1 ? 'dia' : 'dias'}` : ''}</span></td><td class="dir">${falta > 0 && pode('caixa') ? `<button class="btn btn-peq" data-a="abrirReceber" data-pac="${pid}">Receber</button>` : ''}</td></tr>`; }).join('') || `<tr><td colspan="8" class="vazio">Nenhuma parcela de carteira${pc.cartDe || pc.cartAte ? ' nesse período' : ''}${aba !== 'todas' ? ' nessa situação' : ''}.</td></tr>`}
  </tbody></table>`;
}
function finCarteira() {
  const pc = E.ui.pc, aba = pc.cartAba || 'aberto';
  return `<div class="cart-filtros"><span class="seg">${[['aberto', 'Em aberto'], ['vencida', 'Vencidas'], ['avencer', 'A vencer'], ['quitada', 'Quitadas'], ['todas', 'Todas']].map(([k, t]) => `<button class="${aba === k ? 'ativo' : ''}" data-a="cartAba" data-v="${k}" aria-pressed="${aba === k}">${t}</button>`).join('')}</span>
    <span class="cart-per"><span class="muted">Data combinada</span><label>de <input type="date" value="${esc(pc.cartDe || '')}" data-campo="pc.cartDe" data-ao="cartPer"></label><label>até <input type="date" value="${esc(pc.cartAte || '')}" data-campo="pc.cartAte" data-ao="cartPer"></label></span></div>
  <div id="cart-corpo">${cartCorpo()}</div>`;
}
A.cartAba = ds => { E.ui.pc.cartAba = ds.v; render(); };
A.cartPer = () => { document.getElementById('cart-corpo').innerHTML = cartCorpo(); }; // só a tabela: o campo de data segue com o foco
A.exportCarteira = () => E.ui.pc.cartDe && E.ui.pc.cartAte && E.ui.pc.cartDe > E.ui.pc.cartAte ? toast('A data inicial está depois da data final: nada foi exportado.') : baixarCSV('carteira-a-receber', ['Paciente', 'Nº', 'Parcela', 'Data combinada', 'Valor (R$)', 'Pago (R$)', 'Falta (R$)', 'Situação'],
  cartDaAba(cartParcelas(), E.ui.pc.cartAba || 'aberto').map(({ pid, x, sit, falta }) => [pac(pid).nome, pac(pid).numero, `${x.n} de ${x.de}`, dataBRc(x.venc), reais(x.valor), reais(x.pago), reais(falta), CART_SIT[sit][1]]));

function finFluxo() {
  const hojeEnt = totaisDia().total; // guia de convênio não é entrada: o plano paga depois (T-021)
  const semanas = [...E.d.entradasAntes, { sem: '29/10 (hoje)', valor: hojeEnt }];
  const ent = semanas.reduce((t, s) => t + s.valor, 0), pagas = E.d.despesas.filter(d => d.pago && d.venc.slice(0, 7) === '2026-10'), sai = pagas.reduce((t, d) => t + d.valor, 0);
  const aPagar = E.d.despesas.filter(d => !d.pago && d.venc.slice(0, 7) === '2026-10').reduce((t, d) => t + d.valor, 0);
  const kpi = (n, txt, ico, cls) => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 22)}</span><span><b class="num">${n}</b><span>${txt}</span></span></div>`;
  const max = Math.max(...semanas.map(s => s.valor), 1);
  const porCat = {}; pagas.forEach(d => { porCat[d.cat] = (porCat[d.cat] || 0) + d.valor; });
  const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]), maxC = Math.max(1, ...cats.map(c => c[1]));
  return `<div class="kpis-h">${kpi(brl(ent), 'entrou em outubro', 'sobe', 'verde')}${kpi(brl(sai), 'saiu (despesas pagas)', 'desce', 'vermelho')}
    ${kpi(brl(ent - sai), 'saldo do mês', 'caixa', ent - sai >= 0 ? 'azul' : 'vermelho')}${kpi(brl(aPagar), 'ainda a pagar em outubro', 'relogio', 'ambar')}</div>
  <div class="grade-painel">
    <div class="cartao"><h3>Entradas por semana</h3>
      ${semanas.map(s => `<div class="rel-barra"><span>${esc(s.sem)}</span><span class="rel-trilho"><i style="width:${Math.round(s.valor / max * 100)}%"></i></span><b class="num">${brl(s.valor)}</b></div>`).join('')}</div>
    <div class="cartao"><h3>Para onde foi o dinheiro</h3>${cats.map(([c, v]) => `<div class="rel-barra"><span>${esc(c)}</span><span class="rel-trilho"><i class="fin-sai" style="width:${Math.round(v / maxC * 100)}%"></i></span><b class="num">${brl(v)}</b></div>`).join('')}</div>
  </div>
  <p class="nota-leve">${ic('cadeado', 15)} Só ${esc(E.d.unidade)} · números de exemplo. O recebido de hoje vem do Caixa.</p>`;
}
A.exportFluxo = () => baixarCSV('fluxo-de-caixa', ['Período', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)'],
  [...E.d.entradasAntes.map(s => [s.sem, 'Entrada', 'Recebimentos', '', reais(s.valor)]), ...E.d.recebimentos.filter(r => r.forma !== 'Convênio').map(r => ['29/10', 'Entrada', `${pac(r.pac).nome} · ${r.forma}`, '', reais(r.valor)]),
   ...E.d.despesas.filter(d => d.pago).map(d => [dataBR(d.venc), 'Saída', d.desc, d.cat, '-' + reais(d.valor)])]);

function finDespesas() {
  const f = E.ui.pc.despFiltro || 'apagar', hoje = E.d.hoje, recem = E.ui.pc.recemPagas = E.ui.pc.recemPagas || {};
  const fica = d => recem[d.id] && Date.now() - recem[d.id] < 10000; // acabou de pagar ou desmarcar: a linha não pula (S8, regra 11)
  const lista = E.d.despesas.filter(d => f === 'apagar' ? !d.pago || fica(d) : f === 'pagas' ? d.pago || fica(d) : true).sort((a, b) => a.venc.localeCompare(b.venc));
  const vencidas = E.d.despesas.filter(d => !d.pago && d.venc < hoje);
  const naoDed = c => !(E.d.catDespesa.find(x => x[0] === c) || [])[1];
  const conta = k => E.d.despesas.filter(d => k === 'apagar' ? !d.pago : k === 'pagas' ? d.pago : true).length;
  return `<div class="fin-barra"><span class="tabs" role="tablist">${[['apagar', 'A pagar'], ['pagas', 'Pagas'], ['todas', 'Todas']].map(([k, t]) => `<button role="tab" aria-selected="${f === k}" class="${f === k ? 'on' : ''}" data-a="despFiltro" data-v="${k}">${t} <span class="num">${conta(k)}</span></button>`).join('')}</span>
    ${E.ui.pc.novaDesp ? '' : `<span class="titulo-acoes"><button class="btn btn-pri" data-a="novaDespesa">${ic('mais', 18)} Nova despesa</button></span>`}</div>
  ${vencidas.length && f !== 'pagas' ? `<div class="aviso-box erro">${ic('alerta', 16)} <b>${vencidas.length} ${vencidas.length === 1 ? 'conta vencida' : 'contas vencidas'}</b> · ${brl(vencidas.reduce((t, d) => t + d.valor, 0))}</div>` : ''}
  ${E.ui.pc.novaDesp ? formNovaDespesa() : ''}
  <div class="cartao rel-uni"><table class="tab desp-tab"><thead><tr><th>Vence</th><th>Descrição</th><th>Categoria</th><th class="dir">Valor</th><th></th></tr></thead><tbody>
    ${lista.map(d => `<tr class="${fica(d) ? 'desp-feita' : ''}"><td class="num"><b class="${!d.pago && d.venc < hoje ? 'txt-erro' : ''}">${dataBR(d.venc)}</b>${!d.pago && d.venc < hoje ? `<small class="desp-venc">${ic('alerta', 13)} Vencida</small>` : ''}</td>
      <td><b>${esc(d.desc)}</b>${d.parc ? ` <span class="muted">· ${d.parc}</span>` : ''}<small class="desp-forn">${[d.forn !== '—' ? esc(d.forn) : '', d.fixo ? 'todo mês' : ''].filter(Boolean).join(' · ')}</small></td>
      <td>${esc(d.cat)}${naoDed(d.cat) ? ' <span class="tag inativo" title="Não entra no Livro-Caixa">não dedutível</span>' : ''}</td><td class="dir num"><b>${brl(d.valor)}</b></td>
      <td class="dir">${fica(d) ? (d.pago ? `<span class="desp-ok">${ic('check', 15)} Paga</span> <button class="btn btn-peq" data-a="desmarcarDespesa" data-id="${d.id}">Desfazer</button>`
          : `<span class="desp-ok volta">${ic('desmarcar', 15)} Voltou para a pagar</span> <button class="btn btn-peq" data-a="repagarDespesa" data-id="${d.id}">Desfazer</button>`)
        : d.pago ? `<span class="est est-chegou">${ic('check', 15)} Paga</span> <button class="btn btn-peq btn-fant" data-a="desmarcarDespesa" data-id="${d.id}">Desmarcar</button>`
        : `<button class="btn btn-peq" data-a="pagarDespesa" data-id="${d.id}">Pagar</button>`}</td></tr>`).join('') || '<tr><td colspan="5" class="vazio">Nada aqui.</td></tr>'}</tbody></table></div>`;
}
A.despFiltro = ds => { E.ui.pc.despFiltro = ds.v; render(); };
let ultimoPagar = 0;
A.pagarDespesa = ds => { if (Date.now() - ultimoPagar < 700) return; ultimoPagar = Date.now(); // duplo clique não paga a de baixo
  const d = E.d.despesas.find(x => x.id === ds.id); if (!d || d.pago) return;
  d.pago = true; E.ui.pc.recemPagas[d.id] = Date.now(); registrarAudit(`Despesa paga: ${d.desc} · ${brl(d.valor)}`); semDesfazer(); render();
  setTimeout(() => { if (E.ui.pc.tela === 'financeiro') render(); }, 10100); };
A.desmarcarDespesa = ds => { if (Date.now() - ultimoPagar < 700) return; ultimoPagar = Date.now();
  const d = E.d.despesas.find(x => x.id === ds.id); if (!d) return; const naHora = E.ui.pc.recemPagas[d.id] && Date.now() - E.ui.pc.recemPagas[d.id] < 10000;
  semDesfazer(); d.pago = false; if (naHora) delete E.ui.pc.recemPagas[d.id]; else E.ui.pc.recemPagas[d.id] = Date.now(); // desfazer do "Paga" some; desmarcar nas Pagas fica 10 s
  registrarAudit(`Desmarcou como paga: ${d.desc} · ${brl(d.valor)}`); render(); if (!naHora) setTimeout(() => { if (E.ui.pc.tela === 'financeiro') render(); }, 10100); };
A.repagarDespesa = ds => { if (Date.now() - ultimoPagar < 700) return; ultimoPagar = Date.now();
  const d = E.d.despesas.find(x => x.id === ds.id); if (!d) return; semDesfazer(); d.pago = true; delete E.ui.pc.recemPagas[d.id]; registrarAudit(`Desfez: voltou a paga · ${d.desc}`); render(); };
A.novaDespesa = () => { E.ui.pc.novaDesp = { desc: '', cat: 'Material odontológico', venc: E.d.hoje, valor: '', fixo: false, forn: '' }; E.ui.foco = 'nd-desc'; render(); document.querySelector('.nd-form')?.scrollIntoView({ block: 'nearest' }); };
function formNovaDespesa() { const n = E.ui.pc.novaDesp;
  return `<div class="cartao nd-form"><h3>Nova despesa</h3><div class="tres"><div class="campo"><label>Descrição <span class="obrig">*</span></label><input id="nd-desc" value="${esc(n.desc)}" data-campo="pc.novaDesp.desc" placeholder="Ex.: Material de limpeza"></div>
    <div class="campo"><label>Categoria</label><select data-campo="pc.novaDesp.cat">${E.d.catDespesa.map(([c]) => `<option ${c === n.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <div class="campo"><label>Fornecedor</label><input value="${esc(n.forn)}" data-campo="pc.novaDesp.forn"></div></div>
    <div class="tres"><div class="campo"><label>Vence em</label><input type="date" value="${n.venc}" data-campo="pc.novaDesp.venc"></div>
    <div class="campo"><label>Valor (R$) <span class="obrig">*</span></label><input inputmode="decimal" value="${esc(n.valor)}" data-campo="pc.novaDesp.valor" placeholder="0,00"></div>
    <label class="campo nd-fixa"><input type="checkbox" ${n.fixo ? 'checked' : ''} data-campo="pc.novaDesp.fixo"> Despesa fixa (todo mês)</label></div>
    <div class="rodape-dir"><button class="btn" data-a="cancelarDespesa">Cancelar</button><button class="btn btn-pri" data-a="salvarDespesa">Salvar despesa</button></div></div>`; }
A.cancelarDespesa = () => { E.ui.pc.novaDesp = null; render(); };
A.salvarDespesa = () => { const n = E.ui.pc.novaDesp, v = lerReais(n.valor);
  if (!n.desc.trim() || !v) { toast('Preencha a descrição e o valor.'); E.ui.foco = !n.desc.trim() ? 'nd-desc' : null; render(); return; }
  comDesfazer(`Despesa salva: ${esc(n.desc)} · ${brl(v)}.`, () => { E.d.despesas.push({ id: uid(), desc: n.desc.trim(), cat: n.cat, venc: n.venc || E.d.hoje, valor: v, pago: false, fixo: !!n.fixo, forn: n.forn || '—', forma: '—' }); E.ui.pc.novaDesp = null; E.ui.pc.despFiltro = 'apagar'; }); };
A.exportDespesas = () => baixarCSV('despesas', ['Vencimento', 'Descrição', 'Categoria', 'Dedutível', 'Fornecedor', 'Fixa', 'Situação', 'Valor (R$)'],
  E.d.despesas.map(d => [dataBR(d.venc) + '/2026', d.desc, d.cat, (E.d.catDespesa.find(x => x[0] === d.cat) || [])[1] ? 'sim' : 'não', d.forn, d.fixo ? 'sim' : 'não', d.pago ? 'paga' : 'a pagar', reais(d.valor)]));

function finCartoes() {
  const ms = movCartoes(), futuras = ms.flatMap(k => k.parcelas.filter(p => p.venc > E.d.hoje).map(p => ({ ...p, k })));
  const prox7 = futuras.filter(p => p.venc <= somaDias(E.d.hoje, 7)).reduce((t, p) => t + p.v, 0), prox30 = futuras.filter(p => p.venc <= somaDias(E.d.hoje, 30)).reduce((t, p) => t + p.v, 0);
  const taxas = ms.reduce((t, k) => t + k.taxa, 0), bruto = ms.reduce((t, k) => t + k.valor, 0);
  const kpi = (n, txt, ico, cls) => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 22)}</span><span><b class="num">${n}</b><span>${txt}</span></span></div>`;
  return `<div class="kpis-h">${kpi(brl(prox7), 'cai na conta nos próximos 7 dias', 'relogio', 'azul')}${kpi(brl(prox30), 'cai nos próximos 30 dias', 'agenda', 'teal')}
    ${kpi(brl(taxas), `fica com a maquininha · ${(taxas / Math.max(1, bruto) * 100).toFixed(1).replace('.', ',')}%`, 'cartao', 'ambar')}${kpi(ms.length, 'pagamentos com cartão em outubro', 'checks', 'verde')}</div>
  <div class="cartao rel-uni"><div class="cartao-cab"><h3>Pagamentos com cartão</h3></div>
    <table class="tab"><thead><tr><th>Data</th><th>Paciente</th><th>Tipo</th><th>Bandeira</th><th class="dir">Valor</th><th class="dir">Taxa</th><th class="dir">Cai na conta</th></tr></thead><tbody>
    ${ms.map(k => `<tr><td class="num">${dataBR(k.data)}</td><td>${esc(pac(k.pac).nome)}</td><td>${formaHTML(k.forma)}${k.n > 1 ? ` <span class="muted">${k.n}x</span>` : ''}</td><td class="muted">${esc(k.band)}</td>
      <td class="dir num"><b>${brl(k.valor)}</b></td><td class="dir num muted">− ${brl(k.taxa)}</td>
      <td class="dir num">${k.parcelas.length > 1 ? `${k.parcelas.length}x de ${brl(k.parcelas[0].v)}<br><span class="muted">a partir de ${dataBR(k.parcelas[0].venc)}</span>` : `<b>${brl(k.liquido)}</b> <span class="muted">em ${dataBR(k.cai)}</span>`}</td></tr>`).join('')}</tbody></table></div>
  <p class="nota-leve">${ic('alerta', 15)} Taxas de exemplo: débito ${pctBR(E.d.taxasCartao['Cartão débito'].taxa)} (cai em 1 dia), crédito ${pctBR(E.d.taxasCartao['Cartão crédito'].taxa)} (30 dias), parcelado ${pctBR(E.d.taxasCartao['Crédito parcelado'].taxa)} (uma parcela por mês). As reais vêm do contrato da maquininha.</p>`;
}
A.exportCartoes = () => baixarCSV('cartoes', ['Data', 'Paciente', 'Tipo', 'Bandeira', 'Parcelas', 'Valor (R$)', 'Taxa (R$)', 'Líquido (R$)', 'Primeiro crédito'],
  movCartoes().map(k => [dataBR(k.data) + '/2026', pac(k.pac).nome, k.forma, k.band, k.n, reais(k.valor), reais(k.taxa), reais(k.liquido), dataBR(k.parcelas[0].venc) + '/2026']));

/* ---------- exportar: Caixa, Pacientes e Relatórios ---------- */
A.exportCaixa = () => baixarCSV('caixa-do-dia', ['Hora', 'Paciente', 'Profissional', 'Forma', 'Plano', 'Valor (R$)', 'Recebido por'],
  E.d.recebimentos.map(r => [hhmm(r.hora), pac(r.pac).nome, r.prof ? prof(r.prof).curto : '—', r.plano ? 'Guia de convênio (produzido, fora do recebido)' : r.forma, r.plano ? conv(r.plano).nome : '', reais(r.valor), (usu(r.por) || {}).nome || '—']));
A.exportPacientes = () => baixarCSV('pacientes', ['Nº', 'Nome', 'Idade', 'Celular', 'Convênio', 'Situação'],
  E.d.pacientes.filter(p => !p.excluido).map(p => [p.numero, p.nome, idade(p.nasc), p.cel, conv(p.conv).nome, p.inativo ? 'inativo' : 'ativo']));
A.exportRelatorio = () => { const P = E.d.painel; baixarCSV('relatorio-mensal', ['Mês', 'Particular (R$)', 'Convênio (R$)', 'Orçamentos feitos', 'Orçamentos aprovados', 'Pacientes novos'],
  P.meses.map(m => [m.rot + (m.parcial ? ' (até 29)' : ''), reais(m.part), reais(m.conv), m.orcF, m.orcA, m.novos])); };

/* ---------- dados da dentista (Configurações → Pessoas) ---------- */
A.editarDentista = ds => { const p = prof(ds.id); E.ui.pc.modal = { tipo: 'dentista', id: p.id, cro: p.cro || '', dur: p.durPadrao, com: p.comissao, lab: p.descontaLab }; E.ui.foco = 'dt-cro'; render(); };
const MODAL_DENTISTA = () => { const m = E.ui.pc.modal, p = prof(m.id);
  return `<div class="modal"><div class="painel-cab"><h2>${esc(p.nome)}</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="duas"><div class="campo"><label>CRO-PE</label><input id="dt-cro" value="${esc(m.cro)}" data-campo="pc.modal.cro" placeholder="Número do CRO"></div>
    <div class="campo"><label>Consulta padrão</label><select data-campo="pc.modal.dur">${[20, 30, 40, 60].map(d => `<option value="${d}" ${d == m.dur ? 'selected' : ''}>${d} min</option>`).join('')}</select></div></div>
    <div class="duas"><div class="campo"><label>Comissão (%)</label><input inputmode="numeric" value="${esc(m.com)}" data-campo="pc.modal.com"></div>
    <label class="campo nd-fixa"><input type="checkbox" ${m.lab ? 'checked' : ''} data-campo="pc.modal.lab"> Descontar o laboratório antes da comissão</label></div>
    <p class="nota-leve">${ic('alerta', 15)} O CRO sai na receita e no atestado. A comissão e o laboratório valem para Relatórios → Comissões. A consulta padrão é a duração que a agenda sugere quando não há procedimento.</p>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="fecharModal">Cancelar</button><button class="btn btn-pri" data-a="salvarDentista">Salvar</button></div></div>`; };
A.salvarDentista = () => { const m = E.ui.pc.modal, p = prof(m.id), txt = String(m.com ?? '').trim(), com = Number(txt.replace(',', '.'));
  if (!txt || !Number.isFinite(com) || com < 0 || com > 100) { toast('Digite a comissão: um número de 0 a 100.'); return; }
  const mud = [p.comissao !== com ? `comissão ${p.comissao}% → ${com}%` : '', (p.cro || '') !== m.cro.trim() ? `CRO ${p.cro || '—'} → ${m.cro.trim() || '—'}` : '',
    Number(p.durPadrao) !== Number(m.dur) ? `consulta ${p.durPadrao} → ${m.dur} min` : '', !!p.descontaLab !== !!m.lab ? `laboratório ${m.lab ? 'desconta' : 'não desconta'}` : ''].filter(Boolean).join(' · ');
  comDesfazer(`Dados de ${esc(p.curto)} salvos${mud ? `: ${esc(mud)}` : ''}.`, () => { const q = prof(m.id); Object.assign(q, { cro: m.cro.trim() || null, durPadrao: Number(m.dur), comissao: com, descontaLab: !!m.lab }); E.ui.pc.modal = null; }); };
