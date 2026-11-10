# Jungle Gaming — Backend Challenge

Este projeto foi desenvolvido como parte do desafio técnico para a vaga de Backend Developer na Jungle Gaming.

A proposta é criar uma API para gerenciar carteiras de jogadores e processar transações relacionadas a apostas, como BET, WIN, LOSS, REFUND e ROLLBACK.

Durante o desenvolvimento, procurei manter o código organizado, separar as responsabilidades e dar atenção especial às regras financeiras, principalmente ao controle do saldo e à prevenção de transações duplicadas.

## Tecnologias utilizadas

- **NestJS:** framework utilizado para estruturar a aplicação.
- **TypeScript:** linguagem utilizada no desenvolvimento.
- **Bun:** utilizado para executar a aplicação e os testes.
- **PostgreSQL:** banco de dados utilizado para armazenar as informações.
- **MikroORM:** responsável pela comunicação entre a aplicação e o banco.
- **Decimal.js:** biblioteca utilizada como apoio para operações com valores decimais.
- **Vitest:** utilizado para executar os testes automatizados.

## Como o projeto está organizado?

Procurei separar o projeto em partes para que cada uma tenha uma responsabilidade específica.

```text
src/
├── controllers/
├── dtos/
├── entities/
├── infrastructure/
│   └── database/
│       ├── entities/
│       └── repositories/
├── migrations/
├── services/
└── value-objects/
```

De forma resumida:

- `controllers`: recebem as requisições da API.
- `dtos`: definem quais informações a API espera receber.
- `entities`: contêm as entidades e regras principais do negócio.
- `services`: organizam e executam os fluxos da aplicação.
- `infrastructure`: contém a parte responsável pela comunicação com o banco de dados.
- `migrations`: armazenam as alterações feitas na estrutura do banco.
- `value-objects`: contêm objetos utilizados para representar conceitos do domínio, como valores monetários.

## Funcionalidades desenvolvidas

### Criação de carteira

Endpoint: `POST /wallets`

Permite criar uma carteira para um jogador, informando o saldo inicial e a moeda.

Exemplo:

```json
{
  "playerId": "player-123",
  "initialBalance": {
    "amount": "100.00",
    "currency": "BRL"
  }
}
```

### Processamento de transações

Endpoint: `POST /wagering/transactions`

Recebe uma transação e encaminha o processamento para os serviços responsáveis pelas regras de negócio e pela persistência.

O endpoint exige o header `Idempotency-Key`.

Essa chave ajuda a evitar que uma mesma requisição seja processada mais de uma vez. Também é gerado um hash do conteúdo da requisição para identificar quando uma chave é reutilizada com dados diferentes.

### Controle financeiro

Uma das preocupações durante o desenvolvimento foi evitar problemas com operações monetárias.

Para isso, criei o objeto `Money`, que centraliza a representação e as operações com valores e moedas.

A entidade `Wallet` também possui as regras relacionadas ao saldo, como:

- Não permitir saldo inicial negativo.
- Não permitir operações com moedas diferentes.
- Não permitir débitos com valores negativos.
- Não permitir que um débito ultrapasse o saldo disponível.
- Atualizar a versão da carteira quando o saldo é alterado.

### Persistência dos dados

O projeto utiliza o PostgreSQL para armazenar carteiras, transações e movimentações financeiras.

O `WagerPersistenceService` coordena o processamento dentro de uma transação do banco de dados. Dessa forma, as operações relacionadas são executadas dentro do mesmo contexto transacional.

Também foi utilizado bloqueio pessimista ao carregar uma carteira durante o processamento, ajudando a evitar alterações simultâneas sobre o mesmo saldo.

## Como executar o projeto

É necessário ter o Bun e o PostgreSQL instalados.

Configure as variáveis de ambiente:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=jungle_gaming
DB_USER=postgres
DB_PASSWORD=sua_senha
```

Instale as dependências:

```bash
bun install
```

Execute a aplicação:

```bash
bun run start:dev
```

Para gerar o build:

```bash
bun run build
```

Para executar os testes:

```bash
bun run test
```

## Testes automatizados

Foram criados testes para verificar partes importantes do projeto, como:

- Operações com valores monetários.
- Regras de processamento de transações.
- Fluxo de persistência.
- Comportamento do repositório de carteiras.

Na última execução realizada durante o desenvolvimento, todos os 38 testes passaram.

## O que ainda pode ser melhorado?

Nem todos os requisitos previstos no desafio foram implementados nesta versão.

Alguns pontos que ficaram como melhorias futuras são:

- Integração com AWS SQS para processamento de mensagens.
- Implementação dos padrões Inbox e Outbox.
- Criação de workers para reprocessar transações pendentes.
- Implementação de Dead Letter Queue (DLQ) e política de novas tentativas.
- Endpoints para consultar carteiras, transações e movimentações.
- Endpoint de reconciliação de saldo.
- Health checks para verificar a disponibilidade da aplicação e do banco.
- Testes de integração com PostgreSQL e LocalStack.
- Testes de concorrência com múltiplas instâncias.

O objetivo foi construir uma base funcional, com atenção às regras financeiras e à organização do código, deixando esses pontos identificados para uma próxima evolução.