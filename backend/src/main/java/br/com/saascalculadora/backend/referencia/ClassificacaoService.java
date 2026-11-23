package br.com.saascalculadora.backend.referencia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Service;

import br.com.saascalculadora.backend.referencia.ClassificacaoAplicavel.Compatibilidade;
import br.com.saascalculadora.backend.rtc.RtcClient;
import br.com.saascalculadora.backend.simulacao.SimulacaoRequest.TipoItem;
import tools.jackson.databind.JsonNode;

/**
 * Tudo sobre classificações tributárias (cClassTrib): a lista completa com o efeito de cada uma
 * e quais delas fazem sentido para um NCM/NBS.
 *
 * Sobre "fazem sentido": a calculadora só sabe responder "essa classificação vale para esse código?"
 * (uma por vez), e responde "sim" também para classificações que não restringem código algum. Para
 * separar as específicas das gerais repetimos a pergunta com um código que não existe (controle):
 * quem ainda diz "sim" para ele não depende de NCM/NBS.
 */
@Service
public class ClassificacaoService {

    private static final String NCM_CONTROLE = "99999999";
    private static final String NBS_CONTROLE = "999999999";

    private final RtcClient rtc;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public ClassificacaoService(RtcClient rtc) {
        this.rtc = rtc;
    }

    /** Todas as classificações da data, agrupadas por CST, com tratamento e percentuais de redução. */
    public List<ClassificacaoInfo> todas(LocalDate data) {
        Map<String, JsonNode> detalhes = new HashMap<>();
        for (JsonNode d : rtc.classificacoesCbsIbs(data)) {
            detalhes.put(d.path("codigo").asString(), d);
        }
        List<ClassificacaoInfo> todas = new ArrayList<>();
        for (JsonNode situacao : rtc.situacoesTributarias(data)) {
            String cst = situacao.path("codigo").asString();
            String cstDescricao = situacao.path("descricao").asString("");
            for (JsonNode c : situacao.path("classificacoesTributarias")) {
                String codigo = c.path("codigo").asString();
                JsonNode d = detalhes.getOrDefault(codigo, c);
                todas.add(new ClassificacaoInfo(
                        cst, cstDescricao, codigo, c.path("descricao").asString(""),
                        d.path("descricaoTratamentoTributario").asString(""),
                        percentual(d.path("percentualReducaoCbs")),
                        percentual(d.path("percentualReducaoIbsUf")),
                        percentual(d.path("percentualReducaoIbsMun")),
                        d.path("nomenclatura").asString(""),
                        d.path("tipoAliquota").asString("")));
            }
        }
        return todas;
    }

    /** Classificações (de todos os CST) que se aplicam ao NCM (produto) ou NBS (serviço) informado. */
    public List<ClassificacaoAplicavel> aplicaveis(TipoItem tipo, String codigo, LocalDate data) {
        validarCodigo(tipo, codigo);

        List<CompletableFuture<Optional<ClassificacaoAplicavel>>> futuros = new ArrayList<>();
        for (JsonNode situacao : rtc.situacoesTributarias(data)) {
            String cst = situacao.path("codigo").asString();
            for (JsonNode classe : situacao.path("classificacoesTributarias")) {
                String cClass = classe.path("codigo").asString();
                futuros.add(CompletableFuture.supplyAsync(() -> avaliar(tipo, codigo, data, cst, cClass), executor));
            }
        }

        return futuros.stream()
                .map(CompletableFuture::join)
                .flatMap(Optional::stream)
                .sorted(Comparator.comparing(ClassificacaoAplicavel::compatibilidade)
                        .thenComparing(ClassificacaoAplicavel::codigo))
                .toList();
    }

    /** Caminho da hierarquia oficial do código (ex.: "Carnes… › Carnes bovinas… › Desossadas"), ou null. */
    public String descricao(TipoItem tipo, String codigo, LocalDate data) {
        validarCodigo(tipo, codigo);
        JsonNode info = tipo == TipoItem.PRODUTO ? rtc.infoNcm(codigo, data) : rtc.infoNbs(codigo, data);
        if (info == null) {
            return null;
        }
        List<String> partes = new ArrayList<>();
        for (String campo : tipo == TipoItem.PRODUTO
                ? List.of("capitulo", "posicao", "subitem")
                : List.of("capitulo", "posicao", "item")) {
            String v = info.path(campo).asString("");
            if (!v.isBlank()) {
                partes.add(v.strip());
            }
        }
        return partes.isEmpty() ? null : String.join(" › ", partes);
    }

    private Optional<ClassificacaoAplicavel> avaliar(TipoItem tipo, String codigo, LocalDate data, String cst, String cClass) {
        Optional<Boolean> vale = validar(tipo, cClass, codigo, data);
        if (vale.isEmpty()) {
            return Optional.of(new ClassificacaoAplicavel(cst, cClass, Compatibilidade.NAO_VERIFICADA));
        }
        if (!vale.get()) {
            return Optional.empty();
        }
        Optional<Boolean> valeParaControle = validar(tipo, cClass, tipo == TipoItem.PRODUTO ? NCM_CONTROLE : NBS_CONTROLE, data);
        Compatibilidade comp = valeParaControle.equals(Optional.of(false)) ? Compatibilidade.ESPECIFICA : Compatibilidade.GERAL;
        return Optional.of(new ClassificacaoAplicavel(cst, cClass, comp));
    }

    private Optional<Boolean> validar(TipoItem tipo, String cClassTrib, String codigo, LocalDate data) {
        return tipo == TipoItem.PRODUTO
                ? rtc.classificacaoAplicavelAoNcm(cClassTrib, codigo, data)
                : rtc.classificacaoAplicavelAoNbs(cClassTrib, codigo, data);
    }

    private static BigDecimal percentual(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) {
            return null;
        }
        String s = n.asString("");
        return s.isBlank() ? null : new BigDecimal(s);
    }

    private static void validarCodigo(TipoItem tipo, String codigo) {
        int tamanho = tipo == TipoItem.PRODUTO ? 8 : 9;
        if (codigo == null || !codigo.matches("\\d{" + tamanho + "}")) {
            throw new CodigoInvalidoException(
                    (tipo == TipoItem.PRODUTO ? "O NCM" : "A NBS") + " deve ter exatamente " + tamanho + " dígitos.");
        }
    }
}
