# Modelo editável — termo de consentimento por procedimento

> **Status:** estrutura de preenchimento. A titular define toda a redação profissional, descrição do procedimento, riscos, alternativas, credenciais, assinatura e adequação jurídica antes de aprovar qualquer versão. Este arquivo não constitui termo final, parecer jurídico ou indicação clínica.

## Campos controlados pelo sistema

- Paciente: `{{PACIENTE_NOME}}`
- Procedimento: `{{PROCEDIMENTO_NOME}}`
- Data: `{{DATA_REGISTRO}}`
- Hora: `{{HORA_REGISTRO}}`
- Profissional registrante: `{{PROFISSIONAL_NOME}}`

## Modelo a personalizar no sistema

```text
[TÍTULO DEFINIDO PELA TITULAR]
Versão: [NÚMERO DE VERSÃO]
Procedimento associado: {{PROCEDIMENTO_NOME}}

Paciente: {{PACIENTE_NOME}}
Data e hora do registro: {{DATA_REGISTRO}} — {{HORA_REGISTRO}}
Profissional registrante: {{PROFISSIONAL_NOME}}

1. Finalidade e descrição
[INSERIR A REDAÇÃO APROVADA PELA TITULAR PARA ESTE PROCEDIMENTO.]

2. Informações fornecidas antes do aceite
[INSERIR A REDAÇÃO APROVADA SOBRE OBJETIVO, LIMITES, EXPECTATIVAS REALISTAS E ALTERNATIVAS.]

3. Riscos, reações e situações que exigem comunicação ou encaminhamento
[INSERIR A REDAÇÃO APROVADA, ESPECÍFICA PARA O PROCEDIMENTO.]

4. Condições informadas pelo paciente
[INSERIR CAMPOS OU REDAÇÃO APROVADA PARA ANAMNESE, RESTRIÇÕES E INFORMAÇÕES RELEVANTES.]

5. Cuidados, retorno e orientações
[INSERIR SOMENTE ORIENTAÇÕES APROVADAS PELA TITULAR E PELO RESPONSÁVEL TÉCNICO.]

6. Registro de imagem, quando aplicável
[INSERIR A REDAÇÃO APROVADA OU UTILIZAR UM TERMO DE IMAGEM SEPARADO E VERSIONADO.]

7. Declaração de aceite
Declaro que tive oportunidade de ler e esclarecer dúvidas sobre o conteúdo acima, conforme a redação aprovada desta versão.

Nome de quem declara o aceite: [PREENCHIDO NO MOMENTO DO REGISTRO]
Método de registro: [DECLARAÇÃO REGISTRADA / MÉTODO APROVADO]
```

## Como publicar uma versão no sistema

A SUPER ADM cria um rascunho, associa o modelo ao procedimento correto, revisa a redação e aprova a versão. Depois de aprovada, a versão não é editada. Uma correção cria novo rascunho e nova versão. No aceite, o sistema substitui apenas os cinco marcadores controlados e preserva um snapshot com data, hora, paciente, procedimento, profissional, hash e versão.

A associação entre termo e procedimento precisa ser conferida pela titular. O sistema não escolhe o termo automaticamente com base em avaliação, foto, diagnóstico, produto ou orçamento.
