/* Telas do computador — blueprint/06-pantallas-pc.md */
const K = 1.8; // px por minuto na agenda (40 min = 72 px: cabem estado, nome e procedimento — ADR-028)
const usuPC = () => usu(E.ui.pc.usuario);
function pode(acao, u = usuPC()) {
  const p = u.papel;
  return {
    // admin = Suely Maria, esposa do dono e coordenadora: vê tudo como o dono (Nicolas, 03/11 — ADR-023)
    caixa: ['recepcao', 'dono', 'admin'], clinico: ['dentista', 'dono', 'admin'], indicar: ['dentista'], alerta: ['dentista'],
    finPac: ['recepcao', 'dono', 'admin'], config: ['dono', 'admin'],
    relatorios: ['dono', 'admin'], whatsapp: ['recepcao', 'dono', 'admin'], evolucao: ['dentista'], recusar: ['dentista', 'recepcao', 'admin'], cadastro: ['recepcao', 'dono', 'admin'],
    anamnese: ['dentista'], // o dono lê a anamnese, mas quem preenche é a dentista (a ficha guarda qual profissional fez)
  }[acao].includes(p) || (!!u.fin && ['caixa', 'finPac', 'relatorios'].includes(acao)); // fin: dentista da família que também cuida do financeiro
}

function pcHTML() {
  const u = usuPC(), pc = E.ui.pc, fechado = !!pc.menuFechado;
  const nFin = pode('finPac') ? contaFinHoje() : 0;
  // ADR-028: menu com ícone + nome; fechado (☰) fica só o ícone e o nome aparece ao passar o mouse
  const menu = [['hoje', 'inicio', 'Hoje'], ['agenda', 'agenda', 'Agenda'], ['pacientes', 'pacientes', 'Pacientes']];
  if (pode('caixa')) menu.push(['caixa', 'caixa', 'Caixa', nFin]);
  const gestao = [];
  if (pode('relatorios')) gestao.push(['relatorios', 'graficos', 'Relatórios']);
  if (pode('whatsapp')) gestao.push(['whatsapp', 'msg', 'WhatsApp']);
  MENU_EXTRA.filter(x => !x[4] || x[4]()).forEach(([id, ico, nome, grupo]) => (grupo === 'gestao' ? gestao : menu).push([id, ico, nome]));
  const ativo = pc.tela === 'ficha' || pc.tela === 'novoPac' ? 'pacientes' : pc.tela;
  const item = ([id, ico, nome, badge]) => `<button class="menu-item ${ativo === id ? 'ativo' : ''}" data-a="tela" data-t="${id}" ${fechado ? `data-dica="${nome}" aria-label="${nome}"` : ''}><span class="ico">${ic(ico, 21)}</span><span class="menu-nome">${nome}</span>${badge ? `<b class="menu-badge" aria-label="${badge} pendentes">${badge}</b>` : ''}</button>`;
  const nPend = pendenciasHoje().n;
  return `<div class="pc ${fechado ? 'menu-fechado' : ''}">
  <header class="pc-topo" ${pc.sobre ? 'inert' : ''}>
    <button class="hamb" data-a="menuPC" aria-label="${fechado ? 'Mostrar menu' : 'Esconder menu'}" aria-expanded="${!fechado}">${ic('menu', 22)}</button>
    <div class="marca"><span class="selo"><img src="selo.png" alt=""></span><span class="marca-txt"><b>OdontoVip</b><span>Gestão da clínica</span></span></div>
    <button class="unid" data-a="trocarUnidade">${ic('local', 16)} ${esc(E.d.unidade)} ${ic('baixo', 16)}</button>
    <div class="busca">${ic('busca', 18, 'ic-busca')}<input id="busca-global" placeholder="Buscar paciente: nome, CPF, telefone ou nº" data-ao="buscaGlobal" autocomplete="off"><span class="atalho" aria-hidden="true">/</span><div id="busca-res" class="busca-res"></div></div>
    <div class="topo-dir">
      ${E.ui.clinicaSemInternet
        ? '<span class="conexao aviso" title="O sistema funciona normal. Só o WhatsApp e o resumo do dono esperam a internet voltar."><span class="ponto"></span>Sem internet — tudo funciona</span>'
        : E.ui.waDesconectado && pode('whatsapp') ? '<button class="conexao wa-caiu" data-a="tela" data-t="whatsapp"><span class="ponto"></span>WhatsApp desconectado</button>'
        : '<span class="conexao ok"><span class="ponto"></span>Conectado</span>'}
      <button class="topo-ico" data-a="verPendencias" data-dica="${nPend ? `${nPend} pendências de hoje` : 'Nenhuma pendência hoje'}" aria-label="Pendências de hoje: ${nPend}">${ic('sino', 20)}${nPend ? '<b></b>' : ''}</button>
      <button class="usu" data-a="trocarUsuario" aria-label="Trocar usuário"><span class="av">${iniciais(u.nome)}</span><span class="usu-txt"><b>${esc(u.nome)}</b><span>${esc(u.rotulo.split(' · ')[0])}</span></span>${ic('baixo', 16)}</button>
    </div>
  </header>
  <nav class="pc-menu" ${pc.sobre ? 'inert' : ''}>
    ${menu.map(item).join('')}
    ${gestao.length ? `<div class="menu-grupo">Gestão</div>${gestao.map(item).join('')}` : ''}
    <div class="menu-sep"></div>
    ${pode('config') ? item(['config', 'config', 'Configurações']) : ''}
    <button class="menu-item" data-a="menuPC" ${fechado ? 'data-dica="Mostrar menu" aria-label="Mostrar menu"' : ''}><span class="ico">${ic(fechado ? 'expandir' : 'recolher', 21)}</span><span class="menu-nome">Esconder menu</span></button>
  </nav>
  <main class="pc-conteudo" data-scroll="pc-main" ${pc.sobre ? 'inert' : ''}>${telaPC()}</main>
  ${pc.painel ? '<div class="cortina" data-a="fecharPainel"></div>' + painelHTML() : ''}
  ${pc.modal ? '<div class="cortina"></div>' + modalHTML() : ''}
  ${pc.sobre ? sobreHTML('pc') : ((E.ui.seloVisto || {}).pc = false, '')}
  </div>`;
}
A.verPendencias = () => { const pc = E.ui.pc; pc.tela = 'hoje'; pc.abaHoje = 'agenda'; pc.painel = null; pc.modal = null; render();
  const c = document.querySelector('.h-cartao-atencao'), m = document.querySelector('[data-scroll="pc-main"]'); if (c && m) m.scrollTo({ top: Math.max(0, c.offsetTop - 16), behavior: 'smooth' }); };
A.menuPC = () => { E.ui.pc.menuFechado = !E.ui.pc.menuFechado; render(); };
A.trocarUnidade = () => toast('Por enquanto só Boa Viagem. Prazeres e Norte entram no mesmo sistema depois (ADR-026).');
/* ganchos dos carris paralelos (04/11): financeiro.js (hackintosh) e agenda-wa.js (MacBook) registram
   telas em TELAS_EXTRA e itens de menu em MENU_EXTRA = [id, ícone, nome, grupo ('' ou 'gestao'), quem pode (função)] */
const TELAS_EXTRA = {}, MENU_EXTRA = [];
function telaPC() {
  return ({ ...TELAS_EXTRA, hoje: telaHoje, agenda: telaAgenda, pacientes: telaPacientes, novoPac: telaNovoPac, ficha: telaFicha, caixa: telaCaixa, config: telaConfig, relatorios: telaRelatorios, whatsapp: telaWhatsApp })[E.ui.pc.tela]();
}
A.tela = ds => { const pc = E.ui.pc; pc.tela = ds.t; pc.painel = null; pc.modal = null; pc.anamForm = null; pc.evoForm = null; render(); };
A.fecharPainel = () => { E.ui.pc.painel = null; render(); };
A.fecharModal = () => { E.ui.pc.modal = null; render(); };

/* ---------- busca global ---------- */
function resultadoPac(p, acao, extra = '') {
  const prox = proximaConsulta(p.id);
  return `<div class="res-item" data-a="${acao}" data-id="${p.id}" ${extra}>
    <span class="res-num">nº ${p.numero}</span><span><b>${esc(p.nome)}</b> · ${idade(p.nasc)} anos${p.inativo ? ' <span class="tag inativo">inativo</span>' : ''} ${alertas(p.id).length ? `<span class="alerta-ico">${ic('alerta', 15)}</span>` : ''}</span>
    <span class="res-meta">${ult4(p.cel)}<br>${prox ? 'hoje ' + hhmm(prox.ini) : conv(p.conv).nome}</span></div>`;
}
A.buscaGlobal = (ds, el) => {
  const box = document.getElementById('busca-res'), t = el.value;
  const r = buscarPacientes(t);
  if (t.trim().length < 2) { box.classList.remove('aberto'); box.innerHTML = ''; return; }
  box.innerHTML = r.map(p => resultadoPac(p, 'abrirFicha')).join('') +
    (r.length ? '' : `<div class="res-item muted">Nenhum paciente com “${esc(t)}”.</div>`) +
    `<div class="res-item res-novo" data-a="novoPaciente" data-nome="${esc(t)}">+ Cadastrar novo paciente</div>`;
  box.classList.add('aberto');
};
A.abrirFicha = ds => {
  const pc = E.ui.pc; pc.tela = 'ficha'; pc.fichaId = ds.id; pc.aba = 'resumo'; pc.painel = null; pc.modal = null;
  pc.anamForm = null; pc.evoForm = null; pc.dente = null; pc.novoAlerta = null; render();
};

/* ---------- HOJE ---------- */
/* depois de um toque, a linha fica 10 s no mesmo lugar (cinza, com Desfazer nela):
   a lista não pula e o próximo toque não cai no paciente de baixo */
const fixos = () => (E.ui.pc.fixos = E.ui.pc.fixos || {});
function fixar(id, txt, desfazer, el) {
  const linha = el && el.closest('.h-linha, .h-atencao');
  const f = fixos(); f[id] = { txt, desfazer, criado: Date.now(), ate: Date.now() + 10000, altura: linha ? linha.offsetHeight : 0 };
  setTimeout(() => { if (f[id] && Date.now() >= f[id].ate) { delete f[id]; if (E.ui.pc.tela === 'hoje') render(); } }, 10100);
}
const fixo = id => { const f = fixos()[id]; return f && Date.now() < f.ate ? f : null; };
// duplo clique: o segundo toque cairia no Desfazer, que fica onde estava o botão
A.desfazerFixo = ds => { const f = fixos()[ds.id]; if (!f || Date.now() - f.criado < 700) return; f.desfazer(); delete fixos()[ds.id]; render(); toast('Desfeito.'); };
const linhaFixa = (id, hora, f) => `<div class="h-linha h-feito" style="min-height:${f.altura}px"><span class="hora num">${hora}</span><span class="h-feito-txt">${ic('check', 16)} ${f.txt}</span><span class="acoes"><button class="btn btn-peq" data-a="desfazerFixo" data-id="${id}">Desfazer</button></span></div>`;
/* onde a linha aparece: enquanto está fixa, no lugar de antes */
const estadoPos = a => { const f = fixo(a.id); return f ? f.antes : a.estado; };
const minDesde = m => Math.max(0, E.d.agoraMin - m);
const tempo = min => min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
function pacHoje(p, meta) {
  return `<span class="h-pac">${avPac(p)}<span class="h-pac-txt"><span class="h-nome"><b>${esc(p.nome)}</b>${alertas(p.id).length ? `<span class="alerta-ico" title="${esc(alertas(p.id).map(x => x.texto).join(' · '))}">${ic('alerta', 15)}</span>` : ''}</span>
    <span class="h-meta">${meta}</span></span></span>`;
}
// sem a cadeira: ela está na Agenda e no detalhe; aqui o procedimento precisa caber inteiro
const numNome = p => `nº&nbsp;${p.numero}&nbsp;· ${esc(p.nome)}`;
const metaAg = a => [prof(a.prof).curto, a.proc ? proc(a.proc).nome : ''].filter(Boolean).map(esc).join(' · ');
/* botão só com ícone: o nome aparece ao passar o mouse/focar e é lido pelo leitor de tela */
const botaoIco = (ico, dica, attrs, cls = '') => `<button class="btn-ico ${cls}" aria-label="${dica}" data-dica="${dica}" ${attrs}>${ic(ico, 18)}</button>`;
/* avatar com as iniciais (ADR-028); a cor fica fixa por paciente */
const avPac = p => `<span class="av av${p.numero % 4}" aria-hidden="true">${esc(iniciais(p.nome))}</span>`;
const atrasado = a => ['a_confirmar', 'confirmado'].includes(a.estado) && a.ini + 15 < E.d.agoraMin;
/* pastilha do estado: ícone + palavra (ADR-028). Atrasado é a exceção, em vermelho */
const pastilhaHoje = a => atrasado(a) ? `<span class="est est-faltou">${ic('relogio', 15)} Atraso de ${tempo(minDesde(a.ini))}</span>` : estadoHTML(a.estado);

/* lista do dia (maqueta ADR-028): hora · estado · paciente · a ação principal e o resto no ⋯ */
function linhaHoje(a) {
  const f = fixo(a.id); if (f) return linhaFixa(a.id, hhmm(a.ini), f);
  const p = pac(a.pac), e = a.estado, tarde = atrasado(a);
  const acoes = [];
  const est = (v, txt, ico) => ({ txt, ico, attrs: `data-a="estadoAg" data-o="hoje" data-id="${a.id}" data-e="${v}"` });
  // presente sem pagar: cobrar ANTES de atender (ADR-025); atendido: só o que ficou pendente + retorno
  const antes = ['chegou', 'em_atendimento'].includes(e) && !pagoParaComecar(p.id) ? aCobrarHoje(p.id) : 0;
  const semOrc = ['chegou', 'em_atendimento'].includes(e) && !antes && semOrcamentoAprovado(p.id);
  const devido = e === 'atendido' ? aCobrarHoje(p.id) : 0, ret = e === 'atendido' ? retornoPendente(p.id) : null;
  if (antes && pode('caixa')) acoes.push({ txt: `Receber ${brl(antes).replace(',00', '')}`, ico: 'caixa', attrs: `data-a="abrirReceber" data-pac="${p.id}"`, pri: true });
  if (semOrc && pode('caixa')) acoes.push({ txt: 'Fazer orçamento', ico: 'arquivo', attrs: `data-a="orcDaFicha" data-id="${p.id}"` });
  if (devido && pode('caixa')) acoes.push({ txt: `Receber ${brl(devido).replace(',00', '')}`, ico: 'caixa', attrs: `data-a="abrirReceber" data-pac="${p.id}"` });
  if (ret) acoes.push({ txt: 'Agendar retorno', ico: 'remarcar', attrs: `data-a="agendarRetorno" data-id="${ret.id}"` });
  // perto da hora (1 h antes ou depois) quem chega é o normal: "Presente" vem primeiro, mesmo sem ter confirmado
  const perto = a.ini - 60 <= E.d.agoraMin;
  const presente = { ...est('chegou', 'Presente', 'chegou'), sec: tarde }, confirmar = est('confirmado', 'Confirmar consulta', 'check'); // regra 8: não confundir com confirmar a chegada
  if (e === 'a_confirmar') acoes.push(...(perto ? [presente, confirmar] : [confirmar, presente]));
  if (e === 'confirmado') acoes.push(presente);
  if (tarde) acoes.push(est('faltou', 'Faltou', 'x'));
  if (e === 'a_confirmar') acoes.push({ txt: a.waEnviado ? `WhatsApp aberto às ${a.waEnviado} · abrir de novo` : 'Confirmar pelo WhatsApp', ico: 'msg', attrs: `data-a="abrirWaUm" data-id="${a.id}"` });
  if (['a_confirmar', 'confirmado'].includes(e)) acoes.push({ txt: 'Cancelar consulta', ico: 'desmarcar', attrs: `data-a="cancelarHoje" data-id="${a.id}"` });
  acoes.push({ txt: 'Ver detalhes', ico: 'arquivo', attrs: `data-a="abrirAg" data-id="${a.id}"` });
  const [prin, ...resto] = acoes.length > 1 || acoes[0].txt !== 'Ver detalhes' ? acoes : [null];
  const principal = prin && prin.txt !== 'Ver detalhes' ? prin : null;
  const menu = principal ? resto : acoes;
  const aberto = E.ui.pc.menuLinha === a.id;
  const desde = minDesde(a.chegouAs ?? a.ini);
  const sob = e === 'chegou' ? `<small class="h-espera ${desde >= 15 ? 'demora' : ''}">espera ${tempo(desde)}</small>` : e === 'em_atendimento' ? `<small class="h-espera atend">há ${tempo(desde)}</small>` : '';
  return `<div class="h-linha h-dia est-linha-${e} ${e === 'em_atendimento' ? 'agora' : ''}" data-a="abrirAg" data-id="${a.id}"><span class="hora num">${hhmm(a.ini)}${sob}</span>
    <span class="h-est">${pastilhaHoje(a)}</span>${pacHoje(p, (a.waEnviado && e === 'a_confirmar' ? `<span class="h-wa">${ic('msg', 13)} WhatsApp ${a.waEnviado}</span> · ` : '') + `nº ${p.numero} · ${metaAg(a)}` + (e === 'desmarcou' && a.motivo ? ` · <span class="h-motivo">motivo: ${esc(a.motivo)}</span>` : ''))}
    <span class="acoes">${principal ? `<button class="btn btn-peq ${principal.pri ? 'btn-pri' : principal.sec ? 'btn-sec' : ''}" ${principal.attrs}>${principal.txt}</button>` : ''}
      <span class="linha-mais"><button class="btn-ico" data-a="abrirMenuLinha" data-id="${a.id}" aria-label="Mais ações" aria-expanded="${aberto}" data-dica="Mais ações">${ic('pontos', 18)}</button>
      ${aberto ? `<span class="linha-menu" role="menu">${menu.map(x => `<button role="menuitem" ${x.attrs.replace('data-a="', 'data-a="linhaMenu" data-acao="')}>${ic(x.ico, 17)} ${x.txt}</button>`).join('')}</span>` : ''}</span></span></div>`;
}
A.abrirMenuLinha = ds => { const pc = E.ui.pc; pc.menuLinha = pc.menuLinha === ds.id ? null : ds.id; render();
  const mn = document.querySelector('.linha-menu'), sc = document.querySelector('[data-scroll="pc-main"]');
  if (mn && sc && mn.getBoundingClientRect().bottom > sc.getBoundingClientRect().bottom - 8) mn.classList.add('acima'); };
A.linhaMenu = (ds, el, e) => { E.ui.pc.menuLinha = null; A[ds.acao](ds, el, e); };
// o menu ⋯ fecha ao clicar fora dele
document.addEventListener('click', e => { if (E.ui.pc.menuLinha && !e.target.closest('.linha-menu,[data-a="abrirMenuLinha"]')) { E.ui.pc.menuLinha = null; if (!e.target.closest('[data-a]')) render(); } }, true);
/* pendência: ícone · o que fazer · quem · botões (maqueta ADR-028) */
function itemAtencao(ico, cor, titulo, meta, acoes, quando, id, grupo) {
  const f = id && fixo(id);
  if (f) return `<div class="h-atencao h-feito" style="min-height:${f.altura}px"><span class="h-ico ok">${ic('check', 18)}</span><span class="h-feito-txt">${f.txt}</span><span class="acoes"><button class="btn btn-peq" data-a="desfazerFixo" data-id="${id}">Desfazer</button></span></div>`;
  return `<div class="h-atencao"><span class="h-ico ${cor}">${ic(ico, 18)}</span><span class="pend-txt"><b>${grupo || titulo}</b><span class="h-meta">${grupo ? `${quando ? quando + ' · ' : ''}${titulo} · ` : ''}${meta}</span>${acoes ? `<span class="acoes">${acoes}</span>` : ''}</span></div>`;
}
const FILTROS_HOJE = [['abertos', 'Em aberto'], ['todos', 'Todos'], ['clinica', 'Na clínica'], ['atendido', 'Atendidos']];
function doDiaHoje() { return E.d.agendamentos.filter(a => a.pac && estadoPos(a) !== 'remarcado').sort((a, b) => a.ini - b.ini); }
function contaFinHoje() {
  const vencidas = E.d.pacientes.filter(p => parcelasAbertas(p.id).some(x => x.venc < E.d.hoje)).length;
  const vencHoje = Object.values(E.d.parcelas).flat().filter(x => x.venc === E.d.hoje && saldoParcela(x) > 0).length;
  return vencidas + vencHoje;
}
/* pendências do dia: o mesmo número aparece no sino da barra de cima */
function pendenciasHoje() {
  const ag = E.d.agoraMin, doDia = doDiaHoje(), ativos = doDia.filter(a => ATIVOS.includes(estadoPos(a)));
  const naoVeio = ativos.filter(a => ['a_confirmar', 'confirmado'].includes(estadoPos(a)) && a.ini + 15 < ag);
  const anteriores = E.d.pendentesAnteriores.filter(x => !x.fechado || fixo(x.id));
  // saída: atendido hoje com algo pendente na recepção (cobrar e/ou agendar o retorno)
  const saidas = [...new Set(doDia.filter(a => estadoPos(a) === 'atendido').map(a => a.pac))]
    .map(pid => ({ pid, ag: doDia.filter(a => a.pac === pid && estadoPos(a) === 'atendido').slice(-1)[0], devido: aCobrarHoje(pid), ret: retornoPendente(pid) }))
    .filter(s => (s.devido && pode('caixa')) || s.ret);
  const retornos = E.d.pedidosRetorno.filter(r => !r.feito && !saidas.some(s => s.ret === r));
  // ADR-025: quem está na unidade (ou já na cadeira) e ainda não pagou o que vence hoje
  const antes = pode('caixa') ? [...new Set(doDia.filter(a => ['chegou', 'em_atendimento'].includes(estadoPos(a))).map(a => a.pac))]
    .filter(pid => !pagoParaComecar(pid) || semOrcamentoAprovado(pid)).map(pid => ({ pid, ag: doDia.filter(a => a.pac === pid && ['chegou', 'em_atendimento'].includes(estadoPos(a)))[0], devido: aCobrarHoje(pid), semOrc: pagoParaComecar(pid) })) : [];
  const nome = p => esc(p.nome);
  const novos = aprovaProc() ? E.d.procedimentos.filter(x => x.pendente) : [];
  const agWa = pendenciasAgWa(); // T-018: WhatsApp desconectado e vaga liberada
  const html = [
    ...agWa.urg,
    ...novos.map(x => itemAtencao('prancheta', 'info', esc(x.nome), `${x.dur} min · criado por ${esc((usu(x.criadoPor) || {}).nome || '—')}`,
      `<input class="preco-in pp-in" id="pp-${x.id}" inputmode="decimal" placeholder="Preço R$" aria-label="Preço particular de ${esc(x.nome)}"><button class="btn btn-peq btn-pri" data-a="aprovarProc" data-id="${x.id}">Aprovar</button><button class="btn btn-peq" data-a="recusarProc" data-id="${x.id}">Recusar</button>`, '', '', 'Procedimento novo para aprovar')),
    ...antes.map(s => { const p = pac(s.pid), naCadeira = s.ag.estado === 'em_atendimento';
      if (s.semOrc) return itemAtencao('alerta', 'aviso', nome(p), `${esc(prof(s.ag.prof).curto)} · sem orçamento aprovado`,
        `<button class="btn btn-peq btn-pri" data-a="orcDaFicha" data-id="${s.pid}">Fazer orçamento</button>`, '', '', 'Fazer o orçamento antes de atender');
      return itemAtencao('dinheiro', naCadeira ? 'erro' : 'aviso', nome(p),
        `${esc(prof(s.ag.prof).curto)}${naCadeira ? ' · <b>já está na cadeira</b>' : ''}${formaPrevistaHoje(s.pid) ? ` · prevista: ${esc(formaPrevistaHoje(s.pid))}` : ''}`,
        `<button class="btn btn-peq btn-pri" data-a="abrirReceber" data-pac="${s.pid}">Receber ${brl(s.devido).replace(',00', '')}</button>`, '', '', 'Cobrar antes de atender'); }),
    ...saidas.map(s => { const p = pac(s.pid), cobra = s.devido && pode('caixa');
      const linhas = [cobra ? `ficou ${brl(s.devido)}${formaPrevistaHoje(s.pid) ? ` · prevista: ${esc(formaPrevistaHoje(s.pid))}` : ''}` : '', s.ret ? `retorno ${esc(resumoRetorno(s.ret)) || 'pedido'}` : ''].filter(Boolean).join(' · ');
      return itemAtencao(cobra ? 'recibo' : 'remarcar', 'info', nome(p), linhas,
        (cobra ? `<button class="btn btn-peq" data-a="abrirReceber" data-pac="${s.pid}">Receber ${brl(s.devido).replace(',00', '')}</button>` : '')
        + (s.ret ? `<button class="btn btn-peq" data-a="agendarRetorno" data-id="${s.ret.id}">Agendar retorno</button>` : ''), '', '', cobra ? 'Saída com valor pendente' : 'Saída: agendar o retorno'); }),
    ...agWa.vagas,
    ...naoVeio.map(a => { const p = pac(a.pac);
      return itemAtencao('relogio', 'erro', nome(p), `era às ${hhmm(a.ini)} · <span class="num">${esc(p.cel)}</span>`,
        `<button class="btn btn-peq" data-a="estadoAg" data-o="hoje" data-id="${a.id}" data-e="chegou">Presente</button><button class="btn btn-peq" data-a="estadoAg" data-o="hoje" data-id="${a.id}" data-e="faltou">Faltou</button>`, '', a.id, 'Não chegou'); }),
    ...retornos.map(r => { const p = pac(r.pac);
      return itemAtencao('remarcar', 'info', nome(p), `${esc(prof(r.prof).curto)}${resumoRetorno(r) ? ' · ' + esc(resumoRetorno(r)) : ''}`, `<button class="btn btn-peq" data-a="agendarRetorno" data-id="${r.id}">Agendar</button>`, '', '', 'Pedido de retorno'); }),
    ...anteriores.map(x => { const p = pac(x.pac);
      return itemAtencao('calendarioX', 'neutro', nome(p), `${esc(prof(x.prof).curto)} · ninguém marcou se veio`,
        `<button class="btn btn-peq" data-a="fecharAnterior" data-id="${x.id}" data-e="atendido">Veio</button><button class="btn btn-peq" data-a="fecharAnterior" data-id="${x.id}" data-e="faltou">Faltou</button>`, `${dataBR(x.data)} ${hhmm(x.ini)}`, x.id, 'Ficou aberta de outro dia'); }),
  ];
  const n = agWa.n + novos.length + antes.length + saidas.length + naoVeio.filter(a => !fixo(a.id)).length + retornos.length + anteriores.filter(x => !fixo(x.id)).length;
  const todas = E.ui.pc.pendTodas, MAX = 4;
  return { n, html: (todas ? html : html.slice(0, MAX)).join('') + (html.length > MAX ? `<button class="btn-link pend-mais" data-a="pendTodas">${todas ? 'Mostrar menos' : `Ver todas (${html.length})`}</button>` : '') };
}
A.pendTodas = () => { E.ui.pc.pendTodas = !E.ui.pc.pendTodas; render(); };
function telaHoje() {
  const t = totaisDia(), pc = E.ui.pc;
  const verFin = pode('finPac'), aba = verFin && pc.abaHoje === 'fin' ? 'fin' : 'agenda', filtro = pc.filtroHoje || 'abertos';
  const doDia = doDiaHoje();
  const vencidas = E.d.pacientes.filter(p => parcelasAbertas(p.id).some(x => x.venc < E.d.hoje));
  const vencHoje = Object.entries(E.d.parcelas).flatMap(([pid, ps]) => ps.filter(x => x.venc === E.d.hoje && saldoParcela(x) > 0).map(x => ({ pid, x })));
  const pend = pendenciasHoje(), nFin = vencidas.length + vencHoje.length;
  const kpi = (n, txt, ico, cls) => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 22)}</span><span><b class="num">${n}</b><span>${txt}</span></span></div>`;
  const passa = (a, k) => k === 'todos' || (k === 'abertos' ? ATIVOS.includes(estadoPos(a)) : k === 'clinica' ? ['chegou', 'em_atendimento'].includes(estadoPos(a)) : estadoPos(a) === k);
  const conta = k => doDia.filter(a => passa(a, k)).length;
  const lista = doDia.filter(a => passa(a, filtro));
  const agenda = `<div class="grade-2 grade-hoje">
    <div class="cartao h-lista"><div class="cartao-cab"><h3>Pacientes de hoje</h3>
      <div class="tabs" role="tablist" aria-label="Filtro da lista">${FILTROS_HOJE.map(([k, rot]) => `<button role="tab" aria-selected="${filtro === k}" class="${filtro === k ? 'on' : ''}" data-a="filtroHoje" data-v="${k}">${rot} <span class="num">${conta(k)}</span></button>`).join('')}</div></div>
      <div class="h-dia h-dia-cab" aria-hidden="true"><span>Hora</span><span>Status</span><span>Paciente</span><span></span></div>
      ${lista.map(linhaHoje).join('') || '<div class="vazio">Ninguém nesse filtro.</div>'}</div>
    <div class="cartao h-cartao-atencao"><div class="cartao-cab"><h3>Pendências</h3>${pend.n ? `<span class="cont">${pend.n}</span>` : ''}</div>${pend.html || `<div class="vazio">${ic('checks', 22)}<br>Tudo em dia.</div>`}</div>
  </div>`;
  // financeiro separado da agenda (R3): só quem tem acesso ao financeiro vê a aba
  const fin = `<div class="grade-2">
    <div class="cartao"><div class="cartao-cab"><h3>Parcelas vencidas</h3>${vencidas.length ? `<span class="cont alerta">${vencidas.length}</span>` : ''}</div>
      ${vencidas.map(p => itemAtencao('caixa', 'erro', numNome(p), `${brl(parcelasAbertas(p.id).filter(x => x.venc < E.d.hoje).reduce((s, x) => s + saldoParcela(x), 0))} em atraso · ${esc(p.cel)}`,
        pode('caixa') ? `<button class="btn btn-peq" data-a="abrirReceber" data-pac="${p.id}">Receber</button>` : '')).join('') || '<div class="vazio">Nenhuma parcela vencida.</div>'}</div>
    <div class="cartao"><div class="cartao-cab"><h3>Vence hoje e falta receber</h3>${vencHoje.length ? `<span class="cont">${vencHoje.length}</span>` : ''}</div>
      ${vencHoje.map(({ pid, x }) => itemAtencao('caixa', 'aviso', numNome(pac(pid)), `parcela ${x.n} de ${x.de} · falta ${brl(saldoParcela(x))}`,
        pode('caixa') ? `<button class="btn btn-peq" data-a="abrirReceber" data-pac="${pid}">Receber</button>` : '')).join('') || '<div class="vazio">Nada vence hoje.</div>'}
      ${pode('caixa') ? `<button class="btn-link" data-a="tela" data-t="caixa" style="margin:10px 20px 16px">Abrir o Caixa →</button>` : ''}</div>
  </div>`;
  return `<div class="titulo-tela"><h1>Hoje</h1><span class="sub">quinta, 29 de outubro</span>
    ${verFin ? `<div class="tabs tabs-titulo" role="tablist"><button role="tab" aria-selected="${aba === 'agenda'}" class="${aba === 'agenda' ? 'on' : ''}" data-a="abaHoje" data-v="agenda">Agenda do dia</button><button role="tab" aria-selected="${aba === 'fin'}" class="${aba === 'fin' ? 'on' : ''}" data-a="abaHoje" data-v="fin">Financeiro${nFin ? ` <span class="cont alerta">${nFin}</span>` : ''}</button></div>` : ''}
    <span class="titulo-acoes">${pode('caixa') ? `<button class="btn btn-sec" data-a="abrirReceber">${ic('dinheiro', 18)} Receber pagamento</button>` : ''}<button class="btn btn-pri" data-a="novoAg">${ic('mais', 18)} Novo agendamento</button></span></div>
  <div class="kpis-h">
    ${kpi(t.agendados, `agendados · ${t.aConfirmar} a confirmar`, 'agenda', 'azul')}
    ${kpi(t.naClinica, 'na clínica agora', 'chegou', 'ambar')}
    ${kpi(t.atendidos, `atendidos · ${t.faltas} ${t.faltas === 1 ? 'falta' : 'faltas'}`, 'checks', 'verde')}
    ${pode('caixa') ? kpi(brl(t.total).replace(',00', ''), 'recebido hoje', 'caixa', 'teal') : kpi(E.d.pedidosRetorno.filter(r => !r.feito).length, 'pedidos de retorno', 'remarcar', 'teal')}
  </div>
  ${aba === 'fin' ? fin : agenda}`;
}
/* "Fazer orçamento" direto das Pendências: abre a ficha no Financeiro com o orçamento */
/* como o comprovante: a assinatura é com o dedo no celular ou tablet da clínica, sem CPF nem e-mail */
A.pedirAssinOrc = ds => { const o = orcamentos(E.ui.pc.fichaId).find(x => x.id === ds.id); if (!o) return; o.pedido = true;
  // sem toast: a própria linha diz "pedido enviado ao celular", e o Desfazer da aprovação continua na tela
  render(); };
A.orcDaFicha = ds => { A.abrirFicha({ id: ds.id }); E.ui.pc.aba = 'financeiro'; A.abrirOrc(); };
A.abaHoje = ds => { E.ui.pc.abaHoje = ds.v; render(); };
A.filtroHojeSel = (ds, el) => { E.ui.pc.filtroHoje = el.value; render(); };
A.filtroHoje = ds => { E.ui.pc.filtroHoje = ds.v; render(); };
/* cancelar pela lista abre o detalhe já pedindo o motivo (R5) */
A.motivoDigitado = (ds, el) => { const pn = E.ui.pc.painel; if (pn.erroMotivo && el.value.trim()) { pn.erroMotivo = false; el.classList.remove('com-erro'); const e = el.parentElement.querySelector('.cel-erro'); if (e) e.remove(); } };
A.cancelarHoje = ds => { E.ui.pc.painel = { tipo: 'det', id: ds.id, desmarcando: true }; E.ui.foco = 'motivo'; render(); };
A.fecharAnterior = (ds, el) => { const x = E.d.pendentesAnteriores.find(y => y.id === ds.id), p = pac(x.pac);
  x.fechado = ds.e;
  fixar(x.id, `<b>${esc(p.nome)}</b> · ${dataBR(x.data)}: ${ds.e === 'atendido' ? 'veio' : 'faltou'}`,
    () => { const y = E.d.pendentesAnteriores.find(z => z.id === ds.id); if (y) y.fechado = null; }, el);
  render(); toast(`${esc(p.nome)} (${dataBR(x.data)}): ${ds.e === 'atendido' ? 'veio' : 'faltou'}.`); };
A.estadoAg = (ds, el) => {
  const a = E.d.agendamentos.find(x => x.id === ds.id), p = pac(a.pac);
  if (ds.o === 'hoje') {
    const antes = a.estado, chegouAntes = a.chegouAs;
    const txt = { confirmado: 'Consulta confirmada', chegou: `Chegada marcada às ${hhmm(E.d.agoraMin)}`, faltou: 'Falta registrada' }[ds.e];
    a.estado = ds.e; if (ds.e === 'chegou') a.chegouAs = E.d.agoraMin;
    fixar(a.id, `<b>${esc(p.nome)}</b> · ${txt}`, () => { const b = E.d.agendamentos.find(x => x.id === ds.id); b.estado = antes; b.chegouAs = chegouAntes; }, el);
    fixos()[a.id].antes = antes;
    render(); toast(`${txt}: ${esc(p.nome)}.`); return;
  }
  const msg = { confirmado: 'Consulta confirmada', chegou: `Chegada marcada às ${hhmm(E.d.agoraMin)}`, faltou: 'Falta registrada',
    em_atendimento: 'Atendimento iniciado', atendido: 'Atendimento finalizado' }[ds.e];
  comDesfazer(`${msg}: ${esc(p.nome)}.`, () => {
    a.estado = ds.e; if (ds.e === 'chegou') a.chegouAs = E.d.agoraMin;
    if (E.ui.pc.painel && E.ui.pc.painel.tipo === 'det') E.ui.pc.painel = { tipo: 'det', id: a.id };
  });
};

/* ---------- AGENDA ---------- */
const iniciaisProf = n => n.replace(/^(Dra?\.)\s*/, '').split(' ').map(x => x[0]).slice(0, 2).join('');
function eventoAgenda(a) {
  const top = (a.ini - 480) * K, h = Math.max(a.dur * K - 3, 24), fim = hhmm(a.ini + a.dur);
  const passado = a.ini + a.dur <= E.d.agoraMin ? ' passado' : '';
  if (!a.pac) return `<div class="ag-ev e-comp${passado}" style="top:${top}px;height:${h}px" data-a="abrirAg" data-id="${a.id}" title="${hhmm(a.ini)}–${fim} · ${esc(a.tipo)}">
    <span class="ev-l1"><b class="num">${hhmm(a.ini)}</b></span><span class="ev-nome">${esc(a.tipo)}</span>${h >= 52 && a.obs ? `<span class="ev-proc">${esc(a.obs)}</span>` : ''}</div>`;
  const p = pac(a.pac), al = alertas(p.id).length, [ico, rot] = ESTADOS[a.estado], curto = h < 52;
  // maqueta ADR-028: 1ª linha colorida (ícone · hora · estado), depois o nome e o procedimento; turno curto = uma linha só
  const alerta = al ? `<span class="alerta-ico">${ic('alerta', 14)}</span>` : '';
  return `<div class="ag-ev e-${a.estado}${passado}${curto ? ' baixo' : ''}" style="top:${top}px;height:${h}px" data-a="abrirAg" data-id="${a.id}" title="${hhmm(a.ini)}–${fim} · nº ${p.numero} ${esc(p.nome)} · ${rot}">
    ${curto ? `<span class="ev-l1">${ic(ico, 14)}<b class="num">${hhmm(a.ini)}</b><span class="ev-nome">${alerta}${esc(p.nome)}</span><span class="so-leitor">${rot}</span></span>`
      : `<span class="ev-l1">${ic(ico, 14)}<b class="num">${hhmm(a.ini)}</b><span class="ev-est"><span>· ${rot}</span></span></span>
    <span class="ev-nome">${alerta}${esc(p.nome)}</span>${a.proc ? `<span class="ev-proc">${esc(proc(a.proc).nome)}</span>` : ''}`}</div>`;
}
/* semana (blueprint/06 §Agenda: Dia | Semana): quantos pacientes e quantos horários livres por dia e dentista */
function telaAgendaSemana() {
  const hoje = pf => { const ags = E.d.agendamentos.filter(a => a.prof === pf.id && a.pac && !['desmarcou', 'remarcado'].includes(a.estado));
    return [ags.length, Math.max(0, 9 - ags.length)]; }; // ~9 consultas por dentista num dia cheio, como nos outros dias
  const cel = (d, pf) => d.dia === E.d.hoje ? hoje(pf) : d[pf.id] || [0, 0];
  const tot = d => E.d.profissionais.reduce((t, pf) => t + cel(d, pf)[0], 0);
  return `<div class="cartao sem-cartao"><table class="tab sem-tab"><thead><tr><th>Dentista</th>${E.d.semana.map(d => `<th class="${d.dia === E.d.hoje ? 'sem-hoje' : ''}">${d.rot}${d.dia === E.d.hoje ? ' · hoje' : ''}</th>`).join('')}</tr></thead><tbody>
    ${E.d.profissionais.map(pf => `<tr><td><span class="td-pac"><span class="av">${esc(iniciaisProf(pf.nome))}</span><span><b>${esc(pf.curto)}</b><small>${esc(cad(pf.cadeira).nome)}</small></span></span></td>
      ${E.d.semana.map(d => { const [n, l] = cel(d, pf), pct = n + l ? Math.round(n / (n + l) * 100) : 0;
        const passou = d.dia < E.d.hoje;
        return `<td class="${d.dia === E.d.hoje ? 'sem-hoje' : ''} ${passou ? 'sem-passou' : ''}"><button class="sem-cel" data-a="semanaDia" data-dia="${d.dia}" ${n + l ? '' : 'disabled'}>${n + l ? (passou ? `<b class="num">${n} ${n === 1 ? 'atendido' : 'atendidos'}</b><small>dia encerrado</small>`
          : `<b class="num">${n} ${n === 1 ? 'paciente' : 'pacientes'}</b><span class="sem-barra"><i style="width:${pct}%"></i></span><small>${l ? `${l} ${l === 1 ? 'horário livre' : 'horários livres'}` : 'agenda cheia'}</small>`) : '<small>não atende</small>'}</button></td>`; }).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr><td><b>Total</b></td>${E.d.semana.map(d => `<td class="num ${d.dia === E.d.hoje ? 'sem-hoje' : ''}"><b>${tot(d)}</b></td>`).join('')}</tr></tfoot></table></div>
  <p class="nota-leve">${ic('alerta', 15)} Toque num dia para abrir a agenda dele. No protótipo só a quinta 29/10 tem pacientes.</p>`;
}
A.semanaDia = ds => { if (ds.dia !== E.d.hoje) { toast('No protótipo só existem os pacientes de hoje (quinta 29/10).'); return; } E.ui.pc.agendaModo = 'dia'; render(); };
A.outraSemana = () => toast('No protótipo só existe esta semana (26 a 31/10).');
A.agendaModo = ds => { E.ui.pc.agendaModo = ds.v; render(); };
function telaAgenda() {
  const ver = E.ui.pc.agendaVer, modo = E.ui.pc.agendaModo || 'dia';
  const tabsModo = `<span class="tabs" role="tablist">${[['dia', 'Dia'], ['semana', 'Semana']].map(([k, t]) => `<button role="tab" aria-selected="${modo === k}" class="${modo === k ? 'on' : ''}" data-a="agendaModo" data-v="${k}">${t}</button>`).join('')}</span>`;
  if (modo === 'semana') return `<div class="titulo-tela"><h1>Agenda</h1><span class="ag-dia"><button class="btn btn-peq btn-icone" data-a="outraSemana" aria-label="Semana anterior">${ic('esq', 18)}</button><b>26 a 31 de outubro</b><button class="btn btn-peq btn-icone" data-a="outraSemana" aria-label="Próxima semana">${ic('dir', 18)}</button></span>
    <span class="titulo-acoes">${tabsModo}<button class="btn btn-pri" data-a="novoAg">${ic('mais', 16)} Novo agendamento</button></span></div>${telaAgendaSemana()}`;
  const todas = ver === 'prof' ? E.d.profissionais.map(p => ({ id: p.id, nome: p.curto, sub: `${cad(p.cadeira).nome} · ${p.esp}`, ini: iniciaisProf(p.nome) }))
    : E.d.cadeiras.map(c => ({ id: c.id, nome: c.nome, sub: (E.d.profissionais.find(p => p.cadeira === c.id) || {}).curto || '', ini: c.nome.replace(/\D/g, '') || '·' }));
  // R12 (Danielle): "por profissional, só a profissional"; dá para abrir mais de uma e voltar ao "Mapa geral"
  const vis = (E.ui.pc.agendaSo || {})[ver] || [];
  const cols = vis.length ? todas.filter(c => vis.includes(c.id)) : todas;
  const altura = 600 * K, horas = Array.from({ length: 11 }, (_, i) => 8 + i);
  // compromisso pessoal não tem cadeira: na visão por cadeira aparece na cadeira da profissional
  const daCol = c => E.d.agendamentos.filter(a => (ver === 'prof' ? a.prof === c : (a.cad || prof(a.prof).cadeira) === c));
  const contar = c => daCol(c).filter(a => a.pac && !['desmarcou', 'remarcado'].includes(a.estado)).length;
  // o resumo conta só as colunas que estão na tela
  const naTela = cols.flatMap(c => daCol(c.id));
  // ADR-027: o resumo mostra só o que pede ação; o resto está na grade
  const resumo = ['a_confirmar', 'chegou', 'em_atendimento'].map(e => [e, naTela.filter(a => a.pac && a.estado === e).length]).filter(([, n]) => n);
  const PLURAL = { a_confirmar: ['a confirmar', 'a confirmar'], confirmado: ['confirmado', 'confirmados'], chegou: ['presente na unidade', 'presentes na unidade'], em_atendimento: ['em atendimento', 'em atendimento'],
    atendido: ['atendido', 'atendidos'], faltou: ['faltou', 'faltaram'], desmarcou: ['desmarcou', 'desmarcaram'], remarcado: ['remarcado', 'remarcados'] };
  const linhas = `repeating-linear-gradient(to bottom,var(--rule) 0,var(--rule) 1px,transparent 1px,transparent ${30 * K}px),
    repeating-linear-gradient(to bottom,transparent 0,transparent ${60 * K - 1}px,#c9d6e6 ${60 * K - 1}px,#c9d6e6 ${60 * K}px)`;
  const agora = (E.d.agoraMin - 480) * K;
  return `<div class="titulo-tela"><h1>Agenda</h1>
    <span class="ag-dia"><button class="btn btn-peq btn-icone" data-a="outroDia" aria-label="Dia anterior">${ic('esq', 18)}</button><b>quinta, 29 de outubro</b><button class="btn btn-peq btn-icone" data-a="outroDia" aria-label="Próximo dia">${ic('dir', 18)}</button><button class="btn btn-peq" data-a="agendaHoje">Agora</button></span>
    <span style="margin-left:auto;display:flex;gap:10px;align-items:center">${tabsModo}<span class="seg"><button class="${ver === 'prof' ? 'ativo' : ''}" data-a="verAgenda" data-v="prof">Por profissional</button><button class="${ver === 'cad' ? 'ativo' : ''}" data-a="verAgenda" data-v="cad">Por cadeira</button></span>
    <button class="btn btn-pri" data-a="novoAg">${ic('mais', 16)} Novo agendamento</button></span></div>
  <div class="ag-filtro" role="group" aria-label="Mostrar na agenda"><span class="h-filtro-rot">Mostrar</span>
    <button class="${vis.length ? '' : 'on'}" data-a="agendaSo" data-id="" aria-pressed="${!vis.length}">${ic('agenda', 15)} Mapa geral</button>
    ${todas.map(c => `<button class="${vis.includes(c.id) ? 'on' : ''}" title="Toque em mais de um para comparar" data-a="agendaSo" data-id="${c.id}" aria-pressed="${vis.includes(c.id)}"><span class="ag-av mini-av">${esc(c.ini)}</span> ${esc(c.nome)} <span class="mini">${contar(c.id)}</span></button>`).join('')}
  </div>
  <div class="agenda" data-scroll="agenda" style="grid-template-columns:64px repeat(${cols.length},minmax(180px,1fr))">
    <div class="ag-cab ag-cab-vazia"></div>${cols.map(c => `<div class="ag-cab"><span class="ag-av">${esc(c.ini)}</span><span class="ag-cab-txt"><b>${esc(c.nome)}</b><small>${esc(c.sub)}</small></span></div>`).join('')}
    <div class="ag-horas" style="height:${altura}px">${horas.map(h => `<div class="ag-hora num" style="top:${(h - 8) * 60 * K}px">${String(h).padStart(2, '0')}:00</div>`).join('')}
      <div class="ag-agora-rot num" style="top:${agora}px">${hhmm(E.d.agoraMin)}</div></div>
    ${cols.map(c => `<div class="ag-col" style="height:${altura}px;background-image:${linhas}" data-a="novoNaAgenda" data-col="${c.id}">
      ${ver === 'prof' ? `<div class="ag-almoco" style="top:${240 * K}px;height:${60 * K}px">Almoço · não atende</div>` : ''}
      ${daCol(c.id).map(eventoAgenda).join('')}<div class="ag-agora" style="top:${agora}px"></div></div>`).join('')}
  </div>`;
}
A.verAgenda = ds => { E.ui.pc.agendaVer = ds.v; render(); };
/* liga/desliga uma coluna; vazio = Mapa geral (todas) */
A.agendaSo = ds => { const pc = E.ui.pc, ver = pc.agendaVer; pc.agendaSo = pc.agendaSo || {};
  if (!ds.id) pc.agendaSo[ver] = [];
  else { const v = pc.agendaSo[ver] || [], i = v.indexOf(ds.id); i >= 0 ? v.splice(i, 1) : v.push(ds.id); pc.agendaSo[ver] = v.length === (ver === 'prof' ? E.d.profissionais : E.d.cadeiras).length ? [] : v; }
  render(); };
A.agendaHoje = () => { const ag = document.querySelector('[data-scroll="agenda"]'); if (ag) ag.scrollTo({ top: Math.max(0, (E.d.agoraMin - 480) * K - 160), behavior: 'smooth' }); };
A.outroDia = () => toast('No protótipo só existem dados de hoje.');
A.novoNaAgenda = (ds, el, e) => {
  const r = el.getBoundingClientRect();
  const m = 480 + Math.floor((e.clientY - r.top) / K / 10) * 10;
  if (E.ui.pc.agendaVer === 'prof' && m >= 720 && m < 780) { toast('12:00–13:00 é horário de almoço.'); return; }
  const ver = E.ui.pc.agendaVer;
  const pr = ver === 'prof' ? prof(ds.col) : (E.d.profissionais.find(p => p.cadeira === ds.col) || E.d.profissionais[0]);
  abrirNovoAg({ prof: pr.id, cad: ver === 'prof' ? pr.cadeira : ds.col, ini: m });
};

/* ---------- novo agendamento (painel) ---------- */
/* horários de 10 em 10 min, 08:00–17:50, sem o almoço (12:00–12:59) */
function horariosDoDia(atual) { const hs = []; for (let m = 480; m < 1080; m += 10) if (m < 720 || m >= 780) hs.push(hhmm(m)); if (atual && !hs.includes(atual)) hs.push(atual); return hs.sort(); }
function abrirNovoAg(o = {}) {
  const pr = prof(o.prof || 'p-mar');
  let ini = o.ini ?? Math.ceil(E.d.agoraMin / 10) * 10; if (ini >= 720 && ini < 780) ini = 780; if (ini >= 1080) ini = 1070;
  E.ui.pc.painel = { tipo: 'novoAg', f: { pac: o.pac || null, proc: o.proc || '', prof: pr.id, cad: o.cad || pr.cadeira, ini, horaTxt: hhmm(ini),
    dur: o.dur || pr.durPadrao || 30, tipo: o.tipo || 'Consulta', origem: o.origem || E.ui.ultimaOrigem, obs: o.obs || '', busca: '', cadNovo: null, remarcaDe: o.remarcaDe || null, retorno: o.retorno || null } };
  if (!o.pac) E.ui.foco = 'busca-ag';
  render();
}
A.novoAg = ds => abrirNovoAg(ds.pac ? { pac: ds.pac } : {});
function fAg() { return E.ui.pc.painel.f; }
function estadoBotaoAg(f) {
  const ini = paraMin(f.horaTxt), fim = ini + Number(f.dur), hojeAg = ehHojeAg(f.data); // T-018: outro dia, feriado, férias e horário
  const c = f.pac && hojeAg ? conflitos({ ...f, ini, dur: Number(f.dur) }, f.remarcaDe) : [];
  const fut = f.pac && !hojeAg ? conflitoFut(f, f.data, ini, fim) : null, bloq = bloqueioAg(f.prof, f.data || E.d.hoje, ini, fim);
  let falta = '', deHora = false; // deHora: o problema é o dia ou o horário (o botão cinza diz o motivo, T-020)
  if (f.cadNovo) falta = 'Termine o cadastro do paciente acima.';
  else if (f.proc === '__novo') falta = 'Toque em “Usar este procedimento” ou escolha outro.';
  else if (!f.pac) falta = 'Escolha ou cadastre o paciente.';
  else if (!f.origem) falta = 'Escolha como o paciente chegou.';
  else if (c.length) { falta = 'Esse horário está ocupado.'; deHora = true; }
  else if (fut) deHora = true, falta = `Esse horário está ocupado em ${dataBR(f.data)}: ${fut.pac ? esc(pac(fut.pac).nome) : esc(fut.tipo)} às ${hhmm(fut.ini)}.`;
  else if (bloq) { falta = esc(bloq); deHora = true; }
  // mesmas regras do "Próximo horário livre" (proximoLivre): almoço 12:00–13:00 e fim às 18:00
  else if (ini < 780 && fim > 720) { falta = `Termina às ${hhmm(fim)}: entra no almoço (12:00–13:00).`; deHora = true; }
  else if (fim > 1080) { falta = `Termina às ${hhmm(fim)}: passa das 18:00.`; deHora = true; }
  const p = f.pac && pac(f.pac);
  const nRep = repeticoesAg(f).filter(x => !x.motivo).length;
  const label = p && deHora ? `Não dá: ${falta.replace(/\.\s*Escolha.*$/, '').replace(/\.$/, '')}` // T-020
    : p ? `Agendar ${esc(p.nome.split(' ').slice(0, 2).join(' '))} · ${hojeAg ? DIA : dataCurta(f.data)} · ${f.horaTxt}${nRep ? ` + ${nRep} ${nRep === 1 ? 'vez' : 'vezes'}` : ''}` : 'Agendar';
  const dica = deHora ? ((falta.match(/Escolha.*$/) || [''])[0] || (c.length || fut ? 'Escolha outro horário.' : '')) : falta; // T-020: o motivo já está no botão
  return { c, falta, label, dica };
}
/* próximo horário livre que a agenda deixa marcar de verdade (revisão de código do carril B) */
function livreAg(f) { const dur = Number(f.dur), iso = f.data || E.d.hoje;
  for (let m = paraMin(f.horaTxt); m <= 18 * 60 - dur; m += 10) {
    if (m < 13 * 60 && m + dur > 12 * 60) continue;
    if (bloqueioAg(f.prof, iso, m, m + dur)) continue;
    if (ehHojeAg(iso) ? conflitos({ ...f, ini: m, dur }, f.remarcaDe).length : conflitoFut(f, iso, m, m + dur)) continue;
    return m; }
  return null; }
function conflitoHTML(f) {
  const { c } = estadoBotaoAg(f); if (!c.length) return '';
  const a = c[0], quem = a.pac ? `nº ${pac(a.pac).numero} ${esc(pac(a.pac).nome)}` : esc(a.tipo);
  const livre = livreAg(f);
  return `<div class="aviso-box erro">Esse horário já está ocupado: ${esc(prof(a.prof).curto)}${a.cad ? ' · ' + cad(a.cad).nome : ''} tem ${quem} das ${hhmm(a.ini)} às ${hhmm(a.ini + a.dur)}.
    ${livre != null ? `<br>Próximo horário livre: <b>${hhmm(livre)}</b> <button class="btn btn-peq" data-a="usarHora" data-m="${livre}">Usar ${hhmm(livre)}</button>` : ''}</div>`;
}
A.avaliarAg = () => {
  const f = fAg(), s = estadoBotaoAg(f);
  const b = document.getElementById('btn-agendar'); if (!b) return;
  b.innerHTML = s.label; b.disabled = !!s.falta; // os textos já vêm com esc()
  document.getElementById('falta-ag').innerHTML = s.dica;
  document.getElementById('conflito-ag').innerHTML = conflitoHTML(f);
};
A.usarHora = ds => { const f = fAg(); f.ini = +ds.m; f.horaTxt = hhmm(+ds.m); render(); };
A.procAg = () => { const f = fAg(); if (f.proc === '__novo') { f.novoProc = f.novoProc || { nome: '', dur: 30 }; E.ui.foco = 'np-proc'; } else if (f.proc) f.dur = proc(f.proc).dur; render(); };
A.criarProc = () => { const f = fAg(), n = f.novoProc || {}, nome = (n.nome || '').trim(); if (!nome) { E.ui.foco = 'np-proc'; toast('Escreva o nome do procedimento.'); return; }
  const ja = E.d.procedimentos.find(x => semAcento(x.nome) === semAcento(nome)); if (ja) { f.proc = ja.id; f.dur = ja.dur; render(); toast(`Já existe: ${esc(ja.nome)}.`); return; }
  const pr = { id: uid(), nome, tipo: 'geral', dur: Number(n.dur) || 30, preco: null, lab: 0, pendente: true, criadoPor: E.ui.pc.usuario, criadoEm: E.d.hoje };
  E.d.procedimentos.push(pr); f.proc = pr.id; f.dur = pr.dur; f.novoProc = null; render(); toast(`“${esc(nome)}” criado. Aguarda a aprovação da Dra. Marcelly.`); };
/* quem aprova procedimento novo: a Dra. Marcelly (R13) — e o dono */
const aprovaProc = () => E.ui.pc.usuario === 'u-mar' || usuPC().papel === 'dono';
A.aprovarProc = ds => { const pr = proc(ds.id); if (!pr || !aprovaProc()) return;
  const el = document.getElementById('pp-' + ds.id), v = el ? lerReais(el.value) : 0;
  if (!v) { if (el) { el.classList.add('erro'); el.focus(); } toast(`Digite o preço particular de ${esc(pr.nome)} para aprovar.`); return; }
  comDesfazer(`“${esc(pr.nome)}” aprovado por ${brl(v)}.`, () => { delete pr.pendente; pr.aprovadoPor = E.ui.pc.usuario; pr.preco = v;
    E.d.precos[pr.id] = { ...Object.fromEntries(E.d.convenios.map(c => [c.id, null])), part: v }; }); };
A.recusarProc = ds => { const pr = proc(ds.id); if (!pr || !aprovaProc()) return; comDesfazer(`“${esc(pr.nome)}” recusado.`, () => { pr.recusado = true; delete pr.pendente; }); };
A.profAg = () => { const f = fAg(), pr = prof(f.prof); f.cad = pr.cadeira; if (!f.proc && pr.durPadrao) f.dur = pr.durPadrao; render(); }; // sem procedimento, vale a consulta padrão da dentista
A.buscaAg = (ds, el) => {
  const t = el.value, r = buscarPacientes(t), box = document.getElementById('res-ag');
  // sem resultado: botão grande "Paciente novo" em vez de um link no fim da lista (Danielle, R15)
  box.innerHTML = t.trim().length < 2 ? '' : r.length ? r.map(p => resultadoPac(p, 'escolherPacAg')).join('') +
    `<div class="res-item res-novo" data-a="cadastrarDaBusca">+ Não é nenhum desses? Cadastrar “${esc(t)}”</div>`
    : `<div class="sem-pac"><span>Nenhum paciente com “${esc(t)}”.</span><button class="btn btn-novo-pac" data-a="cadastrarDaBusca">${ic('mais', 16)} Paciente novo — cadastrar</button><span class="mini muted">ou aperte Enter</span></div>`;
};
A.escolherPacAg = ds => { const f = fAg(); f.pac = ds.id; f.busca = ''; render(); };
A.trocarPacAg = () => { const f = fAg(); f.pac = null; E.ui.foco = 'busca-ag'; render(); };
A.cadastrarDaBusca = () => {
  const f = fAg();
  const nome = f.busca.trim().replace(/\s+/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase());
  f.cadNovo = { nome, cel: '', nasc: '', cpf: '', conv: 'part', cart: '', valid: '', origem: E.ui.ultimaOrigem, resp: '', erro: '', dup: null };
  E.ui.foco = 'cn-cel'; render();
};
A.cancelarCadNovo = () => { fAg().cadNovo = null; render(); };

/* máscaras */
function mascara(el, caminho, tipo) {
  let d = el.value.replace(/\D/g, '');
  let v = d;
  if (tipo === 'data') { d = d.slice(0, 8); v = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
  if (tipo === 'cel') { d = d.slice(0, 11); v = d.length > 7 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; }
  if (tipo === 'cpf') { d = d.slice(0, 11); v = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }
  el.value = v; setCampo(caminho, v);
}
const isoDeBR = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ''); if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);   // recusa 31/02, 00/13 etc.
  return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1] ? `${m[3]}-${m[2]}-${m[1]}` : null; };
A.mData = (ds, el) => { mascara(el, ds.campo, 'data'); const iso = isoDeBR(el.value), s = document.getElementById(ds.idade);
  if (s) s.textContent = iso && iso <= E.d.hoje ? `→ ${idade(iso)} anos` : ''; };
A.mCel = (ds, el) => mascara(el, ds.campo, 'cel');
// data no futuro não é "menor de 18" (daria "-4 anos" e pediria responsável)
const idadeTxt = nasc => { const iso = isoDeBR(nasc); return iso && iso <= E.d.hoje ? `→ ${idade(iso)} anos` : ''; };
const ehMenor = nasc => { const iso = isoDeBR(nasc); return !!iso && iso <= E.d.hoje && idade(iso) < 18; };
/* quando a data mostra que é menor, o campo Responsável aparece na hora */
function mDataComMenor(ds, el, id) { const antes = ehMenor(el.value); A.mData(ds, el); if (ehMenor(el.value) !== antes) { E.ui.foco = id; render(); } }
A.mDataCN = (ds, el) => mDataComMenor(ds, el, 'cn-nasc');
A.mCpf = (ds, el) => mascara(el, ds.campo, 'cpf');

function validarNovo(n) {
  if (!n.nome || n.nome.trim().split(' ').length < 2) return 'Escreva o nome completo.';
  if (n.cel.replace(/\D/g, '').length < 10) return 'Falta o celular.';
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(n.nasc || '')) return 'Falta a data de nascimento (dd/mm/aaaa).';
  const iso = isoDeBR(n.nasc); if (!iso) return 'Essa data não existe. Confira o dia e o mês.';
  if (iso > E.d.hoje || iso < '1900') return 'Data de nascimento fora do possível.';
  if (n.cpf && !cpfValido(n.cpf)) return 'Esse CPF não existe. Confira os números ou deixe em branco.';
  if (!emailValido(n.email)) return 'Confira o e-mail (exemplo: nome@gmail.com) ou deixe em branco.';
  return '';
}
const situacaoPac = p => p.excluido ? ` <span class="tag vencida">excluído em ${dataBR(p.excluido.data)}</span>` : p.inativo ? ' <span class="tag inativo">inativo</span>' : '';
A.restaurarEAbrir = ds => { const p = pac(ds.id); delete p.excluido; delete p.inativo; A.abrirFicha({ id: p.id }); toast(`${numNome(p)} voltou a ficar ativo.`); };
function acharDuplicado(n) {
  const iso = isoDeBR(n.nasc), cpf = (n.cpf || '').replace(/\D/g, '');
  return E.d.pacientes.find(p => (cpf.length === 11 && p.cpf.replace(/\D/g, '') === cpf) ||
    (p.nome.toLowerCase() === n.nome.trim().toLowerCase() && p.nasc === iso));
}
function criarPaciente(n) {
  const numero = Math.max(...E.d.pacientes.map(p => p.numero)) + 1;
  const p = { id: 'pa' + numero, numero, nome: n.nome.trim(), nasc: isoDeBR(n.nasc), cel: n.cel, cpf: n.cpf || '', conv: n.conv, origem: n.origem || E.ui.ultimaOrigem, alertas: [] };
  if (n.conv !== 'part') Object.assign(p, { carteirinha: n.cart || '', validadeCart: n.valid || '' });
  if (n.email) p.email = n.email.trim();
  if (n.foto) p.foto = n.foto;
  E.d.pacientes.push(p); return p;
}
A.salvarCadNovo = ds => {
  const f = fAg(), n = f.cadNovo;
  n.erro = validarNovo(n) || (ehMenor(n.nasc) && !n.resp.trim() ? 'Menor de 18: informe o responsável.' : ''); if (n.erro) { render(); return; }
  const dup = acharDuplicado(n);
  if (dup && !ds.forcar) { n.dup = dup.id; render(); return; }
  const p = criarPaciente(n); if (n.resp) p.responsavel = n.resp; f.origem = n.origem; f.origemDoCadastro = true; E.ui.ultimaOrigem = n.origem;
  f.pac = p.id; f.cadNovo = null; f.busca = ''; render(); toast(`Paciente nº ${p.numero} cadastrado.`);
};
A.usarDup = () => { const f = fAg(); f.pac = f.cadNovo.dup; f.cadNovo = null; render(); };
A.salvarAg = () => {
  const f = fAg(), s = estadoBotaoAg(f); if (s.falta) return;
  const ini = paraMin(f.horaTxt), p = pac(f.pac);
  const voltou = p.inativo || p.excluido;
  const reps = repeticoesAg(f), nRep = reps.filter(x => !x.motivo).length, fora = reps.filter(x => x.motivo).map(x => dataBR(x.data)).join(', '),
    trocas = reps.filter(x => x.noLugar).map(x => `${dataBR(x.data)} no lugar de ${dataBR(x.noLugar)} (${esc(x.feriado)})`).join(', ');
  comDesfazer(`Agendado: ${esc(p.nome)} · ${ehHojeAg(f.data) ? '' : dataBR(f.data) + ' '}${f.horaTxt} com ${esc(prof(f.prof).curto)}.${nRep ? ` E mais ${nRep} ${nRep === 1 ? 'vez' : 'vezes'}${trocas ? ` · ${trocas}` : ''}${fora ? ` (${fora.includes(',') ? 'ficaram' : 'ficou'} de fora: ${fora})` : ''}.` : ''}${voltou ? ' O cadastro voltou a ficar ativo.' : ''}`, () => {
    delete p.inativo; delete p.excluido;
    const novo = { id: uid(), pac: f.pac, prof: f.prof, cad: f.cad, ini, dur: Number(f.dur), proc: f.proc || null, tipo: f.tipo, origem: f.origem, estado: 'a_confirmar', obs: f.obs };
    if (ehHojeAg(f.data)) E.d.agendamentos.push(novo); else E.d.agFuturos.push({ ...novo, data: f.data });
    repeticoesAg(f).filter(x => !x.motivo).forEach(x => E.d.agFuturos.push({ ...novo, id: uid(), data: x.data, serie: novo.id }));
    aposAgendarAgWa(f);
    if (f.remarcaDe) { const v = E.d.agendamentos.find(a => a.id === f.remarcaDe); v.estado = 'remarcado'; v.novo = novo.id; }
    if (f.retorno) { const r = E.d.pedidosRetorno.find(x => x.id === f.retorno); if (r) r.feito = true; }
    E.ui.ultimaOrigem = f.origem; E.ui.pc.painel = null;
  });
};

function painelHTML() {
  const pn = E.ui.pc.painel;
  return pn.tipo === 'novoAg' ? painelNovoAg() : painelDetalhe();
}
function painelNovoAg() {
  const f = fAg(); f.data = f.data || E.d.hoje;
  const s = estadoBotaoAg(f), p = f.pac && pac(f.pac);
  let pacHTML;
  if (f.cadNovo) {
    const n = f.cadNovo;
    pacHTML = `<div class="cartao" style="background:var(--paper)"><b>Cadastro rápido</b>
      <div class="campo" style="margin-top:8px"><label>Nome completo <span class="obrig">*</span></label><input value="${esc(n.nome)}" data-campo="pc.painel.f.cadNovo.nome"></div>
      <div class="duas"><div class="campo"><label>Celular <span class="obrig">*</span></label><input id="cn-cel" placeholder="(81) 9____-____" value="${esc(n.cel)}" data-ao="mCel" data-campo="pc.painel.f.cadNovo.cel"></div>
      <div class="campo"><label>Data de nascimento <span class="obrig">*</span> <span id="cn-idade" class="muted">${idadeTxt(n.nasc)}</span></label><input id="cn-nasc" placeholder="dd/mm/aaaa" value="${esc(n.nasc)}" data-ao="mDataCN" data-idade="cn-idade" data-campo="pc.painel.f.cadNovo.nasc"></div></div>
      <div class="duas"><div class="campo"><label>CPF <span class="muted">(recomendado)</span></label><input placeholder="___.___.___-__" value="${esc(n.cpf)}" data-ao="mCpf" data-campo="pc.painel.f.cadNovo.cpf"></div>
      <div class="campo"><label>Convênio</label><select data-campo="pc.painel.f.cadNovo.conv" data-ao="reNP">${E.d.convenios.map(c => `<option value="${c.id}" ${c.id === n.conv ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></div></div>
      ${n.conv !== 'part' ? `<div class="duas"><div class="campo"><label>Nº da carteirinha</label><input value="${esc(n.cart)}" data-campo="pc.painel.f.cadNovo.cart"></div><div class="campo"><label>Validade</label><input placeholder="dd/mm/aaaa" value="${esc(n.valid)}" data-ao="mData" data-campo="pc.painel.f.cadNovo.valid"></div></div>` : ''}
      ${ehMenor(n.nasc) ? `<div class="campo"><label>Responsável <span class="obrig">*</span> <span class="muted">(menor de 18)</span></label><input value="${esc(n.resp)}" data-campo="pc.painel.f.cadNovo.resp"></div>` : ''}
      <div class="campo"><label>Como chegou? <span class="obrig">*</span></label><select data-campo="pc.painel.f.cadNovo.origem">${E.d.origens.map(x => `<option ${x === n.origem ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      ${n.erro ? `<div class="aviso-box erro">${n.erro}</div>` : ''}
      ${n.dup ? `<div class="aviso-box aviso">Já existe <b>${numNome(pac(n.dup))}</b>${situacaoPac(pac(n.dup))}, ${idade(pac(n.dup).nasc)} anos, ${ult4(pac(n.dup).cel)}. É a mesma pessoa?<br>
        <button class="btn btn-peq btn-pri" data-a="usarDup" style="margin-top:6px">Sim, usar nº ${pac(n.dup).numero}${pac(n.dup).excluido ? ' (restaura o cadastro)' : pac(n.dup).inativo ? ' (reativa)' : ''}</button> <button class="btn btn-peq" data-a="salvarCadNovo" data-forcar="1" style="margin-top:6px">Não, cadastrar outra pessoa</button></div>` : ''}
      <button class="btn btn-pri" data-a="salvarCadNovo">Cadastrar paciente</button> <button class="btn-link" data-a="cancelarCadNovo">Cancelar</button></div>`;
  } else if (p) {
    pacHTML = `<div class="chip-pac"><span class="res-num">nº ${p.numero}</span><span><b>${esc(p.nome)}</b> · ${idade(p.nasc)} anos<br><span class="mini muted">${conv(p.conv).nome} · ${ult4(p.cel)}</span></span>
      ${alertas(p.id).length ? `<span class="alerta-ico" title="Tem alerta">${ic('alerta', 15)}</span>` : ''}<button class="btn-link" style="margin-left:auto" data-a="trocarPacAg">Trocar</button></div>`;
  } else {
    pacHTML = `<input id="busca-ag" placeholder="Nome, CPF, telefone ou nº" autocomplete="off" value="${esc(f.busca)}" data-campo="pc.painel.f.busca" data-ao="buscaAg" style="width:100%;padding:9px 10px;border:1px solid var(--rule);border-radius:8px"><div id="res-ag" class="lista-res" style="border:0"></div>
      <div class="ajuda">Se não existir, aparece o botão “Paciente novo” — sem sair daqui.</div>`;
  }
  return `<aside class="painel"><div class="painel-cab"><h2>${f.remarcaDe ? 'Remarcar' : 'Novo agendamento'}</h2><button class="fechar" data-a="fecharPainel" aria-label="Fechar">${ic('x', 20)}</button></div>
  <div class="painel-corpo" data-scroll="painel-ag">
    <div class="campo"><label>Paciente <span class="obrig">*</span></label>${pacHTML}</div>
    <div class="campo"><label>Procedimento <span class="muted">(define a duração)</span></label><select data-campo="pc.painel.f.proc" data-ao="procAg"><option value="">— nenhum —</option>${E.d.procedimentos.filter(x => !x.recusado).map(x => `<option value="${x.id}" ${x.id === f.proc ? 'selected' : ''}>${x.nome} · ${x.dur} min${x.pendente ? ' · aguarda aprovação' : ''}</option>`).join('')}<option value="__novo" ${f.proc === '__novo' ? 'selected' : ''}>+ Outro procedimento (novo)…</option></select></div>
    ${f.proc === '__novo' ? `<div class="novo-proc"><div class="duas"><div class="campo"><label>Nome do procedimento <span class="obrig">*</span></label><input id="np-proc" value="${esc((f.novoProc || {}).nome || '')}" data-campo="pc.painel.f.novoProc.nome" placeholder="Ex.: Placa de bruxismo"></div>
      <div class="campo"><label>Duração do procedimento</label><select data-campo="pc.painel.f.novoProc.dur">${[10, 20, 30, 40, 60, 90, 120].map(d => `<option value="${d}" ${d == (f.novoProc || {}).dur ? 'selected' : ''}>${d} min</option>`).join('')}</select></div></div>
      <button class="btn btn-peq" data-a="criarProc">Usar este procedimento</button></div>` : ''}
    <div class="tres"><div class="campo"><label>Data</label><select data-campo="pc.painel.f.data" data-ao="dataAg">${opcoesDataAg(f.data, f.prof)}</select></div>
      <div class="campo"><label>Hora</label><select data-campo="pc.painel.f.horaTxt" data-ao="dataAg">${opcoesHoraAg(f, horariosDoDia(f.horaTxt))}</select></div>
      <div class="campo" ${f.proc === '__novo' ? 'hidden' : ''}><label>Duração</label><select data-campo="pc.painel.f.dur" data-ao="dataAg">${[10, 20, 30, 40, 60, 90, 120].map(m => `<option value="${m}" ${m == f.dur ? 'selected' : ''}>${m} min</option>`).join('')}</select></div></div>
    <div class="duas"><div class="campo"><label>Profissional</label><select data-campo="pc.painel.f.prof" data-ao="profAg">${E.d.profissionais.map(x => `<option value="${x.id}" ${x.id === f.prof ? 'selected' : ''}>${x.curto}</option>`).join('')}</select></div>
      <div class="campo"><label>Cadeira</label><select data-campo="pc.painel.f.cad" data-ao="dataAg">${E.d.cadeiras.map(x => `<option value="${x.id}" ${x.id === f.cad ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></div></div>
    ${f.retorno ? (r => r && r.quando ? `<div class="aviso-box info">A dentista pediu o retorno <b>${QUANDO_RETORNO[r.quando]}</b>. No protótipo só existe o dia de hoje: no sistema real a data já vem marcada.</div>` : '')(E.d.pedidosRetorno.find(x => x.id === f.retorno)) : ''}
    ${repetirHTML(f)}
    <div id="conflito-ag">${conflitoHTML(f)}</div>
    ${f.origemDoCadastro ? `<div class="campo"><label>Como chegou?</label><div class="muted">${esc(f.origem)} <span class="mini">(do cadastro)</span></div></div>` : `<div class="campo"><label>Como chegou? <span class="obrig">*</span></label><select data-campo="pc.painel.f.origem" data-ao="avaliarAg">${E.d.origens.map(x => `<option ${x === f.origem ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`}
    <div class="campo"><label>Tipo</label><select data-campo="pc.painel.f.tipo">${['Consulta', 'Retorno', 'Periódico', 'Outro'].map(x => `<option ${x === f.tipo ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <div class="campo"><label>Observação</label><textarea rows="2" data-campo="pc.painel.f.obs">${esc(f.obs)}</textarea></div>
  </div>
  <div class="painel-rodape"><button id="btn-agendar" class="btn btn-pri" style="width:100%;min-height:46px" data-a="salvarAg" ${s.falta ? 'disabled' : ''}>${s.label}</button>
    <div id="falta-ag" class="ajuda" style="text-align:center;margin-top:6px">${s.dica}</div></div></aside>`;
}

/* ---------- detalhe do agendamento ---------- */
A.abrirAg = ds => { E.ui.pc.painel = { tipo: 'det', id: ds.id }; render(); };
function painelDetalhe() {
  const pn = E.ui.pc.painel, a = E.d.agendamentos.find(x => x.id === pn.id);
  if (!a.pac) return `<aside class="painel"><div class="painel-cab"><h2>${esc(a.tipo)}</h2><button class="fechar" data-a="fecharPainel" aria-label="Fechar">${ic('x', 20)}</button></div>
    <div class="painel-corpo"><p>${hhmm(a.ini)}–${hhmm(a.ini + a.dur)} · ${esc(prof(a.prof).curto)}</p><p>${esc(a.obs || '')}</p></div></aside>`;
  const p = pac(a.pac), passou = E.d.agoraMin > a.ini;
  const b = (e, txt, cls = '') => `<button class="btn ${cls}" style="width:100%;margin-bottom:8px" data-a="estadoAg" data-id="${a.id}" data-e="${e}">${txt}</button>`;
  let acoes = '';
  if (a.estado === 'a_confirmar') acoes += b('confirmado', ic('check', 16) + ' Confirmar consulta');
  if (['a_confirmar', 'confirmado'].includes(a.estado)) acoes += b('chegou', ic('chegou', 16) + ' Presente na unidade', 'btn-ok');
  if (a.estado === 'chegou') acoes += b('em_atendimento', ic('play', 16) + ' Iniciar atendimento', 'btn-pri');
  if (a.estado === 'em_atendimento') acoes += b('atendido', ic('checks', 16) + ' Finalizar atendimento', 'btn-pri');
  if (['a_confirmar', 'confirmado'].includes(a.estado) && passou) acoes += b('faltou', ic('x', 16) + ' Faltou', 'btn-perigo');
  if (['a_confirmar', 'confirmado'].includes(a.estado)) acoes += `<button class="btn" style="width:100%;margin-bottom:8px" data-a="remarcar" data-id="${a.id}">${ic('remarcar', 16)} Remarcar</button>
    ${pn.desmarcando ? `<div class="campo"><label for="motivo">Motivo do cancelamento <span class="obrig">*</span></label><input id="motivo" class="${pn.erroMotivo ? 'com-erro' : ''}" value="${esc(pn.motivo || '')}" data-campo="pc.painel.motivo" data-ao="motivoDigitado" placeholder="Ex.: viagem, doente">${pn.erroMotivo ? '<em class="cel-erro">Escreva o motivo para cancelar.</em>' : ''}</div><button class="btn btn-perigo" data-a="confirmarDesmarcar" data-id="${a.id}">Cancelar consulta</button> <button class="btn-link" data-a="abrirAg" data-id="${a.id}">Voltar</button>`
      : `<button class="btn" style="width:100%;margin-bottom:8px" data-a="desmarcar">${ic('desmarcar', 16)} Cancelar consulta</button>`}`;
  if (!acoes) acoes = `<div class="muted">Nada a fazer neste estado.</div>`;
  return `<aside class="painel"><div class="painel-cab"><h2>${hhmm(a.ini)} · ${esc(prof(a.prof).curto)}</h2><button class="fechar" data-a="fecharPainel" aria-label="Fechar">${ic('x', 20)}</button></div>
  <div class="painel-corpo">
    <div class="chip-pac"><span class="res-num">nº ${p.numero}</span><span><b>${esc(p.nome)}</b> · ${idade(p.nasc)} anos<br><span class="mini muted">${conv(p.conv).nome} · ${ult4(p.cel)}</span></span></div>
    ${alertas(p.id).map(al => `<div class="aviso-box erro">${ic('alerta', 16)} ${esc(al.texto)}</div>`).join('')}
    <p style="margin:12px 0">${estadoHTML(a.estado)}${a.chegouAs ? ` <span class="mini muted">desde ${hhmm(a.chegouAs)}${a.estado === 'chegou' ? ` · aguardando ${tempo(minDesde(a.chegouAs))}` : ''}</span>` : ''}${a.motivo ? `<div class="motivo-falta">Motivo: ${esc(a.motivo)}</div>` : ''}</p>
    <table class="tab" style="margin-bottom:14px"><tr><td class="muted">Horário</td><td>${hhmm(a.ini)}–${hhmm(a.ini + a.dur)}</td></tr><tr><td class="muted">Cadeira</td><td>${cad(a.cad).nome}</td></tr>
      <tr><td class="muted">Procedimento</td><td>${a.proc ? proc(a.proc).nome : '—'}</td></tr><tr><td class="muted">Tipo</td><td>${esc(a.tipo)}</td></tr><tr><td class="muted">Como chegou</td><td>${esc(a.origem)}</td></tr></table>
    ${acoes}
    <button class="btn-link" data-a="abrirFicha" data-id="${p.id}">Abrir ficha do paciente →</button>
  </div></aside>`;
}
A.desmarcar = () => { E.ui.pc.painel.desmarcando = true; E.ui.foco = 'motivo'; render(); };
A.confirmarDesmarcar = ds => {
  const a = E.d.agendamentos.find(x => x.id === ds.id), motivo = (E.ui.pc.painel.motivo || '').trim();
  // o motivo do cancelamento é obrigatório (R5): sem ele não dá para saber depois por que a agenda furou
  if (!motivo) { E.ui.pc.painel.erroMotivo = true; E.ui.foco = 'motivo'; render(); return; }
  comDesfazer(`Consulta cancelada: ${esc(pac(a.pac).nome)}.`, () => { a.estado = 'desmarcou'; a.motivo = motivo; E.ui.pc.painel = null; });
};
A.remarcar = ds => { const a = E.d.agendamentos.find(x => x.id === ds.id);
  abrirNovoAg({ pac: a.pac, proc: a.proc, prof: a.prof, cad: a.cad, dur: a.dur, ini: a.ini, tipo: a.tipo, origem: a.origem, remarcaDe: a.id }); };
/* o agendamento já vem com o procedimento, a duração e o "quando" que a dentista pediu */
A.agendarRetorno = ds => { const r = E.d.pedidosRetorno.find(x => x.id === ds.id);
  const it = (r.itens || []).map(id => plano(r.pac).find(i => i.id === id)).filter(Boolean), pr = it[0] && proc(it[0].proc);
  abrirNovoAg({ pac: r.pac, prof: r.prof, tipo: 'Retorno', origem: 'Continuação de tratamento', retorno: r.id, proc: pr ? pr.id : '', dur: pr ? pr.dur : 30,
    obs: [`Retorno pedido por ${prof(r.prof).curto}`, resumoRetorno(r), r.obs].filter(Boolean).join(' · ') }); };

/* ---------- PACIENTES ---------- */
function linhasPacs(t) {
  const aba = E.ui.pc.abaPacs || 'ativos';
  if (aba === 'excluidos') return E.d.pacientes.filter(p => p.excluido).map(p => `<tr><td><b>${numNome(p)}</b></td><td colspan="3" class="muted">excluído em ${dataBR(p.excluido.data)} por ${esc(usu(p.excluido.por).nome)} · some de vez em ${dataBR(somaDias(p.excluido.data, 30))}</td>
    <td class="dir">${pode('cadastro') ? `<button class="btn btn-peq" data-a="restaurarPac" data-id="${p.id}">Restaurar</button>` : ''}</td></tr>`).join('')
    || '<tr><td colspan="5" class="vazio">Nenhum cadastro excluído. Cadastros excluídos ficam aqui 30 dias e podem ser restaurados.</td></tr>';
  const daAba = p => !p.excluido && (aba === 'inativos' ? !!p.inativo : !p.inativo);
  const lista = t && t.trim().length >= 2 ? buscarPacientes(t).filter(daAba) : E.d.pacientes.filter(daAba).sort((a, b) => b.numero - a.numero);
  return lista.map(p => { const prox = proximaConsulta(p.id);
    return `<tr class="clic" data-a="abrirFicha" data-id="${p.id}"><td><span class="td-pac">${avPac(p)}<span><b>${esc(p.nome)}</b>${alertas(p.id).length ? ` <span class="alerta-ico">${ic('alerta', 15)}</span>` : ''}<small>nº ${p.numero}</small></span></span>${p.inativo ? ` <span class="tag inativo">inativo · ${esc(p.inativo.motivo.toLowerCase())}</span>` : ''}</td>
    <td>${idade(p.nasc)}</td><td class="num">${esc(p.cel)}</td><td>${conv(p.conv).nome}</td><td>${prox ? 'hoje ' + hhmm(prox.ini) : '—'}</td></tr>`; }).join('')
    || `<tr><td colspan="5" class="vazio">Ninguém com “${esc(t)}”. <button class="btn-link" data-a="novoPaciente" data-nome="${esc(t)}">+ Cadastrar</button></td></tr>`;
}
function telaPacientes() {
  const n = k => E.d.pacientes.filter(p => k === 'excluidos' ? p.excluido : !p.excluido && (k === 'inativos' ? p.inativo : !p.inativo)).length, aba = E.ui.pc.abaPacs || 'ativos';
  const bot = (k, t) => `<button class="${aba === k ? 'ativo' : ''}" data-a="abaPacs" data-v="${k}">${t} <span class="mini">${n(k)}</span></button>`;
  return `<div class="titulo-tela"><h1>Pacientes</h1><span class="seg">${bot('ativos', 'Ativos')}${bot('inativos', 'Inativos')}${bot('excluidos', 'Excluídos')}</span><span class="titulo-acoes">${pode('cadastro') ? botaoExcel('exportPacientes') : ''}<button class="btn btn-pri" data-a="novoPaciente">${ic('mais', 16)} Novo paciente</button></span></div>
  <label class="campo-busca">${ic('busca', 18)}<input id="busca-pacs" placeholder="Buscar por nome, CPF, telefone ou nº" value="${esc(E.ui.pc.buscaPac)}" data-campo="pc.buscaPac" data-ao="filtraPacs"></label>
  <table class="tab"><thead><tr><th>Paciente</th><th>Idade</th><th>Celular</th><th>Convênio</th><th>Próxima consulta</th></tr></thead><tbody id="tab-pacs">${linhasPacs(E.ui.pc.buscaPac)}</tbody></table>`;
}
A.abaPacs = ds => { E.ui.pc.abaPacs = ds.v; render(); };
A.restaurarPac = ds => { const p = pac(ds.id); comDesfazer(`Cadastro restaurado: ${numNome(p)}.`, () => { delete p.excluido; }); };
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
A.filtraPacs = (ds, el) => { document.getElementById('tab-pacs').innerHTML = linhasPacs(el.value); };
A.novoPaciente = ds => {
  E.ui.pc.tela = 'novoPac'; E.ui.pc.painel = null;
  E.ui.pc.novoPac = { nome: ds.nome && isNaN(ds.nome) ? ds.nome : '', cel: '', nasc: '', cpf: '', conv: 'part', cart: '', valid: '', origem: E.ui.ultimaOrigem, resp: '', mais: false, erro: '', dup: null, ok: null };
  E.ui.foco = 'np-nome'; render();
};
function telaNovoPac() {
  const n = E.ui.pc.novoPac;
  if (n.ok) { const p = pac(n.ok); return `<div class="titulo-tela"><h1>Paciente cadastrado</h1></div>
    <div class="cartao" style="max-width:560px"><div class="aviso-box ok">${ic('check', 16)} <b>${numNome(p)}</b> foi cadastrado.</div>
    <button class="btn btn-pri" data-a="novoAg" data-pac="${p.id}">Agendar agora</button> <button class="btn" data-a="abrirFicha" data-id="${p.id}">Abrir ficha</button></div>`; }
  const menor = ehMenor(n.nasc);
  return `<div class="titulo-tela"><h1>Novo paciente</h1></div>
  <div class="cartao" style="max-width:640px">
    <button class="np-foto" data-a="fotoNovoPac">${avatarPac(n.foto, n.nome, '', 72)}<span class="muted">${n.foto ? 'Trocar a foto' : 'Tirar foto'}</span></button>
    <div class="campo"><label>Nome completo <span class="obrig">*</span></label><input id="np-nome" class="${campoErro(n) === 'nome' ? 'com-erro' : ''}" value="${esc(n.nome)}" data-campo="pc.novoPac.nome">${campoErro(n) === 'nome' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div>
    <div class="duas"><div class="campo"><label>Celular <span class="obrig">*</span></label><input id="np-cel" class="${campoErro(n) === 'cel' ? 'com-erro' : ''}" placeholder="(81) 9____-____" value="${esc(n.cel)}" data-ao="mCel" data-campo="pc.novoPac.cel">${campoErro(n) === 'cel' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div>
      <div class="campo"><label>Data de nascimento <span class="obrig">*</span> <span id="np-idade" class="muted">${idadeTxt(n.nasc)}</span></label><input id="np-nasc" class="${campoErro(n) === 'nasc' ? 'com-erro' : ''}" placeholder="dd/mm/aaaa" value="${esc(n.nasc)}" data-ao="mDataNP" data-idade="np-idade" data-campo="pc.novoPac.nasc">${campoErro(n) === 'nasc' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div></div>
    <div class="duas"><div class="campo"><label>CPF</label><input placeholder="___.___.___-__" value="${esc(n.cpf)}" data-ao="mCpf" data-campo="pc.novoPac.cpf"></div>
      <div class="campo"><label>Convênio</label><select data-campo="pc.novoPac.conv" data-ao="reNP">${E.d.convenios.map(c => `<option value="${c.id}" ${c.id === n.conv ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></div></div>
    ${n.conv !== 'part' ? `<div class="duas"><div class="campo"><label>Nº da carteirinha</label><input value="${esc(n.cart)}" data-campo="pc.novoPac.cart"></div><div class="campo"><label>Validade</label><input placeholder="dd/mm/aaaa" value="${esc(n.valid)}" data-ao="mData" data-campo="pc.novoPac.valid"></div></div>` : ''}
    ${menor ? `<div class="campo"><label>Responsável <span class="obrig">*</span> <span class="muted">(menor de 18)</span></label><input value="${esc(n.resp)}" data-campo="pc.novoPac.resp"></div>` : ''}
    <div class="campo"><label>Como chegou? <span class="obrig">*</span></label><select data-campo="pc.novoPac.origem">${E.d.origens.map(x => `<option ${x === n.origem ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <button class="btn-link" data-a="maisDados">${ic(n.mais || campoErro(n) === 'email' ? 'baixo' : 'dir', 15)} Mais dados</button>
    ${n.mais || campoErro(n) === 'email' ? `<div class="campo"><label for="np-email">E-mail</label><input id="np-email" class="${campoErro(n) === 'email' ? 'com-erro' : ''}" type="email" inputmode="email" autocomplete="off" placeholder="nome@gmail.com" value="${esc(n.email || '')}" data-campo="pc.novoPac.email">${campoErro(n) === 'email' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div>` : ''}${n.mais ? `<div class="campo" style="margin-top:8px"><label>Nº no Dental Office <span class="muted">(se veio de Prazeres ou Norte)</span></label><input value="${esc(n.numDO || '')}" data-campo="pc.novoPac.numDO" inputmode="numeric"></div><div class="duas"><div class="campo"><label>CEP</label><input value="${esc(n.cep || '')}" data-campo="pc.novoPac.cep" ></div><div class="campo"><label>Endereço</label><input value="${esc(n.end || '')}" data-campo="pc.novoPac.end" ></div><div class="campo"><label>RG</label><input value="${esc(n.rg || '')}" data-campo="pc.novoPac.rg" ></div><div class="campo"><label>Nº do CNS</label><input value="${esc(n.cns || '')}" data-campo="pc.novoPac.cns" ></div></div><div class="campo"><label>Observações</label><textarea rows="2" data-campo="pc.novoPac.obs">${esc(n.obs || '')}</textarea></div>` : ''}
    ${n.dup ? `<div class="aviso-box aviso">Já existe <b>${numNome(pac(n.dup))}</b>${situacaoPac(pac(n.dup))}, ${idade(pac(n.dup).nasc)} anos, ${ult4(pac(n.dup).cel)}. É a mesma pessoa?<br>
      <button class="btn btn-peq btn-pri" data-a="${pac(n.dup).excluido || pac(n.dup).inativo ? 'restaurarEAbrir' : 'abrirFicha'}" data-id="${n.dup}" style="margin-top:6px">${pac(n.dup).excluido ? 'Sim, restaurar e abrir' : pac(n.dup).inativo ? 'Sim, reativar e abrir' : 'Sim, abrir'} nº ${pac(n.dup).numero}</button> <button class="btn btn-peq" data-a="salvarNP" data-forcar="1" style="margin-top:6px">Não, cadastrar outra pessoa</button></div>` : ''}
    ${n.erro && !['nome', 'cel', 'nasc', 'email'].includes(campoErro(n)) ? `<div class="aviso-box erro">${n.erro}</div>` : ''}
    <div class="rodape-dir" style="margin-top:12px"><button class="btn btn-pri" data-a="salvarNP">Cadastrar paciente</button></div>
  </div>`;
}
A.mDataNP = (ds, el) => mDataComMenor(ds, el, 'np-nasc');
A.reNP = () => render();
A.maisDados = () => { E.ui.pc.novoPac.mais = !E.ui.pc.novoPac.mais; render(); };
/* em qual campo está o erro, para mostrar embaixo dele */
// e-mail primeiro: o exemplo "nome@gmail.com" do aviso contém "nome"
const campoErro = n => !n.erro ? '' : /e-mail/i.test(n.erro) ? 'email' : /nome/i.test(n.erro) ? 'nome' : /celular/i.test(n.erro) ? 'cel' : /nascimento|data/i.test(n.erro) ? 'nasc' : /respons/i.test(n.erro) ? 'resp' : '';
A.salvarNP = ds => {
  const n = E.ui.pc.novoPac; n.erro = validarNovo(n);
  if (!n.erro && ehMenor(n.nasc) && !n.resp.trim()) n.erro = 'Menor de 18: informe o responsável.';
  if (n.erro) { E.ui.foco = { nome: 'np-nome', cel: 'np-cel', nasc: 'np-nasc', email: 'np-email' }[campoErro(n)] || null; render(); return; }
  const dup = acharDuplicado(n); if (dup && !ds.forcar) { n.dup = dup.id; render(); return; }
  const p = criarPaciente(n); if (n.resp) p.responsavel = n.resp;
  Object.assign(p, { cep: n.cep, end: n.end, rg: n.rg, cns: n.cns, obs: n.obs, numeroDentalOffice: n.numDO });
  n.ok = p.id; E.ui.ultimaOrigem = n.origem; render();
};

/* ---------- FICHA ---------- */
function telaFicha() {
  const pc = E.ui.pc, p = pac(pc.fichaId), u = usuPC(), al = alertas(p.id);
  const abas = [['resumo', 'Resumo'], ['anamnese', 'Anamnese'], ['odonto', 'Odontograma e Plano'], ['evolucao', 'Evolução'], ['arquivos', 'Arquivos']];
  if (pode('finPac')) abas.push(['financeiro', 'Financeiro']);
  abas.push(['dados', 'Dados']);
  const travada = id => !pode('clinico') && id === 'anamnese';
  const faixa = al.length || pc.novoAlerta != null
    ? `<div class="faixa-alerta">${al.map(x => `<span class="al ${x.nivel}">${ic('alerta', 16)} ${esc(x.texto)}</span>`).join('')}
        ${pc.novoAlerta != null ? `<input id="novo-alerta" data-campo="pc.novoAlerta" value="${esc(pc.novoAlerta)}" placeholder="Ex.: Alergia a látex" style="padding:5px 8px;border-radius:6px;border:0;min-width:240px"><button data-a="salvarAlerta">Salvar alerta</button><button data-a="cancelarAlerta">Cancelar</button>`
          : pode('alerta') ? '<button data-a="novoAlerta" style="margin-left:auto">+ Alerta</button>' : ''}</div>`
    : `<div class="sem-alerta">${ic('check', 15)} Sem alertas ${pode('alerta') ? '<button class="btn btn-peq" data-a="novoAlerta">+ Alerta</button>' : ''}</div>`;
  return `<div class="ficha-cab" style="${al.length || pc.novoAlerta != null ? 'border-radius:12px 12px 0 0' : ''}"><div style="display:flex;align-items:center;gap:14px">
    ${avatarPac(p.foto, p.nome, 'fotoPac', 56, p.id)}<div><div class="nome">${numNome(p)}</div><div class="muted">${idade(p.nasc)} anos · ${esc(p.cel)} · ${conv(p.conv).nome}${p.responsavel ? ' · resp.: ' + esc(p.responsavel) : ''}</div></div>
    <div class="acoes" style="margin-left:auto">${p.excluido ? '' : `${pode('caixa') && pc.aba !== 'financeiro' ? `<button class="btn-link" data-a="abrirReceber" data-pac="${p.id}">${ic('caixa', 16)} Receber</button>` : ''}<button class="btn-link" data-a="abrirDoc">${ic('arquivo', 16)} Documento</button><button class="btn btn-sec" data-a="novoAg" data-pac="${p.id}">${ic('agenda', 16)} ${p.inativo ? 'Reativar e agendar' : 'Agendar'}</button>`}</div></div></div>
  ${p.excluido ? `<div class="faixa-inativo excluido">${ic('x', 16)} Cadastro <b>excluído</b> em ${dataBR(p.excluido.data)} — some de vez em ${dataBR(somaDias(p.excluido.data, 30))}. Só para ver.${pode('cadastro') ? ` <button class="btn btn-peq" data-a="restaurarPac" data-id="${p.id}">Restaurar</button>` : ''}</div>` : ''}
  ${p.inativo ? `<div class="faixa-inativo">${ic('cadeado', 16)} Paciente <b>inativo</b> desde ${dataBR(p.inativo.data)} · ${esc(p.inativo.motivo)}${pode('cadastro') ? ' <button class="btn btn-peq" data-a="reativarPac">Reativar</button>' : ''}</div>` : ''}
  ${faixa}
  <div class="abas">${abas.map(([id, n]) => `<button class="aba ${pc.aba === id ? 'ativo' : ''}" data-a="aba" data-id="${id}">${n}${travada(id) ? ` <span class="cadeado">${ic('cadeado', 13)}</span>` : ''}</button>`).join('')}</div>
  ${p.excluido ? '<fieldset class="so-ver" disabled>' : ''}${({ resumo: abaResumo, anamnese: abaAnamnese, odonto: abaOdonto, evolucao: abaEvolucao, arquivos: abaArquivos, financeiro: abaFinanceiro, dados: abaDados })[pc.aba](p)}${p.excluido ? '</fieldset>' : ''}`;
}
A.aba = ds => { const pc = E.ui.pc; pc.aba = ds.id; pc.anamForm = null; pc.evoForm = null; render(); };
A.novoAlerta = () => { E.ui.pc.novoAlerta = ''; E.ui.foco = 'novo-alerta'; render(); };
A.cancelarAlerta = () => { E.ui.pc.novoAlerta = null; render(); };
A.salvarAlerta = () => { const t = (E.ui.pc.novoAlerta || '').trim(); if (!t) return;
  comDesfazer('Alerta adicionado.', () => { alertas(E.ui.pc.fichaId).push({ id: uid(), texto: t.toUpperCase(), nivel: 'grave' }); E.ui.pc.novoAlerta = null; }); };

function abaResumo(p) {
  const prox = proximaConsulta(p.id), pl = plano(p.id).filter(i => i.estado !== 'recusado');
  const feitos = pl.filter(i => i.estado === 'realizado').length;
  const evs = (E.d.evolucoes[p.id] || []), ult = evs[evs.length - 1];
  const saldo = parcelasAbertas(p.id).reduce((s, x) => s + saldoParcela(x), 0);
  const an = (E.d.anamneses[p.id] || []).slice(-1)[0];
  return `<div class="resumo-lista">
    <button class="resumo-linha" ${prox ? `data-a="abrirAg" data-id="${prox.id}"` : `data-a="novoAg" data-pac="${p.id}"`}><span class="rl-tit">Próxima consulta</span><span class="rl-val">${prox ? `<b>hoje ${hhmm(prox.ini)}</b> · ${esc(prof(prox.prof).curto)} ${estadoHTML(prox.estado)}` : '<span class="muted">Nenhuma agendada · tocar para agendar</span>'}</span>${ic('dir', 16)}</button>
    <button class="resumo-linha" data-a="aba" data-id="odonto"><span class="rl-tit">Plano de tratamento</span><span class="rl-val">${pl.length ? `<b>${feitos} de ${pl.length}</b> feitos${(n => n ? ` · <b>${n}</b> ${n === 1 ? 'espera' : 'esperam'} orçamento` : '')(pl.filter(i => i.estado === 'indicado').length)}${orcSemAssinatura(p.id).length ? ` · <span class="res-ruim">${ic('alerta', 14)} orçamento sem assinatura</span>` : ''}<div class="prog"><i style="width:${pl.length ? feitos / pl.length * 100 : 0}%"></i></div>` : '<span class="muted">Sem plano.</span>'}</span>${ic('dir', 16)}</button>
    <button class="resumo-linha" data-a="aba" data-id="evolucao"><span class="rl-tit">${pode('clinico') ? 'Última evolução' : 'Última consulta'}</span><span class="rl-val">${ult ? `<b>${dataBR(ult.data)}</b> · ${esc(prof(ult.por).curto)}${pode('clinico') ? '<br>' + esc(ult.texto) : ''}` : '<span class="muted">Nenhuma.</span>'}</span>${ic('dir', 16)}</button>
    <button class="resumo-linha" data-a="aba" data-id="financeiro" ${pode('finPac') ? '' : 'disabled'}><span class="rl-tit">Financeiro</span><span class="rl-val">${pode('finPac') ? (saldo ? `Em aberto: <b>${brl(saldo)}</b>` : '<span class="muted">Nada em aberto.</span>') + (p.credito ? `<br>Crédito: <b>${brl(p.credito)}</b>` : '') : '<span class="muted">—</span>'}</span>${ic('dir', 16)}</button>
    <button class="resumo-linha" data-a="aba" data-id="anamnese"><span class="rl-tit">Anamnese</span><span class="rl-val">${an ? `Última: <b>${dataBR(an.data)}</b> (${E.d.modelos.find(m => m.id === an.modelo).nome}) · ${an.assinada ? `<span style="color:var(--ok)">${ic('assinar', 14)} assinada</span>` : '<span class="muted">sem assinatura</span>'}` : '<span class="muted">Nenhuma ficha preenchida.</span>'}</span>${ic('dir', 16)}</button>
    <button class="resumo-linha" data-a="aba" data-id="arquivos"><span class="rl-tit">Arquivos</span><span class="rl-val">${(E.d.arquivos[p.id] || []).length ? `<b>${(E.d.arquivos[p.id] || []).length}</b> · último: ${esc(E.d.arquivos[p.id].slice(-1)[0].tipo)} de ${dataBR(E.d.arquivos[p.id].slice(-1)[0].data)}` : '<span class="muted">Nenhum.</span>'}${semAssinatura(p.id) ? `<br><b class="res-ruim">${semAssinatura(p.id)} comprovante(s) sem assinatura</b>` : ''}</span>${ic('dir', 16)}</button>
  </div>`;
}

/* anamnese */
const textoAlertaAnam = (q, r) => (q.texto.replace('?', '').replace('Possui alguma ', '').replace('Faz uso de algum ', '') + (r.texto ? ': ' + r.texto : '')).toUpperCase();
function abaAnamnese(p) {
  if (!pode('clinico')) return `<div class="travado">${ic('cadeado', 22)}<br>A anamnese é conteúdo clínico: só as dentistas veem.<br><span class="mini">Os alertas importantes aparecem para todos, na faixa vermelha acima.</span></div>`;
  const f = E.ui.pc.anamForm;
  if (f && !f.modelo) return `<div class="cartao"><h3>Qual ficha?</h3>${E.d.modelos.map(m => `<button class="btn" style="margin-right:8px" data-a="anamModelo" data-id="${m.id}">${m.nome}</button>`).join('')} <button class="btn-link" data-a="aba" data-id="anamnese">Cancelar</button></div>`;
  if (f) {
    const m = E.d.modelos.find(x => x.id === f.modelo);
    return `<div class="cartao"><h3>${m.nome}</h3>${m.perguntas.map(q => {
      const r = f.resp[q.id] || {};
      return `<div class="pergunta"><b>${q.texto}</b>${q.alerta ? ' <span class="mini muted">· gera alerta se SIM</span>' : ''}<br>
        ${q.tipo === 'snt' ? `<span class="sn"><button class="${r.sim === true ? 'on-sim' : ''}" data-a="respSN" data-q="${q.id}" data-v="1">Sim</button><button class="${r.sim === false ? 'on-nao' : ''}" data-a="respSN" data-q="${q.id}" data-v="0">Não</button></span>` : ''}
        ${(q.tipo === 't' || r.sim) ? `<input style="display:block;width:100%;margin-top:6px;padding:8px;border:1px solid var(--rule);border-radius:8px" placeholder="${q.tipo === 't' ? '' : 'Qual?'}" value="${esc(r.texto || '')}" data-ao="garanteResp" data-q="${q.id}">` : ''}
        ${q.alerta && r.sim ? `<div class="aviso-box erro" style="margin-top:6px">Isso vai criar um alerta na ficha: <b>${esc(textoAlertaAnam(q, r))}</b></div>` : ''}
      </div>`; }).join('')}
      <div class="rodape-dir" style="margin-top:12px"><button class="btn" data-a="aba" data-id="anamnese">Cancelar</button><button class="btn btn-pri" data-a="salvarAnam">Salvar ficha</button></div></div>`;
  }
  const lista = (E.d.anamneses[p.id] || []).slice().reverse();
  return `${pode('anamnese') ? '' : `<p class="nota-leve">${ic('cadeado', 14)} Só as dentistas preenchem a anamnese.</p>`}${pode('anamnese') ? '<button class="btn btn-pri" data-a="anamNova" style="margin-bottom:12px">+ Preencher ficha</button>' : ''}
    ${lista.map(an => { const m = E.d.modelos.find(x => x.id === an.modelo); return `<div class="cartao" style="margin-bottom:10px"><h3>${m.nome} · ${dataBR(an.data)} · ${esc(prof(an.por) ? prof(an.por).curto : '—')} · ${an.assinada ? `<span style="color:var(--ok)">${ic('assinar', 14)} assinada</span>` : 'sem assinatura'}</h3>
      ${m.perguntas.map(q => { const r = an.respostas[q.id] || {}; return `<div class="anam-resp">${q.texto} <b>${r.sim === true ? 'Sim' : r.sim === false ? 'Não' : ''}${r.texto ? ' — ' + esc(r.texto) : ''}</b></div>`; }).join('')}</div>`; }).join('') || '<div class="vazio">Nenhuma ficha preenchida.</div>'}`;
}
A.anamNova = () => { E.ui.pc.anamForm = { modelo: null, resp: {} }; render(); };
A.anamModelo = ds => { E.ui.pc.anamForm.modelo = ds.id; render(); };
A.respSN = ds => { const f = E.ui.pc.anamForm; f.resp[ds.q] = { ...(f.resp[ds.q] || {}), sim: ds.v === '1' }; render(); };
A.garanteResp = (ds, el) => { const f = E.ui.pc.anamForm; f.resp[ds.q] = { ...(f.resp[ds.q] || {}), texto: el.value }; };
A.salvarAnam = () => {
  const f = E.ui.pc.anamForm, m = E.d.modelos.find(x => x.id === f.modelo), pid = E.ui.pc.fichaId, u = usuPC();
  if (!pode('anamnese')) return;
  comDesfazer('Ficha salva.', () => {
    (E.d.anamneses[pid] = E.d.anamneses[pid] || []).push({ id: uid(), modelo: f.modelo, data: E.d.hoje, por: u.prof, respostas: JSON.parse(JSON.stringify(f.resp)) });
    m.perguntas.forEach(q => { const r = f.resp[q.id]; if (q.alerta && r && r.sim)
      addAlerta(pid, textoAlertaAnam(q, r)); });
    E.ui.pc.anamForm = null;
  });
};

/* odontograma e plano: ver odonto.js */
function itemPlano(i, op) {
  const quem = i.feitoPor ? (i.feitoPor !== i.indicadoPor ? `indicado por ${prof(i.indicadoPor).curto} · <b>feito por ${prof(i.feitoPor).curto}</b> em ${dataBR(i.dataFeito)}` : `indicado e feito por ${prof(i.feitoPor).curto} · ${dataBR(i.dataFeito)}`)
    : `indicado por ${prof(i.indicadoPor).curto} em ${dataBR(i.dataInd)}${i.dataApr ? ` · aprovado em ${dataBR(i.dataApr)}` : ''}`;
  return `<div class="item-plano pl-linha${op === 'semPil' ? ' sem-pil' : ''}">${op === 'semPil' ? '' : pilulaPlano(i.estado)}
    <span><b>${esc(nomeItem(i))}</b><br><span class="quem">${quem}</span></span><span class="valor num">${brl(valorItem(i, E.ui.pc.fichaId))}</span>
    <span class="pl-acao">${i.estado === 'indicado' && pode('recusar') ? `<button class="btn-link" data-a="recusarItem" data-id="${i.id}">Paciente não quis</button>` : ''}</span></div>`;
}
A.dente = ds => { const pc = E.ui.pc; if (pc.dente === ds.n) { pc.dente = null; } else { pc.dente = ds.n; pc.denteFaces = []; pc.denteProc = null; } render(); };
A.face = ds => { const f = E.ui.pc.denteFaces, i = f.indexOf(ds.f); i >= 0 ? f.splice(i, 1) : f.push(ds.f); render(); };
A.denteProc = ds => { E.ui.pc.denteProc = ds.p; render(); };
A.existente = ds => { const pid = E.ui.pc.fichaId; E.d.existentes[pid] = E.d.existentes[pid] || {};
  if (ds.c) E.d.existentes[pid][E.ui.pc.dente] = ds.c; else delete E.d.existentes[pid][E.ui.pc.dente]; render(); };
function novoItem(pid, procId, dente, faces, por = usuPC().prof) {
  const pr = proc(procId);
  plano(pid).push({ id: uid(), proc: procId, dente, faces: [...faces], valor: precoDe(pr, pid, faces.length), estado: 'indicado', indicadoPor: por, dataInd: E.d.hoje });
}
A.addItemDente = () => { const pc = E.ui.pc;
  comDesfazer('Procedimento indicado.', () => { novoItem(pc.fichaId, pc.denteProc, pc.dente, pc.denteFaces); pc.denteProc = null; pc.denteFaces = []; }); };
A.addItemGeral = () => { const v = document.getElementById('sel-geral').value;
  comDesfazer('Procedimento indicado.', () => novoItem(E.ui.pc.fichaId, v, null, [])); };
A.recusarItem = ds => { const i = plano(E.ui.pc.fichaId).find(x => x.id === ds.id);
  comDesfazer('Marcado: paciente não quis.', () => { i.estado = 'recusado'; }); };

/* orçamento */
A.abrirOrc = () => { const pid = E.ui.pc.fichaId, pl = plano(pid).filter(i => i.estado === 'indicado');
  pl.forEach(i => { i.valor = precoDe(proc(i.proc), pid, i.faces.length); }); // tabela mudou depois de indicar? vale a de hoje
  E.ui.pc.modal = { tipo: 'orc', sel: Object.fromEntries(pl.map(i => [i.id, true])), desc: '', forma: 'vista', n: 3, primeiro: 'hoje' }; render(); };
/* aceita "50", "50,00", "50.00", "1.234,56" e "1234.5" */
const lerReais = t => { let s = String(t || '').trim().replace(/[^\d.,]/g, ''); if (!s) return 0; let int = s, dec = '';
  if (s.includes(',')) { const i = s.lastIndexOf(','); int = s.slice(0, i).replace(/\./g, ''); dec = s.slice(i + 1); }
  else { const i = s.lastIndexOf('.'); if (i >= 0 && s.length - i - 1 <= 2) { int = s.slice(0, i).replace(/\./g, ''); dec = s.slice(i + 1); } else int = s.replace(/\./g, ''); }
  return Number(int || 0) * 100 + Number((dec + '00').slice(0, 2)); };
function contaOrc(m) {
  const pl = plano(E.ui.pc.fichaId).filter(i => i.estado === 'indicado');
  const bruto = pl.filter(i => m.sel[i.id]).reduce((s, i) => s + i.valor, 0);
  const total = Math.max(0, bruto - lerReais(m.desc)); const n = m.forma === 'vista' ? 1 : Number(m.n);
  return { pl, bruto, total, n, parcela: Math.floor(total / n / 100) * 100, carteira: m.forma === 'parc' && m.como === 'carteira' };
}
function modalOrc() {
  const m = E.ui.pc.modal, c = contaOrc(m), p = pac(E.ui.pc.fichaId);
  return `<div class="modal"><div class="painel-cab"><h2>Orçamento · ${numNome(p)}</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="mini muted" style="margin-bottom:6px">Desmarque o que o paciente não quer agora.</div>
    ${(ps => ps.length === 1 ? `<div class="mini muted" style="margin-bottom:4px">Indicado por ${esc(prof(ps[0]).curto)}</div>` : '')([...new Set(c.pl.map(i => i.indicadoPor))])}
    ${c.pl.map(i => `<label class="item-plano" style="cursor:pointer"><input type="checkbox" ${m.sel[i.id] ? 'checked' : ''} data-a="orcSel" data-id="${i.id}" style="width:20px;height:20px"><span><b>${esc(nomeItem(i))}</b>${new Set(c.pl.map(x => x.indicadoPor)).size > 1 ? `<br><span class="quem">indicado por ${prof(i.indicadoPor).curto}</span>` : ''}</span><span class="valor num">${brl(i.valor)}</span></label>`).join('')}
    <div class="campo" style="margin-top:12px"><label>Forma</label><span class="seg"><button class="${m.forma === 'vista' ? 'ativo' : ''}" data-a="orcForma" data-v="vista">À vista</button><button class="${m.forma === 'parc' ? 'ativo' : ''}" data-a="orcForma" data-v="parc">Parcelado</button></span>
      ${m.forma === 'parc' ? ` em <select data-campo="pc.modal.n" data-ao="orcRe" style="width:auto;display:inline-block;padding:6px 8px">${(m.como === 'carteira' ? PARCELAS_CARTEIRA : PARCELAS_OPCOES).map(n => `<option ${n == m.n ? 'selected' : ''}>${n}</option>`).join('')}</select> vezes` : ''}</div>
    ${m.forma === 'parc' ? `<div class="campo"><label>Quem financia</label><span class="seg"><button class="${m.como !== 'carteira' ? 'ativo' : ''}" data-a="orcComo" data-v="cartao">Cartão de crédito (maquininha)</button><button class="${m.como === 'carteira' ? 'ativo' : ''}" data-a="orcComo" data-v="carteira">Carteira (a clínica)</button></span></div>` : ''}
    <div class="duas"><div class="campo"><label>Desconto (R$)</label><input id="orc-desc" data-selecionar inputmode="decimal" value="${esc(m.desc)}" placeholder="0,00" data-campo="pc.modal.desc" data-ao="orcRecalc"></div>
      ${m.forma === 'parc' ? `<div class="campo"><label>1ª parcela vence</label><select data-campo="pc.modal.primeiro" data-ao="orcRe"><option value="hoje" ${m.primeiro === 'hoje' ? 'selected' : ''}>Hoje (29/10)</option><option value="30" ${m.primeiro === '30' ? 'selected' : ''}>Em 30 dias (29/11)</option></select></div>` : '<div></div>'}</div>
    <div id="orc-tot" class="orc-tot">${orcResumo(c)}</div>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="imprimirOrc" ${orcOk(c) ? '' : 'disabled'}>Imprimir para o paciente</button><button id="btn-orc" class="btn btn-pri" style="min-height:46px" data-a="aprovarOrc" ${orcOk(c) ? '' : 'disabled'}>${rotuloOrc(c)}</button></div></div>`;
}
const orcResumo = c => { const ult = c.total - c.parcela * (c.n - 1);
  const parc = c.n > 1 ? (ult === c.parcela ? ` · ${c.n}x de <b>${brl(c.parcela)}</b>` : ` · ${c.n - 1}x de <b>${brl(c.parcela)}</b> + 1x de <b>${brl(ult)}</b>`) : ' · à vista';
  // parcela mínima respondida pelo dono (blueprint/11-pendientes.md 12b): abaixo dela não dá para aprovar
  const pequena = !foraRegra(c) ? '' : c.carteira
    ? `<div class="aviso-box aviso" style="margin-top:8px">${c.n > 3 ? `São <b>${c.n} parcelas</b>` : `Cada parcela ficaria em <b>${brl(c.parcela)}</b>`}: a regra é até 3x de ${brl(PARCELA_MIN)} ou mais. Na carteira pode, mas diga o porquê.
        <input id="orc-motivo" placeholder="Por que fora da regra?" value="${esc(E.ui.pc.modal.motivoRegra || '')}" data-campo="pc.modal.motivoRegra" data-ao="orcRecalcMotivo" class="orc-motivo"></div>`
    : `<div class="aviso-box erro" style="margin-top:8px">Cada parcela ficaria em <b>${brl(c.parcela)}</b>. A parcela mínima é ${brl(PARCELA_MIN)}: diminua as vezes ou faça à vista.</div>`;
  return `Total do orçamento: <b>${brl(c.total)}</b>${c.bruto !== c.total ? ` <span class="mini">(de ${brl(c.bruto)})</span>` : ''}${parc}${pequena}`; };
/* resposta da família (02/11): até 3x, parcela mínima de R$ 200,00 */
const PARCELA_MIN = 20000, PARCELAS_OPCOES = [2, 3], PARCELAS_CARTEIRA = [2, 3, 4, 5, 6];
/* dono, 03/11: a regra vale para cartão parcelado e carteira; na carteira "depende do valor e do paciente" */
const foraRegra = c => c.n > 1 && (c.parcela < PARCELA_MIN || c.n > 3);
/* parcelas arredondam para reais: valor pequeno em muitas vezes daria parcelas de R$ 0,00 */
const orcOk = c => c.total > 0 && (!foraRegra(c) || (c.carteira && !!(E.ui.pc.modal.motivoRegra || '').trim()));
A.orcSel = (ds, el) => { E.ui.pc.modal.sel[ds.id] = el.checked; render(); };
A.orcForma = ds => { E.ui.pc.modal.forma = ds.v; render(); };
A.orcComo = ds => { const m = E.ui.pc.modal; m.como = ds.v; if (ds.v !== 'carteira' && m.n > 3) { m.n = 3; toast('No cartão vai até 3x: ficou em 3 vezes.'); } render(); if (foraRegra(contaOrc(m))) document.querySelector('.orc-tot')?.scrollIntoView({ block: 'nearest' }); };
A.orcRecalcMotivo = () => { const c = contaOrc(E.ui.pc.modal), b = document.getElementById('btn-orc'); if (b) { b.disabled = !orcOk(c); b.textContent = rotuloOrc(c); } };
const rotuloOrc = c => !c.total ? 'Marque ao menos um item' : !foraRegra(c) || orcOk(c) ? `Aprovar orçamento de ${brl(c.total)}` : c.carteira ? 'Escreva o motivo para aprovar' : 'Parcela abaixo do mínimo';
A.orcRe = () => { render(); const m = E.ui.pc.modal; if (m && m.tipo === 'orc' && foraRegra(contaOrc(m))) document.querySelector('.orc-tot')?.scrollIntoView({ block: 'nearest' }); };
A.orcRecalc = () => { const c = contaOrc(E.ui.pc.modal); document.getElementById('orc-tot').innerHTML = orcResumo(c);
  const b = document.getElementById('btn-orc'); b.textContent = rotuloOrc(c); b.disabled = !orcOk(c); };
A.imprimirOrc = () => { const m = E.ui.pc.modal, c = contaOrc(m), pid = E.ui.pc.fichaId, p = pac(pid);
  if (!orcOk(c)) return; // mesma regra do Aprovar: não imprime parcelas que a clínica não aceita
  const ult = c.total - c.parcela * (c.n - 1);
  const forma = c.n === 1 ? 'à vista' : ult === c.parcela ? `${c.n}x de ${brl(c.parcela)}` : `${c.n - 1}x de ${brl(c.parcela)} + 1x de ${brl(ult)}`;
  const linhas = c.pl.filter(i => m.sel[i.id]).map(i => `${nomeItem(i)} — ${brl(i.valor)}`).join('\n');
  const texto = `Paciente: ${p.nome}\n\n${linhas}${c.bruto !== c.total ? `\nDesconto — ${brl(c.bruto - c.total)}` : ''}\n\nTotal: ${brl(c.total)} · ${forma}`;
  imprimirDoc('Orçamento', texto, null); guardarDoc(pid, 'Orçamento', texto, null); render(); toast('Orçamento impresso e guardado em Arquivos.'); };

/* ---------- documentos (T-012, blueprint/06 §5f): escolher, revisar, imprimir; fica em Arquivos ---------- */
const dataExtenso = iso => { const [a, m, d] = iso.split('-').map(Number); return `${d} de ${['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][m - 1]} de ${a}`; };
function preencherDoc(m, p) {
  const ag = E.d.agendamentos.filter(a => a.pac === p.id && ['chegou', 'em_atendimento', 'atendido'].includes(a.estado)).slice(-1)[0];
  const ini = ag ? (ag.chegouAs ?? ag.ini) : E.d.agoraMin, fim = ag ? ag.ini + ag.dur : E.d.agoraMin + 30;
  return m.texto.replace('{paciente}', p.nome).replace('{cpf}', p.cpf ? `, CPF ${p.cpf},` : '').replace('{data}', dataExtenso(E.d.hoje))
    .replace('{dias}', '1 (um) dia').replace('{cid}', '').replace('{inicio}', hhmm(ini)).replace('{fim}', hhmm(fim));
}
A.abrirDoc = () => { const p = pac(E.ui.pc.fichaId), u = usuPC();
  const agHoje = E.d.agendamentos.filter(a => a.pac === p.id && a.prof).slice(-1)[0];
  E.ui.pc.modal = { tipo: 'doc', modelo: null, texto: '', prof: u.prof || (agHoje ? agHoje.prof : E.d.profissionais[0].id) }; render(); };
// rascunho por paciente e tipo: Voltar ou Esc não apagam o que foi escrito
const docRasc = () => (E.ui.pc.docRasc = E.ui.pc.docRasc || {});
A.docModelo = ds => { const m = E.ui.pc.modal, pid = E.ui.pc.fichaId, k = pid + ':' + ds.id; m.modelo = ds.id;
  m.texto = docRasc()[k] ?? preencherDoc(E.d.modelosDoc.find(x => x.id === ds.id), pac(pid)); render();
  const t = document.getElementById('doc-texto'); if (!t) return; t.focus();
  const i = ds.id === 'atestado' ? t.value.indexOf('1 (um) dia') : -1; // os dias de afastamento já vêm selecionados para trocar
  if (i >= 0) t.setSelectionRange(i, i + '1 (um) dia'.length); else t.setSelectionRange(t.value.length, t.value.length); };
A.docDigitado = (ds, el) => { docRasc()[E.ui.pc.fichaId + ':' + E.ui.pc.modal.modelo] = el.value; };
function modalDoc() {
  const m = E.ui.pc.modal, p = pac(E.ui.pc.fichaId), md = m.modelo && E.d.modelosDoc.find(x => x.id === m.modelo);
  const cab = `<div class="painel-cab"><h2>${md ? md.nome : 'Documento'} · ${numNome(p)}</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div>`;
  if (!md) return `<div class="modal">${cab}<div class="painel-corpo"><div class="doc-tipos">${E.d.modelosDoc.map(x => `<button class="btn doc-tipo" data-a="docModelo" data-id="${x.id}">${ic('arquivo', 20)} ${x.nome}</button>`).join('')}</div></div></div>`;
  return `<div class="modal">${cab}<div class="painel-corpo">
    ${alertas(p.id).length ? `<div class="doc-alerta">${ic('alerta', 16)} ${alertas(p.id).map(a => esc(a.texto)).join(' · ')}</div>` : ''}
    <div class="campo"><label for="doc-prof">Assinado por</label><select id="doc-prof" data-campo="pc.modal.prof">${E.d.profissionais.map(x => `<option value="${x.id}" ${x.id === m.prof ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></div>
    <div class="campo"><label for="doc-texto">Texto</label><textarea id="doc-texto" rows="9" data-campo="pc.modal.texto" data-ao="docDigitado">${esc(m.texto)}</textarea></div>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="abrirDoc">Voltar</button><button class="btn btn-pri" data-a="imprimirDocModal">${ic('arquivo', 16)} Imprimir</button></div></div>`;
}
/* imprime numa folha limpa (iframe escondido) e guarda em Arquivos */
function imprimirDoc(titulo, texto, profId) {
  const pr = profId && prof(profId);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
    body{font-family:Georgia,serif;color:#111;margin:48px 56px;font-size:15pt;line-height:1.6}
    .cab{display:flex;align-items:center;gap:12px;border-bottom:2px solid #0A5C96;padding-bottom:10px;margin-bottom:28px}
    .cab b{font-size:18pt;color:#08203F}.cab span{color:#40536F;font-size:11pt}
    h1{font-size:17pt;text-align:center;letter-spacing:.08em;text-transform:uppercase;margin:0 0 24px}
    .txt{white-space:pre-wrap}.local{margin-top:36px}.ass{margin-top:72px;text-align:center}
    .ass hr{width:60%;border:0;border-top:1px solid #111;margin:0 auto 6px}</style></head><body>
    <div class="cab"><b>OdontoVip</b><span>Unidade ${esc(E.d.unidade)} · Recife</span></div>
    <h1>${esc(titulo)}</h1><div class="txt">${esc(texto)}</div>
    <div class="local">Recife, ${dataExtenso(E.d.hoje)}.</div>
    ${pr ? `<div class="ass"><hr>${esc(pr.nome)}<br>${/^Dra\./.test(pr.nome) ? 'Cirurgiã-dentista' : 'Cirurgião-dentista'} · CRO-PE ${esc(pr.cro || '______')}</div>` : ''}</body></html>`;
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
  document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 1000); }, 50);
}
function guardarDoc(pid, tipo, texto, profId) {
  (E.d.arquivos[pid] = E.d.arquivos[pid] || []).push({ id: uid(), tipo, nome: profId ? `por ${prof(profId).curto}` : 'impresso', data: E.d.hoje, texto });
}
// sem Desfazer: o papel já saiu, o registro em Arquivos tem que ficar
A.imprimirDocModal = () => { const m = E.ui.pc.modal, md = E.d.modelosDoc.find(x => x.id === m.modelo), pid = E.ui.pc.fichaId;
  if (!m.texto.trim()) return;
  imprimirDoc(md.nome, m.texto, m.prof); guardarDoc(pid, md.nome, m.texto, m.prof);
  delete docRasc()[pid + ':' + m.modelo]; E.ui.pc.modal = null; semDesfazer(); render();
  toast(`${md.nome} ${md.id === 'atestado' ? 'impresso e guardado' : 'impressa e guardada'} em Arquivos.`); };
A.aprovarOrc = () => {
  const m = E.ui.pc.modal, c = contaOrc(m), pid = E.ui.pc.fichaId;
  if (!orcOk(c)) return;
  // ADR-025: aprovar o orçamento já leva a receber — o particular paga antes de começar
  comDesfazer(`Orçamento aprovado: ${brl(c.total)}${c.n > 1 ? ` em ${c.n}x` : ''}. Receba ${c.n > 1 ? 'a 1ª parcela' : 'o valor'} antes de começar o tratamento.`, () => {
    c.pl.filter(i => m.sel[i.id]).forEach(i => { i.estado = 'aprovado'; i.dataApr = E.d.hoje; });
    // fica guardado para o paciente assinar (T-013): o que foi aprovado, o total e a forma
    orcamentos(pid).push({ id: uid(), data: E.d.hoje, itens: c.pl.filter(i => m.sel[i.id]).map(i => i.id), bruto: c.bruto, desconto: c.bruto - c.total, total: c.total, n: c.n, assinado: false, por: E.ui.pc.usuario,
      carteira: c.carteira, foraRegra: foraRegra(c) ? (m.motivoRegra || '').trim() : null });
    // à vista sempre vence hoje: "primeiro" pode ter ficado em "30" de quando estava em Parcelado
    gerarParcelas(pid, c.total, c.n, m.forma === 'vista' || m.primeiro === 'hoje' ? E.d.hoje : somaMeses(E.d.hoje, 1));
    E.ui.pc.modal = null; E.ui.pc.aba = 'financeiro';
  });
};

/* evolução */
function abaEvolucao(p) {
  const evs = (E.d.evolucoes[p.id] || []).slice().reverse(), f = E.ui.pc.evoForm;
  const abertos = plano(p.id).filter(i => ['aprovado', 'indicado'].includes(i.estado));
  const form = f ? `<div class="cartao" style="margin-bottom:12px"><h3>Nova evolução</h3>
    <div class="campo"><label>O que foi feito hoje?</label>${abertos.map(i => `<label class="item-plano" style="cursor:pointer"><input type="checkbox" ${f.itens[i.id] ? 'checked' : ''} data-a="evoItem" data-id="${i.id}" style="width:20px;height:20px"><span>${esc(nomeItem(i))} <span class="quem">${i.estado === 'indicado' ? '(ainda não aprovado)' : ''}</span></span></label>`).join('') || '<div class="muted mini">Nada pendente no plano.</div>'}</div>
    <div class="campo"><label>Observações</label><textarea id="evo-txt" rows="3" data-campo="pc.evoForm.texto">${esc(f.texto)}</textarea></div>
    <button class="btn btn-pri" data-a="salvarEvoPC">Salvar evolução</button> <button class="btn-link" data-a="aba" data-id="evolucao">Cancelar</button></div>` : '';
  return `${pode('evolucao') ? '' : `<p class="nota-leve">${ic('cadeado', 14)} Só as dentistas escrevem a evolução.</p>`}${pode('evolucao') && !f ? '<button class="btn btn-pri" data-a="novaEvoPC" style="margin-bottom:12px">+ Nova evolução</button>' : ''}${form}
    ${evs.map(ev => `<div class="cartao" style="margin-bottom:10px"><h3>${dataBR(ev.data)} · ${esc(prof(ev.por).curto)}</h3>
      ${pode('clinico') ? `<div>${esc(ev.texto)}</div>` : '<div class="muted">Conteúdo clínico — só dentistas.</div>'}
      ${ev.itens.length ? `<div class="mini muted" style="margin-top:6px">Feito: ${ev.itens.map(id => esc(nomeItem(plano(p.id).find(i => i.id === id)))).join(' · ')}</div>` : ''}</div>`).join('') || '<div class="vazio">Nenhuma evolução.</div>'}`;
}
A.novaEvoPC = () => { E.ui.pc.evoForm = { texto: '', itens: {} }; E.ui.foco = 'evo-txt'; render(); };
A.evoItem = (ds, el) => { E.ui.pc.evoForm.itens[ds.id] = el.checked; };
function salvarEvolucao(pid, profId, texto, itens) {
  (E.d.evolucoes[pid] = E.d.evolucoes[pid] || []).push({ id: uid(), data: E.d.hoje, por: profId, texto, itens });
  let cobrar = 0;
  itens.forEach(id => { const i = plano(pid).find(x => x.id === id);
    if (i.estado === 'indicado') { i.valor = valorItem(i, pid); cobrar += i.valor; } // feito sem orçamento aprovado
    i.estado = 'realizado'; i.feitoPor = profId; i.dataFeito = E.d.hoje; });
  // feito sem orçamento aprovado e pago = exceção (ADR-025: o particular paga antes). Vira cobrança de hoje,
  // e a recepção recebe na saída o que ficou pendente. Convênio é pago pelo plano (guia; fica para o sistema real).
  if (cobrar && pac(pid).conv === 'part') gerarParcelas(pid, cobrar, 1, E.d.hoje);
}
A.salvarEvoPC = () => { const f = E.ui.pc.evoForm, pid = E.ui.pc.fichaId;
  comDesfazer('Evolução salva.', () => { salvarEvolucao(pid, usuPC().prof, f.texto, Object.keys(f.itens).filter(k => f.itens[k])); E.ui.pc.evoForm = null; }); };

/* arquivos, financeiro, dados */
function abaArquivos(p) {
  const arqs = E.d.arquivos[p.id] || [];
  return `<button class="btn btn-pri" data-a="enviarArq" style="margin-bottom:12px">+ Enviar arquivo</button> <span class="mini muted">ou arraste para cá</span>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${arqs.map(a => { const cp = a.comp && comprovantes(p.id).find(x => x.id === a.comp);
      return `<div class="cartao arq-cartao" style="text-align:center" ${cp ? `data-a="verCompPC" data-id="${cp.id}" role="button" tabindex="0"` : a.texto ? `data-a="reimprimirDoc" data-id="${a.id}" role="button" tabindex="0" title="Imprimir de novo"` : ''}><div class="arq-ic">${ic(cp ? 'assinar' : a.tipo === 'Radiografia' ? 'dente' : a.tipo === 'Ficha em papel' || a.texto ? 'arquivo' : 'foto', 32)}</div>${a.texto ? `<span class="arq-imp" aria-hidden="true">${ic('imprimir', 16)}</span>` : ''}<b class="mini">${esc(a.tipo)}</b><div class="mini muted">${esc(a.nome)} · ${dataBR(a.data)}</div>${cp ? (cp.assinado ? '<span class="tag paga">assinado</span>' : '<span class="tag vencida">falta assinatura</span>') : ''}</div>`; }).join('') || '<div class="vazio">Nenhum arquivo.</div>'}</div>`;
}
/* documento emitido: tocar imprime de novo, igual ao que saiu */
A.reimprimirDoc = ds => { const a = (E.d.arquivos[E.ui.pc.fichaId] || []).find(x => x.id === ds.id); if (!a) return;
  const pr = E.d.profissionais.find(x => a.nome === `por ${x.curto}`); imprimirDoc(a.tipo, a.texto, pr && pr.id); };
A.verCompPC = ds => { E.ui.pc.modal = { tipo: 'comp', id: ds.id }; render(); };
function modalComp() { const pid = E.ui.pc.fichaId, cp = comprovantes(pid).find(x => x.id === E.ui.pc.modal.id), p = pac(pid);
  return `<div class="modal"><div class="painel-cab"><h2>Comprovante · ${numNome(p)}</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="mini muted">${dataBRc(cp.data)} · ${esc(prof(cp.prof).curto)} · ${esc(conv(p.conv).nome)}</div>
    <div class="grupo-tit">Procedimento realizado</div>${(cp.itens.length ? cp.itens : ['Consulta']).map(t => `<div class="comp-item">${ic('feito', 16)} ${esc(t)}</div>`).join('')}
    <div class="dono-linha"><span>Pagamento previsto</span><b>${esc(cp.forma || '—')}</b></div><div class="dono-linha"><span>Retorno</span><b>${cp.retorno ? esc(QUANDO_RETORNO[cp.retorno]) : '—'}</b></div>
    <div class="dono-linha"><span>Assinatura do paciente</span>${cp.assinado ? '<span class="tag paga">assinado</span>' : '<span class="tag vencida">falta assinatura</span>'}</div>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="imprimirComp">Imprimir</button>${cp.assinado ? '' : '<button class="btn btn-pri" data-a="pedirAssinComp">Pedir assinatura no celular</button>'}</div></div>`; }
A.imprimirComp = () => toast('No sistema real, abre o PDF no formato do talonário da Odonto Vip.');
A.pedirAssinComp = () => { E.ui.pc.modal = null; render(); toast('No sistema real, o comprovante abre no celular ou tablet da clínica para o paciente assinar.'); };
A.enviarArq = () => toast('No sistema real, abre o seletor de arquivos (radiografia, foto, documento).');
function abaFinanceiro(p) {
  const ps = parcelas(p.id), recs = E.d.recebimentos.filter(r => r.pac === p.id);
  return `<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn btn-pri" data-a="abrirReceber" data-pac="${p.id}">Receber pagamento</button>${(n => n ? `<button class="btn" data-a="abrirOrc">Gerar orçamento (${n} ${n === 1 ? 'indicado' : 'indicados'})</button>` : '')(plano(p.id).filter(i => i.estado === 'indicado').length)}</div>
  ${orcamentos(p.id).length ? `<div class="grupo-tit">Orçamentos aprovados</div>${orcamentos(p.id).slice().reverse().map(o => `<div class="linha orc-linha"><span><b>${dataBR(o.data)}</b> · ${brl(o.total)}${o.n > 1 ? ` em ${o.n}x${o.carteira ? ' na carteira' : ''}` : ' à vista'}${o.foraRegra ? ` <span class="tag aviso-tag">fora da regra: ${esc(o.foraRegra)}</span>` : ''}<br><span class="orc-itens muted">${o.itens.map(id => plano(p.id).find(i => i.id === id)).filter(Boolean).map(i => esc(nomeItem(i))).join(' · ')}${o.desconto ? ` · desconto ${brl(o.desconto)} dado por ${esc((usu(o.por) || {}).nome || '—')}` : ''}</span></span>
    <span class="acoes">${o.assinado ? `<span class="res-ok">${ic('assinar', 15)} assinado em ${dataBR(o.dataAssin || o.data)}</span>` : `<span class="res-ruim">${ic('alerta', 15)} falta assinatura${o.pedido ? ' · pedido enviado ao celular' : ''}</span> <button class="btn btn-peq" data-a="pedirAssinOrc" data-id="${o.id}">${o.pedido ? 'Pedir de novo' : 'Pedir assinatura no celular'}</button>`}</span></div>`).join('')}` : ''}
  ${p.credito ? `<div class="aviso-box info">Crédito do paciente: <b>${brl(p.credito)}</b> (pagou a mais). Ainda não é descontado sozinho das próximas parcelas.</div>` : ''}
  <table class="tab tab-fin"><thead><tr><th>Parcela</th><th>Vence</th><th class="dir">Valor</th><th class="dir">Pago</th><th class="dir">Falta</th><th>Situação</th></tr></thead><tbody>
  ${ps.map(x => { const s = saldoParcela(x), st = !s ? 'paga' : x.venc < E.d.hoje ? 'vencida' : x.pago ? 'parcial' : 'aberta';
    return `<tr><td>${x.n} de ${x.de}</td><td class="num">${dataBR(x.venc)}</td><td class="num dir">${brl(x.valor)}</td><td class="num dir">${brl(x.pago)}</td><td class="num dir"><b>${brl(s)}</b></td><td><span class="tag ${st}">${{ paga: 'Paga', vencida: 'Vencida', parcial: 'Paga em parte', aberta: 'Em aberto' }[st]}</span></td></tr>`; }).join('') || '<tr><td colspan="6" class="vazio">Sem parcelas.</td></tr>'}</tbody></table>
  ${recs.length ? `<div class="grupo-tit">Recebimentos</div>${recs.map(r => `<div class="linha"><span class="hora num">hoje ${hhmm(r.hora)}</span>${formaHTML(r.forma)}<span class="acoes num"><b>${brl(r.valor)}</b><button class="btn btn-peq" data-a="abrirRecibo" data-id="${r.id}">${ic('recibo', 15)} Recibo</button></span></div>`).join('')}` : ''}`;
}
/* todos os campos do cadastro, editáveis; "Salvar alterações" só acende se algo mudou */
const CAMPOS_DADOS = [['nome', 'Nome completo'], ['cel', 'Celular'], ['nascBR', 'Data de nascimento'], ['cpf', 'CPF'], ['rg', 'RG'], ['cns', 'Nº do CNS'],
  ['email', 'E-mail'], ['carteirinha', 'Nº da carteirinha'], ['validadeCart', 'Validade da carteirinha'],
  ['responsavel', 'Responsável'], ['cep', 'CEP'], ['end', 'Endereço'], ['numeroDentalOffice', 'Nº no Dental Office'], ['obs', 'Observações']];
const dadosPC = p => ({ ...Object.fromEntries(CAMPOS_DADOS.map(([k]) => [k, k === 'nascBR' ? dataBRc(p.nasc) : (p[k] || '')])), conv: p.conv, origem: p.origem || '' });
function abaDados(p) {
  const pc = E.ui.pc; if (!pc.dados || pc.dados.id !== p.id) pc.dados = { id: p.id, f: dadosPC(p) };
  const f = pc.dados.f, mudou = JSON.stringify(f) !== JSON.stringify(dadosPC(p));
  const campo = ([k, rot]) => `<div class="campo"><label>${rot}</label>${k === 'obs' ? `<textarea rows="2" data-campo="pc.dados.f.${k}" data-ao="dadosMudou">${esc(f[k])}</textarea>` : `<input value="${esc(f[k])}" ${k === 'email' ? 'type="email" inputmode="email"' : ''} data-campo="pc.dados.f.${k}" data-ao="dadosMudou">`}</div>`;
  return `<div class="cartao" style="max-width:760px"><div class="dados-grade">${CAMPOS_DADOS.map(campo).join('')}
    <div class="campo"><label>Convênio</label><select data-campo="pc.dados.f.conv" data-ao="dadosMudou">${E.d.convenios.map(c => `<option value="${c.id}" ${c.id === f.conv ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></div>
    <div class="campo"><label>Como chegou</label><select data-campo="pc.dados.f.origem" data-ao="dadosMudou">${E.d.origens.map(x => `<option ${x === f.origem ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
    <div class="rodape-dir" style="margin-top:12px"><button class="btn btn-pri" id="btn-dados-pc" data-a="salvarDadosPC" ${mudou ? '' : 'disabled'}>${mudou ? 'Salvar alterações' : 'Nada alterado'}</button></div></div>
  ${pode('cadastro') ? zonaRemover(p) : ''}`;
}
/* o que o paciente já tem no sistema: com qualquer histórico, o prontuário fica guardado */
function historico(pid) {
  const h = [[['consulta', 'consultas'], E.d.agendamentos.filter(a => a.pac === pid).length + E.d.pendentesAnteriores.filter(a => a.pac === pid).length],
    [['ficha de anamnese', 'fichas de anamnese'], (E.d.anamneses[pid] || []).length], [['evolução', 'evoluções'], (E.d.evolucoes[pid] || []).length],
    [['item no plano', 'itens no plano'], plano(pid).length], [['parcela', 'parcelas'], parcelas(pid).length],
    [['pagamento', 'pagamentos'], E.d.recebimentos.filter(r => r.pac === pid).length], [['arquivo', 'arquivos'], (E.d.arquivos[pid] || []).length],
    [['registro no odontograma', 'registros no odontograma'], (E.d.existentes[pid] ? Object.keys(E.d.existentes[pid]) : []).length],
    [['alerta', 'alertas'], (pac(pid).alertas || []).length], [['pedido de retorno', 'pedidos de retorno'], E.d.pedidosRetorno.filter(r => r.pac === pid).length]];
  return h.filter(([, n]) => n).map(([[um, varios], n]) => `${n} ${n === 1 ? um : varios}`);
}
const MOTIVOS_INATIVO = ['Mudou de cidade', 'Não quer mais tratar aqui', 'Faleceu', 'Outro'];
function zonaRemover(p) {
  const z = E.ui.pc.zona && E.ui.pc.zona.id === p.id ? E.ui.pc.zona : null, hist = historico(p.id);
  const hoje = E.d.agendamentos.find(a => a.pac === p.id && ATIVOS.includes(a.estado));
  const inativar = p.inativo ? `<p class="muted" style="margin:0">Já está inativo desde ${dataBR(p.inativo.data)}.</p>`
    : z && z.modo === 'inativar' ? `<div class="grupo-tit">Por quê?</div><div class="chips">${MOTIVOS_INATIVO.map(m => `<button class="${z.motivo === m ? 'on' : ''}" data-a="zonaMotivo" data-v="${m}">${m}</button>`).join('')}</div>
        ${hoje ? `<div class="aviso-box aviso">Tem consulta hoje às ${hhmm(hoje.ini)}. Desmarque a consulta antes de inativar.</div>` : ''}
        ${(d => d ? `<div class="aviso-box aviso">Tem <b>${brl(d)}</b> em aberto. As parcelas continuam valendo e aparecendo no Caixa.</div>` : '')(parcelasAbertas(p.id).reduce((t, x) => t + saldoParcela(x), 0))}
        <div class="rodape-dir"><button class="btn" data-a="zonaCancelar">Cancelar</button><button class="btn btn-pri" data-a="inativarPac" ${z.motivo && !hoje ? '' : 'disabled'}>${z.motivo ? `Inativar ${numNome(p)}` : 'Escolha o motivo'}</button></div>`
    : `<p class="muted" style="margin:0 0 8px">Sai das listas e da agenda, mas a ficha, os pagamentos e as radiografias <b>ficam guardados</b>. Dá para reativar a qualquer momento.</p><button class="btn" data-a="zonaAbrir" data-m="inativar">Inativar paciente</button>`;
  const excluir = hist.length ? `<p class="muted" style="margin:0">Não dá para excluir: tem ${hist.join(', ')}. O prontuário precisa ser guardado — use <b>Inativar</b>.</p>`
    : z && z.modo === 'excluir' ? `<div class="aviso-box erro">O cadastro de <b>${numNome(p)}</b> vai para <b>Excluídos</b>. Fica lá 30 dias e pode ser restaurado.</div>
        <div class="rodape-dir"><button class="btn" data-a="zonaCancelar">Cancelar</button><button class="btn btn-perigo-cheio" data-a="excluirPac">Sim, excluir o cadastro</button></div>`
    : `<p class="muted" style="margin:0 0 8px">Para um cadastro feito por engano ou repetido. Só é possível porque ${esc(p.nome.split(' ')[0])} ainda não tem nenhuma consulta, ficha ou pagamento.</p><button class="btn-link link-perigo" data-a="zonaAbrir" data-m="excluir">Excluir cadastro</button>`;
  return `<div class="cartao zona-remover" style="max-width:760px;margin-top:16px"><h3>Inativar ou excluir</h3>
    <div class="zona-duas"><div><b>Inativar</b>${inativar}</div><div><b>Excluir cadastro</b>${excluir}</div></div></div>`;
}
A.zonaAbrir = ds => { E.ui.pc.zona = { id: E.ui.pc.fichaId, modo: ds.m, motivo: null, desde: Date.now() }; render(); };
A.zonaCancelar = () => { E.ui.pc.zona = null; render(); };
A.zonaMotivo = ds => { E.ui.pc.zona.motivo = ds.v; render(); };
A.inativarPac = () => { const z = E.ui.pc.zona, p = pac(z.id); if (!z.motivo) return; E.ui.pc.zona = null;
  comDesfazer(`${numNome(p)} inativado.`, () => { p.inativo = { motivo: z.motivo, data: E.d.hoje, por: E.ui.pc.usuario }; }); };
A.reativarPac = () => { const p = pac(E.ui.pc.fichaId); comDesfazer(`${numNome(p)} reativado.`, () => { delete p.inativo; }); };
// duplo clique: o "Sim, excluir" aparece perto de onde estava "Excluir cadastro"
A.excluirPac = () => { const z = E.ui.pc.zona, p = pac(z.id); if (historico(p.id).length || Date.now() - z.desde < 700) return; E.ui.pc.zona = null;
  comDesfazer(`Cadastro de ${numNome(p)} excluído. Fica 30 dias em Pacientes → Excluídos.`, () => {
    p.excluido = { data: E.d.hoje, por: E.ui.pc.usuario }; E.ui.pc.tela = 'pacientes'; E.ui.pc.abaPacs = 'ativos'; E.ui.pc.fichaId = null; }); };
A.dadosMudou = () => { const pc = E.ui.pc, b = document.getElementById('btn-dados-pc'), m = JSON.stringify(pc.dados.f) !== JSON.stringify(dadosPC(pac(pc.dados.id)));
  if (b) { b.disabled = !m; b.textContent = m ? 'Salvar alterações' : 'Nada alterado'; } };
A.salvarDadosPC = () => { const pc = E.ui.pc, p = pac(pc.dados.id), f = pc.dados.f, iso = isoDeBR(f.nascBR);
  if (f.nome.trim().split(/\s+/).length < 2) { toast('Escreva o nome completo.'); return; }
  if (!iso) { toast('Confira a data de nascimento (dd/mm/aaaa).'); return; }
  if (!emailValido(f.email)) { toast('Confira o e-mail (exemplo: nome@gmail.com) ou deixe em branco.'); return; }
  if (f.cpf && f.cpf !== p.cpf && !cpfValido(f.cpf)) { toast('Esse CPF não existe. Confira os números ou deixe em branco.'); return; }
  const novo = { ...f, nasc: iso }; delete novo.nascBR; pc.dados = null;
  comDesfazer('Dados salvos.', () => Object.assign(p, novo)); };

/* ---------- receber pagamento ---------- */
A.abrirReceber = ds => { const p = ds.pac ? pac(ds.pac) : null; const ab = p ? parcelasAbertas(p.id) : [];
  const prevista = p && formaPrevistaHoje(p.id);
  E.ui.pc.modal = { tipo: 'rec', pac: p ? p.id : null, valorTxt: ab[0] ? (saldoParcela(ab[0]) / 100).toFixed(2).replace('.', ',') : '', forma: prevista || null, prevista, okExcesso: false };
  E.ui.foco = p ? 'rec-valor' : 'rec-busca'; render(); };
A.recBusca = (ds, el) => { const r = buscarPacientes(el.value); document.getElementById('rec-res').innerHTML = r.map(p => resultadoPac(p, 'recPac')).join(''); };
A.recPac = ds => { const ab = parcelasAbertas(ds.id), prevista = formaPrevistaHoje(ds.id); Object.assign(E.ui.pc.modal, { pac: ds.id, valorTxt: ab[0] ? (saldoParcela(ab[0]) / 100).toFixed(2).replace('.', ',') : '', prevista, forma: prevista || E.ui.pc.modal.forma }); E.ui.foco = 'rec-valor'; render(); };
const verMotivo = () => { const el = document.querySelector('.rec-motivo'); if (el) el.scrollIntoView({ block: 'nearest' }); }; // sem ficar atrás do rodapé fixo
A.recForma = ds => { const m = E.ui.pc.modal; m.forma = ds.v; m.motivo = null; if (m.forma2 === ds.v) m.forma2 = null; render(); verMotivo(); };
A.recMotivo = ds => { E.ui.pc.modal.motivo = ds.v; if (ds.v === 'Outro') E.ui.foco = 'rec-motivo-txt'; render(); verMotivo(); };
A.recMotivoTxt = () => { const m = E.ui.pc.modal, b = document.getElementById('btn-rec'), r = rotuloRec(m, recPrevia(m)); if (b) { b.textContent = r.txt; b.disabled = r.off; } };
const totalAberto = pid => parcelasAbertas(pid).reduce((s, x) => s + saldoParcela(x), 0);
/* ADR-027: 4 formas à vista; as outras em "Mais formas" */
const FORMAS_BASE = ['Dinheiro', 'Pix', 'Cartão débito', 'Cartão crédito'], FORMAS_MAIS = ['Crédito parcelado', 'Carteira', 'Link de pagamento', 'Convênio'];
const formasVisiveis = m => m.maisFormas || FORMAS_MAIS.includes(m.forma) ? FORMAS_BASE.concat(FORMAS_MAIS) : FORMAS_BASE;
A.recMaisFormas = () => { E.ui.pc.modal.maisFormas = true; render(); };
function recPrevia(m) {
  const v = lerReais(m.valorTxt), { res, sobra } = distribuir(m.pac, v), aberto = totalAberto(m.pac);
  return { v, aberto, excesso: aberto > 0 && v > aberto, html: res.filter(r => !r.quita).map(r => `<div class="mini">Parcela ${r.p.n}/${r.p.de} (vence ${dataBR(r.p.venc)}): <b>${brl(r.usa)}</b> ${r.quita ? '→ <span class="res-ok">quitada</span>' : `→ fica faltando ${brl(saldoParcela(r.p) - r.usa)}`}</div>`).join('')
    + (sobra > 0 && res.length ? `<div class="aviso-box aviso">Atenção: isso é <b>mais</b> do que deve (${brl(aberto)}). Sobram ${brl(sobra)}, que ficam como crédito.</div>` : '') };
}
function rotuloRec(m, pv) {
  if (!pv.v) return { txt: 'Digite o valor recebido', off: true };
  if (!m.forma) return { txt: 'Escolha a forma de pagamento', off: true };
  if (m.dividir) { const v1 = lerReais(m.valor1Txt);
    if (!m.forma2) return { txt: 'Escolha a segunda forma', off: true };
    if (!v1) return { txt: `Diga quanto vai em ${m.forma}`, off: true };
    if (v1 === pv.v) return { txt: 'É o total: não precisa dividir', off: true };
    if (v1 > pv.v) return { txt: `${brl(v1)} é mais que o total de ${brl(pv.v)}`, off: true };
    return { txt: `Receber ${brl(pv.v)} · ${brl(v1)} ${m.forma} + ${brl(pv.v - v1)} ${m.forma2}`, off: false }; }
  if (m.prevista && m.forma !== m.prevista && (!m.motivo || (m.motivo === 'Outro' && !(m.motivoTxt || '').trim()))) return { txt: 'Diga por que mudou a forma', off: true };
  if (pv.excesso && !m.okExcesso) return { txt: `Receber ${brl(pv.v)} — é mais do que deve`, off: false };
  return { txt: `Receber ${brl(pv.v)} de ${pac(m.pac).nome.split(' ')[0]} · ${m.forma}`, off: false };
}
A.recTodasParc = () => { E.ui.pc.modal.todasParc = !E.ui.pc.modal.todasParc; render(); };
A.recDividir = () => { const m = E.ui.pc.modal; m.dividir = !m.dividir; m.forma2 = null; m.valor1Txt = ''; render(); if (m.dividir) document.querySelector('.rec-dividir')?.scrollIntoView({ block: 'nearest' }); };
A.recForma2 = ds => { E.ui.pc.modal.forma2 = ds.v; E.ui.foco = 'rec-valor1'; render(); document.querySelector('.rec-dividir')?.scrollIntoView({ block: 'nearest' }); };
A.recPreview = () => { const m = E.ui.pc.modal, pv = recPrevia(m), r = rotuloRec(m, pv); m.okExcesso = false;
  const rr = document.getElementById('rec-resto'); if (rr) { const v1 = lerReais(m.valor1Txt); rr.textContent = v1 && v1 < pv.v ? brl(pv.v - v1) : '—'; }
  document.getElementById('rec-prev').innerHTML = pv.html; const b = document.getElementById('btn-rec'); b.textContent = r.txt; b.disabled = r.off; };
function modalRec() {
  const m = E.ui.pc.modal;
  if (!m.pac) return `<div class="modal"><div class="painel-cab"><h2>Receber pagamento</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="campo"><label>De quem?</label><input id="rec-busca" placeholder="Nome, CPF, telefone ou nº" data-ao="recBusca" autocomplete="off"></div><div id="rec-res"></div></div></div>`;
  const p = pac(m.pac), ab = parcelasAbertas(p.id), pv = recPrevia(m), r = rotuloRec(m, pv);
  return `<div class="modal" data-scroll="modal-rec"><div class="painel-cab"><h2>Receber pagamento</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="chip-pac"><b>${numNome(p)}</b></div>
    <div class="grupo-tit">Em aberto (mais antiga primeiro)</div>
    ${(m.todasParc ? ab : ab.slice(0, 2)).map(x => `<div class="linha"><span>Parcela ${x.n}/${x.de}</span><span class="mini ${x.venc < E.d.hoje ? 'res-ruim' : 'muted'}">vence ${dataBR(x.venc)}${x.venc < E.d.hoje ? ' · vencida' : ''}</span><span class="acoes num"><b>${brl(saldoParcela(x))}</b></span></div>`).join('') || '<div class="aviso-box info">Nada em aberto. Pode receber um valor avulso.</div>'}
    ${ab.length > 2 ? `<button class="btn-link" data-a="recTodasParc">${m.todasParc ? 'Mostrar só as próximas' : `Ver todas as ${ab.length} parcelas`}</button>` : ''}
    <div class="campo" style="margin-top:12px"><label>Valor recebido (R$) <span class="muted">— pode ser menos que a parcela</span></label><input id="rec-valor" data-selecionar inputmode="decimal" value="${esc(m.valorTxt)}" data-campo="pc.modal.valorTxt" data-ao="recPreview" style="font-size:20px;font-weight:700"></div>
    <div id="rec-prev">${pv.html}</div>
    ${m.okExcesso ? `<div class="aviso-box erro">Confirme: ${esc(p.nome.split(' ')[0])} deve ${brl(pv.aberto)} e você está recebendo ${brl(pv.v)}. Toque de novo para confirmar.</div>` : ''}
    ${m.prevista ? `<div class="aviso-box info" style="margin:12px 0 0">${ic('assinar', 15)} A dentista anotou no comprovante: <b>${esc(m.prevista)}</b>.</div>` : ''}
    <div class="campo" style="margin-top:12px"><label>Forma de pagamento <span class="obrig">*</span></label><div class="chips chips-forma">${formasVisiveis(m).map(f => `<button class="${m.forma === f ? 'on' : ''}" data-a="recForma" data-v="${f}" aria-pressed="${m.forma === f}">${m.forma === f ? ic('check', 16) : ic((FORMAS[f] || ['caixa'])[0], 16)} ${f}</button>`).join('')}${m.maisFormas || FORMAS_MAIS.includes(m.forma) ? '' : `<button class="chip-mais" data-a="recMaisFormas">Mais formas ⋯</button>`}</div></div>
    ${m.prevista && m.forma && m.forma !== m.prevista ? `<div class="campo rec-motivo"><label>Mudou de ${esc(m.prevista)} para ${esc(m.forma)}. Por quê? <span class="obrig">*</span></label>
      <div class="chips">${['O paciente pediu', 'Cartão sem limite', 'Dividiu em duas formas', 'Outro'].map(x => `<button class="${m.motivo === x ? 'on' : ''}" data-a="recMotivo" data-v="${x}">${x}</button>`).join('')}</div>
      ${m.motivo === 'Outro' ? `<input id="rec-motivo-txt" placeholder="Escreva o motivo" value="${esc(m.motivoTxt || '')}" data-campo="pc.modal.motivoTxt" data-ao="recMotivoTxt">` : ''}</div>` : ''}
    ${m.forma ? (m.dividir ? `<div class="campo rec-dividir"><label>Segunda forma <button class="btn-link" data-a="recDividir">não dividir</button></label>
      <div class="chips">${['Dinheiro', 'Pix', 'Cartão débito', 'Cartão crédito'].filter(f => f !== m.forma).map(f => `<button class="${m.forma2 === f ? 'on' : ''}" data-a="recForma2" data-v="${f}">${m.forma2 === f ? ic('check', 16) : ic((FORMAS[f] || ['caixa'])[0], 16)} ${f}</button>`).join('')}</div>
      ${m.forma2 ? `<div class="duas"><div class="campo"><label>Quanto em ${esc(m.forma)}</label><input id="rec-valor1" inputmode="decimal" value="${esc(m.valor1Txt || '')}" data-campo="pc.modal.valor1Txt" data-ao="recPreview" placeholder="0,00"></div>
        <div class="campo"><label>Fica em ${esc(m.forma2)}</label><div class="rec-resto num" id="rec-resto">${(v1 => v1 && v1 < pv.v ? brl(pv.v - v1) : '—')(lerReais(m.valor1Txt))}</div></div></div>` : ''}</div>`
      : `<button class="btn-link rec-dividir-link" data-a="recDividir">${ic('mais', 15)} Dividir em duas formas</button>`) : ''}
  </div><div class="painel-rodape painel-rodape-col">${E.d.caixa.fechado ? '<div class="aviso-box aviso">O caixa de hoje já foi fechado. Este recebimento fica marcado como “depois do fechamento”.</div>' : ''}<button id="btn-rec" class="btn btn-pri" style="width:100%;min-height:48px" data-a="confirmarRec" ${r.off ? 'disabled' : ''}>${esc(r.txt)}</button></div></div>`;
}
A.confirmarRec = () => { const m = E.ui.pc.modal, pv = recPrevia(m), p = pac(m.pac); if (!pv.v || !m.forma) return;
  if (pv.excesso && !m.okExcesso) { m.okExcesso = true; render(); return; }
  const mudou = m.prevista && m.forma !== m.prevista ? m.prevista : null; if (mudou && (!m.motivo || (m.motivo === 'Outro' && !(m.motivoTxt || '').trim()))) return;
  if (m.dividir && rotuloRec(m, pv).off) return;
  comDesfazer(`Recebido ${brl(pv.v)} de ${esc(p.nome)} (${m.dividir && m.forma2 ? `${m.forma} + ${m.forma2}` : m.forma}).${mudou ? ` Anotado: a prevista era ${esc(mudou)}.` : ''}`, () => {
    if (m.dividir && m.forma2) { const v1 = lerReais(m.valor1Txt); receber(m.pac, v1, m.forma); receber(m.pac, pv.v - v1, m.forma2); } else receber(m.pac, pv.v, m.forma);
    if (mudou) Object.assign(E.d.recebimentos[E.d.recebimentos.length - 1], { previstaEra: mudou, motivoTroca: m.motivo === 'Outro' ? m.motivoTxt.trim() : m.motivo }); E.ui.pc.modal = null; }); };

/* ---------- CAIXA ---------- */
const FORMAS = { 'Pix': ['pix', '#6B4FBB'], 'Dinheiro': ['dinheiro', '#157F3B'], 'Cartão crédito': ['cartao', '#0A5C96'], 'Cartão débito': ['cartao', '#0E7C86'], 'Crédito parcelado': ['cartao', '#08406b'], 'Carteira': ['caixa', '#8a5a00'], 'Convênio': ['arquivo', '#BC943D'], 'Link de pagamento': ['link', '#9A3B8C'] }; // Link: pedido do Sr. Austregesilo (R17)
const formaHTML = f => { const [i, c] = FORMAS[f] || ['caixa', '#7C8CA3']; return `<span class="cx-forma" style="--c:${c}">${ic(i, 15)} ${esc(f)}</span>`; };
/* "Saldo de caixa" no lugar de "Deve ter na gaveta" (Danielle, R8): saldo em espécie, em cartão
   e, depois de contar a gaveta, o saldo positivo (sobrou) ou negativo (quanto falta) */
function cartaoSaldo(t, cx) {
  const din = t.porForma['Dinheiro'] || 0, cartao = (t.porForma['Cartão crédito'] || 0) + (t.porForma['Cartão débito'] || 0) + (t.porForma['Crédito parcelado'] || 0);
  const outros = t.total - din - cartao;
  const linha = (rot, v, sub, cls = '') => `<div class="saldo-linha ${cls}"><span>${rot}${sub ? `<span class="mini muted">${sub}</span>` : ''}</span><b class="num">${v}</b></div>`;
  // ADR-027: sem frases de ajuda; a conferência só aparece depois de fechar
  const conf = !cx.fechado ? ''
    : cx.dif === 0 ? linha('Saldo da conferência', brl(0), '', 'saldo-ok')
    : linha(cx.dif > 0 ? 'Saldo positivo' : 'Saldo negativo', `${cx.dif > 0 ? '+' : '−'} ${brl(Math.abs(cx.dif))}`, cx.dif > 0 ? 'sobrou na gaveta' : 'é quanto falta na gaveta', cx.dif > 0 ? 'saldo-aviso' : 'saldo-erro');
  return `<div class="cartao cx-saldo"><h3>${ic('dinheiro', 15)} Saldo de caixa</h3>
    ${linha('Em espécie', brl(din), '')}
    ${linha('Em cartão', brl(cartao), '')}
    ${outros ? linha('Pix e outros', brl(outros), '') : ''}
    ${conf}</div>`;
}
/* gráficos do Caixa (pedido de Nicolas, 03/11). Cor fixa por forma — paleta validada (dataviz): a cor segue a forma, nunca a posição */
const COR_FORMA = { 'Pix': '#2a78d6', 'Cartão crédito': '#eb6834', 'Cartão débito': '#1baf7a', 'Dinheiro': '#eda100', 'Crédito parcelado': '#e87ba4' };
const corForma = f => COR_FORMA[f] || '#6250d6';
const ORDEM_FORMA = ['Pix', 'Cartão crédito', 'Cartão débito', 'Dinheiro', 'Crédito parcelado'];
function graficoFormas(t) {
  const fs = Object.entries(t.porForma).filter(([, v]) => v > 0).sort((a, b) => (ORDEM_FORMA.indexOf(a[0]) + 1 || 99) - (ORDEM_FORMA.indexOf(b[0]) + 1 || 99));
  if (!t.total) return '<div class="vazio">Nada recebido ainda.</div>';
  return `<div class="cx-pilha" role="img" aria-label="${fs.map(([f, v]) => `${f} ${pct(v, t.total)}%`).join(', ')}">${fs.map(([f, v]) => `<i style="flex:${v};background:${corForma(f)}" title="${esc(f)}: ${brl(v)} (${pct(v, t.total)}%)"></i>`).join('')}</div>
    <div class="cx-leg">${fs.map(([f, v]) => `<div class="cx-leg-l"><i style="background:${corForma(f)}"></i><span>${esc(f)}</span><b class="num">${brl(v)}</b><span class="muted num">${pct(v, t.total)}%</span></div>`).join('')}</div>`;
}
function graficoHoras(recs) {
  const hs = Array.from({ length: 11 }, (_, i) => 8 + i), por = h => recs.filter(r => Math.floor(r.hora / 60) === h).reduce((t, r) => t + r.valor, 0);
  const max = Math.max(1, ...hs.map(por)), agora = Math.floor(E.d.agoraMin / 60);
  return `<div class="cartao"><h3>Ao longo do dia <span class="muted mini">em R$</span></h3><div class="cx-horas" role="img" aria-label="Recebido por hora">${hs.map(h => { const v = por(h);
    return `<div class="cx-hora ${h > agora ? 'futura' : ''}" title="${String(h).padStart(2, '0')}h: ${brl(v)}"><span class="cx-hora-v num">${v ? Math.round(v / 100) : ''}</span><i style="height:${v ? Math.max(4, Math.round(v / max * 70)) : 0}%"></i><span class="cx-hora-r num">${String(h).padStart(2, '0')}h</span></div>`; }).join('')}</div></div>`;
}
function graficoProf(t) {
  const ps = Object.entries(t.porProf).sort((a, b) => b[1] - a[1]), max = Math.max(1, ...ps.map(([, v]) => v));
  return `<div class="cartao"><h3>Por profissional</h3>${ps.map(([id, v]) => `<div class="rel-barra" title="${esc(id && prof(id) ? prof(id).curto : 'Sem profissional')}: ${brl(v)}"><span>${id && prof(id) ? esc(prof(id).curto) : 'Sem profissional'}</span><span class="rel-trilho"><i style="width:${Math.round(v / max * 100)}%"></i></span><b class="num">${brl(v)}</b></div>`).join('')}
    <p class="nota-leve" style="margin:8px 0 0">${ic('alerta', 15)} É o que foi recebido, não a comissão (essa fica em Relatórios).</p></div>`;
}
function telaCaixa() {
  const t = totaisDia(), cx = E.d.caixa;
  const recs = E.d.recebimentos.slice().sort((a, b) => b.hora - a.hora);
  const formas = Object.entries(t.porForma).sort((a, b) => b[1] - a[1]);
  const vencHoje = Object.entries(E.d.parcelas).flatMap(([pid, ps]) => ps.filter(p => p.venc === E.d.hoje && saldoParcela(p) > 0).map(p => ({ pid, p })));
  const status = cx.fechado ? `<span class="cx-status fechado">${ic('cadeado', 14)} Fechado</span>` : `<span class="cx-status aberto"><span class="ponto"></span>Aberto</span>`;
  return `<div class="titulo-tela"><h1>Caixa</h1><span class="sub">${E.d.unidade} · quinta, 29/10</span>${status}
    <span style="margin-left:auto;display:flex;gap:8px">${cx.fechado ? `<span class="cx-ja-fechado">${ic('cadeado', 16)} Fechado às ${hhmm(cx.hora)} por ${esc(usu(cx.por).nome)}</span>` : `<button class="btn" data-a="abrirFechar">${ic('cadeado', 16)} Fechar caixa</button>`}${botaoExcel('exportCaixa')}<button class="btn btn-pri" data-a="abrirReceber">${ic('mais', 16)} Receber pagamento</button></span></div>
  ${(v => v ? `<div class="aviso-box aviso">Depois do fechamento entrou mais <b>${brl(v)}</b> em dinheiro: a gaveta deve ter ${brl(cx.gaveta + v)}, não ${brl(cx.gaveta)}.</div>` : '')(cx.fechado ? recs.filter(r => r.depoisFechamento && r.forma === 'Dinheiro').reduce((s, r) => s + r.valor, 0) : 0)}
  <div class="cx-topo">
    <div class="cx-esq"><div class="cartao cx-total">
      <span class="cx-rot">Recebido hoje</span>
      <b class="cx-valor num">${brl(t.total)}</b>
      <span class="mini muted">${recs.length} pagamento${recs.length === 1 ? '' : 's'} até ${hhmm(E.d.agoraMin)} · ontem, o dia todo: ${brl(E.d.ontem.total)}</span>
      ${graficoFormas(t)}
    </div>
    <div class="cx-graficos">${graficoHoras(recs)}${graficoProf(t)}</div></div>
    <div class="cx-lado">
      ${cartaoSaldo(t, cx)}
      <div class="cartao"><h3>Vence hoje e falta receber <span class="h-cont ${vencHoje.length ? 'alerta' : ''}">${vencHoje.length}</span></h3>
        ${vencHoje.map(({ pid, p }) => { const pa = pac(pid); return `<div class="h-atencao"><span class="h-ico aviso">${ic('caixa', 18)}</span><span class="h-pac"><b>${numNome(pa)}</b><span class="h-meta">parcela ${p.n} de ${p.de} · falta ${brl(saldoParcela(p))}</span></span><span class="acoes"><button class="btn btn-peq" data-a="abrirReceber" data-pac="${pid}">Receber</button></span></div>`; }).join('') || '<div class="vazio">Nada vencendo hoje.</div>'}</div>
    </div>
  </div>
  <div class="cartao" style="margin-top:16px;padding:0"><div class="cartao-cab"><h3>Pagamentos de hoje</h3><span class="cont">${recs.length}</span></div>
  <table class="tab cx-tab"><thead><tr><th>Hora</th><th>Paciente</th><th>Profissional</th><th>Forma</th><th class="dir">Valor</th><th>Recebido por</th><th></th></tr></thead><tbody>
    ${recs.map(r => { const p = pac(r.pac); return `<tr class="clic" data-a="abrirFicha" data-id="${p.id}"><td class="num"><b>${hhmm(r.hora)}</b></td><td>nº ${p.numero} · ${esc(p.nome)}${r.depoisFechamento ? ' <span class="tag vencida">depois do fechamento</span>' : ''}</td><td class="muted">${r.prof ? esc(prof(r.prof).curto) : '—'}</td><td>${formaHTML(r.forma)}${r.previstaEra ? `<br><span class="cx-mudou">mudou · previsto ${esc(r.previstaEra)} · ${esc(r.motivoTroca || '')}</span>` : ''}</td><td class="num dir"><b>${brl(r.valor)}</b></td><td class="muted">${esc(usu(r.por).nome)}</td><td class="dir"><button class="btn btn-peq" data-a="abrirRecibo" data-id="${r.id}" aria-label="Recibo de ${brl(r.valor)}">${ic('recibo', 16)} Recibo</button></td></tr>`; }).join('') || '<tr><td colspan="7"><div class="vazio">Nenhum pagamento ainda hoje.</div></td></tr>'}</tbody>
    ${recs.length ? `<tfoot><tr><td colspan="4"><b>Total</b></td><td class="num dir"><b>${brl(t.total)}</b></td><td></td><td></td></tr></tfoot>` : ''}</table></div>`;
}
A.abrirFechar = () => { E.ui.pc.modal = { tipo: 'fechar', gaveta: '', confirmar: false, erro: '' }; E.ui.foco = 'gaveta'; render(); };
function difGaveta(m) { const din = totaisDia().porForma['Dinheiro'] || 0; return { din, dif: lerReais(m.gaveta) - din }; }
const difHTML = m => { if (!String(m.gaveta).trim()) return ''; const { dif } = difGaveta(m);
  return dif === 0 ? `<div class="aviso-box ok">${ic('check', 16)} Bate certinho.</div>` : `<div class="aviso-box ${dif > 0 ? 'aviso' : 'erro'}">${dif > 0 ? 'Sobra' : 'Falta'} <b>${brl(Math.abs(dif))}</b> na gaveta. Conte de novo antes de fechar.</div>`; };
A.fechPrev = () => { E.ui.pc.modal.erro = ''; document.getElementById('fech-dif').innerHTML = difHTML(E.ui.pc.modal); };
function modalFechar() {
  const m = E.ui.pc.modal, t = totaisDia();
  return `<div class="modal"><div class="painel-cab"><h2>Fechar caixa · 29/10</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="campo"><label>1. Conte o dinheiro da gaveta e digite aqui <span class="obrig">*</span></label><input id="gaveta" data-selecionar inputmode="decimal" placeholder="0,00" value="${esc(m.gaveta)}" data-campo="pc.modal.gaveta" data-ao="fechPrev" style="font-size:20px;font-weight:700"></div>
    <div id="fech-dif">${difHTML(m)}</div>
    ${m.erro ? `<div class="aviso-box erro">${m.erro}</div>` : ''}
    <div class="grupo-tit">2. Confira os totais do dia</div>
    ${Object.entries(t.porForma).sort((a, b) => b[1] - a[1]).map(([f, v]) => `<div class="dono-linha"><span>${formaHTML(f)}</span><b class="num">${brl(v)}</b></div>`).join('')}
    <div class="dono-linha"><span><b>Total</b></span><b class="num">${brl(t.total)}</b></div>
    ${m.confirmar ? '<div class="aviso-box aviso" style="margin-top:10px">Tem certeza? Depois de fechado, o que for recebido hoje fica marcado como “depois do fechamento”.</div>' : ''}
  </div><div class="painel-rodape rodape-dir">${m.confirmar ? `<button class="btn" data-a="voltarFechar">Voltar</button> <button class="btn btn-pri" data-a="fecharCaixa">Sim, fechar o caixa de ${brl(t.total)}</button>` : `<button class="btn btn-pri" data-a="pedirFechar">Fechar o caixa de ${brl(t.total)}</button>`}</div></div>`;
}
A.pedirFechar = () => { const m = E.ui.pc.modal; if (!String(m.gaveta).trim()) { m.erro = 'Conte a gaveta e digite o valor antes de fechar. Se não tiver dinheiro, digite 0.'; render(); return; } m.confirmar = true; render(); };
A.voltarFechar = () => { E.ui.pc.modal.confirmar = false; render(); };
A.fecharCaixa = () => { const m = E.ui.pc.modal, { dif } = difGaveta(m);
  E.d.caixa = { fechado: true, hora: E.d.agoraMin, por: E.ui.pc.usuario, gaveta: lerReais(m.gaveta), dif }; E.ui.pc.modal = null; render();
  toast(dif === 0 ? 'Caixa fechado. O dono já vê o resumo no celular.' : `Caixa fechado com diferença de ${brl(Math.abs(dif))}. O dono vai ver isso no celular.`); };

/* ---------- CONFIGURAÇÕES ---------- */
/* Configurações (ADR-028): menu à esquerda, cada seção com conteúdo — nada de caixa vazia */
const CFG = [
  ['unidade', 'local', 'Unidade', 'Nome, endereço e horário de atendimento'],
  ['cadeiras', 'atendendo', 'Cadeiras e salas', 'Onde cada dentista atende'],
  ['pessoas', 'pacientes', 'Pessoas e acessos', 'Quem entra e o que cada um pode fazer'],
  ['precos', 'caixa', 'Procedimentos e preços', 'Tabela por convênio e procedimentos novos'],
  ['convenios', 'arquivo', 'Convênios', '19 convênios cadastrados'],
  ['anamnese', 'prancheta', 'Fichas de anamnese', 'Perguntas e alertas'],
  ['documentos', 'imprimir', 'Documentos', 'Receita, atestado e declaração'],
  ['origens', 'sobe', 'Origens', 'Como o paciente chegou'],
  ['whatsapp', 'msg', 'WhatsApp', 'Número e mensagens automáticas'],
  ['aparelhos', 'camera', 'Aparelhos', 'Celulares e computadores autorizados'],
  ['backup', 'cadeado', 'Backup', 'Cópia de segurança todas as noites'],
];
CFG.splice(3, 0, ['auditoria', 'prancheta', 'Auditoria', 'Quem fez o quê, e quando']);
/* os convênios do Dental Office (MAPA-DENTAL-OFFICE.md; "odonto p", "U" e "SUL" não são convênios — 02/11) */
const CONVENIOS_DO = ['AESP Odonto', 'Amil Dental', 'Camed', 'Dental Center', 'Golden Cross', 'Interodonto', 'MetLife', 'Odonto Group', 'Odonto Maxi', 'Odonto Seg', 'Odontoprev', 'Orale', 'Ortoclin', 'Prevident', 'Santander', 'Sempre Odonto', 'SulAmérica', 'Unimed Odonto', 'W Dental'];
const linhaCfg = (ico, tit, sub, dir = '') => `<div class="cfg-linha"><span class="uni-ic">${ic(ico, 18)}</span><span class="h-pac-txt"><b>${tit}</b>${sub ? `<span class="h-meta">${sub}</span>` : ''}</span>${dir ? `<span class="cfg-dir">${dir}</span>` : ''}</div>`;
function cfgConteudo(k) {
  const tit = (t, sub) => `<div class="cartao-cab"><h3>${t}</h3>${sub ? `<span class="muted mini">${sub}</span>` : ''}</div>`;
  if (k === 'precos') { const novos = E.d.procedimentos.filter(x => x.pendente);
    return `${novos.length ? `<div class="cartao cfg-bloco">${tit('Procedimentos novos para aprovar', aprovaProc() ? '' : 'quem aprova: a Dra. Marcelly')}${novos.map(x => linhaCfg('prancheta', esc(x.nome), `${x.dur} min · criado por ${esc((usu(x.criadoPor) || {}).nome || '—')} em ${dataBR(x.criadoEm)}`,
      aprovaProc() ? `<input class="preco-in pp-in" id="pp-${x.id}" inputmode="decimal" placeholder="Preço R$" aria-label="Preço particular de ${esc(x.nome)}"><button class="btn btn-peq btn-pri" data-a="aprovarProc" data-id="${x.id}">Aprovar</button><button class="btn btn-peq" data-a="recusarProc" data-id="${x.id}">Recusar</button>` : '<span class="tag aviso-tag">aguarda aprovação</span>')).join('')}</div>` : ''}${telaPrecos()}`; }
  if (k === 'aparelhos') return `<div class="cfg-aparelhos">APARELHOS</div>`;
  const corpo = {
    unidade: () => `${tit('Unidade')}${linhaCfg('local', esc(E.d.unidade), 'Recife · PE · 2 cadeiras de atendimento + 1 de avaliação')}
      ${linhaCfg('relogio', 'Horário de atendimento', 'segunda a sexta 08:00–18:00 · sábado 08:00–12:00 · almoço 12:00–13:00')}
      ${linhaCfg('cadeado', 'Agenda fora da clínica', 'as dentistas veem a agenda de casa <b>só no horário de atendimento</b>')}
      ${linhaCfg('graficos', 'Outras unidades', 'Prazeres e Norte entram no mesmo sistema depois')}
      ${cfgUnidadeAg()}`,
    cadeiras: () => `${tit('Cadeiras e salas')}${E.d.cadeiras.map(c => { const pf = E.d.profissionais.find(x => x.cadeira === c.id); return linhaCfg('atendendo', esc(c.nome), pf ? `${esc(pf.curto)} · ${esc(pf.esp)}` : 'livre para avaliação e encaixe'); }).join('')}`,
    pessoas: () => `${tit('Pessoas e acessos', 'cada um entra com o seu PIN')}${E.d.usuarios.map(u => { const p = u.prof && prof(u.prof);
      return linhaCfg(p ? 'dente' : 'usuario', esc(u.nome), `${esc(u.rotulo)}${u.fin ? ' · vê o financeiro' : ''}${p ? ` · ${p.cro ? `CRO-PE ${esc(p.cro)}` : '<b class="txt-erro">CRO a informar</b>'} · consulta ${p.durPadrao || 40} min · comissão ${p.comissao}%` : ''}`,
        p ? `<button class="btn btn-peq" data-a="editarDentista" data-id="${p.id}">${ic('editar', 15)} Editar</button>` : ''); }).join('')}
      <div class="cfg-sub">Quem pode</div>
      ${linhaCfg('caixa', 'Receber e fechar o caixa', 'Recepção, Administração e o dono')}
      ${linhaCfg('prancheta', 'Aprovar procedimento novo', 'Dra. Marcelly e o dono')}
      ${linhaCfg('dinheiro', 'Dar desconto', 'o sistema anota quem deu · <b>quem pode: a definir</b>')}
      ${linhaCfg('graficos', 'Ver Relatórios e comissões', 'o dono, a Administração e a Dra. Marcelly · a dentista não vê a comissão no celular')}`,
    convenios: () => `${tit('Convênios', `${CONVENIOS_DO.length} convênios`)}<p class="nota-leve cfg-nota">${ic('alerta', 15)} Boa Viagem começa só com particular; os convênios já ficam cadastrados para quando precisar.</p>
      <div class="cfg-grade">${CONVENIOS_DO.map(n => { const t = E.d.convenios.find(c => semAcento(c.nome) === semAcento(n)); return `<span class="cfg-chip">${ic('arquivo', 15)} ${esc(n)}${t ? ' <span class="tag aberta">com tabela</span>' : ''}</span>`; }).join('')}</div>`,
    anamnese: () => `${tit('Fichas de anamnese')}${E.d.modelos.map(m => linhaCfg('prancheta', esc(m.nome), `${m.perguntas.length} perguntas · ${m.perguntas.filter(q => q.alerta).length} viram alerta na ficha quando a resposta é sim`)).join('')}`,
    documentos: () => `${tit('Documentos para imprimir')}${E.d.modelosDoc.map(d => linhaCfg('imprimir', esc(d.nome), 'os dados do paciente e da dentista entram sozinhos')).join('')}
`,
    origens: () => `${tit('Origens', `${E.d.origens.length} opções`)}<div class="cfg-grade">${E.d.origens.map(o => `<span class="cfg-chip">${esc(o)}</span>`).join('')}</div>`,
    whatsapp: () => `${tit('WhatsApp')}${linhaCfg('fone', 'Número da clínica', 'o WhatsApp da clínica · a conta oficial ainda vai ser criada')}
      ${Object.values(WA_LISTAS).map(L => linhaCfg(L.ico, L.rot, 'mensagem automática', `<label class="cfg-tog"><input type="checkbox" ${L.cat === 'Utilidade' ? 'checked' : ''} data-a="cfgTog"> automático</label>`)).join('')}
      ${linhaCfg('usuario', 'Quem aprova os textos', '<b>a definir</b>')}`,
    auditoria: () => `${tit('Auditoria', 'hoje · só para Administração e o dono')}${(E.audit || []).slice(0, 40).map(x => linhaCfg('relogio', esc(x.txt), `${x.hora} · ${esc(x.quem)}`)).join('') || '<div class="vazio">Nada registrado hoje.</div>'}
      <p class="nota-leve cfg-nota">${ic('cadeado', 15)} Fica guardado mesmo quando alguém usa o Desfazer: o Desfazer também é registrado.</p>`,
    backup: () => `${tit('Backup')}${linhaCfg('checks', 'Última cópia: hoje às 02:14', 'tudo certo · cifrada, no Google Drive da clínica', '<span class="tag paga">OK</span>')}
      ${linhaCfg('relogio', 'Todas as noites às 02:00', 'guarda 30 cópias diárias e 12 mensais')}
      ${linhaCfg('cadeado', 'Teste de restauração', 'uma vez por mês uma cópia é aberta em outra máquina para ver se funciona · último: 01/10')}`,
  }[k];
  return `<div class="cartao cfg-bloco">${corpo()}</div>`;
}
function telaConfig() {
  const k = E.ui.pc.cfg || 'unidade';
  let conteudo = cfgConteudo(k);
  if (k === 'aparelhos') conteudo = `<div class="cartao" style="margin-top:16px;max-width:820px;display:flex;gap:20px;align-items:center">
    <div style="width:150px;height:150px;flex:none;background:repeating-conic-gradient(#0B1F3F 0 25%,#fff 0 50%) 0 0/18px 18px;border:10px solid #fff;outline:1px solid var(--rule)"></div>
    <div><b>Emparelhar um celular</b><p>1. Instale o app OdontoVip no celular.<br>2. Abra o app e aponte a câmera para este código.<br>3. Pronto: o celular já sabe onde está o computador da clínica.</p></div></div>
  <div class="cartao" style="margin-top:12px;max-width:820px"><b>Celulares emparelhados</b>
    <p class="muted" style="margin:4px 0 8px">Se um celular for perdido ou roubado, tire o acesso aqui: ele para de abrir a agenda e as fichas na hora.</p>
    ${[['Dra. Marcelly', 'Xiaomi', '20/10'], ['Dra. Helena', 'Samsung', '20/10'], ['Dr. Rafael', 'Motorola', '21/10'], ['Sr. Austregesilo (dono)', 'iPhone · só Caixa do dia', '22/10']].map(([q, a, d]) => `<div class="linha"><span>${ic('camera', 16)}</span><span><b>${q}</b><br><span class="h-meta">${a} · emparelhado em ${d}</span></span><span class="acoes"><button class="btn btn-peq" data-a="cfgTirar">Tirar acesso</button></span></div>`).join('')}</div>
  <div class="cartao" style="margin-top:12px;max-width:820px"><b>Computadores autorizados</b>
    <p class="muted" style="margin:4px 0 8px">Computador não usa QR: o administrador autoriza uma vez e deixa o atalho "OdontoVip" na área de trabalho. Depois a pessoa toca no nome dela e digita a senha (ou o PIN, se o computador é dela). Só funciona no Wi-Fi da clínica.</p>
    ${[['Recepção (servidor)', '20/10', true], ['Notebook Dra. Marcelly', '28/10', false]].map(([n, d, este]) => `<div class="linha"><span>${ic('config', 16)}</span><span><b>${n}</b><br><span class="h-meta">autorizado em ${d}${este ? ' · é este computador' : ''}</span></span><span class="acoes">${este ? '' : '<button class="btn btn-peq" data-a="cfgTirar">Tirar acesso</button>'}</span></div>`).join('')}
    <p class="mini muted" style="margin:8px 0 0">Para autorizar outro computador, abra o OdontoVip nele e entre com a senha de administrador.</p></div>`;
  return `<div class="titulo-tela"><h1>Configurações</h1><span class="sub">${esc(E.d.unidade)}</span></div>
  <div class="cfg-grade-tela"><nav class="cartao cfg-nav">${CFG.map(([id, ico, nome, sub]) => `<button class="cfg-item ${k === id ? 'ativo' : ''}" data-a="cfg" data-i="${id}"><span class="uni-ic">${ic(ico, 18)}</span><span class="h-pac-txt"><b>${nome}</b><span class="h-meta">${sub}</span></span></button>`).join('')}</nav>
  <div class="cfg-conteudo">${conteudo}</div></div>`;
}
A.cfgTirar = () => toast('No sistema real, pede a senha de administrador e corta o acesso na hora.');
A.cfg = ds => { E.ui.pc.cfg = ds.i; E.ui.zerarScroll = 'pc-main'; render(); };
A.cfgTog = () => toast('No protótipo a mudança não fica gravada. No sistema, só liga depois da aprovação da Meta.');

/* ---------- CONFIGURAÇÕES → PROCEDIMENTOS E PREÇOS ---------- */
const TIPOS_PROC = { geral: 'Sem dente', dente: 'Um dente', faces: 'Faces do dente', canal: 'Canal', arcada: 'Arcada' };
const precoTxt = c => c == null ? '' : (c / 100).toFixed(2).replace('.', ',');
function linhasPreco() {
  return E.d.procedimentos.filter(pr => !pr.pendente && !pr.recusado).flatMap(pr => pr.tipo === 'faces'
    ? [1, 2, 3, 4, 5].map(n => ({ pr, k: `${pr.id}#${n}`, rotulo: `${n} face${n > 1 ? 's' : ''}`, primeira: n === 1 }))
    : [{ pr, k: pr.id, rotulo: '', primeira: true }]);
}
/* um convênio por vez: com 20 convênios, uma grade de 20 colunas não se lê */
function telaPrecos() {
  const pc = E.ui.pc, ed = pc.precosEd = pc.precosEd || {}, cv = pc.precoConv || 'part', ehPart = cv === 'part';
  const linhas = linhasPreco();
  const pend = k => Object.keys(ed).filter(id => id.endsWith('|' + k)).length;
  const input = l => { const id = `${l.k}|${cv}`, mud = id in ed, v = mud ? ed[id] : precoTxt(E.d.precos[l.k][cv]);
    return `<input class="preco-in ${mud ? 'mudou' : ''}" inputmode="decimal" value="${esc(v)}" placeholder="${ehPart ? '0,00' : 'não cobre'}" data-ao="precoEd" data-id="${id}" aria-label="${esc(l.pr.nome)} ${l.rotulo} · ${esc(conv(cv).nome)}">`; };
  const pct = l => { const p = E.d.precos[l.k].part, v = E.d.precos[l.k][cv]; return ehPart ? '' : v == null ? '<span class="tag inativo">paga particular</span>' : p ? `${Math.round(v / p * 100)}%` : ''; };
  const meta = l => `<td class="muted">${TIPOS_PROC[l.pr.tipo]}</td><td class="dir muted">${l.pr.dur} min</td><td class="dir muted">${l.pr.lab ? brl(l.pr.lab) : '—'}</td>`;
  const vazias = l => `<td></td><td></td><td></td>`;
  return `<div class="cartao" style="margin-top:16px;padding:0">
    <div class="precos-topo"><div><h3 style="margin:0">Procedimentos e preços</h3>
      <div class="mini muted">Os preços do odontograma e do orçamento saem desta tabela. Mudar aqui vale para tudo que <b>ainda não foi aprovado</b>; orçamentos já aprovados não mudam.</div></div>
      <button class="btn" data-a="importarPrecos">${ic('arquivo', 16)} Importar do Dental Office (Excel)</button></div>
    <div class="precos-filtro"><label>Preços de:</label><select data-campo="pc.precoConv" data-ao="precoConvTroca">${E.d.convenios.map(c => `<option value="${c.id}" ${c.id === cv ? 'selected' : ''}>${esc(c.nome)}${pend(c.id) ? ` (${pend(c.id)} sem salvar)` : ''}</option>`).join('')}</select>
      <input class="precos-busca" placeholder="Buscar procedimento" data-ao="precoBusca">
      ${ehPart ? '' : `<span class="mini muted">Vazio = ${esc(conv(cv).nome)} não cobre; o paciente paga o preço particular.</span>`}</div>
    <div class="precos-rolagem"><table class="tab precos-tab"><thead><tr><th>Procedimento</th><th>Tipo</th><th class="dir">Duração</th><th class="dir">Laboratório</th>
      ${ehPart ? '' : '<th class="dir">Particular</th>'}<th class="dir">${ehPart ? 'Preço particular' : 'Preço ' + esc(conv(cv).nome)}</th>${ehPart ? '' : '<th class="dir">do particular</th>'}</tr></thead>
    <tbody>${linhas.map(l => (l.rotulo && l.primeira ? `<tr class="grupo" data-proc="${esc(l.pr.nome)}"><td><b>${esc(l.pr.nome)}</b> <span class="mini muted">· por nº de faces</span></td>${meta(l)}<td colspan="${ehPart ? 1 : 3}"></td></tr>` : '')
      + `<tr class="${l.rotulo ? 'sub' : ''}" data-proc="${esc(l.pr.nome)}"><td>${l.rotulo ? `<span class="precos-faces">${l.rotulo}</span>` : `<b>${esc(l.pr.nome)}</b>`}</td>${l.rotulo ? vazias(l) : meta(l)}
      ${ehPart ? '' : `<td class="dir muted num">${brl(E.d.precos[l.k].part || 0)}</td>`}<td class="dir">${input(l)}</td>${ehPart ? '' : `<td class="dir mini preco-pct">${pct(l)}</td>`}</tr>`).join('')}</tbody></table></div>
    <div class="precos-rodape" id="precos-rodape">${rodapePrecos()}</div></div>`;
}
/* erro de digitação comum: um zero a mais ou a menos, ou zero. Mudança grande pede confirmação. */
function lerPreco(txt) { const t = String(txt).trim(); if (!t) return { vazio: true }; if (!/\d/.test(t)) return { erro: 'Isso não é um valor' }; return { v: lerReais(t) }; }
function mudancasPreco() {
  const ed = E.ui.pc.precosEd || {};
  return Object.entries(ed).map(([id, txt]) => { const [k, c] = id.split('|'), antes = E.d.precos[k][c], lp = lerPreco(txt);
    const erro = lp.erro || (lp.vazio && c === 'part' ? 'O particular não pode ficar vazio' : '');
    const novo = lp.vazio ? null : lp.v;
    return { id, k, c, antes, novo, erro, grande: !erro && novo != null && (novo === 0 || (antes && (novo > antes * 2 || novo < antes / 2))) }; })
    .filter(m => m.erro || m.novo !== m.antes);
}
const nomeLinhaPreco = m => { const l = linhasPreco().find(x => x.k === m.k); return `${l.pr.nome}${l.rotulo ? ' · ' + l.rotulo : ''} (${conv(m.c).nome})`; };
function rodapePrecos() {
  const ms = mudancasPreco(), pc = E.ui.pc, grandes = ms.filter(m => m.grande), erros = ms.filter(m => m.erro);
  if (!ms.length) return '<span class="muted">Toque num preço para mudar. Nada alterado.</span>';
  const porConv = Object.entries(ms.reduce((a, m) => (a[m.c] = (a[m.c] || 0) + 1, a), {})).map(([c, n]) => `${n} em ${conv(c).nome}`).join(', ');
  return `<span><b>${ms.length} ${ms.length === 1 ? 'preço alterado' : 'preços alterados'}</b> (${porConv}). Vale para o que ainda não foi aprovado; orçamentos já aprovados não mudam.
    ${erros.length ? `<br><span class="res-ruim">${erros.map(m => `${esc(nomeLinhaPreco(m))}: ${m.erro}`).join(' · ')}</span>` : ''}
    ${grandes.length && pc.precosConfirmar ? `<br><span class="res-ruim">Confira: ${grandes.map(m => `${esc(nomeLinhaPreco(m))} de ${m.antes != null ? brl(m.antes) : 'particular'} para ${brl(m.novo)}`).join(' · ')}</span>` : ''}</span>
    <span class="rodape-dir"><button class="btn" data-a="descartarPrecos">Descartar</button><button class="btn btn-pri" data-a="salvarPrecos" ${erros.length ? 'disabled' : ''}>${erros.length ? 'Corrija o valor em vermelho' : grandes.length && pc.precosConfirmar ? 'Sim, está certo — salvar' : 'Salvar preços'}</button></span>`;
}
A.precoEd = (ds, el) => { const pc = E.ui.pc; pc.precosEd[ds.id] = el.value; pc.precosConfirmar = false;
  const [k, c] = ds.id.split('|'), lp = lerPreco(el.value), erro = lp.erro || (lp.vazio && c === 'part');
  el.classList.toggle('erro', !!erro); el.classList.toggle('mudou', !erro && (lp.vazio ? null : lp.v) !== E.d.precos[k][c]);
  const pct = el.closest('tr').querySelector('.preco-pct'), part = E.d.precos[k].part;
  if (pct && part) pct.innerHTML = lp.vazio ? '<span class="tag inativo">paga particular</span>' : lp.v != null ? Math.round(lp.v / part * 100) + '%' : '';
  document.getElementById('precos-rodape').innerHTML = rodapePrecos(); };
/* busca: só esconde linhas, não redesenha (assim o teclado não perde o foco) */
A.precoBusca = (ds, el) => { const q = semAcento(el.value || '');
  document.querySelectorAll('.precos-tab tbody tr[data-proc]').forEach(tr => { tr.style.display = !q || semAcento(tr.dataset.proc).includes(q) ? '' : 'none'; }); };
A.precoConvTroca = () => render();
A.descartarPrecos = () => { const pc = E.ui.pc, antes = { ...pc.precosEd }; pc.precosEd = {}; pc.precosConfirmar = false; render();
  desfazivel('Alterações descartadas.', () => { pc.precosEd = antes; }); };
A.salvarPrecos = () => { const pc = E.ui.pc, ms = mudancasPreco(); if (ms.some(m => m.erro)) return;
  if (ms.some(m => m.grande) && !pc.precosConfirmar) { pc.precosConfirmar = Date.now(); document.getElementById('precos-rodape').innerHTML = rodapePrecos(); return; }
  if (pc.precosConfirmar && Date.now() - pc.precosConfirmar < 700) return; // duplo toque não confirma
  pc.precosEd = {}; pc.precosConfirmar = false;
  comDesfazer(`${ms.length} ${ms.length === 1 ? 'preço salvo' : 'preços salvos'}. Vale para o que ainda não foi aprovado.`, () => {
    ms.forEach(m => { if (m.novo == null) delete E.d.precos[m.k][m.c]; else E.d.precos[m.k][m.c] = m.novo; }); }); };
A.importarPrecos = () => toast('No sistema real: escolha o arquivo Excel exportado do Dental Office (Personalizar → Procedimentos). Antes de salvar, mostra o que vai mudar.');

/* ---------- modais ---------- */
/* T-015: a recepção confirma uma por uma, com o texto pronto (sem custo: abre o WhatsApp da clínica) */
const textoConfirma = a => { const p = pac(a.pac); return `Olá, ${p.nome.split(' ')[0]}! Sua consulta na Odonto Vip Boa Viagem é hoje, quinta 29/10, às ${hhmm(a.ini)} com ${prof(a.prof).curto}. Responda SIM para confirmar ou REMARCAR para escolher outro horário.`; };
A.abrirWaUm = ds => { E.ui.pc.modal = { tipo: 'wa', id: ds.id }; render(); };
function modalWa() {
  const a = E.d.agendamentos.find(x => x.id === E.ui.pc.modal.id), p = pac(a.pac);
  return `<div class="modal modal-wa"><div class="painel-cab"><h2>Confirmar pelo WhatsApp</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="chip-pac">${avPac(p)}<span><b>${esc(p.nome)}</b><br><span class="mini muted num">${esc(p.cel)} · ${hhmm(a.ini)} · ${esc(prof(a.prof).curto)}</span></span></div>
    <div class="wa-fone" style="margin-top:14px"><div class="wa-balao">${esc(textoConfirma(a))}<span class="wa-hora num">${hhmm(E.d.agoraMin)}</span></div></div>
    <p class="nota-leve" style="margin-top:12px">${ic('alerta', 15)} No protótipo nada é enviado. No sistema, abre o WhatsApp da clínica com o texto pronto: é só tocar em Enviar.</p>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="fecharModal">Agora não</button><button class="btn btn-pri" data-a="enviarWaUm">${ic('enviar', 18)} Abrir o WhatsApp</button></div></div>`;
}
A.enviarWaUm = () => { const a = E.d.agendamentos.find(x => x.id === E.ui.pc.modal.id), p = pac(a.pac);
  comDesfazer(`WhatsApp aberto para ${esc(p.nome)}. Quando responder SIM, toque em Confirmar.`, () => { a.waEnviado = hhmm(E.d.agoraMin); E.ui.pc.modal = null; }); };
function modalHTML() { return ({ wa: modalWa, orc: modalOrc, rec: modalRec, fechar: modalFechar, comp: modalComp, doc: modalDoc, foto: modalFoto })[E.ui.pc.modal.tipo](); }

/* ---------- foto do paciente (R9): como no Dental Office, a webcam da recepção tira a foto no cadastro ---------- */
/* círculo com a foto, ou as iniciais; tocar abre a câmera. A foto só fica na memória do protótipo. */
function avatarPac(foto, nome, acao, tam, pid) {
  const ini = (String(nome || '').trim().split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('') || '+').toUpperCase();
  const dentro = `${foto ? `<img src="${foto}" alt="">` : `<span>${esc(ini)}</span>`}<i>${ic('camera', 14)}</i>`;
  if (!acao) return `<span class="avatar-pac" style="--t:${tam}px" aria-hidden="true">${dentro}</span>`; // dentro de outro botão
  return `<button class="avatar-pac" style="--t:${tam}px" data-a="${acao}" ${pid ? `data-id="${pid}"` : ''} aria-label="${foto ? 'Trocar a foto' : 'Tirar foto'}" data-dica="${foto ? 'Trocar a foto' : 'Tirar foto'}">${dentro}</button>`;
}
let camStream = null;
const pararCamera = () => { if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; } };
function abrirCamera(destino) {
  E.ui.pc.modal = { tipo: 'foto', destino, erro: '' }; render();
  const v = document.getElementById('cam-video');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { E.ui.pc.modal.erro = 'Este computador não tem câmera. Escolha uma foto.'; render(); return; }
  navigator.mediaDevices.getUserMedia({ video: true }).then(st => { camStream = st; const vv = document.getElementById('cam-video'); if (!vv) { pararCamera(); return; }
      vv.srcObject = st; vv.onloadedmetadata = () => { const b = document.getElementById('cam-principal'); if (b) { b.disabled = false; b.focus(); } }; vv.play(); }) // "Tirar foto" só acende com a imagem pronta
    .catch(() => { if (E.ui.pc.modal && E.ui.pc.modal.tipo === 'foto') { E.ui.pc.modal.erro = 'A câmera não abriu. Permita a câmera no navegador ou escolha uma foto.'; render(); const b = document.getElementById('cam-principal'); if (b) b.focus(); } });
}
A.fotoPac = ds => abrirCamera({ pac: ds.id });
A.fotoNovoPac = () => abrirCamera({ novo: true });
function modalFoto() {
  const m = E.ui.pc.modal;
  return `<div class="modal modal-foto"><div class="painel-cab"><h2>Foto do paciente</h2><button class="fechar" data-a="fecharFoto" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    ${m.erro ? `<div class="aviso-box aviso">${esc(m.erro)}</div>` : '<video id="cam-video" class="cam-video" autoplay playsinline muted></video>'}
    <input id="cam-arquivo" class="so-leitor" type="file" accept="image/*" data-ao="fotoArquivo" tabindex="-1">
    ${m.erro ? '' : '<button class="btn-link cam-arquivo" data-a="escolherFoto">ou escolher uma foto do computador</button>'}
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="fecharFoto">Cancelar</button>${m.erro
    ? `<button class="btn btn-pri" id="cam-principal" data-a="escolherFoto">${ic('foto', 16)} Escolher foto do computador</button>`
    : `<button class="btn btn-pri" id="cam-principal" data-a="tirarFoto" disabled>${ic('camera', 16)} Tirar foto</button>`}</div></div>`;
}
function guardarFoto(url) {
  const d = E.ui.pc.modal.destino; pararCamera(); E.ui.pc.modal = null;
  if (d.novo) { E.ui.pc.novoPac.foto = url; render(); return; }
  const p = pac(d.pac); comDesfazer('Foto guardada.', () => { p.foto = url; });
}
A.tirarFoto = () => { const v = document.getElementById('cam-video'); if (!v || !v.videoWidth) return;
  const lado = Math.min(v.videoWidth, v.videoHeight), c = document.createElement('canvas'); c.width = c.height = 320;
  c.getContext('2d').drawImage(v, (v.videoWidth - lado) / 2, (v.videoHeight - lado) / 2, lado, lado, 0, 0, 320, 320);
  guardarFoto(c.toDataURL('image/jpeg', .85)); };
A.fotoArquivo = (ds, el) => { const f = el.files && el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => guardarFoto(r.result); r.readAsDataURL(f); };
A.escolherFoto = () => { const i = document.getElementById('cam-arquivo'); if (i) i.click(); };
A.fecharFoto = () => { pararCamera(); E.ui.pc.modal = null; render(); };

/* ---------- splash, troca de usuário, PIN (compartilhado com o celular) ---------- */
/* abertura (S-mac-12, a partir do vídeo do Nicolas): fitas douradas que se desenham, o anel que se fecha,
   o selo que surge com brilho, faíscas, e a barra de carga — sobre o mesmo fundo da portada */
const FAISCAS = Array.from({ length: 18 }, (_, i) => [(i * 37 + 11) % 100, (i * 53 + 23) % 70 + 15, (i * 0.17) % 1.6, 2 + (i % 3)]);
function splashHTML(saud) {
  const fitas = `<svg class="sp-fitas" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="sp-ouro" x1="0" x2="1"><stop offset="0" stop-color="#F6E3A1" stop-opacity="0"/><stop offset=".35" stop-color="#F6E3A1"/><stop offset=".7" stop-color="#D4A84B"/><stop offset="1" stop-color="#FFF4CF" stop-opacity="0"/></linearGradient></defs>
    <path pathLength="1" d="M-20,470 C180,380 300,520 470,330 S760,90 1020,170"/>
    <path pathLength="1" d="M-20,520 C220,450 360,560 520,380 S800,180 1020,240"/>
    <path pathLength="1" d="M-20,120 C200,60 330,210 500,250 S820,330 1020,300"/></svg>`;
  const faiscas = FAISCAS.map(([x, y, d, t]) => `<i style="left:${x}%;top:${y}%;animation-delay:${(0.5 + d).toFixed(2)}s;width:${t}px;height:${t}px"></i>`).join('');
  return `<div class="splash" style="--sp-dur:${SPLASH_MS}ms"><i class="sobre-foto sp-foto" aria-hidden="true"></i>${fitas}<div class="sp-faiscas" aria-hidden="true">${faiscas}</div>
    <button class="pular" data-a="pularSplash">Pular</button>
    <div class="anel"><svg class="sp-anel" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" pathLength="1"/></svg><img src="selo.png" alt="OdontoVip"><i class="sp-brilho" aria-hidden="true"></i></div>
    ${saud ? `<div class="saud">${saud}</div>` : ''}
    <div class="sp-barra" role="progressbar" aria-label="Carregando"><i></i></div></div>`;
}
function sobreHTML(alvo) {
  const s = alvo === 'pc' ? E.ui.pc : E.ui.cel;
  if (s.sobre === 'splash' || s.tela === 'splash') return splashHTML(alvo === 'pc' ? `Bom dia, ${E.d.unidade}.` : 'OdontoVip');
  const lista = alvo === 'pc' ? E.d.usuarios : E.d.usuarios.filter(u => u.papel !== 'recepcao');
  // o selo entra com animação só na primeira vez que a portada aparece (render() redesenha a cada toque)
  const visto = (E.ui.seloVisto = E.ui.seloVisto || {});
  const anim = !visto[alvo] ? ' anim' : ''; visto[alvo] = true;
  const selo = `<i class="sobre-foto" aria-hidden="true"></i><span class="sobre-selo${anim}"><img src="selo.png" alt="OdontoVip"><i class="selo-brilho" aria-hidden="true"></i></span>`;
  if (!s.pinUsu) return `<div class="sobre" data-scroll="sobre-${alvo}">${selo}<h2>Quem é você?</h2><div class="cards-usu">${lista.map(u => `<button class="card-usu ${alvo === 'pc' && u.id === E.ui.pc.usuario ? 'atual' : ''}" data-a="escolherUsu" data-alvo="${alvo}" data-id="${u.id}"><div class="ini">${iniciais(u.nome)}</div><b>${esc(u.nome)}</b><small>${u.rotulo}${alvo === 'pc' && u.id === E.ui.pc.usuario ? ' · agora' : ''}</small></button>`).join('')}</div>
    ${alvo === 'pc' ? '<button class="btn-link" data-a="cancelarTroca">Cancelar</button>' : ''}</div>`;
  const u = usu(s.pinUsu);
  return `<div class="sobre pin" data-scroll="sobre-${alvo}-pin">${selo}<div class="card-usu" style="border:0;background:none;box-shadow:none"><div class="ini">${iniciais(u.nome)}</div><b>${esc(u.nome)}</b></div>
    <div class="pin-tit">Digite seu PIN <span class="mini muted">(no protótipo: 1234)</span></div>
    <div class="pin-pontos">${[0, 1, 2, 3].map(i => `<i class="${s.pinBuf.length > i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="pin-erro">${s.pinErro || ''}</div>
    <div class="pin-teclas">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'apagar'].map(k => k === '' ? '<span></span>' : `<button data-a="pinTecla" data-alvo="${alvo}" data-k="${k}" ${k === 'apagar' ? 'aria-label="Apagar"' : ''}>${k === 'apagar' ? ic('apagar', 22) : k}</button>`).join('')}</div>
    <button class="btn btn-nao-sou" data-a="voltarUsu" data-alvo="${alvo}">Não sou eu</button></div>`;
}
A.pularSplash = () => { E.ui.pc.sobre = E.ui.pc.sobre === 'splash' ? null : E.ui.pc.sobre; if (E.ui.cel.tela === 'splash') E.ui.cel.tela = 'login'; render(); };
A.trocarUsuario = () => { Object.assign(E.ui.pc, { sobre: 'usuarios', pinUsu: null, pinBuf: '', pinErro: '' }); render(); };
A.cancelarTroca = () => { E.ui.pc.sobre = null; render(); };
A.escolherUsu = ds => { const s = ds.alvo === 'pc' ? E.ui.pc : E.ui.cel; Object.assign(s, { pinUsu: ds.id, pinBuf: '', pinErro: '' }); render(); };
A.voltarUsu = ds => { const s = ds.alvo === 'pc' ? E.ui.pc : E.ui.cel; s.pinUsu = null; render(); };
A.pinTecla = ds => {
  const s = ds.alvo === 'pc' ? E.ui.pc : E.ui.cel;
  if (ds.k === 'apagar') s.pinBuf = s.pinBuf.slice(0, -1); else if (s.pinBuf.length < 4) s.pinBuf += ds.k;
  s.pinErro = '';
  if (s.pinBuf.length === 4) {
    if (s.pinBuf !== '1234') { s.pinErro = 'PIN incorreto. Tente de novo.'; s.pinBuf = ''; }
    else if (ds.alvo === 'pc') {
      s.usuario = s.pinUsu; s.sobre = null; s.pinUsu = null;
      if (!pode('caixa') && s.tela === 'caixa') s.tela = 'hoje';
      if (!pode('config') && s.tela === 'config') s.tela = 'hoje';
      render(); toast(`Agora é ${esc(usu(s.usuario).nome)} no computador.`); return;
    } else { entrarCel(s.pinUsu); return; }
  }
  render();
};

/* ---------- RELATÓRIOS (ADR-028): os números do dono na tela grande — só totais, nada de nomes ---------- */
/* comissão sobre o que cada dentista FEZ (ADR-022): (valor − laboratório) × % ; quem só indica não ganha (dono, 03/11) */
const relTabs = per => [['painel', 'Painel'], ['hoje', 'Hoje'], ['mes', 'Mês'], ['comissoes', 'Comissões']].map(([k, t]) => `<button role="tab" aria-selected="${per === k}" class="${per === k ? 'on' : ''}" data-a="relPer" data-v="${k}">${t}</button>`).join('');
/* PAINEL (03/11): a evolução que o Dental Office mostra em gráficos — faturamento por mês, conversão de orçamentos,
   procedimentos mais feitos, pacientes novos por origem e aniversariantes. Só totais, nunca nomes. */
const milR = c => `R$ ${(c / 100000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
function telaPainel() {
  const P = E.d.painel, ms = P.meses, ult = ms[ms.length - 1], ant = ms[ms.length - 2];
  const varPart = pct(ult.part, ant.part) - 100, conv = pct(ult.orcA, ult.orcF), convAnt = pct(ant.orcA, ant.orcF);
  const kpi = (n, txt, ico, cls, sub) => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 22)}</span><span><b class="num">${n}</b><span>${txt}</span>${sub || ''}</span></div>`;
  const seta = v => `<small class="pn-var ${v >= 0 ? 'sobe' : 'desce'}">${ic(v >= 0 ? 'sobe' : 'desce', 14)} ${v >= 0 ? '+' : ''}${v}% que 1 a 29/09</small>`;
  const rotMes = m => m.parcial ? `${m.rot} (até 29)` : m.rot;
  const maxTot = Math.max(...ms.map(m => m.part + m.conv)), maxOrc = Math.max(...ms.map(m => m.orcF));
  const barrasFat = ms.map(m => { const t = m.part + m.conv;
    return `<div class="pn-col" title="${m.rot}: particular ${brl(m.part)} · convênio ${brl(m.conv)}"><span class="pn-v num">${milR(t).replace('R$ ', '')}</span>
      <span class="pn-pilha" style="height:${Math.round(t / maxTot * 78)}%"><i class="b-conv" style="flex:${m.conv}"></i><i class="b-part" style="flex:${m.part}"></i></span><span class="pn-r">${rotMes(m)}</span></div>`; }).join('');
  const barrasOrc = ms.map(m => `<div class="pn-col" title="${m.rot}: ${m.orcF} feitos · ${m.orcA} aprovados (${pct(m.orcA, m.orcF)}%)">
      <span class="pn-par"><span class="pn-b"><span class="pn-v num">${m.orcF}</span><i class="pn-feito" style="height:${Math.round(m.orcF / maxOrc * 70)}%"></i></span><span class="pn-b"><span class="pn-v num">${m.orcA}</span><i class="pn-aprov" style="height:${Math.round(m.orcA / maxOrc * 70)}%"></i></span></span><span class="pn-r">${rotMes(m)} · ${pct(m.orcA, m.orcF)}%</span></div>`).join('');
  const ranking = (lista, max) => lista.map(([n, v]) => `<div class="rel-barra" title="${esc(n)}: ${v}"><span>${esc(n)}</span><span class="rel-trilho"><i style="width:${Math.round(v / max * 100)}%"></i></span><b class="num">${v}</b></div>`).join('');
  const an = P.aniversariantesMes;
  return `<div class="kpis-h">
    ${kpi(milR(ult.part), 'particular · out. até 29', 'caixa', 'azul', seta(varPart))}
    ${kpi(milR(ult.conv), 'convênio produzido · outubro', 'arquivo', 'teal')}
    ${kpi(`${conv}%`, 'dos orçamentos aprovados', 'recibo', 'verde', `<small class="pn-var ${conv >= convAnt ? 'sobe' : 'desce'}">${ic(conv >= convAnt ? 'sobe' : 'desce', 14)} ${conv === convAnt ? 'igual a' : conv > convAnt ? `subiu de ${convAnt}% para ${conv}%` : `caiu de ${convAnt}% para ${conv}%`}</small>`)}
    ${kpi(ult.novos, 'pacientes novos em outubro', 'pacientes', 'ambar', seta(pct(ult.novos, ant.novos) - 100))}
  </div>
  <div class="grade-painel">
    <div class="cartao"><div class="cartao-cab pn-cab"><h3>Faturamento por mês</h3><span class="pn-leg"><span><i class="b-part"></i>Particular</span><span><i class="b-conv"></i>Convênio</span></span></div>
      <div class="pn-graf" role="img" aria-label="Faturamento de maio a outubro">${barrasFat}</div>
      <p class="pn-resumo-l">Em R$ · outubro até 29: particular <b>${milR(ult.part)}</b> · convênio <b>${milR(ult.conv)}</b></p></div>
    <div class="cartao"><div class="cartao-cab pn-cab"><h3>Orçamentos: feitos e aprovados</h3><span class="pn-leg"><span><i class="pn-feito"></i>Feitos</span><span><i class="pn-aprov"></i>Aprovados</span></span></div>
      <div class="pn-graf" role="img" aria-label="Orçamentos feitos e aprovados por mês">${barrasOrc}</div>
      <p class="pn-resumo-l">Outubro até 29: <b>${ult.orcF}</b> feitos · <b>${ult.orcA}</b> aprovados</p></div>
    <div class="cartao"><h3>Procedimentos mais feitos em outubro</h3>${ranking(P.procedimentos, P.procedimentos[0][1])}</div>
    <div class="cartao"><h3>Como as consultas de outubro foram marcadas</h3>${ranking(P.origens, Math.max(...P.origens.map(o => o[1])))}</div>
  </div>
  <div class="cartao pn-aniv">${ic('presente', 22)}<div><b>Aniversariantes de ${an.mes}: ${an.bv} em ${esc(E.d.unidade)} · ${an.todas} nas 3 unidades</b><span class="muted">Os parabéns pelo WhatsApp saem no dia de cada um: lembram o paciente da clínica e trazem de volta quem sumiu.</span></div>
    ${pode('whatsapp') ? `<button class="btn btn-sec" data-a="waAniversario">${ic('msg', 18)} Ver os ${an.bv} de ${esc(E.d.unidade)}</button>` : ''}</div>
  <p class="nota-leve">${ic('cadeado', 15)} Só totais das 3 unidades · números de exemplo.</p>`;
}
A.waAniversario = () => { const pc = E.ui.pc; pc.tela = 'whatsapp'; pc.waLista = 'aniversario'; render(); };
function telaComissoes() {
  const feitosHoje = Object.values(E.d.planos).flat().filter(i => i.estado === 'realizado' && i.feitoPor && (i.dataFeito || '').slice(0, 7) === E.d.hoje.slice(0, 7));
  const linhas = E.d.profissionais.map(pf => { const a = E.d.comissaoAntes[pf.id] || { itens: 0, producao: 0, lab: 0 }, h = feitosHoje.filter(i => i.feitoPor === pf.id);
    const producao = a.producao + h.reduce((t, i) => t + i.valor, 0), lab = pf.descontaLab === false ? 0 : a.lab + h.reduce((t, i) => t + (proc(i.proc).lab || 0), 0), base = producao - lab;
    return { pf, itens: a.itens + h.length, producao, lab, base, valor: Math.round(base * pf.comissao / 100), hoje: h }; });
  const tot = k => linhas.reduce((t, l) => t + l[k], 0);
  return `<div class="grade-rel"><div class="cartao rel-uni"><div class="cartao-cab"><h3>Comissões · Boa Viagem · 01 a 29/10</h3></div>
    <table class="tab"><thead><tr><th>Dentista</th><th class="dir">Feitos</th><th class="dir">Produção</th><th class="dir">Laboratório</th><th class="dir">%</th><th class="dir">Comissão</th></tr></thead><tbody>
    ${linhas.map(l => `<tr><td><span class="td-pac"><span class="av">${esc(iniciaisProf(l.pf.nome))}</span><b>${esc(l.pf.curto)}</b></span></td><td class="dir num">${l.itens}</td><td class="dir num">${brl(l.producao)}</td><td class="dir num muted">${l.lab ? '− ' + brl(l.lab) : '—'}</td><td class="dir num">${l.pf.comissao}%</td><td class="dir num"><b>${brl(l.valor)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td><b>Total</b></td><td class="dir num">${tot('itens')}</td><td class="dir num">${brl(tot('producao'))}</td><td class="dir num muted">− ${brl(tot('lab'))}</td><td></td><td class="dir num"><b>${brl(tot('valor'))}</b></td></tr></tfoot></table></div>
    <div class="rel-lado"><div class="cartao"><h3>Como se calcula</h3><p class="muted mini" style="margin:0">Sobre o que a dentista <b>fez</b> no mês, mesmo que o paciente ainda não tenha pago. Desconta o laboratório. Quem só <b>indicou</b> não ganha.</p></div>
      <div class="cartao"><h3>Feitos hoje</h3>${feitosHoje.map(i => `<div class="rel-barra"><span>${esc(prof(i.feitoPor).curto)}</span><span class="muted mini">${esc(nomeItem(i))}</span><b class="num">${brl(i.valor)}</b></div>`).join('') || '<div class="vazio">Nada feito ainda hoje.</div>'}</div>
      <p class="nota-leve">${ic('cadeado', 15)} A dentista não vê a comissão no celular. 01 a 28/10 é exemplo.</p></div></div>`;
}
function telaRelatorios() {
  const per = E.ui.pc.relPer || 'painel', bv = donoBoaViagemHoje(1e9);
  let us;
  if (per === 'mes') { const a = E.d.bvMesAntes;
    us = [{ nome: E.d.unidade, aoVivo: true, part: a.part + bv.part, conv: a.conv + bv.conv, atendidos: a.atendidos + bv.atendidos, faltas: a.faltas + bv.faltas, orcFeitos: a.orcFeitos, orcAprov: a.orcAprov },
      ...E.d.outrasUnidades.map(u => ({ nome: u.nome, ...u.mes }))];
  } else us = [bv, ...E.d.outrasUnidades.map(u => ({ nome: u.nome, ...u.hoje }))];
  const soma = k => us.reduce((s2, u) => s2 + (u[k] || 0), 0);
  const part = soma('part'), conv = soma('conv'), at = soma('atendidos'), fa = soma('faltas'), fal = pct(fa, at + fa);
  const kpi = (n, txt, ico, cls) => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 22)}</span><span><b class="num">${n}</b><span>${txt}</span></span></div>`;
  if (per === 'painel') return `<div class="titulo-tela"><h1>Relatórios</h1><span class="sub">evolução dos últimos 6 meses · 3 unidades</span>
    <span class="titulo-acoes">${botaoExcel('exportRelatorio')}<span class="tabs" role="tablist">${relTabs(per)}</span></span></div>${telaPainel()}`;
  if (per === 'comissoes') return `<div class="titulo-tela"><h1>Relatórios</h1><span class="sub">comissões do mês</span>
    <span class="titulo-acoes"><span class="tabs" role="tablist">${relTabs(per)}</span></span></div>${telaComissoes()}`;
  const tag = u => u.aoVivo ? '<span class="tag-vivo">ao vivo</span>' : '<span class="tag-ex">exemplo</span>';
  const tabela = `<table class="tab"><thead><tr><th>Unidade</th><th class="dir">Particular</th><th class="dir">Convênio</th><th class="dir">Atendidos</th><th class="dir">Faltas</th></tr></thead><tbody>
    ${us.map(u => { const f = pct(u.faltas, u.atendidos + u.faltas); return `<tr><td><span class="td-pac"><span class="uni-ic">${ic('local', 18)}</span><b>${esc(u.nome)}</b> ${tag(u)}</span></td><td class="dir num"><b>${brl(u.part)}</b></td><td class="dir num">${brl(u.conv)}</td><td class="dir num">${u.atendidos}</td>
      <td class="dir num ${f >= FALTA_ALTA ? 'txt-erro' : ''}">${f >= FALTA_ALTA ? ic('alerta', 14) + ' ' : ''}${u.faltas} · ${f}%</td></tr>`; }).join('')}</tbody></table>`;
  const porForma = {}; if (per === 'hoje') us.forEach(u => Object.entries(u.porForma || {}).forEach(([f, v]) => { if (f !== 'Convênio') porForma[f] = (porForma[f] || 0) + v; }));
  const formas = Object.entries(porForma).sort((x, y) => y[1] - x[1]), maxF = formas.length ? formas[0][1] : 1;
  const cr = E.d.campanhaRetorno;
  const lado = per === 'hoje'
    ? `<div class="cartao"><h3>Por forma de pagamento</h3>${formas.map(([f, v]) => `<div class="rel-barra"><span>${formaHTML(f)}</span><span class="rel-trilho"><i style="width:${Math.round(v / maxF * 100)}%"></i></span><b class="num">${brl(v)}</b></div>`).join('')}</div>`
    : `<div class="cartao"><h3>Orçamentos no mês</h3><div class="rel-grande num">${pct(soma('orcAprov'), soma('orcFeitos'))}%</div><div class="muted">aprovados · ${soma('orcAprov')} de ${soma('orcFeitos')}</div></div>
       <div class="cartao"><h3>Retorno pelo WhatsApp <span class="tag-ex">exemplo</span></h3><div class="dono-funil"><div><b class="num">${milBR(cr.enviadas)}</b><span>mensagens</span></div>${ic('dir', 18)}<div><b class="num">${cr.marcadas}</b><span>marcaram</span></div>${ic('dir', 18)}<div><b class="num">${cr.vieram}</b><span>vieram</span></div></div>
         <div class="muted mini">custo ${brl(cr.custo)} · ${brl(Math.round(cr.custo / Math.max(1, cr.vieram)))} por paciente que veio</div></div>`;
  return `<div class="titulo-tela"><h1>Relatórios</h1><span class="sub">${per === 'mes' ? '01 a 29 de outubro' : 'quinta, 29 de outubro'} · 3 unidades</span>
    <span class="titulo-acoes"><span class="tabs" role="tablist">${relTabs(per)}</span></span></div>
  <div class="kpis-h">
    ${kpi(brl(part).replace(',00', ''), 'particular recebido', 'caixa', 'azul')}
    ${kpi(brl(conv).replace(',00', ''), 'convênio produzido', 'arquivo', 'teal')}
    ${kpi(at, 'atendidos', 'checks', 'verde')}
    ${kpi(`${fal}%`, `faltas · ${fa} de ${at + fa} consultas`, 'relogio', fal >= FALTA_ALTA ? 'vermelho' : 'ambar')}
  </div>
  <div class="grade-rel"><div class="cartao rel-uni"><div class="cartao-cab"><h3>Por unidade</h3></div>${tabela}</div><div class="rel-lado">${lado}</div></div>
  <p class="nota-leve">${ic('cadeado', 15)} Só totais. Prazeres e Norte são exemplo até entrarem no sistema.</p>`;
}
A.relPer = ds => { E.ui.pc.relPer = ds.v; render(); };

/* ---------- WHATSAPP (blueprint/12): listas automáticas → ver a mensagem → enviar com o custo à vista ---------- */
const WA_LISTAS = {
  amanha: { rot: 'Confirmar amanhã', cat: 'Utilidade', preco: 3.5, ico: 'agenda',
    msg: c => `Olá, ${c.nome.split(' ')[0]}! Sua consulta na Odonto Vip Boa Viagem é amanhã, sexta 30/10, às ${c.hora} com ${c.prof}. Responda SIM para confirmar ou REMARCAR para escolher outro horário.`,
    meta: c => `${c.hora} · ${c.prof} · ${c.proc}` },
  faltouOntem: { rot: 'Faltou ontem', cat: 'Utilidade', preco: 3.5, ico: 'x',
    msg: c => `Olá, ${c.nome.split(' ')[0]}. Sentimos sua falta ontem na Odonto Vip. Quer marcar outro horário? Responda REMARCAR e a recepção fala com você.`,
    meta: c => `era às ${c.hora} · ${c.prof}` },
  // aniversário (Nicolas, 03/11): no Dental Office já existe a origem "Levantamento (aniversariante)"
  aniversario: { rot: 'Aniversariantes', cat: 'Marketing', preco: 32.17, ico: 'presente', programa: true,
    msg: c => `Feliz aniversário, ${c.nome.split(' ')[0]}! A equipe da Odonto Vip deseja um ano cheio de sorrisos. Que tal aproveitar e marcar sua revisão? Responda QUERO e a gente agenda.`,
    meta: c => `aniversário ${c.dia} · a mensagem sai nesse dia · última consulta ${c.ultima}` },
  retornoMes: { rot: 'Retorno de 6 meses', cat: 'Marketing', preco: 32.17, ico: 'remarcar',
    msg: c => `Olá, ${c.nome.split(' ')[0]}! Já faz ${c.meses === 12 ? '1 ano' : `${c.meses || 6} meses`} da sua última consulta na Odonto Vip. Está na hora da revisão. Responda QUERO e a gente agenda para você.`,
    meta: c => `última consulta ${c.ultima} · ${c.prof}` },
};
function telaWhatsApp() {
  waSincRetornos(); waSincCobranca(); // T-018: retornos que vencem em 30 dias; parcelas atrasadas de agora
  const pc = E.ui.pc, k = pc.waLista || 'amanha', L = WA_LISTAS[k], w = E.d.whatsapp, lista = w[k];
  pc.waSel = pc.waSel || {};
  const sel = lista.filter(c => pc.waSel[c.id] !== false), envio = w.enviados.find(x => x.lista === k);
  const custo = Math.round(sel.length * L.preco), ex = sel[0] || lista[0];
  if (!lista.length) return `<div class="titulo-tela"><h1>WhatsApp</h1><span class="sub">mensagens para os pacientes</span></div>
  <div class="tabs wa-tabs" role="tablist">${Object.entries(WA_LISTAS).filter(([id]) => (w[id] || []).length || id === k).slice(0, 6).map(([id, x]) => `<button role="tab" aria-selected="${k === id}" class="${k === id ? 'on' : ''}" data-a="waLista" data-v="${id}">${ic(x.ico, 16)} ${x.rot} <span class="cont">${(w[id] || []).length}</span></button>`).join('')}</div>
  <div class="cartao"><div class="vazio">${ic('checks', 22)}<br>Ninguém em “${esc(L.rot)}” agora.<br><button class="btn btn-sec" style="margin-top:12px" data-a="waLista" data-v="amanha">Ver “Confirmar amanhã”</button></div></div>`;
  return `<div class="titulo-tela"><h1>WhatsApp</h1><span class="sub">mensagens para os pacientes</span>
    <span class="titulo-acoes"><span class="tag-ex">${ic('alerta', 14)} protótipo: nada é enviado de verdade</span></span></div>
  ${E.ui.waDesconectado ? `<div class="wa-caiu" role="alert">${ic('alerta', 22)}<span><b>O WhatsApp da clínica desconectou.</b> Nenhuma mensagem está saindo: elas ficam na fila até reconectar.</span><button class="btn" data-a="waReconectar">Reconectar</button></div>` : ''}
  ${(() => { // T-018: as 4 listas de todo dia à vista; as outras em "Mais listas"
    const aba = ([id, x]) => `<button role="tab" aria-selected="${k === id}" class="${k === id ? 'on' : ''}" data-a="waLista" data-v="${id}">${ic(x.ico, 16)} ${x.rot} <span class="cont">${w[id].length}</span></button>`;
    const todas = Object.entries(WA_LISTAS), fixas = todas.slice(0, 4), mais = todas.slice(4), atual = mais.find(([id]) => id === k);
    return `<div class="tabs wa-tabs" role="tablist">${fixas.map(aba).join('')}${mais.length ? `<details class="wa-mais"><summary class="${atual ? 'on' : ''}">${atual ? `${ic(atual[1].ico, 16)} ${atual[1].rot} <span class="cont">${w[k].length}</span>` : `Mais listas <span class="cont">${mais.length}</span>`}</summary><div class="wa-mais-menu">${mais.filter(([id]) => id !== k).map(aba).join('')}</div></details>` : ''}</div>`; })()}
  <div class="grade-wa">
    <div class="cartao h-lista"><div class="cartao-cab"><h3>${L.rot}</h3><span class="cont">${sel.length} de ${lista.length}</span>
      <button class="btn-link" style="margin-left:auto" data-a="waTodos">${sel.length === lista.length ? 'Desmarcar todos' : 'Marcar todos'}</button></div>
      ${lista.map((c, i) => `<label class="wa-linha"><input type="checkbox" ${pc.waSel[c.id] !== false ? 'checked' : ''} data-a="waSel" data-id="${c.id}" ${envio ? 'disabled' : ''}>
        <span class="av av${i % 4}">${esc(iniciais(c.nome))}</span><span class="h-pac-txt"><b>${esc(c.nome)}</b><span class="h-meta">${esc(L.meta(c))}</span></span>
        ${envio && envio.ids.includes(c.id) ? `${L.programa ? `<span class="est est-confirmado">${ic('relogio', 15)} Sai dia ${esc(c.dia)}</span>` : waSaiu(envio) ? `<span class="est est-chegou">${ic('check', 15)} Enviada</span>` : `<span class="est est-confirmado">${ic('relogio', 15)} Na fila</span>`}` : ''}</label>`).join('')}
      ${w.naoQuerem ? `<p class="nota-leve wa-nota">${ic('cadeado', 15)} ${w.naoQuerem} paciente pediu para não receber mensagens e fica fora da lista.</p>` : ''}</div>
    <div class="wa-lado">
      <div class="cartao"><h3>Mensagem</h3><div class="wa-fone"><div class="wa-balao">${esc(L.msg(ex))}<span class="wa-hora num">10:40</span></div></div></div>
      ${E.ui.clinicaSemInternet ? `<div class="aviso-box aviso">${ic('semrede', 16)} <b>Sem internet:</b> as mensagens ficam na fila e saem quando a internet voltar.</div>` : ''}
      ${envio ? `<div class="cartao wa-ok">${ic('checks', 22)}<div><b>${L.programa ? `Programado: cada um recebe no dia do aniversário ·` : waSaiu(envio) ? `Enviado às ${envio.hora} para` : `Na fila de envio às ${envio.hora} ·`} ${envio.ids.length} pacientes</b><span class="muted">custo estimado ${brl(envio.custo)} · ${L.programa || k !== 'amanha' ? 'quem responder QUERO ou REMARCAR aparece para a recepção agendar' : 'as respostas “SIM” confirmam a consulta sozinhas'}</span></div></div>`
        : `<button class="btn ${E.ui.waDesconectado ? 'btn-sec' : 'btn-pri'} wa-enviar" data-a="waEnviar" ${sel.length ? '' : 'disabled'}>${ic('enviar', 18)} ${sel.length ? `${E.ui.waDesconectado ? 'Pôr na fila:' : L.programa ? 'Programar para' : 'Enviar a'} ${sel.length} ${sel.length === 1 ? 'paciente' : 'pacientes'}` : 'Marque ao menos um paciente'}</button>${sel.length ? `<div class="wa-custo">custo estimado ${brl(custo)}</div>` : ''}`}
    </div>
  </div>`;
}
A.waLista = ds => { E.ui.pc.waLista = ds.v; render(); };
A.waSel = (ds, el) => { E.ui.pc.waSel[ds.id] = el.checked; render(); };
A.waTodos = () => { const pc = E.ui.pc, l = E.d.whatsapp[pc.waLista || 'amanha'], todos = l.every(c => pc.waSel[c.id] !== false); l.forEach(c => { pc.waSel[c.id] = !todos; }); render(); };
A.waEnviar = () => { const pc = E.ui.pc, k = pc.waLista || 'amanha', L = WA_LISTAS[k], ids = E.d.whatsapp[k].filter(c => pc.waSel[c.id] !== false).map(c => c.id);
  if (!ids.length) return;
  comDesfazer(L.programa ? `${ids.length} parabéns programados: cada um sai no dia do aniversário.` : `${ids.length} mensagens de “${L.rot}” na fila de envio.`, () => { E.d.whatsapp.enviados.push({ lista: k, ids, hora: hhmm(E.d.agoraMin), custo: Math.round(ids.length * L.preco), criado: Date.now() }); });
  // passados os 10 s do Desfazer, as mensagens saem (sem internet, continuam na fila)
  setTimeout(() => { if (E.ui.pc.tela === 'whatsapp') render(); }, 10100); };
const waSaiu = env => !E.ui.clinicaSemInternet && Date.now() - (env.criado || 0) > 10000;
