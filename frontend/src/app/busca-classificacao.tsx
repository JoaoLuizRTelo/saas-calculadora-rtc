"use client";

import { useMemo, useState } from "react";
import type { ClassificacaoInfo, Compatibilidade } from "@/lib/api";
import { CAMPO } from "@/lib/item";
import { normalizar, palavras } from "@/lib/texto";
import { Rotulo } from "./ajuda";

const LIMITE = 15;

type Props = {
  id: string;
  /** Classificações que fazem sentido para o tipo do item (produto ou serviço). */
  opcoes: ClassificacaoInfo[];
  /** Quando o NCM/NBS está completo: compatibilidade de cada classificação aceita. Null = ainda não filtrado. */
  compat: Map<string, Compatibilidade> | null;
  onEscolher: (c: ClassificacaoInfo) => void;
};

const ROTULO_COMPAT: Record<Compatibilidade, string | null> = {
  ESPECIFICA: "Específica para o código",
  GERAL: null,
  NAO_VERIFICADA: "Não verificada",
};

/** Pesquisa a classificação tributária por palavra; clicar preenche CST e classificação juntos. */
export default function BuscaClassificacao({ id, opcoes, compat, onEscolher }: Props) {
  const [texto, setTexto] = useState("");

  // Índice de busca montado uma vez por lista (a busca em si roda a cada tecla, sobre ~170 itens).
  const indice = useMemo(
    () =>
      opcoes.map((c) => ({
        c,
        texto: normalizar(`${c.codigo} ${c.descricao} ${c.tratamento} ${c.cstDescricao}`),
      })),
    [opcoes],
  );

  const termos = useMemo(() => palavras(texto), [texto]);
  const achados = useMemo(() => {
    if (termos.join("").length < 2) return [];
    const ordem: Record<Compatibilidade, number> = { ESPECIFICA: 0, NAO_VERIFICADA: 1, GERAL: 2 };
    return indice
      .filter(({ c, texto: t }) => (!compat || compat.has(c.codigo)) && termos.every((p) => t.includes(p)))
      .map(({ c }) => c)
      .sort(
        (a, b) =>
          ordem[compat?.get(a.codigo) ?? "GERAL"] - ordem[compat?.get(b.codigo) ?? "GERAL"] ||
          a.codigo.localeCompare(b.codigo),
      );
  }, [indice, compat, termos]);

  return (
    <div>
      <Rotulo htmlFor={id} termo="buscaClassificacao">
        Não sabe qual classificação escolher? Pesquise por palavra
      </Rotulo>
      <input
        id={id}
        type="search"
        autoComplete="off"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setTexto("")}
        placeholder="Ex.: alimento, educação, medicamento, aluguel"
        aria-controls={`${id}-resultados`}
        className={CAMPO}
      />
      <div id={`${id}-resultados`} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {texto.trim() !== "" && termos.join("").length < 2 && <p>Digite pelo menos 2 letras.</p>}
        {termos.join("").length >= 2 && achados.length === 0 && (
          <p>Nenhuma classificação encontrada{compat ? " para este código" : ""}. Tente outra palavra.</p>
        )}
        {achados.length > 0 && (
          <>
            <ul className="mt-1 max-h-72 overflow-y-auto rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              {achados.slice(0, LIMITE).map((c) => {
                const marca = compat ? ROTULO_COMPAT[compat.get(c.codigo) ?? "GERAL"] : null;
                return (
                  <li key={c.codigo} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        onEscolher(c);
                        setTexto("");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none dark:text-zinc-100 dark:hover:bg-emerald-950 dark:focus:bg-emerald-950"
                    >
                      <span className="mr-2 font-mono text-xs text-emerald-800 dark:text-emerald-400">{c.codigo}</span>
                      {c.descricao}
                      <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
                        {c.tratamento}
                        {marca && (
                          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                            {marca}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1">
              {achados.length > LIMITE
                ? `Mostrando ${LIMITE} de ${achados.length}. Acrescente mais palavras para afinar.`
                : `${achados.length} ${achados.length === 1 ? "resultado" : "resultados"}.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
