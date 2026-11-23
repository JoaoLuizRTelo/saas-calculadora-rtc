"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buscarDescricaoCodigo,
  listarClassificacoesAplicaveis,
  type ClassificacaoAplicavel,
  type ClassificacaoInfo,
  type Compatibilidade,
} from "@/lib/api";
import { CAMPO, DATA_VALIDA, numero, tamanhoDoCodigo, type ItemForm } from "@/lib/item";
import { percentual } from "@/lib/texto";
import { ComAjuda, Rotulo } from "./ajuda";
import BuscaClassificacao from "./busca-classificacao";
import BuscaCodigo from "./busca-codigo";

type Props = {
  item: ItemForm;
  indice: number;
  data: string;
  /** Todas as classificações da data (vazio enquanto carrega). */
  classificacoes: ClassificacaoInfo[];
  podeRemover: boolean;
  onChange: (parcial: Partial<ItemForm>) => void;
  onRemover: () => void;
};

const GRUPOS: { chave: Compatibilidade; titulo: string }[] = [
  { chave: "ESPECIFICA", titulo: "Específicas para este código" },
  { chave: "GERAL", titulo: "Gerais (valem para qualquer código)" },
  { chave: "NAO_VERIFICADA", titulo: "Não verificadas" },
];

/** Campos de um item. Com o NCM/NBS completo, mostra só as classificações que se aplicam a ele. */
export default function ItemCampos({ item, indice, data, classificacoes, podeRemover, onChange, onRemover }: Props) {
  const tamanho = tamanhoDoCodigo(item.tipo);
  const codigoCompleto = item.codigo.length === tamanho && DATA_VALIDA.test(data);
  const chaveCodigo = `${item.tipo}|${item.codigo}|${data}`;

  // Cada resultado guarda a chave que o originou; chave diferente = dado velho, ignorado.
  const [aplic, setAplic] = useState<{ chave: string; lista: ClassificacaoAplicavel[] } | null>(null);
  const [desc, setDesc] = useState<{ chave: string; texto: string | null } | null>(null);
  const [falha, setFalha] = useState<{ chave: string; mensagem: string } | null>(null);

  // Refs para o callback assíncrono enxergar o valor atual sem refazer a busca a cada digitação.
  const classeAtual = useRef(item.cClassTrib);
  const ultimoCodigo = useRef(""); // tipo|código da última lista recebida
  const aoMudar = useRef(onChange);
  useEffect(() => {
    classeAtual.current = item.cClassTrib;
    aoMudar.current = onChange;
  });

  useEffect(() => {
    if (!codigoCompleto) return;
    let atual = true;
    const chave = `${item.tipo}|${item.codigo}|${data}`;
    buscarDescricaoCodigo(item.tipo, item.codigo, data)
      .then((r) => atual && setDesc({ chave, texto: r.descricao }))
      .catch(() => atual && setDesc({ chave, texto: null }));
    return () => {
      atual = false;
    };
  }, [codigoCompleto, item.tipo, item.codigo, data]);

  useEffect(() => {
    if (!codigoCompleto) return;
    let atual = true;
    const chave = `${item.tipo}|${item.codigo}|${data}`;
    listarClassificacoesAplicaveis(item.tipo, item.codigo, data)
      .then((lista) => {
        if (!atual) return;
        setAplic({ chave, lista });
        // Ajuste automático da escolha, para não deixar uma classificação do código anterior:
        // - fora da lista: usa a única específica (e o CST dela), ou limpa para o usuário escolher;
        // - código novo e a escolha não é específica dele: troca pela única específica, se houver.
        // Mudar só a data do mesmo código não derruba uma escolha geral feita à mão.
        const codigoMudou = ultimoCodigo.current !== `${item.tipo}|${item.codigo}`;
        ultimoCodigo.current = `${item.tipo}|${item.codigo}`;
        const especificas = lista.filter((c) => c.compatibilidade === "ESPECIFICA");
        const escolhida = lista.find((c) => c.codigo === classeAtual.current);
        if (!escolhida) {
          if (especificas.length === 1) aoMudar.current({ cst: especificas[0].cst, cClassTrib: especificas[0].codigo });
          else aoMudar.current({ cClassTrib: "" });
        } else if (codigoMudou && escolhida.compatibilidade !== "ESPECIFICA" && especificas.length === 1) {
          aoMudar.current({ cst: especificas[0].cst, cClassTrib: especificas[0].codigo });
        }
      })
      .catch((e: Error) => atual && setFalha({ chave, mensagem: e.message }));
    return () => {
      atual = false;
    };
  }, [codigoCompleto, item.tipo, item.codigo, data]);

  const lista = codigoCompleto && aplic?.chave === chaveCodigo ? aplic.lista : null;
  const erro = codigoCompleto && falha?.chave === chaveCodigo ? falha.mensagem : null;
  const carregando = codigoCompleto && !lista && !erro;
  const descricao = codigoCompleto && desc?.chave === chaveCodigo ? desc : null;

  // Produto não usa classificação feita só para NBS, e vice-versa.
  const visiveis = useMemo(
    () => classificacoes.filter((c) => (item.tipo === "PRODUTO" ? c.nomenclatura !== "NBS" : c.nomenclatura !== "NCM")),
    [classificacoes, item.tipo],
  );
  const compat = useMemo(() => (lista ? new Map(lista.map((a) => [a.codigo, a.compatibilidade])) : null), [lista]);
  const aceitas = useMemo(() => (compat ? visiveis.filter((c) => compat.has(c.codigo)) : visiveis), [visiveis, compat]);

  const csts = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const c of aceitas) if (!vistos.has(c.cst)) vistos.set(c.cst, c.cstDescricao);
    if (item.cst && !vistos.has(item.cst)) vistos.set(item.cst, classificacoes.find((c) => c.cst === item.cst)?.cstDescricao ?? "");
    return [...vistos.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [aceitas, classificacoes, item.cst]);

  const doCst = aceitas.filter((c) => c.cst === item.cst);
  const escolhida = classificacoes.find((c) => c.codigo === item.cClassTrib && c.cst === item.cst) ?? null;
  const temEspecifica = !!lista?.some((c) => c.compatibilidade === "ESPECIFICA");

  return (
    <fieldset className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <legend className="px-2 text-sm font-semibold">Item {indice + 1}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Rotulo htmlFor={`tipo-${item.id}`} termo="tipoItem">Tipo</Rotulo>
          <select
            id={`tipo-${item.id}`}
            value={item.tipo}
            onChange={(e) => onChange({ tipo: e.target.value as ItemForm["tipo"] })}
            className={CAMPO}
          >
            <option value="PRODUTO">Produto (NCM)</option>
            <option value="SERVICO">Serviço (NBS)</option>
          </select>
        </div>
        <div>
          <Rotulo htmlFor={`codigo-${item.id}`} termo={item.tipo === "PRODUTO" ? "ncm" : "nbs"}>
            {item.tipo === "PRODUTO" ? "NCM" : "NBS"}
          </Rotulo>
          <input
            id={`codigo-${item.id}`}
            inputMode="numeric"
            maxLength={tamanho}
            value={item.codigo}
            onChange={(e) => onChange({ codigo: e.target.value.replace(/\D/g, "") })}
            aria-describedby={`desc-${item.id}`}
            className={CAMPO}
          />
          <p id={`desc-${item.id}`} className="mt-1 min-h-4 text-xs text-zinc-600 dark:text-zinc-400">
            {!codigoCompleto && `${tamanho} dígitos`}
            {descricao?.texto}
            {descricao && !descricao.texto && (
              <span className="text-amber-700 dark:text-amber-400">Código não encontrado na tabela oficial desta data.</span>
            )}
          </p>
        </div>

        <div className="sm:col-span-2">
          <BuscaCodigo
            id={`busca-codigo-${item.id}`}
            tipo={item.tipo}
            data={data}
            onEscolher={(codigo) => onChange({ codigo })}
          />
        </div>

        <div>
          <Rotulo htmlFor={`cst-${item.id}`} termo="cst">CST</Rotulo>
          <select
            id={`cst-${item.id}`}
            value={item.cst}
            onChange={(e) => onChange({ cst: e.target.value, cClassTrib: "" })}
            className={CAMPO}
          >
            {csts.length === 0 && <option value={item.cst}>{item.cst}</option>}
            {csts.map(([codigo, descricaoCst]) => (
              <option key={codigo} value={codigo}>{codigo}{descricaoCst && ` — ${descricaoCst}`}</option>
            ))}
          </select>
        </div>
        <div>
          <Rotulo htmlFor={`cclass-${item.id}`} termo="cClassTrib">Classificação tributária (cClassTrib)</Rotulo>
          <select
            id={`cclass-${item.id}`}
            value={item.cClassTrib}
            onChange={(e) => onChange({ cClassTrib: e.target.value })}
            aria-describedby={`dica-${item.id}`}
            className={CAMPO}
          >
            {carregando && <option value={item.cClassTrib}>{item.cClassTrib ? `${item.cClassTrib} — carregando…` : "Carregando…"}</option>}
            {!carregando && !item.cClassTrib && <option value="">Selecione…</option>}
            {!carregando && !doCst.some((c) => c.codigo === item.cClassTrib) && item.cClassTrib && (
              <option value={item.cClassTrib}>{item.cClassTrib}</option>
            )}
            {!carregando && lista
              ? GRUPOS.map((g) => {
                  const itens = doCst.filter((c) => compat?.get(c.codigo) === g.chave);
                  return (
                    itens.length > 0 && (
                      <optgroup key={g.chave} label={g.titulo}>
                        {itens.map((c) => (
                          <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>
                        ))}
                      </optgroup>
                    )
                  );
                })
              : !carregando &&
                doCst.map((c) => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>)}
          </select>
          <div id={`dica-${item.id}`} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {erro && <span className="text-red-700 dark:text-red-400">{erro}</span>}
            {!erro && !codigoCompleto && <>Digite o {item.tipo === "PRODUTO" ? "NCM" : "NBS"} completo para mostrar só as classificações que se aplicam a ele.</>}
            {!erro && lista && !temEspecifica && (
              <span className="text-amber-700 dark:text-amber-400">
                Nenhuma classificação é específica para este código; as &quot;gerais&quot; valem para qualquer código.
              </span>
            )}
            {!erro && lista && (
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <ComAjuda termo="compatEspecifica">Específicas</ComAjuda>
                <ComAjuda termo="compatGeral">Gerais</ComAjuda>
                <ComAjuda termo="compatNaoVerificada">Não verificadas</ComAjuda>
              </span>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <BuscaClassificacao
            id={`busca-classe-${item.id}`}
            opcoes={visiveis}
            compat={compat}
            onEscolher={(c) => onChange({ cst: c.cst, cClassTrib: c.codigo })}
          />
        </div>

        {escolhida && (
          <div className="sm:col-span-2">
            <EfeitoClassificacao classe={escolhida} item={item} />
          </div>
        )}

        <div className="sm:col-span-2">
          <Rotulo htmlFor={`base-${item.id}`} termo="baseCalculo">Valor / base de cálculo (R$)</Rotulo>
          <input
            id={`base-${item.id}`}
            inputMode="decimal"
            value={item.baseCalculo}
            onChange={(e) => onChange({ baseCalculo: e.target.value })}
            className={CAMPO}
          />
        </div>
      </div>

      <p className="mb-2 mt-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <ComAjuda termo="aliquotas">Alíquotas nominais (%)</ComAjuda>
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["cbs", "CBS"],
            ["ibsEstadual", "IBS estadual"],
            ["ibsMunicipal", "IBS municipal"],
          ] as const
        ).map(([chave, nome]) => (
          <div key={chave}>
            <Rotulo htmlFor={`${chave}-${item.id}`} termo={chave}>{nome}</Rotulo>
            <input
              id={`${chave}-${item.id}`}
              inputMode="decimal"
              value={item[chave]}
              onChange={(e) => onChange({ [chave]: e.target.value })}
              className={CAMPO}
            />
          </div>
        ))}
      </div>

      {podeRemover && (
        <button type="button" onClick={onRemover} className="mt-4 text-sm text-red-700 underline dark:text-red-400">
          Remover item
        </button>
      )}
    </fieldset>
  );
}

/**
 * Mostra o que a classificação escolhida faz: o tratamento em texto e, quando a regra é a
 * padrão, a alíquota que sobra depois da redução (cheia × (1 − redução)).
 */
function EfeitoClassificacao({ classe, item }: { classe: ClassificacaoInfo; item: ItemForm }) {
  const linhas = [
    { nome: "CBS", cheia: numero(item.cbs), reducao: classe.reducaoCbs },
    { nome: "IBS estadual", cheia: numero(item.ibsEstadual), reducao: classe.reducaoIbsEstadual },
    { nome: "IBS municipal", cheia: numero(item.ibsMunicipal), reducao: classe.reducaoIbsMunicipal },
  ];
  const regraPadrao = classe.tipoAliquota === "Padrão";

  return (
    <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-zinc-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-zinc-200">
      <p className="font-semibold">
        <ComAjuda termo="efeitoClassificacao">Efeito desta classificação</ComAjuda>: {classe.tratamento || "sem tratamento informado"}
      </p>
      {regraPadrao ? (
        <table className="mt-2 w-full tabular-nums">
          <thead>
            <tr className="text-left text-zinc-600 dark:text-zinc-400">
              <th scope="col" className="py-0.5 font-normal">Tributo</th>
              <th scope="col" className="py-0.5 text-right font-normal">Alíquota cheia</th>
              <th scope="col" className="py-0.5 text-right font-normal">Redução</th>
              <th scope="col" className="py-0.5 text-right font-normal">
                <ComAjuda termo="aliquotaEfetiva">Fica em</ComAjuda>
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const ok = Number.isFinite(l.cheia) && l.reducao !== null;
              return (
                <tr key={l.nome}>
                  <th scope="row" className="py-0.5 text-left font-normal">{l.nome}</th>
                  <td className="text-right">{Number.isFinite(l.cheia) ? percentual(l.cheia) : "—"}</td>
                  <td className="text-right">{l.reducao === null ? "—" : percentual(l.reducao)}</td>
                  <td className="text-right font-semibold">{ok ? percentual(l.cheia * (1 - (l.reducao as number) / 100)) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="mt-1">
          Esta classificação tem regra própria de alíquota ({classe.tipoAliquota || "não informada"}); o valor final é
          definido pela calculadora.
        </p>
      )}
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        As alíquotas nominais não mudam quando você troca a classificação: ela aplica a redução por cima delas.
      </p>
    </div>
  );
}
