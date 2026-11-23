package br.com.saascalculadora.backend.referencia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;
import static org.springframework.test.web.client.ExpectedCount.manyTimes;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import br.com.saascalculadora.backend.referencia.ClassificacaoAplicavel.Compatibilidade;
import br.com.saascalculadora.backend.rtc.RtcClient;
import br.com.saascalculadora.backend.simulacao.SimulacaoRequest.TipoItem;

class ClassificacaoServiceTest {

    private static final String BASE = "http://rtc.test/api/calculadora";
    private static final String CT = "/dados-abertos/classificacoes-tributarias";
    private static final LocalDate DATA = LocalDate.of(2027, 3, 10);

    private MockRestServiceServer servidor;
    private ClassificacaoService service;

    @BeforeEach
    void preparar() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE);
        servidor = MockRestServiceServer.bindTo(builder).ignoreExpectOrder(true).build();
        service = new ClassificacaoService(new RtcClient(builder.build()));
    }

    private void situacoes() {
        servidor.expect(manyTimes(), requestTo(BASE + "/dados-abertos/situacoes-tributarias/cbs-ibs?data=2027-03-10"))
                .andRespond(withSuccess("""
                        [{"codigo":"200","descricao":"Alíquota reduzida","classificacoesTributarias":[
                           {"codigo":"200003","descricao":"Alimentação humana"},
                           {"codigo":"200035","descricao":"Higiene e limpeza"},
                           {"codigo":"200055","descricao":"Serviços de autônomo"},
                           {"codigo":"200099","descricao":"Sem consulta possível"}]},
                         {"codigo":"000","descricao":"Integral","classificacoesTributarias":[
                           {"codigo":"000001","descricao":"Outra"}]}]
                        """, MediaType.APPLICATION_JSON));
    }

    private void ncm(String cClass, String ncm, boolean valido) {
        servidor.expect(manyTimes(), requestTo(BASE + CT + "/ncm-aplicavel?cClassTrib=" + cClass + "&ncm=" + ncm
                        + "&dataOcorrenciaFatoGerador=2027-03-10"))
                .andRespond(withSuccess("{\"valido\":" + valido + "}", MediaType.APPLICATION_JSON));
    }

    @Test
    void separaEspecificasDeGeraisEDescartaAsQueNaoValem() {
        situacoes();
        // 200003: vale para a carne e não para o NCM de controle -> específica
        ncm("200003", "02013000", true);
        ncm("200003", "99999999", false);
        // 200035: não vale para a carne -> descartada
        ncm("200035", "02013000", false);
        // 200055: vale para tudo, até para o NCM inexistente -> geral
        ncm("200055", "02013000", true);
        ncm("200055", "99999999", true);
        // 000001 (outro CST): também geral
        ncm("000001", "02013000", true);
        ncm("000001", "99999999", true);
        // 200099: a calculadora não conhece (404) -> não verificada
        servidor.expect(manyTimes(), requestTo(BASE + CT + "/ncm-aplicavel?cClassTrib=200099&ncm=02013000&dataOcorrenciaFatoGerador=2027-03-10"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON).body("{}"));

        var r = service.aplicaveis(TipoItem.PRODUTO, "02013000", DATA);

        assertThat(r).extracting(ClassificacaoAplicavel::cst, ClassificacaoAplicavel::codigo, ClassificacaoAplicavel::compatibilidade)
                .containsExactly(
                        tuple("200", "200003", Compatibilidade.ESPECIFICA),
                        tuple("000", "000001", Compatibilidade.GERAL),
                        tuple("200", "200055", Compatibilidade.GERAL),
                        tuple("200", "200099", Compatibilidade.NAO_VERIFICADA));
    }

    @Test
    void rejeitaCodigoComTamanhoErrado() {
        assertThatThrownBy(() -> service.aplicaveis(TipoItem.PRODUTO, "0201", DATA))
                .isInstanceOf(CodigoInvalidoException.class).hasMessageContaining("8 dígitos");
        assertThatThrownBy(() -> service.aplicaveis(TipoItem.SERVICO, "12201120", DATA))
                .isInstanceOf(CodigoInvalidoException.class).hasMessageContaining("9 dígitos");
    }

    @Test
    void todasJuntaCstTratamentoEReducoes() {
        situacoes();
        servidor.expect(requestTo(BASE + CT + "/cbs-ibs?data=2027-03-10"))
                .andRespond(withSuccess("""
                        [{"codigo":"200003","descricaoTratamentoTributario":"Alíquota reduzida em 60%",
                          "percentualReducaoCbs":60.0,"percentualReducaoIbsUf":60.0,"percentualReducaoIbsMun":60.0,
                          "nomenclatura":"NCM","tipoAliquota":"Padrão"},
                         {"codigo":"000001","descricaoTratamentoTributario":"Tributação integral",
                          "percentualReducaoCbs":0.0,"percentualReducaoIbsUf":0.0,"percentualReducaoIbsMun":0.0,
                          "nomenclatura":"NBS ou NCM","tipoAliquota":"Padrão"}]
                        """, MediaType.APPLICATION_JSON));

        var todas = service.todas(DATA);

        assertThat(todas).hasSize(5);
        var alimentacao = todas.stream().filter(c -> c.codigo().equals("200003")).findFirst().orElseThrow();
        assertThat(alimentacao.cst()).isEqualTo("200");
        assertThat(alimentacao.cstDescricao()).isEqualTo("Alíquota reduzida");
        assertThat(alimentacao.tratamento()).isEqualTo("Alíquota reduzida em 60%");
        assertThat(alimentacao.reducaoCbs()).isEqualByComparingTo("60");
        assertThat(alimentacao.nomenclatura()).isEqualTo("NCM");
        // classificação sem detalhe na lista: mantém a descrição e deixa os percentuais nulos
        var semDetalhe = todas.stream().filter(c -> c.codigo().equals("200035")).findFirst().orElseThrow();
        assertThat(semDetalhe.descricao()).isEqualTo("Higiene e limpeza");
        assertThat(semDetalhe.reducaoCbs()).isNull();
    }

    @Test
    void descricaoJuntaAHierarquiaDoNcm() {
        servidor.expect(requestTo(BASE + "/dados-abertos/ncm?ncm=02013000&data=2027-03-10"))
                .andRespond(withSuccess("""
                        {"capitulo":"Carnes e miudezas, comestíveis.","posicao":"Carnes bovinas, frescas.","subitem":"Desossadas"}
                        """, MediaType.APPLICATION_JSON));

        assertThat(service.descricao(TipoItem.PRODUTO, "02013000", DATA))
                .isEqualTo("Carnes e miudezas, comestíveis. › Carnes bovinas, frescas. › Desossadas");
    }

    @Test
    void descricaoDeCodigoInexistenteEhNula() {
        servidor.expect(requestTo(BASE + "/dados-abertos/nbs?nbs=999999999&data=2027-03-10"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON).body("{}"));

        assertThat(service.descricao(TipoItem.SERVICO, "999999999", DATA)).isNull();
    }
}
