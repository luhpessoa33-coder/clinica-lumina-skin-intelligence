# LUmina Skin Intelligence — Implementação Clínica Independente v1

**Autoria:** Manus AI
**Estado:** fonte preparada e sem dados reais, sem credenciais, sem publicação
**Arquitetura aprovada:** Railway + TiDB Cloud com dialeto MySQL + Cloudflare R2 privado

> **Roteiro operacional vigente:** consulte primeiro [`LEIA_PRIMEIRO_DEPLOY_RAILWAY.md`](LEIA_PRIMEIRO_DEPLOY_RAILWAY.md). Ele substitui instruções legadas de Firebase, PostgreSQL e senha bootstrap.

## Resultado desta fase

Esta versão separa a operação clínica do ambiente Manus e organiza a base para um prontuário que registre **nome completo, CPF, avaliações, evolução, consentimentos, fotos privadas, produtos, procedimentos e orçamento comercial**. O repositório-fonte foi localizado como `luhpessoa33-coder/clinica-lumina-skin-intelligence`; a cópia de trabalho independente foi criada em diretório separado para não alterar o repositório encontrado.

A aplicação não usa Firestore, Supabase ou PostgreSQL. O schema foi refeito para **TiDB Cloud/MySQL com Drizzle**. Nenhuma conta foi criada, nenhuma chave foi recebida, nenhum dado de paciente foi usado e nenhum deploy foi executado.

## Módulos entregues no código

| Módulo | Implementação nesta versão | Limite de segurança |
|---|---|---|
| Acesso | Sessões individuais de 12 horas, cookie `HttpOnly`, `SameSite=Strict`, limitação de tentativas de login e revogação de sessão no banco | A criação e o ciclo de vida de usuários profissionais precisam ser ativados pela SUPER ADM antes de uso real |
| Papéis | `super_admin`, `admin` e `professional`; catálogo é restrito à SUPER ADM | A matriz final de permissões ainda deve ser revisada pela titular |
| Pacientes | Nome completo, CPF, nascimento opcional e contato opcional | CPF e contato são cifrados no servidor; a pesquisa por CPF usa impressão HMAC, não texto claro |
| Avaliação e evolução | Registro estruturado, alertas, linha do tempo e notas internas | O sistema não diagnostica, não prescreve e não escolhe procedimentos automaticamente |
| Fotos clínicas | Consentimento ativo obrigatório, upload direto para R2 privado, URL temporária, metadata, tamanho, MIME e checksum | O bucket não pode ser publicado nem receber domínio público |
| Catálogo interno | Produtos, procedimentos e vínculo manual produto–procedimento | A titular define nomes, valores, descrições e indicações; nada é pré-preenchido |
| Orçamento | Itens, quantidades, valores, descontos, total, emissão e impressão | O documento comercial deliberadamente exclui CPF, fotos, avaliação, notas e evolução |
| Auditoria | Ações de login, criação, visualização de linha do tempo, consentimento, foto, catálogo e orçamento | A política de retenção e revisão de logs deve ser formalizada antes de operação |

> **Definição operacional.** O prontuário é privado por padrão. A fotografia só recebe uma URL de upload após consentimento clínico de imagem ativo; a URL é válida por cinco minutos, é vinculada a um único objeto e não expõe credenciais do bucket.

## Fluxo de dados e privacidade

O navegador envia CPF e contato somente para a rota autenticada da aplicação. O servidor valida o CPF, cifra o valor com AES-256-GCM e persiste uma impressão HMAC para impedir duplicidade sem armazenar um índice em texto claro. A chave de cifra existe exclusivamente como variável de ambiente do serviço Railway e não deve ser enviada em chat, commit, arquivo público ou frontend.

Fotos não passam como base64 pela API do prontuário. Após validar o paciente e o consentimento de imagem, o backend gera uma URL pré-assinada de curta duração para um objeto sob o prefixo `patients/<uuid>/`. A foto segue diretamente do dispositivo para o bucket R2 privado. O backend confirma tamanho, tipo e checksum antes de gravar a referência no TiDB. A imagem não recebe URL pública permanente.

O orçamento é montado a partir de itens comerciais e do nome completo do paciente. A janela de impressão gera um documento comercial contendo somente o nome, validade, itens, quantidade, valores, descontos, total e mensagem comercial. Ela não recebe notas privadas, fotografia, CPF, avaliação ou evolução.

## Preparação das contas pela titular

A titular deve criar as contas com 2FA e guardar todos os segredos diretamente em seu gerenciador de senhas. Esta etapa não exige que qualquer valor seja enviado ao agente.

No **TiDB Cloud**, crie um cluster MySQL compatível, registre a política de acesso à rede e obtenha a string de conexão somente para uso no Railway. Em conexão direta por MySQL/TCP, configure TLS no cliente. Para ambientes persistentes como Railway, a conexão MySQL direta é a alternativa natural; o Serverless Driver tem finalidade própria para edge/serverless e está em preview. [1] [2]

No **Cloudflare R2**, crie um bucket dedicado e privado, sem domínio customizado e sem `r2.dev`. Gere um token dedicado, restrito exclusivamente ao bucket clínico e com a menor permissão necessária. O backend precisará de leitura e gravação de objetos para gerar URLs pré-assinadas e verificar o arquivo; o navegador nunca recebe esse token. [3] [4]

Depois de obter a URL Railway de teste, configure o CORS do bucket a partir de [`R2_CORS_TEMPLATE.json`](R2_CORS_TEMPLATE.json). Substitua os dois placeholders por origens HTTPS específicas; não use curinga. O upload assinado exige `content-type` e `x-amz-checksum-sha256`. A API S3 do R2 documenta suporte aos tipos de checksum, e o código assina e confere SHA-256 para reduzir o risco de registrar um arquivo diferente do autorizado. [7]

No **Railway**, crie um serviço a partir da branch `clinica-independente-v1`. O `Dockerfile` já declara a porta 3000 e a configuração `railway.json` usa o endpoint `/readyz`. O Railway injeta `PORT`; o serviço deve escutá-la e responder 2xx ao healthcheck somente após a configuração e o banco estarem prontos. [5] [6]

## Variáveis de ambiente por nome

Cadastre estes nomes no painel privado do Railway. **Não cole os valores em conversa, Git ou arquivo público.**

| Variável | Finalidade | Onde fica |
|---|---|---|
| `DATABASE_URL` | String MySQL/TiDB do banco próprio | Serviço Railway |
| `DATABASE_SSL` | Deve permanecer `true`, salvo condição técnica documentada | Serviço Railway |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Validação do certificado TLS | Serviço Railway |
| `JWT_SECRET` | Assinatura dos tokens de sessão | Serviço Railway |
| `DATA_ENCRYPTION_KEY` | Chave base64 de 32 bytes para cifrar CPF e contato | Serviço Railway; cofre da titular |
| `OWNER_EMAIL` | E-mail único autorizado ao primeiro acesso SUPER ADM | Serviço Railway |
| `BOOTSTRAP_ADMIN_NAME` | Nome exibido da SUPER ADM | Serviço Railway |
| `APP_BASE_URL` | URL HTTPS temporária Railway ou domínio aprovado | Serviço Railway |
| `RESEND_API_KEY` | Segredo do envio do link por e-mail | Serviço Railway; cofre da titular |
| `AUTH_EMAIL_FROM` | Remetente verificado no Resend | Serviço Railway |
| `S3_ENDPOINT` | Endpoint da conta R2 no formato S3 | Serviço Railway |
| `S3_REGION` | Região compatível do R2; normalmente `auto` | Serviço Railway |
| `S3_BUCKET` | Nome do bucket clínico privado | Serviço Railway |
| `S3_ACCESS_KEY_ID` | Identificador de token R2 restrito | Serviço Railway |
| `S3_SECRET_ACCESS_KEY` | Segredo do token R2 restrito | Serviço Railway; cofre da titular |
| `UPLOAD_MAX_BYTES` | Limite de foto por arquivo; padrão de 10 MB | Serviço Railway |
| `PORT` | Porta de execução; Railway a injeta | Railway |
| `NODE_ENV` | Definir como `production` após a validação | Railway |

## Sequência de implantação controlada

1. Crie o banco e bucket em contas próprias. Não importe nenhum dado antes de testar o ambiente vazio.
2. Coloque os valores exclusivamente no painel privado de variáveis do Railway. O primeiro teste deve ocorrer com dados fictícios, não clínicos.
3. Rode a geração e aplicação de migrações Drizzle apontando para o TiDB da titular. Revise o SQL gerado antes de aplicá-lo. Como o projeto usa dialeto MySQL, a migração deve ser tratada como DDL versionado e testada primeiro em ambiente sem dados.
4. Faça o primeiro deploy para uma URL temporária Railway. Configure essa URL como `APP_BASE_URL`, confirme `GET /readyz` com HTTP 200 e solicite o primeiro link de acesso pelo `OWNER_EMAIL` configurado diretamente no Railway.
5. Teste com dados fictícios: criar paciente, registrar consentimento, registrar avaliação, adicionar evolução, enviar uma imagem fictícia, criar orçamento e salvar como PDF. Verifique que a impressão não contém dados internos.
6. Só após validação funcional e revisão de privacidade, migre dados existentes por procedimento local e controlado. Dumps, fotos, CPF, URLs, chaves e dados clínicos não circulam por chat, Git nem arquivos públicos.
7. Aponte domínio ou DNS apenas com autorização escrita específica. Esta entrega não altera domínio, Firebase, DNS ou ambiente de produção.

## Controles que devem permanecer ativos

O bucket de fotos deve permanecer privado. A documentação do R2 informa que buckets não são públicos por padrão, mas um bucket pode ficar exposto quando se habilita acesso público; por isso, não habilite `r2.dev` ou domínio público para o armazenamento clínico. [3] As URLs pré-assinadas devem ser tratadas como tokens bearer: qualquer pessoa que tenha uma URL válida pode executar a operação até expirar. [4]

O backend deve usar TLS em conexão ao TiDB e o banco deve manter restrição de rede adequada ao plano contratado. TiDB é compatível com grande parte da sintaxe MySQL 5.7/8.0, mas tem exceções. Não acrescente recursos dependentes de triggers, stored procedures ou UDFs sem validar sua compatibilidade específica. [2]

A implantação deve rejeitar versões que não respondam ao healthcheck. O Railway só ativa a versão após resposta 2xx no endpoint configurado. [6] O healthcheck confirma inicialização; ele não substitui monitoramento, backups, testes de restauração ou trilha de auditoria.

## Itens pendentes antes de dados reais

A base técnica não substitui revisão jurídica, de LGPD e de escopo profissional. Antes de guardar dados reais, a titular deve aprovar a finalidade, base legal, versão dos termos, retenção, descarte, exportação, correção de dados, política de resposta a incidente, cópias de segurança e teste de restauração. A assinatura de termo e os dados de profissional responsável devem ser definidos pela titular; não foram inventados pelo código.

A implementação contém a trilha de auditoria de eventos relevantes, mas ainda requer uma tela de consulta e exportação da auditoria, fluxo de criação/desativação de profissionais pela SUPER ADM, e testes integrados com uma conta TiDB e R2 da titular. O acesso foi definido exclusivamente por link de uso único enviado por e-mail, sem senha bootstrap. Esses passos dependem das contas próprias e da autorização de implantação.

## Evidência de validação desta fase

A validação TypeScript e o build de produção foram executados sem erros. A migração MySQL/TiDB foi gerada no repositório e aguarda revisão final e aplicação controlada em TiDB vazio. O teste integrado continua pendente porque não usa e não recebe credenciais fora dos painéis privados. O `Dockerfile` está preparado para o build isolado do Railway.

## Referências

[1]: https://docs.pingcap.com/tidbcloud/connect-to-tidb-cluster-serverless/ "Connect to TiDB Cloud Serverless"
[2]: https://docs.pingcap.com/tidbcloud/tidb-cloud-faq/ "TiDB Cloud Frequently Asked Questions"
[3]: https://developers.cloudflare.com/r2/buckets/public-buckets/ "Public buckets · Cloudflare R2 docs"
[4]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ "Presigned URLs · Cloudflare R2 docs"
[5]: https://docs.railway.com/builds/dockerfiles "Dockerfiles · Railway documentation"
[6]: https://docs.railway.com/deployments/healthchecks "Healthchecks · Railway documentation"
[7]: https://developers.cloudflare.com/r2/api/s3/api/ "S3 API compatibility · Cloudflare R2 docs"
