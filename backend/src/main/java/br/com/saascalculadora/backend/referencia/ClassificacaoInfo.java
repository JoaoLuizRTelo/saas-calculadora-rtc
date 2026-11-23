package br.com.saascalculadora.backend.referencia;

import java.math.BigDecimal;

/**
 * Uma classificação tributária (cClassTrib) com o que a tela precisa para explicá-la:
 * o CST a que pertence, o tratamento em texto e os percentuais de redução da alíquota.
 * Reduções são em % (60 = a alíquota cai 60%); null quando a calculadora não informa.
 */
public record ClassificacaoInfo(
        String cst,
        String cstDescricao,
        String codigo,
        String descricao,
        String tratamento,
        BigDecimal reducaoCbs,
        BigDecimal reducaoIbsEstadual,
        BigDecimal reducaoIbsMunicipal,
        /** "NBS", "NCM", "NBS ou NCM" ou "Não possui": a que tipo de código a classificação se refere. */
        String nomenclatura,
        String tipoAliquota) {
}
