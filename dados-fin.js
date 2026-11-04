/* Carril A — hackintosh (T-019): dados inventados de despesas, cartões e fluxo de caixa de Boa Viagem.
   Carrega depois de dados.js e antes de nucleo.js (que copia DADOS para E.d). Nenhum dado real. */
Object.assign(DADOS, {
  clinica: { nome: 'Odonto Vip', cnpj: null, endereco: 'Boa Viagem · Recife/PE' }, // CNPJ e endereço: a clínica informa
  /* categorias de despesa (as do Dental Office, resumidas); "dedutivel" = entra no Livro-Caixa / Carnê-Leão */
  catDespesa: [
    ['Aluguel', true], ['Condomínio', true], ['Energia', true], ['Água', true], ['Internet e telefone', true],
    ['Material odontológico', true], ['Laboratório (protético)', true], ['Limpeza e descartáveis', true],
    ['Salários e encargos', true], ['Contador', true], ['Marketing', true], ['Manutenção de equipamentos', true],
    ['Taxas da maquininha', true], ['Impostos', false], ['Outros', false],
  ],
  despesas: [
    { id: 'd1', desc: 'Aluguel da sala', cat: 'Aluguel', venc: '2026-10-05', valor: 450000, pago: true, fixo: true, forn: 'Imobiliária', forma: 'Pix' },
    { id: 'd2', desc: 'Condomínio', cat: 'Condomínio', venc: '2026-10-10', valor: 82000, pago: true, fixo: true, forn: 'Condomínio do edifício', forma: 'Boleto' },
    { id: 'd3', desc: 'Energia', cat: 'Energia', venc: '2026-10-15', valor: 61400, pago: true, fixo: true, forn: 'Distribuidora', forma: 'Débito automático' },
    { id: 'd4', desc: 'Internet e telefone', cat: 'Internet e telefone', venc: '2026-10-18', valor: 19900, pago: true, fixo: true, forn: 'Operadora', forma: 'Débito automático' },
    { id: 'd5', desc: 'Resina, anestésico e brocas', cat: 'Material odontológico', venc: '2026-10-20', valor: 138000, pago: true, fixo: false, forn: 'Dental distribuidora', forma: 'Boleto', parc: '1/2' },
    { id: 'd6', desc: 'Coroa de porcelana · nº 110', cat: 'Laboratório (protético)', venc: '2026-10-25', valor: 50000, pago: true, fixo: false, forn: 'Laboratório de prótese', forma: 'Pix', prof: 'p-mar' },
    { id: 'd7', desc: 'Contador', cat: 'Contador', venc: '2026-10-28', valor: 45000, pago: true, fixo: true, forn: 'Escritório contábil', forma: 'Pix' },
    { id: 'd8', desc: 'Salário da recepção', cat: 'Salários e encargos', venc: '2026-10-30', valor: 210000, pago: false, fixo: true, forn: '—', forma: 'Transferência' },
    { id: 'd9', desc: 'Luvas, máscaras e sugadores', cat: 'Limpeza e descartáveis', venc: '2026-10-31', valor: 34500, pago: false, fixo: false, forn: 'Dental distribuidora', forma: 'Boleto' },
    { id: 'd10', desc: 'Resina, anestésico e brocas', cat: 'Material odontológico', venc: '2026-11-20', valor: 138000, pago: false, fixo: false, forn: 'Dental distribuidora', forma: 'Boleto', parc: '2/2' },
    { id: 'd11', desc: 'Aluguel da sala', cat: 'Aluguel', venc: '2026-11-05', valor: 450000, pago: false, fixo: true, forn: 'Imobiliária', forma: 'Pix' },
    { id: 'd13', desc: 'ISS do mês', cat: 'Impostos', venc: '2026-11-10', valor: 31200, pago: false, fixo: true, forn: 'Prefeitura do Recife', forma: 'Boleto' },
    { id: 'd12', desc: 'Manutenção do compressor', cat: 'Manutenção de equipamentos', venc: '2026-10-27', valor: 28000, pago: false, fixo: false, forn: 'Técnico', forma: 'Pix' },
  ],
  /* taxas da maquininha (inventadas): % e em quantos dias cai na conta */
  taxasCartao: {
    'Cartão débito': { taxa: 1.49, dias: 1 },
    'Cartão crédito': { taxa: 3.19, dias: 30 },
    'Crédito parcelado': { taxa: 4.69, dias: 30, porParcela: true },
  },
  /* movimentos de cartão de antes de hoje em outubro (inventados); os de hoje vêm de recebimentos */
  cartoesAntes: [
    { id: 'k1', data: '2026-10-02', pac: 'pa105', forma: 'Cartão crédito', band: 'Visa', valor: 23000 },
    { id: 'k2', data: '2026-10-06', pac: 'pa109', forma: 'Cartão débito', band: 'Mastercard', valor: 15000 },
    { id: 'k3', data: '2026-10-09', pac: 'pa111', forma: 'Crédito parcelado', band: 'Elo', valor: 90000, n: 3 },
    { id: 'k4', data: '2026-10-14', pac: 'pa113', forma: 'Cartão crédito', band: 'Mastercard', valor: 18000 },
    { id: 'k5', data: '2026-10-20', pac: 'pa101', forma: 'Cartão débito', band: 'Visa', valor: 8000 },
    { id: 'k6', data: '2026-10-23', pac: 'pa118', forma: 'Crédito parcelado', band: 'Visa', valor: 150000, n: 5 },
    { id: 'k7', data: '2026-10-27', pac: 'pa107', forma: 'Cartão crédito', band: 'Hipercard', valor: 26000 },
  ],
  /* entradas de 01 a 28/10 por semana (inventado), para o fluxo de caixa do mês */
  entradasAntes: [
    { sem: '01 a 07/10', valor: 512000 }, { sem: '08 a 14/10', valor: 568000 },
    { sem: '15 a 21/10', valor: 497000 }, { sem: '22 a 28/10', valor: 563000 },
  ],
});
/* termos de recusa de tratamento (TCLE), como na clínica: o paciente declara que foi informado e recusa */
DADOS.modelos.push(
  { id: 'm-tcle-brux', nome: 'TCLE · Recusa de tratamento de bruxismo', perguntas: [
    { id: 'tb1', texto: 'Fui informado(a) de que tenho bruxismo (apertar ou ranger os dentes) e do tratamento indicado (placa)', tipo: 'snt', alerta: false },
    { id: 'tb2', texto: 'Entendi os riscos de não tratar: desgaste e fratura dos dentes, dor na articulação e na musculatura', tipo: 'snt', alerta: false },
    { id: 'tb3', texto: 'Mesmo assim, recuso o tratamento neste momento', tipo: 'snt', alerta: false },
    { id: 'tb4', texto: 'Observações', tipo: 't', alerta: false },
  ] },
  { id: 'm-tcle-orto', nome: 'TCLE · Recusa de tratamento ortodôntico', perguntas: [
    { id: 'to1', texto: 'Fui informado(a) do tratamento ortodôntico indicado e de quanto tempo dura', tipo: 'snt', alerta: false },
    { id: 'to2', texto: 'Entendi os riscos de não tratar: piora da mordida, dificuldade de limpeza, cárie e problemas na gengiva', tipo: 'snt', alerta: false },
    { id: 'to3', texto: 'Mesmo assim, recuso o tratamento neste momento', tipo: 'snt', alerta: false },
    { id: 'to4', texto: 'Observações', tipo: 't', alerta: false },
  ] },
);
/* dados de cada dentista (Dental Office: Cir. Dentistas): CRO, duração padrão da consulta, comissão e laboratório */
DADOS.profissionais.forEach(p => Object.assign(p, { cro: null, durPadrao: 40, descontaLab: true }));
