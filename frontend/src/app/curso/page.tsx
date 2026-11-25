import type { Metadata } from "next";
import Curso from "./curso";

export const metadata: Metadata = {
  title: "Mini curso: Reforma Tributária do Consumo",
  description:
    "Aprenda em poucas aulas o que muda com a CBS, o IBS e o Imposto Seletivo: calendário, créditos, alíquotas reduzidas e o que fazer agora.",
};

export default function PaginaDoCurso() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Mini curso gratuito</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Reforma Tributária do Consumo, sem complicação</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-zinc-700 dark:text-zinc-300">
          Sete aulas curtas para entender o que muda com a CBS, o IBS e o Imposto Seletivo, em que ritmo e como isso aparece no preço e na nota fiscal. Não
          precisa saber nada de tributação.
        </p>
      </header>
      <Curso />
    </main>
  );
}
