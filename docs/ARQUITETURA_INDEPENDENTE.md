# Arquitetura independente — Clínica Lumina Skin Intelligence

O projeto será distribuído como uma aplicação Node.js única, com frontend React, API tRPC e banco PostgreSQL. Nenhum fluxo de autenticação, arquivo, alerta ou cron dependerá da Manus.

| Capacidade | Implementação portátil | Variáveis |
|---|---|---|
| Autenticação | E-mail e senha com hash `scrypt`, sessão JWT em cookie HttpOnly e allowlist de administradores | `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_ALLOWLIST` |
| Banco | PostgreSQL via `pg` e Drizzle ORM | `DATABASE_URL` |
| Arquivos | S3, Cloudflare R2, Backblaze B2 ou MinIO por API S3 compatível | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` |
| Alertas | Webhook HTTPS opcional | `ALERT_WEBHOOK_URL` |
| Agendamento | POST autenticado por segredo, acionável por GitHub Actions, cron-job.org ou cron do provedor | `CRON_SECRET` |
| Ativos técnicos | PDFs, planilha e imagens versionados em `client/public/assets` | nenhuma |

## Regras de segurança

O repositório não armazenará senhas, tokens, cookies, CPFs, prontuários ou dados de pacientes. O login exige e-mail presente na `ADMIN_ALLOWLIST`; a senha será guardada somente como hash `scrypt`. O cookie de sessão será `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Uploads terão limite de 10 MB e serão enviados a um bucket privado ou público conforme configuração explícita.

## Migração

O conjunto inicial do planejamento continuará sendo criado deterministicamente no primeiro acesso do administrador. Dados personalizados poderão ser exportados em JSON pelo backend atual e importados no PostgreSQL independente. Anexos deverão ser copiados ao bucket S3 escolhido, mantendo apenas chave, URL e metadados no banco.

## Implantação

O repositório incluirá `Dockerfile`, `docker-compose.yml`, `.env.example`, migrações PostgreSQL e instruções para desenvolvimento local e produção. A aplicação poderá ser hospedada em qualquer serviço que execute contêiner Node.js e permita conexão com PostgreSQL e S3 compatível.
