"use client";

import { useEffect, useState } from "react";
import { buscarCodigos, type CodigoEncontrado } from "@/lib/api";
import { CAMPO, DATA_VALIDA, type ItemForm } from "@/lib/item";
import { Rotulo } from "./ajuda";

const MINIMO = 3; // letras; abaixo disso a busca devolveria quase tudo

type Props = {
  id: string;
  tipo: ItemForm["tipo"];
  data: string;
  onEscolher: (codigo: string) => void;
};

/** Pesquisa NCM (produto) ou NBS (serviço) pelo nome; clicar num resultado preenche o código. */
export default function BuscaCodigo({ id, tipo, data, onEscolher }: Props) {
  const [texto, setTexto] = useState("");
  // Cada resposta guarda a pergunta que a originou; pergunta diferente = resposta velha, ignorada.
  const [resposta, setResposta] = useState<{ chave: string; itens: CodigoEncontrado[]; total: number } | null>(null);
  const [falha, setFalha] = useState<{ chave: string; mensagem: string } | null>(null);

  const termo = texto.trim();
  const pronto = termo.length >= MINIMO && DATA_VALIDA.test(data);
  const chave = `${tipo}|${data}|${termo}`;

  useEffect(() => {
    if (!pronto) return;
    const controle = new AbortController();
    const espera = setTimeout(() => {
      buscarCodigos(tipo, termo, data, controle.signal)
        .then((r) => setResposta({ chave, itens: r.itens, total: r.total }))
        .catch((e: Error) => {
          if (e.name !== "AbortError") setFalha({ chave, mensagem: e.message });
        });
    }, 350); // espera o usuário parar de digitar
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [pronto, tipo, termo, data, chave]);

  const atual = pronto && resposta?.chave === chave ? resposta : null;
  const erro = pronto && falha?.chave === chave ? falha.mensagem : null;
  const buscando = pronto && !atual && !erro;
  const nome = tipo === "PRODUTO" ? "produto" : "serviço";

  return (
    <div>
      <Rotulo htmlFor={id} termo="buscaCodigo">
        Não sabe o código? Pesquise pelo nome do {nome}
      </Rotulo>
      <input
        id={id}
        type="search"
        autoComplete="off"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setTexto("")}
        placeholder={tipo === "PRODUTO" ? "Ex.: carne bovina, arroz, cerveja" : "Ex.: educação infantil, consultoria"}
        aria-controls={`${id}-resultados`}
        className={CAMPO}
      />
      <div id={`${id}-resultados`} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {texto !== "" && termo.length < MINIMO && <p>Digite pelo menos {MINIMO} letras.</p>}
        {buscando && (
          <p>
            Pesquisando…
            {tipo === "PRODUTO" && " (a primeira busca de produtos pode levar alguns segundos)"}
          </p>
        )}
        {erro && <p className="text-red-700 dark:text-red-400">{erro}</p>}
        {atual && atual.itens.length === 0 && (
          <p>Nada encontrado. Tente outras palavras, mais simples ou no singular.</p>
        )}
        {atual && atual.itens.length > 0 && (
          <>
            <ul className="mt-1 max-h-64 overflow-y-auto rounded-md border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              {atual.itens.map((c) => (
                <li key={c.codigo} className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      onEscolher(c.codigo);
                      setTexto("");
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none dark:text-zinc-100 dark:hover:bg-emerald-950 dark:focus:bg-emerald-950"
                  >
                    <span className="mr-2 font-mono text-xs text-emerald-800 dark:text-emerald-400">{c.codigo}</span>
                    {c.descricao}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1">
              {atual.total > atual.itens.length
                ? `Mostrando ${atual.itens.length} de ${atual.total}. Acrescente mais palavras para afinar a busca.`
                : `${atual.total} ${atual.total === 1 ? "resultado" : "resultados"}. Clique no que corresponde ao seu caso.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
