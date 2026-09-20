# Registro.br — domínio da clínica no Railway

**Estado deste roteiro:** preparatório. Nenhum registro DNS foi alterado por este projeto. Os valores finais de destino só aparecem no painel Railway depois que o serviço estiver implantado e o domínio personalizado tiver sido adicionado.

## Domínio a configurar

Use o subdomínio **`clinica.lumina.skin.nom.br`**. Ele deve apontar para a aplicação clínica implantada no Railway; não deve apontar diretamente para TiDB, R2, API Gemini ou qualquer serviço de e-mail.

## Pré-requisitos antes de editar DNS

A titular deve concluir, no Railway, a implantação do serviço e confirmar que o endereço temporário gerado pelo Railway abre a página de acesso, responde a `GET /healthz` e reporta pronto em `GET /readyz`. Somente depois, em **Service → Settings → Networking → Public Networking → + Custom Domain**, deve adicionar exatamente `clinica.lumina.skin.nom.br` e selecionar a porta pública `3000`.

O Railway mostrará **dois registros específicos** para aquele serviço: um CNAME de roteamento e um TXT de verificação. Os textos abaixo são modelos; não invente nem reutilize os valores de exemplo.

| Tipo | Host/Nome no Registro.br | Destino/Valor | Ação |
|---|---|---|---|
| CNAME | `clinica` | `<valor-CNAME-exato-mostrado-pelo-Railway>` | Criar ou substituir o CNAME antigo de `clinica` que ainda aponte para infraestrutura anterior. |
| TXT | `<nome-TXT-exato-mostrado-pelo-Railway>` | `<valor-TXT-exato-mostrado-pelo-Railway>` | Criar exatamente como mostrado. É obrigatório para Railway verificar a propriedade. |

> **Não criar registros A para IPs antigos, não apontar para `cname.manus.space` e não usar o domínio raiz `lumina.skin.nom.br` neste fluxo.** O serviço clínico deve usar apenas o subdomínio `clinica`.

## Ordem segura no painel Registro.br

1. Copie o CNAME e o TXT exibidos pelo Railway, sem alterar caracteres, pontos ou hífens.
2. No Registro.br, localize a zona DNS de `lumina.skin.nom.br`.
3. Se houver um CNAME prévio para o host `clinica`, substitua-o pelo destino do Railway; um mesmo host não pode manter dois CNAMEs concorrentes.
4. Adicione o TXT de verificação exatamente no host informado pelo Railway.
5. Salve as alterações e retorne ao Railway. Aguarde o indicador de domínio **verificado** antes de testar o endereço público.
6. Teste em janela anônima: `https://clinica.lumina.skin.nom.br/?nocache=<data-hora>`; só considere concluído quando a página de acesso for carregada por HTTPS.

## O que não deve ir ao Registro.br

Nunca inclua em DNS: `DATABASE_URL`, chaves R2, `GEMINI_API_KEY`, chave Resend, JWT, CPF, token de acesso, URL de banco ou qualquer dado de paciente. Esses valores pertencem exclusivamente ao cofre de variáveis privadas do Railway.

## Fonte oficial

A documentação do Railway informa que domínios personalizados exigem **CNAME e TXT**, e que o domínio pode retornar 404 mesmo com CNAME resolvido se o TXT de verificação estiver ausente. O Railway emite e renova o certificado TLS após a verificação: [Working with Domains — Railway](https://docs.railway.com/networking/domains/working-with-domains).
