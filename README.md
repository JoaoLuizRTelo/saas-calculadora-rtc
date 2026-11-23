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

Pré-requisitos: Node 22+, JDK 21+ (para o back-end do SaaS) e JDK 25 (para a calculadora oficial).

Suba as três peças, nesta ordem:

```bash
# 1. calculadora oficial da Receita (porta 8080) — veja o README dela;
#    resumo: gerar o banco com o Flyway e rodar com o perfil "offline"
./mvnw spring-boot:run -Dspring-boot.run.profiles=offline

# 2. back-end do SaaS (porta 8081)
cd backend
./mvnw spring-boot:run

# 3. front-end (porta 3000 por padrão; use --port se ela estiver ocupada)
cd frontend
npm install
npm run dev
```

O back-end lê `RTC_API_BASE_URL` (padrão `http://localhost:8080/api/calculadora`). O front repassa `/backend/*` para o back-end em `BACKEND_URL` (padrão `http://localhost:8081`). Veja `.env.example`.

Health check do back-end: `http://localhost:8081/actuator/health`.

## API do back-end

| Método | Caminho | O que faz |
|---|---|---|
| `POST` | `/api/simulacoes` | Recebe UF, município, data e itens; chama `POST /regime-geral` da calculadora e devolve CBS, IBS e total por item e no geral |
| `GET` | `/api/referencias/ufs` | UFs |
| `GET` | `/api/referencias/municipios?uf=RS` | Municípios da UF |
| `GET` | `/api/referencias/classificacoes?data=2027-03-10` | Todas as classificações (cClassTrib) com CST, tratamento ("Alíquota reduzida em 60%"), percentuais de redução de CBS/IBS e tipo de código (NCM/NBS) |
| `GET` | `/api/referencias/classificacoes-aplicaveis?tipo=PRODUTO&codigo=02013000&data=2027-03-10` | Classificações (de todos os CST) que se aplicam ao NCM (8 dígitos) ou NBS (9 dígitos), em três grupos: `ESPECIFICA`, `GERAL`, `NAO_VERIFICADA` |
| `GET` | `/api/referencias/buscar-codigo?tipo=SERVICO&q=educação infantil&data=2027-03-10` | Pesquisa NCM (`PRODUTO`) ou NBS (`SERVICO`) por palavras, sem distinguir acento; devolve até 20 resultados e o total |
| `GET` | `/api/referencias/descricao-codigo?tipo=PRODUTO&codigo=02013000&data=2027-03-10` | Descrição oficial do NCM/NBS (`null` se o código não existe) |

**Como as classificações são filtradas.** A calculadora oficial só responde "esta classificação vale para este NCM?", uma por vez, e responde "sim" também para as classificações que não restringem NCM. Para separar as específicas das gerais, o back-end repete a pergunta com um código que não existe (`99999999` / `999999999`): quem ainda responde "sim" é geral. Classificações que a calculadora não sabe validar por código (404) ficam como `NAO_VERIFICADA`.

**Busca por nome.** A calculadora não tem busca por texto. O back-end baixa a lista oficial de NCM/NBS uma vez por data e pesquisa em memória. Como a lista só traz a "ponta" da descrição ("Outros", "Serviços de pré-escola"), o nome do capítulo e da posição é buscado por NCM (uma consulta por grupo de 4 dígitos, cerca de 1.200) e por NBS (uma por serviço, cerca de 920). Isso leva cerca de 1 segundo na primeira busca de cada data; as seguintes respondem em milissegundos. O índice fica só na memória do back-end.

**Efeito da classificação.** As alíquotas nominais informadas pelo usuário são as "cheias"; a classificação aplica uma redução por cima (60% = alíquota cai 60%, 100% = alíquota zero). A tela mostra essa conta antes de calcular, usando os percentuais que a calculadora informa para cada classificação.

Erros da calculadora (ex.: NCM sem relação com a cClassTrib) voltam como HTTP 422 com a mensagem original; calculadora fora do ar volta como 503.

## Status

Simulador funcionando de ponta a ponta (tela → back-end → calculadora oficial). Ainda não há autenticação, planos nem banco de dados do SaaS.

Observação: a tabela oficial só tem alíquotas de referência cadastradas para 2026; para datas de 2027 em diante o formulário pede as alíquotas nominais (valores iniciais: CBS 8,8%, IBS 0,05% + 0,05%, como no exemplo da Receita).

## Licença

[MIT](LICENSE). A calculadora oficial tem licença própria (MIT) no repositório dela.
