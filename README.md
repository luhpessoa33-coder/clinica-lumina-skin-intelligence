# Clínica Lumina Skin Intelligence

Painel privado de implantação arquitetônica, financeira e operacional da clínica. Esta edição é **independente de plataforma**: usa React, Node.js, tRPC, PostgreSQL, armazenamento S3 compatível e autenticação administrativa própria.

## Capacidades

| Módulo | Conteúdo |
|---|---|
| Anteprojeto | Alternativas de 60 m² e 45 m², plantas, cortes, fachadas, instalações, acessibilidade e maquetes |
| Orçamento | Cenários, contingência, previsto, cotado, contratado, pago e fluxo de 18 meses |
| Implantação | Cronograma de maio de 2027 a outubro de 2028, tarefas, responsáveis e bloqueios |
| Compras | Equipamentos, insumos, mobiliário, fornecedores e validações sanitárias |
| Biossegurança | POP mestre, placas, resíduos, processamento e cadeia fria condicional |
| Documentos | Biblioteca local e anexos enviados a armazenamento S3 compatível |

> O conteúdo arquitetônico é um anteprojeto-base. A execução exige levantamento do terreno, projeto executivo, responsabilidade técnica e validação das autoridades locais.

## Instalação local

Copie `.env.example` para `.env`, substitua todos os valores de exemplo e gere o hash da senha com `pnpm password:hash 'SUA-SENHA-FORTE'`. Mantenha o hash entre aspas simples no `.env`, pois ele contém sinais `$`. Instale as dependências com `pnpm install`, inicie PostgreSQL e um armazenamento S3 compatível, crie o bucket indicado por `S3_BUCKET` e execute `pnpm db:migrate`. Depois, use `pnpm dev`.

Para infraestrutura local, o arquivo `docker-compose.yml` fornece aplicativo, PostgreSQL e MinIO, cria o bucket privado e executa a migração antes de iniciar. Depois de preencher `.env`, rode `docker compose up --build`. O painel estará em `http://localhost:3000` e o console do MinIO em `http://localhost:9001`.

## Variáveis obrigatórias

| Variável | Finalidade |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL |
| `JWT_SECRET` | Assinatura da sessão; mínimo de 32 caracteres |
| `ADMIN_EMAIL` | Único e-mail com credencial de bootstrap |
| `ADMIN_ALLOWLIST` | Lista explícita de administradores autorizados |
| `ADMIN_PASSWORD_HASH` | Hash `scrypt`, nunca a senha em texto |
| `S3_*` | Bucket para anexos e documentos enviados |
| `CRON_SECRET` | Proteção do endpoint de avisos |

## Produção

Use um serviço que execute contêiner Node.js, um PostgreSQL gerenciado e um bucket S3 compatível. Configure HTTPS antes do primeiro login. Execute as migrações no processo de entrega, mantenha backup automático do PostgreSQL e política de versionamento/retenção no bucket. Os modelos de integração contínua e avisos estão em `deployment-examples/github-actions`. Para ativá-los, copie os arquivos `.yml.example` para `.github/workflows`, remova a extensão `.example` e cadastre `APP_URL` e `CRON_SECRET` em **Settings → Secrets and variables → Actions**.

Não envie `.env`, backups, prontuários, imagens de pacientes ou dados pessoais ao Git. O painel foi concebido para implantação da clínica; ele não é um prontuário eletrônico.
