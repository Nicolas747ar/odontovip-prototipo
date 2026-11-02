/* Telas do computador — blueprint/06-pantallas-pc.md */
const K = 1.5; // px por minuto na agenda (40 min = 60 px: cabem hora, nome e procedimento)
const usuPC = () => usu(E.ui.pc.usuario);
function pode(acao, u = usuPC()) {
  const p = u.papel;
  return {
    caixa: ['recepcao', 'dono', 'admin'], clinico: ['dentista', 'dono'], indicar: ['dentista'], alerta: ['dentista'],
    finPac: ['recepcao', 'dono', 'admin'], config: ['dono'], evolucao: ['dentista'], recusar: ['dentista', 'recepcao', 'admin'], cadastro: ['recepcao', 'dono', 'admin'],
    anamnese: ['dentista'], // o dono lê a anamnese, mas quem preenche é a dentista (a ficha guarda qual profissional fez)
  }[acao].includes(p) || (!!u.fin && ['caixa', 'finPac'].includes(acao)); // fin: dentista da família que também cuida do financeiro
}

function pcHTML() {
  const u = usuPC(), pc = E.ui.pc;
  const menu = [['hoje', 'inicio', 'Hoje'], ['agenda', 'agenda', 'Agenda'], ['pacientes', 'pacientes', 'Pacientes']];
  if (pode('caixa')) menu.push(['caixa', 'caixa', 'Caixa']);
  const ativo = pc.tela === 'ficha' || pc.tela === 'novoPac' ? 'pacientes' : pc.tela;
  return `<div class="pc">
  <header class="pc-topo">
    <div class="marca"><img src="selo.png" alt=""><b>OdontoVip</b><span>· ${E.d.unidade}</span></div>
    <div class="busca">${ic('busca', 17, 'ic-busca')}<input id="busca-global" placeholder="Buscar paciente: nome, CPF, telefone ou nº   ( / )" data-ao="buscaGlobal" autocomplete="off"><div id="busca-res" class="busca-res"></div></div>
    ${E.ui.clinicaSemInternet
      ? '<span class="conexao aviso" title="O sistema funciona normal. Só o WhatsApp e o resumo do dono esperam a internet voltar."><span class="ponto"></span>Sem internet — tudo funciona</span>'
      : '<span class="conexao ok"><span class="ponto"></span>Conectado</span>'}
    <button class="btn-usuario" data-a="trocarUsuario">${esc(u.nome)} · ${u.rotulo} ${ic('baixo', 14)}</button>
  </header>
  <nav class="pc-menu">
    ${menu.map(([id, ico, nome]) => `<button class="menu-item ${ativo === id ? 'ativo' : ''}" data-a="tela" data-t="${id}"><span class="ico">${ic(ico, 19)}</span>${nome}</button>`).join('')}
    <div class="menu-sep"></div>
    ${pode('config') ? `<button class="menu-item ${pc.tela === 'config' ? 'ativo' : ''}" data-a="tela" data-t="config"><span class="ico">${ic('config', 19)}</span>Configurações</button>` : ''}
  </nav>
  <main class="pc-conteudo" data-scroll="pc-main">${telaPC()}</main>
  ${pc.painel ? '<div class="cortina" data-a="fecharPainel"></div>' + painelHTML() : ''}
  ${pc.modal ? '<div class="cortina"></div>' + modalHTML() : ''}
  ${pc.sobre ? sobreHTML('pc') : ''}
  </div>`;
}
function telaPC() {
  return ({ hoje: telaHoje, agenda: telaAgenda, pacientes: telaPacientes, novoPac: telaNovoPac, ficha: telaFicha, caixa: telaCaixa, config: telaConfig })[E.ui.pc.tela]();
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
  return `<span class="h-pac"><span class="h-nome"><b>${numNome(p)}</b>${alertas(p.id).length ? `<span class="alerta-ico" title="${esc(alertas(p.id).map(x => x.texto).join(' · '))}">${ic('alerta', 15)}</span>` : ''}</span>
    <span class="h-meta">${meta}</span></span>`;
}
// sem a cadeira: ela está na Agenda e no detalhe; aqui o procedimento precisa caber inteiro
const numNome = p => `nº&nbsp;${p.numero}&nbsp;· ${esc(p.nome)}`;
const metaAg = a => [prof(a.prof).curto, a.proc ? proc(a.proc).nome : ''].filter(Boolean).map(esc).join(' · ');
/* botão só com ícone: o nome aparece ao passar o mouse/focar e é lido pelo leitor de tela */
const botaoIco = (ico, dica, attrs, cls = '') => `<button class="btn-ico ${cls}" aria-label="${dica}" data-dica="${dica}" ${attrs}>${ic(ico, 18)}</button>`;

/* lista do dia no jeito do PEC (Danielle, R2–R5): horário marcado · chegada · símbolo do estado ·
   paciente · telefone · ações em ícone para a recepção ir marcando */
function linhaHoje(a) {
  const f = fixo(a.id); if (f) return linhaFixa(a.id, hhmm(a.ini), f);
  const p = pac(a.pac), ag = E.d.agoraMin, e = a.estado, at = `data-id="${a.id}"`;
  const marcar = (est, ico, dica, cls) => botaoIco(ico, dica, `data-a="estadoAg" data-o="hoje" ${at} data-e="${est}"`, cls);
  let acoes = '';
  if (e === 'a_confirmar') acoes += marcar('confirmado', 'check', 'Confirmar consulta');
  if (['a_confirmar', 'confirmado'].includes(e)) acoes += marcar('chegou', 'chegou', 'Presente na unidade', 'ok');
  if (['a_confirmar', 'confirmado'].includes(e) && a.ini < ag) acoes += marcar('faltou', 'x', 'Paciente ausente (faltou)', 'perigo');
  if (['a_confirmar', 'confirmado'].includes(e)) acoes += botaoIco('desmarcar', 'Cancelar consulta (pede o motivo)', `data-a="cancelarHoje" ${at}`);
  // atendido: o que falta fazer na saída fica à mão na própria linha
  const devido = e === 'atendido' ? aCobrarHoje(p.id) : 0, ret = e === 'atendido' ? retornoPendente(p.id) : null;
  if (devido && pode('caixa')) acoes += botaoIco('caixa', `Receber ${brl(devido)}`, `data-a="abrirReceber" data-pac="${p.id}"`, 'cobrar');
  if (ret) acoes += botaoIco('remarcar', 'Agendar o retorno pedido', `data-a="agendarRetorno" data-id="${ret.id}"`, 'retorno');
  // chegada: hora + quanto tempo está aguardando / em atendimento
  const desde = minDesde(a.chegouAs ?? a.ini);
  const chegada = a.chegouAs != null ? `<b class="num">${hhmm(a.chegouAs)}</b>${e === 'chegou' ? `<span class="h-espera ${desde >= 15 ? 'demora' : ''}">aguardando ${tempo(desde)}</span>`
    : e === 'em_atendimento' ? `<span class="h-espera atend">há ${tempo(desde)}</span>` : ''}` : '<span class="muted">—</span>';
  const extra = e === 'chegou' ? `aguardando ${tempo(desde)}` : e === 'em_atendimento' ? `há ${tempo(desde)}` : e === 'desmarcou' && a.motivo ? `motivo: ${esc(a.motivo)}`
    : [devido ? `falta pagar ${brl(devido)}` : '', ret ? 'pediu retorno' : ''].filter(Boolean).join(' · ');
  return `<div class="h-linha h-dia est-linha-${e}" data-a="abrirAg" ${at}><span class="hora num">${hhmm(a.ini)}</span><span class="h-chegada">${chegada}</span>
    <span class="h-est">${estadoIco(e, extra)}</span>${pacHoje(p, metaAg(a) + (e === 'desmarcou' && a.motivo ? ` · <span class="h-motivo">motivo: ${esc(a.motivo)}</span>` : ''))}<span class="h-tel num">${esc(p.cel)}</span><span class="acoes">${acoes}</span></div>`;
}
function itemAtencao(ico, cor, titulo, meta, acoes, quando, id) {
  const f = id && fixo(id);
  if (f) return `<div class="h-atencao h-feito" style="min-height:${f.altura}px"><span class="h-ico ok">${ic('check', 18)}</span><span class="h-feito-txt">${f.txt}</span><span class="acoes"><button class="btn btn-peq" data-a="desfazerFixo" data-id="${id}">Desfazer</button></span></div>`;
  return `<div class="h-atencao"><span class="h-ico ${cor}">${ic(ico, 18)}</span><span class="h-pac"><b>${quando ? `<span class="h-quando">${quando}</span>` : ''}${titulo}</b><span class="h-meta">${meta}</span></span><span class="acoes">${acoes}</span></div>`;
}
/* filtro da lista: os chips servem também de legenda dos símbolos (R6) */
// "Em aberto" (padrão) = quem ainda vai ser atendido hoje; "Todos" inclui atendidos, faltas e cancelados
const FILTROS_HOJE = [['abertos', null, 'Em aberto'], ['todos', null, 'Todos'], ['a_confirmar'], ['confirmado'], ['chegou'], ['em_atendimento'], ['atendido'], ['faltou'], ['desmarcou']];
function telaHoje() {
  const t = totaisDia(), ag = E.d.agoraMin, pc = E.ui.pc;
  const verFin = pode('finPac'), aba = verFin && pc.abaHoje === 'fin' ? 'fin' : 'agenda', filtro = pc.filtroHoje || 'abertos';
  const doDia = E.d.agendamentos.filter(a => a.pac && estadoPos(a) !== 'remarcado').sort((a, b) => a.ini - b.ini);
  const ativos = doDia.filter(a => ATIVOS.includes(estadoPos(a)));
  const naoVeio = ativos.filter(a => ['a_confirmar', 'confirmado'].includes(estadoPos(a)) && a.ini + 15 < ag);
  const vencidas = E.d.pacientes.filter(p => parcelasAbertas(p.id).some(x => x.venc < E.d.hoje));
  const vencHoje = Object.entries(E.d.parcelas).flatMap(([pid, ps]) => ps.filter(x => x.venc === E.d.hoje && saldoParcela(x) > 0).map(x => ({ pid, x })));
  const anteriores = E.d.pendentesAnteriores.filter(x => !x.fechado || fixo(x.id));
  // saída: atendido hoje com algo pendente na recepção (cobrar e/ou agendar o retorno)
  const saidas = [...new Set(doDia.filter(a => estadoPos(a) === 'atendido').map(a => a.pac))]
    .map(pid => ({ pid, ag: doDia.filter(a => a.pac === pid && estadoPos(a) === 'atendido').slice(-1)[0], devido: aCobrarHoje(pid), ret: retornoPendente(pid) }))
    .filter(s => (s.devido && pode('caixa')) || s.ret);
  const retornos = E.d.pedidosRetorno.filter(r => !r.feito && !saidas.some(s => s.ret === r));
  const grupo = (tit, itens) => itens.length ? `<div class="h-grupo">${tit} <span>${itens.length}</span></div>${itens.join('')}` : '';
  const pendencias = [
    grupo('Saída: cobrar e agendar retorno', saidas.map(s => { const p = pac(s.pid);
      const linhas = [`${esc(prof(s.ag.prof).curto)} · atendido`, s.devido && pode('caixa') ? `<b class="saida-valor">Cobrar ${brl(s.devido)}</b>` : '', s.ret ? `Retorno ${esc(resumoRetorno(s.ret)) || 'pedido'}` : ''].filter(Boolean).join('<br>');
      return itemAtencao('checks', 'ok', numNome(p), linhas,
        (s.devido && pode('caixa') ? `<button class="btn btn-peq btn-pri" data-a="abrirReceber" data-pac="${s.pid}">Receber ${brl(s.devido)}</button>` : '')
        + (s.ret ? `<button class="btn btn-peq" data-a="agendarRetorno" data-id="${s.ret.id}">Agendar retorno</button>` : '')); })),
    grupo('Não chegaram', naoVeio.map(a => { const p = pac(a.pac);
      return itemAtencao('relogio', 'aviso', numNome(p), `${esc(prof(a.prof).curto)} · atraso de ${tempo(minDesde(a.ini))}`,
        `<button class="btn btn-peq btn-ok" data-a="estadoAg" data-o="hoje" data-id="${a.id}" data-e="chegou">Presente</button><button class="btn btn-peq btn-perigo" data-a="estadoAg" data-o="hoje" data-id="${a.id}" data-e="faltou">Faltou</button>`, `Hoje ${hhmm(a.ini)}`, a.id); })),
    grupo('Pedidos de retorno', retornos.map(r => { const p = pac(r.pac);
      return itemAtencao('remarcar', 'info', numNome(p), `${esc(prof(r.prof).curto)} pediu o retorno${resumoRetorno(r) ? ' · ' + esc(resumoRetorno(r)) : ''}`, `<button class="btn btn-peq" data-a="agendarRetorno" data-id="${r.id}">Agendar</button>`); })),
    grupo('Ficaram abertas de outros dias', anteriores.map(x => { const p = pac(x.pac);
      return itemAtencao('calendarioX', 'neutro', numNome(p), `${esc(prof(x.prof).curto)} · ninguém marcou se veio`,
        `<button class="btn btn-peq btn-ok" data-a="fecharAnterior" data-id="${x.id}" data-e="atendido">Veio</button><button class="btn btn-peq btn-perigo" data-a="fecharAnterior" data-id="${x.id}" data-e="faltou">Faltou</button>`, `${dataBR(x.data)} ${hhmm(x.ini)}`, x.id); })),
  ].join('');
  const nPend = saidas.length + naoVeio.filter(a => !fixo(a.id)).length + retornos.length + anteriores.filter(x => !fixo(x.id)).length;
  const nFin = vencidas.length + vencHoje.length;
  const kpi = (n, txt, ico, cls = '') => `<div class="kpi kpi-h ${cls}"><span class="kpi-ic">${ic(ico, 18)}</span><b class="num">${n}</b><span>${txt}</span></div>`;
  const passa = (a, k) => k === 'todos' || (k === 'abertos' ? ATIVOS.includes(estadoPos(a)) : estadoPos(a) === k);
  const conta = k => doDia.filter(a => passa(a, k)).length;
  const chips = FILTROS_HOJE.filter(([k]) => ['abertos', 'todos'].includes(k) || conta(k)).map(([k, , rot]) => `<button class="${filtro === k ? 'on' : ''} chip-est-${k}" data-a="filtroHoje" data-v="${k}" aria-pressed="${filtro === k}">${ESTADOS[k] ? ic(ESTADOS[k][0], 15) : ''} ${rot || ESTADOS[k][1]} <span class="mini">${conta(k)}</span></button>`).join('');
  const lista = doDia.filter(a => passa(a, filtro));
  const agenda = `<div class="grade-2 grade-hoje">
    <div class="cartao"><h3>Pacientes de hoje <span class="h-cont">${doDia.filter(a => estadoPos(a) !== 'desmarcou').length}</span></h3>
      <div class="h-filtro" role="group" aria-label="Filtro da lista"><span class="h-filtro-rot">${ic('busca', 15)} Filtro</span>${chips}</div>
      <div class="h-dia h-dia-cab" aria-hidden="true"><span>Marcado</span><span>Chegada</span><span>Status</span><span>Paciente</span><span>Telefone</span><span></span></div>
      ${lista.map(linhaHoje).join('') || '<div class="vazio">Ninguém nesse filtro.</div>'}</div>
    <div class="cartao h-cartao-atencao"><h3>${ic('prancheta', 15)} Pendências diárias <span class="h-cont ${nPend ? 'alerta' : ''}">${nPend}</span></h3>${pendencias || `<div class="vazio">${ic('checks', 22)}<br>Tudo em dia.</div>`}</div>
  </div>`;
  // financeiro separado da agenda (R3): só quem tem acesso ao financeiro vê a aba
  const fin = `<div class="grade-2">
    <div class="cartao"><h3>Parcelas vencidas <span class="h-cont ${vencidas.length ? 'alerta' : ''}">${vencidas.length}</span></h3>
      ${vencidas.map(p => itemAtencao('caixa', 'erro', numNome(p), `${brl(parcelasAbertas(p.id).filter(x => x.venc < E.d.hoje).reduce((s, x) => s + saldoParcela(x), 0))} em atraso · ${esc(p.cel)}`,
        pode('caixa') ? `<button class="btn btn-peq" data-a="abrirReceber" data-pac="${p.id}">Receber</button>` : '')).join('') || '<div class="vazio">Nenhuma parcela vencida.</div>'}</div>
    <div class="cartao"><h3>Vence hoje e falta receber <span class="h-cont">${vencHoje.length}</span></h3>
      ${vencHoje.map(({ pid, x }) => itemAtencao('caixa', 'aviso', numNome(pac(pid)), `parcela ${x.n} de ${x.de} · falta ${brl(saldoParcela(x))}`,
        pode('caixa') ? `<button class="btn btn-peq" data-a="abrirReceber" data-pac="${pid}">Receber</button>` : '')).join('') || '<div class="vazio">Nada vence hoje.</div>'}
      ${pode('caixa') ? `<button class="btn-link" data-a="tela" data-t="caixa" style="margin-top:10px">Abrir o Caixa →</button>` : ''}</div>
  </div>`;
  return `<div class="titulo-tela"><h1>Hoje</h1><span class="sub">quinta, 29 de outubro · ${hhmm(ag)}</span><button class="btn btn-pri" style="margin-left:auto" data-a="novoAg">${ic('mais', 16)} Novo agendamento</button></div>
  <div class="kpis-h">
    ${kpi(t.agendados, 'agendados hoje', 'agenda')}${kpi(t.aConfirmar, 'a confirmar', 'relogio', t.aConfirmar ? 'kpi-aviso' : '')}
    ${kpi(t.naClinica, 'na unidade agora', 'chegou', 'kpi-destaque')}${kpi(t.atendidos, 'atendidos', 'checks')}${kpi(t.faltas, 'faltaram', 'x')}
  </div>
  ${verFin ? `<div class="abas" role="tablist"><button class="aba ${aba === 'agenda' ? 'ativo' : ''}" role="tab" aria-selected="${aba === 'agenda'}" data-a="abaHoje" data-v="agenda">${ic('agenda', 15)} Agenda do dia</button><button class="aba ${aba === 'fin' ? 'ativo' : ''}" role="tab" aria-selected="${aba === 'fin'}" data-a="abaHoje" data-v="fin">${ic('caixa', 15)} Financeiro${nFin ? ` <span class="h-cont alerta">${nFin}</span>` : ''}</button></div>` : ''}
  ${aba === 'fin' ? fin : agenda}`;
}
A.abaHoje = ds => { E.ui.pc.abaHoje = ds.v; render(); };
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
  if (!a.pac) return `<div class="ag-ev e-comp${passado}" style="top:${top}px;height:${h}px" data-a="abrirAg" data-id="${a.id}">
    <span class="ev-l1"><b class="num">${hhmm(a.ini)}–${fim}</b></span><span class="ev-nome">${esc(a.tipo)}</span>${h >= 52 && a.obs ? `<span class="ev-proc">${esc(a.obs)}</span>` : ''}</div>`;
  const p = pac(a.pac), al = alertas(p.id).length;
  const est = `<span class="ev-est">${ic(ESTADOS[a.estado][0], 13)}<span>${ESTADOS[a.estado][1]}</span></span>`;
  return `<div class="ag-ev e-${a.estado}${passado}${h < 52 ? ' baixo' : ''}" style="top:${top}px;height:${h}px" data-a="abrirAg" data-id="${a.id}" title="${hhmm(a.ini)}–${fim} · nº ${p.numero} ${esc(p.nome)} · ${ESTADOS[a.estado][1]}">
    <span class="ev-l1"><b class="num">${h < 52 ? hhmm(a.ini) : `${hhmm(a.ini)}–${fim}`}</b>${h < 52 ? '' : est}</span>
    <span class="ev-nome">${al ? `<span class="alerta-ico">${ic('alerta', 14)}</span>` : ''}nº ${p.numero} · ${esc(p.nome)}</span>
    ${h >= 52 && a.proc ? `<span class="ev-proc">${esc(proc(a.proc).nome)}</span>` : ''}${h < 52 ? est : ''}</div>`;
}
function telaAgenda() {
  const ver = E.ui.pc.agendaVer;
  const todas = ver === 'prof' ? E.d.profissionais.map(p => ({ id: p.id, nome: p.curto, sub: p.esp, ini: iniciaisProf(p.nome) }))
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
  const resumo = Object.keys(ESTADOS).map(e => [e, naTela.filter(a => a.pac && a.estado === e).length]).filter(([, n]) => n);
  const PLURAL = { a_confirmar: ['a confirmar', 'a confirmar'], confirmado: ['confirmado', 'confirmados'], chegou: ['presente na unidade', 'presentes na unidade'], em_atendimento: ['em atendimento', 'em atendimento'],
    atendido: ['atendido', 'atendidos'], faltou: ['faltou', 'faltaram'], desmarcou: ['desmarcou', 'desmarcaram'], remarcado: ['remarcado', 'remarcados'] };
  const linhas = `repeating-linear-gradient(to bottom,var(--rule) 0,var(--rule) 1px,transparent 1px,transparent ${30 * K}px),
    repeating-linear-gradient(to bottom,transparent 0,transparent ${60 * K - 1}px,#c9d6e6 ${60 * K - 1}px,#c9d6e6 ${60 * K}px)`;
  const agora = (E.d.agoraMin - 480) * K;
  return `<div class="titulo-tela"><h1>Agenda</h1>
    <span class="ag-dia"><button class="btn btn-peq btn-icone" data-a="outroDia" aria-label="Dia anterior">${ic('esq', 18)}</button><b>quinta, 29 de outubro</b><button class="btn btn-peq btn-icone" data-a="outroDia" aria-label="Próximo dia">${ic('dir', 18)}</button><button class="btn btn-peq" data-a="agendaHoje">Agora</button></span>
    <span style="margin-left:auto;display:flex;gap:10px;align-items:center"><span class="seg"><button class="${ver === 'prof' ? 'ativo' : ''}" data-a="verAgenda" data-v="prof">Por profissional</button><button class="${ver === 'cad' ? 'ativo' : ''}" data-a="verAgenda" data-v="cad">Por cadeira</button></span>
    <button class="btn btn-pri" data-a="novoAg">${ic('mais', 16)} Novo agendamento</button></span></div>
  <div class="ag-filtro" role="group" aria-label="Mostrar na agenda"><span class="h-filtro-rot">${ic('busca', 15)} Mostrar</span>
    <button class="${vis.length ? '' : 'on'}" data-a="agendaSo" data-id="" aria-pressed="${!vis.length}">${ic('agenda', 15)} Mapa geral</button>
    ${todas.map(c => `<button class="${vis.includes(c.id) ? 'on' : ''}" data-a="agendaSo" data-id="${c.id}" aria-pressed="${vis.includes(c.id)}"><span class="ag-av mini-av">${esc(c.ini)}</span> ${esc(c.nome)} <span class="mini">${contar(c.id)}</span></button>`).join('')}
    <span class="mini muted">Toque em mais de um para comparar</span></div>
  <div class="ag-resumo">${resumo.map(([e, n]) => `<span class="ag-res est-${e}">${ic(ESTADOS[e][0], 13)} <b>${n}</b> ${PLURAL[e][n === 1 ? 0 : 1]}</span>`).join('')}
    <span class="mini muted" style="margin-left:auto">Clique num horário livre para agendar · num agendamento para ver e mudar</span></div>
  <div class="agenda" data-scroll="agenda" style="grid-template-columns:64px repeat(${cols.length},minmax(180px,1fr))">
    <div class="ag-cab ag-cab-vazia"></div>${cols.map(c => `<div class="ag-cab"><span class="ag-av">${esc(c.ini)}</span><span class="ag-cab-txt"><b>${esc(c.nome)}</b><small>${esc(c.sub)}</small></span><span class="ag-cont">${contar(c.id)}</span></div>`).join('')}
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
    dur: o.dur || 30, tipo: o.tipo || 'Consulta', origem: o.origem || E.ui.ultimaOrigem, obs: o.obs || '', busca: '', cadNovo: null, remarcaDe: o.remarcaDe || null, retorno: o.retorno || null } };
  if (!o.pac) E.ui.foco = 'busca-ag';
  render();
}
A.novoAg = ds => abrirNovoAg(ds.pac ? { pac: ds.pac } : {});
function fAg() { return E.ui.pc.painel.f; }
function estadoBotaoAg(f) {
  const ini = paraMin(f.horaTxt), fim = ini + Number(f.dur);
  const c = f.pac ? conflitos({ ...f, ini, dur: Number(f.dur) }, f.remarcaDe) : [];
  let falta = '';
  if (f.cadNovo) falta = 'Termine o cadastro do paciente acima.';
  else if (!f.pac) falta = 'Escolha ou cadastre o paciente.';
  else if (!f.origem) falta = 'Escolha como o paciente chegou.';
  else if (c.length) falta = 'Esse horário está ocupado.';
  // mesmas regras do "Próximo horário livre" (proximoLivre): almoço 12:00–13:00 e fim às 18:00
  else if (ini < 780 && fim > 720) falta = `Termina às ${hhmm(fim)}: entra no almoço (12:00–13:00).`;
  else if (fim > 1080) falta = `Termina às ${hhmm(fim)}: passa das 18:00.`;
  const p = f.pac && pac(f.pac);
  const label = p ? `Agendar ${esc(p.nome.split(' ').slice(0, 2).join(' '))} · ${DIA} · ${f.horaTxt}` : 'Agendar';
  return { c, falta, label };
}
function conflitoHTML(f) {
  const { c } = estadoBotaoAg(f); if (!c.length) return '';
  const a = c[0], quem = a.pac ? `nº ${pac(a.pac).numero} ${esc(pac(a.pac).nome)}` : esc(a.tipo);
  const livre = proximoLivre({ ...f, ini: paraMin(f.horaTxt), dur: Number(f.dur) }, f.remarcaDe);
  return `<div class="aviso-box erro">Esse horário já está ocupado: ${esc(prof(a.prof).curto)}${a.cad ? ' · ' + cad(a.cad).nome : ''} tem ${quem} das ${hhmm(a.ini)} às ${hhmm(a.ini + a.dur)}.
    ${livre != null ? `<br>Próximo horário livre: <b>${hhmm(livre)}</b> <button class="btn btn-peq" data-a="usarHora" data-m="${livre}">Usar ${hhmm(livre)}</button>` : ''}</div>`;
}
A.avaliarAg = () => {
  const f = fAg(), s = estadoBotaoAg(f);
  const b = document.getElementById('btn-agendar'); if (!b) return;
  b.textContent = s.label; b.disabled = !!s.falta;
  document.getElementById('falta-ag').textContent = s.falta;
  document.getElementById('conflito-ag').innerHTML = conflitoHTML(f);
};
A.usarHora = ds => { const f = fAg(); f.ini = +ds.m; f.horaTxt = hhmm(+ds.m); render(); };
A.procAg = () => { const f = fAg(); if (f.proc) f.dur = proc(f.proc).dur; render(); };
A.profAg = () => { const f = fAg(); f.cad = prof(f.prof).cadeira; render(); };
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
  comDesfazer(`Agendado: ${esc(p.nome)} · ${f.horaTxt} com ${esc(prof(f.prof).curto)}.${voltou ? ' O cadastro voltou a ficar ativo.' : ''}`, () => {
    delete p.inativo; delete p.excluido;
    const novo = { id: uid(), pac: f.pac, prof: f.prof, cad: f.cad, ini, dur: Number(f.dur), proc: f.proc || null, tipo: f.tipo, origem: f.origem, estado: 'a_confirmar', obs: f.obs };
    E.d.agendamentos.push(novo);
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
  const f = fAg(), s = estadoBotaoAg(f), p = f.pac && pac(f.pac);
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
  <div class="painel-corpo">
    <div class="campo"><label>Paciente <span class="obrig">*</span></label>${pacHTML}</div>
    <div class="campo"><label>Procedimento <span class="muted">(define a duração)</span></label><select data-campo="pc.painel.f.proc" data-ao="procAg"><option value="">— nenhum —</option>${E.d.procedimentos.map(x => `<option value="${x.id}" ${x.id === f.proc ? 'selected' : ''}>${x.nome} · ${x.dur} min</option>`).join('')}</select></div>
    <div class="tres"><div class="campo"><label>Data</label><input value="qui 29/10" disabled></div>
      <div class="campo"><label>Hora</label><select data-campo="pc.painel.f.horaTxt" data-ao="avaliarAg">${horariosDoDia(f.horaTxt).map(h => `<option ${h === f.horaTxt ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
      <div class="campo"><label>Duração</label><select data-campo="pc.painel.f.dur" data-ao="avaliarAg">${[10, 20, 30, 40, 60, 90, 120].map(m => `<option value="${m}" ${m == f.dur ? 'selected' : ''}>${m} min</option>`).join('')}</select></div></div>
    <div class="duas"><div class="campo"><label>Profissional</label><select data-campo="pc.painel.f.prof" data-ao="profAg">${E.d.profissionais.map(x => `<option value="${x.id}" ${x.id === f.prof ? 'selected' : ''}>${x.curto}</option>`).join('')}</select></div>
      <div class="campo"><label>Cadeira</label><select data-campo="pc.painel.f.cad" data-ao="avaliarAg">${E.d.cadeiras.map(x => `<option value="${x.id}" ${x.id === f.cad ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></div></div>
    ${f.retorno ? (r => r && r.quando ? `<div class="aviso-box info">A dentista pediu o retorno <b>${QUANDO_RETORNO[r.quando]}</b>. No protótipo só existe o dia de hoje: no sistema real a data já vem marcada.</div>` : '')(E.d.pedidosRetorno.find(x => x.id === f.retorno)) : ''}
    <div id="conflito-ag">${conflitoHTML(f)}</div>
    ${f.origemDoCadastro ? `<div class="campo"><label>Como chegou?</label><div class="muted">${esc(f.origem)} <span class="mini">(do cadastro)</span></div></div>` : `<div class="campo"><label>Como chegou? <span class="obrig">*</span></label><select data-campo="pc.painel.f.origem" data-ao="avaliarAg">${E.d.origens.map(x => `<option ${x === f.origem ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`}
    <div class="campo"><label>Tipo</label><select data-campo="pc.painel.f.tipo">${['Consulta', 'Retorno', 'Periódico', 'Outro'].map(x => `<option ${x === f.tipo ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <div class="campo"><label>Observação</label><textarea rows="2" data-campo="pc.painel.f.obs">${esc(f.obs)}</textarea></div>
  </div>
  <div class="painel-rodape"><button id="btn-agendar" class="btn btn-pri" style="width:100%;min-height:46px" data-a="salvarAg" ${s.falta ? 'disabled' : ''}>${s.label}</button>
    <div id="falta-ag" class="ajuda" style="text-align:center;margin-top:6px">${s.falta}</div></div></aside>`;
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
    return `<tr class="clic" data-a="abrirFicha" data-id="${p.id}"><td><b>${numNome(p)}</b>${p.inativo ? ` <span class="tag inativo">inativo · ${esc(p.inativo.motivo.toLowerCase())}</span>` : ''} ${alertas(p.id).length ? `<span class="alerta-ico">${ic('alerta', 15)}</span>` : ''}</td>
    <td>${idade(p.nasc)}</td><td class="num">${esc(p.cel)}</td><td>${conv(p.conv).nome}</td><td>${prox ? 'hoje ' + hhmm(prox.ini) : '—'}</td></tr>`; }).join('')
    || `<tr><td colspan="5" class="vazio">Ninguém com “${esc(t)}”. <button class="btn-link" data-a="novoPaciente" data-nome="${esc(t)}">+ Cadastrar</button></td></tr>`;
}
function telaPacientes() {
  const n = k => E.d.pacientes.filter(p => k === 'excluidos' ? p.excluido : !p.excluido && (k === 'inativos' ? p.inativo : !p.inativo)).length, aba = E.ui.pc.abaPacs || 'ativos';
  const bot = (k, t) => `<button class="${aba === k ? 'ativo' : ''}" data-a="abaPacs" data-v="${k}">${t} <span class="mini">${n(k)}</span></button>`;
  return `<div class="titulo-tela"><h1>Pacientes</h1><span class="seg">${bot('ativos', 'Ativos')}${bot('inativos', 'Inativos')}${bot('excluidos', 'Excluídos')}</span><button class="btn btn-pri" style="margin-left:auto" data-a="novoPaciente">${ic('mais', 16)} Novo paciente</button></div>
  <input id="busca-pacs" placeholder="Buscar por nome, CPF, telefone ou nº" value="${esc(E.ui.pc.buscaPac)}" data-campo="pc.buscaPac" data-ao="filtraPacs" style="width:100%;max-width:520px;padding:10px 12px;border:1px solid var(--rule);border-radius:8px;margin-bottom:12px">
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
  return `<div class="titulo-tela"><h1>Novo paciente</h1><span class="sub">Os campos com * são obrigatórios</span></div>
  <div class="cartao" style="max-width:640px">
    <div class="campo"><label>Nome completo <span class="obrig">*</span></label><input id="np-nome" class="${campoErro(n) === 'nome' ? 'com-erro' : ''}" value="${esc(n.nome)}" data-campo="pc.novoPac.nome">${campoErro(n) === 'nome' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div>
    <div class="duas"><div class="campo"><label>Celular <span class="obrig">*</span></label><input id="np-cel" class="${campoErro(n) === 'cel' ? 'com-erro' : ''}" placeholder="(81) 9____-____" value="${esc(n.cel)}" data-ao="mCel" data-campo="pc.novoPac.cel">${campoErro(n) === 'cel' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div>
      <div class="campo"><label>Data de nascimento <span class="obrig">*</span> <span id="np-idade" class="muted">${idadeTxt(n.nasc)}</span></label><input id="np-nasc" class="${campoErro(n) === 'nasc' ? 'com-erro' : ''}" placeholder="dd/mm/aaaa" value="${esc(n.nasc)}" data-ao="mDataNP" data-idade="np-idade" data-campo="pc.novoPac.nasc">${campoErro(n) === 'nasc' ? `<em class="cel-erro">${n.erro}</em>` : ''}</div></div>
    <div class="duas"><div class="campo"><label>CPF <span class="muted">(recomendado)</span></label><input placeholder="___.___.___-__" value="${esc(n.cpf)}" data-ao="mCpf" data-campo="pc.novoPac.cpf"></div>
      <div class="campo"><label>Convênio</label><select data-campo="pc.novoPac.conv" data-ao="reNP">${E.d.convenios.map(c => `<option value="${c.id}" ${c.id === n.conv ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></div></div>
    ${n.conv !== 'part' ? `<div class="duas"><div class="campo"><label>Nº da carteirinha</label><input value="${esc(n.cart)}" data-campo="pc.novoPac.cart"></div><div class="campo"><label>Validade</label><input placeholder="dd/mm/aaaa" value="${esc(n.valid)}" data-ao="mData" data-campo="pc.novoPac.valid"></div></div>` : ''}
    ${menor ? `<div class="campo"><label>Responsável <span class="obrig">*</span> <span class="muted">(menor de 18)</span></label><input value="${esc(n.resp)}" data-campo="pc.novoPac.resp"></div>` : ''}
    <div class="campo"><label>Como chegou? <span class="obrig">*</span></label><select data-campo="pc.novoPac.origem">${E.d.origens.map(x => `<option ${x === n.origem ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <button class="btn-link" data-a="maisDados">${ic(n.mais ? 'baixo' : 'dir', 15)} Mais dados (endereço, RG, CNS, nº no Dental Office, observações)</button>
    ${n.mais ? `<div class="campo" style="margin-top:8px"><label>Nº no Dental Office <span class="muted">(se veio de Prazeres ou Norte)</span></label><input value="${esc(n.numDO || '')}" data-campo="pc.novoPac.numDO" inputmode="numeric"></div><div class="duas"><div class="campo"><label>CEP</label><input value="${esc(n.cep || '')}" data-campo="pc.novoPac.cep" ></div><div class="campo"><label>Endereço</label><input value="${esc(n.end || '')}" data-campo="pc.novoPac.end" ></div><div class="campo"><label>RG</label><input value="${esc(n.rg || '')}" data-campo="pc.novoPac.rg" ></div><div class="campo"><label>Nº do CNS</label><input value="${esc(n.cns || '')}" data-campo="pc.novoPac.cns" ></div></div><div class="campo"><label>Observações</label><textarea rows="2" data-campo="pc.novoPac.obs">${esc(n.obs || '')}</textarea></div>` : ''}
    ${n.dup ? `<div class="aviso-box aviso">Já existe <b>${numNome(pac(n.dup))}</b>${situacaoPac(pac(n.dup))}, ${idade(pac(n.dup).nasc)} anos, ${ult4(pac(n.dup).cel)}. É a mesma pessoa?<br>
      <button class="btn btn-peq btn-pri" data-a="${pac(n.dup).excluido || pac(n.dup).inativo ? 'restaurarEAbrir' : 'abrirFicha'}" data-id="${n.dup}" style="margin-top:6px">${pac(n.dup).excluido ? 'Sim, restaurar e abrir' : pac(n.dup).inativo ? 'Sim, reativar e abrir' : 'Sim, abrir'} nº ${pac(n.dup).numero}</button> <button class="btn btn-peq" data-a="salvarNP" data-forcar="1" style="margin-top:6px">Não, cadastrar outra pessoa</button></div>` : ''}
    ${n.erro && !['nome', 'cel', 'nasc'].includes(campoErro(n)) ? `<div class="aviso-box erro">${n.erro}</div>` : ''}
    <div style="margin-top:12px"><button class="btn btn-pri" data-a="salvarNP">Cadastrar paciente</button></div>
  </div>`;
}
A.mDataNP = (ds, el) => mDataComMenor(ds, el, 'np-nasc');
A.reNP = () => render();
A.maisDados = () => { E.ui.pc.novoPac.mais = !E.ui.pc.novoPac.mais; render(); };
/* em qual campo está o erro, para mostrar embaixo dele */
const campoErro = n => !n.erro ? '' : /nome/i.test(n.erro) ? 'nome' : /celular/i.test(n.erro) ? 'cel' : /nascimento|data/i.test(n.erro) ? 'nasc' : /respons/i.test(n.erro) ? 'resp' : '';
A.salvarNP = ds => {
  const n = E.ui.pc.novoPac; n.erro = validarNovo(n);
  if (!n.erro && ehMenor(n.nasc) && !n.resp.trim()) n.erro = 'Menor de 18: informe o responsável.';
  if (n.erro) { E.ui.foco = { nome: 'np-nome', cel: 'np-cel', nasc: 'np-nasc' }[campoErro(n)] || null; render(); return; }
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
    <div><div class="nome">${numNome(p)}</div><div class="muted">${idade(p.nasc)} anos · ${esc(p.cel)} · ${conv(p.conv).nome}${p.responsavel ? ' · resp.: ' + esc(p.responsavel) : ''}</div></div>
    <div class="acoes" style="margin-left:auto">${p.excluido ? '' : `<button class="btn" data-a="novoAg" data-pac="${p.id}">${ic('agenda', 16)} ${p.inativo ? 'Reativar e agendar' : 'Agendar'}</button>${pode('caixa') && pc.aba !== 'financeiro' ? `<button class="btn" data-a="abrirReceber" data-pac="${p.id}">${ic('caixa', 16)} Receber</button>` : ''}`}</div></div></div>
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
  return `<div class="resumo-grade">
    <div class="cartao"><h3>Próxima consulta</h3>${prox ? `<b>hoje ${hhmm(prox.ini)}</b> · ${esc(prof(prox.prof).curto)} ${estadoHTML(prox.estado)}` : '<span class="muted">Nenhuma agendada.</span> <button class="btn-link" data-a="novoAg" data-pac="' + p.id + '">Agendar</button>'}</div>
    <div class="cartao"><h3>Plano de tratamento</h3>${pl.length ? `<b>${feitos} de ${pl.length}</b> feitos${(n => n ? ` · <b>${n}</b> ${n === 1 ? 'espera' : 'esperam'} orçamento` : '')(pl.filter(i => i.estado === 'indicado').length)}<div class="prog"><i style="width:${pl.length ? feitos / pl.length * 100 : 0}%"></i></div>` : '<span class="muted">Sem plano.</span>'}</div>
    <div class="cartao"><h3>${pode('clinico') ? 'Última evolução' : 'Última consulta'}</h3>${ult ? `<b>${dataBR(ult.data)}</b> · ${esc(prof(ult.por).curto)}${pode('clinico') ? '<br>' + esc(ult.texto) : ''}` : '<span class="muted">Nenhuma.</span>'}</div>
    <div class="cartao"><h3>Financeiro</h3>${pode('finPac') ? (saldo ? `Em aberto: <b>${brl(saldo)}</b>` : '<span class="muted">Nada em aberto.</span>') + (p.credito ? `<br>Crédito: <b>${brl(p.credito)}</b>` : '') : '<span class="muted">—</span>'}</div>
    <div class="cartao"><h3>Anamnese</h3>${an ? `Última: <b>${dataBR(an.data)}</b> (${E.d.modelos.find(m => m.id === an.modelo).nome}) · ${an.assinada ? `<span style="color:var(--ok)">${ic('assinar', 14)} assinada</span>` : '<span class="muted">sem assinatura</span>'}` : '<span class="muted">Nenhuma ficha preenchida.</span>'}</div>
    <div class="cartao"><h3>Arquivos</h3>${(E.d.arquivos[p.id] || []).length ? `<b>${(E.d.arquivos[p.id] || []).length}</b> · último: ${esc(E.d.arquivos[p.id].slice(-1)[0].tipo)} de ${dataBR(E.d.arquivos[p.id].slice(-1)[0].data)}` : '<span class="muted">Nenhum.</span>'}</div>
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
      <div style="margin-top:12px"><button class="btn btn-pri" data-a="salvarAnam">Salvar ficha</button> <button class="btn-link" data-a="aba" data-id="anamnese">Cancelar</button></div></div>`;
  }
  const lista = (E.d.anamneses[p.id] || []).slice().reverse();
  return `${pode('anamnese') ? '<button class="btn btn-pri" data-a="anamNova" style="margin-bottom:12px">+ Preencher ficha</button>' : ''}
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
function itemPlano(i) {
  const quem = i.feitoPor ? (i.feitoPor !== i.indicadoPor ? `indicado por ${prof(i.indicadoPor).curto} · <b>feito por ${prof(i.feitoPor).curto}</b> em ${dataBR(i.dataFeito)}` : `indicado e feito por ${prof(i.feitoPor).curto} · ${dataBR(i.dataFeito)}`)
    : `indicado por ${prof(i.indicadoPor).curto} em ${dataBR(i.dataInd)}${i.dataApr ? ` · aprovado em ${dataBR(i.dataApr)}` : ''}`;
  return `<div class="item-plano pl-linha">${pilulaPlano(i.estado)}
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
  return { pl, bruto, total, n, parcela: Math.floor(total / n / 100) * 100 };
}
function modalOrc() {
  const m = E.ui.pc.modal, c = contaOrc(m), p = pac(E.ui.pc.fichaId);
  return `<div class="modal"><div class="painel-cab"><h2>Orçamento · ${numNome(p)}</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="mini muted" style="margin-bottom:6px">Desmarque o que o paciente não quer agora. Fica guardado como indicado, para outro dia.</div>
    ${c.pl.map(i => `<label class="item-plano" style="cursor:pointer"><input type="checkbox" ${m.sel[i.id] ? 'checked' : ''} data-a="orcSel" data-id="${i.id}" style="width:20px;height:20px"><span><b>${esc(nomeItem(i))}</b><br><span class="quem">indicado por ${prof(i.indicadoPor).curto}</span></span><span class="valor num">${brl(i.valor)}</span></label>`).join('')}
    <div class="campo" style="margin-top:12px"><label>Forma</label><span class="seg"><button class="${m.forma === 'vista' ? 'ativo' : ''}" data-a="orcForma" data-v="vista">À vista</button><button class="${m.forma === 'parc' ? 'ativo' : ''}" data-a="orcForma" data-v="parc">Parcelado</button></span>
      ${m.forma === 'parc' ? ` em <select data-campo="pc.modal.n" data-ao="orcRe" style="width:auto;display:inline-block;padding:6px 8px">${PARCELAS_OPCOES.map(n => `<option ${n == m.n ? 'selected' : ''}>${n}</option>`).join('')}</select> vezes` : ''}</div>
    <div class="duas"><div class="campo"><label>Desconto (R$)</label><input id="orc-desc" data-selecionar inputmode="decimal" value="${esc(m.desc)}" placeholder="0,00" data-campo="pc.modal.desc" data-ao="orcRecalc"></div>
      ${m.forma === 'parc' ? `<div class="campo"><label>1ª parcela vence</label><select data-campo="pc.modal.primeiro" data-ao="orcRe"><option value="hoje" ${m.primeiro === 'hoje' ? 'selected' : ''}>Hoje (29/10)</option><option value="30" ${m.primeiro === '30' ? 'selected' : ''}>Em 30 dias (29/11)</option></select></div>` : '<div></div>'}</div>
    <div id="orc-tot" class="aviso-box info">${orcResumo(c)}</div>
  </div><div class="painel-rodape rodape-dir"><button class="btn" data-a="imprimirOrc">Imprimir para o paciente</button><button id="btn-orc" class="btn btn-pri" style="min-height:46px" data-a="aprovarOrc" ${orcOk(c) ? '' : 'disabled'}>Aprovar orçamento de ${brl(c.total)}</button></div></div>`;
}
const orcResumo = c => { const ult = c.total - c.parcela * (c.n - 1);
  const parc = c.n > 1 ? (ult === c.parcela ? ` · ${c.n}x de <b>${brl(c.parcela)}</b>` : ` · ${c.n - 1}x de <b>${brl(c.parcela)}</b> + 1x de <b>${brl(ult)}</b>`) : ' · à vista';
  // parcela mínima respondida pelo dono (blueprint/11-pendientes.md 12b): abaixo dela não dá para aprovar
  const pequena = c.n > 1 && c.parcela < PARCELA_MIN ? `<div class="aviso-box erro" style="margin-top:8px">Cada parcela ficaria em <b>${brl(c.parcela)}</b>. A parcela mínima é ${brl(PARCELA_MIN)}: diminua as vezes ou faça à vista.</div>` : '';
  return `Total do orçamento: <b>${brl(c.total)}</b>${c.bruto !== c.total ? ` <span class="mini">(de ${brl(c.bruto)})</span>` : ''}${parc}${pequena}`; };
/* resposta da família (02/11): até 3x, parcela mínima de R$ 200,00 */
const PARCELA_MIN = 20000, PARCELAS_OPCOES = [2, 3];
/* parcelas arredondam para reais: valor pequeno em muitas vezes daria parcelas de R$ 0,00 */
const orcOk = c => c.total > 0 && (c.n === 1 || c.parcela >= PARCELA_MIN);
A.orcSel = (ds, el) => { E.ui.pc.modal.sel[ds.id] = el.checked; render(); };
A.orcForma = ds => { E.ui.pc.modal.forma = ds.v; render(); };
A.orcRe = () => render();
A.orcRecalc = () => { const c = contaOrc(E.ui.pc.modal); document.getElementById('orc-tot').innerHTML = orcResumo(c);
  const b = document.getElementById('btn-orc'); b.textContent = `Aprovar orçamento de ${brl(c.total)}`; b.disabled = !orcOk(c); };
A.imprimirOrc = () => toast('No sistema real, abre o PDF do orçamento para imprimir ou mandar.');
A.aprovarOrc = () => {
  const m = E.ui.pc.modal, c = contaOrc(m), pid = E.ui.pc.fichaId;
  if (!orcOk(c)) return;
  comDesfazer(`Orçamento aprovado: ${brl(c.total)}${c.n > 1 ? ` em ${c.n}x` : ''}.`, () => {
    c.pl.filter(i => m.sel[i.id]).forEach(i => { i.estado = 'aprovado'; i.dataApr = E.d.hoje; });
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
  return `${pode('evolucao') && !f ? '<button class="btn btn-pri" data-a="novaEvoPC" style="margin-bottom:12px">+ Nova evolução</button>' : ''}${form}
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
  // o que foi feito sem orçamento vira cobrança de hoje, para a recepção receber na saída.
  // Aprovado já tem parcelas; convênio é pago pelo plano (glosa fica para o sistema real) — ver USABILIDADE-FAMILIA.md
  if (cobrar && pac(pid).conv === 'part') gerarParcelas(pid, cobrar, 1, E.d.hoje);
}
A.salvarEvoPC = () => { const f = E.ui.pc.evoForm, pid = E.ui.pc.fichaId;
  comDesfazer('Evolução salva.', () => { salvarEvolucao(pid, usuPC().prof, f.texto, Object.keys(f.itens).filter(k => f.itens[k])); E.ui.pc.evoForm = null; }); };

/* arquivos, financeiro, dados */
function abaArquivos(p) {
  const arqs = E.d.arquivos[p.id] || [];
  return `<button class="btn btn-pri" data-a="enviarArq" style="margin-bottom:12px">+ Enviar arquivo</button> <span class="mini muted">ou arraste para cá</span>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${arqs.map(a => `<div class="cartao" style="text-align:center"><div class="arq-ic">${ic(a.tipo === 'Radiografia' ? 'dente' : a.tipo === 'Ficha em papel' ? 'arquivo' : 'foto', 32)}</div><b class="mini">${esc(a.tipo)}</b><div class="mini muted">${esc(a.nome)} · ${dataBR(a.data)}</div></div>`).join('') || '<div class="vazio">Nenhum arquivo.</div>'}</div>`;
}
A.enviarArq = () => toast('No sistema real, abre o seletor de arquivos (radiografia, foto, documento).');
function abaFinanceiro(p) {
  const ps = parcelas(p.id), recs = E.d.recebimentos.filter(r => r.pac === p.id);
  return `<div style="display:flex;gap:8px;margin-bottom:12px"><button class="btn btn-pri" data-a="abrirReceber" data-pac="${p.id}">Receber pagamento</button>${(n => n ? `<button class="btn" data-a="abrirOrc">Gerar orçamento (${n} ${n === 1 ? 'indicado' : 'indicados'})</button>` : '')(plano(p.id).filter(i => i.estado === 'indicado').length)}</div>
  ${p.credito ? `<div class="aviso-box info">Crédito do paciente: <b>${brl(p.credito)}</b> (pagou a mais). Ainda não é descontado sozinho das próximas parcelas.</div>` : ''}
  <table class="tab tab-fin"><thead><tr><th>Parcela</th><th>Vence</th><th class="dir">Valor</th><th class="dir">Pago</th><th class="dir">Falta</th><th>Situação</th></tr></thead><tbody>
  ${ps.map(x => { const s = saldoParcela(x), st = !s ? 'paga' : x.venc < E.d.hoje ? 'vencida' : x.pago ? 'parcial' : 'aberta';
    return `<tr><td>${x.n} de ${x.de}</td><td class="num">${dataBR(x.venc)}</td><td class="num dir">${brl(x.valor)}</td><td class="num dir">${brl(x.pago)}</td><td class="num dir"><b>${brl(s)}</b></td><td><span class="tag ${st}">${{ paga: 'Paga', vencida: 'Vencida', parcial: 'Paga em parte', aberta: 'Em aberto' }[st]}</span></td></tr>`; }).join('') || '<tr><td colspan="6" class="vazio">Sem parcelas.</td></tr>'}</tbody></table>
  ${recs.length ? `<div class="grupo-tit">Recebimentos</div>${recs.map(r => `<div class="linha"><span class="hora num">hoje ${hhmm(r.hora)}</span>${formaHTML(r.forma)}<span class="acoes num"><b>${brl(r.valor)}</b></span></div>`).join('')}` : ''}`;
}
/* todos os campos do cadastro, editáveis; "Salvar alterações" só acende se algo mudou */
const CAMPOS_DADOS = [['nome', 'Nome completo'], ['cel', 'Celular'], ['nascBR', 'Data de nascimento'], ['cpf', 'CPF'], ['rg', 'RG'], ['cns', 'Nº do CNS'],
  ['carteirinha', 'Nº da carteirinha'], ['validadeCart', 'Validade da carteirinha'],
  ['responsavel', 'Responsável'], ['cep', 'CEP'], ['end', 'Endereço'], ['numeroDentalOffice', 'Nº no Dental Office'], ['obs', 'Observações']];
const dadosPC = p => ({ ...Object.fromEntries(CAMPOS_DADOS.map(([k]) => [k, k === 'nascBR' ? dataBRc(p.nasc) : (p[k] || '')])), conv: p.conv, origem: p.origem || '' });
function abaDados(p) {
  const pc = E.ui.pc; if (!pc.dados || pc.dados.id !== p.id) pc.dados = { id: p.id, f: dadosPC(p) };
  const f = pc.dados.f, mudou = JSON.stringify(f) !== JSON.stringify(dadosPC(p));
  const campo = ([k, rot]) => `<div class="campo"><label>${rot}</label>${k === 'obs' ? `<textarea rows="2" data-campo="pc.dados.f.${k}" data-ao="dadosMudou">${esc(f[k])}</textarea>` : `<input value="${esc(f[k])}" data-campo="pc.dados.f.${k}" data-ao="dadosMudou">`}</div>`;
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
  if (f.cpf && f.cpf !== p.cpf && !cpfValido(f.cpf)) { toast('Esse CPF não existe. Confira os números ou deixe em branco.'); return; }
  const novo = { ...f, nasc: iso }; delete novo.nascBR; pc.dados = null;
  comDesfazer('Dados salvos.', () => Object.assign(p, novo)); };

/* ---------- receber pagamento ---------- */
A.abrirReceber = ds => { const p = ds.pac ? pac(ds.pac) : null; const ab = p ? parcelasAbertas(p.id) : [];
  E.ui.pc.modal = { tipo: 'rec', pac: p ? p.id : null, valorTxt: ab[0] ? (saldoParcela(ab[0]) / 100).toFixed(2).replace('.', ',') : '', forma: null, okExcesso: false };
  E.ui.foco = p ? 'rec-valor' : 'rec-busca'; render(); };
A.recBusca = (ds, el) => { const r = buscarPacientes(el.value); document.getElementById('rec-res').innerHTML = r.map(p => resultadoPac(p, 'recPac')).join(''); };
A.recPac = ds => { const ab = parcelasAbertas(ds.id); Object.assign(E.ui.pc.modal, { pac: ds.id, valorTxt: ab[0] ? (saldoParcela(ab[0]) / 100).toFixed(2).replace('.', ',') : '' }); E.ui.foco = 'rec-valor'; render(); };
A.recForma = ds => { E.ui.pc.modal.forma = ds.v; render(); };
const totalAberto = pid => parcelasAbertas(pid).reduce((s, x) => s + saldoParcela(x), 0);
function recPrevia(m) {
  const v = lerReais(m.valorTxt), { res, sobra } = distribuir(m.pac, v), aberto = totalAberto(m.pac);
  return { v, aberto, excesso: aberto > 0 && v > aberto, html: res.map(r => `<div class="mini">Parcela ${r.p.n}/${r.p.de} (vence ${dataBR(r.p.venc)}): <b>${brl(r.usa)}</b> ${r.quita ? '→ <span class="res-ok">quitada</span>' : `→ fica faltando ${brl(saldoParcela(r.p) - r.usa)}`}</div>`).join('')
    + (sobra > 0 && res.length ? `<div class="aviso-box aviso">Atenção: isso é <b>mais</b> do que deve (${brl(aberto)}). Sobram ${brl(sobra)}, que ficam como crédito.</div>` : '') };
}
function rotuloRec(m, pv) {
  if (!pv.v) return { txt: 'Digite o valor recebido', off: true };
  if (!m.forma) return { txt: 'Escolha a forma de pagamento', off: true };
  if (pv.excesso && !m.okExcesso) return { txt: `Receber ${brl(pv.v)} — é mais do que deve`, off: false };
  return { txt: `Receber ${brl(pv.v)} de ${pac(m.pac).nome.split(' ')[0]} · ${m.forma}`, off: false };
}
A.recPreview = () => { const m = E.ui.pc.modal, pv = recPrevia(m), r = rotuloRec(m, pv); m.okExcesso = false;
  document.getElementById('rec-prev').innerHTML = pv.html; const b = document.getElementById('btn-rec'); b.textContent = r.txt; b.disabled = r.off; };
function modalRec() {
  const m = E.ui.pc.modal;
  if (!m.pac) return `<div class="modal"><div class="painel-cab"><h2>Receber pagamento</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="campo"><label>De quem?</label><input id="rec-busca" placeholder="Nome, CPF, telefone ou nº" data-ao="recBusca" autocomplete="off"></div><div id="rec-res"></div></div></div>`;
  const p = pac(m.pac), ab = parcelasAbertas(p.id), pv = recPrevia(m), r = rotuloRec(m, pv);
  return `<div class="modal"><div class="painel-cab"><h2>Receber pagamento</h2><button class="fechar" data-a="fecharModal" aria-label="Fechar">${ic('x', 20)}</button></div><div class="painel-corpo">
    <div class="chip-pac"><b>${numNome(p)}</b></div>
    <div class="grupo-tit">Em aberto (mais antiga primeiro)</div>
    ${ab.map(x => `<div class="linha"><span>Parcela ${x.n}/${x.de}</span><span class="mini ${x.venc < E.d.hoje ? 'res-ruim' : 'muted'}">vence ${dataBR(x.venc)}${x.venc < E.d.hoje ? ' · vencida' : ''}</span><span class="acoes num"><b>${brl(saldoParcela(x))}</b></span></div>`).join('') || '<div class="aviso-box info">Nada em aberto. Pode receber um valor avulso.</div>'}
    <div class="campo" style="margin-top:12px"><label>Valor recebido (R$) <span class="muted">— pode ser menos que a parcela</span></label><input id="rec-valor" data-selecionar inputmode="decimal" value="${esc(m.valorTxt)}" data-campo="pc.modal.valorTxt" data-ao="recPreview" style="font-size:20px;font-weight:700"></div>
    <div id="rec-prev">${pv.html}</div>
    ${m.okExcesso ? `<div class="aviso-box erro">Confirme: ${esc(p.nome.split(' ')[0])} deve ${brl(pv.aberto)} e você está recebendo ${brl(pv.v)}. Toque de novo para confirmar.</div>` : ''}
    <div class="campo" style="margin-top:12px"><label>Forma de pagamento <span class="obrig">*</span></label><div class="chips chips-forma">${['Dinheiro', 'Pix', 'Cartão débito', 'Cartão crédito', 'Link de pagamento', 'Convênio'].map(f => `<button class="${m.forma === f ? 'on' : ''}" data-a="recForma" data-v="${f}" aria-pressed="${m.forma === f}">${m.forma === f ? ic('check', 16) : ic((FORMAS[f] || ['caixa'])[0], 16)} ${f}</button>`).join('')}</div></div>
    ${E.d.caixa.fechado ? '<div class="aviso-box aviso">O caixa de hoje já foi fechado. Este recebimento fica marcado como “depois do fechamento”.</div>' : ''}
  </div><div class="painel-rodape"><button id="btn-rec" class="btn btn-pri" style="width:100%;min-height:48px" data-a="confirmarRec" ${r.off ? 'disabled' : ''}>${esc(r.txt)}</button></div></div>`;
}
A.confirmarRec = () => { const m = E.ui.pc.modal, pv = recPrevia(m), p = pac(m.pac); if (!pv.v || !m.forma) return;
  if (pv.excesso && !m.okExcesso) { m.okExcesso = true; render(); return; }
  comDesfazer(`Recebido ${brl(pv.v)} de ${esc(p.nome)} (${m.forma}).`, () => { receber(m.pac, pv.v, m.forma); E.ui.pc.modal = null; }); };

/* ---------- CAIXA ---------- */
const FORMAS = { 'Pix': ['pix', '#6B4FBB'], 'Dinheiro': ['dinheiro', '#157F3B'], 'Cartão crédito': ['cartao', '#0A5C96'], 'Cartão débito': ['cartao', '#0E7C86'], 'Convênio': ['arquivo', '#BC943D'], 'Link de pagamento': ['link', '#9A3B8C'] }; // Link: pedido do Sr. Austregesilo (R17)
const formaHTML = f => { const [i, c] = FORMAS[f] || ['caixa', '#7C8CA3']; return `<span class="cx-forma" style="--c:${c}">${ic(i, 15)} ${esc(f)}</span>`; };
/* "Saldo de caixa" no lugar de "Deve ter na gaveta" (Danielle, R8): saldo em espécie, em cartão
   e, depois de contar a gaveta, o saldo positivo (sobrou) ou negativo (quanto falta) */
function cartaoSaldo(t, cx) {
  const din = t.porForma['Dinheiro'] || 0, cartao = (t.porForma['Cartão crédito'] || 0) + (t.porForma['Cartão débito'] || 0);
  const outros = t.total - din - cartao;
  const linha = (rot, v, sub, cls = '') => `<div class="saldo-linha ${cls}"><span>${rot}${sub ? `<span class="mini muted">${sub}</span>` : ''}</span><b class="num">${v}</b></div>`;
  const conf = !cx.fechado ? linha('Saldo da conferência', '—', 'aparece quando fechar o caixa e contar a gaveta', 'saldo-neutro')
    : cx.dif === 0 ? linha('Saldo da conferência', brl(0), 'a gaveta bateu', 'saldo-ok')
    : linha(cx.dif > 0 ? 'Saldo positivo' : 'Saldo negativo', `${cx.dif > 0 ? '+' : '−'} ${brl(Math.abs(cx.dif))}`, cx.dif > 0 ? 'sobrou na gaveta' : 'é quanto falta na gaveta', cx.dif > 0 ? 'saldo-aviso' : 'saldo-erro');
  return `<div class="cartao cx-saldo"><h3>${ic('dinheiro', 15)} Saldo de caixa</h3>
    ${linha('Saldo em espécie', brl(din), 'dinheiro na gaveta')}
    ${linha('Saldo em cartão', brl(cartao), 'crédito + débito')}
    ${outros ? linha('Pix e outros', brl(outros), 'cai direto na conta') : ''}
    ${conf}</div>`;
}
function telaCaixa() {
  const t = totaisDia(), cx = E.d.caixa;
  const recs = E.d.recebimentos.slice().sort((a, b) => b.hora - a.hora);
  const formas = Object.entries(t.porForma).sort((a, b) => b[1] - a[1]);
  const vencHoje = Object.entries(E.d.parcelas).flatMap(([pid, ps]) => ps.filter(p => p.venc === E.d.hoje && saldoParcela(p) > 0).map(p => ({ pid, p })));
  const status = cx.fechado ? `<span class="cx-status fechado">${ic('cadeado', 14)} Fechado</span>` : `<span class="cx-status aberto"><span class="ponto"></span>Aberto</span>`;
  return `<div class="titulo-tela"><h1>Caixa</h1><span class="sub">${E.d.unidade} · quinta, 29/10</span>${status}
    <span style="margin-left:auto;display:flex;gap:8px">${cx.fechado ? `<span class="cx-ja-fechado">${ic('cadeado', 16)} Fechado às ${hhmm(cx.hora)} por ${esc(usu(cx.por).nome)}</span>` : `<button class="btn" data-a="abrirFechar">${ic('cadeado', 16)} Fechar caixa</button>`}<button class="btn btn-pri" data-a="abrirReceber">${ic('mais', 16)} Receber pagamento</button></span></div>
  ${cx.fechado ? `<div class="aviso-box ${cx.dif === 0 ? 'ok' : 'erro'}">Gaveta conferida: ${cx.dif === 0 ? 'bateu certinho.' : `${cx.dif > 0 ? 'sobrou' : 'faltou'} <b>${brl(Math.abs(cx.dif))}</b> em dinheiro.`}</div>` : ''}
  ${(v => v ? `<div class="aviso-box aviso">Depois do fechamento entrou mais <b>${brl(v)}</b> em dinheiro: a gaveta deve ter ${brl(cx.gaveta + v)}, não ${brl(cx.gaveta)}.</div>` : '')(cx.fechado ? recs.filter(r => r.depoisFechamento && r.forma === 'Dinheiro').reduce((s, r) => s + r.valor, 0) : 0)}
  <div class="cx-topo">
    <div class="cartao cx-total">
      <span class="cx-rot">Recebido hoje</span>
      <b class="cx-valor num">${brl(t.total)}</b>
      <span class="mini muted">${recs.length} pagamento${recs.length === 1 ? '' : 's'} até ${hhmm(E.d.agoraMin)} · ontem, o dia todo: ${brl(E.d.ontem.total)}</span>
      <div class="cx-barra">${formas.map(([f, v]) => `<i style="width:${t.total ? v / t.total * 100 : 0}%;background:${(FORMAS[f] || [, '#7C8CA3'])[1]}" title="${esc(f)} ${brl(v)}"></i>`).join('')}</div>
      <div class="cx-formas">${formas.map(([f, v]) => `<div class="cx-forma-linha">${formaHTML(f)}<b class="num">${brl(v)}</b><span class="mini muted">${Math.round(v / t.total * 100)}%</span></div>`).join('') || '<span class="muted">Nada recebido ainda.</span>'}</div>
    </div>
    <div class="cx-lado">
      ${cartaoSaldo(t, cx)}
      <div class="cartao"><h3>Vence hoje e falta receber <span class="h-cont ${vencHoje.length ? 'alerta' : ''}">${vencHoje.length}</span></h3>
        ${vencHoje.map(({ pid, p }) => { const pa = pac(pid); return `<div class="h-atencao"><span class="h-ico aviso">${ic('caixa', 18)}</span><span class="h-pac"><b>${numNome(pa)}</b><span class="h-meta">parcela ${p.n} de ${p.de} · falta ${brl(saldoParcela(p))}</span></span><span class="acoes"><button class="btn btn-peq" data-a="abrirReceber" data-pac="${pid}">Receber</button></span></div>`; }).join('') || '<div class="vazio">Nada vencendo hoje.</div>'}</div>
    </div>
  </div>
  <div class="cartao" style="margin-top:16px;padding:0"><h3 style="padding:14px 16px 0">Pagamentos de hoje <span class="h-cont">${recs.length}</span></h3>
  <table class="tab cx-tab"><thead><tr><th>Hora</th><th>Paciente</th><th>Profissional</th><th>Forma</th><th class="dir">Valor</th><th>Recebido por</th></tr></thead><tbody>
    ${recs.map(r => { const p = pac(r.pac); return `<tr class="clic" data-a="abrirFicha" data-id="${p.id}"><td class="num"><b>${hhmm(r.hora)}</b></td><td>nº ${p.numero} · ${esc(p.nome)}${r.depoisFechamento ? ' <span class="tag vencida">depois do fechamento</span>' : ''}</td><td class="muted">${r.prof ? esc(prof(r.prof).curto) : '—'}</td><td>${formaHTML(r.forma)}</td><td class="num dir"><b>${brl(r.valor)}</b></td><td class="muted">${esc(usu(r.por).nome)}</td></tr>`; }).join('') || '<tr><td colspan="6"><div class="vazio">Nenhum pagamento ainda hoje.</div></td></tr>'}</tbody>
    ${recs.length ? `<tfoot><tr><td colspan="4"><b>Total</b></td><td class="num dir"><b>${brl(t.total)}</b></td><td></td></tr></tfoot>` : ''}</table></div>`;
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
function telaConfig() {
  const itens = ['Unidade', 'Cadeiras e salas', 'Pessoas e acessos', 'Procedimentos e preços', 'Convênios', 'Fichas de anamnese', 'Origens', 'Etiquetas', 'Aparelhos', 'Backup', 'Sistema'];
  return `<div class="titulo-tela"><h1>Configurações</h1></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:820px">${itens.map(i => `<button class="cartao cfg-item ${E.ui.pc.cfg === i ? 'ativo' : ''}" data-a="cfg" data-i="${i}">${i}</button>`).join('')}</div>
  ${E.ui.pc.cfg === 'Procedimentos e preços' ? telaPrecos() : ''}
  ${E.ui.pc.cfg === 'Aparelhos' ? `<div class="cartao" style="margin-top:16px;max-width:820px;display:flex;gap:20px;align-items:center">
    <div style="width:150px;height:150px;flex:none;background:repeating-conic-gradient(#0B1F3F 0 25%,#fff 0 50%) 0 0/18px 18px;border:10px solid #fff;outline:1px solid var(--rule)"></div>
    <div><b>Emparelhar um celular</b><p>1. Instale o app OdontoVip no celular.<br>2. Abra o app e aponte a câmera para este código.<br>3. Pronto: o celular já sabe onde está o computador da clínica.</p></div></div>
  <div class="cartao" style="margin-top:12px;max-width:820px"><b>Celulares emparelhados</b>
    <p class="muted" style="margin:4px 0 8px">Se um celular for perdido ou roubado, tire o acesso aqui: ele para de abrir a agenda e as fichas na hora.</p>
    ${[['Dra. Marcelly', 'Xiaomi', '20/10'], ['Dra. Helena', 'Samsung', '20/10'], ['Dr. Rafael', 'Motorola', '21/10'], ['Sr. Austregesilo (dono)', 'iPhone · só Caixa do dia', '22/10']].map(([q, a, d]) => `<div class="linha"><span>${ic('camera', 16)}</span><span><b>${q}</b><br><span class="h-meta">${a} · emparelhado em ${d} por Nicolas</span></span><span class="acoes"><button class="btn btn-peq" data-a="cfgTirar">Tirar acesso</button></span></div>`).join('')}</div>
  <div class="cartao" style="margin-top:12px;max-width:820px"><b>Computadores autorizados</b>
    <p class="muted" style="margin:4px 0 8px">Computador não usa QR: o Nicolas autoriza uma vez e deixa o atalho "OdontoVip" na área de trabalho. Depois a pessoa toca no nome dela e digita a senha (ou o PIN, se o computador é dela). Só funciona no Wi-Fi da clínica.</p>
    ${[['Recepção (servidor)', '20/10', true], ['Notebook Dra. Marcelly', '28/10', false]].map(([n, d, este]) => `<div class="linha"><span>${ic('config', 16)}</span><span><b>${n}</b><br><span class="h-meta">autorizado em ${d} por Nicolas${este ? ' · é este computador' : ''}</span></span><span class="acoes">${este ? '' : '<button class="btn btn-peq" data-a="cfgTirar">Tirar acesso</button>'}</span></div>`).join('')}
    <p class="mini muted" style="margin:8px 0 0">Para autorizar outro computador, abra o OdontoVip nele e entre com a senha de administrador.</p></div>` : ''}`;
}
A.cfgTirar = () => toast('No sistema real, pede a senha de administrador e corta o acesso na hora.');
A.cfg = ds => { E.ui.pc.cfg = ds.i; if (!['Aparelhos', 'Procedimentos e preços'].includes(ds.i)) toast(`“${ds.i}” não faz parte deste protótipo.`); render(); };

/* ---------- CONFIGURAÇÕES → PROCEDIMENTOS E PREÇOS ---------- */
const TIPOS_PROC = { geral: 'Sem dente', dente: 'Um dente', faces: 'Faces do dente', canal: 'Canal', arcada: 'Arcada' };
const precoTxt = c => c == null ? '' : (c / 100).toFixed(2).replace('.', ',');
function linhasPreco() {
  return E.d.procedimentos.flatMap(pr => pr.tipo === 'faces'
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
function modalHTML() { return ({ orc: modalOrc, rec: modalRec, fechar: modalFechar })[E.ui.pc.modal.tipo](); }

/* ---------- splash, troca de usuário, PIN (compartilhado com o celular) ---------- */
function splashHTML(saud) {
  return `<div class="splash"><button class="pular" data-a="pularSplash">Pular</button><div class="anel"><img src="selo.png" alt="OdontoVip"><div class="brilho"></div></div><div class="saud">${saud}</div></div>`;
}
function sobreHTML(alvo) {
  const s = alvo === 'pc' ? E.ui.pc : E.ui.cel;
  if (s.sobre === 'splash' || s.tela === 'splash') return splashHTML(alvo === 'pc' ? `Bom dia, ${E.d.unidade}.` : 'OdontoVip');
  const lista = alvo === 'pc' ? E.d.usuarios : E.d.usuarios.filter(u => u.papel !== 'recepcao');
  if (!s.pinUsu) return `<div class="sobre"><h2>Quem é você?</h2><div class="cards-usu">${lista.map(u => `<button class="card-usu ${alvo === 'pc' && u.id === E.ui.pc.usuario ? 'atual' : ''}" data-a="escolherUsu" data-alvo="${alvo}" data-id="${u.id}"><div class="ini">${iniciais(u.nome)}</div><b>${esc(u.nome)}</b><small>${u.rotulo}${alvo === 'pc' && u.id === E.ui.pc.usuario ? ' · agora' : ''}</small></button>`).join('')}</div>
    ${alvo === 'pc' ? '<button class="btn-link" data-a="cancelarTroca">Cancelar</button>' : ''}</div>`;
  const u = usu(s.pinUsu);
  return `<div class="sobre"><div class="card-usu" style="border:0;background:none"><div class="ini">${iniciais(u.nome)}</div><b>${esc(u.nome)}</b></div>
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
