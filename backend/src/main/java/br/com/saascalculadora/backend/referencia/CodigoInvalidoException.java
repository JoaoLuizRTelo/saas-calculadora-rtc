package br.com.saascalculadora.backend.referencia;

/** NCM/NBS com formato errado (tamanho ou caracteres). Vira HTTP 400. */
public class CodigoInvalidoException extends RuntimeException {

    public CodigoInvalidoException(String mensagem) {
        super(mensagem);
    }
}
