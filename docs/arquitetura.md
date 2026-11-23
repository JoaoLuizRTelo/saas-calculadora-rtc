# Arquitetura

## Visão geral

| Camada | Tecnologia | Porta local | Papel |
|---|---|---|---|
| `frontend/` | Next.js, TypeScript, Tailwind | 3000 | Interface do SaaS |
| `backend/` | Spring Boot, Java 21, Maven | 8081 | API do SaaS; orquestra e persiste |
| Calculadora RTC | Spring Boot, Java 25 (Receita Federal) | 8080 | Cálculo oficial de CBS, IBS e IS |

## Decisões

- **Sem cópia do código oficial.** A calculadora da Receita é consumida por HTTP (`/api/calculadora/...`, ex.: `POST /regime-geral`). Isso evita manter um fork defasado e deixa claro de onde vem cada número.
- **Back-end próprio.** O front nunca fala direto com a calculadora: o back-end do SaaS centraliza autenticação, limites de plano e cache.
- **Java 21 no back-end do SaaS.** É o JDK instalado hoje; a calculadora oficial exige Java 25 e roda à parte. Dá para subir o SaaS para 25 depois.

## Próximos passos sugeridos

1. Cliente HTTP no back-end para `POST /regime-geral` e tela de simulação no front.
2. Autenticação e planos.
3. `docker-compose` com a calculadora oficial + back-end + front.
