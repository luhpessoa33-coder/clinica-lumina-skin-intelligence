# LUmina Skin Intelligence — Prontuário Clínico Independente

Esta é uma fonte de trabalho independente para o módulo clínico da **LUmina Skin Intelligence**. A arquitetura definida é **Railway + TiDB Cloud/MySQL + Cloudflare R2 privado**. Ela não depende de banco, armazenamento ou autenticação da Manus.

## Escopo desta versão

O código contém acesso individual, papéis de SUPER ADM e profissional, pacientes com nome completo e CPF cifrado, consentimento de imagem, avaliação, evolução, fotos privadas, catálogo de produtos, procedimentos com associação manual de produtos, orçamento e trilha de auditoria.

O orçamento é uma saída comercial separada. Sua impressão não inclui CPF, fotografia, avaliação, evolução, nota interna ou associação de produtos.

## Segurança por padrão

- O banco usa Drizzle com dialeto MySQL/TiDB, não PostgreSQL.
- CPF e contato são cifrados no servidor; a verificação de duplicidade usa HMAC.
- Fotos são enviadas para R2 por URL pré-assinada curta, vinculada a consentimento de imagem ativo.
- O bucket clínico deve permanecer privado, sem `r2.dev` ou domínio público.
- Sessões são registradas e revogáveis. O cookie é `HttpOnly` e `SameSite=Strict`.
- Eventos relevantes geram trilha de auditoria.

## Antes de publicar

Leia [`docs/LEIA_PRIMEIRO_DEPLOY_RAILWAY.md`](docs/LEIA_PRIMEIRO_DEPLOY_RAILWAY.md), [`docs/IMPLEMENTACAO_INDEPENDENTE_V1.md`](docs/IMPLEMENTACAO_INDEPENDENTE_V1.md) e [`docs/OPERACAO_E_MANUTENCAO.md`](docs/OPERACAO_E_MANUTENCAO.md). A titular mantém 2FA e cadastra as variáveis diretamente no Railway. Não inclua `.env`, chaves, URL de banco, dumps, CPF, fotos ou exportações no repositório.

O arquivo [`docs/R2_CORS_TEMPLATE.json`](docs/R2_CORS_TEMPLATE.json) deve receber somente os domínios HTTPS aprovados antes de habilitar upload no navegador.

## Comandos de manutenção

```bash
pnpm install --no-frozen-lockfile
pnpm verify:config
pnpm db:generate
pnpm db:migrate
pnpm check
pnpm build
```

Execute os comandos somente em ambiente controlado e com variáveis configuradas fora do Git. Primeiro use banco e bucket de teste com dados fictícios. Migrações e teste de restauração devem ser aprovados antes de qualquer dado real.

## Estado de validação

O TypeScript e o build de produção foram validados localmente. A migração MySQL/TiDB foi gerada, mas a aplicação dela, o teste integrado com contas próprias, a entrada de dados reais e o DNS aguardam o roteiro controlado. Nenhuma credencial, dado clínico ou segredo pertence ao repositório.
