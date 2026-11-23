"use client";

import { useId, useRef } from "react";
import { GLOSSARIO, type Termo } from "@/lib/glossario";

const MARGEM = 8; // distância mínima entre o balão e a borda da janela, em px

/**
 * Ícone "?" com a explicação do termo. Abre ao passar o mouse e também ao focar pelo teclado
 * (Tab) ou tocar no celular. O balão é `fixed` e posicionado na hora, para nunca sair da tela
 * (qualquer coluna, qualquer largura) e para não criar barra de rolagem quando está escondido.
 */
export function Ajuda({ termo }: { termo: Termo }) {
  const id = useId();
  const botao = useRef<HTMLButtonElement>(null);
  const balao = useRef<HTMLSpanElement>(null);
  const { titulo, texto } = GLOSSARIO[termo];

  function posicionar() {
    const b = botao.current;
    const t = balao.current;
    if (!b || !t) return;
    const r = b.getBoundingClientRect();
    const largura = t.offsetWidth;
    const altura = t.offsetHeight;
    const esquerda = Math.max(MARGEM, Math.min(r.left, window.innerWidth - largura - MARGEM));
    let topo = r.bottom + 6;
    // Sem espaço embaixo? Abre para cima, se couber.
    if (topo + altura > window.innerHeight - MARGEM && r.top - 6 - altura > MARGEM) {
      topo = r.top - 6 - altura;
    }
    t.style.left = `${esquerda}px`;
    t.style.top = `${topo}px`;
  }

  return (
    <span className="group inline-flex align-middle" onMouseEnter={posicionar} onFocus={posicionar}>
      <button
        ref={botao}
        type="button"
        aria-describedby={id}
        aria-label={`O que é ${titulo}?`}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-400 text-[10px] font-semibold leading-none text-zinc-600 hover:border-emerald-600 hover:text-emerald-700 focus:border-emerald-600 focus:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 dark:border-zinc-500 dark:text-zinc-400 dark:hover:text-emerald-400 dark:focus:text-emerald-400"
      >
        ?
      </button>
      <span
        ref={balao}
        role="tooltip"
        id={id}
        className="pointer-events-none invisible fixed left-0 top-0 z-30 w-64 max-w-[calc(100vw-1rem)] rounded-md border border-zinc-300 bg-white p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-zinc-800 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <strong className="mb-1 block text-zinc-900 dark:text-zinc-50">{titulo}</strong>
        {texto}
      </span>
    </span>
  );
}

/** Rótulo de campo com o "?" ao lado (o botão fica fora do <label> para não aninhar controles). */
export function Rotulo({
  htmlFor,
  termo,
  children,
}: {
  htmlFor: string;
  termo: Termo;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {children}
      </label>
      <Ajuda termo={termo} />
    </div>
  );
}

/** Texto solto (título, cabeçalho de tabela) seguido do "?". */
export function ComAjuda({ termo, children }: { termo: Termo; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <Ajuda termo={termo} />
    </span>
  );
}
