// Progresso do mini curso, guardado no navegador de quem estuda (localStorage).
// Não vai para o servidor e não identifica ninguém. Se o navegador bloquear o armazenamento,
// o progresso vale só até recarregar a página.

import { useCallback, useMemo, useSyncExternalStore } from "react";

const CHAVE = "rtc-curso-v1";
const EVENTO = "rtc-curso-mudou"; // avisa as outras partes da mesma página (o evento "storage" só chega a outras abas)

export type Progresso = {
  /** ids das aulas marcadas como concluídas */
  concluidas: string[];
  /** id da pergunta -> índice da opção escolhida */
  respostas: Record<string, number>;
};

const VAZIO: Progresso = { concluidas: [], respostas: {} };
let memoria = ""; // reserva quando o localStorage não está disponível

function ler(): string {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v !== null) return v;
  } catch {
    // storage bloqueado: usa a memória
  }
  return memoria;
}

function interpretar(bruto: string): Progresso {
  try {
    const p = JSON.parse(bruto);
    return {
      concluidas: Array.isArray(p?.concluidas) ? p.concluidas.filter((x: unknown) => typeof x === "string") : [],
      respostas: p && typeof p.respostas === "object" && p.respostas !== null ? p.respostas : {},
    };
  } catch {
    return VAZIO;
  }
}

function gravar(p: Progresso) {
  const texto = JSON.stringify(p);
  memoria = texto;
  try {
    localStorage.setItem(CHAVE, texto);
  } catch {
    // sem storage: segue só em memória
  }
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

export function useProgresso() {
  // No servidor (e na primeira pintura) o progresso é vazio; depois o navegador atualiza sem erro de hidratação.
  const bruto = useSyncExternalStore(assinar, ler, () => "");
  const progresso = useMemo(() => interpretar(bruto), [bruto]);

  const alternarAula = useCallback((id: string) => {
    const atual = interpretar(ler());
    const feita = atual.concluidas.includes(id);
    gravar({ ...atual, concluidas: feita ? atual.concluidas.filter((x) => x !== id) : [...atual.concluidas, id] });
  }, []);

  const responder = useCallback((idPergunta: string, opcao: number) => {
    const atual = interpretar(ler());
    gravar({ ...atual, respostas: { ...atual.respostas, [idPergunta]: opcao } });
  }, []);

  const refazer = useCallback((idPergunta: string) => {
    const atual = interpretar(ler());
    const respostas = { ...atual.respostas };
    delete respostas[idPergunta];
    gravar({ ...atual, respostas });
  }, []);

  const limpar = useCallback(() => gravar(VAZIO), []);

  return { ...progresso, alternarAula, responder, refazer, limpar };
}
