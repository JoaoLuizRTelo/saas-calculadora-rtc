import { Ajuda } from "./ajuda";
import Simulador from "./simulador";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Simulador de CBS e IBS</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Reforma Tributária do Consumo <Ajuda termo="reforma" /> (LC 214/2025 <Ajuda termo="lc214" />). Os valores são
          calculados pela API oficial da calculadora da Receita Federal; este é um projeto independente e o resultado é
          uma simulação <Ajuda termo="simulacao" />.
        </p>
      </header>
      <Simulador />
    </main>
  );
}
