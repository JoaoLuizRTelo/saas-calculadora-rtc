import { GLOSSARIO, type Termo } from "@/lib/glossario";
import { ComAjuda } from "../ajuda";

// Pedaços reconhecidos: **negrito**, [[termo|rótulo]] e [rótulo](https://link)
const PADRAO = /(\*\*[^*]+\*\*|\[\[[^\]|]+\|[^\]]+\]\]|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

/** Renderiza um texto do curso com a marcação acima. O termo do glossário vira um rótulo com balão "?". */
export default function Texto({ x }: { x: string }) {
  return (
    <>
      {x.split(PADRAO).map((parte, i) => {
        if (parte.startsWith("**")) {
          return <strong key={i}>{parte.slice(2, -2)}</strong>;
        }
        if (parte.startsWith("[[")) {
          const [chave, rotulo] = parte.slice(2, -2).split("|");
          return chave in GLOSSARIO ? (
            <ComAjuda key={i} termo={chave as Termo}>
              {rotulo}
            </ComAjuda>
          ) : (
            rotulo
          );
        }
        const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(parte);
        if (link) {
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline decoration-emerald-600 underline-offset-2">
              {link[1]}
            </a>
          );
        }
        return parte;
      })}
    </>
  );
}
