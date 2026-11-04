/* Carril B — MacBook (T-018): dados inventados de feriados, férias, horários, lista de espera,
   alertas de retorno e listas novas de WhatsApp. Carrega depois de dados.js e antes de nucleo.js. */
Object.assign(DADOS, {
  /* feriados de Boa Viagem (Recife · PE). Os 24 do Dental Office tinham erros: Carnaval e Páscoa com data fixa,
     Corpus Christi como nacional. Aqui: móveis calculados para 2026–2027; municipais de Recife [a confirmar]. */
  feriados: [
    { data: '2026-11-02', nome: 'Finados', tipo: 'nacional' },
    { data: '2026-11-15', nome: 'Proclamação da República', tipo: 'nacional' },
    { data: '2026-11-20', nome: 'Consciência Negra', tipo: 'nacional' },
    { data: '2026-12-08', nome: 'Nossa Senhora da Conceição', tipo: 'municipal', confirmar: true },
    { data: '2026-12-25', nome: 'Natal', tipo: 'nacional' },
    { data: '2027-01-01', nome: 'Confraternização Universal', tipo: 'nacional' },
    { data: '2027-02-08', nome: 'Carnaval (segunda)', tipo: 'móvel', confirmar: true },
    { data: '2027-02-09', nome: 'Carnaval (terça)', tipo: 'móvel', confirmar: true },
    { data: '2027-03-06', nome: 'Data Magna de Pernambuco', tipo: 'estadual' },
    { data: '2027-03-26', nome: 'Sexta-feira Santa', tipo: 'móvel' },
    { data: '2027-04-21', nome: 'Tiradentes', tipo: 'nacional' },
    { data: '2027-05-01', nome: 'Dia do Trabalho', tipo: 'nacional' },
    { data: '2027-05-27', nome: 'Corpus Christi', tipo: 'estadual' },
    { data: '2027-06-24', nome: 'São João', tipo: 'estadual' },
    { data: '2027-07-16', nome: 'Nossa Senhora do Carmo', tipo: 'municipal', confirmar: true },
    { data: '2027-09-07', nome: 'Independência', tipo: 'nacional' },
    { data: '2027-10-12', nome: 'Nossa Senhora Aparecida', tipo: 'nacional' },
  ],
  ferias: [
    { prof: 'p-raf', de: '2026-11-02', ate: '2026-11-13' },
    { prof: 'p-hel', de: '2026-12-21', ate: '2027-01-04' },
  ],
  /* horário de cada dentista por dia da semana (0 = domingo) em minutos; sem chave = não atende. Almoço 12:00–13:00 para todos. */
  horarios: {
    'p-mar': { 1: [480, 1080], 2: [480, 1080], 3: [480, 1080], 4: [480, 1080], 5: [480, 1080], 6: [480, 720] },
    'p-hel': { 1: [480, 1080], 2: [480, 1080], 3: [480, 1080], 4: [480, 1080], 5: [480, 1080] },
    'p-raf': { 1: [480, 960], 2: [480, 960], 3: [480, 960], 4: [480, 960], 5: [480, 960], 6: [480, 720] }, // ortodontia: até as 16:00
  },
  /* consultas de outros dias (o protótipo só desenha a agenda de hoje): turnos que se repetem caem aqui */
  agFuturos: [
    { id: 'af1', data: '2026-11-26', pac: 'pa114', prof: 'p-raf', cad: 'c3', ini: 480, dur: 20, proc: 'manut-orto', tipo: 'Periódico', estado: 'a_confirmar' },
  ],
  /* lista de espera (Dental Office e Big Idea): quem quer um horário antes */
  espera: [
    { id: 'le1', pac: 'pa119', prof: 'p-raf', dias: [2, 4], turnos: ['tarde'], desde: '2026-10-20', obs: 'Quer começar o aparelho antes das férias' },
    { id: 'le2', pac: 'pa101', esp: 'Endodontia', dias: [1, 2, 3, 4, 5], turnos: ['manha', 'tarde'], desde: '2026-10-27', obs: '' },
  ],
  /* retorno previsto (do plano ou da evolução): a lista "vencem nos próximos 30 dias" alimenta o WhatsApp */
  alertasRetorno: [
    { id: 'ar1', pac: 'pa120', meses: 6, desde: '2026-05-12', por: 'p-mar', origem: 'evolução', motivo: 'Limpeza' },
    { id: 'ar2', pac: 'pa121', meses: 6, desde: '2026-05-20', por: 'p-mar', origem: 'plano', motivo: 'Revisão da restauração' },
    { id: 'ar3', pac: 'pa122', meses: 12, desde: '2025-11-18', por: 'p-hel', origem: 'evolução', motivo: 'Controle do canal' },
    { id: 'ar5', pac: 'pa105', meses: 6, desde: '2026-05-05', por: 'p-mar', origem: 'evolução', motivo: 'Limpeza' }, // já tem consulta hoje: não entra na lista
    { id: 'ar4', pac: 'pa123', meses: 6, desde: '2026-07-02', por: 'p-mar', origem: 'plano', motivo: 'Limpeza' },
  ],
});
/* pacientes sem consulta marcada, para os retornos previstos (inventados) */
DADOS.pacientes.push(
  { id: 'pa120', numero: 120, nome: 'Renata Queiroz', nasc: '1985-03-09', cel: '(81) 99620-4417', cpf: '', conv: 'part', origem: 'Levantamento (6 meses)' },
  { id: 'pa121', numero: 121, nome: 'Gustavo Lemos', nasc: '1972-08-30', cel: '(81) 98804-1290', cpf: '', conv: 'part', origem: 'Redes sociais (Instagram)' },
  { id: 'pa122', numero: 122, nome: 'Helena Vasconcelos', nasc: '1961-01-17', cel: '(81) 99135-7702', cpf: '', conv: 'part', origem: 'Continuação de tratamento' },
  { id: 'pa123', numero: 123, nome: 'Igor Fontes', nasc: '1994-11-02', cel: '(81) 98412-3368', cpf: '', conv: 'part', origem: 'Levantamento (6 meses)' },
);
/* WhatsApp 2 (Big Idea §9, gatilhos): listas com pacientes inventados. A "cobrança" sai das parcelas de verdade (agenda-wa.js). */
Object.assign(DADOS.whatsapp, {
  avaliacao: [
    { id: 'wv1', nome: 'Patrícia Moura', aval: '14/10', orc: 'Clareamento + 2 restaurações', valor: 'R$ 1.180' },
    { id: 'wv2', nome: 'Henrique Bastos', aval: '21/10', orc: 'Implante 46', valor: 'R$ 3.200' },
    { id: 'wv3', nome: 'Clara Nogueira', aval: '23/10', orc: 'Aparelho ortodôntico', valor: 'R$ 2.400' },
  ],
  posOp: [
    { id: 'wp1', nome: 'Vera Lúcia Prado', proc: 'Exodontia de siso', quando: 'ontem', prof: 'Dra. Marcelly' },
    { id: 'wp2', nome: 'Renato Siqueira', proc: 'Exodontia simples', quando: 'ontem', prof: 'Dra. Marcelly' },
  ],
  inativos: [
    { id: 'wi1', nome: 'Sílvia Rangel', ultima: '12/02/2026', prof: 'Dra. Marcelly' },
    { id: 'wi2', nome: 'Otávio Brandão', ultima: '03/01/2026', prof: 'Dra. Helena' },
    { id: 'wi3', nome: 'Márcia Teles', ultima: '19/03/2026', prof: 'Dra. Marcelly' },
    { id: 'wi4', nome: 'Rui Cavalcanti', ultima: '27/12/2025', prof: 'Dr. Rafael' },
  ],
});
