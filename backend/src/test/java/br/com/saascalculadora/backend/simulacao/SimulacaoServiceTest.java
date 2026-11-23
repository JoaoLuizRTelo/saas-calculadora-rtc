package br.com.saascalculadora.backend.simulacao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import br.com.saascalculadora.backend.rtc.RtcClient;
import tools.jackson.databind.json.JsonMapper;

class SimulacaoServiceTest {

    private static final String BASE = "http://rtc.test/api/calculadora";

    // Resposta real (resumida) da calculadora para um serviço de educação de R$ 1.200,00.
    private static final String RESPOSTA_EDUCACAO = """
            {"objetos":[{"nObj":1,"tribCalc":{"IBSCBS":{"CST":"200","cClassTrib":"200028",
              "gIBSCBS":{"vBC":"1200.00",
                "gIBSUF":{"pIBSUF":"0.05","gRed":{"pRedAliq":"60.00","pAliqEfet":"0.02"},"vIBSUF":"0.24"},
                "gIBSMun":{"pIBSMun":"0.05","gRed":{"pRedAliq":"60.00","pAliqEfet":"0.02"},"vIBSMun":"0.24"},
                "vIBS":"0.48",
                "gCBS":{"pCBS":"8.80","gRed":{"pRedAliq":"60.00","pAliqEfet":"3.52"},"vCBS":"42.24"}},
              "memoriaCalculo":{"cbs":"memoria cbs","ibsUF":"memoria ibs"}}},"calculoSimulado":true}],
             "total":{"tribCalc":{"IBSCBSTot":{"vBCIBSCBS":"1200.00",
               "gIBS":{"vIBS":"0.48"},"gCBS":{"vCBS":"42.24"}}}}}
            """;

    private MockRestServiceServer servidor;
    private SimulacaoService service;

    @BeforeEach
    void preparar() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE);
        servidor = MockRestServiceServer.bindTo(builder).build();
        service = new SimulacaoService(new RtcClient(builder.build()), JsonMapper.builder().build());
    }

    private static SimulacaoRequest educacao() {
        return new SimulacaoRequest("rs", 4314902, LocalDate.of(2027, 3, 10), List.of(
                new SimulacaoRequest.Item(SimulacaoRequest.TipoItem.SERVICO, "122011200", "200", "200028",
                        new BigDecimal("1200.00"),
                        new SimulacaoRequest.Aliquotas(new BigDecimal("8.8"), new BigDecimal("0.05"), new BigDecimal("0.05")))));
    }

    @Test
    void enviaOperacaoNoFormatoOficialEInterpretaOResultado() {
        servidor.expect(requestTo(BASE + "/regime-geral"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.uf").value("RS"))
                .andExpect(jsonPath("$.municipio").value(4314902))
                .andExpect(jsonPath("$.dhFatoGerador").value("2027-03-10T12:00:00-03:00"))
                .andExpect(jsonPath("$.itens[0].numero").value(1))
                .andExpect(jsonPath("$.itens[0].nbs").value("122011200"))
                .andExpect(jsonPath("$.itens[0].ncm").doesNotExist())
                .andExpect(jsonPath("$.itens[0].aliquotasNominais.cbs").value(8.8))
                .andRespond(withSuccess(RESPOSTA_EDUCACAO, MediaType.APPLICATION_JSON));

        SimulacaoResponse r = service.simular(educacao());

        servidor.verify();
        assertThat(r.itens()).hasSize(1);
        var item = r.itens().get(0);
        assertThat(item.cbs()).isEqualByComparingTo("42.24");
        assertThat(item.ibs()).isEqualByComparingTo("0.48");
        assertThat(item.total()).isEqualByComparingTo("42.72");
        assertThat(item.reducaoAliquota()).isEqualByComparingTo("60.00");
        assertThat(item.memoriaCbs()).isEqualTo("memoria cbs");
        assertThat(r.totais().total()).isEqualByComparingTo("42.72");
        assertThat(r.totais().baseCalculo()).isEqualByComparingTo("1200.00");
    }

    @Test
    void produtoUsaNcmEmVezDeNbs() {
        servidor.expect(requestTo(BASE + "/regime-geral"))
                .andExpect(jsonPath("$.itens[0].ncm").value("10063021"))
                .andExpect(jsonPath("$.itens[0].nbs").doesNotExist())
                .andRespond(withSuccess(RESPOSTA_EDUCACAO, MediaType.APPLICATION_JSON));

        var req = new SimulacaoRequest("RS", 4314902, LocalDate.of(2027, 3, 10), List.of(
                new SimulacaoRequest.Item(SimulacaoRequest.TipoItem.PRODUTO, "10063021", "200", "200003",
                        new BigDecimal("100"),
                        new SimulacaoRequest.Aliquotas(BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO))));
        service.simular(req);

        servidor.verify();
    }

    @Test
    void erroDaCalculadoraSobeComoExcecaoHttp() {
        servidor.expect(requestTo(BASE + "/regime-geral"))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"detail\":\"NCM nao vinculada\"}"));

        assertThatThrownBy(() -> service.simular(educacao())).isInstanceOf(HttpClientErrorException.class);
    }
}
