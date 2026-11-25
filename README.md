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

### Requisitos (só na primeira vez)

- **Windows**, **JDK 25** e **Node.js 22+**. Se faltar algum:

```powershell
winget install EclipseAdoptium.Temurin.25.JDK
```

```powershell
winget install OpenJS.NodeJS.LTS
```

- A **calculadora oficial da Receita** clonada na pasta **ao lado** deste projeto (a pasta `calculadora-rtc-regime-regular` deve ficar ao lado de `saas-calculadora-rtc`):

```powershell
git clone https://github.com/ReceitaFederal/calculadora-rtc-regime-regular.git
```

### Opção 1 (recomendada): `Sistema RTC.exe`

Um lançador com janela liga as três peças na ordem certa, abre o navegador em `http://localhost:3100` e desliga tudo ao fechar.

1. **Gere o `.exe`** (só na primeira vez, e de novo se mudar `launcher\launcher.py`), dentro da pasta do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File launcher\build-exe.ps1
```

2. **Dê dois cliques em `Sistema RTC.exe`** (fica na raiz do projeto). Se quiser, crie um atalho na Área de Trabalho (botão direito › Enviar para › Área de trabalho).
3. **Espere as três luzes ficarem verdes** (cerca de 40 segundos). Na primeira vez, ou se algo faltar (`.jar`, banco da calculadora, build da tela), ele prepara sozinho e mostra o andamento, o que leva alguns minutos. O navegador abre sozinho em `http://localhost:3100`.
4. **Para desligar**, clique em **Parar e sair** (ou no X da janela). Tudo é encerrado junto.

Detalhes:

- Menu **Avançado**: *Religar tudo* (desliga e liga de novo), *Reconstruir tudo* (use depois de atualizar o código com `git pull`) e *Abrir pasta de logs*.
- Se uma porta (8080, 8081 ou 3100) estiver ocupada por outro programa, o lançador avisa e não mexe nele. Para outro caminho da calculadora ou outras portas, crie `launcher.json` ao lado do `.exe`: `{"calculadora": "D:\\rtc", "porta_front": 3200}` (chaves aceitas: `raiz`, `calculadora`, `porta_calc`, `porta_back`, `porta_front`).
- Os logs de cada peça ficam em `logs\`. `Sistema RTC.exe --teste` liga tudo sem janela, faz uma simulação de ponta a ponta, desliga e grava o resultado em `logs\autoteste.txt` (código de saída 0 = tudo certo).
- O Windows SmartScreen ou o antivírus podem desconfiar de um `.exe` novo sem assinatura digital. É um falso alarme comum em programas gerados com PyInstaller; escolha "Mais informações › Executar assim mesmo".

### Opção 2: manualmente, em três terminais

Abra três janelas do PowerShell e rode **nesta ordem**, esperando cada uma terminar de subir.

**Terminal 1: calculadora da Receita** (porta 8080). Na primeira vez, gere o banco de dados dela antes:

```powershell
cd ..\calculadora-rtc-regime-regular; mkdir -Force calculadora\db; .\mvnw.cmd flyway:migrate "-Dflyway.configFiles=flyway\flyway-pro.conf" --batch-mode
```

```powershell
cd ..\calculadora-rtc-regime-regular; .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=offline"
```

**Terminal 2: back-end do SaaS** (porta 8081):

```powershell
cd backend; .\mvnw.cmd spring-boot:run
```

**Terminal 3: tela** (porta 3100; a 3000 costuma estar ocupada por outros sistemas):

```powershell
cd frontend; npm install; npx next dev --port 3100
```

Abra `http://localhost:3100`. Para desligar, `Ctrl + C` em cada terminal. O back-end lê `RTC_API_BASE_URL` (padrão `http://localhost:8080/api/calculadora`) e o front repassa `/backend/*` para `BACKEND_URL` (padrão `http://localhost:8081`); veja `.env.example`. Health check do back-end: `http://localhost:8081/actuator/health`.

### Se algo der errado

| O que acontece | Causa provável | O que fazer |
|---|---|---|
| "A porta 8080 (8081, 3100) está ocupada por outro programa" | Outro programa, ou uma execução anterior que não fechou | Feche o outro programa, ou mude a porta em `launcher.json` |
| "Java 25 não encontrado" ou "Node.js não encontrado" | Não instalados, ou instalados há pouco e o terminal ainda não os enxerga | Instale com os comandos de *Requisitos*, feche e abra o terminal |
| "Não achei a calculadora da Receita" | A pasta não está ao lado do projeto | Clone como em *Requisitos*, ou indique o caminho em `launcher.json` |
| A tela abre, mas o simulador mostra erro de servidor | A calculadora ou o back-end não subiram | Veja qual luz está vermelha e abra *Avançado › Abrir pasta de logs* |
| A tela está desatualizada depois de um `git pull` | Build antigo da tela | *Avançado › Reconstruir tudo* |
| `/curso` dá 404 ou a tela dá erro 500 em arquivos `_next` | O build da tela foi refeito com o `.exe` aberto | *Avançado › Religar tudo* |
| O antivírus bloqueia o `.exe` | Falso alarme (programa novo, sem assinatura) | Libere o arquivo ou rode a Opção 2 |

## Páginas do site

| Rota | O que é |
|---|---|
| `/` | Simulador de CBS e IBS |
| `/curso` | Mini curso sobre a Reforma Tributária do Consumo: 7 aulas, perguntas de fixação e progresso salvo só no navegador do leitor |

O conteúdo do curso fica em `frontend/src/lib/curso.ts` (aulas, perguntas e fontes) e os termos dos balões "?" em `frontend/src/lib/glossario.ts`. **A legislação muda rápido**: o curso mostra a data da última revisão (`DATA_DE_REVISAO`) e lista as fontes de cada aula. Revise-o junto com elas quando houver novidade, principalmente a alíquota da CBS de 2027, o Imposto Seletivo (MP 1.399/2026) e o split payment.

**Desenvolvimento x produção.** `npm run dev` grava em `.next-dev` e `npm run build` grava em `.next`, que é a pasta servida pelo `Sistema RTC.exe`. Assim o servidor de desenvolvimento não derruba a tela que o `.exe` está servindo. Mesmo assim, não rode `npm run build` com o `.exe` aberto: use **Avançado › Reconstruir tudo** nele.

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
