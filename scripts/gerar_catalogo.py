import csv
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "docs" / "dados"
OUT.mkdir(parents=True, exist_ok=True)

cols = [
    "id", "categoria", "subcategoria", "item", "marca_modelo", "unidade",
    "quantidade_inicial", "estoque_minimo", "preco_unit_min", "preco_unit_max",
    "prioridade", "fase_compra", "status_sanitario", "ambiente", "grupo_escolha",
    "fornecedor", "url", "observacao", "data_preco"
]

rows = []

def add(cat, sub, item, marca, un, qtd, minimo, pmin, pmax, prioridade, fase,
        status, ambiente, grupo="", fornecedor="", url="", obs=""):
    rows.append({
        "id": len(rows) + 1, "categoria": cat, "subcategoria": sub, "item": item,
        "marca_modelo": marca, "unidade": un, "quantidade_inicial": qtd,
        "estoque_minimo": minimo, "preco_unit_min": pmin, "preco_unit_max": pmax,
        "prioridade": prioridade, "fase_compra": fase, "status_sanitario": status,
        "ambiente": ambiente, "grupo_escolha": grupo, "fornecedor": fornecedor,
        "url": url, "observacao": obs, "data_preco": "2026-08-29"
    })

# Equipamentos principais e alternativas excludentes.
add("Equipamentos", "HIFU", "Ultrassom micro e macrofocado", "Ibramed Sonofocus", "un", 1, 0, 8091, 8990, "ALTA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "HIFU", "MedEstec", "https://www.medestec.com.br/eletroterapia/hifu/novo-sonofocus-aparelho-hifu-de-ultrassom-focalizado-micro-e-macrofocado-de-alta-intensidade-ibramed", "Opção de entrada; confirmar kit, treinamento, assistência e registro 10360319004.")
add("Equipamentos", "HIFU", "Ultrassom micro e macrofocado", "HTM Ultrafocus", "un", 1, 0, 9891, 10990, "MÉDIA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "HIFU", "HTM", "https://loja.htmeletronica.com.br/ultrafocus-ultrassom-micro-e-macrofocado-htm", "Alternativa intermediária; garantia publicada de 18 meses; registro 80212480022.")
add("Equipamentos", "HIFU", "Ultrassom micro e macrofocado", "Medical San Ultramed HIFU", "un", 1, 0, 92160, 106656, "BAIXA", "Expansão", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "HIFU", "Medical San", "https://www.medicalsan.com.br/en/tecnologias/ultramed-hifu/", "Premium; cartucho 2D com 20.000 disparos; registro 81243819003; cotação obrigatória.")
add("Equipamentos", "Radiofrequência", "Radiofrequência compacta", "HTM Effect", "un", 1, 0, 7821, 8690, "MÉDIA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "RF", "HTM", "https://loja.htmeletronica.com.br/effect-radiofrequencia-compacta-de-alto-rendimento-htm", "Comprar após definir protocolos iniciais para evitar sobreposição com HIFU.")
add("Equipamentos", "Fotobiomodulação", "Laser/LED portátil", "Ibramed Laserpulse Portable", "un", 1, 0, 1980, 2277, "MÉDIA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "FOTOBIO", "BCMed", "https://www.bcmed.com.br/novo-laserpulse-portable-aparelho-de-laserterapia-e-reabilitacao-ibramed", "Opção econômica; confirmar probe e óculos compatíveis.")
add("Equipamentos", "Fotobiomodulação", "Plataforma LED/laser", "HTM Fluence", "un", 1, 0, 2151, 2390, "MÉDIA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "FOTOBIO", "HTM", "https://loja.htmeletronica.com.br/fluence-led-e-laser-em-um-so-aparelho-htm", "Alternativa intermediária; confirmar cluster incluído.")
add("Equipamentos", "Fotobiomodulação", "Plataforma LED/laser", "Ibramed Antares", "un", 1, 0, 3890, 4474, "BAIXA", "Expansão", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "FOTOBIO", "BCMed", "https://www.bcmed.com.br/antares-plataforma-de-fotobiomodulacao-led-e-laser-ibramed", "Premium; aplicadores podem ser vendidos separadamente.")
add("Equipamentos", "Análise", "Analisador portátil de pele", "Smart GR Smart Analyzer", "un", 1, 0, 269, 350, "ALTA", "Fase 1", "VERIFICAR ENQUADRAMENTO", "Avaliação/administração", "ANALISE", "Smart GR", "https://smartgr.com.br/products/smart-analyzer-analisador-de-umidade-smart-gr", "Entrada; não substitui avaliação clínica ou diagnóstico.")
add("Equipamentos", "Análise", "Luz de Wood e fotografia", "Estek Derma Scan", "un", 1, 0, 4200, 5000, "BAIXA", "Expansão", "VALIDAR REGISTRO", "Avaliação/administração", "ANALISE", "Estek", "https://www.estek.com.br/aparelhos-equipamentos/derma-scan-ia-estek-p", "Alternativa intermediária; conferir registro e suporte de smartphone.")
add("Equipamentos", "Limpeza de pele", "Alta frequência portátil", "Ibramed HF", "un", 1, 0, 500, 650, "ALTA", "Fase 1", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "LIMPEZA", "DermoMed", "https://www.dermomed.com.br/alta-frequencia-hf-ibramed", "Entrada; exige kit de eletrodos íntegro.")
add("Equipamentos", "Limpeza de pele", "Peeling ultrassônico", "Ibramed Sonopeel", "un", 1, 0, 2800, 3300, "MÉDIA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "LIMPEZA", "Ibramed", "https://ibramed.com.br/peeling-ultrassonico/sonopeel/", "Pode ser adiado se o protocolo inicial não exigir.")
add("Equipamentos", "Limpeza de pele", "Plataforma multifuncional", "HTM Stimulus Face Clean", "un", 1, 0, 5841, 6490, "MÉDIA", "Fase 2", "VALIDAR REGISTRO E HABILITAÇÃO", "Sala de procedimentos", "LIMPEZA", "HTM", "https://loja.htmeletronica.com.br/stimulus-face-clean-plataforma-completa-para-limpeza-de-pele-htm", "Alternativa à compra separada de alta frequência e peeling.")

# Processamento e apoio técnico.
add("Equipamentos", "Esterilização", "Autoclave compacta", "Cristófoli Amora 4–5 L", "un", 1, 0, 2700, 3790, "CONDICIONAL", "Fase 1", "VALIDAR REGISTRO E FLUXO", "Área técnica", "AUTOCLAVE", "Cristófoli", "https://cristofoli.com/", "Comprar somente se houver processamento interno autorizado; considerar CME terceirizada.")
add("Equipamentos", "Esterilização", "Autoclave 12 L", "Cristófoli Vitale Class", "un", 1, 0, 5900, 7000, "CONDICIONAL", "Expansão", "VALIDAR REGISTRO E FLUXO", "Área técnica", "AUTOCLAVE", "Cristófoli", "https://cristofoli.com/", "Opção para maior fluxo e rastreabilidade.")
add("Equipamentos", "Esterilização", "Seladora de grau cirúrgico", "Cristófoli ou Selamaxx", "un", 1, 0, 269, 1500, "CONDICIONAL", "Fase 1", "VALIDAR COMPATIBILIDADE", "Área técnica", "", "Dental Cremer", "https://www.dentalcremer.com.br/", "Dimensionar conforme largura das embalagens.")
add("Equipamentos", "Cadeia fria", "Câmara de conservação 100–120 L", "Elber ou Indrel", "un", 1, 0, 6500, 8500, "CONDICIONAL", "Fase 2", "VALIDAR CALIBRAÇÃO E LICENÇA", "Estoque", "", "Elber", "https://www.elber.ind.br", "Obrigatória apenas quando o portfólio exigir; não usar frigobar doméstico para estoque profissional sem validação local.")
add("Equipamentos", "Cadeia fria", "Termômetro de máxima e mínima", "Incoterm", "un", 1, 1, 80, 150, "CONDICIONAL", "Fase 2", "CALIBRAR", "Estoque", "", "Incoterm", "https://www.incoterm.com.br", "Registrar temperatura conforme POP e bula dos produtos.")
add("Equipamentos", "Cadeia fria", "Data logger de temperatura", "Elitech ou Testo", "un", 1, 0, 250, 500, "CONDICIONAL", "Fase 2", "CALIBRAR", "Estoque", "", "Elitech", "https://www.elitechbrasil.com.br", "Manter plano de contingência e histórico.")

# Mobiliário clínico.
add("Mobiliário", "Sala", "Maca elétrica 2 motores", "Nacional com assistência e revestimento lavável", "un", 1, 0, 3500, 7000, "ALTA", "Fase 1", "VERIFICAR REGISTRO/ENQUADRAMENTO", "Sala de procedimentos", "", "Cotação local", "", "Capacidade mínima desejável de 180 kg; exigir garantia e assistência.")
add("Mobiliário", "Sala", "Mocho sela ergonômico", "Estek, Salus ou equivalente", "un", 2, 0, 400, 850, "ALTA", "Fase 1", "NÃO REGULADO/VERIFICAR", "Sala de procedimentos", "", "Estek", "https://www.estek.com.br/moveis-estetica/cadeiras-mochos", "Um principal e um auxiliar.")
add("Mobiliário", "Sala", "Carrinho auxiliar com gavetas", "Superfície lisa e rodízios", "un", 2, 0, 400, 900, "ALTA", "Fase 1", "NÃO REGULADO", "Sala de procedimentos", "", "Cotação local", "", "Separar carrinho limpo de apoio ao procedimento.")
add("Mobiliário", "Sala", "Lupa luminária LED articulada", "Estek ou equivalente", "un", 1, 0, 350, 800, "MÉDIA", "Fase 1", "VERIFICAR ENQUADRAMENTO", "Sala de procedimentos", "", "Estek", "https://www.estek.com.br/lupas-e-focos", "Base estável e superfícies laváveis.")
add("Mobiliário", "Sala", "Armário clínico sob medida com bancada e cuba", "MDF hospitalar/compacto impermeável", "conj", 1, 0, 3500, 8000, "ALTA", "Obra", "NÃO REGULADO", "Sala de procedimentos", "", "Marcenaria local", "", "Rodapé recuado, ferragens resistentes e bancada sem juntas abertas.")
add("Mobiliário", "Técnica", "Armário alto fechado", "Melamínico lavável", "un", 2, 0, 1200, 2500, "ALTA", "Obra", "NÃO REGULADO", "Estoque/área técnica", "", "Marcenaria local", "", "Separar material limpo, químicos e estoque.")

# Recepção e conforto.
add("Mobiliário", "Recepção", "Poltrona/cadeira lavável", "Courino ou vinil; duas com braços", "un", 4, 0, 160, 400, "ALTA", "Fase 1", "NÃO REGULADO", "Recepção", "", "MadeiraMadeira", "https://www.madeiramadeira.com.br/busca/poltrona%20para%20recepcao%20de%20clinica", "Confirmar capacidade, espuma e garantia.")
add("Mobiliário", "Recepção", "Balcão com trecho acessível", "Sob medida", "conj", 1, 0, 2500, 5000, "ALTA", "Obra", "ACESSIBILIDADE", "Recepção", "", "Marcenaria local", "", "Trecho acessível conforme NBR 9050 e planta A-03.")
add("Mobiliário", "Recepção", "Mesa lateral lavável", "Bordas arredondadas", "un", 1, 0, 180, 350, "MÉDIA", "Fase 1", "NÃO REGULADO", "Recepção", "", "Varejo", "", "Evitar vidro solto.")
add("Conforto", "Recepção", "Filtro/bebedouro", "Bancada ou coluna", "un", 1, 0, 300, 900, "MÉDIA", "Fase 1", "HIGIENIZAÇÃO", "Recepção", "", "Varejo", "", "Manter troca de filtro e limpeza registradas.")
add("Conforto", "Recepção", "Cafeteira compacta", "Desligamento automático", "un", 1, 0, 300, 650, "BAIXA", "Fase 1", "HIGIENIZAÇÃO", "Recepção", "", "Varejo", "", "Posicionar fora da rota e longe de documentos.")
add("Conforto", "Recepção", "Roteador Wi-Fi dual band", "Rede de visitantes separada", "un", 1, 0, 300, 700, "ALTA", "Fase 1", "SEGURANÇA DIGITAL", "Administração", "", "Varejo", "", "Separar rede pública da rede clínica.")
add("Conforto", "Recepção", "Persiana rolô tela solar", "Sob medida", "un", 1, 0, 350, 900, "MÉDIA", "Fase 1", "NÃO REGULADO", "Recepção", "", "Cotação local", "", "Material lavável.")
add("Conforto", "Recepção", "Kit sinalização e identificação", "Comunicação visual", "conj", 1, 0, 200, 500, "ALTA", "Fase 1", "ACESSIBILIDADE", "Recepção", "", "Gráfica local", "", "Incluir sanitário acessível, saída e orientações.")
add("Conforto", "Recepção", "Kit água/café e descartáveis", "Bandeja lavável", "conj", 1, 1, 120, 250, "MÉDIA", "Fase 1", "HIGIENIZAÇÃO", "Recepção", "", "Varejo", "", "Reposição mensal conforme consumo.")
add("Conforto", "Recepção", "Lixeira com pedal 10–15 L", "Cor clara e lavável", "un", 1, 0, 70, 130, "ALTA", "Fase 1", "PGRSS", "Recepção", "", "Varejo", "", "Resíduo comum, segregado dos resíduos de serviço de saúde.")

# Materiais de uso geral e biossegurança.
add("Materiais", "Descartáveis", "Algodão hidrófilo", "Cremer ou Apolo 500 g", "pct", 4, 1, 25, 35, "ALTA", "Fase 1", "USO GERAL", "Estoque", "", "Dental Cremer", "https://www.dentalcremer.com.br/", "Armazenar seco e fechado.")
add("Materiais", "Descartáveis", "Gaze estéril", "Cremer ou Neve", "cx", 2, 1, 40, 60, "ALTA", "Fase 1", "USO GERAL", "Estoque", "", "Dental Cremer", "https://www.dentalcremer.com.br/", "Confirmar apresentação e unidades por caixa.")
add("Materiais", "Descartáveis", "Hastes flexíveis", "Cremer ou equivalente c/150", "cx", 2, 1, 8, 12, "MÉDIA", "Fase 1", "USO GERAL", "Estoque", "", "Distribuidor", "", "Não usar em campo estéril salvo produto apropriado.")
add("Materiais", "Descartáveis", "Microaplicadores", "FGM/KG c/100", "tubo", 2, 1, 15, 25, "MÉDIA", "Fase 1", "USO GERAL", "Estoque", "", "Dental Cremer", "https://www.dentalcremer.com.br/", "Conferir registro/enquadramento.")
add("Materiais", "Descartáveis", "Espátulas de madeira", "Theoto/Talge c/100", "pct", 2, 1, 8, 15, "MÉDIA", "Fase 1", "USO GERAL", "Estoque", "", "Distribuidor", "", "Uso único.")
add("Materiais", "EPI", "Luvas nitrílicas sem pó", "Supermax/Medix/Descarpack c/100", "cx", 4, 1, 25, 40, "ALTA", "Fase 1", "VALIDAR REGISTRO", "Estoque", "", "Dental Cremer", "https://www.dentalcremer.com.br/descartaveis/luvas.html", "Comprar tamanhos conforme equipe.")
add("Materiais", "EPI", "Máscara cirúrgica tripla", "Descarpack/SSPlus c/50", "cx", 4, 1, 7, 15, "ALTA", "Fase 1", "VALIDAR REGISTRO", "Estoque", "", "Distribuidor", "", "Uso conforme avaliação de risco.")
add("Materiais", "EPI", "Respirador PFF2", "3M/Delta Plus", "un", 20, 5, 4, 10, "MÉDIA", "Fase 1", "VALIDAR CA", "Estoque", "", "Distribuidor EPI", "", "Uso conforme risco e POP.")
add("Materiais", "EPI", "Touca descartável", "Medix/Descarpack c/100", "pct", 2, 1, 8, 15, "MÉDIA", "Fase 1", "VALIDAR REGISTRO", "Estoque", "", "Distribuidor", "", "Uso conforme procedimento.")
add("Materiais", "EPI", "Propé descartável", "Medix/Protdesc c/100", "pct", 2, 1, 13, 30, "BAIXA", "Fase 1", "VALIDAR NECESSIDADE", "Estoque", "", "Distribuidor", "", "Não substituir política de limpeza de piso.")
add("Materiais", "EPI", "Avental TNT manga longa", "Descarpack c/10", "pct", 4, 1, 33, 65, "MÉDIA", "Fase 1", "VALIDAR REGISTRO", "Estoque", "", "Distribuidor", "", "Quantidade inicial reduzida; ajustar ao risco real.")
add("Materiais", "EPI", "Óculos de proteção", "Danny/Delta Plus", "un", 3, 1, 5, 20, "ALTA", "Fase 1", "VALIDAR CA", "Sala de procedimentos", "", "Distribuidor EPI", "", "Operador, paciente e reserva.")
add("Materiais", "Descartáveis", "Lençol de papel 70 cm × 50 m", "Plumax/Gupe Pel", "rolo", 4, 1, 18, 25, "ALTA", "Fase 1", "USO GERAL", "Estoque", "", "Magazine Médica", "https://magazinemedica.com.br/categorias/descartaveis/lencois/", "Ajustar consumo ao comprimento da maca.")
add("Materiais", "Descartáveis", "Babador impermeável c/100", "Hospflex/Medix", "pct", 1, 1, 15, 25, "BAIXA", "Fase 1", "USO GERAL", "Estoque", "", "Dental Cremer", "https://www.dentalcremer.com.br/", "Opcional por procedimento.")
add("Materiais", "Descartáveis", "Campo fenestrado estéril 40 × 40", "PolarFix", "un", 20, 10, 5, 8, "CONDICIONAL", "Fase 2", "VALIDAR REGISTRO", "Estoque", "", "Distribuidor", "", "Somente procedimentos autorizados.")
add("Materiais", "Descartáveis", "Micropore", "3M/Missner", "rolo", 4, 1, 8, 15, "MÉDIA", "Fase 1", "VALIDAR REGISTRO", "Estoque", "", "Distribuidor", "", "Manter em local seco.")
add("Materiais", "Biossegurança", "Sabonete líquido para mãos", "Linha profissional 1 L", "frasco", 2, 1, 20, 35, "ALTA", "Fase 1", "VALIDAR REGISTRO", "Sala/área técnica/sanitário", "", "Distribuidor", "", "Compatível com dispensador.")
add("Materiais", "Biossegurança", "Preparação alcoólica 70%", "Produto regular 1 L", "frasco", 4, 1, 12, 20, "ALTA", "Fase 1", "VALIDAR REGISTRO", "Estoque", "", "Distribuidor", "", "Inflamável; armazenar longe de calor.")
add("Materiais", "Biossegurança", "Antisséptico de pele", "Clorexidina em apresentação apropriada", "frasco", 2, 1, 25, 50, "ALTA", "Fase 1", "VALIDAR INDICAÇÃO E REGISTRO", "Estoque", "", "Rioquímica", "https://www.rioquimica.com.br", "Selecionar concentração/formulação pelo POP e procedimento; não intercambiar apresentações.")
add("Materiais", "Biossegurança", "Detergente enzimático 1 L", "Riozyme/Endozime", "frasco", 1, 1, 70, 100, "CONDICIONAL", "Fase 1", "VALIDAR REGISTRO E DILUIÇÃO", "Área técnica", "", "Distribuidor", "", "Somente se houver processamento interno.")
add("Materiais", "Biossegurança", "Desinfetante de superfície 1 L", "Uso em serviços de saúde", "frasco", 2, 1, 50, 100, "ALTA", "Fase 1", "VALIDAR REGISTRO E COMPATIBILIDADE", "Estoque", "", "Rioquímica", "https://www.rioquimica.com.br", "Compatível com maca, bancada e equipamentos.")
add("Materiais", "PGRSS", "Coletor perfurocortante 3 L", "Descarpack/Flexpell", "un", 5, 2, 8, 15, "CONDICIONAL", "Fase 2", "VALIDAR REGISTRO", "Sala de procedimentos", "", "Distribuidor", "", "Não ultrapassar linha de enchimento.")
add("Materiais", "PGRSS", "Saco branco leitoso 15 L c/100", "ABNT aplicável", "pct", 1, 1, 15, 30, "CONDICIONAL", "Fase 2", "PGRSS", "Área técnica", "", "Distribuidor", "", "Confirmar segregação e coleta local.")
add("Materiais", "PGRSS", "Lixeira com pedal 15 L", "Lisa e lavável", "un", 4, 0, 60, 100, "ALTA", "Fase 1", "PGRSS", "Clínica", "", "Varejo", "", "Identificar conforme tipo de resíduo.")

# Consumíveis de equipamentos e cosméticos.
add("Insumos", "Aparelhos", "Gel condutor incolor 5 kg", "Carbogel/RMC", "bag", 1, 1, 35, 50, "MÉDIA", "Fase 2", "VALIDAR REGISTRO/COMPATIBILIDADE", "Estoque", "", "Distribuidor", "", "Usar somente onde o manual exigir; Sonofocus pode usar pad específico.")
add("Insumos", "Aparelhos", "Gel glicerinado para radiofrequência 1 kg", "RMC ou equivalente", "pote", 2, 1, 25, 40, "CONDICIONAL", "Fase 2", "VALIDAR COMPATIBILIDADE", "Estoque", "", "Distribuidor", "", "Comprar apenas se RF for selecionada.")
add("Insumos", "Aparelhos", "Focus Pad Sonofocus c/2", "Ibramed", "pct", 5, 2, 30, 35, "CONDICIONAL", "Fase 2", "VALIDAR MODELO", "Estoque", "", "MedEstec", "https://www.medestec.com.br/eletroterapia/hifu/novo-sonofocus-aparelho-hifu-de-ultrassom-focalizado-micro-e-macrofocado-de-alta-intensidade-ibramed", "Comprar somente com Sonofocus e conforme protocolo do fabricante.")
add("Insumos", "Limpeza de pele", "Kit profissional de limpeza", "Bioage Bio-Clean System", "kit", 1, 1, 473, 473, "ALTA", "Fase 1", "VALIDAR NOTIFICAÇÃO E LOTE", "Estoque", "", "Bioage", "https://www.bioageprofissional.com.br/protocolo-limpeza-de-pele-bio-clean-system", "Fabricante declara cinco produtos e rendimento de 50 aplicações.")
add("Insumos", "Limpeza de pele", "Kit profissional de limpeza", "Tulípia Kit Esteticista", "kit", 1, 1, 0, 0, "MÉDIA", "Fase 1", "VALIDAR PREÇO/NOTIFICAÇÃO", "Estoque", "KIT_COSMETICO", "Tulípia", "https://tulipia.com.br/kit-esteticista-iniciante/p", "Alternativa ao Bioage; preço exige cadastro/cotação.")
add("Insumos", "Limpeza de pele", "Kit profissional de limpeza", "ADCOS Pro", "kit", 1, 1, 0, 0, "BAIXA", "Expansão", "VALIDAR PREÇO/DOCUMENTAÇÃO", "Estoque", "KIT_COSMETICO", "ADCOS", "https://www.adcosprofissional.com.br/", "Fornecedor exige validação documental profissional.")
add("Insumos", "Peeling ultrassônico", "Solução/meio aprovado pelo fabricante", "Conforme manual Sonopeel", "frasco", 1, 1, 0, 0, "CONDICIONAL", "Fase 2", "VALIDAR COMPATIBILIDADE", "Estoque", "", "Distribuidor autorizado", "https://ibramed.com.br/peeling-ultrassonico/sonopeel/", "Cadastrar marca, apresentação, preço e validade somente após confirmação no manual vigente.")
add("Insumos", "Aparelhos", "Lenços desidratados c/100", "Santa Clara", "pct", 2, 1, 15, 25, "MÉDIA", "Fase 1", "USO GERAL", "Estoque", "", "Distribuidor", "", "Ajustar ao protocolo de limpeza.")
add("Insumos", "Aparelhos", "Filme osmótico 100 m", "Santa Clara", "rolo", 1, 1, 10, 20, "MÉDIA", "Fase 1", "USO GERAL", "Estoque", "", "Distribuidor", "", "Uso conforme cosmético e POP.")

# Injetáveis e dispositivos condicionais: estoque piloto, nunca somado ao cenário sem desbloqueio.
add("Injetáveis condicionais", "Dispositivos", "Seringa Luer Lock 1 mL c/100", "BD/Descarpack", "cx", 1, 1, 40, 70, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO", "Estoque", "", "Distribuidor autorizado", "", "Lote e validade vinculados ao atendimento.")
add("Injetáveis condicionais", "Dispositivos", "Agulhas para injetáveis c/100", "BD/Descarpack; calibres definidos pelo RT", "cx", 1, 1, 35, 90, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO", "Estoque", "", "Distribuidor autorizado", "", "Não definir calibre sem protocolo do responsável técnico.")
add("Injetáveis condicionais", "Dispositivos", "Microcânulas c/10", "TSK ou regular equivalente", "cx", 2, 1, 150, 250, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO", "Estoque", "", "Distribuidor autorizado", "", "Tamanhos definidos pelo responsável técnico.")
add("Injetáveis condicionais", "Toxina", "Toxina botulínica tipo A 100 U", "Marca regular selecionada pelo RT", "frasco", 4, 1, 630, 800, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO E BULA", "Cadeia fria/estoque", "", "Distribuidor autorizado", "", "Estoque piloto; armazenamento individual conforme bula, sem regra genérica.")
add("Injetáveis condicionais", "Preenchedor", "Ácido hialurônico 1 mL", "Rennova/Restylane/Juvéderm ou regular", "seringa", 6, 2, 210, 1150, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO E REGISTRO", "Estoque", "", "Distribuidor autorizado", "", "Perfis reológicos e indicações definidos pelo RT; rastrear lote.")
add("Injetáveis condicionais", "Bioestimulador", "PLLA", "Sculptra ou regular equivalente", "un", 2, 1, 825, 1200, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO E REGISTRO", "Estoque", "", "My Galderma Store", "https://www.galdermaaesthetics.com.br/bioestimulador-recuperacao-firmeza-cutanea", "Registro Sculptra 80251760008 informado pelo fabricante; preço unitário depende da apresentação.")
add("Injetáveis condicionais", "Bioestimulador", "CaHA", "Radiesse ou regular equivalente", "seringa", 2, 1, 620, 730, "BLOQUEADO", "Após licença", "BLOQUEADO ATÉ HABILITAÇÃO E REGISTRO", "Estoque", "", "Distribuidor autorizado", "", "Estoque piloto; validar registro, lote e bula.")
add("Injetáveis condicionais", "Intercorrência", "Hialuronidase", "Produto regular definido pelo RT", "frasco", 2, 1, 180, 250, "BLOQUEADO", "Antes do primeiro preenchimento", "BLOQUEADO ATÉ PRESCRIÇÃO/HABILITAÇÃO", "Estoque de emergência", "", "Distribuidor autorizado", "", "Sem protocolo ou dose neste planejamento; controle de acesso e validade.")
add("Injetáveis condicionais", "Intercorrência", "Kit de emergência", "Conteúdo definido e assinado pelo RT", "kit", 1, 1, 500, 2000, "BLOQUEADO", "Antes de procedimentos invasivos", "BLOQUEADO ATÉ RESPONSÁVEL TÉCNICO", "Sala de procedimentos", "", "Fornecedor autorizado", "", "Lista, treinamento, checagem e reposição definidos por profissional habilitado.")

# Apoio clínico, fotografia, TI e segurança.
add("Apoio clínico", "Sinais vitais", "Esfigmomanômetro adulto", "Omron ou equipamento regular", "un", 1, 0, 180, 450, "ALTA", "Fase 1", "VALIDAR REGISTRO E CALIBRAÇÃO", "Sala de procedimentos", "", "Distribuidor saúde", "", "Modelo adequado ao responsável técnico e treinamento.")
add("Apoio clínico", "Sinais vitais", "Estetoscópio", "Littmann/Spirit ou regular", "un", 1, 0, 150, 750, "MÉDIA", "Fase 1", "VALIDAR REGISTRO", "Sala de procedimentos", "", "Distribuidor saúde", "", "Seleção pelo responsável técnico.")
add("Apoio clínico", "Sinais vitais", "Oxímetro de pulso", "G-Tech/MD ou regular", "un", 1, 1, 90, 350, "ALTA", "Fase 1", "VALIDAR REGISTRO", "Sala de procedimentos", "", "Distribuidor saúde", "", "Manter pilhas e teste funcional.")
add("Apoio clínico", "Sinais vitais", "Termômetro clínico digital", "G-Tech/Incoterm ou regular", "un", 2, 1, 25, 80, "MÉDIA", "Fase 1", "VALIDAR REGISTRO", "Sala de procedimentos", "", "Distribuidor saúde", "", "Um principal e um reserva.")
add("Apoio clínico", "Fotografia", "Tripé estável para smartphone", "Cabeça ajustável", "un", 1, 0, 150, 500, "ALTA", "Fase 1", "NÃO REGULADO", "Avaliação", "", "Varejo", "", "Marcar posição fixa no piso para repetibilidade.")
add("Apoio clínico", "Fotografia", "Iluminação fotográfica difusa", "Dois painéis LED com CRI alto", "kit", 1, 0, 600, 1800, "MÉDIA", "Fase 1", "SEGURANÇA ELÉTRICA", "Avaliação", "", "Varejo fotografia", "", "Evitar ring light como única fonte; padronizar altura, distância e balanço de branco.")
add("Apoio clínico", "Fotografia", "Fundo fotográfico lavável", "Cinza neutro fosco", "un", 1, 0, 250, 800, "MÉDIA", "Fase 1", "NÃO REGULADO", "Avaliação", "", "Varejo fotografia", "", "Sem reflexo e com marcação de posição.")
add("Apoio clínico", "Fotografia", "Escala/cartão de cor", "Escala métrica e cinza neutro", "un", 2, 1, 50, 250, "MÉDIA", "Fase 1", "NÃO REGULADO", "Avaliação", "", "Varejo fotografia", "", "Higienizável e sem dados do paciente.")
add("Tecnologia", "Administração", "Notebook administrativo", "16 GB RAM, SSD e câmera", "un", 1, 0, 3000, 5500, "ALTA", "Fase 1", "LGPD/SEGURANÇA", "Administração", "", "Varejo", "", "Criptografia, senha forte e bloqueio automático.")
add("Tecnologia", "Administração", "Impressora multifuncional", "Tanque de tinta ou laser", "un", 1, 0, 900, 1800, "MÉDIA", "Fase 1", "LGPD/SEGURANÇA", "Administração", "", "Varejo", "", "Evitar bandeja de saída acessível ao público.")
add("Tecnologia", "Administração", "Impressora térmica de etiquetas", "Compatível com etiquetas de lote", "un", 1, 0, 500, 1200, "MÉDIA", "Fase 1", "RASTREABILIDADE", "Administração", "", "Varejo", "", "Integrar ao estoque futuramente.")
add("Tecnologia", "Energia", "Nobreak para rede e computador", "1200–1500 VA", "un", 1, 0, 800, 1600, "MÉDIA", "Fase 1", "SEGURANÇA ELÉTRICA", "Administração", "", "Varejo", "", "Não ligar equipamentos terapêuticos sem autorização do fabricante.")
add("Segurança", "Incêndio", "Extintor e suporte", "Tipo/quantidade definidos pelo AVCB/CLCB", "conj", 1, 0, 250, 600, "ALTA", "Obra", "VALIDAR BOMBEIROS", "Circulação", "", "Empresa certificada", "", "Não definir classe sem projeto e regra local.")
add("Segurança", "Emergência", "Luminária de emergência", "Autônoma e testável", "un", 3, 0, 60, 180, "ALTA", "Obra", "VALIDAR BOMBEIROS", "Circulação", "", "Empresa elétrica", "", "Posições conforme projeto e saída.")
add("Segurança", "Emergência", "Placa de saída e rota", "Fotoluminescente", "conj", 1, 0, 120, 350, "ALTA", "Obra", "VALIDAR BOMBEIROS/ACESSIBILIDADE", "Circulação", "", "Empresa certificada", "", "Altura e contraste conforme projeto local.")

# Limpeza, sanitário, esterilização e pequenos acessórios.
add("Limpeza", "Equipamentos", "Mop úmido com refil", "Sistema profissional", "kit", 2, 1, 120, 300, "ALTA", "Fase 1", "POP DE LIMPEZA", "DML/área técnica", "", "Varejo profissional", "", "Separar refis por área/cor.")
add("Limpeza", "Equipamentos", "Balde duplo com espremedor", "20–30 L", "un", 1, 0, 180, 500, "ALTA", "Fase 1", "POP DE LIMPEZA", "DML/área técnica", "", "Varejo profissional", "", "Compatível com técnica aprovada.")
add("Limpeza", "Equipamentos", "Panos de microfibra coloridos", "Cores por área", "un", 24, 8, 4, 12, "ALTA", "Fase 1", "POP DE LIMPEZA", "DML/área técnica", "", "Varejo", "", "Não misturar panos de sanitário, recepção e área assistencial.")
add("Limpeza", "Segurança", "Placa piso molhado", "Dobrável", "un", 2, 0, 40, 100, "ALTA", "Fase 1", "SEGURANÇA", "DML/área técnica", "", "Varejo", "", "Manter rota alternativa livre.")
add("Limpeza", "EPI", "Luva de borracha cano longo", "Tamanhos por equipe", "par", 4, 2, 12, 35, "ALTA", "Fase 1", "VALIDAR CA", "DML/área técnica", "", "Distribuidor EPI", "", "Uso exclusivo por área.")
add("Limpeza", "Armazenamento", "Armário exclusivo para saneantes", "Fechado, ventilado e sinalizado", "un", 1, 0, 500, 1400, "ALTA", "Obra", "POP DE LIMPEZA", "Área técnica", "", "Marcenaria local", "", "Fora do alcance do público e separado de cosméticos.")
add("Sanitário", "Acessibilidade", "Barras de apoio", "Inox e fixação estrutural", "conj", 1, 0, 450, 1200, "ALTA", "Obra", "NBR 9050/VALIDAR", "Sanitário acessível", "", "Fornecedor acessibilidade", "", "Instalação conforme prancha A-03 e reforço de parede.")
add("Sanitário", "Acessórios", "Dispenser sabonete", "Acionamento fácil e lavável", "un", 1, 0, 50, 180, "ALTA", "Obra", "HIGIENIZAÇÃO", "Sanitário acessível", "", "Varejo", "", "Altura e alcance acessíveis.")
add("Sanitário", "Acessórios", "Dispenser papel-toalha", "Interfolhado", "un", 1, 0, 60, 220, "ALTA", "Obra", "HIGIENIZAÇÃO", "Sanitário acessível", "", "Varejo", "", "Evitar secador de ar na fase inicial.")
add("Sanitário", "Acessórios", "Espelho acessível", "Fixação segura", "un", 1, 0, 180, 450, "ALTA", "Obra", "NBR 9050/VALIDAR", "Sanitário acessível", "", "Vidraçaria local", "", "Inclinação/altura conforme projeto.")
add("Esterilização", "Consumíveis", "Envelope grau cirúrgico c/200", "Tamanho definido pelos artigos", "cx", 2, 1, 45, 85, "CONDICIONAL", "Após validação", "PROCESSAMENTO CONDICIONAL", "Área técnica", "", "Dental Cremer", "https://www.dentalcremer.com.br/", "Compatível com seladora e autoclave.")
add("Esterilização", "Controle", "Indicador químico", "Classe definida pelo RT", "pct", 1, 1, 40, 100, "CONDICIONAL", "Após validação", "PROCESSAMENTO CONDICIONAL", "Área técnica", "", "Distribuidor", "", "Aplicação por ciclo conforme POP.")
add("Esterilização", "Controle", "Indicador biológico", "Compatível com autoclave", "pct", 1, 1, 50, 150, "CONDICIONAL", "Após validação", "PROCESSAMENTO CONDICIONAL", "Área técnica", "", "Distribuidor", "", "Frequência aprovada pelo RT e norma aplicável.")
add("Esterilização", "Consumíveis", "Água destilada 5 L", "Fabricante regular", "galão", 2, 1, 15, 30, "CONDICIONAL", "Após validação", "PROCESSAMENTO CONDICIONAL", "Área técnica", "", "Distribuidor", "", "Usar conforme manual da autoclave.")
add("Esterilização", "Instrumental", "Cuba e bandeja inox", "Tamanhos compatíveis", "un", 4, 2, 60, 250, "CONDICIONAL", "Após validação", "PROCESSAMENTO CONDICIONAL", "Área técnica", "", "Distribuidor", "", "Fluxo sujo/limpo segregado.")
add("Esterilização", "Instrumental", "Escova para limpeza de artigos", "Cabo longo", "un", 4, 2, 15, 50, "CONDICIONAL", "Após validação", "PROCESSAMENTO CONDICIONAL", "Área técnica", "", "Distribuidor", "", "Uso, secagem e substituição definidos pelo POP.")
add("Conforto", "Recepção", "Apoio para bolsas", "Gancho/prateleira lavável", "un", 2, 0, 50, 150, "BAIXA", "Fase 1", "NÃO REGULADO", "Recepção", "", "Varejo", "", "Fixação segura fora da rota.")
add("Conforto", "Recepção", "Porta-guarda-chuvas", "Bandeja removível", "un", 1, 0, 120, 300, "BAIXA", "Fase 1", "NÃO REGULADO", "Recepção", "", "Varejo", "", "Evitar água na rota acessível.")
add("Conforto", "Recepção", "Caixa de som ambiente", "Volume limitado", "un", 1, 0, 200, 600, "BAIXA", "Fase 1", "PRIVACIDADE", "Recepção", "", "Varejo", "", "Não mascarar chamadas nem conversas clínicas.")
add("Conforto", "Recepção", "Carregador USB-C certificado", "Múltiplas portas", "un", 2, 1, 80, 250, "BAIXA", "Fase 1", "SEGURANÇA ELÉTRICA", "Recepção", "", "Varejo", "", "Instalar sem cabos atravessando circulação.")

# Área externa drenante.
add("Área externa", "Drenagem", "Grama sintética permeável", "30–35 mm, proteção UV", "m²", 19.44, 0, 80, 180, "MÉDIA", "Obra", "FICHA TÉCNICA", "Área externa", "", "Cotação regional", "", "Quantidade inclui 8% de perdas; exigir vazão ensaiada.")
add("Área externa", "Drenagem", "Piso permeável da rota acessível", "Paver/drenante antiderrapante", "m²", 12.96, 0, 100, 220, "ALTA", "Obra", "ACESSIBILIDADE", "Área externa", "", "Cotação regional", "", "Quantidade inclui 8% de perdas.")
add("Área externa", "Drenagem", "Geotêxtil não tecido", "Separação de camadas", "m²", 33, 0, 8, 20, "ALTA", "Obra", "ESPECIFICAR GRAMATURA", "Área externa", "", "Cotação regional", "", "Inclui 10% de sobreposição/perdas.")
add("Área externa", "Drenagem", "Base granular solta", "Brita graduada/aberta", "m³", 3.6, 0, 180, 350, "ALTA", "Obra", "DIMENSIONAR SOLO", "Área externa", "", "Cotação regional", "", "Inclui 20% de acomodação.")
add("Área externa", "Drenagem", "Regularização fina", "Pó de pedra/agregado drenante", "m³", 1.44, 0, 180, 320, "ALTA", "Obra", "DIMENSIONAR SOLO", "Área externa", "", "Cotação regional", "", "Não selar a base.")
add("Área externa", "Drenagem", "Dreno linear com grelha", "Grelha compatível com rota", "m", 10, 0, 120, 300, "ALTA", "Obra", "DIMENSIONAR HIDRÁULICA", "Área externa", "", "Cotação regional", "", "Duas caixas de inspeção adicionais.")

csv_path = OUT / "catalogo_mestre.csv"
json_path = OUT / "catalogo_mestre.json"
md_path = BASE / "docs" / "catalogo_mestre.md"
with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=cols)
    writer.writeheader()
    writer.writerows(rows)
with json_path.open("w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

money = lambda v: "[COTAR]" if not v else f"R$ {float(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
groups = []
for row in rows:
    if row["categoria"] not in groups:
        groups.append(row["categoria"])

md = [
    "# Catálogo mestre de implantação",
    "",
    "**Clínica Lumina Skin Intelligence**  ",
    "**Data-base dos preços:** 29 de agosto de 2026  ",
    "**Escala inicial:** aproximadamente 40 atendimentos/mês",
    "",
    "> Valores são referências de planejamento, não propostas vinculantes. Frete, instalação, treinamento, tributos, adequações e atualização até a compra devem ser cotados. Itens marcados como bloqueados não devem ser adquiridos nem utilizados sem habilitação, responsável técnico, licença, registro vigente e POP aprovado.",
    "",
]
for group in groups:
    md.extend([
        f"## {group}",
        "",
        "| Item | Marca/modelo | Qtd. inicial | Faixa unitária | Prioridade | Fase | Status |",
        "|---|---|---:|---:|---|---|---|",
    ])
    for r in (x for x in rows if x["categoria"] == group):
        price = f"{money(r['preco_unit_min'])}–{money(r['preco_unit_max'])}" if r["preco_unit_max"] else "[COTAR]"
        md.append(f"| {r['item']} | {r['marca_modelo']} | {r['quantidade_inicial']} {r['unidade']} | {price} | {r['prioridade']} | {r['fase_compra']} | {r['status_sanitario']} |")
    md.append("")

md.extend([
    "## Comparativos vinculados",
    "",
    "Os três itens do grupo de escolha `HIFU` são detalhados em `docs/decisao_equipamentos.md`, incluindo consumíveis, garantia, assistência, pendências bloqueadoras e recomendação final. A seleção de um modelo deve excluir os demais do orçamento do mesmo cenário.",
    "",
    "## Critérios de decisão",
    "",
    "Itens com o mesmo **grupo de escolha** são alternativas e não devem ser somados automaticamente. O painel deverá selecionar uma opção por tecnologia, manter as demais para comparação e recalcular o orçamento. Quantidades de descartáveis são referências de partida e serão reajustadas pelo consumo real. Injetáveis usam estoque piloto e permanecem bloqueados até a liberação documental.",
    "",
    "## Arquivos editáveis",
    "",
    "O catálogo completo está disponível em `docs/dados/catalogo_mestre.csv` e `docs/dados/catalogo_mestre.json`, com fornecedor, URL, observação, ambiente, estoque mínimo e data de preço.",
])
md_path.write_text("\n".join(md) + "\n", encoding="utf-8")

print(f"{len(rows)} itens gravados em {csv_path}, {json_path} e {md_path}")
