// Explicações em linguagem simples dos termos que aparecem na tela.
// Cada chave vira um balão "?" (componente Ajuda). Texto informativo; não substitui orientação de contador.

export const GLOSSARIO = {
  reforma: {
    titulo: "Reforma Tributária do Consumo",
    texto:
      "Mudança nos impostos sobre consumo no Brasil. PIS, Cofins, IPI, ICMS e ISS vão sendo substituídos por dois tributos novos: CBS e IBS. A transição acontece em etapas, a partir de 2026.",
  },
  lc214: {
    titulo: "LC 214/2025",
    texto:
      "Lei Complementar 214/2025: a lei que regulamenta a CBS, o IBS e o Imposto Seletivo, ou seja, define quem paga, quanto e em quais situações.",
  },
  simulacao: {
    titulo: "Simulação",
    texto:
      "O valor é calculado pela calculadora oficial da Receita Federal com os dados que você informou. Serve como estimativa e não substitui a apuração oficial nem a orientação de um contador.",
  },
  dataFatoGerador: {
    titulo: "Data do fato gerador",
    texto:
      "O dia em que a operação acontece, como a venda de um produto ou a prestação de um serviço. A data importa porque as regras e as alíquotas mudam ao longo da transição da reforma.",
  },
  uf: {
    titulo: "UF",
    texto:
      "Estado da operação. O IBS é cobrado no local de consumo, por isso o estado e o município entram no cálculo.",
  },
  municipio: {
    titulo: "Município",
    texto:
      "Cidade da operação. Uma parte do IBS pertence ao município, então ele precisa ser informado.",
  },
  tipoItem: {
    titulo: "Tipo do item",
    texto:
      "Produto é uma mercadoria (identificada pelo NCM). Serviço é uma prestação (identificada pela NBS).",
  },
  ncm: {
    titulo: "NCM",
    texto:
      "Nomenclatura Comum do Mercosul: código de 8 dígitos que identifica um produto. Exemplo: 02013000 é carne bovina fresca, desossada. Está na nota fiscal do produto.",
  },
  nbs: {
    titulo: "NBS",
    texto:
      "Nomenclatura Brasileira de Serviços: código de 9 dígitos que identifica um serviço. Exemplo: 122011200 é serviço de pré-escola.",
  },
  cst: {
    titulo: "CST",
    texto:
      "Código de Situação Tributária: diz, em linhas gerais, como a operação é tributada: integralmente, com alíquota reduzida, isenta, com diferimento e assim por diante.",
  },
  cClassTrib: {
    titulo: "Classificação tributária (cClassTrib)",
    texto:
      "Detalha o CST e aponta o enquadramento exato na lei, por exemplo alimentos da cesta básica ou serviços de educação. É ela que define reduções e isenções. Com o NCM/NBS completo, a lista mostra primeiro as classificações específicas para ele.",
  },
  compatEspecifica: {
    titulo: "Específicas para este código",
    texto:
      "Classificações que têm lista própria de NCM/NBS e incluem o código digitado. Costumam ser o enquadramento correto.",
  },
  compatGeral: {
    titulo: "Gerais",
    texto:
      "Classificações que não restringem NCM/NBS: a calculadora aceita para qualquer código, mas isso não significa que se apliquem ao seu produto. Confira a descrição.",
  },
  compatNaoVerificada: {
    titulo: "Não verificadas",
    texto:
      "A calculadora não consegue checar estas classificações pelo código. A escolha fica por sua conta.",
  },
  buscaCodigo: {
    titulo: "Pesquisar pelo nome",
    texto:
      "Não sabe o código? Digite palavras do nome do produto ou serviço (ex.: \"carne bovina\", \"educação infantil\") e clique no resultado: o código é preenchido para você. A busca ignora acentos e maiúsculas.",
  },
  buscaClassificacao: {
    titulo: "Pesquisar a classificação",
    texto:
      "Digite uma palavra que descreva a situação (ex.: \"alimento\", \"educação\", \"medicamento\") e clique no resultado. O CST e a classificação são preenchidos juntos. Se o NCM/NBS já estiver completo, só aparecem as classificações que a calculadora aceita para ele.",
  },
  efeitoClassificacao: {
    titulo: "O que a classificação faz",
    texto:
      "As alíquotas nominais que você informa são as \"cheias\" e não mudam quando você troca a classificação. É a classificação que aplica uma redução por cima delas (ex.: 60% de redução, ou 100%, que significa alíquota zero). A tabela mostra a alíquota que sobra.",
  },
  aliquotaEfetiva: {
    titulo: "Alíquota efetiva",
    texto: "A alíquota que sobra depois da redução: alíquota cheia × (1 − redução). Exemplo: 8,8% com redução de 60% vira 3,52%.",
  },
  exemplos: {
    titulo: "Exemplos para testar",
    texto:
      "Preenchem o formulário com um caso pronto, para você ver a calculadora funcionando antes de usar os seus próprios dados.",
  },
  baseCalculo: {
    titulo: "Base de cálculo",
    texto:
      "O valor sobre o qual o imposto é calculado. Em geral é o preço da operação, mas a lei define o que entra ou sai dele.",
  },
  aliquotas: {
    titulo: "Alíquotas nominais",
    texto:
      "O percentual \"cheio\" de cada tributo, antes de reduções. Para 2027 em diante a tabela oficial ainda não traz alíquotas de referência, por isso você informa. Os valores iniciais vêm do exemplo da Receita.",
  },
  cbs: {
    titulo: "CBS",
    texto:
      "Contribuição sobre Bens e Serviços. Tributo federal que substitui PIS e Cofins.",
  },
  ibs: {
    titulo: "IBS",
    texto:
      "Imposto sobre Bens e Serviços. Tributo de estados e municípios, que substitui o ICMS e o ISS. É a soma da parte estadual com a municipal.",
  },
  ibsEstadual: {
    titulo: "IBS estadual",
    texto: "A parte do IBS que fica com o estado.",
  },
  ibsMunicipal: {
    titulo: "IBS municipal",
    texto: "A parte do IBS que fica com o município.",
  },
  total: {
    titulo: "Total",
    texto: "CBS mais IBS: o total desses dois tributos na operação.",
  },
  reducaoAliquota: {
    titulo: "Redução de alíquota",
    texto:
      "Desconto percentual na alíquota previsto em lei para certos bens e serviços. Exemplo: serviços de educação têm redução de 60%, então pagam 40% da alíquota cheia.",
  },
  memoriaCalculo: {
    titulo: "Memória de cálculo",
    texto:
      "Texto gerado pela calculadora que explica como chegou ao valor: o enquadramento legal, a base e a alíquota usadas.",
  },
  resultado: {
    titulo: "Resultado",
    texto: "Valores calculados pela API oficial da Receita Federal para a operação informada.",
  },
} as const;

export type Termo = keyof typeof GLOSSARIO;
