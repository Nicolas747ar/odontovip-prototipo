# Sesión 2026-11-02 — Usabilidad pedida por la familia (bloque 1: Hoje + Caixa)

Agente: Claude (Opus 5.5, MacBook, conversación de auditoría) · Sesión: **S-mac-2** · Bloque: Hoje + Caixa (R1–R8) + R15, R17, R19
Rama: `usabilidade-pedidos-familia`, creada desde `correcoes-auditoria-qa` (PR #1). **Para mezclar, primero el PR #1.**

> **Para el Claude de la hackintosh:** esto sigue la sistemática de Nicolas (`sistematica-proyectos`, v1.1).
> Este repo no tiene `contexto/`, así que la nota vive acá. Si en OdontoVipApp tenés `contexto/`,
> pasala a `contexto/sesiones/`, sumá la sesión a `SESIONES.md` y convertí los pendientes en `tareas/`.
> Los R-números y las frases de la familia están en `AUDITORIA-QA.md` §2.
> **No reemplaza tu blueprint**: si algo de acá choca con `blueprint/02` (identidad visual),
> `06-pantallas-pc` o `07-pantallas-app`, gana el blueprint. Decidilo con Nicolas y anotá el ADR.

## Por qué se hizo

Después de la auditoría, Nicolas pidió atacar lo que la familia pidió para mejorar la usabilidad,
pero **sin chocar** con el diseño que lleva la otra conversación. Por eso:
- es un **bloque con tope** (regla 1), no "todo el plan": solo las pantallas Hoje y Caixa, más tres arreglos de una línea;
- todo está en una rama propia, con un comentario en el código que apunta al R-número;
- se usó el skill `design:design-critique` (primera impresión, usabilidad, jerarquía, consistencia y accesibilidad) antes de tocar nada.

## Qué se hizo

### Hoje (recepción) — R1 a R7
| Pedido | Cómo quedó | Dónde |
|---|---|---|
| R1: nombres del PEC | `chegou` se muestra como **"Presente na unidade"** en todo el sistema (Hoje, Agenda, detalle, celular). El tiempo de espera dice **"aguardando 25 min"**; en atención, "há 45 min". El KPI dice "presentes na unidade" | `nucleo.js` `ESTADOS`; `pc.js` `linhaHoje`, `PLURAL` |
| R2: símbolo con descripción al pasar el mouse, como el PEC | Nuevo `estadoIco()`: solo el símbolo; el nombre aparece al pasar el mouse **o al enfocar con Tab** (tooltip CSS `data-dica`), y el lector de pantalla lo lee por `aria-label`. **Colores:** presente = **verde**, faltou = **rojo**; atendido pasó a **neutro** (gris) para no confundirse con presente | `nucleo.js`; `estilo.css` (bloque "Usabilidade pedida pela família") |
| R3: separar Agenda y Financeiro | Pestañas **"Agenda do dia"** y **"Financeiro"** (con contador). Financeiro tiene parcelas vencidas y lo que vence hoje, con teléfono y "Receber". La pestaña solo aparece con `pode('finPac')` (recepción y dueño); **la dentista no ve nada financiero** | `pc.js` `telaHoje` |
| R4: lista limpia | Una sola lista en orden de horario: **Marcado · Chegada · Status · Paciente · Telefone · Ações**. Reemplaza "Na clínica agora" + "Próximos" | `pc.js` `linhaHoje` |
| R5: acciones con ícono; cancelar con motivo | Botones de ícono (36 px, con tooltip y `aria-label`): confirmar, **presente**, **ausente** (solo después del horario), **cancelar**. Cancelar abre el detalle pidiendo el motivo, que ahora es **obligatorio**. En el detalle, "Desmarcar" pasó a llamarse "Cancelar consulta" | `pc.js` `linhaHoje`, `A.cancelarHoje`, `A.confirmarDesmarcar` |
| R6: "Filtro" | Barra **"Filtro"** con chips y contadores. Los chips también sirven de **leyenda de los símbolos**. Por defecto muestra **"Em aberto"** (quien todavía va a ser atendido hoy); "Todos" incluye atendidos, faltas y cancelados | `pc.js` `FILTROS_HOJE` |
| R7: "Pendências diárias" | El panel lateral se llama **"Pendências diárias"**: no llegaron, pedidos de retorno, días anteriores abiertos | `pc.js` |

### Caixa — R8
- "Deve ter na gaveta" → tarjeta **"Saldo de caixa"**: saldo em espécie (debe estar en la gaveta), saldo em cartão (crédito + débito), Pix y otros, y **saldo de la conferencia**. Después de cerrar la caja, ese saldo dice "Saldo positivo +R$ X (sobró)" o "**Saldo negativo − R$ X** (é quanto falta)". Está en `pc.js` `cartaoSaldo`.

### Arreglos rápidos
- **R15:** si la búsqueda del nuevo agendamiento no encuentra a nadie, aparece un botón dorado grande **"Paciente novo — cadastrar"**, y Enter lo abre. **No** se abre solo al escribir, como sugirió Danielle: con un error de tipeo abriría un registro por accidente (decisión 3).
- **R17:** forma de pago **"Link de pagamento"** (ícono nuevo `link` en `icones.js`).
- **R19:** fraturado en **negro** (`#1f2328`) en `odonto.js`.
- `index.html`: versión `?v=2026-11-02b`, para que los celulares carguen lo nuevo.

## Cómo se verificó
- **Smoke test propio** (no cuenta como verificación, regla 3), en el navegador a 1366×850:
  - capturas de Hoje, Financeiro y Caixa; tooltip visible al pasar el mouse sobre el símbolo y los botones;
  - por JS: presente con el ícono, filtro, cancelar sin motivo (bloquea y muestra error) y con motivo, pestaña Financeiro según el rol (recepción y dueño sí, dentista no), saldo negativo −R$ 50 al cerrar con 250, "Paciente novo" + Enter, Link entre las formas, fraturado `#1f2328`;
  - cero errores de JS.
- **Verificación independiente:** un agente aparte, con la memoria limpia, que no escribió el código, contra los criterios C1–C12 de abajo. Resultado: ver la sección "Resultado de la verificación".
- **No verificado:** el celular real (solo la vista del celular en el navegador), lectores de pantalla reales y otras resoluciones de pantalla.

### Criterios de "hecho"
C1 nombres del PEC · C2 símbolo con tooltip, verde/rojo · C3 Agenda/Financeiro, la dentista sin financiero · C4 columnas · C5 acciones con ícono y motivo obligatorio · C6 Filtro con contadores, "Em aberto" por defecto · C7 "Pendências diárias" · C8 Saldo de caixa, negativo −R$ 50 al contar 250 · C9 "Paciente novo" + Enter · C10 Link · C11 fraturado negro · C12 sin errores de consola; tareas de prueba T2 y T6 siguen funcionando.

## Decisiones tomadas (confirmar con Nicolas → ADR si quedan)
1. **¿Quién ve el Financeiro de Hoje?** Danielle dijo "a princípio só a Marcelle". En el prototipo Marcelly es `dentista` y la recepción cobra, así que usé `finPac` (recepción + dueño) y saqué todo lo financiero de la vista de la dentista. Si Marcelly debe verlo como administradora, falta un rol "administradora" (no existe en el modelo).
2. **Atendido pasó de verde a gris**, porque el verde ahora significa "presente", como en el PEC. Afecta a Hoje, Agenda y celular.
3. **"Paciente novo" no abre solo** (ver R15).
4. **Lista única en vez de "Na clínica agora" + "Próximos".** Lo pidió Danielle. Lo urgente sigue arriba gracias al filtro "Em aberto" y a "Pendências diárias".
5. **Los íconos solo de símbolo tienen leyenda** (los chips del filtro), para que una recepcionista nueva no tenga que adivinar.

## Qué quedó pendiente (próximos bloques, en el orden sugerido)
1. **R12 Agenda:** filtrar a una sola profesional o silla, columnas que se minimizan, "Mapa geral", vista lista.
2. **R9 + R10 Registro:** foto con webcam y e-mail.
3. **R14 + R16 Pagos:** forma de pago prevista + registro del cambio (antifraude); pagar con dos formas.
4. **R13:** "Novo procedimento" personalizado con aprobación de Marcelly.
5. **R18, R20, R21 Clínico:** varios dientes a la vez; aviso visible de "solo dentista"; pregunta de cirugía en la anamnesis.
6. **R23:** reporte del dueño con convênio/particular y acumulado mensual.
7. **R25:** marca/topo (usar los assets del repo `odontovip`, el sitio).
8. "Fiado/carteira": confirmar con la familia si entra (R17).

## Resultado de la verificación
Verificador: agente independiente (memoria limpia, no escribió el código), sesión **S-mac-2-V**. Auditoría de la regla 3:

| Tramo | Implementó | Verificó | ¿Distintas? |
|---|---|---|---|
| C1–C12 (primera pasada) | S-mac-2 | S-mac-2-V | Sí |
| Re-verificación de C1, C5 y hallazgos nuevos | S-mac-2 (arreglo) | S-mac-2-V (quien encontró el fallo, permitido por la regla 3) | Sí |

- **Primera pasada:** 10 PASA, 2 PARCIAL (C1: el detalle decía "chegou às"; C5: el motivo solo se veía en el tooltip), 0 FALLA, consola sin errores, T2 y T6 OK.
- **Hallazgos nuevos que se corrigieron:**
  - números distintos para lo mismo (el KPI pasó a "na unidade agora"; "Pacientes de hoje" ahora coincide con "agendados");
  - nombres partidos en dos líneas (columnas reajustadas);
  - el tooltip tapaba el encabezado (ahora abre al costado);
  - el error de motivo no se borraba al escribir;
  - quedaban textos viejos ("deve estar na gaveta", "+ Cadastrar");
  - **bug previo:** el panel "Tarefas de teste" volvía el scroll a 0 cada medio segundo y no dejaba clicar las tareas de abajo (afecta las pruebas con usuarios);
  - **bug previo:** "112" + Enter no abría al paciente nº 112.
- **Re-verificación:** 8 PASA, 1 PARCIAL. El tooltip del estado ahora tapa por un momento el inicio del nombre de esa fila: **aceptado**, porque un tooltip tapa algo mientras está abierto.
- **Cambio posterior NO re-verificado:** en el panel de detalle, "na unidade desde 10:32" pasó a "desde 10:32" (sacar la repetición; solo texto).
- **Queda abierto (menor):** "aguardando 25 min" y la línea secundaria se parten en dos en pantallas de 1366; el chip "Todos 18" incluye los cancelados (tercer número distinto del día); con "Faltou" visible, el chip "Desmarcou" baja a una segunda línea; en Pendências se usa "Presente/Faltou" para hoy y "Veio/Faltou" para días anteriores.

## Segunda tanda (misma sesión, a pedido de Nicolas después de probar el celular)

Nicolas probó el celular como la Dra. Marcelly e hizo 5 pedidos. Quedan fuera del tope del bloque 1, pero los decidió el dueño (regla 9), así que entran en esta misma rama.

| Pedido de Nicolas | Qué se hizo | Dónde |
|---|---|---|
| **Bug:** en el odontograma, al tocar una cara y elegir "Cariado" (o cualquier condición), la cara se pintaba siempre de azul | La cara marcada muestra **la cor de la condición elegida** antes de guardar (cárie roja, ausente gris, fraturado negro…). Con una condición y ninguna cara, la prévia va en el diente entero. Mismo arreglo en celular y PC. El dibujo del diente queda fijo arriba al bajar hasta las condiciones | `odonto.js` `denteSVG` (`op.previa`); `celular.js` `facesGrandes`; `estilo.css` |
| Cuando la dentista termina y pide retorno, ¿dónde ve la recepción que tiene que marcar turno y **cuánto cobrar**? | **Pedir retorno** en el celular pregunta **cuándo** (7/15/30 días, 6 meses) y **para qué** (ítems abiertos del plan, con precio). La recepción ve en Pendências diárias el grupo nuevo **"Saída: cobrar e agendar retorno"**, con "Cobrar R$ X", el retorno (cuándo + qué + precio) y los botones **Receber** y **Agendar retorno**. En la lista, la fila del atendido tiene esos dos íconos. "Agendar retorno" ya viene con tipo Retorno, procedimiento, duración y observación | `nucleo.js` `aCobrarHoje`, `resumoRetorno`; `pc.js` `telaHoje`, `linhaHoje`, `A.agendarRetorno`; `celular.js` `celRetornoTela` |
| (de lo anterior) ¿De dónde sale el valor a cobrar? | Lo que la dentista marca como hecho **sin presupuesto aprobado** ahora genera una cuota que vence hoy (solo particular), y "cobrar hoy" = cuotas que vencen hoy o ya vencidas. Lo aprobado ya tenía cuotas. **Decisión que hay que confirmar** (ver abajo) | `pc.js` `salvarEvolucao` |
| En Pacientes del celular, **los atendidos parecían desaparecer** | No desaparecían, pero no tenían estado. Ahora cada paciente muestra el estado de hoy ("Atendido"; si tiene dos citas, los dos estados) y la Agenda del celular tiene el grupo **"Já atendidos hoje"** | `celular.js` |
| **Agenda:** que no se vea bagunçada y que se pueda ver **solo a la Dra. Marcelly** (R12, Danielle) | Barra **"Mostrar"**: Mapa geral, o una o varias profesionales (o sillas en "Por cadeira"), con contadores. Los chips de estado cuentan solo lo que está en pantalla | `pc.js` `telaAgenda`, `A.agendaSo` |
| **Marcelly** (hija del dueño), **Suely** (esposa y administradora) y el **dueño** ven el financiero | Marcelly: `fin: true` (sigue siendo dentista y gana Caixa + Financeiro). Usuaria nueva **Suely · Administradora** (`papel: 'admin'`): Caixa, Financeiro y registro, **sin** contenido clínico. En el celular entra al "Caixa do dia" con su nombre. Helena y Rafael siguen sin ver nada financiero. Configurações sigue siendo solo del dueño (no estaba definido) | `dados.js`, `pc.js` `pode`, `celular.js` |

### Verificación de la segunda tanda
- Smoke test propio: el flujo completo por JS sin errores; capturas del odontograma (cara roja con Cariado), de la Saída y de la Agenda con solo la Dra. Marcelly.
- **Verificador independiente S-mac-2-V2** (sesión nueva, no escribió el código), criterios D1–D7 (odontograma, atendidos en el celular, pedir retorno, Saída, filtro de Agenda, permisos, consola + tareas T2/T3): **7/7 PASA**, consola sin errores.
- **Arreglado después y NO re-verificado por otra sesión:**
  - el formulario de retorno avisa "pediu o retorno em 30 dias" (en el prototipo solo existe hoy);
  - en Pacientes del celular, un paciente con dos citas muestra los dos estados;
  - el diente queda fijo arriba al bajar.
- **Abierto (encontrado por el verificador, menor):**
  - el panel "Tarefas de teste" tapa los botones de la lista;
  - en "Lado a lado" angosto, los nombres se montan sobre los teléfonos;
  - en "Por cadeira", los textos de las tarjetas quedan cortados;
  - las caras del odontograma en el PC no tienen etiqueta accesible, y el gris de "Ausente" con borde de selección se parece a "Fraturado";
  - la Agenda abre con el scroll de Hoje;
  - los atendidos de la mañana no tienen hora de llegada (dato de prueba).

### Decisiones nuevas para confirmar
6. **Cobro por evolución:** lo hecho sin presupuesto aprobado se cobra en la salida al precio de hoy de la tabla. Si en la clínica se cobra de otra forma (por ejemplo, la consulta tiene precio fijo aunque no haya ítem en el plan), hay que ajustarlo.
7. **Rol "Administradora"** (`admin`) para Suely Maria, que además es la recepcionista (ver tercera tanda): sin acceso clínico y sin Configurações. Marcelly con financiero como flag `fin`.
8. **"Por profissional" de la Caja ≠ comisión.** Es lo que se cobró, repartido por profesional (ver `profDoPagamento`). La comisión del sistema real debe calcularse aparte.

## Tercera tanda: respuestas de la familia al cuestionario

Nicolas recibió las respuestas al cuestionario que había pedido el Claude de la hackintosh. **Las respuestas completas NO están en este repo (es público)**: Nicolas tiene un archivo aparte para pasarle a la hackintosh, con el mapeo de cada respuesta a su impacto y las prioridades que cambian. Acá solo va lo que se aplicó:

- **Recepción = Suely Maria**, que también administra: el usuario `u-rec` pasó de "Juliana" (ficticia) a **"Suely Maria · Recepção · Administradora"** (`papel: 'admin'`). Se sacó la usuaria "Suely" aparte de la segunda tanda (era la misma persona). `admin` = recepción + financiero, sin contenido clínico; también puede marcar "Paciente não quis". En el celular entra al "Caixa do dia".
- **Presupuesto: hasta 3x, cuota mínima R$ 200,00** (cierra `blueprint/11-pendientes.md 12b`). `PARCELAS_OPCOES = [2, 3]`, `PARCELA_MIN = 20000`, y ahora **bloquea** la aprobación con el mensaje "diminua as vezes ou faça à vista" (antes solo avisaba).
- **La tarea de prueba T4 cambió** para seguir siendo posible: "restauração e clareamento, não a limpeza, em 3x" (antes "restauração e limpeza, não o clareamento": daba cuotas de R$ 113, bajo el mínimo).
- La regla de "convênio no genera cobro en la salida" **se mantiene**: según las respuestas, Boa Viagem empieza sin planes odontológicos, así que en la práctica no pesa. Si se saca, un paciente de convenio pagaría el precio de la tabla del convenio, lo que tampoco es correcto.
- Verificación: smoke test propio por JS (opciones 2x/3x; R$ 150 en 2x bloquea con el mensaje; à vista OK; T4 aprueba en 3x de R$ 363; Suely en el selector y en el "Caixa do dia" del celular; sin errores). **No verificado por otra sesión.**

## Commits
- (local, a la espera del OK de Nicolas para el push — regla 9)
