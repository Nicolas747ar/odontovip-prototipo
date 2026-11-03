/* Protótipo OdontoVip — DADOS FICTÍCIOS. Nenhum paciente real. */
const DADOS = {
  hoje: '2026-10-29',
  agoraMin: 10 * 60 + 40,
  unidade: 'Boa Viagem',

  usuarios: [
    // Boa Viagem: quem fica na recepção é a Suely Maria, que também administra (questionário da família, 02/11)
    { id: 'u-rec', nome: 'Suely Maria', papel: 'admin', rotulo: 'Recepção · Administradora' },
    { id: 'u-mar', nome: 'Dra. Marcelly', papel: 'dentista', prof: 'p-mar', rotulo: 'Dentista', fin: true }, // filha do dono: também vê o financeiro (Nicolas, 02/11)
    { id: 'u-hel', nome: 'Dra. Helena Costa', papel: 'dentista', prof: 'p-hel', rotulo: 'Dentista' },
    { id: 'u-raf', nome: 'Dr. Rafael Nunes', papel: 'dentista', prof: 'p-raf', rotulo: 'Dentista' },
    { id: 'u-dono', nome: 'Sr. Austregesilo', papel: 'dono', rotulo: 'Dono' },
  ],

  profissionais: [
    { id: 'p-mar', nome: 'Dra. Marcelly', curto: 'Dra. Marcelly', esp: 'Clínica geral e prótese', comissao: 40, cadeira: 'c1' },
    { id: 'p-hel', nome: 'Dra. Helena Costa', curto: 'Dra. Helena', esp: 'Endodontia', comissao: 35, cadeira: 'c2' },
    { id: 'p-raf', nome: 'Dr. Rafael Nunes', curto: 'Dr. Rafael', esp: 'Ortodontia', comissao: 35, cadeira: 'c3' },
  ],

  cadeiras: [
    { id: 'c1', nome: 'Cadeira 1' }, { id: 'c2', nome: 'Cadeira 2' },
    { id: 'c3', nome: 'Cadeira 3' }, { id: 'c4', nome: 'Cadeira 4 · Avaliação' },
  ],

  convenios: [
    { id: 'part', nome: 'Particular', fator: 1 },
    { id: 'amil', nome: 'Amil Dental', fator: 0.6 },
    { id: 'oprev', nome: 'Odontoprev', fator: 0.55 },
    { id: 'unimed', nome: 'Unimed Odonto', fator: 0.65 },
    { id: 'sula', nome: 'SulAmérica', fator: 0.6 },
  ],

  origens: [
    'Demanda espontânea (WhatsApp)', 'Demanda espontânea (ligação)', 'Demanda espontânea (presencial)',
    'Continuação de tratamento', 'Levantamento (6 meses)', 'Levantamento (faltosos)', 'Levantamento (venda)',
    'Redes sociais (Instagram)', 'Redes sociais (Facebook)', 'Encaixe (presencial)', 'Encaixe (WhatsApp)',
    'Indicação (funcionário)', 'Levantamento (transmissão)', 'Levantamento (aniversariante)',
    'Manutenção (em tratamento)', 'Instalação (ortodontia)', 'Instagram (link da bio)',
  ],

  /* tipo: geral | dente | faces | canal | arcada · preços em centavos (particular) */
  procedimentos: [
    { id: 'avaliacao', nome: 'Avaliação', tipo: 'geral', dur: 20, preco: 8000, lab: 0 },
    { id: 'limpeza', nome: 'Limpeza', tipo: 'geral', dur: 40, preco: 15000, lab: 0 },
    { id: 'fluor', nome: 'Aplicação de flúor', tipo: 'geral', dur: 20, preco: 6000, lab: 0 },
    { id: 'clareamento', nome: 'Clareamento de consultório', tipo: 'geral', dur: 60, preco: 90000, lab: 0 },
    { id: 'manut-orto', nome: 'Manutenção ortodôntica', tipo: 'geral', dur: 20, preco: 18000, lab: 0 },
    { id: 'restauracao', nome: 'Restauração em resina', tipo: 'faces', dur: 40,
      precoFaces: { 1: 15000, 2: 19000, 3: 23000, 4: 26000, 5: 29000 }, lab: 0 },
    { id: 'canal', nome: 'Tratamento de canal', tipo: 'canal', dur: 90, preco: 65000, lab: 0 },
    { id: 'exodontia', nome: 'Exodontia simples', tipo: 'dente', dur: 40, preco: 20000, lab: 0 },
    { id: 'radiografia', nome: 'Radiografia periapical', tipo: 'dente', dur: 10, preco: 4000, lab: 0 },
    { id: 'coroa', nome: 'Coroa de porcelana', tipo: 'dente', dur: 60, preco: 150000, lab: 50000 },
    { id: 'implante', nome: 'Implante', tipo: 'dente', dur: 90, preco: 300000, lab: 80000 },
    { id: 'protese-total', nome: 'Prótese total', tipo: 'arcada', dur: 60, preco: 200000, lab: 50000 },
  ],

  modelos: [
    { id: 'm-hist', nome: 'História Médica', perguntas: [
      { id: 'h1', texto: 'Possui alguma doença?', tipo: 'snt', alerta: true },
      { id: 'h2', texto: 'É acompanhado(a) por algum médico?', tipo: 'snt', alerta: false },
      { id: 'h3', texto: 'Faz uso de algum medicamento?', tipo: 'snt', alerta: true },
      { id: 'h4', texto: 'Possui alguma alergia?', tipo: 'snt', alerta: true },
      { id: 'h5', texto: 'Última vez que foi ao dentista', tipo: 't', alerta: false },
      { id: 'h6', texto: 'Já teve algum problema durante procedimentos odontológicos?', tipo: 'snt', alerta: true },
    ] },
    { id: 'm-aval', nome: 'Avaliação Clínica', perguntas: [
      { id: 'a1', texto: 'Limpeza', tipo: 'snt', alerta: false },
      { id: 'a2', texto: 'Restauração', tipo: 'snt', alerta: false },
      { id: 'a3', texto: 'Exodontia', tipo: 'snt', alerta: false },
      { id: 'a4', texto: 'Endodontia', tipo: 'snt', alerta: false },
      { id: 'a5', texto: 'Ortodontia', tipo: 'snt', alerta: false },
      { id: 'a6', texto: 'Estética (clareamento / facetas / lentes)', tipo: 'snt', alerta: false },
      { id: 'a7', texto: 'Reabilitação (próteses / implantes)', tipo: 'snt', alerta: false },
      { id: 'a8', texto: 'Observações', tipo: 't', alerta: false },
    ] },
  ],

  pacientes: [
    { id: 'pa101', numero: 101, nome: 'Carlos Andrade', nasc: '1978-05-14', cel: '(81) 99711-2031', cpf: '123.456.789-01', conv: 'part', origem: 'Demanda espontânea (WhatsApp)' },
    { id: 'pa102', numero: 102, nome: 'João Pereira', nasc: '1965-11-02', cel: '(81) 99623-8812', cpf: '234.567.890-12', conv: 'amil', origem: 'Redes sociais (Instagram)',
      alertas: [{ id: 'al1', texto: 'Hipertenso — medir pressão antes da anestesia', nivel: 'atencao' }] },
    { id: 'pa103', numero: 103, nome: 'Rita Moura', nasc: '1989-07-21', cel: '(81) 98854-1290', cpf: '345.678.901-23', conv: 'part', origem: 'Indicação (funcionário)' },
    { id: 'pa104', numero: 104, nome: 'Camila Duarte', nasc: '1994-02-09', cel: '(81) 99102-7733', cpf: '456.789.012-34', conv: 'oprev', origem: 'Demanda espontânea (ligação)',
      alertas: [{ id: 'al2', texto: 'ALERGIA: DIPIRONA', nivel: 'grave' }] },
    { id: 'pa105', numero: 105, nome: 'Thiago Melo', nasc: '2001-09-30', cel: '(81) 99230-4410', cpf: '567.890.123-45', conv: 'part', origem: 'Instagram (link da bio)' },
    { id: 'pa106', numero: 106, nome: 'José Almeida', nasc: '1952-01-18', cel: '(81) 98701-5566', cpf: '678.901.234-56', conv: 'unimed', origem: 'Continuação de tratamento',
      alertas: [{ id: 'al3', texto: 'Diabético', nivel: 'atencao' }, { id: 'al4', texto: 'USA ANTICOAGULANTE', nivel: 'grave' }] },
    { id: 'pa107', numero: 107, nome: 'Ricardo Lins', nasc: '2012-04-04', cel: '(81) 99877-1022', cpf: '', conv: 'part', origem: 'Instalação (ortodontia)', responsavel: 'Marta Lins (mãe)' },
    { id: 'pa108', numero: 108, nome: 'Sônia Barros', nasc: '1970-12-12', cel: '(81) 99345-6677', cpf: '789.012.345-67', conv: 'sula', origem: 'Levantamento (6 meses)' },
    { id: 'pa109', numero: 109, nome: 'Marcos Tavares', nasc: '1983-06-25', cel: '(81) 98123-9900', cpf: '890.123.456-78', conv: 'part', origem: 'Demanda espontânea (presencial)' },
    { id: 'pa110', numero: 110, nome: 'Luiza Farias', nasc: '1975-03-03', cel: '(81) 99456-3321', cpf: '901.234.567-89', conv: 'part', origem: 'Redes sociais (Facebook)' },
    { id: 'pa111', numero: 111, nome: 'Fernanda Rocha', nasc: '1998-08-08', cel: '(81) 99567-8899', cpf: '012.345.678-99', conv: 'amil', origem: 'Levantamento (aniversariante)' },
    { id: 'pa112', numero: 112, nome: 'Ana Lima', nasc: '1992-04-17', cel: '(81) 99812-4521', cpf: '135.792.468-00', conv: 'part', origem: 'Redes sociais (Instagram)',
      alertas: [{ id: 'al5', texto: 'ALERGIA: PENICILINA', nivel: 'grave' }] },
    { id: 'pa113', numero: 113, nome: 'Beatriz Santos', nasc: '1974-05-30', cel: '(81) 99678-1144', cpf: '246.813.579-11', conv: 'oprev', origem: 'Levantamento (6 meses)' },
    { id: 'pa114', numero: 114, nome: 'Beatriz Santos', nasc: '2007-01-11', cel: '(81) 98432-7781', cpf: '357.924.681-22', conv: 'part', origem: 'Manutenção (em tratamento)' },
    { id: 'pa115', numero: 115, nome: 'Paula Gomes', nasc: '1987-10-10', cel: '(81) 99789-0012', cpf: '468.135.792-33', conv: 'part', origem: 'Demanda espontânea (WhatsApp)' },
    { id: 'pa116', numero: 116, nome: 'Diego Ramos', nasc: '2005-12-01', cel: '(81) 99890-1123', cpf: '579.246.813-44', conv: 'part', origem: 'Instalação (ortodontia)' },
    { id: 'pa117', numero: 117, nome: 'Larissa Pinto', nasc: '1999-02-14', cel: '(81) 99901-2234', cpf: '681.357.924-55', conv: 'unimed', origem: 'Encaixe (WhatsApp)' },
    { id: 'pa118', numero: 118, nome: 'Bruno Castro', nasc: '1990-06-06', cel: '(81) 98012-3345', cpf: '792.468.135-66', conv: 'part', origem: 'Redes sociais (Instagram)' },
    /* cadastrada hoje por engano (era para outra clínica): sem nenhum histórico, dá para excluir */
    { id: 'pa119', numero: 119, nome: 'Joana Pires', nasc: '1996-03-14', cel: '(81) 99234-5560', cpf: '', conv: 'part', origem: 'Demanda espontânea (WhatsApp)' },
  ],

  /* plano: itens do plano de tratamento por paciente */
  planos: {
    pa101: [{ id: 'pi1', proc: 'limpeza', dente: null, faces: [], valor: 15000, estado: 'realizado', indicadoPor: 'p-mar', dataInd: '2026-10-15', feitoPor: 'p-mar', dataFeito: '2026-10-29' }],
    pa102: [{ id: 'pi2', proc: 'canal', dente: '36', faces: [], valor: 39000, estado: 'realizado', indicadoPor: 'p-mar', dataInd: '2026-10-08', feitoPor: 'p-hel', dataFeito: '2026-10-29' }],
    pa103: [{ id: 'pi3', proc: 'restauracao', dente: '14', faces: ['O', 'M'], valor: 19000, estado: 'realizado', indicadoPor: 'p-mar', dataInd: '2026-10-10', feitoPor: 'p-mar', dataFeito: '2026-10-29' }],
    pa104: [{ id: 'pi4', proc: 'canal', dente: '46', faces: [], valor: 35750, estado: 'aprovado', indicadoPor: 'p-hel', dataInd: '2026-10-20' }],
    pa109: [
      { id: 'pi5', proc: 'restauracao', dente: '26', faces: ['O', 'M', 'D'], valor: 23000, estado: 'aprovado', indicadoPor: 'p-mar', dataInd: '2026-10-15' },
      { id: 'pi6', proc: 'limpeza', dente: null, faces: [], valor: 15000, estado: 'aprovado', indicadoPor: 'p-mar', dataInd: '2026-10-15' },
    ],
    pa110: [{ id: 'pi7', proc: 'coroa', dente: '11', faces: [], valor: 150000, estado: 'aprovado', indicadoPor: 'p-mar', dataInd: '2026-10-01' }],
    pa112: [
      { id: 'pi8', proc: 'restauracao', dente: '46', faces: ['O', 'D'], valor: 19000, estado: 'indicado', indicadoPor: 'p-mar', dataInd: '2026-10-22' },
      { id: 'pi9', proc: 'limpeza', dente: null, faces: [], valor: 15000, estado: 'indicado', indicadoPor: 'p-mar', dataInd: '2026-10-22' },
      { id: 'pi10', proc: 'clareamento', dente: null, faces: [], valor: 90000, estado: 'indicado', indicadoPor: 'p-mar', dataInd: '2026-10-22' },
    ],
  },

  /* condições que o paciente já tem (odontograma existente) */
  existentes: {
    pa112: [
      { id: 'cd1', n: '36', cond: 'restaurado', faces: ['O'], data: '2025-05-10', por: 'p-mar' },
      { id: 'cd2', n: '46', cond: 'cariado', faces: ['O', 'D'], data: '2026-10-22', por: 'p-mar' },
      { id: 'cd3', n: '16', cond: 'acompanhamento', faces: [], data: '2026-10-22', por: 'p-mar' },
    ],
    pa106: ['18', '28', '38', '48'].map((n, i) => ({ id: 'cda' + i, n, cond: 'ausente', faces: [], data: '2024-03-01', por: 'p-mar' }))
      .concat([{ id: 'cdc', n: '11', cond: 'coroa', faces: [], data: '2023-08-15', por: 'p-mar' }]),
    pa109: [{ id: 'cd4', n: '26', cond: 'cariado', faces: ['O', 'M', 'D'], data: '2026-10-15', por: 'p-mar' }],
    pa102: [{ id: 'cd5', n: '36', cond: 'cariado', faces: ['O'], data: '2026-10-08', por: 'p-mar' }],
  },

  parcelas: {
    pa103: [{ id: 'pc1', n: 1, de: 1, venc: '2026-10-29', valor: 19000, pago: 12000 }],
    pa106: [{ id: 'pc2', n: 2, de: 3, venc: '2026-10-10', valor: 20000, pago: 0 }, { id: 'pc3', n: 3, de: 3, venc: '2026-11-10', valor: 20000, pago: 0 }],
    pa109: [{ id: 'pc4', n: 1, de: 2, venc: '2026-10-15', valor: 19000, pago: 19000 }, { id: 'pc5', n: 2, de: 2, venc: '2026-11-15', valor: 19000, pago: 0 }],
    pa110: [{ id: 'pc6', n: 1, de: 3, venc: '2026-10-01', valor: 50000, pago: 50000 }, { id: 'pc7', n: 2, de: 3, venc: '2026-11-01', valor: 50000, pago: 0 }, { id: 'pc8', n: 3, de: 3, venc: '2026-12-01', valor: 50000, pago: 0 }],
  },

  anamneses: {
    pa112: [{ id: 'an1', modelo: 'm-hist', data: '2026-10-22', por: 'p-mar', respostas: {
      h1: { sim: false }, h2: { sim: false }, h3: { sim: false }, h4: { sim: true, texto: 'Penicilina' }, h5: { texto: 'Há 2 anos' }, h6: { sim: false } } }],
  },

  evolucoes: {
    pa112: [{ id: 'ev1', data: '2026-10-22', por: 'p-mar', texto: 'Avaliação inicial. Indicadas restauração no 46 (OD), limpeza e clareamento.', itens: [] }],
    pa102: [{ id: 'ev2', data: '2026-10-29', por: 'p-hel', texto: 'Tratamento de canal do 36 concluído. Sem intercorrências.', itens: ['pi2'] }],
    pa101: [{ id: 'ev3', data: '2026-10-29', por: 'p-mar', texto: 'Limpeza feita. Orientada sobre fio dental.', itens: ['pi1'] }],
    pa109: [{ id: 'ev4', data: '2026-10-15', por: 'p-mar', texto: 'Avaliação. Cárie no 26 (OMD). Orçamento aprovado em 2x.', itens: [] }],
  },

  arquivos: {
    pa112: [{ id: 'ar1', tipo: 'Radiografia', nome: 'Periapical 46', data: '2026-10-22' }, { id: 'ar2', tipo: 'Foto clínica', nome: 'Inicial', data: '2026-10-22' }],
    pa102: [{ id: 'ar3', tipo: 'Radiografia', nome: 'Final do canal 36', data: '2026-10-29' }],
  },

  /* agenda de hoje · ini e dur em minutos */
  agendamentos: [
    { id: 'ag1', pac: 'pa101', prof: 'p-mar', cad: 'c1', ini: 480, dur: 40, proc: 'limpeza', tipo: 'Consulta', origem: 'Continuação de tratamento', estado: 'atendido' },
    { id: 'ag2', pac: 'pa108', prof: 'p-mar', cad: 'c1', ini: 540, dur: 40, proc: 'avaliacao', tipo: 'Retorno', origem: 'Levantamento (6 meses)', estado: 'confirmado' },
    { id: 'ag3', pac: 'pa103', prof: 'p-mar', cad: 'c1', ini: 590, dur: 40, proc: 'restauracao', tipo: 'Consulta', origem: 'Continuação de tratamento', estado: 'atendido' },
    { id: 'ag4', pac: 'pa109', prof: 'p-mar', cad: 'c1', ini: 640, dur: 40, proc: 'restauracao', tipo: 'Consulta', origem: 'Continuação de tratamento', estado: 'chegou', chegouAs: 632 },
    { id: 'ag5', pac: 'pa112', prof: 'p-mar', cad: 'c1', ini: 700, dur: 40, proc: 'avaliacao', tipo: 'Retorno', origem: 'Continuação de tratamento', estado: 'confirmado' },
    { id: 'ag6', pac: 'pa110', prof: 'p-mar', cad: 'c1', ini: 780, dur: 60, proc: 'coroa', tipo: 'Consulta', origem: 'Continuação de tratamento', estado: 'a_confirmar' },
    { id: 'ag7', pac: 'pa113', prof: 'p-mar', cad: 'c1', ini: 870, dur: 40, proc: 'limpeza', tipo: 'Periódico', origem: 'Levantamento (6 meses)', estado: 'confirmado' },
    { id: 'ag8', pac: null, prof: 'p-mar', cad: null, ini: 960, dur: 30, proc: null, tipo: 'Compromisso pessoal', origem: '', estado: 'confirmado', obs: 'Reunião com laboratório' },
    { id: 'ag9', pac: 'pa102', prof: 'p-hel', cad: 'c2', ini: 510, dur: 90, proc: 'canal', tipo: 'Consulta', origem: 'Continuação de tratamento', estado: 'atendido' },
    { id: 'ag10', pac: 'pa104', prof: 'p-hel', cad: 'c2', ini: 600, dur: 90, proc: 'canal', tipo: 'Consulta', origem: 'Continuação de tratamento', estado: 'em_atendimento', chegouAs: 595 },
    { id: 'ag11', pac: 'pa105', prof: 'p-hel', cad: 'c2', ini: 780, dur: 40, proc: 'avaliacao', tipo: 'Consulta', origem: 'Instagram (link da bio)', estado: 'confirmado' },
    { id: 'ag12', pac: 'pa111', prof: 'p-hel', cad: 'c2', ini: 840, dur: 40, proc: 'limpeza', tipo: 'Consulta', origem: 'Levantamento (aniversariante)', estado: 'a_confirmar' },
    { id: 'ag13', pac: 'pa106', prof: 'p-hel', cad: 'c2', ini: 990, dur: 40, proc: 'avaliacao', tipo: 'Retorno', origem: 'Continuação de tratamento', estado: 'confirmado' },
    { id: 'ag14', pac: 'pa114', prof: 'p-raf', cad: 'c3', ini: 480, dur: 20, proc: 'manut-orto', tipo: 'Periódico', origem: 'Manutenção (em tratamento)', estado: 'atendido' },
    { id: 'ag15', pac: 'pa107', prof: 'p-raf', cad: 'c3', ini: 500, dur: 20, proc: 'manut-orto', tipo: 'Periódico', origem: 'Manutenção (em tratamento)', estado: 'atendido' },
    { id: 'ag16', pac: 'pa115', prof: 'p-raf', cad: 'c3', ini: 540, dur: 20, proc: 'avaliacao', tipo: 'Consulta', origem: 'Demanda espontânea (WhatsApp)', estado: 'desmarcou', motivo: 'Viagem de trabalho' },
    { id: 'ag17', pac: 'pa116', prof: 'p-raf', cad: 'c3', ini: 620, dur: 20, proc: 'manut-orto', tipo: 'Periódico', origem: 'Manutenção (em tratamento)', estado: 'chegou', chegouAs: 615 },
    { id: 'ag18', pac: 'pa117', prof: 'p-raf', cad: 'c3', ini: 840, dur: 20, proc: 'avaliacao', tipo: 'Consulta', origem: 'Encaixe (WhatsApp)', estado: 'a_confirmar' },
    { id: 'ag19', pac: 'pa118', prof: 'p-raf', cad: 'c3', ini: 900, dur: 20, proc: 'manut-orto', tipo: 'Periódico', origem: 'Manutenção (em tratamento)', estado: 'confirmado' },
  ],

  recebimentos: [
    { id: 'rc1', hora: 525, pac: 'pa101', valor: 15000, forma: 'Pix', por: 'u-rec', prof: 'p-mar' },
    { id: 'rc2', hora: 520, pac: 'pa114', valor: 18000, forma: 'Dinheiro', por: 'u-rec', prof: 'p-raf' },
    { id: 'rc3', hora: 630, pac: 'pa103', valor: 12000, forma: 'Dinheiro', por: 'u-rec', prof: 'p-mar' },
    { id: 'rc4', hora: 605, pac: 'pa102', valor: 39000, forma: 'Cartão crédito', por: 'u-rec', prof: 'p-hel' },
  ],

  caixa: { fechado: false },
  pedidosRetorno: [],
  comprovantes: {}, // comprovante de atendimento: substitui o talonário de papel fotografado
  /* consultas de dias anteriores que ninguém fechou */
  pendentesAnteriores: [
    { id: 'pd1', pac: 'pa111', prof: 'p-hel', data: '2026-10-27', ini: 840, proc: 'limpeza' },
    { id: 'pd2', pac: 'pa108', prof: 'p-mar', data: '2026-10-28', ini: 600, proc: 'avaliacao' },
  ],
  ontem: { total: 248000, pix: 98000, cartao: 110000, dinheiro: 40000, atendidos: 27, faltas: 3, agendados: 31 },
};
