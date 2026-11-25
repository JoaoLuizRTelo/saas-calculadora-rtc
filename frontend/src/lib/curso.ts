// Conteúdo do mini curso (/curso). Posição legal: 24/11/2026.
//
// Marcação dentro dos textos:  **negrito**   [[termo|rótulo]] (balão "?" do glossário)   [rótulo](https://link)
// Números "ilustrativos" (alíquota de 10%, preços redondos) existem só para ensinar a conta e estão sempre avisados.
// Fatos legais e de datas vêm das fontes listadas em FONTES; revise junto com elas quando a lei mudar.

export const DATA_DE_REVISAO = "24/11/2026";

export type Bloco =
  | { t: "p"; x: string }
  | { t: "h"; x: string }
  | { t: "lista"; itens: string[] }
  | { t: "destaque"; titulo: string; x: string }
  | { t: "atencao"; titulo: string; x: string }
  | { t: "exemplo"; titulo: string; x: string }
  | { t: "tempo"; itens: { quando: string; x: string }[] }
  | { t: "tabela"; cabecalho: string[]; linhas: string[][]; nota?: string };

export type Pergunta = {
  id: string;
  pergunta: string;
  opcoes: string[];
  correta: number; // índice em `opcoes`
  explicacao: string;
};

export type Aula = {
  id: string;
  titulo: string;
  minutos: number;
  objetivo: string;
  blocos: Bloco[];
  /** Convite para praticar no simulador. */
  pratica?: string;
  resumo: string[];
  perguntas: Pergunta[];
  fontes: (keyof typeof FONTES)[];
};

export const FONTES = {
  receitaEntenda: {
    titulo: "Receita Federal: Entenda a Reforma Tributária do Consumo",
    url: "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-consumo/entenda",
  },
  lc214: { titulo: "Lei Complementar 214/2025 (texto no Planalto)", url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm" },
  camaraLc214: {
    titulo: "Agência Câmara: Regulamentação da reforma tributária é sancionada",
    url: "https://www.camara.leg.br/noticias/1127237-regulamentacao-da-reforma-tributaria-e-sancionada-conheca-a-nova-lei/",
  },
  senadoLc227: {
    titulo: "Agência Senado: Lei cria Comitê Gestor do IBS e define regras do imposto (LC 227/2026)",
    url: "https://www12.senado.leg.br/noticias/materias/2026/01/14/reforma-tributaria-lei-cria-comite-gestor-do-ibs-e-define-regras-do-imposto",
  },
  senadoTransicao: {
    titulo: "Agência Senado: Novos tributos começam a ser testados em 2026 e transição vai até 2033",
    url: "https://www12.senado.leg.br/noticias/materias/2024/12/16/novos-tributos-comecam-a-ser-testados-em-2026-e-transicao-vai-ate-2033",
  },
  senadoCbs: {
    titulo: "Agência Senado: TCU calcula alíquota da CBS em 11,3% para 2027",
    url: "https://www12.senado.leg.br/noticias/materias/2026/10/28/reforma-tributaria-tcu-calcula-aliquota-da-cbs-em-11-3-para-2027",
  },
  senadoCbs2: {
    titulo: "Agência Senado: Alíquota da CBS avança nesta semana",
    url: "https://www12.senado.leg.br/noticias/materias/2026/10/26/reforma-tributaria-aliquota-da-cbs-avanca-nesta-semana",
  },
  senado30: {
    titulo: "Agência Senado: Reforma assegura desconto de 30% e até isenção de IBS e CBS",
    url: "https://www12.senado.leg.br/noticias/materias/2024/12/16/reforma-tributaria-assegura-desconto-de-30-e-ate-isencao-de-ibs-e-cbs",
  },
  camaraIs: {
    titulo: "Agência Câmara: Medida provisória regulamenta o Imposto Seletivo para 2027",
    url: "https://www.camara.leg.br/noticias/1316363-medida-provisoria-regulamenta-o-imposto-seletivo-para-2027",
  },
  cgibsSplit: {
    titulo: "Comitê Gestor do IBS: Split Payment, Manual de Operações (v1.0.1)",
    url: "https://www.cgibs.gov.br/upload/arquivos/202609/24101007-split-payment-manual-de-operacoes-v1-0-1.pdf",
  },
  sefazBa: { titulo: "SEFAZ-BA: Portal da Reforma Tributária, perguntas frequentes", url: "https://www.sefaz.ba.gov.br/portaldareformatributaria/faqs/" },
  receitaSimples: {
    titulo: "Receita Federal: Comitê Gestor do Simples Nacional publica novas regras (nov/2026)",
    url: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/novembro/comite-gestor-do-simples-nacional-publica-novas-regras-para-o-simples-nacional-e-para-a-transicao-da-reforma-tributaria",
  },
  calculadora: {
    titulo: "Calculadora oficial da Receita (GitHub): tabela de classificações v1.71, de 30/10/2026",
    url: "https://github.com/ReceitaFederal/calculadora-rtc-regime-regular",
  },
  fazendaPerguntas: {
    titulo: "Ministério da Fazenda: Perguntas e respostas sobre a Reforma Tributária (PDF)",
    url: "https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria/arquivos/perguntas-e-respostas-reforma-tributaria_.pdf",
  },
} as const;

export const AULAS: Aula[] = [
  // ------------------------------------------------------------------ 1
  {
    id: "o-que-muda",
    titulo: "O que está mudando e por quê",
    minutos: 4,
    objetivo: "Entender o que é a Reforma Tributária do Consumo e qual problema ela quer resolver.",
    blocos: [
      {
        t: "p",
        x: "Hoje, quem vende um produto ou serviço no Brasil lida com vários tributos sobre o consumo: **PIS** e **Cofins** (federais), **IPI** (federal), **ICMS** (estadual) e **ISS** (municipal). Cada um tem regras, alíquotas e créditos próprios. O resultado é um sistema caro de cumprir e propenso a disputas, com [[efeitoCascata|efeito cascata]]: imposto cobrado sobre imposto.",
      },
      {
        t: "destaque",
        titulo: "Em uma frase",
        x: "A reforma troca PIS, Cofins, ICMS, ISS e, em grande parte, o IPI por dois tributos com regras parecidas, a **CBS** (federal) e o **IBS** (estados e municípios), e cria o **Imposto Seletivo** para bens prejudiciais à saúde ou ao meio ambiente.",
      },
      { t: "h", x: "Como chegamos aqui" },
      {
        t: "tempo",
        itens: [
          { quando: "2023", x: "[[ec132|Emenda Constitucional 132/2023]]: muda a Constituição e cria o IBS, a CBS e o Imposto Seletivo." },
          {
            quando: "16/01/2025",
            x: "[[lc214|LC 214/2025]] sancionada: regulamenta os novos tributos. Nasceu do PLP 68/2024, e o Executivo vetou 15 trechos de um texto de 544 artigos.",
          },
          { quando: "13/01/2026", x: "[[lc227|LC 227/2026]]: cria o Comitê Gestor do IBS e ajusta a LC 214/2025." },
          { quando: "2026", x: "Ano de testes: os novos tributos aparecem nas notas fiscais, mas quase não há cobrança efetiva." },
        ],
      },
      { t: "h", x: "O que a reforma quer alcançar" },
      {
        t: "lista",
        itens: [
          "**Simplificação:** menos tributos e regras mais parecidas.",
          "**Neutralidade:** acabar com a cumulatividade e o efeito cascata.",
          "**Transparência:** o contribuinte e o consumidor saberem quanto de imposto há no preço.",
          "**Segurança jurídica:** menos espaço para disputas sobre como cobrar.",
        ],
      },
      {
        t: "atencao",
        titulo: "A regulamentação ainda está em andamento",
        x: "Este curso reflete a situação em **24/11/2026**. Alíquotas, prazos e regras de detalhe ainda estão sendo definidos (por exemplo, a alíquota da CBS de 2027 e o Imposto Seletivo). Confira sempre a legislação vigente.",
      },
    ],
    resumo: [
      "A reforma muda os tributos sobre o **consumo**, não sobre a renda.",
      "Em vez de cinco tributos, haverá a CBS e o IBS (mais o Imposto Seletivo).",
      "Base legal: EC 132/2023, LC 214/2025 e LC 227/2026.",
      "2026 é ano de teste; a transição vai até 2033.",
    ],
    perguntas: [
      {
        id: "a1q1",
        pergunta: "Qual lei complementar, sancionada em 16/01/2025, regulamentou a CBS, o IBS e o Imposto Seletivo?",
        opcoes: ["Lei Complementar 227/2026", "Lei Complementar 214/2025", "Emenda Constitucional 132/2023", "O Código Tributário Nacional (1966)"],
        correta: 1,
        explicacao:
          "É a LC 214/2025. A EC 132/2023 mudou a Constituição; a LC 227/2026 veio depois (13/01/2026), criando o Comitê Gestor do IBS e ajustando a LC 214.",
      },
      {
        id: "a1q2",
        pergunta: "Qual é a ideia central da reforma?",
        opcoes: [
          "Criar um novo imposto sobre a renda das empresas",
          "Trocar vários tributos sobre o consumo por dois com regras parecidas (CBS e IBS), mais o Imposto Seletivo",
          "Aumentar o ICMS e o ISS em todo o país",
          "Acabar com qualquer tributo sobre o consumo",
        ],
        correta: 1,
        explicacao: "A reforma simplifica o consumo: CBS (federal) e IBS (estados e municípios) substituem PIS, Cofins, ICMS, ISS e, em grande parte, o IPI.",
      },
    ],
    fontes: ["receitaEntenda", "camaraLc214", "senadoLc227"],
  },

  // ------------------------------------------------------------------ 2
  {
    id: "novos-tributos",
    titulo: "Os três novos tributos: CBS, IBS e Imposto Seletivo",
    minutos: 5,
    objetivo: "Saber quem cobra cada tributo novo, o que ele substitui e qual é o papel do Comitê Gestor.",
    blocos: [
      {
        t: "p",
        x: "O novo sistema funciona como um [[iva|IVA dual]]: dois tributos sobre o consumo, com regras muito parecidas, cobrados em conjunto. Mais um terceiro, o Imposto Seletivo, com outra função.",
      },
      {
        t: "tabela",
        cabecalho: ["Tributo", "Quem recebe", "Substitui", "Quando"],
        linhas: [
          ["**CBS** (Contribuição sobre Bens e Serviços)", "União (Receita Federal)", "PIS e Cofins (e parte do IPI)", "Teste em 2026; cobrança plena em 2027"],
          [
            "**IBS** (Imposto sobre Bens e Serviços)",
            "Estados, DF e municípios, por meio do Comitê Gestor",
            "ICMS e ISS",
            "Teste em 2026; substitui os antigos aos poucos, de 2029 a 2033",
          ],
          ["**IS** (Imposto Seletivo)", "União", "Parte da arrecadação do IPI, com função de desestimular o consumo", "A partir de 2027 (regras em definição)"],
        ],
      },
      { t: "h", x: "E o IPI?" },
      {
        t: "p",
        x: "O IPI passa a ter alíquota zero para quase todos os produtos a partir de 2027. A exceção são os produtos que concorrem com os fabricados na Zona Franca de Manaus, para preservar o benefício da região.",
      },
      { t: "h", x: "O Comitê Gestor do IBS" },
      {
        t: "p",
        x: "Como o IBS pertence a estados e municípios, foi criado o [[comiteGestor|Comitê Gestor do IBS]] pela LC 227/2026, com sede no Distrito Federal. Ele edita o regulamento único do imposto, coordena a arrecadação, julga os processos administrativos e divide o dinheiro entre os entes automaticamente. A CBS continua com a Receita Federal.",
      },
      {
        t: "destaque",
        titulo: "Por isso o simulador mostra três valores",
        x: "No resultado você vê **CBS**, **IBS estadual** e **IBS municipal**: o IBS tem uma parte para o estado e outra para o município.",
      },
    ],
    pratica: "Calcule um item no simulador e observe como o resultado separa CBS, IBS estadual e IBS municipal.",
    resumo: [
      "CBS é federal e substitui PIS e Cofins.",
      "IBS é de estados e municípios e substitui ICMS e ISS, aos poucos.",
      "O Imposto Seletivo é regulatório: busca reduzir o consumo de bens nocivos.",
      "O Comitê Gestor do IBS foi criado pela LC 227/2026.",
    ],
    perguntas: [
      {
        id: "a2q1",
        pergunta: "Quem recebe o IBS?",
        opcoes: ["Somente a União", "Estados, DF e municípios, por meio do Comitê Gestor", "Somente os municípios", "Somente os estados"],
        correta: 1,
        explicacao: "O IBS é compartilhado: tem uma parte estadual e uma municipal, arrecadadas e distribuídas pelo Comitê Gestor do IBS.",
      },
      {
        id: "a2q2",
        pergunta: "Qual tributo substitui o PIS e a Cofins?",
        opcoes: ["IBS", "Imposto Seletivo", "CBS", "IPI"],
        correta: 2,
        explicacao: "É a CBS, de competência federal. O IBS substitui ICMS e ISS.",
      },
    ],
    fontes: ["receitaEntenda", "camaraLc214", "senadoLc227"],
  },

  // ------------------------------------------------------------------ 3
  {
    id: "calendario",
    titulo: "Calendário da transição e as alíquotas",
    minutos: 6,
    objetivo: "Conhecer as etapas de 2026 a 2033 e entender o que já está (e o que ainda não está) definido nas alíquotas.",
    blocos: [
      { t: "p", x: "A reforma entra aos poucos, de 2026 a 2033, para dar tempo de empresas e governos se adaptarem." },
      {
        t: "tempo",
        itens: [
          {
            quando: "2026",
            x: "**Ano de teste.** CBS de 0,9% e IBS de 0,1%, compensados com o PIS e a Cofins. Quem informa os valores corretamente nas notas fiscais não precisa recolher essa cobrança de teste.",
          },
          {
            quando: "2027",
            x: "**A CBS começa de verdade.** PIS e Cofins deixam de existir, a CBS passa a ser cobrada com alíquota plena, o IPI vai a zero (exceto produtos ligados à Zona Franca de Manaus) e começa o Imposto Seletivo.",
          },
          {
            quando: "2027 e 2028",
            x: "**IBS ainda de teste.** 0,05% estadual + 0,05% municipal. A CBS é reduzida em 0,1 ponto percentual para não aumentar a carga, já que ICMS e ISS continuam existindo.",
          },
          {
            quando: "2029 a 2032",
            x: "**A “escadinha” do IBS.** A cada ano o IBS cresce e o ICMS e o ISS diminuem. Em 2029 vale 10% do IBS e 90% do ICMS/ISS; em 2030, 20% e 80%; em 2031, 30% e 70%; em 2032, 40% e 60%.",
          },
          { quando: "2033", x: "**Novo modelo completo.** ICMS e ISS são extintos e o IBS passa a valer integralmente." },
        ],
      },
      { t: "h", x: "E as alíquotas? O que já está definido" },
      {
        t: "p",
        x: "A [[aliquotaReferencia|alíquota de referência]] é o percentual calculado para manter a arrecadação, no conjunto, parecida com a dos tributos antigos. Quem a fixa é o Senado, com base em cálculos do TCU. Em novembro de 2026, a situação é esta:",
      },
      {
        t: "lista",
        itens: [
          "**CBS em 2027:** em 28/10/2026 o TCU calculou **11,3%**. O Senado precisa confirmar por resolução até dezembro (as notícias citam 15 ou 22 de dezembro); se não o fizer, vale o valor do TCU a partir de 1º/01/2027.",
          "**IBS:** ainda não há alíquota de referência definida. A partir de 2028 o cálculo fica com o Comitê Gestor, e os estados poderão definir suas próprias alíquotas, usando a referência do Senado como base.",
          "**Teto:** a soma das alíquotas de referência de IBS e CBS não pode passar de **26,5%** em 2033. Se a projeção indicar que o limite será superado, o Executivo deve propor medidas para reduzir a tributação.",
          "**Estimativas não oficiais** do Comitê Gestor, anteriores ao cálculo do TCU, somavam cerca de 27,9% (CBS 9,21% + IBS 18,7%). São apenas estimativas.",
        ],
      },
      {
        t: "destaque",
        titulo: "E o 8,8% que vem preenchido no simulador?",
        x: "O simulador vem com CBS 8,8% e IBS 0,05% + 0,05%. Isso é só o **exemplo da documentação da Receita**, de uma estimativa antiga: **não é a alíquota oficial**. Como a tabela da calculadora ainda não traz alíquota de referência para 2027 em diante, você mesmo informa as alíquotas. Para 2027, a proposta mais recente da CBS é 11,3%.",
      },
    ],
    pratica: "No simulador, troque a alíquota da CBS de 8,8% para 11,3% e veja como o resultado muda. A classificação não altera a alíquota cheia, só aplica a redução.",
    resumo: [
      "2026: teste (CBS 0,9% e IBS 0,1%). 2027: CBS plena, PIS/Cofins extintos, IS começa.",
      "2029 a 2032: o IBS sobe e o ICMS/ISS descem em degraus. 2033: modelo completo.",
      "Em nov/2026 a CBS de 2027 está em 11,3% (proposta do TCU, aguardando o Senado); o IBS ainda não tem alíquota de referência.",
      "O teto combinado de IBS + CBS é de 26,5% em 2033.",
    ],
    perguntas: [
      {
        id: "a3q1",
        pergunta: "O que acontece em 2026?",
        opcoes: [
          "CBS e IBS são cobrados integralmente",
          "É ano de teste, com CBS de 0,9% e IBS de 0,1%; quem informa tudo corretamente nas notas não precisa recolher",
          "Todos os tributos antigos deixam de existir",
          "O Imposto Seletivo passa a valer",
        ],
        correta: 1,
        explicacao: "2026 é o ano de teste: os valores aparecem nas notas, mas, cumpridas as obrigações acessórias, não há recolhimento efetivo.",
      },
      {
        id: "a3q2",
        pergunta: "Em que ano o ICMS e o ISS deixam de existir, segundo o calendário?",
        opcoes: ["2027", "2029", "2031", "2033"],
        correta: 3,
        explicacao: "A substituição é gradual (2029 a 2032) e termina em 2033, com o IBS integral.",
      },
    ],
    fontes: ["receitaEntenda", "senadoTransicao", "senadoCbs", "senadoCbs2", "calculadora"],
  },

  // ------------------------------------------------------------------ 4
  {
    id: "como-funciona",
    titulo: "Como o imposto funciona: crédito, destino e split payment",
    minutos: 7,
    objetivo: "Entender as quatro regras que mais mudam o dia a dia: não cumulatividade, destino, split payment e cashback.",
    blocos: [
      { t: "h", x: "1. Não cumulatividade: imposto só sobre o que você acrescenta" },
      {
        t: "p",
        x: "Na [[naoCumulatividade|não cumulatividade]], cada empresa desconta do imposto das suas vendas o [[credito|crédito]] do imposto pago nas compras. Veja a cadeia abaixo, com uma alíquota **ilustrativa** de 10%:",
      },
      {
        t: "tabela",
        cabecalho: ["Etapa", "Compra por", "Vende por", "Imposto da venda (10%)", "Crédito da compra", "Paga ao governo"],
        linhas: [
          ["Produtor", "—", "R$ 100", "R$ 10", "R$ 0", "**R$ 10**"],
          ["Atacadista", "R$ 100", "R$ 150", "R$ 15", "R$ 10", "**R$ 5**"],
          ["Varejista", "R$ 150", "R$ 200", "R$ 20", "R$ 15", "**R$ 5**"],
        ],
        nota: "Valores e alíquota ilustrativos, só para mostrar a conta.",
      },
      {
        t: "p",
        x: "O governo recebe 10 + 5 + 5 = **R$ 20**, exatamente 10% do preço final (R$ 200). Sem a não cumulatividade, cada etapa pagaria sobre o valor total e o imposto se acumularia: é o efeito cascata.",
      },
      {
        t: "p",
        x: "A reforma prevê crédito amplo (a Receita fala em “crédito financeiro pleno”): em regra, o que a empresa compra para a sua atividade gera crédito. Há condições para usá-lo, como o documento fiscal correto e, segundo orientações da SEFAZ-BA, a extinção do débito do fornecedor.",
      },
      { t: "h", x: "2. Princípio do destino" },
      {
        t: "p",
        x: "Pelo [[destino|princípio do destino]], o imposto pertence ao local onde o consumo acontece. Exemplo ilustrativo: uma empresa de Porto Alegre que vende para um cliente em Salvador paga o IBS ao estado e ao município de **destino**. As exportações são desoneradas. É por isso que o simulador pede a UF e o município.",
      },
      { t: "h", x: "3. Split payment" },
      {
        t: "p",
        x: "No [[splitPayment|split payment]], quando o cliente paga (cartão, Pix etc.), o valor do IBS e da CBS é separado na hora e vai para o Comitê Gestor (IBS) e a Receita (CBS). O vendedor recebe o restante, já descontados créditos e taxas.",
      },
      {
        t: "atencao",
        titulo: "Ainda em implantação",
        x: "O Comitê Gestor começou os testes de integração da plataforma pública em outubro de 2026, e o manual de operações está na versão 1.0.1. Pelo manual preliminar (junho/2026), o uso é facultativo. As regras operacionais podem mudar: confira a versão atual.",
      },
      { t: "h", x: "4. Cashback" },
      {
        t: "p",
        x: "Famílias de baixa renda inscritas no CadÚnico podem receber de volta parte do imposto ([[cashback|cashback]]). Pelo texto original da LC 214/2025: 100% da CBS e 20% do IBS nas contas de energia, água, gás e telecomunicações, e 20% da CBS e do IBS nas demais compras (exceto bens com Imposto Seletivo). Começa em 2027 para a CBS e em 2029 para o IBS. Confira alterações posteriores.",
      },
    ],
    resumo: [
      "Não cumulatividade: cada etapa paga só sobre o valor que acrescentou, usando os créditos das compras.",
      "Destino: o imposto vai para onde o bem ou serviço é consumido.",
      "Split payment: o imposto é separado no momento do pagamento (em implantação).",
      "Cashback devolve parte do imposto a famílias de baixa renda.",
    ],
    perguntas: [
      {
        id: "a4q1",
        pergunta: "O que significa o princípio do destino?",
        opcoes: [
          "O imposto fica com o local onde o bem ou serviço é consumido",
          "O imposto fica sempre com o estado onde a empresa está",
          "O imposto só é pago na importação",
          "O imposto vai todo para a União",
        ],
        correta: 0,
        explicacao: "Por isso o cálculo do IBS depende do estado e do município da operação.",
      },
      {
        id: "a4q2",
        pergunta: "No exemplo da cadeia (alíquota ilustrativa de 10%), quanto o atacadista paga ao governo?",
        opcoes: ["R$ 15", "R$ 10", "R$ 5", "R$ 20"],
        correta: 2,
        explicacao: "Imposto da venda (R$ 15) menos o crédito da compra (R$ 10) = R$ 5.",
      },
    ],
    fontes: ["receitaEntenda", "camaraLc214", "sefazBa", "cgibsSplit"],
  },

  // ------------------------------------------------------------------ 5
  {
    id: "reducoes",
    titulo: "Alíquota cheia, reduzida, zero e isenta",
    minutos: 7,
    objetivo: "Entender como a classificação tributária muda o imposto de cada item e como ler a tabela oficial.",
    blocos: [
      {
        t: "p",
        x: "Nem tudo paga a alíquota cheia. A lei dá tratamento especial a bens e serviços essenciais ou de interesse social. Na prática, a alíquota padrão sofre uma **redução**, que pode chegar a 100%.",
      },
      {
        t: "destaque",
        titulo: "A conta",
        x: "**alíquota que sobra = alíquota cheia × (1 − redução)**",
      },
      {
        t: "exemplo",
        titulo: "Exemplo ilustrativo (alíquota cheia de 10%, serviço de R$ 1.000)",
        x: "Redução de 60%: sobra 4% e o imposto é de **R$ 40**. Redução de 30%: sobra 7% e o imposto é de **R$ 70**. Redução de 100% ([[aliquotaZero|alíquota zero]]): sobra 0% e o imposto é de **R$ 0**.",
      },
      {
        t: "tabela",
        cabecalho: ["Tratamento", "O que significa", "Exemplos na tabela oficial"],
        linhas: [
          ["Tributação integral", "Sem redução: paga a alíquota padrão", "Classificação 000001, situações tributadas integralmente"],
          [
            "Alíquota reduzida em 60%",
            "Paga 40% da alíquota padrão",
            "Serviços de educação ([[anexo|Anexo II]]) e de saúde (Anexo III); dispositivos médicos (IV); medicamentos; alimentos (VII); higiene pessoal e limpeza (VIII)",
          ],
          ["Alíquota reduzida em 30%", "Paga 70% da alíquota padrão", "Serviços de profissões intelectuais regulamentadas (classificação 200052), com condições"],
          [
            "Alíquota zero",
            "Paga 0%",
            "Vendas de produtos para alimentação humana (200003): a [[cestaBasica|Cesta Básica Nacional]], como arroz, feijão, leite, carnes e peixes",
          ],
          ["Isenção, imunidade e não incidência", "O imposto não é cobrado", "Exportações de bens e serviços (410004)"],
          ["Suspensão e diferimento", "O pagamento é suspenso ou adiado", "Exportações de bens materiais (550001, suspensão)"],
        ],
        nota: "Exemplos extraídos da tabela de classificações da calculadora oficial (versão 1.71, de 30/10/2026).",
      },
      {
        t: "p",
        x: "Na tabela vigente em novembro de 2026 há **170 classificações**. Os tratamentos mais frequentes são: imunidade e não incidência (35), suspensão (28), alíquota zero (24), reduzida em 60% (19), tributação integral (6) e isenção (4). Existem ainda reduções de 40%, 50%, 70% e 80% em casos específicos.",
      },
      { t: "h", x: "Duas “etiquetas” em cada item" },
      {
        t: "p",
        x: "Cada item de uma nota fiscal recebe dois códigos: o [[cst|CST]] (visão geral: tributado, reduzido, isento…) e o [[cClassTrib|cClassTrib]] (o enquadramento exato na lei). É a **classificação** que determina a redução. Por isso o simulador sugere a classificação a partir do NCM ou NBS informado.",
      },
      {
        t: "destaque",
        titulo: "Profissões intelectuais: 30% de redução, com condições",
        x: "A redução de 30% vale para serviços de profissionais de atividades intelectuais fiscalizados por conselho profissional. A lista tem 19 categorias, entre elas advogados, contabilistas, arquitetos, engenheiros e administradores. Há condições: por exemplo, para uma pessoa jurídica, os serviços devem ser prestados diretamente pelos sócios habilitados. Confirme o enquadramento com o seu contador.",
      },
      { t: "h", x: "Regimes específicos" },
      {
        t: "p",
        x: "Alguns setores têm regras próprias de cálculo, além das reduções. Entre eles: combustíveis (incidência única), serviços financeiros, planos de saúde, cooperativas, bens imóveis, bares e restaurantes, hotelaria e parques temáticos, transporte coletivo, agências de turismo e sociedades anônimas do futebol. A lista e os detalhes dependem do texto vigente da lei, que mudou com a LC 227/2026.",
      },
    ],
    pratica:
      "No simulador, escolha uma classificação e veja o quadro verde “Efeito desta classificação”: ele mostra a alíquota cheia, a redução e quanto sobra. Teste os exemplos “Carne bovina” (alíquota zero) e “Educação infantil” (redução de 60%).",
    resumo: [
      "O imposto de cada item = alíquota cheia × (1 − redução).",
      "A classificação tributária (cClassTrib) define a redução; ela não muda a alíquota cheia.",
      "Cesta Básica Nacional: alíquota zero. Educação e saúde: redução de 60%. Profissões intelectuais: 30%, com condições.",
      "Alguns setores têm regimes específicos com regras próprias.",
    ],
    perguntas: [
      {
        id: "a5q1",
        pergunta: "Com alíquota cheia de 10% e uma redução de 60%, qual alíquota sobra?",
        opcoes: ["6%", "4%", "10%", "0%"],
        correta: 1,
        explicacao: "10% × (1 − 0,60) = 4%.",
      },
      {
        id: "a5q2",
        pergunta: "Trocar a classificação tributária de um item muda a alíquota cheia (nominal)?",
        opcoes: [
          "Sim: a classificação define a alíquota cheia",
          "Não: a alíquota cheia é a mesma; a classificação aplica a redução (ou o tratamento especial) por cima dela",
          "Só no Simples Nacional",
          "Só em 2026",
        ],
        correta: 1,
        explicacao: "A alíquota cheia vem da definição do Senado e dos entes. A classificação só determina quanto dela se aplica a cada item.",
      },
    ],
    fontes: ["calculadora", "camaraLc214", "senado30", "lc214"],
  },

  // ------------------------------------------------------------------ 6
  {
    id: "imposto-seletivo",
    titulo: "Imposto Seletivo: o “imposto do pecado”",
    minutos: 5,
    objetivo: "Saber o que é o Imposto Seletivo, quais bens ele alcança e em que pé está a regulamentação.",
    blocos: [
      {
        t: "p",
        x: "O [[impostoSeletivo|Imposto Seletivo (IS)]] é diferente dos outros: não existe para arrecadar de forma geral, mas para **desestimular** o consumo de bens e serviços prejudiciais à saúde ou ao meio ambiente. É federal e alcança a produção, a extração, a venda e a importação desses bens.",
      },
      { t: "h", x: "O que a LC 214/2025 prevê" },
      {
        t: "lista",
        itens: [
          "veículos, embarcações e aeronaves;",
          "cigarros e outros produtos fumígenos;",
          "bebidas alcoólicas;",
          "bebidas açucaradas;",
          "bens minerais (na extração), com alíquota máxima de **0,25%**;",
          "concursos de prognósticos (apostas).",
        ],
      },
      { t: "h", x: "Em que pé está" },
      {
        t: "lista",
        itens: [
          "Em **04/11/2026** foi editada a **Medida Provisória 1.399/2026**, que define as alíquotas iniciais do IS para 2027. Para virar lei, ela precisa ser aprovada pelo Congresso.",
          "Segundo a Agência Câmara, a MP prevê início em 2 de fevereiro de 2027 e alíquotas, até o fim de 2027, equivalentes às do IPI atual para carros, aeronaves, embarcações, cigarros e bebidas. O aumento vem a partir de 2028.",
          "Bens minerais extraídos têm alíquota zero até o fim de 2027.",
          "Veículos: alíquotas menores ou zero para modelos sustentáveis e para compras de pessoas com deficiência, autistas e taxistas; caminhões pesados (3.500 kg ou mais) ficam de fora, exceto picapes.",
          "O governo disse que enviará até o fim de maio de 2027 um projeto de lei com as alíquotas que valerão a partir de 2028. Se o IS arrecadar mais, a diferença deve ser compensada com redução da CBS.",
        ],
      },
      {
        t: "atencao",
        titulo: "Tema em movimento",
        x: "A MP ainda tramita e há leis por vir. Não use os números desta aula como definitivos: confira o texto vigente antes de decidir qualquer coisa.",
      },
      {
        t: "destaque",
        titulo: "IS e o simulador",
        x: "O IS entra na base de cálculo do IBS e da CBS (a documentação da calculadora oficial traz um exemplo com cerveja). **O simulador desta página ainda não inclui itens com Imposto Seletivo**; a calculadora oficial calcula, e isso pode ser acrescentado depois.",
      },
    ],
    resumo: [
      "O IS tem função regulatória: reduzir o consumo de bens nocivos à saúde e ao meio ambiente.",
      "Alcança veículos, fumígenos, bebidas alcoólicas e açucaradas, minerais e apostas.",
      "A MP 1.399/2026 trata de 2027; o aumento e a lei com as novas alíquotas vêm depois.",
    ],
    perguntas: [
      {
        id: "a6q1",
        pergunta: "Qual é o objetivo principal do Imposto Seletivo?",
        opcoes: [
          "Financiar a Cesta Básica Nacional",
          "Desestimular o consumo de bens e serviços prejudiciais à saúde ou ao meio ambiente",
          "Substituir o ICMS",
          "Tributar a renda das empresas",
        ],
        correta: 1,
        explicacao: "Ele é regulatório (extrafiscal): o foco é desestimular o consumo, não só arrecadar.",
      },
      {
        id: "a6q2",
        pergunta: "Qual destes NÃO está entre as categorias do Imposto Seletivo?",
        opcoes: ["Bebidas alcoólicas", "Cigarros", "Veículos", "Pão francês"],
        correta: 3,
        explicacao: "O pão francês está na Cesta Básica Nacional, com alíquota zero. Já bebidas alcoólicas, fumígenos e veículos são categorias do IS.",
      },
    ],
    fontes: ["lc214", "camaraIs", "camaraLc214"],
  },

  // ------------------------------------------------------------------ 7
  {
    id: "empresas",
    titulo: "Para empresas e profissionais: Simples, nota fiscal e primeiros passos",
    minutos: 6,
    objetivo: "Saber o que muda para quem emite nota fiscal, como fica o Simples Nacional e por onde começar.",
    blocos: [
      { t: "h", x: "Simples Nacional" },
      {
        t: "lista",
        itens: [
          "O [[simples|Simples Nacional]] **continua**. Em 2026, segundo a SEFAZ-BA, as optantes não são obrigadas a destacar IBS e CBS nas notas (exceto em devoluções).",
          "A optante pode escolher apurar IBS e CBS pelo [[regimeRegular|regime regular]], com créditos. A Receita oferece no portal gov.br o serviço “Escolher Regime de Apuração de IBS e CBS”. Confira as regras e os prazos da opção.",
          "Quem compra de empresa do Simples se credita apenas do valor efetivamente recolhido no Simples, a menos que a vendedora tenha optado pelo regime regular.",
          "Em novembro de 2026, o Comitê Gestor do Simples Nacional publicou novas regras para o Simples e para a transição.",
        ],
      },
      { t: "h", x: "Nota fiscal" },
      {
        t: "p",
        x: "A NF-e e a NFS-e ganham um grupo de campos de IBS e CBS **por item**, com o CST e o cClassTrib. As classificações estão ligadas a artigos da LC 214/2025, e a tabela é atualizada com frequência (a versão que consultamos é de 30/10/2026). Os prazos de obrigatoriedade variam por tipo de nota e de contribuinte: siga as notas técnicas vigentes.",
      },
      { t: "h", x: "Caixa e preço" },
      {
        t: "p",
        x: "O split payment pode mudar o fluxo de caixa, porque o imposto sai na hora do pagamento. E a não cumulatividade muda a lógica de preços: o crédito das compras passa a pesar mais na hora de precificar.",
      },
      { t: "h", x: "Checklist para começar" },
      {
        t: "lista",
        itens: [
          "Conferir se os produtos e serviços têm **NCM** e **NBS** corretos no cadastro.",
          "Descobrir a **classificação tributária** de cada item (o simulador ajuda).",
          "Perguntar ao fornecedor do sistema ou do emissor de notas quando virá a atualização, e testar.",
          "Revisar preços e contratos de longo prazo, pensando em créditos e na troca dos tributos.",
          "Conversar com o contador sobre o regime (Simples ou regular) e o impacto no caixa.",
          "Acompanhar o que ainda está pendente: alíquotas de 2027, Imposto Seletivo e regras do split payment.",
        ],
      },
      {
        t: "atencao",
        titulo: "Conteúdo educativo",
        x: "Este curso explica a reforma em linguagem simples e **não substitui** a leitura da lei nem a orientação de um contador ou advogado tributarista. A legislação está em evolução.",
      },
    ],
    pratica: "Use o simulador para descobrir a classificação de um produto ou serviço seu: pesquise pelo nome, confira a descrição oficial e veja o efeito da classificação.",
    resumo: [
      "O Simples continua, e a optante pode escolher o regime regular de IBS e CBS.",
      "A nota fiscal traz um grupo de IBS/CBS por item, com CST e cClassTrib.",
      "Comece pelo cadastro (NCM/NBS), pela classificação e pelo diálogo com o contador e o fornecedor do sistema.",
    ],
    perguntas: [
      {
        id: "a7q1",
        pergunta: "Uma empresa do Simples Nacional pode escolher apurar IBS e CBS pelo regime regular?",
        opcoes: [
          "Sim, a lei prevê essa opção, com regras e prazos próprios",
          "Não, o Simples impede",
          "Só a partir de 2033",
          "Só microempreendedores individuais",
        ],
        correta: 0,
        explicacao: "A opção existe. Ao optar, a empresa passa a ter créditos, mas deixa de recolher IBS e CBS dentro do Simples.",
      },
      {
        id: "a7q2",
        pergunta: "O que a nota fiscal passa a trazer, em cada item, por causa da reforma?",
        opcoes: ["Só o nome do cliente", "Um grupo de campos de IBS e CBS, com CST e cClassTrib", "Apenas o valor do ICMS", "Nada muda"],
        correta: 1,
        explicacao: "O CST e o cClassTrib identificam o tratamento tributário de cada item, e é a classificação que define a redução.",
      },
    ],
    fontes: ["sefazBa", "receitaEntenda", "receitaSimples", "calculadora", "cgibsSplit"],
  },
];

export const APROFUNDAR: (keyof typeof FONTES)[] = ["fazendaPerguntas", "lc214", "receitaEntenda", "calculadora"];
export const TOTAL_PERGUNTAS = AULAS.reduce((n, a) => n + a.perguntas.length, 0);
export const TOTAL_MINUTOS = AULAS.reduce((n, a) => n + a.minutos, 0);
