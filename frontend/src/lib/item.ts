// Estado de um item no formulário e pequenos utilitários de formatação.

export type ItemForm = {
  id: number;
  tipo: "PRODUTO" | "SERVICO";
  codigo: string;
  cst: string;
  cClassTrib: string;
  baseCalculo: string;
  cbs: string;
  ibsEstadual: string;
  ibsMunicipal: string;
};

// Exemplo da documentação da Receita: serviço de educação (redução de 60%).
export const novoItem = (id: number): ItemForm => ({
  id,
  tipo: "SERVICO",
  codigo: "122011200",
  cst: "200",
  cClassTrib: "200028",
  baseCalculo: "1200,00",
  cbs: "8,8",
  ibsEstadual: "0,05",
  ibsMunicipal: "0,05",
});

export const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

/** NCM tem 8 dígitos; NBS tem 9. */
export const tamanhoDoCodigo = (tipo: ItemForm["tipo"]) => (tipo === "PRODUTO" ? 8 : 9);

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Aceita "1.234,56", "1234,56" ou "1234.56".
export function numero(texto: string): number {
  const t = texto.trim();
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return Number(normal);
}

export const CAMPO =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 " +
  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
