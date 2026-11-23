package br.com.saascalculadora.backend.rtc;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração da calculadora oficial da Receita (rtc.api.*).
 * O baseUrl aponta para o prefixo /api/calculadora do serviço dela.
 */
@ConfigurationProperties(prefix = "rtc.api")
public record RtcProperties(String baseUrl) {
}
