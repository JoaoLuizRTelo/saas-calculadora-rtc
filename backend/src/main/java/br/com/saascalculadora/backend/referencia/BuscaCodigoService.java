package br.com.saascalculadora.backend.referencia;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

import org.springframework.stereotype.Service;

import br.com.saascalculadora.backend.rtc.RtcClient;
import br.com.saascalculadora.backend.simulacao.SimulacaoRequest.TipoItem;
import tools.jackson.databind.JsonNode;

/**
 * Busca por palavras de NCM (produtos) e NBS (serviços), para quem não sabe o código de cabeça.
 *
 * A calculadora não tem busca por texto, então baixamos a lista oficial uma vez por data e
 * pesquisamos em memória. A lista de NCM só traz a "ponta" da descrição ("Outros", "Desossadas");
 * o nome do capítulo e da posição (4 primeiros dígitos) vem de uma consulta por posição, cerca de
 * 1.200 no total, feita só na primeira busca de cada data.
 */
@Service
public class BuscaCodigoService {

    static final int LIMITE = 20;
    private static final int TAMANHO_MINIMO = 3;
    private static final int MAX_DATAS_EM_CACHE = 6;

    private final RtcClient rtc;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final Map<String, CompletableFuture<List<Entrada>>> indices = new ConcurrentHashMap<>();

    public BuscaCodigoService(RtcClient rtc) {
        this.rtc = rtc;
    }

    public record Item(String codigo, String descricao) {
    }

    public record Resultado(List<Item> itens, int total) {
    }

    /** Uma linha do índice; os textos de busca já vêm sem acento e em minúsculas. */
    record Entrada(String codigo, String exibicao, String ponta, String posicao, String capitulo) {
    }

    public Resultado buscar(TipoItem tipo, String consulta, LocalDate data) {
        List<String> palavras = palavras(consulta);
        if (palavras.stream().mapToInt(String::length).sum() < TAMANHO_MINIMO) {
            return new Resultado(List.of(), 0);
        }

        record Pontuado(Entrada entrada, int pontos) {
        }
        List<Pontuado> achados = new ArrayList<>();
        for (Entrada e : indice(tipo, data)) {
            int pontos = 0;
            for (String p : palavras) {
                if (e.ponta().contains(p)) {
                    pontos += 3;
                } else if (e.posicao().contains(p)) {
                    pontos += 2;
                } else if (e.capitulo().contains(p)) {
                    pontos += 1;
                } else {
                    pontos = -1;
                    break;
                }
            }
            if (pontos > 0) {
                achados.add(new Pontuado(e, pontos));
            }
        }
        // Mais pontos primeiro; no empate, descrição mais curta (mais direta) e depois o código.
        achados.sort(Comparator.comparingInt(Pontuado::pontos).reversed()
                .thenComparingInt(p -> p.entrada().exibicao().length())
                .thenComparing(p -> p.entrada().codigo()));

        List<Item> itens = achados.stream().limit(LIMITE)
                .map(p -> new Item(p.entrada().codigo(), p.entrada().exibicao())).toList();
        return new Resultado(itens, achados.size());
    }

    private List<Entrada> indice(TipoItem tipo, LocalDate data) {
        String chave = tipo + "|" + data;
        if (indices.size() >= MAX_DATAS_EM_CACHE && !indices.containsKey(chave)) {
            indices.clear();
        }
        CompletableFuture<List<Entrada>> futuro = indices.computeIfAbsent(chave,
                k -> CompletableFuture.supplyAsync(
                        () -> tipo == TipoItem.PRODUTO ? indiceNcm(data) : indiceNbs(data), executor));
        try {
            return futuro.join();
        } catch (CompletionException e) {
            indices.remove(chave, futuro); // não guarda falha; a próxima busca tenta de novo
            if (e.getCause() instanceof RuntimeException causa) {
                throw causa;
            }
            throw e;
        }
    }

    private List<Entrada> indiceNbs(LocalDate data) {
        // A lista só traz a descrição da ponta ("Serviços de pré-escola"); o nome da posição
        // ("Serviços de educação infantil") e do capítulo vem de uma consulta por serviço.
        Semaphore simultaneas = new Semaphore(16);
        Map<String, String> pontas = new LinkedHashMap<>();
        Map<String, CompletableFuture<String[]>> contexto = new LinkedHashMap<>();
        for (JsonNode n : rtc.nbsLista(data)) {
            String codigo = n.path("codigo").asString("");
            if (!codigo.matches("\\d{9}")) { // só códigos completos são usáveis
                continue;
            }
            pontas.put(codigo, n.path("descricao").asString("").strip());
            contexto.put(codigo, CompletableFuture.supplyAsync(() -> {
                simultaneas.acquireUninterruptibly();
                try {
                    JsonNode info = rtc.infoNbs(codigo, data);
                    return info == null
                            ? new String[] { "", "" }
                            : new String[] { limparPonta(info.path("capitulo").asString("")), limparPonta(info.path("posicao").asString("")) };
                } finally {
                    simultaneas.release();
                }
            }, executor));
        }

        List<Entrada> entradas = new ArrayList<>();
        pontas.forEach((codigo, ponta) -> {
            String[] ctx = contexto.get(codigo).join();
            String exibicao = ctx[1].isBlank() || ctx[1].equals(ponta) ? ponta : ctx[1] + " › " + ponta;
            entradas.add(new Entrada(codigo, exibicao, normalizar(ponta), normalizar(ctx[1]), normalizar(ctx[0])));
        });
        return entradas;
    }

    private List<Entrada> indiceNcm(LocalDate data) {
        Map<String, String> pontas = new LinkedHashMap<>();
        for (JsonNode n : rtc.ncmVigentes(data)) {
            pontas.put(n.path("ncm").asString(""), limparPonta(n.path("descricao").asString("")));
        }

        // Capítulo e posição valem para todos os NCM que começam pelos mesmos 4 dígitos.
        Map<String, String> primeiroDaPosicao = new LinkedHashMap<>();
        pontas.keySet().forEach(ncm -> primeiroDaPosicao.putIfAbsent(ncm.substring(0, 4), ncm));
        Semaphore simultaneas = new Semaphore(16);
        Map<String, CompletableFuture<String[]>> contexto = new LinkedHashMap<>();
        primeiroDaPosicao.forEach((posicao, ncm) -> contexto.put(posicao, CompletableFuture.supplyAsync(() -> {
            simultaneas.acquireUninterruptibly();
            try {
                JsonNode info = rtc.infoNcm(ncm, data);
                return info == null
                        ? new String[] { "", "" }
                        : new String[] { limparPonta(info.path("capitulo").asString("")), limparPonta(info.path("posicao").asString("")) };
            } finally {
                simultaneas.release();
            }
        }, executor)));

        List<Entrada> entradas = new ArrayList<>();
        pontas.forEach((ncm, ponta) -> {
            String[] ctx = contexto.get(ncm.substring(0, 4)).join();
            String exibicao = ctx[1].isBlank() ? ponta : ctx[1] + " › " + ponta;
            entradas.add(new Entrada(ncm, exibicao, normalizar(ponta), normalizar(ctx[1]), normalizar(ctx[0])));
        });
        return entradas;
    }

    /** Tira tags HTML (a Receita manda "<i>pellets</i>") e os traços de nível ("-- Tilápias" vira "Tilápias"). */
    static String limparPonta(String bruta) {
        return bruta.replaceAll("<[^>]+>", "").replaceFirst("^[\\s-]+", "").replaceAll("\\s+", " ").strip();
    }

    /** Minúsculas, sem acento e só com letras e números separados por espaço. */
    static String normalizar(String texto) {
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return semAcento.toLowerCase().replaceAll("[^a-z0-9]+", " ").strip();
    }

    static List<String> palavras(String consulta) {
        if (consulta == null) {
            return List.of();
        }
        return Arrays.stream(normalizar(consulta).split(" ")).filter(p -> !p.isBlank()).distinct().toList();
    }
}
