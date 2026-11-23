package br.com.saascalculadora.backend.simulacao;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SimulacaoControllerTest {

    private final SimulacaoService service = mock(SimulacaoService.class);
    private final MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new SimulacaoController(service)).build();

    @Test
    void rejeitaSimulacaoSemItensSemChamarACalculadora() throws Exception {
        mvc.perform(post("/api/simulacoes").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"uf":"RS","municipio":4314902,"dataFatoGerador":"2027-03-10","itens":[]}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void rejeitaValorNegativo() throws Exception {
        mvc.perform(post("/api/simulacoes").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"uf":"RS","municipio":4314902,"dataFatoGerador":"2027-03-10","itens":[
                                 {"tipo":"SERVICO","codigo":"122011200","cst":"200","cClassTrib":"200028",
                                  "baseCalculo":-5,"aliquotas":{"cbs":8.8,"ibsEstadual":0.05,"ibsMunicipal":0.05}}]}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
