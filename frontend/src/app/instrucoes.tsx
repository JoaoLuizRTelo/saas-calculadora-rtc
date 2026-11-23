"use client";

import type { ItemForm } from "@/lib/item";
import { ComAjuda } from "./ajuda";

export type Exemplo = { titulo: string; descricao: string; item: Omit<ItemForm, "id"> };

// Casos prontos para quem está começando (valores conferidos na calculadora oficial).
export const EXEMPLOS: Exemplo[] = [
  {
    titulo: "Carne bovina",
    descricao: "Produto da cesta básica: alíquota zero",
    item: {
      tipo: "PRODUTO",
      codigo: "02013000",
      cst: "200",
      cClassTrib: "200003",
      baseCalculo: "500,00",
      cbs: "8,8",
      ibsEstadual: "0,05",
      ibsMunicipal: "0,05",
    },
  },
  {
    titulo: "Educação infantil",
    descricao: "Serviço com redução de 60%",
    item: {
      tipo: "SERVICO",
      codigo: "122011200",
      cst: "200",
      cClassTrib: "200028",
      baseCalculo: "1200,00",
      cbs: "8,8",
      ibsEstadual: "0,05",
      ibsMunicipal: "0,05",
    },
  },
];

const passos: { titulo: string; texto: React.ReactNode }[] = [
  {
    titulo: "Data e local",
    texto: "Informe quando a venda ou o serviço acontece e em qual estado e cidade. A data importa: as regras mudam com o tempo.",
  },
  {
    titulo: "O que você vende",
    texto: (
      <>
        Escolha <strong>Produto</strong> ou <strong>Serviço</strong>. Não sabe o código? Digite o nome na pesquisa
        (ex.: &quot;carne bovina&quot;) e clique no resultado: o código é preenchido para você.
      </>
    ),
  },
  {
    titulo: "Classificação tributária",
    texto: (
      <>
        A tela escolhe sozinha a mais provável. Se tiver dúvida, pesquise por palavra (ex.: &quot;alimento&quot;). O quadro verde
        mostra o efeito dela: <strong>quanto a alíquota cai</strong>.
      </>
    ),
  },
  { titulo: "Valor", texto: "Digite o valor da venda ou do serviço, em reais." },
  {
    titulo: "Alíquotas",
    texto: "Pode deixar como estão. Já vêm preenchidas com os valores do exemplo da Receita; só mude se souber os seus.",
  },
  {
    titulo: "Calcular",
    texto: "Clique em Calcular: a página desce até o resultado. Depois é só voltar, mudar o que quiser e calcular de novo.",
  },
];

/** Painel "Como usar", ao lado do formulário. */
export default function Instrucoes({ onExemplo }: { onExemplo: (e: Exemplo) => void }) {
  return (
    <aside
      aria-labelledby="instrucoes-titulo"
      className="space-y-5 rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <div>
        <h2 id="instrucoes-titulo" className="text-lg font-semibold">Como usar</h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Sem conhecer a legislação: siga os passos e use as pesquisas.
        </p>
      </div>

      <ol className="space-y-3">
        {passos.map((p, i) => (
          <li key={p.titulo} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{p.titulo}</p>
              <p className="text-zinc-700 dark:text-zinc-300">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-2 font-semibold">
          <ComAjuda termo="exemplos">Quer só ver funcionando?</ComAjuda>
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {EXEMPLOS.map((e) => (
            <button
              key={e.titulo}
              type="button"
              onClick={() => onExemplo(e)}
              className="rounded-md border border-emerald-700 px-3 py-2 text-left text-emerald-900 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 dark:text-emerald-200 dark:hover:bg-emerald-950"
            >
              <span className="block font-semibold">{e.titulo}</span>
              <span className="block text-xs text-zinc-600 dark:text-zinc-400">{e.descricao}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <li>
          Em qualquer termo, passe o mouse (ou toque) no <strong className="text-zinc-900 dark:text-zinc-100">?</strong> para ver a explicação.
        </li>
        <li>Vende mais de uma coisa na mesma operação? Use <strong className="text-zinc-900 dark:text-zinc-100">+ Adicionar item</strong>.</li>
        <li>O resultado é uma simulação e não substitui a orientação de um contador.</li>
      </ul>
    </aside>
  );
}
