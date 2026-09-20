# Gate de migração TiDB/MySQL — LUmina Clínica

## Situação correta do repositório

As migrações PostgreSQL herdadas foram removidas da cópia independente porque são incompatíveis com a arquitetura definida. O diretório de migrações está propositalmente vazio. Isso impede que um comando antigo altere TiDB com DDL de outro banco.

> **Regra:** não execute `pnpm db:migrate` enquanto não existir uma migração MySQL/TiDB gerada, revisada e testada em homologação. Banco vazio não é autorização para pular a revisão.

## Processo para o primeiro schema

A titular ou pessoa técnica autorizada prepara um clone local do código, com dependências instaladas e uma `DATABASE_URL` exclusiva de **homologação vazia**. A URL não deve ser compartilhada em chat, Git, print ou documentação. Depois, execute localmente:

```bash
pnpm install --no-frozen-lockfile
pnpm verify:config
pnpm db:generate
```

A primeira instalação também gera o lockfile que deve ser revisado e versionado. Depois disso, os ambientes de CI e produção devem usar `pnpm install --frozen-lockfile`. A geração cria DDL MySQL a partir de `drizzle/schema.ts`. Revise o SQL linha por linha. Confirme tabelas clínicas, relacionamentos, índices de CPF fingerprint, atribuição profissional–paciente, fotos, consentimentos, modelos de termo, orçamento e auditoria. Confirme também que não há `serial`, `public.`, `timestamp with time zone`, `jsonb`, `RETURNING` ou outro traço PostgreSQL.

Depois da revisão, emita a migração e aplique-a somente ao banco TiDB vazio de homologação:

```bash
pnpm db:migrate
```

Em seguida, inicie a aplicação e execute o roteiro com dados fictícios. O roteiro inclui login bootstrap, criação de paciente fictício, atribuição de profissional, termo rascunho, aprovação de versão, preview, aceite registrado, avaliação, evolução, foto fictícia, catálogo, orçamento e impressão. O endpoint `/readyz` deve responder HTTP 200 somente após conexão ao banco.

## Promoção controlada

Somente a migração já aplicada e aprovada em homologação pode ser versionada no repositório. A produção recebe a mesma migração uma vez, por uma etapa de release controlada e com backup disponível. Migrações não devem executar automaticamente em cada processo Railway, pois múltiplas réplicas podem concorrer e uma falha de schema não deve entrar em tráfego.

O Railway deve usar `/readyz` como healthcheck. Um processo sem banco, sem variável necessária ou sem schema aplicável responde 503 e não deve ser promovido. A plataforma documenta que healthchecks HTTP aguardam resposta 2xx antes de ativar a versão. [1]

## Evidências a registrar fora do chat

A titular guarda localmente a identificação da migração, hash do SQL revisado, data/hora de aplicação, resultado do teste com dados fictícios e confirmação de backup. Não guarde o dump, a URL de banco, CPF, fotos ou segredo no repositório.

## Referências

[1]: https://docs.railway.com/deployments/healthchecks "Healthchecks · Railway documentation"
[2]: https://orm.drizzle.team/docs/kit-overview "Drizzle Kit overview"
[3]: https://docs.pingcap.com/tidbcloud/connect-to-tidb-cluster/ "Connect to TiDB Cloud · PingCAP documentation"
