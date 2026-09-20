# Revisão de segurança e qualidade — base de produção futura

**Data:** 20/09/2026
**Escopo:** código independente, protótipo local e pacote desktop; sem credenciais, dados clínicos, contas ou deploy.

## Correções aplicadas nesta revisão

| Achado | Situação após correção |
|---|---|
| Migração PostgreSQL incompatível com TiDB/MySQL | Migração e metadata legadas removidas. O primeiro schema TiDB está bloqueado por gate de homologação e revisão de SQL. |
| Healthcheck poderia aprovar serviço sem banco | Separados `/healthz` e `/readyz`. O Railway passa a usar readiness, que valida configuração e consulta TiDB. |
| CSP bloqueava R2 | A política passa a permitir somente o origin HTTPS do endpoint R2 configurado, além do próprio aplicativo. |
| Profissional poderia acessar qualquer paciente | Adicionada tabela `patient_assignments`. O profissional pesquisa e acessa somente pacientes atribuídos; SUPER ADM e admin têm escopo explícito integral. |
| Upload de foto não era transacional | Intent recebeu estados de reserva e consumo. Confirmação revalida escopo, consentimento, evolução, checksum, tamanho e tipo; metadata e auditoria são gravadas na mesma transação. |
| Nome original de foto podia revelar informação | O backend grava nome técnico genérico, não o nome de arquivo do dispositivo. |
| Total de orçamento podia ultrapassar `INT` | Valores monetários foram movidos para `BIGINT` no schema. |
| Navegador podia alterar preço de procedimento | O backend ignora preço/descrição recebidos para procedimento e revalida o catálogo ativo. |
| Impressão de orçamento antes da emissão | O documento comercial só é consultável e imprimível no estado `issued`. |
| Cookie malformado podia interromper leitura de sessão | Decodificação de cookie agora retorna sessão ausente em vez de lançar exceção. |
| Chave de cifra era reutilizada diretamente em HMAC | Fingerprints de CPF e IP usam chaves derivadas por HKDF com finalidade distinta. |
| Protótipo local carregava fontes e guias externos | Guias passaram a ser locais; tipografia usa fontes do sistema; o componente de mapa não usado foi removido. |
| Red flags não bloqueavam orçamento local | Estado de alerta é propagado para plano/orçamento; aba comercial e exportação ficam bloqueadas até resolução no prontuário integrado. |
| Importação JSON do protótipo era superficial | Adicionado parser versionado, com limites, filtro de campos desconhecidos e normalização. |
| Pacote desktop não tinha CSP | Servidor loopback recebeu CSP, Permissions Policy, COOP, CORP, proteção contra frame e tratamento de URL malformada. |
| Termos não eram personalizáveis por procedimento | Adicionado modelo versionado, draft/aprovação, associação com procedimento, preview, snapshot renderizado, hash, data/hora, paciente e profissional. |

## Limites que permanecem como gates de entrada em produção

A aplicação ainda não pode receber dados reais até que a titular conclua as etapas de homologação. É necessário gerar o lockfile revisado, criar a primeira migração MySQL/TiDB, aplicar a migração em banco vazio de teste, testar as rotas contra TiDB/R2 próprios, configurar CORS do bucket com os domínios finais, validar CSP, criar usuários profissionais, testar atribuição profissional–paciente e executar o roteiro com dados fictícios.

Ainda faltam interface de gestão de profissionais, revogação de consentimento, consulta administrativa de auditoria, recuperação de senha por canal aprovado, limpeza/reconciliação de objetos R2, detecção de arquivo malicioso ou normalização de imagem, métricas sem PII, política formal de retenção e backup/restauração testado. Essas lacunas foram preservadas como requisitos explícitos em vez de serem mascaradas como recursos concluídos.

A geração do lockfile foi tentada localmente, mas o Corepack do ambiente retornou erro de assinatura de chave. Nenhuma alternativa foi executada. O procedimento correto é gerar e revisar o lockfile em estação ou CI controlada pela titular antes do primeiro build de produção. O Dockerfile usa instalação não congelada apenas até esse artefato existir; depois deve ser atualizado para `--frozen-lockfile`.

## Evidência de validação disponível

A sintaxe dos arquivos centrais do prontuário, termos, schema, autorização, armazenamento, backend e interface foi validada com esbuild. O protótipo local foi compilado pelo Vite; a verificação de linguagem reportou TypeScript e LSP sem erros. O pacote desktop foi testado com `unzip -t`, servidor loopback e inspeção de cabeçalhos; a varredura não encontrou referências a Manus Storage, Google Fonts ou endpoint Forge no build empacotado.

Validação integrada com TiDB/R2/Railway, migração, testes de tipo completos e deploy permanecem propositalmente pendentes de contas próprias e autorização específica.
