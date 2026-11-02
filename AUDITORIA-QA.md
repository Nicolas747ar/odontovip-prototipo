# Auditoría QA del prototipo · 02/11/2026

> **Para la conversación de Claude que construyó este prototipo (máquina del hackathon):**
> este archivo resume una auditoría hecha en **otra conversación**, desde la MacBook de Nicolas,
> sobre `main` @ `006278c` ("Ajuste de letras", 30/10). Leelo entero antes de seguir: explica qué
> se corrigió y por qué, qué pidió la familia después de ver el prototipo (todavía no lo tenías)
> y qué decisiones quedan abiertas. Las correcciones están en la rama `correcoes-auditoria-qa`.
> Si tenías cambios locales sin subir, reconcilialos con esa rama antes de seguir.

---

## 1. Contexto

- **Qué es:** un prototipo clicable para la clínica odontológica OdontoVip (Boa Viagem, Recife) del suegro de Nicolas, el **Sr. Austregesilo Rodrigues**. Lo usan la **Dra. Marcelly** (dentista y administradora) y la recepción. **Danielle** (hija del Sr. Austregesilo) dio el feedback de usabilidad de la recepción.
- **No tiene relación con HU Innovation / CINCO**, que es donde trabaja Nicolas. No aplican las reglas de `cinco-produto`.
- **Objetivo del negocio:** dejar el **Dental Office** en 3–4 meses llevando todo (pacientes, historia clínica, cada foto) y tener un sistema propio y confiable. El presupuesto es ajustado (hablaron de R$ 120–370/mes).
- **Método de la auditoría:**
  1. Se recorrió el prototipo en el navegador (vista de recepción y de celular).
  2. Un agente de QA leyó todo el JS.
  3. Los hallazgos graves se confirmaron a mano.
  4. Después de corregir, cada bug se volvió a probar en el navegador, sin errores de consola.

---

## 2. Qué pidió la familia (feedback que todavía no tenías)

Sale de tres conversaciones mostrando el prototipo (Danielle; el Sr. Austregesilo con la Dra. Marcelly). **Nada de esta lista está implementado en esta rama**: es trabajo de diseño que te toca a vos, junto con tu blueprint. El estado es el de `006278c`.

### Pantalla Hoje (recepción). Danielle usa como referencia el **PEC** (e-SUS)
| # | Pedido | Estado |
|---|---|---|
| R1 | Rótulos: "atendendo" → **"Em atendimento"**, "esperando" → **"Aguardando"**, "chegou" → **"Presente na unidade"** | Parcial: siguen "Atendendo 45 min", "Esperando", "Chegou" (`pc.js` `linhaNaClinica`) |
| R2 | Estado como **ícono con descripción al pasar el mouse** (tooltip), como el "bonequinho" del PEC. **Verde** = presente, **rojo/X** = faltó | Parcial: ícono + texto, sin tooltip |
| R3 | Separar en Hoje un ítem **Agenda** y un ítem **Financeiro** ("não pode aparecer tudo junto"). Las **parcelas vencidas solo las ve la administradora** (Marcelly) | No cumple. *En esta rama la dentista ya no ve "Parcelas vencidas"; falta decidir qué ve la recepción* |
| R4 | Lista más limpia: **nombre, teléfono, hora marcada y hora de llegada**, con íconos de acción abajo. "Muita coisa na tela", "visualmente bagunçado" | Parcial |
| R5 | Acciones por ícono: confirmar, presente, ausente, **cancelar consulta con motivo** (el motivo se escribe al cancelar) | No cumple; el motivo de "Desmarcar" sigue siendo opcional |
| R6 | El filtro tiene que decir **"Filtro"** | No cumple |
| R7 | "Precisa de atenção" → ícono o **"Pendências diárias"** | No cumple |

### Caja
| R8 | "Deve ter na gaveta" → **"Saldo de caixa"** / "Saldo": saldo en **espécie**, en **cartão**, **positivo/negativo** ("negativo é quanto falta") | No cumple |

### Registro de paciente
| R9 | **Foto del paciente con webcam** al registrar (en Dental Office se hace así) | No cumple |
| R10 | **E-mail** del paciente | No cumple |
| R11 | Si es convênio: **nº de carteirinha** (y validez); particular no lo necesita | **Corregido en esta rama**: se pedía pero no se guardaba (ver §3) |

### Agenda
| R12 | Al filtrar **por profesional**, mostrar **solo esa** profesional; **por silla**, solo esa silla; columnas que se abren y minimizan; opción **"Mapa geral"** con todo; dos visualizaciones (gráfica compacta o lista) | Parcial: solo "Por profissional" / "Por cadeira" con todas las columnas |

### Nuevo agendamiento
| R13 | Opción **"Novo procedimento"** personalizado (nombre + tiempo), **pendiente de aprobación de la Dra. Marcelly** | No cumple |
| R14 | **"Forma de pagamento prevista"** al agendar; al cobrar, confirmar o cambiar, y **registrar el cambio**. Objetivo antifraude: "por que 10 iam pagar em espécie e mudaram pra cartão? Alguma recepcionista induziu?" | No cumple |
| R15 | Si el CPF o el nombre no existe, **frenar y ofrecer "Paciente novo — cadastrar"** de forma bien visible (botón de color), o elegir paciente antiguo/nuevo antes | Parcial: link "+ Cadastrar", poco visible |

### Pagos
| R16 | **Pagar con dos formas** (mitad efectivo, mitad tarjeta) | No cumple |
| R17 | Formas: Dinheiro, Pix, Crédito, **Débito**, **Link** (link de pago). **"Fiado/carteira"** se discutió y parece rechazado: confirmar | Parcial: falta Link |
| R23 | **Reporte remoto del dueño**: valor, **si fue convênio o particular**, **acumulado**. El Sr. Austregesilo: "condição sine qua non", "se eu não acompanhar, eles não vão acompanhar" | Parcial: falta convênio/particular y acumulado mensual |

### Clínico (dentista)
| R18 | Seleccionar **varios dientes a la vez** | No cumple |
| R19 | Colores: **cariado rojo, restaurado azul, fraturado NEGRO** | Parcial: fraturado es `#9a4a2f` (marrón) en `odonto.js` `CONDS` |
| R20 | Que se entienda que **solo la dentista** edita el odontograma (en la demo hubo confusión) | Parcial: el aviso aparece solo al abrir un diente y queda abajo del pliegue |
| R21 | Respuestas de la anamnesis (alergia, medicamento, **cirugía**) → alerta en la ficha | Parcial: falta la pregunta de cirugía |
| R22 | Adjuntar **radiografía digital** y fotos | Simulado |

### Otros
- R24: funcionar sin internet en la red local. Cumple (simulado). Ya sabían que sin luz se cae todo.
- R25: el topo/la marca "mais bonita, brincar mais com a parte visual". Subjetivo.

---

## 3. Bugs corregidos en esta rama

Cada fix tiene un comentario corto en el código, con el estilo del archivo. Todos se verificaron en el navegador.

| # | Bug | Por qué era un problema | Fix | Dónde |
|---|---|---|---|---|
| 1 | **El dueño podía rellenar una anamnesis y la pantalla se congelaba** | `clinico` incluye `dono` → aparecía "+ Preencher ficha" → se guardaba `por: undefined` → TypeError en `prof(an.por).curto` | Nuevo permiso `anamnese: ['dentista']`: el dueño **lee** la anamnesis pero no la rellena. Guard contra `prof()` nulo en PC y celular | `pc.js` `pode`, `abaAnamnese`, `salvarAnam`; `celular.js` `celAnam` |
| 2 | **XSS**: el nombre del paciente entraba sin `esc()` al botón "Receber" | Nombre `<img src=x onerror=...> Silva` → ejecutaba JS. Era el único punto sin escapar | `esc(r.txt)` al renderizar | `pc.js` `modalRec` |
| 3 | **El "crédito" por pagar de más desaparecía** | La pantalla decía "Sobram R$ X, que ficam como crédito", pero `receber` descartaba la `sobra` | `p.credito += sobra` (solo si había deuda; un pago sin nada abierto sigue siendo avulso). Se muestra en Financeiro y en Resumo. **No** se descuenta solo de parcelas futuras (decisión abierta, §5) | `nucleo.js` `receber`; `pc.js` `abaFinanceiro`, `abaResumo` |
| 4 | **Profesional del pago equivocado o nulo** → distorsiona "Por profissional" y **comisiones** | Tomaba el primer ítem `feitoPor` del plan, aunque fuera viejo o recusado | `profDoPagamento`: 1º quien atendió hoy; 2º quien hizo el último ítem; 3º quien indicó el último aprobado; si no, `null` ("Sem profissional") | `nucleo.js` |
| 5 | **Se podía agendar sobre el almuerzo o pasadas las 18:00** (17:50 + 120 min se salía de la grilla) | `estadoBotaoAg` no aplicaba las reglas que `proximoLivre` sí aplica | Bloquea con "Termina às 12:50: entra no almoço" / "passa das 18:00" | `pc.js` `estadoBotaoAg` |
| 6 | **Las parcelas se saltaban febrero** (29/10 + 4 meses = 01/03; 31/10 + 1 = 01/12) | `setMonth` desborda | `somaMeses` se ajusta al último día del mes (28/02, 30/11; año bisiesto OK) | `nucleo.js` |
| 7 | **Nº de carteirinha y validez se pedían pero no se guardaban**; no estaban en el registro rápido ni en Dados | `criarPaciente` no copiaba `cart`/`valid` | Se guardan como `carteirinha` / `validadeCart`; el campo aparece en el registro rápido cuando se elige convênio y en la pestaña Dados | `pc.js` |
| 8 | **Se podía excluir un paciente con odontograma, alertas o pedido de retorno** | `historico()` no los contaba | Los cuenta → obliga a "Inativar" | `pc.js` `historico` |
| 9 | **Desfazer congelaba la pantalla** si el panel abierto mostraba la cita deshecha | El panel `det` buscaba un id borrado | `limparTelasOrfas()` después de restaurar (panel, ficha, modal) | `nucleo.js` |
| 10 | **Cola offline del celular con referencia vieja**: tras un Desfazer en el PC, la evolución entraba pero la cita quedaba "Em atendimento" | La closure guardaba el objeto `ag`, y Desfazer reemplaza `E.d` entero | Guarda el `id` y busca la cita al ejecutar | `celular.js` `celSalvarEvo` |
| 11 | **Se aceptaban CPF inválidos** (111.111.111-11) | Solo se revisaban 11 dígitos | `cpfValido()` con dígitos verificadores en el registro y en Dados (PC y celular). **Solo se revisa un CPF nuevo o cambiado**: los CPF inventados de `dados.js` son inválidos a propósito | `nucleo.js`, `pc.js`, `celular.js` |
| 12 | **Un CPF de `dados.js` era válido** (`012.345.678-90`, Fernanda Rocha) y podía pertenecer a una persona real | Datos ficticios con un documento real posible | Cambiado a `012.345.678-99` (inválido). Ningún CPF de `dados.js` pasa la validación | `dados.js` |
| 13 | **La dentista veía "Parcelas vencidas" con montos** en Hoje | Inconsistente con la ficha, donde Financeiro es solo `finPac` | El grupo y su contador solo se muestran con `pode('finPac')` | `pc.js` `telaHoje` |
| 14 | Fecha de nacimiento futura mostraba **"→ -4 anos"** y pedía responsable | `idade` negativa contaba como menor | `idadeTxt()` / `ehMenor()` ignoran fechas futuras (guardar ya se bloqueaba) | `pc.js` |
| 15 | Orçamento **"À vista" vencía a los 30 días** si antes se había elegido Parcelado + "Em 30 dias" | `primeiro` quedaba en `'30'` | À vista siempre vence hoy | `pc.js` `aprovarOrc` |
| 16 | **Parcelas de R$ 0,00** (R$ 5 en 12x) | Redondeo a reales | `orcOk()` bloquea "Aprovar" si alguna parcela da 0 | `pc.js` |
| 17 | En "Por cadeira" **no aparecía el compromiso personal** (sin silla), aunque bloqueaba el horario | `a.cad === null` | Se muestra en la silla de la profesional | `pc.js` `telaAgenda` |
| 18 | Con la caja cerrada, **lo que entraba después no se reflejaba** en "gaveta conferida" | Se guardaba solo la diferencia | Aviso: "Depois do fechamento entrou mais R$ X: a gaveta deve ter …" | `pc.js` `telaCaixa` |
| 19 | El toast no se anunciaba a lectores de pantalla | Faltaba `aria-live` | `role="status" aria-live="polite"` | `index.html` |
| — | **Cache del navegador** | Los celulares que ya abrieron el link seguirían con el JS viejo | `?v=2026-10-30u` → `?v=2026-11-02a` | `index.html` |

---

## 4. Hallazgos NO corregidos (a propósito)

Son decisiones de diseño o de producto, no bugs evidentes. Quedan para vos y Nicolas:

- **Modo offline del celular incoherente** (`celGravar`): alertas, odontograma, dados y "não quis" se aplican al instante aunque el celular esté "fora do Wi-Fi"; evolución y foto sí esperan en la cola. `celFinalizar` funciona offline y `celIniciar` no. Hay que decidir cuál es la regla.
- **Permisos de la recepción:** no ve la anamnesis, pero sí odontograma, plan, radiografías e ítems "Feito:". Probablemente lo necesite para el orçamento, pero conviene confirmarlo con la Dra. Marcelly (y la LGPD).
- **"Convênio" como forma de pago** suma al "Recebido hoje" y al reporte del dueño como si fuera plata que entró hoy (en realidad paga el plan después, con glosas).
- **El cierre de caja no es a ciegas:** "Deve ter na gaveta R$ X" queda visible detrás del modal de conteo. Como el dueño quiere controlar a la recepción (ver R14), conviene ocultarlo hasta que se digite el conteo.
- **Dono "sin internet":** corta los pagos a las 10:25, pero las cifras de pacientes siguen en vivo.
- En el celular, al abrir una ficha desde Pacientes, el botón de volver dice "‹ Agenda".
- En "Receber pagamento", Enter con un solo resultado no lo selecciona.
- **Accesibilidad:** labels sin `for`/`id`; filas de Hoje, citas y tarjetas son `div` clicables sin `tabindex`/`role`; modales sin `role="dialog"` ni foco atrapado; `--ink-faint` #7C8CA3 da 3.42:1 sobre blanco y el color "acompanhamento" 2.49:1.

## 5. Decisiones que tomé en esta rama (confirmalas o revertilas)

1. **El dueño no rellena la anamnesis** (permiso `anamnese` solo para dentistas). Si el blueprint dice otra cosa, cambiar `pode`.
2. **El crédito no se descuenta automáticamente** de parcelas futuras: solo se guarda y se muestra. Definir con el dueño si se aplica solo, si se devuelve o si se usa en el próximo orçamento.
3. **Profesional del pago por heurística** (`profDoPagamento`). Lo correcto en el sistema real es que cada pago o parcela apunte a los ítems del orçamento que paga, y de ahí sale la comisión.
4. **Las reglas de almuerzo y 18:00 bloquean el agendamiento.** Si quieren permitir "encaixe" fuera de horario, convertirlo en un aviso con "agendar mesmo assim".
5. Los datos de prueba (`ag5`, Ana Lima 11:40 + 40 min) ya invadían el almuerzo; no los cambié. Si se remarca esa cita en el mismo horario, ahora se bloquea.

## 6. Riesgos del proyecto real (de la charla con el Sr. Austregesilo)

1. **Migración del Dental Office:** hacer **ya** un backup completo y verificado (contar registros, abrir fotos al azar) antes de cualquier otra cosa. Hay que llevar pacientes, historia clínica y todas las fotos.
2. **Ex-colaborador con acceso al Dental Office:** revocar el acceso apenas exista el backup y cambiar las contraseñas compartidas.
3. **LGPD:** son datos de salud (dato sensible). Hace falta control de acceso por rol real, un log de quién vio o cambió qué, y backups cifrados fuera de la clínica.
4. **Reporte remoto:** el diseño "nomes nunca saem da clínica" es correcto, pero necesita internet; definir qué ve el dueño si se corta.
5. **Luz:** con todo en la red local, un no-break para el servidor y el router.
