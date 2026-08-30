# Validação da versão independente

## Interface de autenticação

Em 30 de agosto de 2026, a aplicação foi iniciada localmente em modo de produção com PostgreSQL 16. A tela de acesso exibiu o título **Clínica Lumina Skin Intelligence — Planejamento**, os campos de e-mail e senha e o botão de entrada, sem redirecionamento, token ou interface da plataforma anterior.

O formulário foi preenchido com uma credencial exclusivamente temporária do ambiente de teste. A senha não foi incluída no repositório nem neste documento.

## Evidências técnicas já verificadas

| Verificação | Resultado |
|---|---|
| Migração PostgreSQL | Aplicada sem erro |
| Login de e-mail fora da allowlist | HTTP 401 |
| Login de administrador permitido | HTTP 200 |
| Consulta autenticada do planejamento | HTTP 200 |
| Seed migrado | 1 administrador e 37 itens |
| Cron com segredo incorreto | HTTP 403 |
| Cron com segredo correto | HTTP 200 |
| Tipagem, testes e build | Aprovados |
| Cabeçalhos de segurança | `nosniff`, `DENY`, política de referência e permissões restritas |
| Limite de tentativas de login | Nona tentativa retornou HTTP 429 |

## Painel autenticado

O login local abriu o dashboard sem redirecionamento externo. Foram confirmados o **logotipo local**, a identificação **Clínica Lumina Skin Intelligence**, os nove módulos de navegação, o cronograma de 18 meses, o orçamento recomendado de R$ 756.002, os bloqueios técnicos e os **37 itens preservados** do planejamento anterior. A aplicação criou um único administrador temporário no PostgreSQL de teste e não gravou a senha em texto.
