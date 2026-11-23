package br.com.saascalculadora.backend.simulacao;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class SimulacaoController {

    private final SimulacaoService service;

    public SimulacaoController(SimulacaoService service) {
        this.service = service;
    }

    @PostMapping("/simulacoes")
    public SimulacaoResponse simular(@Valid @RequestBody SimulacaoRequest request) {
        return service.simular(request);
    }
}
