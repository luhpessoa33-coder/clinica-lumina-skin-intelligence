import csv
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "docs" / "dados"
OUT.mkdir(parents=True, exist_ok=True)

procedimentos = [
    {"procedimento":"Avaliação estética e fotografia padronizada","item_catalogo":"Preparação alcoólica 70%","unidade_consumo":"mL","consumo_sessao":5,"qtd_inicial":4000,"estoque_minimo":1000,"validade_referencia":"rótulo","marca_referencia":"produto regular","fornecedor":"distribuidor saúde","observacao":"Higiene das mãos e superfícies conforme POP; não aplicar automaticamente na pele do cliente."},
    {"procedimento":"Avaliação estética e fotografia padronizada","item_catalogo":"Lenços desidratados c/100","unidade_consumo":"un","consumo_sessao":1,"qtd_inicial":200,"estoque_minimo":100,"validade_referencia":"rótulo","marca_referencia":"Santa Clara","fornecedor":"distribuidor estética","observacao":"Uso somente quando necessário para higienização aprovada."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Kit profissional de limpeza","unidade_consumo":"sessão","consumo_sessao":1,"qtd_inicial":50,"estoque_minimo":10,"validade_referencia":"rótulo após abertura","marca_referencia":"Bioage Bio-Clean System","fornecedor":"Bioage Profissional","observacao":"Rendimento declarado de 50 aplicações; consumo individual deve seguir protocolo e rótulo."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Luvas nitrílicas sem pó","unidade_consumo":"par","consumo_sessao":1,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Supermax/Medix/Descarpack","fornecedor":"Dental Cremer/distribuidor","observacao":"Trocar quando houver dano, contaminação ou mudança de etapa."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Máscara cirúrgica tripla","unidade_consumo":"un","consumo_sessao":1,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Descarpack/SSPlus","fornecedor":"distribuidor saúde","observacao":"Uso conforme avaliação de risco e POP."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Lençol de papel 70 cm × 50 m","unidade_consumo":"m","consumo_sessao":1.8,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"não aplicável","marca_referencia":"Plumax/Gupe Pel","fornecedor":"Magazine Médica","observacao":"Ajustar ao comprimento real da maca e modo de cobertura."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Algodão hidrófilo","unidade_consumo":"g","consumo_sessao":15,"qtd_inicial":2000,"estoque_minimo":500,"validade_referencia":"rótulo","marca_referencia":"Cremer/Apolo","fornecedor":"Dental Cremer","observacao":"Estimativa de planejamento; medir no piloto de 20 atendimentos."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Gaze estéril","unidade_consumo":"un","consumo_sessao":4,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Cremer/Neve","fornecedor":"Dental Cremer","observacao":"Usar apresentação compatível com a etapa aprovada."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Microaplicadores","unidade_consumo":"un","consumo_sessao":2,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"FGM/KG","fornecedor":"Dental Cremer","observacao":"Uso único."},
    {"procedimento":"Limpeza de pele profissional","item_catalogo":"Espátulas de madeira","unidade_consumo":"un","consumo_sessao":2,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Theoto/Talge","fornecedor":"distribuidor saúde","observacao":"Uso único."},
    {"procedimento":"Alta frequência como etapa complementar","item_catalogo":"Lençol de papel 70 cm × 50 m","unidade_consumo":"m","consumo_sessao":1.8,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"não aplicável","marca_referencia":"Plumax/Gupe Pel","fornecedor":"Magazine Médica","observacao":"Reutiliza o estoque da limpeza de pele quando no mesmo atendimento."},
    {"procedimento":"Alta frequência como etapa complementar","item_catalogo":"Gaze estéril","unidade_consumo":"un","consumo_sessao":2,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Cremer/Neve","fornecedor":"Dental Cremer","observacao":"Estimativa; ajustar ao POP e manual do eletrodo."},
    {"procedimento":"Peeling ultrassônico","item_catalogo":"Luvas nitrílicas sem pó","unidade_consumo":"par","consumo_sessao":1,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Supermax/Medix/Descarpack","fornecedor":"Dental Cremer/distribuidor","observacao":"Estoque compartilhado."},
    {"procedimento":"Peeling ultrassônico","item_catalogo":"Lençol de papel 70 cm × 50 m","unidade_consumo":"m","consumo_sessao":1.8,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"não aplicável","marca_referencia":"Plumax/Gupe Pel","fornecedor":"Magazine Médica","observacao":"Estoque compartilhado."},
    {"procedimento":"Peeling ultrassônico","item_catalogo":"Solução/meio aprovado pelo fabricante","unidade_consumo":"mL","consumo_sessao":15,"qtd_inicial":500,"estoque_minimo":150,"validade_referencia":"rótulo após abertura","marca_referencia":"conforme manual Sonopeel","fornecedor":"distribuidor autorizado","observacao":"Não substituir por produto improvisado; validar compatibilidade no manual."},
    {"procedimento":"HIFU facial/corporal","item_catalogo":"Focus Pad Sonofocus c/2","unidade_consumo":"un","consumo_sessao":1,"qtd_inicial":10,"estoque_minimo":4,"validade_referencia":"rótulo","marca_referencia":"Ibramed","fornecedor":"MedEstec/distribuidor autorizado","observacao":"Somente no cenário Sonofocus; confirmar consumo real e reutilização permitida no manual."},
    {"procedimento":"HIFU facial/corporal","item_catalogo":"Lençol de papel 70 cm × 50 m","unidade_consumo":"m","consumo_sessao":1.8,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"não aplicável","marca_referencia":"Plumax/Gupe Pel","fornecedor":"Magazine Médica","observacao":"Estoque compartilhado."},
    {"procedimento":"HIFU facial/corporal","item_catalogo":"Luvas nitrílicas sem pó","unidade_consumo":"par","consumo_sessao":1,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"rótulo","marca_referencia":"Supermax/Medix/Descarpack","fornecedor":"Dental Cremer/distribuidor","observacao":"Estoque compartilhado."},
    {"procedimento":"Radiofrequência","item_catalogo":"Gel glicerinado para radiofrequência 1 kg","unidade_consumo":"g","consumo_sessao":25,"qtd_inicial":2000,"estoque_minimo":500,"validade_referencia":"rótulo após abertura","marca_referencia":"RMC ou equivalente regular","fornecedor":"distribuidor estética","observacao":"Somente se RF for selecionada; confirmar no manual do equipamento."},
    {"procedimento":"Radiofrequência","item_catalogo":"Lençol de papel 70 cm × 50 m","unidade_consumo":"m","consumo_sessao":1.8,"qtd_inicial":200,"estoque_minimo":50,"validade_referencia":"não aplicável","marca_referencia":"Plumax/Gupe Pel","fornecedor":"Magazine Médica","observacao":"Estoque compartilhado."},
    {"procedimento":"Fotobiomodulação LED/laser","item_catalogo":"Óculos de proteção","unidade_consumo":"ciclo de desinfecção","consumo_sessao":1,"qtd_inicial":3,"estoque_minimo":1,"validade_referencia":"integridade","marca_referencia":"compatível com comprimento de onda","fornecedor":"fabricante do equipamento","observacao":"Item reutilizável; higienizar e inspecionar entre usuários."},
    {"procedimento":"Fotobiomodulação LED/laser","item_catalogo":"Desinfetante de superfície 1 L","unidade_consumo":"mL","consumo_sessao":10,"qtd_inicial":2000,"estoque_minimo":1000,"validade_referencia":"rótulo após abertura","marca_referencia":"uso em serviços de saúde","fornecedor":"Rioquímica/distribuidor","observacao":"Aplicação e tempo de contato conforme rótulo e compatibilidade do equipamento."},
]

cadeia_fria = [
    {"produto":"Botox — frasco intacto","registro":"MS 1.9860.0019","faixa_bula":"freezer a -5 °C ou inferior OU geladeira 2–8 °C","apos_preparo":"2–8 °C por até 3 dias","estoque_piloto":"2–4 frascos no total da marca escolhida","recebimento":"conferir nota, lote, validade, embalagem e evidência térmica","liberacao":"somente se transporte e temperatura estiverem conformes","quarentena":"se houver excursão, dano, dúvida de transporte ou rótulo ilegível","contingencia":"transferir para caixa térmica qualificada com logger; contatar fabricante","descarte":"grupo químico/PGRSS e regra local; nunca usar após desvio sem autorização escrita","fonte":"https://www.allerganaesthetics.com.br/marcas/botox"},
    {"produto":"Nabota — frasco intacto","registro":"confirmar no Bulário/nota fiscal","faixa_bula":"2–8 °C no frasco original não aberto","apos_preparo":"2–8 °C por até 24 horas","estoque_piloto":"2–4 frascos no total da marca escolhida","recebimento":"conferir nota, lote, validade, embalagem e evidência térmica","liberacao":"somente se transporte e temperatura estiverem conformes","quarentena":"se houver excursão, dano, dúvida de transporte ou rótulo ilegível","contingencia":"transferir para caixa térmica qualificada com logger; contatar fabricante","descarte":"grupo químico/PGRSS e regra local; nunca usar após desvio sem autorização escrita","fonte":"https://consultaremedios.com.br/nabota/bula"},
    {"produto":"Xeomin — frasco intacto","registro":"188020001","faixa_bula":"15–30 °C","apos_preparo":"2–8 °C por até 24 horas; bula orienta uso imediato","estoque_piloto":"2–4 frascos no total da marca escolhida","recebimento":"conferir nota, lote, validade, embalagem e condição térmica indicada","liberacao":"somente se transporte e armazenamento estiverem conformes","quarentena":"se houver excursão, dano, dúvida de transporte ou rótulo ilegível","contingencia":"manter ambiente monitorado; após preparo, usar caixa 2–8 °C com logger quando necessário","descarte":"grupo químico/PGRSS e regra local; nunca usar após desvio sem autorização escrita","fonte":"https://consultaremedios.com.br/xeomin/bula"},
]

catalog_path = OUT / "catalogo_mestre.json"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))

def find_catalog_id(item, marca):
    candidates = [r for r in catalog if r["item"] == item]
    if len(candidates) == 1:
        return candidates[0]["id"]
    marker = marca.split()[0].lower()
    for candidate in candidates:
        if marker in candidate["marca_modelo"].lower():
            return candidate["id"]
    raise ValueError(f"Item sem vínculo único no catálogo: {item} / {marca}")

for row in procedimentos:
    row["catalog_item_id"] = find_catalog_id(row["item_catalogo"], row["marca_referencia"])

toxina_catalog_id = find_catalog_id("Toxina botulínica tipo A 100 U", "Marca regular")
for row in cadeia_fria:
    row["catalog_item_id"] = toxina_catalog_id
    row["status_escopo"] = "REGRA CONFIRMADA POR BULA; REVALIDAR NA COMPRA"

def write_csv_json(name, data):
    csv_path = OUT / f"{name}.csv"
    json_path = OUT / f"{name}.json"
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(data[0].keys()))
        w.writeheader(); w.writerows(data)
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return csv_path, json_path

write_csv_json("insumos_por_procedimento", procedimentos)
write_csv_json("matriz_cadeia_fria", cadeia_fria)

md = [
    "# Matrizes operacionais de consumo e cadeia fria", "",
    "**Clínica Lumina Skin Intelligence**  ",
    "**Versão de planejamento:** 29 de agosto de 2026", "",
    "> Consumos são estimativas para orçamento e devem ser recalibrados após os primeiros 20 atendimentos. Não são doses clínicas nem substituem rótulos, bulas, manuais, treinamento ou aprovação do responsável técnico.", "",
    "## Insumos por procedimento não invasivo", "",
    "| Procedimento | Item | Consumo por sessão | Estoque inicial | Estoque mínimo | Marca/fornecedor |", "|---|---|---:|---:|---:|---|"
]
for r in procedimentos:
    md.append(f"| {r['procedimento']} | {r['item_catalogo']} | {r['consumo_sessao']} {r['unidade_consumo']} | {r['qtd_inicial']} | {r['estoque_minimo']} | {r['marca_referencia']} — {r['fornecedor']} |")
md += ["", "## Cadeia fria por produto", "", "A compra piloto adotará apenas **uma marca de toxina por vez**, com duas a quatro unidades totais. Isso reduz capital imobilizado, fragmentação de lotes e risco de vencimento.", "", "| Produto | Antes do preparo | Após preparo | Estoque piloto | Quarentena/liberação |", "|---|---|---|---|---|"]
for r in cadeia_fria:
    md.append(f"| {r['produto']} | {r['faixa_bula']} | {r['apos_preparo']} | {r['estoque_piloto']} | {r['quarentena']} / {r['liberacao']} |")
md += ["", "## Fluxo operacional de desvio térmico", "", "1. Identificar o produto e interromper imediatamente a liberação. 2. Manter o produto segregado na condição térmica indicada, com etiqueta **QUARENTENA — NÃO USAR**. 3. Registrar lote, validade, temperaturas mínima/máxima, duração estimada, causa e responsável. 4. Contatar fabricante ou detentor do registro e solicitar decisão escrita. 5. Liberar somente com autorização documentada; caso contrário, encaminhar conforme PGRSS e exigência local. 6. Registrar causa, ação corretiva e prevenção de recorrência.", "", "## Fontes", "", "[1]: https://www.allerganaesthetics.com.br/marcas/botox \"Allergan Aesthetics Brasil — BOTOX e bula profissional\"", "[2]: https://consultaremedios.com.br/nabota/bula \"Consulta Remédios — Bula do Nabota\"", "[3]: https://consultaremedios.com.br/xeomin/bula \"Consulta Remédios — Bula do Xeomin\""]
md.insert(-4, "## Critério de escopo\n\nNesta fase, apenas **Botox, Nabota e Xeomin** foram classificados como itens com regra de cadeia fria confirmada porque são as três opções de toxina selecionadas para comparação e possuem condição de armazenamento identificada em bula. Preenchedores, bioestimuladores, hialuronidase e itens do kit de emergência permanecem bloqueados e não são automaticamente classificados como refrigerados: a condição depende da marca, apresentação e bula escolhidas. O sistema deverá impedir a compra de qualquer novo produto controlado por temperatura até que ele receba uma regra própria nesta matriz, vinculada ao seu item do catálogo.\n")
(BASE / "docs" / "matrizes_operacionais.md").write_text("\n".join(md) + "\n", encoding="utf-8")

print(f"{len(procedimentos)} vínculos de procedimento e {len(cadeia_fria)} produtos de cadeia fria gravados")
