# saas-calculadora-rtc

SaaS para cálculo de **CBS, IBS e Imposto Seletivo** (Reforma Tributária do Consumo — LC 214/2025), construído sobre a API oficial da Receita Federal: [`calculadora-rtc-regime-regular`](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular).

> Projeto independente, sem vínculo com a Receita Federal. Os cálculos são feitos pela API oficial; este repositório não copia nem altera o código dela.

## Arquitetura

```
frontend/ (Next.js + Tailwind)  ──►  backend/ (Spring Boot)  ──►  calculadora-rtc (Receita, Java 25)
```

- `frontend/`: Next.js (App Router, TypeScript) com Tailwind CSS.
- `backend/`: Spring Boot (Java 21, Maven) com Web, Validation e Actuator. É a API do SaaS e quem fala com a calculadora oficial por HTTP.
- Calculadora oficial: roda como serviço separado (exige Java 25 e o banco `calculadora-pro.db`; veja o README do repositório dela).

Detalhes em [docs/arquitetura.md](docs/arquitetura.md).

## Como rodar

Pré-requisitos: Node 22+, JDK 21+.

```bash
# back-end (porta 8081)
cd backend
./mvnw spring-boot:run

# front-end (porta 3000)
cd frontend
npm install
npm run dev
```

Copie `.env.example` para `.env` e ajuste `RTC_API_BASE_URL` para a URL onde a calculadora oficial estiver rodando.

Health check do back-end: `http://localhost:8081/actuator/health`.

## Status

Esqueleto inicial. Ainda não há regra de negócio, autenticação, planos ou banco de dados do SaaS.

## Licença

[MIT](LICENSE). A calculadora oficial tem licença própria (MIT) no repositório dela.
