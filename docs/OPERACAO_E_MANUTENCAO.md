# Operação e manutenção simples — LUmina Clínica Independente

**Objetivo:** permitir que a titular mantenha a aplicação com segurança e previsibilidade, sem editar código ou expor dados de pacientes em rotinas comuns.

## Princípio de manutenção

A manutenção está organizada em quatro camadas que não se misturam. A titular gerencia **conteúdo comercial e catálogo** dentro do aplicativo. Profissionais registram somente o que seus papéis permitem. A infraestrutura fica concentrada em três consoles próprios: TiDB para banco, R2 para arquivos e Railway para execução e variáveis. O código fica no repositório privado ou público escolhido pela titular, sem `.env`, fotos, exportações ou prontuários.

As configurações técnicas foram centralizadas em `server/_core/env.ts`. O script `pnpm verify:config` verifica a presença e o formato das variáveis obrigatórias, mas não exibe seus valores. Ele deve ser executado no ambiente privado ou por meio de um processo de build controlado; nunca em chat ou em captura pública.

## Rotina operacional sugerida

| Periodicidade | Ação | Resultado esperado |
|---|---|---|
| A cada atendimento | Confirmar o paciente, o consentimento de imagem e o profissional logado antes de registrar foto | Foto somente com consentimento clínico ativo e trilha de auditoria |
| Semanal | Revisar as contas ativas e desativar imediatamente profissional que perdeu autorização | Menor privilégio preservado |
| Mensal | Conferir as últimas entradas da auditoria, o uso do bucket e os alertas de Railway | Acesso ou crescimento anormal identificado cedo |
| Mensal | Atualizar catálogo, procedimentos, preços e links de pagamento exclusivamente pela SUPER ADM | Conteúdo comercial sob controle da titular |
| Trimestral | Aplicar atualizações de dependências em uma cópia de teste e rodar testes com dados fictícios | Atualização sem risco ao prontuário ativo |
| Trimestral | Restaurar uma cópia de teste do banco e uma foto fictícia em ambiente isolado | Backup comprovadamente restaurável |
| Quando houver incidente | Revogar sessão, desativar conta, rotacionar segredo afetado, registrar o evento e avaliar comunicação aplicável | Contenção rastreável e proporcional |

## Atualizações de código sem susto

Toda atualização deve começar em uma cópia de teste. Atualize dependências, gere o build, aplique migrações apenas no banco de teste e execute o roteiro fictício completo: login, criação de paciente fictício, consentimento fictício, avaliação, evolução, foto fictícia e orçamento. Só depois aprove a implantação de produção.

O Railway aceita alterações por Dockerfile e trata mudanças de variáveis como alterações staged. Revise cada alteração antes de publicar. A aplicação escuta a porta fornecida por `PORT` e possui `/healthz` para impedir que uma versão sem resposta seja ativada. [1] [2]

Migrations são parte do código. Nunca edite manualmente tabelas de produção para “corrigir rápido”. Gere e revise a migração, teste em banco vazio ou cópia isolada, depois aplique uma única vez em produção. Mantenha o arquivo de migração versionado junto ao código, mas nunca inclua dump, CPF, foto, segredo ou URL de banco.

## Rotação e recuperação de acesso

A senha de um profissional não deve ser compartilhada. Cada pessoa recebe uma conta individual. Quando uma pessoa sai da equipe, a SUPER ADM desativa a conta e revoga as sessões correspondentes. Para suspeita de acesso indevido, altere o segredo de sessão, invalide sessões, troque a senha da conta afetada e revise a auditoria.

Se uma credencial R2 ou TiDB for comprometida, gere uma substituta no console da titular, atualize somente a variável correspondente no Railway e teste a aplicação. Depois revogue a credencial anterior. O token R2 deve permanecer restrito ao bucket clínico; a documentação do R2 recomenda menor privilégio e registra que o segredo só aparece no momento de criação. [3]

## Backup e restauração

O backup não é considerado concluído quando apenas existe. É necessário restaurá-lo. Mantenha exportações criptografadas do banco em armazenamento privado da titular e documente data, hash, tabelas e resultado da restauração de teste. Para o bucket R2, mantenha inventário de objetos, contagem, hash disponível e cópia controlada conforme política de retenção aprovada.

A restauração deve ser ensaiada fora da produção. Crie banco de teste, importe dados fictícios ou cópia autorizada, verifique login, lista de pacientes, linha de evolução, orçamento e abertura temporária de uma foto. Ao final, elimine o ambiente de teste conforme a política aprovada. Não envie backups ou evidências clínicas pelo chat.

## Manutenção de fotos e consentimentos

O bucket clínico é privado. Não habilite `r2.dev`, domínio público ou URL permanente para essas imagens. A aplicação emite URLs pré-assinadas específicas e curtas para upload e visualização, e essas URLs devem ser tratadas como tokens temporários. [4] O modelo CORS entregue restringe as origens e os métodos necessários; substitua os placeholders pelos domínios efetivamente aprovados antes de habilitar foto no navegador.

A alteração de um termo de imagem deve aumentar a versão do documento. A nova versão não substitui retroativamente a evidência anterior; cada aceite permanece associado à sua versão, data, pessoa que aceitou e profissional que coletou. A revogação de consentimento precisa ser implementada na tela administrativa antes de utilização real de fotos.

## Limites atuais a concluir

Esta entrega facilita a manutenção, mas não encerra a validação de produção. Ainda faltam a tela de gestão de profissionais, a tela de consulta de auditoria, recuperação de senha por canal aprovado, automação de backup sob controle da titular, política formal de retenção e o teste integrado contra as contas próprias de TiDB e R2. Esses itens devem ser feitos em ambiente de teste antes da entrada de qualquer dado real.

## Referências

[1]: https://docs.railway.com/variables "Variables · Railway documentation"
[2]: https://docs.railway.com/deployments/healthchecks "Healthchecks · Railway documentation"
[3]: https://developers.cloudflare.com/r2/api/tokens/ "API tokens · Cloudflare R2 docs"
[4]: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ "Presigned URLs · Cloudflare R2 docs"
