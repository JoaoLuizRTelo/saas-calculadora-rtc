"use client";

import Link from "next/link";
import {
  APROFUNDAR,
  AULAS,
  DATA_DE_REVISAO,
  FONTES,
  TOTAL_MINUTOS,
  TOTAL_PERGUNTAS,
  type Aula,
  type Bloco,
  type Pergunta,
} from "@/lib/curso";
import { useProgresso } from "@/lib/progresso";
import Texto from "./texto";

const CAIXA = "rounded-lg border p-4 text-sm leading-relaxed";

function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    <div className="space-y-4">
      {blocos.map((b, i) => {
        switch (b.t) {
          case "p":
            return (
              <p key={i} className="leading-relaxed text-zinc-800 dark:text-zinc-200">
                <Texto x={b.x} />
              </p>
            );
          case "h":
            return (
              <h4 key={i} className="pt-2 text-base font-semibold">
                <Texto x={b.x} />
              </h4>
            );
          case "lista":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5 leading-relaxed text-zinc-800 dark:text-zinc-200">
                {b.itens.map((item, j) => (
                  <li key={j}>
                    <Texto x={item} />
                  </li>
                ))}
              </ul>
            );
          case "destaque":
            return (
              <div key={i} className={`${CAIXA} border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950`}>
                <p className="mb-1 font-semibold">{b.titulo}</p>
                <p>
                  <Texto x={b.x} />
                </p>
              </div>
            );
          case "atencao":
            return (
              <div key={i} role="note" className={`${CAIXA} border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100`}>
                <p className="mb-1 font-semibold">⚠ {b.titulo}</p>
                <p>
                  <Texto x={b.x} />
                </p>
              </div>
            );
          case "exemplo":
            return (
              <div key={i} className={`${CAIXA} border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900`}>
                <p className="mb-1 font-semibold">{b.titulo}</p>
                <p>
                  <Texto x={b.x} />
                </p>
              </div>
            );
          case "tempo":
            return (
              <ol key={i} className="relative space-y-4 border-l-2 border-emerald-300 pl-5 dark:border-emerald-800">
                {b.itens.map((item, j) => (
                  <li key={j} className="relative">
                    <span aria-hidden="true" className="absolute -left-[1.72rem] top-1.5 h-3 w-3 rounded-full bg-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{item.quando}</p>
                    <p className="leading-relaxed text-zinc-800 dark:text-zinc-200">
                      <Texto x={item.x} />
                    </p>
                  </li>
                ))}
              </ol>
            );
          case "tabela":
            return (
              <div key={i}>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="bg-zinc-100 dark:bg-zinc-900">
                      <tr>
                        {b.cabecalho.map((c) => (
                          <th key={c} scope="col" className="px-3 py-2 font-semibold">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.linhas.map((linha, j) => (
                        <tr key={j} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                          {linha.map((celula, k) => (
                            <td key={k} className="px-3 py-2 leading-relaxed">
                              <Texto x={celula} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {b.nota && <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{b.nota}</p>}
              </div>
            );
        }
      })}
    </div>
  );
}

function Quiz({
  pergunta,
  escolhida,
  onEscolher,
  onRefazer,
}: {
  pergunta: Pergunta;
  escolhida: number | undefined;
  onEscolher: (opcao: number) => void;
  onRefazer: () => void;
}) {
  const respondida = escolhida !== undefined && escolhida >= 0 && escolhida < pergunta.opcoes.length;
  const acertou = respondida && escolhida === pergunta.correta;
  return (
    <fieldset className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <legend className="px-2 text-sm font-semibold">{pergunta.pergunta}</legend>
      <div className="space-y-2">
        {pergunta.opcoes.map((opcao, i) => {
          let estilo = "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900";
          if (respondida && i === pergunta.correta) estilo = "border-emerald-600 bg-emerald-50 dark:bg-emerald-950";
          else if (respondida && i === escolhida) estilo = "border-red-500 bg-red-50 dark:bg-red-950";
          return (
            <button
              key={i}
              type="button"
              disabled={respondida}
              aria-pressed={respondida && i === escolhida}
              onClick={() => onEscolher(i)}
              className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors enabled:cursor-pointer ${estilo}`}
            >
              {opcao}
              {respondida && i === pergunta.correta && <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-400">✓ resposta certa</span>}
              {respondida && i === escolhida && i !== pergunta.correta && (
                <span className="ml-2 font-semibold text-red-700 dark:text-red-400">✗ a sua resposta</span>
              )}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-3 text-sm">
        {respondida && (
          <>
            <p className={`font-semibold ${acertou ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {acertou ? "Certo!" : "Não foi dessa vez."}
            </p>
            <p className="mt-1 leading-relaxed text-zinc-700 dark:text-zinc-300">{pergunta.explicacao}</p>
            <button type="button" onClick={onRefazer} className="mt-2 text-sm text-emerald-800 underline dark:text-emerald-400">
              Responder de novo
            </button>
          </>
        )}
      </div>
    </fieldset>
  );
}

export default function Curso() {
  const { concluidas, respostas, alternarAula, responder, refazer, limpar } = useProgresso();

  const feitas = AULAS.filter((a) => concluidas.includes(a.id)).length;
  const respondidas = AULAS.flatMap((a) => a.perguntas).filter((p) => respostas[p.id] !== undefined).length;
  const acertos = AULAS.flatMap((a) => a.perguntas).filter((p) => respostas[p.id] === p.correta).length;
  const proxima: Aula | undefined = AULAS.find((a) => !concluidas.includes(a.id));
  const pct = Math.round((feitas / AULAS.length) * 100);

  return (
    <div className="space-y-12">
      <section aria-labelledby="progresso" className="space-y-4">
        <div className={`${CAIXA} border-zinc-200 dark:border-zinc-800`}>
          <p className="font-semibold">Antes de começar</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            Conteúdo educativo em linguagem simples, com a legislação como estava em <strong>{DATA_DE_REVISAO}</strong>. A reforma ainda está sendo regulamentada
            e alguns pontos mudam rápido. Não substitui a leitura da lei nem a orientação de um contador ou advogado tributarista.
          </p>
        </div>

        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="progresso" className="text-lg font-semibold">
              Seu progresso
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {feitas} de {AULAS.length} aulas · {acertos} de {TOTAL_PERGUNTAS} perguntas certas
            </p>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Aulas concluídas"
            className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Seu progresso fica salvo só neste navegador. {AULAS.length} aulas, cerca de {TOTAL_MINUTOS} minutos no total.
          </p>
        </div>

        <nav aria-label="Índice do curso">
          <ol className="grid gap-2 sm:grid-cols-2">
            {AULAS.map((a, i) => {
              const ok = concluidas.includes(a.id);
              return (
                <li key={a.id}>
                  <a
                    href={`#${a.id}`}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm hover:border-emerald-600 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 dark:border-zinc-800 dark:hover:bg-emerald-950"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        ok ? "bg-emerald-700 text-white" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {ok ? "✓" : i + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{a.titulo}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {a.minutos} min{ok && " · concluída"}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        {proxima && (
          <a
            href={`#${proxima.id}`}
            className="inline-block rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
          >
            {feitas === 0 ? "Começar o curso" : "Continuar: " + proxima.titulo}
          </a>
        )}
      </section>

      {AULAS.map((aula, i) => {
        const concluida = concluidas.includes(aula.id);
        const seguinte = AULAS[i + 1];
        return (
          <article key={aula.id} id={aula.id} aria-labelledby={`${aula.id}-titulo`} className="scroll-mt-6 space-y-5 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <header>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                Aula {i + 1} de {AULAS.length} · {aula.minutos} min
              </p>
              <h2 id={`${aula.id}-titulo`} className="mt-1 text-2xl font-bold tracking-tight">
                {aula.titulo}
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-800 dark:text-zinc-200">Você vai aprender:</strong> {aula.objetivo}
              </p>
            </header>

            <Blocos blocos={aula.blocos} />

            {aula.pratica && (
              <div className={`${CAIXA} border-emerald-600 bg-white dark:bg-zinc-950`}>
                <p className="font-semibold">Na prática</p>
                <p className="mt-1">{aula.pratica}</p>
                <Link href="/" className="mt-2 inline-block font-semibold text-emerald-800 underline dark:text-emerald-400">
                  Abrir o simulador →
                </Link>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-base font-semibold">Resumo da aula</h3>
              <ul className="list-disc space-y-1 pl-5 leading-relaxed text-zinc-800 dark:text-zinc-200">
                {aula.resumo.map((r) => (
                  <li key={r}>
                    <Texto x={r} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold">Teste rápido</h3>
              {aula.perguntas.map((p) => (
                <Quiz key={p.id} pergunta={p} escolhida={respostas[p.id]} onEscolher={(o) => responder(p.id, o)} onRefazer={() => refazer(p.id)} />
              ))}
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer font-semibold">Fontes desta aula</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {aula.fontes.map((f) => (
                  <li key={f}>
                    <a href={FONTES[f].url} target="_blank" rel="noopener noreferrer" className="underline decoration-emerald-600 underline-offset-2">
                      {FONTES[f].titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => alternarAula(aula.id)}
                aria-pressed={concluida}
                className={`rounded-md px-5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/40 ${
                  concluida
                    ? "border border-emerald-700 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                    : "bg-emerald-700 text-white hover:bg-emerald-800"
                }`}
              >
                {concluida ? "✓ Aula concluída (desmarcar)" : "Marcar aula como concluída"}
              </button>
              {seguinte ? (
                <a href={`#${seguinte.id}`} className="text-sm font-semibold text-emerald-800 underline dark:text-emerald-400">
                  Próxima aula: {seguinte.titulo} ↓
                </a>
              ) : (
                <a href="#encerramento" className="text-sm font-semibold text-emerald-800 underline dark:text-emerald-400">
                  Ir para o encerramento ↓
                </a>
              )}
            </div>
          </article>
        );
      })}

      <section id="encerramento" aria-labelledby="encerramento-titulo" className="scroll-mt-6 space-y-5 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 id="encerramento-titulo" className="text-2xl font-bold tracking-tight">
          {feitas === AULAS.length ? "Curso concluído!" : "Encerramento"}
        </h2>
        <p className="leading-relaxed text-zinc-800 dark:text-zinc-200">
          {feitas === AULAS.length
            ? `Você concluiu as ${AULAS.length} aulas e acertou ${acertos} de ${TOTAL_PERGUNTAS} perguntas. `
            : `Você concluiu ${feitas} de ${AULAS.length} aulas e respondeu ${respondidas} de ${TOTAL_PERGUNTAS} perguntas. `}
          Agora experimente a teoria no simulador: informe um produto ou serviço seu, veja a classificação sugerida e o efeito dela no imposto.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
        >
          Ir para o simulador
        </Link>

        <div>
          <h3 className="mb-2 text-base font-semibold">Para aprofundar</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {APROFUNDAR.map((f) => (
              <li key={f}>
                <a href={FONTES[f].url} target="_blank" rel="noopener noreferrer" className="underline decoration-emerald-600 underline-offset-2">
                  {FONTES[f].titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Apagar seu progresso (aulas concluídas e respostas) neste navegador?")) limpar();
          }}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          Limpar meu progresso
        </button>
      </section>
    </div>
  );
}
