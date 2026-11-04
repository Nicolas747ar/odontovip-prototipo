/* Carril B — MacBook (T-018): agenda (repetir, feriados/férias/horário, lista de espera, alerta de retorno)
   e WhatsApp 2 (cobrança, avaliação sem tratamento, pós-operatório, inativos, aviso de desconexão).
   Registra telas em TELAS_EXTRA e o menu em MENU_EXTRA (ver pc.js). */

/* ---------- datas (o protótipo vive na quinta 29/10/2026) ---------- */
const DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_SEM_LONGO = ['aos domingos', 'às segundas', 'às terças', 'às quartas', 'às quintas', 'às sextas', 'aos sábados'];
const isoMais = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const diaSem = iso => new Date(iso + 'T12:00:00').getDay();
const dataCurta = iso => `${DIAS_SEM[diaSem(iso)]} ${dataBR(iso)}`;
const ehHojeAg = iso => !iso || iso === E.d.hoje;

/* ---------- feriados, férias e horário de cada dentista ---------- */
const feriadoEm = iso => E.d.feriados.find(x => x.data === iso);
const feriasEm = (pf, iso) => E.d.ferias.find(x => x.prof === pf && x.de <= iso && iso <= x.ate);
const horarioEm = (pf, iso) => (E.d.horarios[pf] || {})[diaSem(iso)] || null;
/* por que não dá para agendar nesse dia e hora ('' = pode) */
function bloqueioAg(pf, iso, ini, fim) {
  const fe = feriadoEm(iso); if (fe) return `${dataCurta(iso)} é feriado (${fe.nome}). Escolha outro dia.`;
  const fs = feriasEm(pf, iso); if (fs) return `${prof(pf).curto} está de férias de ${dataBR(fs.de)} a ${dataBR(fs.ate)}. Escolha outro dia ou outra dentista.`;
  const h = horarioEm(pf, iso);
  if (!h) return `${prof(pf).curto} não atende ${DIAS_SEM_LONGO[diaSem(iso)]}. Escolha outro dia.`;
  if (ini < h[0]) return `${prof(pf).curto} começa às ${hhmm(h[0])} ${DIAS_SEM_LONGO[diaSem(iso)]}. Escolha a partir das ${hhmm(h[0])}.`;
  if (fim > h[1]) return `Termina às ${hhmm(fim)} e ${prof(pf).curto} atende até as ${hhmm(h[1])}. Escolha até as ${hhmm(h[1] - (fim - ini))}.`;
  return '';
}
/* choque com uma consulta de outro dia (as de hoje continuam em conflitos(), no nucleo.js) */
function conflitoFut(f, iso, ini, fim) {
  return E.d.agFuturos.find(a => a.data === iso && a.estado !== 'desmarcou' && a.id !== f.remarcaDe
    && (a.prof === f.prof || (f.cad && a.cad === f.cad)) && a.ini < fim && ini < a.ini + a.dur);
}
/* as próximas 8 semanas, para o campo Data do novo agendamento */
const datasAg = () => Array.from({ length: 57 }, (_, i) => isoMais(E.d.hoje, i));
function opcoesDataAg(sel, pf) {
  return datasAg().map(d => { const fe = feriadoEm(d), fs = pf && feriasEm(pf, d);
    return `<option value="${d}" ${d === sel ? 'selected' : ''}>${dataCurta(d)}${fe ? ' · feriado' : fs ? ' · férias' : ''}</option>`; }).join('');
}
A.dataAg = () => render();
/* a data final só redesenha quando está completa: digitando o ano não perde o foco; vazia, volta à última boa */
/* a data final não redesenha enquanto se digita (o Chrome dá uma data válida a cada número); redesenha ao sair do campo */
A.repAteAg = (ds, el) => { const r = fAg().rep, v = el.value; if (/^\d{4}-\d{2}-\d{2}$/.test(v) && v > (fAg().data || E.d.hoje)) r.ateOk = v; };
A.repAteFim = () => { const f = E.ui.pc.painel && E.ui.pc.painel.f; if (!f || !f.rep) return; const r = f.rep, base = f.data || E.d.hoje;
  if (!(/^\d{4}-\d{2}-\d{2}$/.test(r.ate) && r.ate > base)) { r.ate = r.ateOk || isoMais(base, 90); toast(`A data final tem que ser depois de ${dataBR(base)}: voltou para ${dataBR(r.ate)}.`); } else r.ateOk = r.ate;
  render(); };
/* as opções do campo Hora já dizem quando não dá (antes de escolher): fora do horário ou ocupado */
function opcoesHoraAg(f, horas) {
  const dur = Number(f.dur), iso = f.data || E.d.hoje;
  return horas.map(h => { const m = paraMin(h), fora = bloqueioAg(f.prof, iso, m, m + dur) && h !== f.horaTxt;
    const ocup = f.pac && (ehHojeAg(iso) ? conflitos({ ...f, ini: m, dur }, f.remarcaDe).length : conflitoFut(f, iso, m, m + dur));
    return `<option value="${h}" ${h === f.horaTxt ? 'selected' : ''} ${fora ? 'disabled' : ''}>${h}${fora ? ' · fora do horário' : ocup ? ' · ocupado' : ''}</option>`; }).join(''); // o valor é só a hora (QA de integração)
}

/* ---------- turnos que se repetem (manutenção de ortodontia: a cada 4 semanas) ---------- */
const REP_MAX = () => E.d.feriados[E.d.feriados.length - 1].data; // depois disso os feriados não estão cadastrados
function repAg(f) { return (f.rep = f.rep || { on: false, cada: 4, unid: 'sem', fim: 'vezes', vezes: 6, ate: isoMais(E.d.hoje, 90) }); }
/* as datas depois da primeira, cada uma com o motivo de ser pulada ('' = entra) */
function repeticoesAg(f) {
  const r = repAg(f); if (!r.on) return [];
  const passo = Math.max(1, Number(r.cada) || 1) * (r.unid === 'sem' ? 7 : 1), ini = paraMin(f.horaTxt), fim = ini + Number(f.dur);
  const out = []; let d = f.data || E.d.hoje; out.cortada = false;
  // "após N vezes" conta a primeira; data que fica de fora é reposta com a seguinte.
  // Nos dois modos a série para no último feriado cadastrado: depois dele não dá para conferir (revisão de código).
  for (let i = 0; i < 400; i++) {
    d = isoMais(d, passo);
    if (r.fim === 'vezes' && out.filter(x => !x.motivo).length >= Math.max(1, Number(r.vezes) || 1) - 1) break;
    if (r.fim !== 'vezes' && d > r.ate) break;
    if (d > REP_MAX()) { out.cortada = true; break; }
    if (out.some(o => o.data === d)) continue; // um feriado anterior já foi trocado para este dia
    const c = conflitoFut(f, d, ini, fim), motivo = bloqueioAg(f.prof, d, ini, fim) || (c ? `ocupado: ${c.pac ? pac(c.pac).nome : c.tipo} às ${hhmm(c.ini)}` : '');
    // T-020: caiu num feriado → o dia útil mais perto (Natal 25/12 → 24/12); a série segue no ritmo de sempre
    const lim = r.fim !== 'vezes' && r.ate < REP_MAX() ? r.ate : REP_MAX();
    const fe = feriadoEm(d), alt = fe && diaUtilPerto(f, d, ini, fim, out, isoMais(d, passo), lim);
    out.push(alt ? { data: alt, motivo: '', noLugar: d, feriado: fe.nome } : { data: d, motivo });
  }
  return out;
}
/* até 3 dias antes ou depois (no empate, antes): entre a consulta anterior e a próxima da série, sem passar do fim (revisão de código) */
function diaUtilPerto(f, d, ini, fim, out, prox, lim) {
  const ant = out.length ? out[out.length - 1].data : (f.data || E.d.hoje);
  for (const n of [-1, 1, -2, 2, -3, 3]) { const x = isoMais(d, n);
    if (x <= ant || x <= E.d.hoje || x >= prox || x > lim || out.some(o => o.data === x)) continue;
    if (!bloqueioAg(f.prof, x, ini, fim) && !conflitoFut(f, x, ini, fim)) return x; }
  return null;
}
function repetirHTML(f) {
  const r = repAg(f), reps = repeticoesAg(f), puladas = reps.filter(x => x.motivo);
  const b0 = bloqueioAg(f.prof, f.data || E.d.hoje, paraMin(f.horaTxt), paraMin(f.horaTxt) + Number(f.dur)); // a primeira data, a do próprio agendamento
  const sel = (campo, ops, v) => `<select data-campo="pc.painel.f.rep.${campo}" data-ao="dataAg">${ops.map(([k, t]) => `<option value="${k}" ${String(k) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  return `<div class="campo rep-ag"><label class="rep-tog"><input type="checkbox" ${r.on ? 'checked' : ''} data-campo="pc.painel.f.rep.on" data-ao="dataAg"> Repetir esta consulta</label>
    ${r.on ? `<div class="rep-linha"><span>a cada ${sel('cada', [1, 2, 3, 4, 5, 6, 8, 12].map(n => [n, n]), r.cada)} ${sel('unid', [['sem', 'semanas'], ['dia', 'dias']], r.unid)}</span>
      <span>termina ${sel('fim', [['vezes', 'após'], ['data', 'em']], r.fim)}
      ${r.fim === 'vezes' ? `${sel('vezes', [2, 3, 4, 5, 6, 8, 10, 12].map(n => [n, n]), r.vezes)} vezes</span>` : `<input type="date" class="rep-ate" min="${isoMais(f.data || E.d.hoje, 1)}" max="${REP_MAX()}" value="${r.ate}" data-campo="pc.painel.f.rep.ate" data-ao="repAteAg" onblur="A.repAteFim()" aria-label="Última data"></span>`}</div>
      ${reps.cortada ? `<div class="rep-pula"><span>${ic('alerta', 13)} A série para em ${dataBR(REP_MAX())}: depois disso os feriados ainda não estão cadastrados.</span></div>` : ''}
      ${(ds => `<div class="rep-resumo">${ic('agenda', 15)} <b>${ds.length} ${ds.length === 1 ? 'consulta' : 'consultas'}:</b> ${ds.slice(0, 10).map(x => x.noLugar ? `<b>${dataBR(x.data)}</b> <span class="muted">(no lugar de ${dataBR(x.noLugar)}, ${esc(x.feriado)})</span>` : dataBR(x.data)).join(', ') || '—'}${ds.length > 10 ? ` … até ${dataBR(ds[ds.length - 1].data)}` : ''}</div>`)([...(b0 ? [] : [{ data: f.data || E.d.hoje }]), ...reps.filter(x => !x.motivo)])}
      ${puladas.length ? `<div class="rep-pula">${puladas.slice(0, 4).map(x => `<span class="rep-d pula">${ic('x', 13)} ${dataBR(x.data)}</span> <span>${esc(x.motivo.replace(/\.\s*Escolha.*$/, '').replace(/\.$/, ''))}</span>`).join('<br>')}${puladas.length > 4 ? `<br><span>e mais ${puladas.length - 4} ${puladas.length - 4 === 1 ? 'data' : 'datas'}</span>` : ''}<br><span class="muted">${puladas.length === 1 ? 'Essa data fica de fora' : 'Essas datas ficam de fora'} e entra a seguinte.</span></div>` : ''}` : ''}</div>`;
}

/* ---------- lista de espera + "vaga liberada" ---------- */
const turnoDe = ini => (ini < 720 ? 'manha' : 'tarde');
const TURNOS = { manha: 'manhã', tarde: 'tarde' };
const esperaQuem = e => (e.prof ? prof(e.prof).curto : `qualquer dentista de ${e.esp}`);
const esperaServe = (e, pf) => (e.prof ? e.prof === pf : prof(pf).esp === e.esp);
/* consultas de hoje desmarcadas que ainda não passaram: quem da lista de espera pode ocupar */
function vagasLiberadas() {
  return E.d.agendamentos.filter(a => a.pac && a.estado === 'desmarcou' && a.ini > E.d.agoraMin && !a.vagaUsada
      && !conflitos({ prof: a.prof, cad: a.cad, ini: a.ini, dur: a.dur }, a.id).length) // alguém já ocupou o horário: não oferece
    .map(a => ({ a, quem: E.d.espera.filter(e => !e.saiu && e.pac !== a.pac && esperaServe(e, a.prof) && e.dias.includes(diaSem(E.d.hoje)) && e.turnos.includes(turnoDe(a.ini))) }))
    .filter(v => v.quem.length);
}
const msgVaga = (e, a) => `Olá, ${pac(e.pac).nome.split(' ')[0]}! Abriu um horário hoje, ${DIA}, às ${hhmm(a.ini)} com ${prof(a.prof).curto} na Odonto Vip. Quer ficar com ele? Responda SIM e a gente confirma.`;
function pendenciasAgWa() {
  marcaWaCaiu(); // pendenciasHoje() roda a cada desenho do PC: a barra de cima fica sempre em dia
  const urg = [], vagas = [];
  if (E.ui.waDesconectado && pode('whatsapp')) urg.push(itemAtencao('alerta', 'erro', 'O WhatsApp da clínica desconectou', 'as mensagens <b>não estão saindo</b> · reconecte o número',
    '<button class="btn btn-peq btn-pri" data-a="tela" data-t="whatsapp">Ver o WhatsApp</button>', '', '', 'WhatsApp desconectado'));
  (pode('caixa') ? vagasLiberadas() : []).forEach(v => { const e = v.quem[0];
    vagas.push(itemAtencao('agenda', 'info', `${hhmm(v.a.ini)} com ${esc(prof(v.a.prof).curto)} ficou livre`, `${esc(pac(v.a.pac).nome.split(' ')[0])} desmarcou · oferecer a <b>${esc(pac(e.pac).nome)}</b>${v.quem.length > 1 ? ` (e mais ${v.quem.length - 1})` : ''}`,
      `<button class="btn btn-peq btn-pri" data-a="verVaga" data-id="${v.a.id}">Oferecer</button>`, '', '', 'Vaga liberada')); });
  return { urg, vagas, html: [...urg, ...vagas], n: urg.length + vagas.length };
}
A.verVaga = ds => { Object.assign(E.ui.pc, { tela: 'espera', esperaAba: 'espera', vagaFoco: ds.id, painel: null }); render(); };
A.vagaWa = ds => { const a = E.d.agendamentos.find(x => x.id === ds.id), e = E.d.espera.find(x => x.id === ds.e);
  comDesfazer(`Mensagem para ${esc(pac(e.pac).nome)} na fila do WhatsApp.`, () => { e.oferecida = a.id; }); };
A.vagaAgendar = ds => { const a = E.d.agendamentos.find(x => x.id === ds.id), e = E.d.espera.find(x => x.id === ds.e);
  abrirNovoAg({ pac: e.pac, prof: a.prof, cad: a.cad, ini: a.ini, dur: a.dur, proc: '', tipo: 'Consulta', origem: 'Continuação de tratamento', obs: 'Da lista de espera' });
  Object.assign(E.ui.pc.painel.f, { espera: e.id, vagaDe: a.id }); };

/* ---------- alerta de retorno: do plano/evolução (dados) e dos pedidos de 6 meses do celular ---------- */
function retornosPrevistos() {
  const doCel = E.d.pedidosRetorno.filter(r => r.quando == 180 && !r.feito).map(r => ({ id: r.id, pac: r.pac, meses: 6, desde: E.d.hoje, por: r.prof, origem: 'pedido no celular', motivo: resumoRetorno(r) }));
  return [...E.d.alertasRetorno, ...doCel].map(x => ({ ...x, vence: somaMeses(x.desde, x.meses) })).sort((a, b) => a.vence.localeCompare(b.vence));
}
const temConsulta = pid => E.d.agendamentos.some(a => a.pac === pid && !['desmarcou', 'remarcado', 'faltou', 'atendido'].includes(a.estado)) || E.d.agFuturos.some(a => a.pac === pid && a.estado !== 'desmarcou');
const retornosVencendo = () => retornosPrevistos().filter(x => !x.agendado && !temConsulta(x.pac) && x.vence <= isoMais(E.d.hoje, 30));
/* os que vencem em 30 dias entram na lista "Retorno de 6 meses" do WhatsApp (sem repetir quem já está) */
function waSincRetornos() {
  const l = E.d.whatsapp.retornoMes;
  for (let i = l.length - 1; i >= 0; i--) if (l[i].pid && temConsulta(l[i].pid)) l.splice(i, 1); // quem já agendou sai da lista
  retornosVencendo().forEach(x => { const p = pac(x.pac); if (!l.some(c => c.id === 'ar-' + x.id || c.nome === p.nome))
    l.push({ id: 'ar-' + x.id, pid: x.pac, nome: p.nome, ultima: x.desde.slice(0, 4) === E.d.hoje.slice(0, 4) ? dataBR(x.desde) : dataBRc(x.desde), meses: x.meses, prof: prof(x.por).curto, proc: x.motivo }); });
}

/* ---------- tela: Espera e retornos ---------- */
function telaEspera() {
  const pc = E.ui.pc, aba = pc.esperaAba || 'espera', vagas = vagasLiberadas(), lista = E.d.espera.filter(e => !e.saiu), rets = retornosPrevistos().filter(x => !x.agendado && !temConsulta(x.pac));
  const tabs = `<div class="tabs" role="tablist">${[['espera', 'Lista de espera', lista.length], ['retornos', 'Retornos previstos', retornosVencendo().length]].map(([k, t, n]) => `<button role="tab" aria-selected="${aba === k}" class="${aba === k ? 'on' : ''}" data-a="esperaAba" data-v="${k}">${t} <span class="num">${n}</span></button>`).join('')}</div>`;
  const cab = `<div class="titulo-tela"><h1>Espera e retornos</h1>${tabs}
    <span class="titulo-acoes">${aba === 'espera' && !pc.esperaNova ? `<button class="btn ${vagas.length ? 'btn-sec' : 'btn-pri'}" data-a="esperaNova">${ic('mais', 16)} Pôr na lista de espera</button>` : ''}</span></div>`;
  if (aba === 'retornos') {
    const linha = x => { const p = pac(x.pac), venceu = x.vence < E.d.hoje, perto = x.vence <= isoMais(E.d.hoje, 30);
      return `<div class="ag-linha"><span class="av">${esc(iniciais(p.nome))}</span><span class="h-pac-txt"><b>nº ${p.numero} · ${esc(p.nome)}</b><span class="h-meta">${esc(x.motivo || 'Retorno')} · ${x.meses} meses · ${esc(x.origem)} de ${esc(prof(x.por).curto)}</span></span>
        <span class="ag-vence ${venceu ? 'venceu' : perto ? 'perto' : ''}">${venceu ? `venceu ${dataBR(x.vence)}` : `vence ${dataBR(x.vence)}`}</span>
        <span class="acoes"><button class="btn btn-peq" data-a="retAgendar" data-id="${x.id}">Agendar</button></span></div>`; };
    const vencem = rets.filter(x => x.vence <= isoMais(E.d.hoje, 30)), depois = rets.filter(x => x.vence > isoMais(E.d.hoje, 30));
    return `${cab}<div class="cartao h-lista"><div class="cartao-cab"><h3>Vencem nos próximos 30 dias</h3><span class="cont">${vencem.length}</span>
        ${vencem.length ? `<button class="btn-link" style="margin-left:auto" data-a="waIrLista" data-v="retornoMes">${ic('msg', 16)} Já estão na lista do WhatsApp</button>` : ''}</div>
      ${vencem.map(linha).join('') || '<div class="vazio">Nenhum retorno vence nos próximos 30 dias.</div>'}</div>
      ${depois.length ? `<details class="cartao ag-depois"><summary><b>Mais adiante</b> <span class="cont">${depois.length}</span></summary>${depois.map(linha).join('')}</details>` : ''}`;
  }
  const nova = pc.esperaNova ? esperaFormHTML(pc.esperaNova) : '';
  const vagaHTML = vagas.map(v => { const a = v.a;
    return `<div class="cartao ag-vaga ${pc.vagaFoco === a.id ? 'foco' : ''}"><div class="cartao-cab"><h3>${ic('agenda', 18)} Vaga liberada · hoje ${hhmm(a.ini)} com ${esc(prof(a.prof).curto)}</h3><span class="muted mini">${esc(pac(a.pac).nome)} cancelou${a.motivo ? ` (${esc(a.motivo)})` : ''}</span></div>
      ${v.quem.map(e => `<div class="ag-vaga-pac"><span class="h-pac-txt"><b>nº ${pac(e.pac).numero} · ${esc(pac(e.pac).nome)}</b><span class="h-meta">na lista desde ${dataBR(e.desde)}${e.obs ? ' · ' + esc(e.obs) : ''}</span></span>
        <div class="wa-fone ag-wa"><div class="wa-balao">${esc(msgVaga(e, a))}</div></div>
        <span class="acoes">${e.oferecida === a.id ? `<span class="est est-confirmado">${ic('relogio', 15)} Oferecida no WhatsApp</span>` : `<button class="btn btn-sec" data-a="vagaWa" data-id="${a.id}" data-e="${e.id}">${ic('enviar', 16)} Enviar pelo WhatsApp</button>`}
          <button class="btn btn-pri" data-a="vagaAgendar" data-id="${a.id}" data-e="${e.id}">Agendar ${hhmm(a.ini)}</button></span></div>`).join('')}</div>`; }).join('');
  return `${cab}${vagaHTML}${nova}
    <div class="cartao h-lista"><div class="cartao-cab"><h3>Quem espera um horário</h3><span class="cont">${lista.length}</span></div>
      ${lista.map(e => { const p = pac(e.pac);
        return `<div class="ag-linha"><span class="av">${esc(iniciais(p.nome))}</span><span class="h-pac-txt"><b>nº ${p.numero} · ${esc(p.nome)}</b><span class="h-meta">${esc(esperaQuem(e))} · ${e.dias.map(d => DIAS_SEM[d]).join(', ')} · ${e.turnos.map(t => TURNOS[t]).join(' ou ')}${e.obs ? ' · ' + esc(e.obs) : ''}</span></span>
          <span class="muted mini">desde ${dataBR(e.desde)}</span>
          <span class="acoes"><button class="btn btn-peq" data-a="esperaTirar" data-id="${e.id}">Tirar da lista</button></span></div>`; }).join('') || '<div class="vazio">Ninguém na lista de espera. Quando alguém cancela, a vaga aparece aqui e em Hoje.</div>'}</div>`;
}
function esperaFormHTML(n) {
  const chips = (campo, ops) => `<div class="chips">${ops.map(([k, t]) => `<button class="${n[campo].includes(k) ? 'on' : ''}" aria-pressed="${n[campo].includes(k)}" data-a="esperaChip" data-c="${campo}" data-v="${k}">${n[campo].includes(k) ? ic('check', 16) : ''}${t}</button>`).join('')}</div>`;
  const rotPac = p => `nº ${p.numero} · ${p.nome} · ${idade(p.nasc)} anos · ${ult4(p.cel)}`;
  return `<div class="cartao ag-form"><div class="cartao-cab"><h3>Pôr na lista de espera</h3></div>
    <div class="duas"><div class="campo"><label for="le-pac">Paciente <span class="obrig">*</span></label><input id="le-pac" list="le-pacs" autocomplete="off" placeholder="Nome, nº ou telefone" value="${n.pac ? esc(rotPac(pac(n.pac))) : esc(n.busca || '')}" data-ao="esperaPac"><datalist id="le-pacs">${E.d.pacientes.filter(p => !p.excluido).map(p => `<option value="${esc(rotPac(p))}"></option>`).join('')}</datalist></div>
      <div class="campo"><label>Com quem</label><select data-campo="pc.esperaNova.quem">${E.d.profissionais.map(x => `<option value="${x.id}" ${x.id === n.quem ? 'selected' : ''}>${esc(x.curto)}</option>`).join('')}${[...new Set(E.d.profissionais.map(x => x.esp))].map(es => `<option value="esp:${es}" ${n.quem === 'esp:' + es ? 'selected' : ''}>Qualquer dentista · ${esc(es)}</option>`).join('')}</select></div></div>
    <div class="campo"><label>Dias que servem</label>${chips('dias', [1, 2, 3, 4, 5, 6].map(d => [d, DIAS_SEM[d]]))}</div>
    <div class="campo"><label>Turno</label>${chips('turnos', Object.entries(TURNOS))}</div>
    <div class="campo"><label>Observação</label><input value="${esc(n.obs)}" data-campo="pc.esperaNova.obs" placeholder="Ex.: quer adiantar o canal"></div>
    ${n.erro ? `<div class="aviso-box erro">${n.erro}</div>` : ''}
    <button class="btn btn-pri" data-a="esperaSalvar">Pôr na lista</button> <button class="btn-link" data-a="esperaCancelar">Cancelar</button></div>`;
}
A.esperaAba = ds => { E.ui.pc.esperaAba = ds.v; render(); };
A.esperaNova = () => { E.ui.pc.esperaNova = { pac: '', busca: '', quem: 'p-mar', dias: [1, 2, 3, 4, 5], turnos: ['manha', 'tarde'], obs: '', erro: '' }; E.ui.foco = 'le-pac'; render(); };
A.esperaPac = (ds, el) => { const n = E.ui.pc.esperaNova, p = E.d.pacientes.find(x => !x.excluido && `nº ${x.numero} · ${x.nome} · ${idade(x.nasc)} anos · ${ult4(x.cel)}` === el.value);
  n.busca = el.value; n.pac = p ? p.id : ''; if (p && n.erro) { n.erro = ''; render(); } };
A.esperaCancelar = () => { E.ui.pc.esperaNova = null; render(); };
A.esperaChip = ds => { const n = E.ui.pc.esperaNova, l = n[ds.c], v = ds.c === 'dias' ? +ds.v : ds.v, i = l.indexOf(v); i >= 0 ? l.splice(i, 1) : l.push(v); render(); };
A.esperaSalvar = () => { const n = E.ui.pc.esperaNova;
  if (!n.pac && (n.busca || '').trim()) { const q = semAcento(n.busca.trim()), ach = E.d.pacientes.filter(p => !p.excluido && (semAcento(p.nome).includes(q) || String(p.numero) === q || p.cel.replace(/\D/g, '').endsWith(q.replace(/\D/g, '') || '§')));
    if (ach.length === 1) n.pac = ach[0].id; }
  n.erro = !n.pac ? 'Escolha o paciente.' : !n.dias.length ? 'Marque ao menos um dia.' : !n.turnos.length ? 'Marque ao menos um turno.' : '';
  if (n.erro) { render(); return; }
  const e = { id: uid(), pac: n.pac, dias: n.dias.slice().sort(), turnos: n.turnos.slice(), desde: E.d.hoje, obs: n.obs.trim() };
  if (n.quem.startsWith('esp:')) e.esp = n.quem.slice(4); else e.prof = n.quem;
  comDesfazer(`${esc(pac(n.pac).nome)} está na lista de espera.`, () => { E.d.espera.push(e); E.ui.pc.esperaNova = null; }); };
A.esperaTirar = ds => { const e = E.d.espera.find(x => x.id === ds.id); comDesfazer(`${esc(pac(e.pac).nome)} saiu da lista de espera.`, () => { e.saiu = true; }); };
A.retAgendar = ds => { const x = retornosPrevistos().find(r => r.id === ds.id);
  abrirNovoAg({ pac: x.pac, prof: x.por, tipo: 'Retorno', origem: 'Continuação de tratamento', obs: `Retorno previsto · ${x.motivo || ''}`.trim() });
  E.ui.pc.painel.f.alertaRet = x.id; };
/* depois de salvar o agendamento (pc.js A.salvarAg): tira da espera / do alerta quem foi agendado */
function aposAgendarAgWa(f) {
  if (f.espera) { const e = E.d.espera.find(x => x.id === f.espera); if (e) e.saiu = true; }
  if (f.vagaDe) { const a = E.d.agendamentos.find(x => x.id === f.vagaDe); if (a && a.prof === f.prof && paraMin(f.horaTxt) === a.ini && ehHojeAg(f.data)) a.vagaUsada = true; }
  if (f.alertaRet) { const r = E.d.alertasRetorno.find(x => x.id === f.alertaRet); if (r) r.agendado = true; else { const p = E.d.pedidosRetorno.find(x => x.id === f.alertaRet); if (p) p.feito = true; } }
}

/* ---------- Configurações → Unidade: feriados, férias e horários ---------- */
function cfgUnidadeAg() {
  const prox = E.d.feriados.filter(x => x.data >= E.d.hoje);
  // dias seguidos com o mesmo horário viram um trecho: "seg–sex 08:00–18:00 · sáb 08:00–12:00"
  const hor = pf => { const H = E.d.horarios[pf] || {}, out = [];
    [1, 2, 3, 4, 5, 6].forEach(d => { const h = H[d], k = h ? h.join('-') : '', u = out[out.length - 1];
      if (u && u.k === k && u.fim === d - 1) u.fim = d; else out.push({ k, h, ini: d, fim: d }); });
    return out.filter(t => t.h).map(t => `${DIAS_SEM[t.ini]}${t.fim > t.ini ? '–' + DIAS_SEM[t.fim] : ''} ${hhmm(t.h[0])}–${hhmm(t.h[1])}`).join(' · ') || 'não atende'; };
  return `<h4 class="ag-cfg-sub">Horário de cada dentista <span class="muted mini">· a agenda não deixa marcar fora do horário, nas férias nem nos feriados</span></h4>
    ${E.d.profissionais.map(pf => linhaCfg('usuario', esc(pf.curto), hor(pf.id))).join('')}
    <h4 class="ag-cfg-sub">Férias</h4>
    ${E.d.ferias.map(x => linhaCfg('calendarioX', esc(prof(x.prof).curto), `de ${dataBRc(x.de)} a ${dataBRc(x.ate)}`)).join('')}
    <h4 class="ag-cfg-sub">Feriados <span class="muted mini">· ${prox.length} nos próximos 12 meses</span></h4>
    <div class="ag-fer">${prox.map(x => `<span><b class="num">${dataCurta(x.data)}${x.data.slice(0, 4) !== E.d.hoje.slice(0, 4) ? '/' + x.data.slice(2, 4) : ''}</b> ${esc(x.nome)}${x.confirmar ? ' <span class="muted mini">a confirmar</span>' : ''}</span>`).join('')}</div>`;
}

/* ---------- WhatsApp 2: listas novas (gatilhos do Big Idea) ---------- */
/* cobrança: parcelas vencidas de verdade (as mesmas que o Caixa mostra) */
function waSincCobranca() { E.d.whatsapp.cobranca = Object.entries(E.d.parcelas).flatMap(([pid, ps]) => ps.filter(x => x.venc < E.d.hoje && x.valor > x.pago)
  .map(x => ({ id: 'wc-' + x.id, nome: pac(pid).nome, parcela: `${x.n}/${x.de}`, venc: dataBR(x.venc), valor: brl(x.valor - x.pago) }))); }
waSincCobranca();
Object.assign(WA_LISTAS, {
  cobranca: { rot: 'Parcela atrasada', cat: 'Utilidade', preco: 3.5, ico: 'dinheiro',
    msg: c => `Olá, ${c.nome.split(' ')[0]}! Tudo bem? Passando para lembrar da parcela ${c.parcela} do seu tratamento na Odonto Vip, de ${c.valor}, que venceu dia ${c.venc}. Se já pagou, desconsidere. Se precisar, a gente combina outra data. Responda aqui.`,
    meta: c => `parcela ${c.parcela} · ${c.valor} · venceu ${c.venc}` },
  avaliacao: { rot: 'Avaliação sem fechar', cat: 'Marketing', preco: 32.17, ico: 'prancheta',
    msg: c => `Olá, ${c.nome.split(' ')[0]}! Obrigado por vir à avaliação na Odonto Vip. Ficou alguma dúvida sobre o tratamento? Podemos ver juntos a forma de pagamento que fica melhor para você. Responda QUERO e a gente liga.`,
    meta: c => `avaliação ${c.aval} · ${c.orc} · ${c.valor}` },
  posOp: { rot: 'Pós-operatório', cat: 'Utilidade', preco: 3.5, ico: 'atendendo',
    msg: c => `Olá, ${c.nome.split(' ')[0]}! Como você está depois do procedimento? Se tiver dor forte, sangramento ou inchaço, responda aqui que ${c.prof} fala com você.`,
    meta: c => `${c.proc} ${c.quando} · ${c.prof}` },
  inativos: { rot: 'Inativos', cat: 'Marketing', preco: 32.17, ico: 'usuario',
    msg: c => `Olá, ${c.nome.split(' ')[0]}! Faz tempo que não te vemos na Odonto Vip. Que tal marcar uma revisão? Responda QUERO e a gente agenda para você.`,
    meta: c => `última consulta ${c.ultima} · sem consulta marcada` },
});
A.waIrLista = ds => { Object.assign(E.ui.pc, { tela: 'whatsapp', waLista: ds.v, painel: null }); render(); };
/* o aviso vai também na barra de cima e no menu: uma classe no <body> (o pcHTML não é do carril B) */
function marcaWaCaiu() { document.body.classList.toggle('wa-caiu-on', !!E.ui.waDesconectado); }
A.simWa = (ds, el) => { E.ui.waDesconectado = el.checked; marcaWaCaiu(); render(); };
A.waReconectar = () => { E.ui.waDesconectado = false; marcaWaCaiu(); render(); toast('WhatsApp reconectado. As mensagens que estavam na fila saem agora.'); };

/* ---------- registro (ganchos do pc.js) ---------- */
TELAS_EXTRA.espera = telaEspera;
MENU_EXTRA.push(['espera', 'relogio', 'Espera e retornos', '', () => pode('caixa')]);
