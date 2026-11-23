"use client";

import { useEffect, useState } from "react";
import {
  listarClassificacoes,
  listarMunicipios,
  listarUfs,
  simular,
  type ClassificacaoInfo,
  type Municipio,
  type SimulacaoResponse,
  type Uf,
} from "@/lib/api";
import { CAMPO, DATA_VALIDA, moeda, novoItem, numero, type ItemForm } from "@/lib/item";
import { ComAjuda, Rotulo } from "./ajuda";
import Instrucoes, { type Exemplo } from "./instrucoes";
import ItemCampos from "./item-campos";

/** Rola até o elemento uma vez; respeita quem pediu menos animação. */
function rolarPara(id: string) {
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

export default function Simulador() {
  const [data, setData] = useState("2027-03-10");
  const [uf, setUf] = useState("RS");
  const [municipio, setMunicipio] = useState("4314902");
  const [itens, setItens] = useState<ItemForm[]>([novoItem(1)]);
  const [proximoId, setProximoId] = useState(2);

  const [ufs, setUfs] = useState<Uf[]>([]);
  // Listas guardam a chave que as originou; assim, trocar UF/data não mostra dados velhos.
  const [munic, setMunic] = useState<{ uf: string; lista: Municipio[] } | null>(null);
  const [classes, setClasses] = useState<{ data: string; lista: ClassificacaoInfo[] } | null>(null);

  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<SimulacaoResponse | null>(null);
  // Sobe a cada cálculo concluído; o efeito abaixo rola até o resultado uma única vez por pedido.
  const [pedidoRolagem, setPedidoRolagem] = useState(0);

  const municipios = munic?.uf === uf ? munic.lista : [];
  const classificacoes = classes?.data === data ? classes.lista : [];

  useEffect(() => {
    listarUfs()
      .then(setUfs)
      .catch((e: Error) => setErro(e.message));
  }, []);

  useEffect(() => {
    let atual = true;
    listarMunicipios(uf)
      .then((lista) => {
        if (!atual) return;
        setMunic({ uf, lista });
        setMunicipio((m) => (lista.some((x) => String(x.codigo) === m) ? m : String(lista[0]?.codigo ?? "")));
      })
      .catch((e: Error) => atual && setErro(e.message));
    return () => {
      atual = false;
    };
  }, [uf]);

  useEffect(() => {
    if (!DATA_VALIDA.test(data)) return;
    let atual = true;
    listarClassificacoes(data)
      .then((lista) => atual && setClasses({ data, lista }))
      .catch((e: Error) => atual && setErro(e.message));
    return () => {
      atual = false;
    };
  }, [data]);

  useEffect(() => {
    if (pedidoRolagem > 0) rolarPara("resultado");
  }, [pedidoRolagem]);

  const atualizar = (id: number, parcial: Partial<ItemForm>) =>
    setItens((lista) => lista.map((i) => (i.id === id ? { ...i, ...parcial } : i)));

  function usarExemplo(e: Exemplo) {
    setItens([{ ...e.item, id: proximoId }]);
    setProximoId((n) => n + 1);
    setResultado(null);
    setErro(null);
    rolarPara("formulario");
  }

  async function calcular(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setResultado(null);
    for (const [idx, i] of itens.entries()) {
      const n = idx + 1;
      const problema =
        (!i.codigo.trim() && `Item ${n}: informe o código NCM/NBS ou use a pesquisa pelo nome.`) ||
        ((!i.cst || !i.cClassTrib) && `Item ${n}: escolha a classificação tributária.`) ||
        (!(numero(i.baseCalculo) > 0) && `Item ${n}: o valor deve ser maior que zero.`) ||
        ([i.cbs, i.ibsEstadual, i.ibsMunicipal].some((a) => !(numero(a) >= 0)) && `Item ${n}: confira as alíquotas.`);
      if (problema) {
        setErro(problema);
        setPedidoRolagem((n) => n + 1);
        return;
      }
    }
    setCalculando(true);
    try {
      setResultado(
        await simular({
          uf,
          municipio: Number(municipio),
          dataFatoGerador: data,
          itens: itens.map((i) => ({
            tipo: i.tipo,
            codigo: i.codigo.trim(),
            cst: i.cst,
            cClassTrib: i.cClassTrib,
            baseCalculo: numero(i.baseCalculo),
            aliquotas: {
              cbs: numero(i.cbs),
              ibsEstadual: numero(i.ibsEstadual),
              ibsMunicipal: numero(i.ibsMunicipal),
            },
          })),
        }),
      );
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCalculando(false);
      setPedidoRolagem((n) => n + 1);
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <form id="formulario" onSubmit={calcular} className="order-2 scroll-mt-6 space-y-6 lg:order-1">
          <fieldset className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <legend className="px-2 text-sm font-semibold">Operação</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Rotulo htmlFor="data" termo="dataFatoGerador">Data do fato gerador</Rotulo>
                <input id="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} className={CAMPO} />
              </div>
              <div>
                <Rotulo htmlFor="uf" termo="uf">UF</Rotulo>
                <select id="uf" value={uf} onChange={(e) => { setUf(e.target.value); setMunicipio(""); }} className={CAMPO}>
                  {ufs.length === 0 && <option value={uf}>{uf}</option>}
                  {ufs.map((u) => (
                    <option key={u.sigla} value={u.sigla}>{u.sigla} — {u.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Rotulo htmlFor="municipio" termo="municipio">Município</Rotulo>
                <select id="municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={CAMPO}>
                  {municipios.length === 0 && <option value={municipio}>Carregando…</option>}
                  {municipios.map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {itens.map((item, idx) => (
            <ItemCampos
              key={item.id}
              item={item}
              indice={idx}
              data={data}
              classificacoes={classificacoes}
              podeRemover={itens.length > 1}
              onChange={(parcial) => atualizar(item.id, parcial)}
              onRemover={() => setItens((l) => l.filter((i) => i.id !== item.id))}
            />
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { setItens((l) => [...l, novoItem(proximoId)]); setProximoId((n) => n + 1); }} disabled={itens.length >= 50} className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
              + Adicionar item
            </button>
            <button type="submit" disabled={calculando} className="rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {calculando ? "Calculando…" : "Calcular"}
            </button>
          </div>
        </form>

        <div className="order-1 lg:order-2">
          <Instrucoes onExemplo={usarExemplo} />
        </div>
      </div>

      <section id="resultado" aria-live="polite" className="scroll-mt-6 space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            <ComAjuda termo="resultado">Resultado</ComAjuda>
          </h2>
          {(resultado || erro) && (
            <button type="button" onClick={() => rolarPara("formulario")} className="text-sm text-emerald-800 underline dark:text-emerald-400">
              ↑ Voltar ao formulário
            </button>
          )}
        </div>
        {erro && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {erro}
          </div>
        )}
        {!erro && !resultado && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Preencha o formulário e clique em <strong>Calcular</strong>. O resultado aparece aqui, e a página desce até ele
            sozinha. O cálculo é feito pela API oficial da Receita Federal.
          </p>
        )}
        {resultado && (
          <>
            <dl className="grid max-w-2xl grid-cols-3 gap-3">
              {(
                [
                  ["CBS", "cbs", resultado.totais.cbs],
                  ["IBS", "ibs", resultado.totais.ibs],
                  ["Total", "total", resultado.totais.total],
                ] as const
              ).map(([nome, termo, valor]) => (
                <div key={nome} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <dt className="text-xs text-zinc-600 dark:text-zinc-400">
                    <ComAjuda termo={termo}>{nome}</ComAjuda>
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">{moeda(valor)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <ComAjuda termo="baseCalculo">Base de cálculo total: {moeda(resultado.totais.baseCalculo)}</ComAjuda>
            </p>
            <ul className="grid gap-3 md:grid-cols-2">
              {resultado.itens.map((r) => (
                <li key={r.numero} className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
                  <p className="font-semibold">Item {r.numero}</p>
                  <table className="mt-2 w-full tabular-nums">
                    <tbody>
                      <tr><th scope="row" className="py-0.5 text-left font-normal"><ComAjuda termo="baseCalculo">Base</ComAjuda></th><td className="text-right">{moeda(r.baseCalculo)}</td></tr>
                      <tr><th scope="row" className="py-0.5 text-left font-normal"><ComAjuda termo="cbs">CBS</ComAjuda></th><td className="text-right">{moeda(r.cbs)}</td></tr>
                      <tr><th scope="row" className="py-0.5 text-left font-normal"><ComAjuda termo="ibsEstadual">IBS estadual</ComAjuda></th><td className="text-right">{moeda(r.ibsEstadual)}</td></tr>
                      <tr><th scope="row" className="py-0.5 text-left font-normal"><ComAjuda termo="ibsMunicipal">IBS municipal</ComAjuda></th><td className="text-right">{moeda(r.ibsMunicipal)}</td></tr>
                      <tr className="border-t border-zinc-200 font-semibold dark:border-zinc-800"><th scope="row" className="py-1 text-left"><ComAjuda termo="total">Total</ComAjuda></th><td className="text-right">{moeda(r.total)}</td></tr>
                    </tbody>
                  </table>
                  {r.reducaoAliquota !== null && (
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <ComAjuda termo="reducaoAliquota">Redução de alíquota aplicada: {r.reducaoAliquota.toLocaleString("pt-BR")}%</ComAjuda>
                    </p>
                  )}
                  {(r.memoriaCbs || r.memoriaIbs) && (
                    <details className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
                      <summary className="cursor-pointer">Memória de cálculo</summary>
                      <p className="mt-2"><ComAjuda termo="memoriaCalculo">O que é isto?</ComAjuda></p>
                      {r.memoriaCbs && <p className="mt-2"><strong>CBS:</strong> {r.memoriaCbs}</p>}
                      {r.memoriaIbs && <p className="mt-2"><strong>IBS:</strong> {r.memoriaIbs}</p>}
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
