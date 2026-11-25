"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", rotulo: "Simulador" },
  { href: "/curso", rotulo: "Mini curso" },
];

/** Barra de navegação entre as páginas do site. */
export default function Nav() {
  const caminho = usePathname();
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav aria-label="Principal" className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <span className="font-semibold tracking-tight">Sistema RTC</span>
        {ITENS.map((item) => {
          const ativo = item.href === "/" ? caminho === "/" : caminho.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`border-b-2 py-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 ${
                ativo
                  ? "border-emerald-600 text-emerald-800 dark:text-emerald-400"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
