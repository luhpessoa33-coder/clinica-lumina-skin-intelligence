# Deploy controlado — LUmina Clínica Independente

Este é o roteiro operacional vigente para publicar o prontuário clínico no **Railway**, com banco **TiDB Cloud/MySQL**, arquivos clínicos em **Cloudflare R2 privado** e envio de links de acesso por **Resend**. A versão de produção é a branch `clinica-independente-v1`. Não use roteiros legados de Firebase, PostgreSQL ou senha bootstrap.

## Regra de sigilo

Os valores são inseridos somente no painel privado do Railway. Este repositório, conversas, commits, screenshots públicos e documentação não recebem senhas, URLs de banco, tokens, chaves, CPF, fotos, PDFs assinados, dumps ou dados clínicos.

## Variáveis obrigatórias no Railway

| Nome | Finalidade | Observação |
|---|---|---|
| `DATABASE_URL` | Conexão do TiDB Cloud/MySQL | Deve usar a conexão privada da titular e TLS. |
| `DATABASE_SSL` | Exige TLS no banco | Usar `true` em produção. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Validação de certificado | Manter `true`, salvo orientação documentada do provedor. |
| `JWT_SECRET` | Assina a sessão protegida | Valor privado com pelo menos 32 caracteres. |
| `DATA_ENCRYPTION_KEY` | Cifra CPF e contato | Chave privada base64 que decodifica para 32 bytes. |
| `OWNER_EMAIL` | Único e-mail que pode solicitar o primeiro link | Inserir diretamente no Railway. |
| `BOOTSTRAP_ADMIN_NAME` | Nome exibido da SUPER ADM | Texto administrativo, não é segredo. |
| `APP_BASE_URL` | URL HTTPS temporária Railway, depois domínio aprovado | Necessária para que o link por e-mail retorne à aplicação. |
| `RESEND_API_KEY` | Envio de e-mail de acesso | Segredo mantido apenas no Railway. |
| `AUTH_EMAIL_FROM` | Remetente previamente verificado no Resend | Deve ser um remetente autorizado. |
| `S3_ENDPOINT` | Endpoint S3 da conta R2 | Deve ser HTTPS. |
| `S3_REGION` | Região S3 do R2 | Normalmente `auto`. |
| `S3_BUCKET` | Bucket clínico privado | Não habilitar `r2.dev` nem domínio público. |
| `S3_ACCESS_KEY_ID` | Identificador de token R2 restrito | Privado. |
| `S3_SECRET_ACCESS_KEY` | Segredo de token R2 restrito | Privado. |
| `UPLOAD_MAX_BYTES` | Limite de upload clínico | Máximo suportado pelo código: 20.000.000. |
| `NODE_ENV` | Modo de produção | Usar `production`. |

`GEMINI_API_KEY` e `GEMINI_MODEL` são opcionais. A IA permanece indisponível até existir uma chave no cofre privado e a SUPER ADM ativar o módulo no painel. Não há chave Gemini no frontend.

## Ordem de publicação

Primeiro, no Railway, gere o domínio temporário HTTPS do serviço. Em seguida, insira-o como `APP_BASE_URL` e cadastre as demais variáveis listadas acima diretamente no cofre do Railway. Depois, aplique a migração já revisada no TiDB vazio por um computador controlado da titular. O banco, R2 e Resend devem ser testados apenas com dados fictícios.

A deployment só é considerada apta se `GET /readyz` retornar HTTP 200, o primeiro link chegar ao e-mail proprietário, o login gerar cookie seguro e o roteiro de testes fictícios passar. Fotos e PDFs só podem ser enviados após configurar CORS do bucket com origens HTTPS específicas, conforme `R2_CORS_TEMPLATE.json`.

Somente depois da validação completa da URL temporária poderá ser feita a alteração de DNS no Registro.br. O Railway fornece os valores exatos de CNAME e TXT; não use valores estimados ou registros antigos.

## Acesso inicial e equipe

O sistema não possui senha inicial. A tela de entrada aceita um e-mail, mas apenas o valor em `OWNER_EMAIL` cria a primeira conta `super_admin` e recebe um link único válido por 20 minutos. A SUPER ADM poderá então criar convites de administradores e profissionais, atribuir papel, manter o quadro de funcionários e controlar a agenda.

## Evidências a guardar localmente

Guarde localmente a data/hora do deploy, o identificador da migração aplicada, o hash do SQL revisado, os resultados dos testes com dados fictícios, o status HTTP de `/readyz`, o teste de recuperação de arquivo e os registros de backup. Não guarde dados clínicos ou segredos como evidência em Git ou chat.
