package br.com.saascalculadora.backend.simulacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Entrada simplificada do SaaS; o serviço monta o formato da calculadora oficial. */
public record SimulacaoRequest(
        @NotBlank @Size(min = 2, max = 2) String uf,
        @NotNull Integer municipio,
        @NotNull LocalDate dataFatoGerador,
        @NotEmpty @Size(max = 50) List<@Valid Item> itens) {

    public enum TipoItem { PRODUTO, SERVICO }

    public record Item(
            @NotNull TipoItem tipo,
            @NotBlank String codigo,
            @NotBlank String cst,
            @NotBlank String cClassTrib,
            @NotNull @Positive BigDecimal baseCalculo,
            @NotNull @Valid Aliquotas aliquotas) {
    }

    /** Alíquotas nominais em percentual (ex.: 8.8 = 8,8%). */
    public record Aliquotas(
            @NotNull @PositiveOrZero BigDecimal cbs,
            @NotNull @PositiveOrZero BigDecimal ibsEstadual,
            @NotNull @PositiveOrZero BigDecimal ibsMunicipal) {
    }
}
