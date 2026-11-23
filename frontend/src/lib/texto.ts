/** Minúsculas, sem acento e só letras/números separados por espaço, para comparar textos na busca. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Palavras da consulta (sem repetidas); a busca exige que todas apareçam no texto. */
export function palavras(consulta: string): string[] {
  return [...new Set(normalizar(consulta).split(" ").filter(Boolean))];
}

/** 3,52 -> "3,52%"; até 4 casas decimais, sem zeros sobrando. */
export function percentual(n: number): string {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`;
}
