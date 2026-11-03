/* Telas do celular — blueprint/07-pantallas-app.md */
function celHTML() {
  const c = E.ui.cel;
  const status = `<div class="cel-status"><span class="num">10:40</span><span>${E.ui.celForaWifi ? '4G' : 'Wi-Fi da clínica'} · 82%</span></div>`;
  if (c.tela === 'splash') {
    if (!c.timer) c.timer = setTimeout(() => { if (E.ui.cel.tela === 'splash') { E.ui.cel.tela = 'login'; render(); } }, 1400);
    return `<div class="cel">${status}${splashHTML('OdontoVip')}</div>`;
  }
  if (c.tela === 'login') return `<div class="cel">${status}${sobreHTML('cel')}</div>`;
  const u = usu(c.usuario);
  if (u.papel === 'dono') return `<div class="cel">${status}${telaDono()}</div>`;
  const comAbas = ['agenda', 'pacientes', 'eu'].includes(c.tela);
  const faixa = E.ui.celForaWifi ? `<div class="cel-faixa off">${ic('alerta', 15)} Fora do Wi-Fi da clínica · dados das 10:40${c.fila.length ? ` · ${c.fila.length} para enviar` : ''}</div>` : '';
  const corpo = ({ agenda: celAgenda, paciente: celPaciente, evolucao: celEvo, evoOk: celEvoOk, foto: celFoto, pacientes: celPacientes, eu: celEu,
    odonto: celOdonto, dente: celDenteTela, anam: celAnam, arquivo: celArquivo, anamForm: celAnamForm, assinar: celAssinar, dados: celDados, arquivos: celArquivos, evos: celEvos })[c.tela]();
  return `<div class="cel">${status}${faixa}${corpo}
    ${comAbas ? `<nav class="cel-abas">${[['agenda', 'agenda', 'Agenda'], ['pacientes', 'pacientes', 'Pacientes'], ['eu', 'usuario', 'Eu']].map(([t, i, n]) => `<button class="${c.tela === t ? 'ativo' : ''}" data-a="celTela" data-t="${t}">${ic(i, 22)}${n}</button>`).join('')}</nav>` : ''}</div>`;
}
function entrarCel(id) {
  const c = E.ui.cel; c.usuario = id; c.pinUsu = null; c.pinBuf = ''; c.pinErro = '';
  c.tela = usu(id).papel === 'dono' ? 'dono' : 'agenda'; render();
}
A.celTela = ds => { if (ds.t === 'anamNova') { A.celAnamNova(); return; } E.ui.cel.tela = ds.t; render(); };
/* grava agora; fora do Wi-Fi fica marcado como "para enviar" (nada se perde) */
function celGravar(msg, fn) {
  if (!E.ui.celForaWifi) { comDesfazer(msg, fn); return; }
  // fora do Wi-Fi: desfazer também tira o pendente, senão o contador "para enviar" mente
  const marca = () => {}; E.ui.cel.fila.push(marca);
  comDesfazer(msg + ' Fica no celular e envia quando voltar a conexão.', fn, () => {
    const f = E.ui.cel.fila, i = f.indexOf(marca); if (i >= 0) f.splice(i, 1); });
}
const profCel = () => usu(E.ui.cel.usuario).prof;

/* agenda da dentista */
function cardAg(a) {
  const p = pac(a.pac), al = alertas(p.id);
  const cls = a.estado === 'chegou' ? 'chegou' : a.estado === 'em_atendimento' ? 'atend' : '';
  return `<div class="cel-card ${cls}" data-a="celAbrirPac" data-id="${p.id}">
    <div class="linha1"><span class="h num">${hhmm(a.ini)}</span><span><span class="n">${numNomeCel(p)}</span><br>
      <span class="mini muted">${a.proc ? esc(proc(a.proc).nome) : ''} · ${cad(a.cad).nome}</span></span></div>
    <div style="margin-top:6px">${estadoHTML(a.estado)} ${al.length ? `<span class="alerta-ico cel-al">${ic('alerta', 15)}&nbsp;${esc(al[0].texto)}</span>` : ''}</div>
    ${a.estado === 'chegou' ? `<button class="btn btn-pri" data-a="celIniciar" data-id="${a.id}">Iniciar atendimento</button>` : ''}
    ${a.estado === 'em_atendimento' ? `<button class="btn" data-a="celAbrirPac" data-id="${p.id}">Abrir ficha</button><button class="btn btn-pri" data-a="celFinalizar" data-id="${a.id}">Finalizar atendimento</button>` : ''}</div>`;
}
function celAgenda() {
  const u = usu(E.ui.cel.usuario), meus = E.d.agendamentos.filter(a => a.prof === u.prof && a.pac && !['desmarcou', 'remarcado'].includes(a.estado)).sort((a, b) => a.ini - b.ini);
  const agora = meus.filter(a => ['chegou', 'em_atendimento'].includes(a.estado));
  const resto = meus.filter(a => !agora.includes(a));
  return `<div class="cel-cab"><h2>Hoje · qui 29/10</h2><div class="sub">${esc(u.nome)} · ${meus.length} pacientes</div></div>
  <div class="cel-corpo" data-scroll="cel-agenda">
    ${agora.length ? `<div class="grupo-tit">Na clínica agora</div>${agora.map(cardAg).join('')}` : ''}
    <div class="grupo-tit">Agenda do dia</div>${resto.map(cardAg).join('') || '<div class="vazio">Nenhum outro paciente hoje.</div>'}
  </div>`;
}
A.celIniciar = ds => {
  if (E.ui.celForaWifi) { toast('Para iniciar o atendimento, o celular precisa estar no Wi-Fi da clínica.'); return; }
  const a = E.d.agendamentos.find(x => x.id === ds.id);
  comDesfazer(`Atendimento iniciado: ${esc(pac(a.pac).nome)}.`, () => { a.estado = 'em_atendimento'; E.ui.cel.pacId = a.pac; E.ui.cel.tela = 'paciente'; });
};
A.celAbrirPac = ds => { E.ui.cel.pacId = ds.id; E.ui.cel.tela = 'paciente'; render(); };

/* paciente */
const cartaoIr = (tela, icone, titulo, detalhe) => `<button class="cel-card cel-ir" data-a="celTela" data-t="${tela}"><span class="cel-ir-ic">${ic(icone, 22)}</span><span class="cel-ir-txt"><b>${titulo}</b>${detalhe ? `<span class="mini muted">${detalhe}</span>` : ''}</span>${ic('dir', 20)}</button>`;
function miniBoca(pid) {
  const linha = arr => `<div class="mini-boca-linha">${arr.map(n => denteSVG(pid, n, { cel: true, escala: .36 })).join('')}</div>`;
  const den = denticaoPadrao(pid), sup = den === 'dec' ? ARCADAS.supDec : ARCADAS.supPerm, inf = den === 'dec' ? ARCADAS.infDec : ARCADAS.infPerm;
  return `<div class="mini-boca" aria-hidden="true">${linha(sup)}${linha(inf)}</div>`;
}
function celPaciente() {
  const c = E.ui.cel, p = pac(c.pacId), al = alertas(p.id), pl = plano(p.id).filter(i => i.estado !== 'recusado');
  const feitos = pl.filter(i => i.estado === 'realizado').length;
  const evs = E.d.evolucoes[p.id] || [], ult = evs[evs.length - 1];
  const ans = E.d.anamneses[p.id] || [], arqs = E.d.arquivos[p.id] || [];
  const faixaAl = c.novoAlerta != null
    ? `<div class="cel-alertas">${al.map(x => `<div>${ic('alerta', 16)} ${esc(x.texto)}</div>`).join('')}
        <input id="cel-alerta" data-campo="cel.novoAlerta" value="${esc(c.novoAlerta)}" placeholder="Ex.: Alergia a látex" class="cel-input" style="margin-top:8px">
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" style="flex:1" data-a="celCancelarAlerta">Cancelar</button><button class="btn btn-pri" style="flex:1" data-a="celSalvarAlerta">Salvar alerta</button></div></div>`
    : al.length ? `<div class="cel-alertas">${al.map(x => `<div>${ic('alerta', 16)} ${esc(x.texto)}</div>`).join('')}<button class="cel-alerta-mais" data-a="celNovoAlerta">+ Alerta</button></div>`
    : `<div class="cel-sem-alerta"><span>Sem alertas</span><button class="btn cel-btn-alerta" data-a="celNovoAlerta">+ Alerta</button></div>`;
  return `<div class="cel-cab"><button class="cel-voltar" data-a="celTela" data-t="agenda">${ic('esq', 18)} Agenda</button><h2>${numNomeCel(p)}</h2><div class="sub">${idade(p.nasc)} anos · ${conv(p.conv).nome}</div></div>
  ${faixaAl}
  <div class="cel-corpo" data-scroll="cel-pac">
    <button class="cel-card cel-ir" data-a="celTela" data-t="odonto"><span class="cel-ir-txt"><b>Odontograma e plano</b>
      ${miniBoca(p.id)}<span class="mini muted">${pl.length ? `${feitos} de ${pl.length} tratamentos feitos` : 'Sem tratamentos no plano'}</span>
      ${pl.length ? `<span class="prog"><i style="width:${feitos / pl.length * 100}%"></i></span>` : ''}</span>${ic('dir', 20)}</button>
    ${cartaoIr(ans.length || (c.anamRasc || {})[p.id] ? 'anam' : 'anamNova', 'prancheta', 'Anamnese', (c.anamRasc || {})[p.id] ? 'ficha começada — toque para continuar' : ans.length ? `última em ${dataBR(ans[ans.length - 1].data)}${ans[ans.length - 1].assinada ? ' · assinada' : ''}` : 'nenhuma ficha — toque para preencher')}
    ${cartaoIr('evos', 'arquivo', 'Evolução', ult ? `${dataBR(ult.data)} · ${esc(prof(ult.por).curto)} · “${esc(ult.texto.slice(0, 48))}${ult.texto.length > 48 ? '…' : ''}”` : 'nenhuma ainda')}
    ${cartaoIr('arquivos', 'foto', `Arquivos (${arqs.length})`, arqs.length ? 'radiografias, fotos e documentos' : 'nenhum ainda')}
    ${cartaoIr('dados', 'usuario', 'Dados do paciente', `${esc(p.cel)} · ${p.cpf ? 'CPF ' + esc(p.cpf) : 'sem CPF'}`)}
  </div>
  <div class="cel-rodape"><button class="btn" style="flex:0 0 112px" data-a="celFoto">${ic('camera', 22)} Foto</button><button class="btn btn-pri" data-a="celNovaEvo">Nova evolução</button></div>`;
}
A.celNovoAlerta = () => { E.ui.cel.novoAlerta = ''; E.ui.foco = 'cel-alerta'; render(); };
A.celCancelarAlerta = () => { E.ui.cel.novoAlerta = null; render(); };
A.celSalvarAlerta = () => { const c = E.ui.cel, t = (c.novoAlerta || '').trim();
  if (!t) { toast('Escreva o alerta. Ex.: Alergia a látex.'); return; }
  c.novoAlerta = null; celGravar('Alerta adicionado.', () => addAlerta(c.pacId, t.toUpperCase())); };

/* odontograma no celular — blueprint/07 §A4b: uma arcada por vez, 8 dentes por linha */
const voltaPac = () => `<button class="cel-voltar" data-a="celTela" data-t="paciente">${ic('esq', 18)} Ficha</button>`;
const numNomeCel = p => `nº&nbsp;${p.numero}&nbsp;· ${esc(p.nome)}`;
/* toda subtela diz de qual paciente é: entre um paciente e outro, a dentista confere antes de marcar */
function cabSub(titulo, volta = { t: 'paciente', txt: 'Ficha' }, extra = '') {
  const p = pac(E.ui.cel.pacId);
  return `<div class="cel-cab"><button class="cel-voltar" data-a="celTela" data-t="${volta.t}">${ic('esq', 18)} ${volta.txt}</button>
    <div class="cel-quem">${numNomeCel(p)}</div>${alertas(p.id).length ? `<div class="cel-quem-al">${ic('alerta', 15)} ${esc(alertas(p.id).map(a => a.texto).join(' · '))}</div>` : ''}<h2>${titulo}</h2>${extra}</div>`;
}
function celOdonto() {
  const c = E.ui.cel, p = pac(c.pacId), den = c.denticao || denticaoPadrao(p.id), arc = c.arcada;
  const metades = arr => [arr.slice(0, arr.length / 2), arr.slice(arr.length / 2)];
  const perm = arc === 'sup' ? ARCADAS.supPerm : ARCADAS.infPerm, dec = arc === 'sup' ? ARCADAS.supDec : ARCADAS.infDec;
  const blocos = den === 'perm' ? [metades(perm)] : den === 'dec' ? [metades(dec)] : [metades(perm), metades(dec)];
  const fila = (arr, tit) => `<div class="cel-arc-tit">${tit}</div><div class="cel-arc">${arr.map(n => {
    const ks = condsDente(estadoDente(p.id, n)), num = `<span class="cel-dente-num">${n}${ks.map(k => `<small style="color:${corTexto(k)}">${ABREV[k]}</small>`).join('')}</span>`;
    const svg = denteSVG(p.id, n, { cel: true, semNumero: true, escala: ehDecid(n) ? 1 : .86 });
    return `<button class="cel-dente-btn" data-a="celDente" data-n="${n}" aria-label="Dente ${n}${ks.length ? ': ' + ks.map(k => CONDICOES[k][0]).join(', ') : ''}">${ehSup(n) ? svg + num : num + svg}</button>`; }).join('')}</div>`;
  const seg = (campo, v, t, atual) => `<button class="${atual === v ? 'ativo' : ''}" data-a="celOdontoVer" data-c="${campo}" data-v="${v}">${t}</button>`;
  const pl = plano(p.id);
  const grupo = (est, tit) => { const g = pl.filter(i => i.estado === est); return g.length ? `<div class="grupo-tit">${tit} (${g.length})</div>${g.map(celItemPlano).join('')}` : ''; };
  return `${cabSub('Odontograma', undefined, '<div class="sub">Toque num dente para marcar</div>')}
  <div class="cel-corpo" data-scroll="cel-odonto">
    <div class="seg seg-cel">${seg('arcada', 'sup', 'Superior', arc)}${seg('arcada', 'inf', 'Inferior', arc)}</div>
    ${blocos.map(([dir, esq]) => fila(dir, 'Lado direito do paciente') + fila(esq, 'Lado esquerdo do paciente')).join('')}
    <div class="seg seg-cel seg-peq">${seg('denticao', 'perm', 'Permanente', den)}${seg('denticao', 'mista', 'Mista', den)}${seg('denticao', 'dec', 'Decídua', den)}</div>
    <div class="grupo-tit">Sem dente específico</div>
    <div class="chips">${Object.keys(REGIOES).map(k => `<button data-a="celDente" data-n="${k}">${REGIOES[k]}</button>`).join('')}</div>
    <details class="cel-legenda"><summary>O que significam as cores e letras</summary>
      ${Object.entries(CONDICOES).map(([k, [n, cor]]) => `<div><i style="background:${cor}"></i><b style="color:${corTexto(k)}">${ABREV[k]}</b> ${n}</div>`).join('')}
      <div><i style="background:#fff;border:1.5px dashed #1880BF"></i>contorno tracejado: indicado</div><div><i style="background:#fff;border:2px solid #1880BF"></i>contorno cheio: aprovado</div></details>
    ${grupo('indicado', 'Indicados — o paciente ainda não aprovou')}${grupo('aprovado', 'Aprovados — falta fazer')}${grupo('realizado', 'Feitos')}${grupo('recusado', 'Paciente não quis')}
    ${!pl.length ? '<div class="vazio">Sem tratamentos no plano.</div>' : ''}
    ${pl.some(i => i.estado === 'indicado') ? '<div class="mini muted">O orçamento e o pagamento são feitos na recepção.</div>' : ''}
  </div>`;
}
function celItemPlano(i) {
  const quem = i.feitoPor ? `${prof(i.feitoPor).curto} · ${dataBR(i.dataFeito)}` : `${prof(i.indicadoPor).curto} · ${dataBR(i.dataInd)}${i.dataApr ? ` · aprovado ${dataBR(i.dataApr)}` : ''}`;
  return `<div class="cel-item"><span class="cel-item-txt"><span class="cel-item-l1"><b>${esc(nomeItem(i))}</b><b class="num">${brl(valorItem(i, E.ui.cel.pacId))}</b></span>${pilulaPlano(i.estado)}<span class="mini muted">${quem}</span>
    ${i.estado === 'indicado' ? `<button class="btn-link cel-link-item" data-a="celRecusar" data-id="${i.id}">Paciente não quis</button>` : ''}
    ${i.estado === 'recusado' ? `<button class="btn-link cel-link-item" data-a="celReindicar" data-id="${i.id}">Voltar a indicar</button>` : ''}</span></div>`;
}
A.celReindicar = ds => { const i = plano(E.ui.cel.pacId).find(x => x.id === ds.id);
  celGravar('Voltou para indicados.', () => { i.estado = 'indicado'; }); };
A.celOdontoVer = ds => { E.ui.cel[ds.c] = ds.v; render(); };
A.celRecusar = ds => { const i = plano(E.ui.cel.pacId).find(x => x.id === ds.id);
  celGravar('Marcado: paciente não quis.', () => { i.estado = 'recusado'; }); };
A.celDente = ds => { const c = E.ui.cel; Object.assign(c, { dente: String(ds.n), denteFaces: [], denteProc: null, denteCond: null, salvoAgora: 0, tela: 'dente' }); render(); };
A.celFace = ds => { const f = E.ui.cel.denteFaces, i = f.indexOf(ds.f); i >= 0 ? f.splice(i, 1) : f.push(ds.f); render(); };
A.celCond = ds => { const c = E.ui.cel; c.denteCond = c.denteCond === ds.c ? null : ds.c; render(); };
A.celProc = ds => { const c = E.ui.cel; c.denteProc = c.denteProc === ds.p ? null : ds.p;
  if (c.denteProc && proc(c.denteProc).tipo === 'faces' && !c.denteFaces.length) E.ui.rolarPara = '.cel-dente-topo';
  render(); };

/* as 5 faces em tamanho de dedo (≈170 px) */
function facesGrandes(pid, n, sel) {
  const est = estadoDente(pid, n), sup = ehSup(n), mesialDir = naEsquerdaDaTela(n);
  const lado = { top: sup ? 'V' : 'L', bottom: sup ? 'L' : 'V', right: mesialDir ? 'M' : 'D', left: mesialDir ? 'D' : 'M' };
  const nome = f => ({ V: 'Vestibular', M: 'Mesial', D: 'Distal', L: sup ? 'Palatina' : 'Lingual', O: ehAnterior(n) ? 'Incisal' : 'Oclusal' }[f]);
  const letra = f => f === 'L' ? (sup ? 'P' : 'L') : f === 'O' ? (ehAnterior(n) ? 'I' : 'O') : f;
  const S = 170, a = S * .3, c = S / 2;
  const pend = new Set(pendentes(pid, n).flatMap(i => i.faces));
  const face = (f, pts, tx, ty) => { const on = sel.includes(f), cond = est.faces[f];
    const fill = on ? '#0A5C96' : cond ? CONDICOES[cond][1] : '#fffdf8';
    const cor = on || (cond && !['extraido', 'acompanhamento'].includes(cond)) ? '#fff' : '#40536F';
    return `<g data-a="celFace" data-f="${f}" role="button" aria-pressed="${on}" aria-label="Face ${nome(f)}${cond ? ', ' + CONDICOES[cond][0] : ''}" style="cursor:pointer">
      <polygon points="${pts}" fill="${fill}" stroke="${on ? '#0B1F3F' : pend.has(f) ? '#1880BF' : '#aeb9c8'}" stroke-width="${on ? 3 : pend.has(f) ? 2.5 : 1.2}"/>
      <text x="${tx}" y="${ty}" text-anchor="middle" font-size="15" font-weight="700" fill="${cor}" pointer-events="none">${letra(f)}</text>
      <text x="${tx}" y="${ty + 13}" text-anchor="middle" font-size="8.5" fill="${cor}" pointer-events="none">${cond && !on ? ABREV[cond] : ''}</text></g>`; };
  return `<svg width="${S}" height="${S}" viewBox="-2 -2 ${S + 4} ${S + 4}" class="faces-grandes">
    <defs><clipPath id="fg-${n}"><circle cx="${c}" cy="${c}" r="${c}"/></clipPath></defs>
    <g clip-path="url(#fg-${n})">
      ${face(lado.top, `0,0 ${S},0 ${S - a},${a} ${a},${a}`, c, a * .62)}
      ${face(lado.right, `${S},0 ${S},${S} ${S - a},${S - a} ${S - a},${a}`, S - a * .5, c + 2)}
      ${face(lado.bottom, `${S},${S} 0,${S} ${a},${S - a} ${S - a},${S - a}`, c, S - a * .42)}
      ${face(lado.left, `0,${S} 0,0 ${a},${a} ${a},${S - a}`, a * .5, c + 2)}
      ${face('O', `${a},${a} ${S - a},${a} ${S - a},${S - a} ${a},${S - a}`, c, c + 2)}</g>
    <circle cx="${c}" cy="${c}" r="${c - .5}" fill="none" stroke="#93a2b6" stroke-width="1.5" pointer-events="none"/></svg>`;
}
function celDenteTela() {
  const c = E.ui.cel, pid = c.pacId, n = c.dente, regiao = ehRegiao(n);
  const tipos = regiao ? ['arcada', 'geral'] : ['dente', 'faces', 'canal'];
  const its = plano(pid).filter(i => i.dente === String(n));
  const sv = rotuloSalvarDente(pid, n, c), nf = c.denteFaces.length;
  const procs = E.d.procedimentos.filter(x => tipos.includes(x.tipo)).map(x => `<button class="${c.denteProc === x.id ? 'on' : ''}" data-a="celProc" data-p="${x.id}">${x.nome}</button>`).join('');
  const cab = cabSub(regiao ? REGIOES[n] : 'Dente ' + n, { t: 'odonto', txt: 'Odontograma' }, regiao ? '' : `<div class="sub">${nomeDente(n)}</div>`);
  const lista = its.length ? `<div class="grupo-tit">${regiao ? 'Nesta região' : 'Tratamentos neste dente'}</div>${its.map(celItemPlano).join('')}` : '';
  const rodape = `<div class="cel-rodape cel-rodape-col">${sv.dica ? `<div class="aviso-box aviso" style="margin:0 0 8px">${sv.dica}</div>` : ''}<button class="btn btn-pri" data-a="celSalvarDente" ${sv.ok ? '' : 'disabled'}>${sv.txt}</button></div>`;
  if (regiao) return `${cab}<div class="cel-corpo"><div class="grupo-tit">O que vai ser feito</div><div class="chips">${procs}</div>${lista}</div>${rodape}`;
  const est = estadoDente(pid, n);
  const hoje = [...(est.geral ? [[est.geral, 'dente inteiro']] : []), ...(est.canal ? [['canal', 'raiz']] : []), ...Object.entries(est.faces).map(([f, k]) => [k, 'face ' + f])];
  return `${cab}<div class="cel-corpo" data-scroll="cel-dente">
    <div class="cel-dente-topo"><div style="pointer-events:none">${denteSVG(pid, n, { cel: true, escala: 1.15 })}</div>${facesGrandes(pid, n, c.denteFaces)}</div>
    <div class="mini muted" style="text-align:center">${nf ? 'Faces marcadas: <b>' + c.denteFaces.join(', ') + '</b> — toque de novo para desmarcar' : 'Toque nas faces do desenho para marcar'}</div>
    ${c.salvoAgora && Date.now() - c.salvoAgora < 8000 ? `<div class="aviso-box ok">${ic('check', 16)} Salvo. Veja abaixo como ficou.</div>` : ''}
    <div class="grupo-tit">Como está hoje</div>
    <div class="chips">${hoje.map(([k, onde]) => `<span class="chip-cond"><i style="background:${CONDICOES[k][1]}"></i><b style="color:${corTexto(k)}">${ABREV[k]}</b> ${CONDICOES[k][0]} <span class="muted">· ${onde}</span></span>`).join('') || '<span class="muted mini">Sem registro.</span>'}</div>
    <div class="grupo-tit">1. O que tem no dente <span class="muted">(opcional)</span></div>
    <div class="chips">${Object.entries(CONDICOES).map(([k, [nome, cor]]) => `<button class="${c.denteCond === k ? 'on' : ''}" data-a="celCond" data-c="${k}"><i class="sw" style="background:${cor}"></i>${nome}</button>`).join('')}</div>
    <div class="grupo-tit">2. O que vai ser feito <span class="muted">(opcional)</span></div>
    <div class="chips">${procs}</div>
    ${lista}
    ${est.regs.length ? `<div class="grupo-tit">Histórico do dente</div>${est.regs.slice().reverse().map(r => `<div class="mini" style="padding:3px 0">${dataBRc(r.data)} · <b>${CONDICOES[r.cond][0]}</b>${r.faces.length ? ' (' + r.faces.join(', ') + ')' : ''} · ${esc(prof(r.por).curto)}</div>`).join('')}` : ''}
  </div>${rodape}`;
}
A.celSalvarDente = () => {
  const c = E.ui.cel, pid = c.pacId, n = c.dente, sv = rotuloSalvarDente(pid, n, c); if (!sv.ok) return;
  const cond = c.denteCond, pr = c.denteProc, faces = [...c.denteFaces], por = profCel();
  Object.assign(c, { denteCond: null, denteProc: null, denteFaces: [], salvoAgora: Date.now() });
  E.ui.zerarScroll = 'cel-dente';
  celGravar(`Salvo no ${ehRegiao(n) ? REGIOES[n] : 'dente ' + n}.`, () => {
    if (cond) condicoesPac(pid).push({ id: uid(), n, cond, faces, data: E.d.hoje, por });
    if (pr) novoItem(pid, pr, n, faces, por);
  });
};

/* anamnese no celular — blueprint/07 §A4c */
function celAnam() {
  const p = pac(E.ui.cel.pacId), lista = (E.d.anamneses[p.id] || []).slice().reverse();
  return `${cabSub('Anamnese')}
  <div class="cel-corpo">
    ${lista.map(an => { const m = E.d.modelos.find(x => x.id === an.modelo); return `<div class="cel-card"><b>${m.nome}</b><br><span class="mini muted">${dataBR(an.data)} · ${esc(prof(an.por) ? prof(an.por).curto : '—')} · ${an.assinada ? `<span style="color:var(--ok)">${ic('assinar', 14)} assinada pelo paciente</span>` : 'sem assinatura'}</span>
      ${m.perguntas.map(q => { const r = an.respostas[q.id] || {}; return `<div class="mini" style="padding:4px 0;border-top:1px solid var(--rule);margin-top:4px">${q.texto}<br><b>${r.sim === true ? 'Sim' : r.sim === false ? 'Não' : ''}${r.texto ? (r.sim != null ? ' — ' : '') + esc(r.texto) : ''}</b></div>`; }).join('')}
      ${an.assinada ? '' : `<button class="btn" data-a="celPedirAssin" data-id="${an.id}">${ic('assinar', 18)} Paciente assina agora</button>`}</div>`; }).join('') || '<div class="vazio">Nenhuma ficha preenchida.</div>'}
  </div>
  ${(E.ui.cel.anamRasc || {})[p.id] ? `<div class="cel-rodape cel-rodape-col"><button class="btn btn-pri" data-a="celAnamNova">${ic('prancheta', 18)} Continuar ficha começada</button><button class="btn" style="margin-top:18px" data-a="celAnamDescartar">Descartar e começar outra</button></div>`
    : `<div class="cel-rodape"><button class="btn btn-pri" data-a="celAnamNova">${ic('prancheta', 18)} Preencher ficha</button></div>`}`;
}
/* rascunho por paciente: sair da ficha não apaga as respostas */
A.celAnamNova = () => { const c = E.ui.cel; c.anamRasc = c.anamRasc || {};
  c.anamForm = c.anamRasc[c.pacId] = c.anamRasc[c.pacId] || { modelo: null, resp: {} }; c.tela = 'anamForm'; render(); };
A.celAnamDescartar = () => { const c = E.ui.cel, pid = c.pacId, velho = c.anamRasc[pid];
  c.anamForm = c.anamRasc[pid] = { modelo: null, resp: {} }; c.tela = 'anamForm'; render();
  desfazivel('Ficha começada descartada.', () => { c.anamForm = c.anamRasc[pid] = velho; c.tela = 'anamForm'; }); };
function celAnamForm() {
  const c = E.ui.cel, f = c.anamForm, p = pac(c.pacId);
  const cab = cabSub(f.modelo ? E.d.modelos.find(x => x.id === f.modelo).nome : 'Qual ficha?', (E.d.anamneses[p.id] || []).length ? { t: 'anam', txt: 'Anamnese' } : undefined);
  if (!f.modelo) return `${cab}<div class="cel-corpo">${E.d.modelos.map(m => `<button class="cel-card cel-ir" data-a="celAnamModelo" data-id="${m.id}"><span class="cel-ir-txt"><b>${m.nome}</b><span class="mini muted">${m.perguntas.length} perguntas</span></span>${ic('dir', 20)}</button>`).join('')}</div>`;
  const m = E.d.modelos.find(x => x.id === f.modelo);
  const falta = m.perguntas.filter(q => q.tipo === 'snt' && f.resp[q.id]?.sim == null).length;
  return `${cab}<div class="cel-corpo" data-scroll="cel-anam"><div class="mini muted">Pode sair e voltar: as respostas ficam guardadas até salvar.</div>${m.perguntas.map((q, i) => {
    const r = f.resp[q.id] || {};
    return `<div class="pergunta"><b>${i + 1}. ${q.texto}</b>
      ${q.tipo === 'snt' ? `<div class="sn sn-cel"><button class="${r.sim === true ? 'on-sim' : ''}" data-a="celResp" data-q="${q.id}" data-v="1">Sim</button><button class="${r.sim === false ? 'on-nao' : ''}" data-a="celResp" data-q="${q.id}" data-v="0">Não</button></div>` : ''}
      ${q.tipo === 't' || r.sim ? `<input class="cel-input" id="cel-q-${q.id}" placeholder="${q.tipo === 't' ? 'Escreva aqui' : 'Qual?'}" value="${esc(r.texto || '')}" data-ao="celRespTexto" data-q="${q.id}">` : ''}
      ${q.alerta && r.sim ? `<div class="aviso-box erro">Vai virar alerta na ficha: <b id="cel-prev-${q.id}">${esc(textoAlertaAnam(q, r))}</b></div>` : ''}</div>`; }).join('')}</div>
  <div class="cel-rodape cel-rodape-col">${falta ? `<div class="mini muted" style="text-align:center;margin-bottom:6px">${falta === 1 ? 'Falta 1 pergunta' : `Faltam ${falta} perguntas`} de Sim/Não</div>` : ''}<button class="btn btn-pri" data-a="celSalvarAnam" ${falta ? 'disabled' : ''}>${falta ? 'Responda todas para salvar' : 'Salvar e pedir assinatura'}</button></div>`;
}
A.celAnamModelo = ds => { E.ui.cel.anamForm.modelo = ds.id; render(); };
A.celResp = ds => { const f = E.ui.cel.anamForm; f.resp[ds.q] = { ...(f.resp[ds.q] || {}), sim: ds.v === '1' };
  if (ds.v === '1') E.ui.foco = 'cel-q-' + ds.q; render(); };
A.celRespTexto = (ds, el) => { const f = E.ui.cel.anamForm, r = f.resp[ds.q] = { ...(f.resp[ds.q] || {}), texto: el.value };
  const prev = document.getElementById('cel-prev-' + ds.q), q = E.d.modelos.find(m => m.id === f.modelo).perguntas.find(x => x.id === ds.q);
  if (prev) prev.textContent = textoAlertaAnam(q, r); };
A.celSalvarAnam = () => {
  const c = E.ui.cel, f = c.anamForm, m = E.d.modelos.find(x => x.id === f.modelo), pid = c.pacId, por = profCel();
  if (m.perguntas.some(q => q.tipo === 'snt' && f.resp[q.id]?.sim == null)) return;
  const an = { id: uid(), modelo: f.modelo, data: E.d.hoje, por, respostas: JSON.parse(JSON.stringify(f.resp)), assinada: false };
  c.anamForm = null; delete c.anamRasc[pid]; c.assinarId = an.id; c.tela = 'assinar';
  // sem Desfazer aqui: o celular vai para a mão do paciente. Quem não quiser assinar toca "Agora não".
  (E.d.anamneses[pid] = E.d.anamneses[pid] || []).push(an);
  m.perguntas.forEach(q => { const r = an.respostas[q.id]; if (q.alerta && r && r.sim) addAlerta(pid, textoAlertaAnam(q, r)); });
  if (E.ui.celForaWifi) c.fila.push(() => {});
  render(); toast(E.ui.celForaWifi ? 'Ficha salva no celular — envia quando voltar a conexão.' : 'Ficha salva.');
};
A.celPedirAssin = ds => { E.ui.cel.assinarId = ds.id; E.ui.cel.tela = 'assinar'; render(); };
/* assinatura com o dedo no próprio celular. Sem CPF, sem e-mail. */
function celAssinar() {
  const c = E.ui.cel, p = pac(c.pacId), an = (E.d.anamneses[p.id] || []).find(x => x.id === c.assinarId);
  const m = an && E.d.modelos.find(x => x.id === an.modelo);
  const resumo = m ? m.perguntas.map(q => { const r = an.respostas[q.id] || {}; return `<div class="assin-linha"><span>${q.texto}</span><b>${r.sim === true ? 'Sim' : r.sim === false ? 'Não' : ''}${r.texto ? (r.sim != null ? ' — ' : '') + esc(r.texto) : ''}</b></div>`; }).join('') : '';
  return `<div class="cel-cab"><h2>Assinatura do paciente</h2><div class="sub">${esc(p.nome)} · ficha de hoje</div></div>
  <div class="cel-corpo" data-scroll="cel-assin"><div class="mini">Entregue o celular ao paciente. Confira as respostas e assine embaixo.</div>
    <div class="cel-card assin-resumo"><b>${m ? m.nome : ''}</b>${resumo}</div>
    <div class="assin-caixa"><canvas id="cel-assin" width="320" height="200" aria-label="Área para assinar com o dedo"></canvas><span class="assin-dica">Assine aqui com o dedo</span></div>
    <button class="btn" style="width:100%;min-height:48px" data-a="celLimparAssin">Apagar e assinar de novo</button></div>
  <div class="cel-rodape"><button class="btn" style="flex:0 0 120px" data-a="celTela" data-t="anam">Agora não</button><button class="btn btn-pri" id="btn-assin" data-a="celConfirmarAssin" disabled>Assinatura pronta</button></div>`;
}
let assinTracando = false;
document.addEventListener('pointerdown', e => { if (e.target.id !== 'cel-assin') return;
  const cv = e.target, x = cv.getContext('2d'), r = cv.getBoundingClientRect();
  assinTracando = true; cv.setPointerCapture(e.pointerId); x.lineWidth = 2.5; x.lineCap = 'round'; x.strokeStyle = '#0B1F3F';
  x.beginPath(); x.moveTo((e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height);
  document.querySelector('.assin-dica')?.remove(); });
document.addEventListener('pointermove', e => { if (!assinTracando || e.target.id !== 'cel-assin') return;
  const cv = e.target, x = cv.getContext('2d'), r = cv.getBoundingClientRect();
  x.lineTo((e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height); x.stroke();
  const b = document.getElementById('btn-assin'); if (b) b.disabled = false; });
document.addEventListener('pointerup', () => { assinTracando = false; });
A.celLimparAssin = () => { E.ui.rolarPara = '.assin-caixa'; render(); };
A.celConfirmarAssin = () => { const c = E.ui.cel, an = (E.d.anamneses[c.pacId] || []).find(x => x.id === c.assinarId);
  c.tela = 'anam'; if (!an) { render(); return; }
  an.assinada = true; if (E.ui.celForaWifi) c.fila.push(() => {}); render(); toast('Assinatura guardada na ficha.'); };

/* evoluções anteriores */
function celEvos() {
  const p = pac(E.ui.cel.pacId), evs = (E.d.evolucoes[p.id] || []).slice().reverse();
  return `${cabSub('Evolução')}
  <div class="cel-corpo">${evs.map(ev => `<div class="cel-card"><span class="mini muted">${dataBRc(ev.data)} · ${esc(prof(ev.por).curto)}</span><br>${esc(ev.texto)}
    ${ev.itens.length ? `<div class="mini" style="margin-top:4px;color:var(--ok)">${ev.itens.map(id => { const i = plano(p.id).find(x => x.id === id); return i ? esc(nomeItem(i)) : ''; }).filter(Boolean).join(' · ')}</div>` : ''}</div>`).join('') || '<div class="vazio">Nenhuma evolução ainda.</div>'}</div>
  <div class="cel-rodape"><button class="btn btn-pri" data-a="celNovaEvo">Nova evolução</button></div>`;
}

/* arquivos */
function celArquivos() {
  const p = pac(E.ui.cel.pacId), arqs = (E.d.arquivos[p.id] || []).slice().reverse();
  return `${cabSub('Arquivos')}
  <div class="cel-corpo"><div class="cel-arqs">${arqs.map(a => `<button class="cel-arq" data-a="celVerArq" data-id="${a.id}"><span class="cel-arq-img">${ic(a.tipo === 'Radiografia' ? 'dente' : a.tipo === 'Foto clínica' ? 'foto' : 'arquivo', 30)}</span><b class="mini">${esc(a.tipo)}</b><span class="mini muted">${esc(a.nome)} · ${dataBR(a.data)}</span></button>`).join('')}</div>
    ${arqs.length ? '' : '<div class="vazio">Nenhum arquivo ainda.</div>'}</div>
  <div class="cel-rodape"><button class="btn btn-pri" data-a="celFoto">${ic('camera', 20)} Tirar foto</button></div>`;
}

A.celVerArq = ds => { E.ui.cel.arqId = ds.id; E.ui.cel.tela = 'arquivo'; render(); };
function celArquivo() {
  const p = pac(E.ui.cel.pacId), a = (E.d.arquivos[p.id] || []).find(x => x.id === E.ui.cel.arqId);
  return `${cabSub(esc(a.tipo), { t: 'arquivos', txt: 'Arquivos' }, `<div class="sub">${esc(a.nome)} · ${dataBRc(a.data)}</div>`)}
  <div class="cel-corpo"><div class="cel-arq-grande">${ic(a.tipo === 'Radiografia' ? 'dente' : a.tipo === 'Foto clínica' ? 'foto' : 'arquivo', 64)}<span class="mini">No sistema real: a imagem em tela cheia, com zoom de dois dedos.</span></div></div>`;
}

/* dados básicos — blueprint/07 §A4d e 09-permisos */
const dadosDe = p => ({ nome: p.nome, cel: p.cel, nasc: dataBRc(p.nasc), cpf: p.cpf || '', conv: p.conv });
function celDados() {
  const c = E.ui.cel, p = pac(c.pacId); if (!c.dados || c.dados.id !== p.id) c.dados = { id: p.id, f: dadosDe(p) };
  const f = c.dados.f, er = c.dados.erro || {};
  const campo = (rot, k, extra = '') => `<label class="cel-campo"><span>${rot}</span><input class="cel-input ${er[k] ? 'com-erro' : ''}" id="cel-d-${k}" value="${esc(f[k])}" data-campo="cel.dados.f.${k}" ${extra}><em class="cel-erro" id="cel-e-${k}">${er[k] || ''}</em></label>`;
  const mudou = JSON.stringify(f) !== JSON.stringify(dadosDe(p));
  return `${cabSub('Dados do paciente')}
  <div class="cel-corpo">
    ${campo('Nome completo', 'nome', 'data-ao="celDadoMudou" autocomplete="off"')}
    ${campo('Celular', 'cel', 'data-ao="celDadoMask" data-mask="cel" inputmode="tel"')}
    ${campo('Nascimento', 'nasc', 'data-ao="celDadoMask" data-mask="data" inputmode="numeric" placeholder="dd/mm/aaaa"')}
    ${campo('CPF', 'cpf', 'data-ao="celDadoMask" data-mask="cpf" inputmode="numeric"')}
    <label class="cel-campo"><span>Convênio</span><select class="cel-input" data-campo="cel.dados.f.conv" data-ao="celDadoMudou">${E.d.convenios.map(x => `<option value="${x.id}" ${x.id === f.conv ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></label>
    <div class="mini muted">Endereço, família e o resto do cadastro ficam no computador da recepção.</div>
  </div>
  <div class="cel-rodape"><button class="btn btn-pri" id="btn-dados" data-a="celSalvarDados" ${mudou ? '' : 'disabled'}>${mudou ? 'Salvar alterações' : 'Nada alterado'}</button></div>`;
}
/* mesma regra do Salvar, campo por campo */
function erroDado(k, v) {
  if (k === 'nome') return v.trim().split(/\s+/).length < 2 ? 'Escreva o nome completo.' : '';
  if (k === 'cel') return v.replace(/\D/g, '').length < 10 ? 'Faltam números no celular.' : '';
  if (k === 'nasc') { const iso = isoDeBR(v); return !iso || iso > E.d.hoje ? 'Confira a data (dd/mm/aaaa).' : ''; }
  // o dígito verificador só é conferido num CPF novo: os CPFs inventados do protótipo são inválidos de propósito
  if (k === 'cpf') return !v ? '' : v.replace(/\D/g, '').length !== 11 ? 'O CPF tem 11 números. Confira ou deixe em branco.'
    : v !== (pac(E.ui.cel.pacId) || {}).cpf && !cpfValido(v) ? 'Esse CPF não existe. Confira ou deixe em branco.' : '';
  return '';
}
/* um erro já mostrado some assim que o campo fica certo */
function limparErroDado(el) { const c = E.ui.cel, k = (el.dataset.campo || '').split('.').pop(), er = c.dados && c.dados.erro;
  if (!er || !er[k] || erroDado(k, el.value)) return;
  delete er[k]; el.classList.remove('com-erro'); const e = document.getElementById('cel-e-' + k); if (e) e.textContent = ''; }
A.celDadoMudou = (ds, el) => { if (el) limparErroDado(el); const c = E.ui.cel, b = document.getElementById('btn-dados'), mudou = JSON.stringify(c.dados.f) !== JSON.stringify(dadosDe(pac(c.pacId)));
  if (b) { b.disabled = !mudou; b.textContent = mudou ? 'Salvar alterações' : 'Nada alterado'; } };
A.celDadoMask = (ds, el) => { mascara(el, ds.campo, ds.mask); A.celDadoMudou(ds, el);
  // data completa e impossível (31/02): avisa na hora, embaixo do campo
  if (ds.mask === 'data') { const e = document.getElementById('cel-e-nasc'), ruim = el.value.length === 10 && (!isoDeBR(el.value) || isoDeBR(el.value) > E.d.hoje);
    if (e) e.textContent = ruim ? 'Essa data não existe. Confira dia e mês.' : ''; el.classList.toggle('com-erro', ruim); } };
A.celSalvarDados = () => {
  const c = E.ui.cel, p = pac(c.pacId), f = c.dados.f;
  const iso = isoDeBR(f.nasc), erro = {};
  ['nome', 'cel', 'nasc', 'cpf'].forEach(k => { const m = erroDado(k, f[k]); if (m) erro[k] = m; });
  if (Object.keys(erro).length) { c.dados.erro = erro; E.ui.foco = 'cel-d-' + Object.keys(erro)[0]; render(); return; }
  const novo = { nome: f.nome.trim(), cel: f.cel, nasc: iso, cpf: f.cpf, conv: f.conv };
  c.dados = null; c.tela = 'paciente';
  celGravar('Dados atualizados.', () => Object.assign(p, novo));
};

/* evolução */
/* rascunho por paciente: voltar para olhar o plano não apaga nada */
A.celNovaEvo = () => { const c = E.ui.cel; c.rascunhos = c.rascunhos || {};
  c.evo = c.rascunhos[c.pacId] = c.rascunhos[c.pacId] || { texto: '', itens: {} }; c.tela = 'evolucao'; render(); };
function celEvo() {
  const p = pac(E.ui.cel.pacId), ev = E.ui.cel.evo;
  const abertos = plano(p.id).filter(i => ['aprovado', 'indicado'].includes(i.estado));
  return `${cabSub('Nova evolução')}
  <div class="cel-corpo"><b>O que foi feito hoje?</b>
    ${abertos.map(i => `<label class="chk"><input type="checkbox" ${ev.itens[i.id] ? 'checked' : ''} data-a="celEvoItem" data-id="${i.id}"><span>${esc(nomeItem(i))}</span></label>`).join('') || '<div class="muted mini">Nada pendente no plano.</div>'}
    <div style="margin-top:14px"><b>Observações</b></div>
    <textarea data-campo="cel.evo.texto" placeholder="Escreva, ou toque no microfone do teclado para ditar">${esc(ev.texto)}</textarea>
    <div class="chips"><button data-a="celFoto">${ic('camera', 18)} Foto</button></div>
  </div>
  <div class="cel-rodape"><button class="btn btn-pri" data-a="celSalvarEvo">Salvar evolução</button></div>`;
}
A.celEvoItem = (ds, el) => { E.ui.cel.evo.itens[ds.id] = el.checked; };
A.celSalvarEvo = () => {
  const c = E.ui.cel, pid = c.pacId, pr = profCel(), ev = c.evo;
  const itens = Object.keys(ev.itens).filter(k => ev.itens[k]), texto = ev.texto;
  if (!itens.length && !texto.trim()) { toast('Marque o que foi feito ou escreva uma observação.'); return; }
  const ag = E.d.agendamentos.find(a => a.pac === pid && a.prof === pr && a.estado === 'em_atendimento');
  // salvar a evolução também finaliza o atendimento: a recepção vê "Atendido"
  // busca o agendamento pelo id na hora de gravar: fora do Wi-Fi a fila roda depois, e um Desfazer
  // no meio troca E.d inteiro (o objeto guardado agora já não seria o da agenda)
  const agId = ag && ag.id;
  const fazer = () => { salvarEvolucao(pid, pr, texto, itens); const a = agId && E.d.agendamentos.find(x => x.id === agId); if (a && a.estado === 'em_atendimento') a.estado = 'atendido'; };
  delete (c.rascunhos || {})[pid];
  c.finalizou = !!ag;
  if (E.ui.celForaWifi) { semDesfazer(); c.fila.push(fazer); c.evoPendente = true; c.tela = 'evoOk'; render(); return; }
  c.evoPendente = false; comDesfazer('Evolução salva.', () => { fazer(); c.tela = 'evoOk'; });
};
function celEvoOk() {
  const c = E.ui.cel, p = pac(c.pacId);
  const ag = E.d.agendamentos.find(a => a.pac === p.id && a.prof === profCel() && a.estado === 'em_atendimento');
  return `<div class="cel-cab"><h2>${c.evoPendente ? 'Salva no celular' : 'Evolução salva'}</h2><div class="sub">${esc(p.nome)}</div></div>
  <div class="cel-corpo">
    ${c.evoPendente ? '<div class="aviso-box aviso">Você está fora do Wi-Fi. A evolução ficou guardada no celular e vai ser enviada sozinha quando a conexão voltar. Nada se perde.</div>' : ''}
    ${c.finalizou ? `<div class="aviso-box ok">${ic('checks', 16)} Atendimento ${c.evoPendente ? 'vai ser finalizado' : 'finalizado'}. A recepção já vê “Atendido”.</div>` : ''}
    <b>Próximo passo</b>
    <div class="chips"><button data-a="celRetorno">${ic('remarcar', 18)} Agendar retorno</button><button data-a="celTela" data-t="agenda">Nada, voltar à agenda</button></div>
    <div class="mini muted">“Agendar retorno” manda um pedido para a recepção. Você não precisa abrir a agenda.</div>
  </div>`;
}
A.celFinalizar = ds => { const a = E.d.agendamentos.find(x => x.id === ds.id);
  comDesfazer(`Atendimento finalizado: ${esc(pac(a.pac).nome)}.`, () => { a.estado = 'atendido'; }); };
A.celRetorno = () => { const c = E.ui.cel;
  E.d.pedidosRetorno.push({ id: uid(), pac: c.pacId, prof: profCel(), feito: false });
  c.tela = 'agenda'; render(); toast('Pedido de retorno enviado à recepção.'); };

/* foto */
A.celFoto = () => { E.ui.cel.foto = { tipo: 'Foto clínica', momento: '', tirada: false }; E.ui.cel.voltaFoto = E.ui.cel.tela; E.ui.cel.tela = 'foto'; render(); };
function celFoto() {
  const f = E.ui.cel.foto, p = pac(E.ui.cel.pacId);
  return `${cabSub('Foto', { t: E.ui.cel.voltaFoto, txt: { paciente: 'Ficha', evolucao: 'Evolução', arquivos: 'Arquivos' }[E.ui.cel.voltaFoto] || 'Voltar' })}
  <div class="cel-corpo"><div class="cam">${f.tirada ? `<span style="color:#cfe6d6">${ic('check', 54)}</span>` : ic('camera', 54)}</div>
    ${f.tirada ? '' : `<button class="btn btn-pri" style="width:100%;min-height:56px;margin-top:10px" data-a="celDisparar">${ic('camera', 20)} Tirar foto</button>`}
    <div class="grupo-tit">Tipo</div>
    <div class="chips">${['Foto clínica', 'Radiografia', 'Ficha em papel', 'Documento'].map(t => `<button class="${f.tipo === t ? 'on' : ''}" data-a="celFotoTipo" data-v="${t}">${t}</button>`).join('')}</div>
    <div class="grupo-tit">Momento <span class="muted">(opcional)</span></div>
    <div class="chips">${['Antes', 'Depois'].map(t => `<button class="${f.momento === t ? 'on' : ''}" data-a="celFotoMom" data-v="${t}">${t}</button>`).join('')}</div>
  </div><div class="cel-rodape"><button class="btn ${f.tirada ? 'btn-pri' : ''}" data-a="celEnviarFoto" ${f.tirada ? '' : 'disabled'}>${f.tirada ? `Enviar para a ficha de ${esc(p.nome.split(' ')[0])}` : 'Tire a foto primeiro'}</button></div>`;
}
A.celDisparar = () => { E.ui.cel.foto.tirada = true; render(); };
A.celFotoTipo = ds => { E.ui.cel.foto.tipo = ds.v; render(); };
A.celFotoMom = ds => { const f = E.ui.cel.foto; f.momento = f.momento === ds.v ? '' : ds.v; render(); };
A.celEnviarFoto = () => { const c = E.ui.cel, f = c.foto, pid = c.pacId; if (!f.tirada) return;
  const add = () => (E.d.arquivos[pid] = E.d.arquivos[pid] || []).push({ id: uid(), tipo: f.tipo, nome: f.momento || 'Pelo celular', data: E.d.hoje });
  if (E.ui.celForaWifi) c.fila.push(add); else add();
  c.tela = c.voltaFoto; render(); toast(E.ui.celForaWifi ? 'Foto guardada no celular — envia quando voltar a conexão.' : `Foto enviada para a ficha de ${esc(pac(pid).nome)}.`); };

/* pacientes */
function celListaPacs(t) {
  const u = usu(E.ui.cel.usuario);
  let lista = t && t.trim().length >= 2 ? buscarPacientes(t)
    : E.d.agendamentos.filter(a => a.prof === u.prof && a.pac).map(a => pac(a.pac));
  return [...new Set(lista)].map(p => `<div class="cel-card" data-a="celAbrirPac" data-id="${p.id}"><b>${numNomeCel(p)}</b> <span class="muted">· ${idade(p.nasc)} anos</span>${p.inativo ? ' <span class="tag inativo">inativo</span>' : ''}${alertas(p.id).length ? ` <span class="alerta-ico">${ic('alerta', 15)}</span>` : ''}</div>`).join('') || '<div class="vazio">Ninguém encontrado.</div>';
}
function celPacientes() {
  return `<div class="cel-cab"><h2>Pacientes</h2><input placeholder="Nome, nº ou celular" value="${esc(E.ui.cel.busca)}" data-campo="cel.busca" data-ao="celBusca" style="width:100%;margin-top:8px;padding:12px;border:1px solid var(--rule);border-radius:10px;font-size:16px"></div>
  <div class="cel-corpo"><div class="grupo-tit">${E.ui.cel.busca.trim().length >= 2 ? 'Resultados' : 'Seus pacientes de hoje'}</div><div id="cel-res">${celListaPacs(E.ui.cel.busca)}</div></div>`;
}
A.celBusca = (ds, el) => { document.getElementById('cel-res').innerHTML = celListaPacs(el.value); };

function celEu() {
  const u = usu(E.ui.cel.usuario);
  return `<div class="cel-cab"><h2>${esc(u.nome)}</h2><div class="sub">${E.d.unidade}</div></div>
  <div class="cel-corpo"><div class="cel-card">Versão do app: <b>protótipo 0.1</b><br><span class="mini muted">Conectado ao computador da recepção pelo QR code.</span></div>
    <button class="btn" style="width:100%;min-height:52px;margin-bottom:10px" data-a="celSair">Trocar usuário</button>
    ${MODO_CEL ? '<button class="btn" style="width:100%;min-height:52px;background:var(--gold-light)" data-a="abrirTestes">Tarefas de teste do protótipo</button>' : ''}</div>`;
}
A.celSair = () => { Object.assign(E.ui.cel, { usuario: null, tela: 'login', pinUsu: null, pinBuf: '' }); render(); };

/* dono — Caixa do dia */
function telaDono() {
  const c = E.ui.cel, semNet = E.ui.clinicaSemInternet, corte = semNet ? 625 : 1e9;
  let tot, ag;
  if (c.diaDono === 'ontem') {
    const o = E.d.ontem; tot = { total: o.total, porForma: { Pix: o.pix, 'Cartão': o.cartao, Dinheiro: o.dinheiro }, porProf: null }; ag = { agendados: o.agendados, atendidos: o.atendidos, faltas: o.faltas };
  } else {
    const recs = E.d.recebimentos.filter(r => r.hora <= corte);
    const porForma = {}, porProf = {};
    recs.forEach(r => { porForma[r.forma] = (porForma[r.forma] || 0) + r.valor; porProf[r.prof] = (porProf[r.prof] || 0) + r.valor; });
    tot = { total: recs.reduce((s, r) => s + r.valor, 0), porForma, porProf };
    const t = totaisDia(); ag = { agendados: t.agendados, atendidos: t.atendidos, faltas: t.faltas, aReceber: t.aReceberHoje };
  }
  const var_ = c.diaDono === 'hoje' ? Math.round((tot.total / E.d.ontem.total - 1) * 100) : null;
  const cx = E.d.caixa;
  return `<div class="dono-topo"><div class="ola">Bom dia, Sr. Austregesilo</div><div class="dono-tit">Caixa do dia · ${E.d.unidade}</div>
    <div class="quando">qui 29/10 · ${semNet && c.diaDono === 'hoje' ? 'sem atualização desde 10:25 — a clínica pode estar sem internet' : 'atualizado às 10:40'}</div><div class="fio"></div></div>
  <div class="cel-corpo">
    <div class="seg" style="margin-bottom:12px"><button class="${c.diaDono === 'hoje' ? 'ativo' : ''}" data-a="donoDia" data-v="hoje">Hoje</button><button class="${c.diaDono === 'ontem' ? 'ativo' : ''}" data-a="donoDia" data-v="ontem">Ontem</button></div>
    <div class="cel-card"><div class="mini muted" style="letter-spacing:.06em">RECEBIDO ${c.diaDono === 'hoje' ? 'HOJE' : 'ONTEM'}</div><div class="dono-total num">${brl(tot.total)}</div>
      ${var_ != null ? `<div class="mini muted">até agora · ontem o dia todo foi ${brl(E.d.ontem.total)}</div>` : ''}</div>
    <div class="cel-card"><b>Por forma de pagamento</b>${Object.entries(tot.porForma).sort((a, b) => b[1] - a[1]).map(([f, v]) => `<div class="dono-linha"><span>${formaHTML(f === 'Cartão' ? 'Cartão crédito' : f).replace('Cartão crédito', f)}</span><b class="num">${brl(v)}</b></div>`).join('')}</div>
    <div class="cel-card"><b>Pacientes</b><div class="dono-linha"><span>Agendados</span><b>${ag.agendados}</b></div><div class="dono-linha"><span>Atendidos</span><b>${ag.atendidos}</b></div><div class="dono-linha"><span>Faltaram</span><b>${ag.faltas}</b></div></div>
    ${tot.porProf ? `<div class="cel-card"><b>Por profissional</b>${Object.entries(tot.porProf).map(([id, v]) => `<div class="dono-linha"><span>${id && prof(id) ? prof(id).curto : 'Sem profissional'}</span><b class="num">${brl(v)}</b></div>`).join('')}</div>` : ''}
    ${ag.aReceber != null ? `<div class="cel-card"><div class="dono-linha"><span>Vence hoje e falta receber</span><b class="num">${brl(ag.aReceber)}</b></div>
      <div class="dono-linha"><span>Caixa</span>${cx.fechado ? `<span class="cx-status fechado">${ic('cadeado', 14)} Fechado às ${hhmm(cx.hora)}</span>` : '<span class="cx-status aberto"><span class="ponto"></span>Aberto</span>'}</div>
      ${cx.fechado && cx.dif ? `<div class="dono-linha" style="color:var(--erro)"><span>Gaveta</span><b>${cx.dif > 0 ? 'sobrou' : 'faltou'} ${brl(Math.abs(cx.dif))}</b></div>` : ''}</div>` : ''}
    <div class="mini muted" style="text-align:center">Aqui aparecem só números. Nomes e fichas de pacientes nunca saem da clínica.</div>
    <button class="btn" style="width:100%;margin-top:12px" data-a="celSair">Sair</button>
    ${MODO_CEL ? '<button class="btn" style="width:100%;margin-top:10px;background:var(--gold-light)" data-a="abrirTestes">Tarefas de teste do protótipo</button>' : ''}
  </div>`;
}
A.donoDia = ds => { E.ui.cel.diaDono = ds.v; render(); };
