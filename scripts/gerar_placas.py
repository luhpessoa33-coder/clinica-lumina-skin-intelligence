from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = Path('/home/ubuntu/clinica_harmonizacao/artefatos/placas')
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'Placas_Biosseguranca_Clínica_Lumina.pdf'

INK = '#24312F'
GOLD = '#B8945E'
SAGE = '#6F8279'
PALE = '#F7F3EC'
WHITE = '#FFFFFF'
MUTED = '#66706D'
LINE = '#D9D2C7'

FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

PLATES = [
    {
        'code': 'PL-01', 'title': 'MÃOS SEGURAS,\nCUIDADO SEGURO', 'place': 'Sobre a pia clínica e no sanitário',
        'actions': [
            'Antes de tocar a pessoa atendida.', 'Antes de procedimento limpo ou asséptico.',
            'Após risco de contato com fluidos.', 'Após tocar a pessoa atendida.',
            'Após tocar superfícies próximas.', 'Água e sabonete quando houver sujeira visível.',
            'Luvas não substituem a higiene das mãos.'
        ],
        'note': 'Retire adornos. Mantenha unhas curtas. Respeite o tempo indicado no produto e no cartaz oficial.'
    },
    {
        'code': 'PL-02', 'title': 'SALA PRONTA\nPARA RECEBER', 'place': 'Entrada interna da sala principal',
        'actions': [
            'Superfícies limpas, secas e íntegras.', 'Cobertura nova na maca.',
            'Somente materiais deste atendimento.', 'Lote, validade e embalagem conferidos.',
            'Lixeiras e coletor posicionados.', 'Equipamento liberado e cabos organizados.',
            'Checklist registrado antes de iniciar.'
        ],
        'note': 'Não use equipamento sem registro, treinamento, manutenção e parâmetros aprovados.'
    },
    {
        'code': 'PL-03', 'title': 'ENTRE CADA\nATENDIMENTO', 'place': 'Área de apoio e sala principal',
        'actions': [
            'Segregue resíduos no ponto de geração.', 'Remova matéria orgânica conforme o POP.',
            'Limpe e desinfete superfícies tocadas.', 'Respeite diluição e tempo de contato.',
            'Troque a cobertura da maca.', 'Reponha apenas o necessário.',
            'Higienize as mãos e registre a execução.'
        ],
        'note': 'Nunca misture saneantes. Não faça varredura a seco.'
    },
    {
        'code': 'PL-04', 'title': 'PERFUROCORTANTES:\nDESCARTE IMEDIATO', 'place': 'Acima do coletor rígido',
        'actions': [
            'Descarte imediatamente no ponto de uso.', 'Nunca reencape.',
            'Nunca entorte ou quebre.', 'Não desconecte manualmente.',
            'Mantenha o coletor firme e fora do chão.', 'Troque no limite indicado.',
            'Comunique qualquer acidente imediatamente.'
        ],
        'note': 'Coletor rígido, identificado, visível e próximo do procedimento.'
    },
    {
        'code': 'PL-05', 'title': 'RESÍDUOS NO\nLUGAR CERTO', 'place': 'Área técnica',
        'actions': [
            'Separe no momento e local de geração.', 'Comum conforme o PGRSS.',
            'Infectante conforme o PGRSS.', 'Químico conforme o PGRSS.',
            'Perfurocortante em coletor rígido.', 'Feche, identifique e encaminhe.',
            'Nunca compacte sacos com as mãos.'
        ],
        'note': 'Mantenha contratos, manifestos e licenças de coleta quando exigidos.'
    },
    {
        'code': 'PL-06', 'title': 'FLUXO DO MATERIAL:\nSUJO → LIMPO', 'place': 'Área de processamento condicional',
        'actions': [
            'Receber e identificar.', 'Limpar conforme classificação.', 'Enxaguar e secar.',
            'Inspecionar.', 'Embalar e identificar.', 'Esterilizar e liberar.', 'Armazenar protegido.'
        ],
        'note': 'Uso condicionado ao POP aprovado, à RDC nº 15/2012 e à definição entre processamento interno ou terceirizado.'
    },
    {
        'code': 'PL-07', 'title': 'CADEIA FRIA\nSOB CONTROLE', 'place': 'Porta externa da câmara dedicada',
        'actions': [
            'Confira a faixa específica da bula.', 'Registre temperatura e alarmes.',
            'Mantenha a porta fechada.', 'Nunca armazene alimentos.',
            'Registre lote e validade.', 'Desvio significa quarentena: não usar.',
            'Acione a contingência e o responsável técnico.'
        ],
        'note': 'A faixa não é igual para todos os produtos. Confirme a bula da apresentação recebida.'
    },
    {
        'code': 'PL-08', 'title': 'FECHAMENTO\nSEGURO', 'place': 'Área técnica e saída da equipe',
        'actions': [
            'Finalize limpeza e desinfecção.', 'Recolha resíduos conforme o PGRSS.',
            'Guarde equipamentos limpos e secos.', 'Confira estoque e validade próxima.',
            'Registre a cadeia fria autorizada.', 'Desligue, feche, trave e ative a segurança.',
            'Registre e comunique pendências.'
        ],
        'note': 'Não deixe não conformidades sem responsável e prazo.'
    },
]


def font(path, size):
    return ImageFont.truetype(path, size)


def lines_for(draw, text, fnt, max_width):
    words, lines, current = text.split(), [], ''
    for word in words:
        candidate = f'{current} {word}'.strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def render_png(data):
    W, H = 2480, 3508
    img = Image.new('RGB', (W, H), PALE)
    d = ImageDraw.Draw(img)
    reg = font(FONT_REG, 42)
    small = font(FONT_REG, 33)
    tiny = font(FONT_REG, 26)
    bold = font(FONT_BOLD, 48)
    title = font(FONT_BOLD, 108)
    brand = font(FONT_BOLD, 66)

    d.rounded_rectangle((120, 105, W-120, H-105), radius=24, fill=WHITE, outline=INK, width=4)
    d.text((190, 175), 'LUMINA', font=brand, fill=INK)
    d.text((193, 255), 'S K I N   I N T E L L I G E N C E', font=tiny, fill=GOLD)
    d.line((190, 335, W-190, 335), fill=LINE, width=4)
    d.rounded_rectangle((W-505, 170, W-190, 275), radius=48, fill=INK)
    d.text((W-347, 223), data['code'], font=bold, fill=WHITE, anchor='mm')

    y = 455
    for line in data['title'].split('\n'):
        d.text((190, y), line, font=title, fill=INK)
        y += 125
    d.rectangle((190, y+12, 390, y+25), fill=GOLD)
    y += 105
    d.text((190, y), 'LOCAL SUGERIDO', font=tiny, fill=SAGE)
    y += 48
    d.text((190, y), data['place'], font=small, fill=MUTED)
    y += 110

    for idx, action in enumerate(data['actions'], 1):
        d.ellipse((190, y-3, 270, y+77), fill=SAGE)
        d.text((230, y+37), str(idx), font=bold, fill=WHITE, anchor='mm')
        wrapped = lines_for(d, action, reg, W-570)
        for j, line in enumerate(wrapped):
            d.text((315, y+6+j*52), line, font=reg, fill=INK)
        y += max(122, 52*len(wrapped)+36)

    note_y = H-640
    d.rounded_rectangle((190, note_y, W-190, note_y+230), radius=18, fill='#EEF1ED', outline=SAGE, width=3)
    d.text((235, note_y+35), 'ATENÇÃO', font=bold, fill=SAGE)
    note_lines = lines_for(d, data['note'], small, W-500)
    for j, line in enumerate(note_lines):
        d.text((235, note_y+105+j*45), line, font=small, fill=INK)

    d.line((190, H-330, W-190, H-330), fill=LINE, width=3)
    d.text((190, H-285), 'Minuta • validar com Responsável Técnico e Vigilância Sanitária local', font=tiny, fill=MUTED)
    d.text((190, H-225), 'Responsável técnico: ______________________________', font=tiny, fill=INK)
    d.text((W-190, H-225), 'Versão 0.1 • 29/08/2026', font=tiny, fill=INK, anchor='ra')
    out = OUT / f"{data['code']}_{data['title'].splitlines()[0].lower().replace(' ', '_').replace(':','')}.png"
    img.save(out, 'PNG', optimize=True)
    return out


def draw_wrapped_pdf(c, text, x, y, max_chars, leading, font_name='Helvetica', font_size=10, color=INK):
    c.setFont(font_name, font_size)
    c.setFillColor(HexColor(color))
    for line in wrap(text, width=max_chars):
        c.drawString(x, y, line)
        y -= leading
    return y


def render_pdf():
    c = canvas.Canvas(str(PDF), pagesize=A4)
    w, h = A4
    for data in PLATES:
        c.setFillColor(HexColor(PALE)); c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setFillColor(HexColor(WHITE)); c.setStrokeColor(HexColor(INK)); c.setLineWidth(1.2)
        c.roundRect(28, 25, w-56, h-50, 8, fill=1, stroke=1)
        c.setFillColor(HexColor(INK)); c.setFont('Helvetica-Bold', 21); c.drawString(46, h-66, 'LUMINA')
        c.setFillColor(HexColor(GOLD)); c.setFont('Helvetica', 6.8); c.drawString(47, h-80, 'S K I N   I N T E L L I G E N C E')
        c.setFillColor(HexColor(INK)); c.roundRect(w-128, h-83, 82, 30, 15, fill=1, stroke=0)
        c.setFillColor(HexColor(WHITE)); c.setFont('Helvetica-Bold', 13); c.drawCentredString(w-87, h-73, data['code'])
        c.setStrokeColor(HexColor(LINE)); c.line(46, h-98, w-46, h-98)
        y = h-143
        c.setFillColor(HexColor(INK)); c.setFont('Helvetica-Bold', 25)
        for line in data['title'].split('\n'):
            c.drawString(46, y, line); y -= 31
        c.setFillColor(HexColor(GOLD)); c.rect(46, y-4, 55, 3, fill=1, stroke=0)
        y -= 30
        c.setFont('Helvetica-Bold', 7); c.setFillColor(HexColor(SAGE)); c.drawString(46, y, 'LOCAL SUGERIDO')
        y -= 14
        c.setFont('Helvetica', 9); c.setFillColor(HexColor(MUTED)); c.drawString(46, y, data['place'])
        y -= 28
        for idx, action in enumerate(data['actions'], 1):
            c.setFillColor(HexColor(SAGE)); c.circle(58, y+3, 10, fill=1, stroke=0)
            c.setFillColor(HexColor(WHITE)); c.setFont('Helvetica-Bold', 8); c.drawCentredString(58, y, str(idx))
            y = draw_wrapped_pdf(c, action, 78, y+4, 75, 12, 'Helvetica', 10, INK)-10
        box_y = 113
        c.setFillColor(HexColor('#EEF1ED')); c.setStrokeColor(HexColor(SAGE)); c.roundRect(46, box_y, w-92, 64, 6, fill=1, stroke=1)
        c.setFillColor(HexColor(SAGE)); c.setFont('Helvetica-Bold', 9); c.drawString(58, box_y+45, 'ATENÇÃO')
        draw_wrapped_pdf(c, data['note'], 58, box_y+30, 88, 10, 'Helvetica', 7.8, INK)
        c.setStrokeColor(HexColor(LINE)); c.line(46, 92, w-46, 92)
        c.setFillColor(HexColor(MUTED)); c.setFont('Helvetica', 6.7)
        c.drawString(46, 78, 'Minuta • validar com Responsável Técnico e Vigilância Sanitária local')
        c.setFillColor(HexColor(INK)); c.drawString(46, 61, 'Responsável técnico: ______________________________')
        c.drawRightString(w-46, 61, 'Versão 0.1 • 29/08/2026')
        c.showPage()
    c.save()


if __name__ == '__main__':
    files = [render_png(p) for p in PLATES]
    render_pdf()
    print(f'{len(files)} placas PNG geradas')
    print(PDF)
