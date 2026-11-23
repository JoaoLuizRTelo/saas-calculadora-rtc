package br.com.saascalculadora.backend.referencia;

/** Uma classificação tributária (cClassTrib) e o quanto ela se aplica ao NCM/NBS informado. */
public record ClassificacaoAplicavel(String cst, String codigo, Compatibilidade compatibilidade) {

    public enum Compatibilidade {
        /** Tem lista própria de NCM/NBS e o código informado está nela: é o enquadramento provável. */
        ESPECIFICA,
        /** Não restringe NCM/NBS: a calculadora aceita para qualquer código, mas pode não ser a correta. */
        GERAL,
        /** A calculadora não permite checar essa classificação por código; fica a cargo do usuário. */
        NAO_VERIFICADA
    }
}
