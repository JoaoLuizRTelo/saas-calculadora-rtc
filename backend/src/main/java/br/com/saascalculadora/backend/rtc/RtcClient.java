package br.com.saascalculadora.backend.rtc;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;

/**
 * Cliente HTTP da calculadora oficial da Receita Federal.
 * Devolve o JSON como veio; quem monta a resposta do SaaS é o serviço.
 */
@Component
public class RtcClient {

    private final RestClient http;

    public RtcClient(RestClient rtcRestClient) {
        this.http = rtcRestClient;
    }

    /** POST /regime-geral: calcula CBS/IBS de uma operação inteira (falha no primeiro erro). */
    public JsonNode calcularRegimeGeral(JsonNode operacao) {
        return http.post()
                .uri("/regime-geral")
                .body(operacao)
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode ufs() {
        return http.get().uri("/dados-abertos/ufs").retrieve().body(JsonNode.class);
    }

    public JsonNode municipios(String siglaUf) {
        return http.get()
                .uri(u -> u.path("/dados-abertos/ufs/municipios").queryParam("siglaUf", siglaUf).build())
                .retrieve()
                .body(JsonNode.class);
    }

    /**
     * Pergunta à calculadora se a classificação vale para o NCM naquela data.
     * Vazio = a calculadora não conhece essa classificação (404), então não dá para verificar.
     */
    public Optional<Boolean> classificacaoAplicavelAoNcm(String cClassTrib, String ncm, LocalDate data) {
        return validar("/dados-abertos/classificacoes-tributarias/ncm-aplicavel", "ncm", cClassTrib, ncm, data);
    }

    /** Idem, para serviços (NBS). */
    public Optional<Boolean> classificacaoAplicavelAoNbs(String cClassTrib, String nbs, LocalDate data) {
        return validar("/dados-abertos/classificacoes-tributarias/nbs-aplicavel", "nbs", cClassTrib, nbs, data);
    }

    private Optional<Boolean> validar(String caminho, String parametro, String cClassTrib, String codigo, LocalDate data) {
        try {
            JsonNode r = http.get()
                    .uri(u -> u.path(caminho)
                            .queryParam("cClassTrib", cClassTrib)
                            .queryParam(parametro, codigo)
                            .queryParam("dataOcorrenciaFatoGerador", data)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
            return Optional.of(r.path("valido").asBoolean(false));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        }
    }

    /** Hierarquia do NCM (capítulo, posição, subitem); null quando o código não existe. */
    public JsonNode infoNcm(String ncm, LocalDate data) {
        return buscarOuNulo("/dados-abertos/ncm", "ncm", ncm, data);
    }

    /** Hierarquia da NBS (capítulo, posição, item); null quando o código não existe. */
    public JsonNode infoNbs(String nbs, LocalDate data) {
        return buscarOuNulo("/dados-abertos/nbs", "nbs", nbs, data);
    }

    private JsonNode buscarOuNulo(String caminho, String parametro, String codigo, LocalDate data) {
        try {
            return http.get()
                    .uri(u -> u.path(caminho).queryParam(parametro, codigo).queryParam("data", data).build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    /** Todos os NCM de 8 dígitos vigentes na data: [{ncm, descricao}] (descrição só da "ponta"). */
    public JsonNode ncmVigentes(LocalDate data) {
        return http.get()
                .uri(u -> u.path("/dados-abertos/ncm/vigentes").queryParam("data", data).build())
                .retrieve()
                .body(JsonNode.class);
    }

    /** Todas as NBS da data, em todos os níveis hierárquicos: [{codigo, descricao}]. */
    public JsonNode nbsLista(LocalDate data) {
        return http.get()
                .uri(u -> u.path("/dados-abertos/nbs/lista").queryParam("data", data).build())
                .retrieve()
                .body(JsonNode.class);
    }

    /** Detalhes de todas as classificações: tratamento, percentuais de redução, nomenclatura etc. */
    public JsonNode classificacoesCbsIbs(LocalDate data) {
        return http.get()
                .uri(u -> u.path("/dados-abertos/classificacoes-tributarias/cbs-ibs").queryParam("data", data).build())
                .retrieve()
                .body(JsonNode.class);
    }

    /** CST e suas classificações tributárias (cClassTrib) vigentes na data. */
    public JsonNode situacoesTributarias(LocalDate data) {
        return http.get()
                .uri(u -> u.path("/dados-abertos/situacoes-tributarias/cbs-ibs")
                        .queryParam("data", data).build())
                .retrieve()
                .body(JsonNode.class);
    }
}
