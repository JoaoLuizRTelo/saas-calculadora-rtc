package br.com.saascalculadora.backend.referencia;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.saascalculadora.backend.rtc.RtcClient;
import br.com.saascalculadora.backend.simulacao.SimulacaoRequest.TipoItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

/** Listas de apoio para os campos do formulário (repassadas ou derivadas da calculadora oficial). */
@Validated
@RestController
@RequestMapping("/api/referencias")
public class ReferenciaController {

    private final RtcClient rtc;
    private final ClassificacaoService classificacoes;
    private final BuscaCodigoService busca;

    public ReferenciaController(RtcClient rtc, ClassificacaoService classificacoes, BuscaCodigoService busca) {
        this.rtc = rtc;
        this.classificacoes = classificacoes;
        this.busca = busca;
    }

    @GetMapping("/ufs")
    public JsonNode ufs() {
        return rtc.ufs();
    }

    @GetMapping("/municipios")
    public JsonNode municipios(@RequestParam @NotBlank @Size(min = 2, max = 2) String uf) {
        return rtc.municipios(uf.toUpperCase());
    }

    /** Todas as classificações da data, com o CST, o tratamento e os percentuais de redução. */
    @GetMapping("/classificacoes")
    public List<ClassificacaoInfo> classificacoes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return classificacoes.todas(data);
    }

    /** Classificações (de todos os CST) que se aplicam ao NCM (produto) ou NBS (serviço) informado. */
    @GetMapping("/classificacoes-aplicaveis")
    public List<ClassificacaoAplicavel> classificacoesAplicaveis(
            @RequestParam TipoItem tipo,
            @RequestParam String codigo,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return classificacoes.aplicaveis(tipo, codigo, data);
    }

    /** Pesquisa NCM (produto) ou NBS (serviço) por palavras, ex.: "carne bovina desossada". */
    @GetMapping("/buscar-codigo")
    public BuscaCodigoService.Resultado buscarCodigo(
            @RequestParam TipoItem tipo,
            @RequestParam("q") String consulta,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return busca.buscar(tipo, consulta, data);
    }

    /** Descrição oficial do NCM/NBS, para o usuário conferir se digitou o código certo. */
    @GetMapping("/descricao-codigo")
    public DescricaoCodigo descricaoCodigo(
            @RequestParam TipoItem tipo,
            @RequestParam String codigo,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return new DescricaoCodigo(classificacoes.descricao(tipo, codigo, data));
    }

    public record DescricaoCodigo(String descricao) {
    }
}
