// Tipos e chamadas ao back-end do SaaS (via rewrite /backend -> Spring Boot).

export type Uf = { codigo: number; nome: string; sigla: string };
export type Municipio = { codigo: number; nome: string };
/** Uma classificação tributária (cClassTrib) com o CST e o efeito dela. Reduções em % (60 = alíquota cai 60%). */
export type ClassificacaoInfo = {
  cst: string;
  cstDescricao: string;
  codigo: string;
  descricao: string;
  tratamento: string;
  reducaoCbs: number | null;
  reducaoIbsEstadual: number | null;
  reducaoIbsMunicipal: number | null;
  /** "NBS", "NCM", "NBS ou NCM" ou "Não possui". */
  nomenclatura: string;
  tipoAliquota: string;
};

export type SimulacaoItem = {
  tipo: "PRODUTO" | "SERVICO";
  codigo: string;
  cst: string;
  cClassTrib: string;
  baseCalculo: number;
  aliquotas: { cbs: number; ibsEstadual: number; ibsMunicipal: number };
};

export type SimulacaoRequest = {
  uf: string;
  municipio: number;
  dataFatoGerador: string;
  itens: SimulacaoItem[];
};

export type ItemResultado = {
  numero: number;
  baseCalculo: number;
  cbs: number;
  ibsEstadual: number;
  ibsMunicipal: number;
  ibs: number;
  total: number;
  reducaoAliquota: number | null;
  memoriaCbs: string | null;
  memoriaIbs: string | null;
};

export type SimulacaoResponse = {
  itens: ItemResultado[];
  totais: { baseCalculo: number; cbs: number; ibs: number; total: number };
};

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/backend${caminho}`, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e; // busca substituída por outra: não é erro
    throw new Error("Não foi possível falar com o servidor do SaaS (back-end). Ele está rodando?");
  }
  if (!resposta.ok) {
    let detalhe = `Erro ${resposta.status}`;
    try {
      const corpo = await resposta.json();
      detalhe = corpo.detail ?? corpo.title ?? detalhe;
    } catch {
      // corpo vazio ou que não é JSON (ex.: back-end fora do ar atrás do proxy)
      if (resposta.status >= 500) detalhe = "O servidor do SaaS não respondeu. Ele está rodando?";
    }
    throw new Error(detalhe);
  }
  return resposta.json() as Promise<T>;
}

export const listarUfs = () => chamar<Uf[]>("/referencias/ufs");

export const listarMunicipios = (uf: string) =>
  chamar<Municipio[]>(`/referencias/municipios?uf=${encodeURIComponent(uf)}`);

/** Todas as classificações da data, já com CST, tratamento e percentuais de redução. */
export const listarClassificacoes = (data: string) =>
  chamar<ClassificacaoInfo[]>(`/referencias/classificacoes?data=${encodeURIComponent(data)}`);

export type Compatibilidade = "ESPECIFICA" | "GERAL" | "NAO_VERIFICADA";
export type ClassificacaoAplicavel = {
  cst: string;
  codigo: string;
  compatibilidade: Compatibilidade;
};

const consulta = (tipo: string, codigo: string, data: string) =>
  `tipo=${tipo}&codigo=${encodeURIComponent(codigo)}&data=${encodeURIComponent(data)}`;

/** Classificações (de todos os CST) que se aplicam ao NCM (8 dígitos) ou NBS (9 dígitos). */
export const listarClassificacoesAplicaveis = (tipo: string, codigo: string, data: string) =>
  chamar<ClassificacaoAplicavel[]>(`/referencias/classificacoes-aplicaveis?${consulta(tipo, codigo, data)}`);

export type CodigoEncontrado = { codigo: string; descricao: string };

/** Pesquisa NCM/NBS por palavras. `total` pode ser maior que a quantidade devolvida (limite de 20). */
export const buscarCodigos = (tipo: string, texto: string, data: string, sinal?: AbortSignal) =>
  chamar<{ itens: CodigoEncontrado[]; total: number }>(
    `/referencias/buscar-codigo?tipo=${tipo}&q=${encodeURIComponent(texto)}&data=${encodeURIComponent(data)}`,
    { signal: sinal },
  );

/** Descrição oficial do NCM/NBS; `descricao` vem nulo quando o código não existe. */
export const buscarDescricaoCodigo = (tipo: string, codigo: string, data: string) =>
  chamar<{ descricao: string | null }>(`/referencias/descricao-codigo?${consulta(tipo, codigo, data)}`);

export const simular = (req: SimulacaoRequest) =>
  chamar<SimulacaoResponse>("/simulacoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
