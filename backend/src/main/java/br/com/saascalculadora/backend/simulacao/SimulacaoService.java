package br.com.saascalculadora.backend.simulacao;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import br.com.saascalculadora.backend.rtc.RtcClient;
import br.com.saascalculadora.backend.simulacao.SimulacaoResponse.ItemResultado;
import br.com.saascalculadora.backend.simulacao.SimulacaoResponse.Totais;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

@Service
public class SimulacaoService {

    private static final ZoneOffset BRASILIA = ZoneOffset.ofHours(-3);

    private final RtcClient rtc;
    private final JsonMapper mapper;

    public SimulacaoService(RtcClient rtc, JsonMapper mapper) {
        this.rtc = rtc;
        this.mapper = mapper;
    }

    public SimulacaoResponse simular(SimulacaoRequest req) {
        JsonNode resposta = rtc.calcularRegimeGeral(montarOperacao(req));
        return interpretar(resposta);
    }

    /** Converte a entrada simplificada no formato OperacaoInput da calculadora oficial. */
    ObjectNode montarOperacao(SimulacaoRequest req) {
        ObjectNode op = mapper.createObjectNode();
        op.put("id", UUID.randomUUID().toString().replace("-", ""));
        op.put("versao", "1.0.0");
        op.put("dhFatoGerador", req.dataFatoGerador().atTime(LocalTime.NOON).atOffset(BRASILIA)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        op.put("municipio", req.municipio());
        op.put("uf", req.uf().toUpperCase());
        var itens = op.putArray("itens");
        int numero = 1;
        for (var item : req.itens()) {
            ObjectNode i = itens.addObject();
            i.put("numero", numero++);
            i.put(item.tipo() == SimulacaoRequest.TipoItem.PRODUTO ? "ncm" : "nbs", item.codigo());
            i.put("cst", item.cst());
            i.put("cClassTrib", item.cClassTrib());
            i.put("baseCalculo", item.baseCalculo());
            ObjectNode al = i.putObject("aliquotasNominais");
            al.put("cbs", item.aliquotas().cbs());
            al.put("ibsEstadual", item.aliquotas().ibsEstadual());
            al.put("ibsMunicipal", item.aliquotas().ibsMunicipal());
        }
        return op;
    }

    /** Extrai da resposta oficial só o que a tela precisa. */
    SimulacaoResponse interpretar(JsonNode resposta) {
        List<ItemResultado> itens = new ArrayList<>();
        for (JsonNode obj : resposta.path("objetos")) {
            JsonNode g = obj.path("tribCalc").path("IBSCBS").path("gIBSCBS");
            JsonNode memoria = obj.path("tribCalc").path("IBSCBS").path("memoriaCalculo");
            BigDecimal cbs = dec(g.path("gCBS").path("vCBS"));
            BigDecimal ibsUf = dec(g.path("gIBSUF").path("vIBSUF"));
            BigDecimal ibsMun = dec(g.path("gIBSMun").path("vIBSMun"));
            BigDecimal ibs = dec(g.path("vIBS"));
            JsonNode red = g.path("gCBS").path("gRed").path("pRedAliq");
            itens.add(new ItemResultado(
                    obj.path("nObj").asInt(),
                    dec(g.path("vBC")),
                    cbs, ibsUf, ibsMun, ibs, cbs.add(ibs),
                    red.isMissingNode() || red.isNull() ? null : dec(red),
                    texto(memoria.path("cbs")),
                    texto(memoria.path("ibsUF"))));
        }
        JsonNode tot = resposta.path("total").path("tribCalc").path("IBSCBSTot");
        BigDecimal cbsTot = dec(tot.path("gCBS").path("vCBS"));
        BigDecimal ibsTot = dec(tot.path("gIBS").path("vIBS"));
        return new SimulacaoResponse(itens,
                new Totais(dec(tot.path("vBCIBSCBS")), cbsTot, ibsTot, cbsTot.add(ibsTot)));
    }

    private static BigDecimal dec(JsonNode n) {
        if (n == null || n.isMissingNode() || n.isNull()) {
            return BigDecimal.ZERO;
        }
        String s = n.asString("0");
        return s.isBlank() ? BigDecimal.ZERO : new BigDecimal(s);
    }

    private static String texto(JsonNode n) {
        return n == null || n.isMissingNode() || n.isNull() ? null : n.asString();
    }
}
