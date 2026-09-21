# Validação da camada pública — 21/09/2026

## Resultado da prévia local de produção

A prévia foi reconstruída depois de separar explicitamente a página pública da clínica e o portal clínico protegido. A rota `/` retornou HTTP 200 e exibiu a página pública com a marca fornecida, navegação institucional, seção de serviços, seção de produtos, aviso de privacidade e links para o acesso da equipe.

A rota `/portal` retornou HTTP 200, mas exibiu exclusivamente a tela de autenticação por link único; nenhum prontuário, avaliação, fotografia, CPF, documento, agenda detalhada ou orçamento individual é apresentado antes da autenticação. A página pública e o portal protegido são bundles separados no cliente.

O caminho legado `/assets/docs/plantas-45m2.pdf` retornou HTTP 404, confirmando que os documentos internos de planejamento não pertencem ao bundle público. A marca pública retornou HTTP 200.

## Resiliência de conteúdo

Quando o banco ainda não possui a tabela de configurações — condição observada somente na prévia local sem migração — o site público apresenta o conteúdo neutro padrão em vez de permanecer em carregamento. Quando o banco estiver pronto no Cloud Run, a SUPER ADM poderá editar e salvar textos, links, serviços e produtos pela área administrativa.

A validação não utilizou dados clínicos, CPF, fotografias de pacientes, chaves ou variáveis de ambiente.
