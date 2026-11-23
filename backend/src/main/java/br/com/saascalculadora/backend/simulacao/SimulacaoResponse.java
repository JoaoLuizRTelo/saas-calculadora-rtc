package br.com.saascalculadora.backend.simulacao;

import java.math.BigDecimal;
import java.util.List;

public record SimulacaoResponse(List<ItemResultado> itens, Totais totais) {

    public record ItemResultado(
            int numero,
            BigDecimal baseCalculo,
            BigDecimal cbs,
            BigDecimal ibsEstadual,
            BigDecimal ibsMunicipal,
            BigDecimal ibs,
            BigDecimal total,
            /** Redução de alíquota aplicada, em %, ou null quando não houve. */
            BigDecimal reducaoAliquota,
            String memoriaCbs,
            String memoriaIbs) {
    }

    public record Totais(BigDecimal baseCalculo, BigDecimal cbs, BigDecimal ibs, BigDecimal total) {
    }
}
