# Exclusão de dados de teste — 21/09/2026

A titular autorizou exclusivamente a remoção dos registros de pacientes de teste no TiDB da nova clínica, incluindo os vínculos clínicos associados. Nenhum código, segredo, domínio, configuração, documento de planejamento ou dado não classificado como teste foi autorizado para exclusão.

## Verificação executada

No schema `lumina_clinica`, foi executada uma consulta de contagem sem expor nome, CPF, fotografia, documento ou conteúdo clínico. O resultado foi **0 pacientes no total**; portanto, não havia pacientes marcados como teste nem vínculos clínicos associados a remover.

## Resultado

Nenhuma linha foi excluída, pois o banco clínico está vazio. A autorização foi atendida sem afetar dados reais, código, configurações ou os documentos internos de planejamento.
