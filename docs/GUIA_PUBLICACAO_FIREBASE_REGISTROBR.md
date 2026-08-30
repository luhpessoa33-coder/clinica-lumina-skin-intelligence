# Publicação da Clínica Lumina Skin Intelligence

Este guia publica o código do repositório privado no endereço principal `luminaskinintelligence.com.br`. A arquitetura recomendada usa **Firebase Hosting** para a interface, **Cloud Run** para o servidor Node.js, PostgreSQL gerenciado para os dados e um bucket S3 compatível para anexos. O GitHub permanece como repositório privado; ele não é o servidor da aplicação.

> Não envie senhas, chaves, tokens, arquivos `.env`, dados de pacientes ou backups para o GitHub. Os valores secretos devem ser cadastrados na hospedagem, no Firebase/Google Cloud Secret Manager ou no painel do provedor de banco e armazenamento.

## 1. Antes de começar

Você precisará de uma conta Google com acesso a um projeto Google Cloud/Firebase, um meio de pagamento habilitado no Google Cloud para o Cloud Run e o banco, acesso administrativo ao Registro.br e, se o domínio já tiver e-mail, acesso à lista atual de registros MX, SPF, DKIM e DMARC. O projeto técnico já está em:

`https://github.com/luhpessoa33-coder/clinica-lumina-skin-intelligence`

No GitHub, abra **Code → HTTPS** e copie a URL de clone. Não altere a visibilidade do repositório.

## 2. Criar ou selecionar o projeto Firebase

Abra o [console do Firebase](https://console.firebase.google.com/), crie um projeto ou selecione um projeto existente e registre o **Project ID**. No [console do Google Cloud](https://console.cloud.google.com/), confirme que a cobrança está habilitada. Use a região `southamerica-east1` para manter o serviço próximo do Brasil, se essa região estiver disponível no seu projeto e for compatível com os demais serviços.

Ative as APIs de Cloud Run, Cloud Build, Artifact Registry, Secret Manager e Cloud SQL, caso use o banco do Google. A documentação oficial do Cloud Run exige projeto Google Cloud, permissões adequadas e cobrança habilitada para o fluxo de implantação de contêineres [1].

## 3. Criar o banco PostgreSQL

Escolha um PostgreSQL gerenciado. Para permanecer no ecossistema Google, crie uma instância no Cloud SQL; outra opção é um provedor PostgreSQL gerenciado que forneça uma `DATABASE_URL` TLS.

Crie o banco `lumina`, um usuário exclusivo da aplicação e uma senha forte. Ative backups automáticos, retenção compatível com sua necessidade e SSL/TLS. Anote somente os dados de configuração em um gerenciador seguro. Não coloque a URL completa com senha no GitHub.

No Cloud Run, preencha `DATABASE_URL` pela área **Variables & Secrets**. Se o provedor exigir certificado próprio, use `DATABASE_SSL=true`, `DATABASE_SSL_REJECT_UNAUTHORIZED=true` e `DATABASE_CA` conforme a documentação do provedor. Para Cloud SQL, prefira a conexão oficial por instância/Unix socket ou o conector recomendado pelo Google, em vez de liberar o banco para a Internet inteira.

## 4. Criar o armazenamento de anexos

Crie um bucket privado em um serviço S3 compatível e gere uma chave de acesso restrita somente ao bucket da clínica. Preencha no Cloud Run:

| Variável | Conteúdo |
|---|---|
| `S3_ENDPOINT` | endpoint S3 do provedor |
| `S3_REGION` | região do bucket |
| `S3_BUCKET` | nome do bucket privado |
| `S3_ACCESS_KEY_ID` | chave criada para a aplicação |
| `S3_SECRET_ACCESS_KEY` | segredo da chave |

Mantenha o bucket privado. O painel gera URLs temporárias para download de anexos. Ative versionamento e retenção/backup conforme a política definida para a clínica.

## 5. Preparar os segredos da aplicação

No Cloud Run, cadastre os seguintes valores em **Variables & Secrets**:

| Variável | Como preencher |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `8080` — o servidor usa essa porta no contêiner |
| `JWT_SECRET` | segredo aleatório longo, nunca reutilizado |
| `ADMIN_EMAIL` | e-mail administrativo autorizado |
| `ADMIN_ALLOWLIST` | um ou mais e-mails autorizados, separados por vírgula |
| `ADMIN_PASSWORD_HASH` | hash gerado localmente com `pnpm password:hash 'SUA-SENHA'` |
| `CRON_SECRET` | segredo longo usado pelo aviso diário |
| `DATABASE_URL` | URL do PostgreSQL |
| `DATABASE_SSL` | `true` quando exigido pelo provedor |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `true` em produção, salvo orientação explícita do provedor |
| `DATABASE_CA` | certificado CA, se exigido |
| `S3_ENDPOINT` | endpoint do armazenamento |
| `S3_REGION` | região do armazenamento |
| `S3_BUCKET` | bucket privado |
| `S3_ACCESS_KEY_ID` | chave do bucket |
| `S3_SECRET_ACCESS_KEY` | segredo do bucket |
| `OWNER_NAME` | nome operacional para avisos |
| `OWNER_EMAIL` | e-mail que receberá avisos, se configurado |
| `WEBHOOK_URL` | opcional, endpoint de notificação seguro |

Para gerar o hash sem expor a senha no repositório, clone o projeto em um computador confiável, rode `pnpm install` e execute `pnpm password:hash 'SUA-SENHA-FORTE'`. Copie somente o resultado para o campo de segredo. Nunca use a senha temporária dos testes.

## 6. Publicar o servidor no Cloud Run

Instale o [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), faça login com `gcloud auth login`, selecione o projeto com `gcloud config set project SEU_PROJECT_ID` e abra a pasta clonada.

Na primeira implantação, você pode usar o console: abra **Cloud Run → Deploy container → Deploy one revision from an existing container image** depois de construir/publicar a imagem, ou use o fluxo **Deploy from source** quando disponível. O repositório contém `Dockerfile`, `package.json`, migração PostgreSQL e o comando de inicialização. A documentação oficial confirma que Cloud Run implanta contêineres por serviço e permite selecionar região e autenticação [1].

Se usar a CLI e o fluxo de origem disponível no seu projeto, o comando-base é:

```bash
gcloud run deploy clinica-lumina-skin-intelligence \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated
```

Depois da criação, abra **Edit & deploy new revision → Variables & Secrets** e cadastre todos os valores da seção 5. Não coloque segredos diretamente no comando salvo no histórico do terminal. Confirme que o serviço está saudável e copie a URL HTTPS do Cloud Run.

A aplicação executa a migração antes de iniciar. Em produção, execute migrações somente de forma controlada e faça backup antes de alterar o esquema. Faça primeiro um teste em uma revisão/projeto separado quando houver dados reais.

## 7. Publicar a interface no Firebase Hosting

No computador local, dentro do projeto:

```bash
pnpm install
pnpm build
npm install -g firebase-tools
firebase login
firebase use SEU_PROJECT_ID
firebase deploy --only hosting
```

O arquivo `firebase.json` já aponta o diretório `dist/public` e encaminha `/api/**` para o serviço Cloud Run chamado `clinica-lumina-skin-intelligence`, na região `southamerica-east1`. Se você escolher outro nome ou região para o Cloud Run, edite esses dois campos antes do deploy.

Após o deploy, teste primeiro o endereço provisório do Firebase. O login deve aparecer e a chamada de API deve retornar pelo rewrite para o Cloud Run. Se a interface abrir, mas o login falhar, verifique primeiro o nome do serviço, a região, o `DATABASE_URL`, o `JWT_SECRET` e os logs do Cloud Run.

## 8. Conectar `luminaskinintelligence.com.br` no Firebase

No console do Firebase, abra **Hosting → seu site → Add custom domain** e informe:

`luminaskinintelligence.com.br`

O Firebase exibirá os valores específicos de verificação e os registros de apontamento. Copie exatamente os valores mostrados no assistente; não invente IPs ou nomes. O Firebase exige um registro TXT de propriedade que deve permanecer no DNS para autorizar a emissão e renovação do certificado SSL [2].

Escolha **Advanced setup** se o domínio já estiver sendo usado por um site. Escolha **Quick setup** somente se não houver tráfego atual ou se você aceitar a troca durante a janela de propagação.

## 9. Inserir os registros no Registro.br

1. Acesse [Registro.br](https://registro.br/), entre na conta e abra **Domínios → luminaskinintelligence.com.br**.
2. Abra **DNS** ou **Configurar zona DNS**. Se o Registro.br estiver usando os servidores DNS próprios do domínio, selecione a edição avançada.
3. Adicione o **TXT de verificação** exatamente como o Firebase mostrou. No domínio raiz, o campo Host pode aparecer como `@`, vazio ou o próprio domínio, conforme o editor; siga a forma aceita pelo Registro.br.
4. Adicione os registros **A/AAAA ou CNAME** que o assistente do Firebase mostrar para o domínio raiz e, se desejar, `www`.
5. Não remova registros **MX, SPF, DKIM ou DMARC** existentes. Eles são necessários para o e-mail. Remova somente apontamentos antigos de site que entrem em conflito com o Firebase, e somente depois de confirmar que não são usados por outro serviço.
6. Salve a zona e volte ao Firebase para clicar em **Verify**. O Registro.br informa publicação DNS em poucos minutos e propagação/alterações entre modos que podem levar mais tempo [3]. O Firebase informa que a emissão do certificado pode levar algumas horas e, em casos extremos, até 24 horas [2].

Se o Firebase solicitar CAA, adicione somente os valores exibidos pelo assistente. Não altere DNSSEC ou servidores autoritativos sem entender o impacto e sem preservar os registros de e-mail.

## 10. Testar o domínio

Depois que o Firebase indicar **Connected**, teste:

| Teste | Resultado esperado |
|---|---|
| `https://luminaskinintelligence.com.br` | tela de login da Clínica Lumina Skin Intelligence |
| Login administrativo | acesso ao painel e cookie seguro |
| Lista de planejamento | itens e módulos carregados |
| Upload de anexo | arquivo no bucket privado e URL temporária |
| Logout | cookie invalidado |
| `https://www.luminaskinintelligence.com.br` | conteúdo ou redirecionamento conforme configurado |
| E-mail existente | recebimento e envio preservados |

Faça o primeiro login somente quando o HTTPS estiver ativo. Não use HTTP para produção.

## 11. Ativar avisos diários

Os arquivos-modelo estão em `deployment-examples/github-actions`. Após confirmar o Cloud Run e o domínio, copie o modelo de CI para `.github/workflows/ci.yml` e o modelo de avisos para `.github/workflows/daily-alerts.yml`. No GitHub, abra **Settings → Secrets and variables → Actions** e cadastre `APP_URL` e `CRON_SECRET`. O workflow de avisos chama o endpoint autenticado `/api/scheduled/plannerAlerts`.

Antes de ativar, teste manualmente uma chamada com o segredo correto e confirme que o endpoint retorna sucesso. O workflow não deve conter senha, token de banco ou chave S3.

## 12. Rotina de operação e backup

Mantenha backup automático do PostgreSQL, versionamento do bucket, revisão mensal de usuários autorizados e rotação periódica de `JWT_SECRET`, `CRON_SECRET` e chaves S3. Antes de cada alteração de esquema, faça backup e registre a mudança. Não armazene prontuários, fotos de pacientes ou documentos clínicos no GitHub; o painel de planejamento não substitui um prontuário eletrônico.

### Referências

[1]: https://docs.cloud.google.com/run/docs/quickstarts/deploy-container "Google Cloud — Quickstart: Deploy to Cloud Run"
[2]: https://firebase.google.com/docs/hosting/custom-domain "Firebase — Connect a custom domain"
[3]: https://registro.br/tecnologia/caracteristicas-tecnicas/ "Registro.br — Características Técnicas"
