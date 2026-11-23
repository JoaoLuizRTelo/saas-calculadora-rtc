package br.com.saascalculadora.backend.referencia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import br.com.saascalculadora.backend.rtc.RtcClient;
import br.com.saascalculadora.backend.simulacao.SimulacaoRequest.TipoItem;

class BuscaCodigoServiceTest {

    private static final String BASE = "http://rtc.test/api/calculadora/dados-abertos";
    private static final LocalDate DATA = LocalDate.of(2027, 3, 10);

    private MockRestServiceServer servidor;
    private BuscaCodigoService busca;

    @BeforeEach
    void preparar() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://rtc.test/api/calculadora");
        servidor = MockRestServiceServer.bindTo(builder).ignoreExpectOrder(true).build();
        busca = new BuscaCodigoService(new RtcClient(builder.build()));
    }

    private void nbsLista() {
        servidor.expect(once(), requestTo(BASE + "/nbs/lista?data=2027-03-10")).andRespond(withSuccess("""
                [{"codigo":"1220","descricao":"Serviços de educação (nível acima, não usável)"},
                 {"codigo":"122011200","descricao":"Serviços de pré-escola"},
                 {"codigo":"122041000","descricao":"Serviços educacionais de graduação"},
                 {"codigo":"101011100","descricao":"Serviços de construção de edificações residenciais"}]
                """, MediaType.APPLICATION_JSON));
        servidor.expect(once(), requestTo(BASE + "/nbs?nbs=122011200&data=2027-03-10")).andRespond(withSuccess("""
                {"capitulo":"Serviços de educação básica","posicao":"Serviços de educação infantil","item":"Serviços de pré-escola"}
                """, MediaType.APPLICATION_JSON));
        servidor.expect(once(), requestTo(BASE + "/nbs?nbs=122041000&data=2027-03-10")).andRespond(withSuccess("""
                {"capitulo":"Serviços de educação superior","posicao":"Serviços de graduação","item":"Serviços educacionais de graduação"}
                """, MediaType.APPLICATION_JSON));
        servidor.expect(once(), requestTo(BASE + "/nbs?nbs=101011100&data=2027-03-10")).andRespond(withSuccess("""
                {"capitulo":"Serviços de construção","posicao":"Construção residencial","item":"Edificações"}
                """, MediaType.APPLICATION_JSON));
    }

    private void ncmLista() {
        servidor.expect(once(), requestTo(BASE + "/ncm/vigentes?data=2027-03-10")).andRespond(withSuccess("""
                [{"ncm":"02013000","descricao":"- Desossadas"},
                 {"ncm":"02023000","descricao":"- Desossadas"},
                 {"ncm":"03039200","descricao":"-- Barbatanas de <i>tubarão</i>"}]
                """, MediaType.APPLICATION_JSON));
        servidor.expect(once(), requestTo(BASE + "/ncm?ncm=02013000&data=2027-03-10")).andRespond(withSuccess("""
                {"capitulo":"Carnes e miudezas, comestíveis.","posicao":"Carnes de animais da espécie bovina, frescas ou refrigeradas.","subitem":"Desossadas"}
                """, MediaType.APPLICATION_JSON));
        servidor.expect(once(), requestTo(BASE + "/ncm?ncm=02023000&data=2027-03-10")).andRespond(withSuccess("""
                {"capitulo":"Carnes e miudezas, comestíveis.","posicao":"Carnes de animais da espécie bovina, congeladas.","subitem":"Desossadas"}
                """, MediaType.APPLICATION_JSON));
        servidor.expect(once(), requestTo(BASE + "/ncm?ncm=03039200&data=2027-03-10")).andRespond(withSuccess("""
                {"capitulo":"Peixes e crustáceos","posicao":"Peixes congelados","subitem":"Barbatanas"}
                """, MediaType.APPLICATION_JSON));
    }

    @Test
    void nbsAcheiaPorPalavraSemAcentoENaoDevolveNiveisIncompletos() {
        nbsLista();

        var r = busca.buscar(TipoItem.SERVICO, "EDUCACAO", DATA);

        // O código de 4 dígitos ("Serviços de educação") não é usável e fica de fora. 122011200 casa pela posição
        // "educação infantil" (2 pontos); 122041000 só pelo capítulo "educação superior" (1 ponto), por isso vem depois.
        assertThat(r.itens()).extracting(BuscaCodigoService.Item::codigo).containsExactly("122011200", "122041000");
    }

    @Test
    void nbsAcheiaPeloNomeDaPosicaoQuandoAPontaNaoTemAPalavra() {
        nbsLista();

        // "pré-escola" é a ponta; "educação infantil" só existe na posição, que vem da consulta por serviço.
        var r = busca.buscar(TipoItem.SERVICO, "educação infantil", DATA);

        assertThat(r.itens()).extracting(BuscaCodigoService.Item::codigo).containsExactly("122011200");
        assertThat(r.itens().get(0).descricao())
                .isEqualTo("Serviços de educação infantil › Serviços de pré-escola");
    }

    @Test
    void todasAsPalavrasPrecisamAparecer() {
        nbsLista();

        assertThat(busca.buscar(TipoItem.SERVICO, "servicos pre escola", DATA).itens())
                .extracting(BuscaCodigoService.Item::codigo).containsExactly("122011200");
        assertThat(busca.buscar(TipoItem.SERVICO, "pre escola graduacao", DATA).itens()).isEmpty();
    }

    @Test
    void ncmUsaCapituloEPosicaoParaEncontrarPontasGenericas() {
        ncmLista();

        var r = busca.buscar(TipoItem.PRODUTO, "carne bovina desossada", DATA);

        assertThat(r.total()).isEqualTo(2);
        // Mesma pontuação nos dois; no empate vem primeiro a descrição mais curta ("congeladas" < "frescas ou refrigeradas").
        assertThat(r.itens()).extracting(BuscaCodigoService.Item::codigo).containsExactly("02023000", "02013000");
        assertThat(r.itens().get(1).descricao())
                .isEqualTo("Carnes de animais da espécie bovina, frescas ou refrigeradas. › Desossadas");
    }

    @Test
    void ncmLimpaTagsHtmlETracosDeNivel() {
        ncmLista();

        var r = busca.buscar(TipoItem.PRODUTO, "tubarao", DATA);

        assertThat(r.itens()).hasSize(1);
        assertThat(r.itens().get(0).descricao()).isEqualTo("Peixes congelados › Barbatanas de tubarão");
    }

    @Test
    void consultaCurtaDemaisNaoConsultaNada() {
        assertThat(busca.buscar(TipoItem.SERVICO, "ab", DATA).itens()).isEmpty();
        assertThat(busca.buscar(TipoItem.SERVICO, "  ", DATA).itens()).isEmpty();
        servidor.verify(); // nenhuma chamada foi esperada nem feita
    }

    @Test
    void indiceEhReaproveitadoNaSegundaBusca() {
        nbsLista(); // expect(once()): uma segunda chamada à calculadora faria o teste falhar

        busca.buscar(TipoItem.SERVICO, "educacao", DATA);
        busca.buscar(TipoItem.SERVICO, "graduacao", DATA);

        servidor.verify();
    }
}
