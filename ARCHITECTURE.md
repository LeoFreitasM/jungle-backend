# Arquitetura do projeto

## 1. Introdução

Neste projeto, optei por organizar o código em camadas, separando as regras do negócio das partes responsáveis por receber requisições e acessar o banco de dados.

A ideia é evitar que toda a lógica fique concentrada nos controllers ou diretamente nas operações de banco.

Assim, cada parte possui uma responsabilidade e fica mais fácil entender, testar e dar manutenção no código.

## 2. Como o código está dividido?

### Domínio — `entities` e `value-objects`

Essa parte contém os principais conceitos do sistema e suas regras.

É onde ficam as classes que representam o funcionamento do negócio.

**Wallet**

Representa a carteira de um jogador.

É responsável por controlar o saldo e realizar operações de crédito e débito, respeitando as regras financeiras.

**WagerTransaction**

Representa uma transação relacionada a uma aposta, armazenando informações como jogador, carteira, provedor, valor e tipo da operação.

**WalletLedgerEntry**

Representa uma movimentação financeira da carteira.

Ele registra informações como o valor movimentado, o saldo antes da operação e o saldo depois dela.

**Money**

Criei essa classe para centralizar o tratamento dos valores monetários.

Em vez de realizar operações financeiras diretamente em vários lugares do sistema, utilizo o objeto `Money` para trabalhar com valores e moedas de maneira padronizada.

### Serviços — `services`

Os serviços organizam os processos da aplicação e conectam as regras do domínio com a persistência dos dados.

**WagerProcessorService**

É responsável por executar as regras de processamento de uma transação, considerando o tipo da operação e as informações da carteira.

**WagerPersistenceService**

Coordena o processo de gravação da transação no banco.

Ele verifica se a requisição já foi processada, busca a carteira, verifica possíveis duplicidades e referências e, quando necessário, solicita o processamento ao `WagerProcessorService`.

Também organiza a persistência da carteira, da transação e do ledger dentro de uma transação do banco de dados.

### Infraestrutura — `infrastructure/database`

Essa parte cuida da comunicação com o PostgreSQL por meio do MikroORM.

As entidades do banco representam as tabelas utilizadas pela aplicação:

- `WalletEntity`
- `WagerTransactionEntity`
- `WalletLedgerEntryEntity`

Os repositórios são responsáveis por buscar e salvar esses dados.

Por exemplo, o `WalletRepository` busca uma carteira no banco e transforma os dados encontrados em um objeto `Wallet`, que pode ser utilizado pelas regras do domínio.

### Controllers e DTOs

Os controllers são a porta de entrada da API.

Eles recebem as requisições HTTP, fazem as validações necessárias e encaminham o trabalho para os serviços.

Os DTOs definem quais informações devem ser enviadas em cada requisição.

## 3. Como funciona a criação de uma carteira?

O processo começa no `WalletController`.

1. A API recebe o identificador do jogador, o saldo inicial e a moeda.
2. O valor recebido é convertido para um objeto `Money`.
3. A classe `Wallet` cria a carteira e aplica suas regras de domínio.
4. O `WalletRepository` prepara a persistência.
5. A gravação acontece dentro de uma transação do banco de dados.
6. A API retorna os dados da carteira criada.

## 4. Como funciona o processamento de uma aposta?

O processamento começa no `WagerController`.

O fluxo acontece da seguinte maneira:

1. A API recebe os dados da transação.
2. Verifica se o header `Idempotency-Key` foi enviado.
3. Converte o valor recebido para `Money`.
4. Organiza os dados da requisição e gera um hash SHA-256.
5. Cria a entidade `WagerTransaction`.
6. Encaminha a operação para o `WagerPersistenceService`.
7. O serviço inicia uma transação no banco.
8. Verifica se aquela chave de idempotência já foi utilizada.
9. Busca a carteira utilizando bloqueio pessimista.
10. Verifica duplicidades e referências, quando necessário.
11. Chama o `WagerProcessorService` para aplicar as regras de negócio.
12. Se houver movimentação financeira, persiste a carteira e o registro de ledger.
13. Persiste a transação e finaliza a operação no banco.

A utilização de uma transação do banco ajuda a manter os registros relacionados consistentes durante o processamento.

## 5. Por que utilizar o Money?

Valores monetários exigem cuidado com operações matemáticas.

O tipo `number` do JavaScript utiliza representação de ponto flutuante, o que pode gerar pequenas diferenças em determinados cálculos.

Por exemplo:

```ts
0.1 + 0.2 !== 0.3
```

Para evitar espalhar esse tipo de cálculo pela aplicação, criei o objeto `Money`, que centraliza o tratamento de valores e moedas.

A ideia é manter as operações financeiras em um único lugar e facilitar a aplicação das regras do negócio.

## 6. Como funciona a idempotência?

A idempotência foi implementada para evitar que uma mesma requisição provoque movimentações duplicadas.

O cliente envia uma chave no header `Idempotency-Key`.

A aplicação gera um hash dos dados da requisição e verifica se aquela chave já existe.

Existem dois cenários:

- **Mesma chave e mesmo conteúdo:** a aplicação recupera o resultado da transação anterior.
- **Mesma chave e conteúdo diferente:** a aplicação retorna um conflito.

Também existe uma nova verificação depois do bloqueio da carteira, ajudando a reduzir a possibilidade de processamento duplicado em requisições concorrentes.

## 7. Como foi tratado o acesso simultâneo à carteira?

Imagine duas apostas tentando debitar dinheiro da mesma carteira ao mesmo tempo.

Se as duas operações consultarem o saldo antes de qualquer uma realizar o débito, existe o risco de ambas utilizarem o mesmo saldo disponível.

Para reduzir esse problema, utilizei o bloqueio pessimista (`PESSIMISTIC_WRITE`) ao buscar a carteira durante o processamento.

Na prática, isso faz com que uma operação aguarde a liberação do bloqueio antes de alterar a mesma carteira.

Esse bloqueio é utilizado dentro de uma transação do banco de dados.

## 8. Por que separar o domínio do banco de dados?

Uma das decisões de organização foi manter as entidades de domínio separadas das entidades do MikroORM.

Por exemplo, `Wallet` representa a carteira dentro das regras do negócio, enquanto `WalletEntity` representa como essa carteira é armazenada no PostgreSQL.

Essa separação evita que as regras financeiras dependam diretamente da ferramenta utilizada para persistir os dados.

Também facilita testes e futuras mudanças na infraestrutura.

## 9. Testes

Foram desenvolvidos testes automatizados para verificar o comportamento de componentes importantes, incluindo:

- Operações da classe `Money`.
- Regras de processamento das transações.
- Fluxo de persistência.
- Repositório de carteiras.

Na última execução realizada, os 38 testes passaram sem falhas.

## 10. Próximos passos

Durante o desenvolvimento, alguns requisitos do desafio ficaram pendentes por conta do tempo disponível.

Entre eles estão:

- Integração com AWS SQS.
- Implementação de Inbox e Outbox.
- Workers para processar transações pendentes.
- Retry e Dead Letter Queue.
- Consultas de carteira, ledger e transações.
- Reconciliação de saldo.
- Health checks.
- Testes de integração com PostgreSQL e LocalStack.
- Testes de concorrência com múltiplas instâncias.

Essas melhorias permitiriam evoluir a aplicação para um processamento distribuído mais completo e resiliente.