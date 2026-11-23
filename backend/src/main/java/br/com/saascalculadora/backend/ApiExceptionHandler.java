package br.com.saascalculadora.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import br.com.saascalculadora.backend.referencia.CodigoInvalidoException;
import jakarta.validation.ConstraintViolationException;
import tools.jackson.databind.json.JsonMapper;

/** Traduz falhas da calculadora oficial em respostas que a tela consegue mostrar. */
@RestControllerAdvice
public class ApiExceptionHandler {

    private final JsonMapper mapper;

    public ApiExceptionHandler(JsonMapper mapper) {
        this.mapper = mapper;
    }

    @ExceptionHandler(RestClientResponseException.class)
    ProblemDetail calculadoraRespondeuErro(RestClientResponseException e) {
        // 4xx da calculadora = dados que ela não aceitou (ex.: NCM sem relação com a cClassTrib).
        HttpStatus status = e.getStatusCode().is4xxClientError() ? HttpStatus.UNPROCESSABLE_CONTENT : HttpStatus.BAD_GATEWAY;
        String detalhe = e.getResponseBodyAsString();
        try {
            var json = mapper.readTree(detalhe);
            if (json.hasNonNull("detail")) {
                detalhe = json.get("detail").asString();
            }
        } catch (Exception ignorada) {
            // corpo que não é JSON: devolve o texto cru
        }
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, detalhe);
        p.setTitle(status == HttpStatus.BAD_GATEWAY ? "Erro na calculadora da Receita" : "A calculadora recusou os dados");
        return p;
    }

    @ExceptionHandler(ResourceAccessException.class)
    ProblemDetail calculadoraForaDoAr(ResourceAccessException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "Não foi possível falar com a calculadora da Receita. Verifique se ela está rodando.");
        p.setTitle("Calculadora indisponível");
        return p;
    }

    @ExceptionHandler(CodigoInvalidoException.class)
    ProblemDetail codigoInvalido(CodigoInvalidoException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
        p.setTitle("Parâmetro inválido");
        return p;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail parametroInvalido(ConstraintViolationException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
        p.setTitle("Parâmetro inválido");
        return p;
    }
}
