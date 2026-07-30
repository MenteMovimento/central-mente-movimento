# -*- coding: utf-8 -*-
"""Generate the PDF manuals published by the Central MenteMovimento site."""

from __future__ import annotations

import argparse
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Circle, Drawing, Line, Rect, String
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
UPDATED_AT = "22/06/2026"
REPO_URL = "https://github.com/MenteMovimento/central-mente-movimento"
SITE_URL = "https://central-mente-movimento.vercel.app"

OUTPUTS = {
    "initial": ROOT / "portal/docs/Manual_Inicial_MenteMovimento.pdf",
    "socios_user": ROOT / "portal/modules/socios/docs/Manual_Utilizador_Gestao_Socios.pdf",
    "socios_dev": ROOT / "portal/modules/socios/docs/Manual_Programador_Gestao_Socios.pdf",
    "utentes_user_pt": ROOT / "portal/modules/utentes/docs/Manual_Utilizador_Utentes.pdf",
    "utentes_dev_pt": ROOT / "portal/modules/utentes/docs/Manual_Programador_Utentes.pdf",
    "utentes_user_en": ROOT / "portal/modules/utentes/docs/Manual_User_Utentes.pdf",
    "utentes_dev_en": ROOT / "portal/modules/utentes/docs/Manual_Programmer_Utentes.pdf",
    "dispositivos_user": ROOT / "portal/modules/dispositivos/public/docs/Manual_Utilizador_Ciberseguranca.pdf",
    "dispositivos_dev": ROOT / "portal/modules/dispositivos/public/docs/Manual_Programador_Ciberseguranca.pdf",
    "atividades_user": ROOT / "portal/modules/atividades/docs/Manual_Utilizador_Atividades.pdf",
    "atividades_dev": ROOT / "portal/modules/atividades/docs/Manual_Programador_Atividades.pdf",
}


def register_fonts() -> tuple[str, str]:
    candidates = [
        (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")),
        (Path("C:/Windows/Fonts/calibri.ttf"), Path("C:/Windows/Fonts/calibrib.ttf")),
    ]
    for regular, bold in candidates:
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("ManualRegular", str(regular)))
            pdfmetrics.registerFont(TTFont("ManualBold", str(bold)))
            return "ManualRegular", "ManualBold"
    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = register_fonts()
LOGO = ROOT / "portal/static/mente-movimento-logo.png"


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ManualTitle",
            parent=base["Title"],
            fontName=FONT_BOLD,
            fontSize=24,
            leading=29,
            textColor=colors.HexColor("#04265a"),
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "subtitle": ParagraphStyle(
            "ManualSubtitle",
            parent=base["Normal"],
            fontName=FONT_REGULAR,
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#3c5871"),
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "h1": ParagraphStyle(
            "ManualH1",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=15,
            leading=19,
            textColor=colors.HexColor("#06285a"),
            spaceBefore=12,
            spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "ManualH2",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0d7668"),
            spaceBefore=9,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "ManualBody",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9.6,
            leading=13.3,
            textColor=colors.HexColor("#172b3a"),
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "ManualSmall",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8.1,
            leading=10.8,
            textColor=colors.HexColor("#344f61"),
            spaceAfter=3,
        ),
        "bullet": ParagraphStyle(
            "ManualBullet",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9.3,
            leading=12.6,
            leftIndent=0,
            textColor=colors.HexColor("#172b3a"),
        ),
        "note": ParagraphStyle(
            "ManualNote",
            parent=base["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#24445c"),
            backColor=colors.HexColor("#e8f7f2"),
            borderColor=colors.HexColor("#9ee8ce"),
            borderWidth=0.7,
            borderPadding=7,
            spaceBefore=6,
            spaceAfter=9,
        ),
        "code": ParagraphStyle(
            "ManualCode",
            parent=base["Code"],
            fontName="Courier",
            fontSize=7.8,
            leading=10.6,
            textColor=colors.HexColor("#17324a"),
            backColor=colors.HexColor("#f1f6f7"),
            borderColor=colors.HexColor("#c5d7dc"),
            borderWidth=0.6,
            borderPadding=7,
            leftIndent=0,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "footer": ParagraphStyle(
            "ManualFooter",
            parent=base["Normal"],
            fontName=FONT_REGULAR,
            fontSize=7.4,
            textColor=colors.HexColor("#6d8190"),
        ),
    }


S = styles()


def on_page(canvas, doc):
    canvas.saveState()
    width, _ = A4
    canvas.setStrokeColor(colors.HexColor("#d6e4e8"))
    canvas.line(1.6 * cm, 1.25 * cm, width - 1.6 * cm, 1.25 * cm)
    updated_at = getattr(doc, "updated_at", UPDATED_AT)
    footer = f"MenteMovimento - {doc.title_text} - atualizado em {updated_at} - pagina {doc.page}"
    canvas.setFont(FONT_REGULAR, 7.2)
    canvas.setFillColor(colors.HexColor("#6d8190"))
    canvas.drawString(1.6 * cm, 0.82 * cm, footer)
    canvas.restoreState()


def clean(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )


def p(text: str, style: str = "body"):
    return Paragraph(clean(text), S[style])


def bullet_list(items):
    return ListFlowable(
        [ListItem(p(item, "bullet"), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=14,
        bulletFontName=FONT_REGULAR,
        bulletFontSize=6,
        spaceAfter=7,
    )


def numbered_list(items):
    return ListFlowable(
        [ListItem(p(item, "bullet"), leftIndent=14) for item in items],
        bulletType="1",
        leftIndent=16,
        bulletFontName=FONT_REGULAR,
        bulletFontSize=8,
        spaceAfter=7,
    )


def info_table(headers, rows, col_widths=None, first_column_tint=False):
    if col_widths is None:
        col_widths = [5.2 * cm, 5.2 * cm, 6.0 * cm][: len(headers)]
    data = [[p(value, "small") for value in headers]]
    data.extend([[p(value, "small") for value in row] for row in rows])
    table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dff1ed")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#064f49")),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#bfd3d7")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d7e4e7")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if first_column_tint:
        style.extend(
            [
                ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#f1f8f6")),
                ("FONTNAME", (0, 1), (0, -1), FONT_BOLD),
                ("TEXTCOLOR", (0, 1), (0, -1), colors.HexColor("#075f56")),
            ]
        )
    table.setStyle(TableStyle(style))
    return table


def drawing_text(drawing, x, y, value, size=8, bold=False, colour="#172b3a", anchor="start"):
    drawing.add(
        String(
            x,
            y,
            value,
            fontName=FONT_BOLD if bold else FONT_REGULAR,
            fontSize=size,
            fillColor=colors.HexColor(colour),
            textAnchor=anchor,
        )
    )


def drawing_button(drawing, x, y, width, height, label, primary=False, danger=False):
    fill = "#177d70" if primary else "#fff3f1" if danger else "#ffffff"
    stroke = "#177d70" if primary else "#f3aaa2" if danger else "#b9ccd1"
    text_colour = "#ffffff" if primary else "#b42318" if danger else "#17324a"
    drawing.add(
        Rect(
            x,
            y,
            width,
            height,
            rx=5,
            ry=5,
            fillColor=colors.HexColor(fill),
            strokeColor=colors.HexColor(stroke),
            strokeWidth=0.8,
        )
    )
    drawing_text(drawing, x + width / 2, y + height / 2 - 2.6, label, 7.2, True, text_colour, "middle")


def drawing_marker(drawing, x, y, number):
    drawing.add(Circle(x, y, 8, fillColor=colors.HexColor("#0c9b7c"), strokeColor=None))
    drawing_text(drawing, x, y - 2.7, str(number), 7.3, True, "#ffffff", "middle")


def socios_dashboard_visual():
    width, height = 476, 246
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f2f7f7"), strokeColor=colors.HexColor("#bed0d5")))
    drawing.add(Rect(0, 202, width, 44, rx=7, ry=7, fillColor=colors.HexColor("#ffffff"), strokeColor=None))
    drawing_text(drawing, 16, 219, "MenteMovimento", 11, True, "#071b4d")
    drawing_text(drawing, 145, 219, "Sócios   Utentes   Cibersegurança   Atividades", 6.7, True, "#5b716e")
    drawing_button(drawing, 337, 211, 82, 25, "+ Novo sócio", primary=True)
    drawing_button(drawing, 423, 211, 24, 25, "Menu")
    drawing_button(drawing, 451, 211, 20, 25, "Conta")
    drawing_marker(drawing, 343, 236, 1)
    drawing_marker(drawing, 448, 238, 2)

    drawing.add(Rect(12, 130, 452, 62, rx=6, ry=6, fillColor=colors.HexColor("#ffffff"), strokeColor=colors.HexColor("#c7d8dc")))
    drawing.add(Rect(22, 159, 292, 23, rx=4, ry=4, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 32, 167, "Pesquisar por nº, nome, NIF, localidade, email...", 7, False, "#708398")
    drawing_button(drawing, 22, 135, 43, 19, "Todos")
    drawing_button(drawing, 70, 135, 82, 19, "Quotas em atraso")
    drawing_button(drawing, 157, 135, 43, 19, "Em dia")
    drawing.add(Rect(330, 146, 53, 35, rx=5, ry=5, fillColor=colors.HexColor("#e5f7f2"), strokeColor=colors.HexColor("#25a88d")))
    drawing_text(drawing, 340, 163, "83", 11, True, "#06285a")
    drawing_text(drawing, 340, 151, "Sócios", 6.2, False, "#486276")
    drawing.add(Rect(390, 146, 62, 35, rx=5, ry=5, fillColor=colors.HexColor("#fff7f5"), strokeColor=colors.HexColor("#e8c3bd")))
    drawing_text(drawing, 400, 163, "12", 11, True, "#b42318")
    drawing_text(drawing, 400, 151, "Em atraso", 6.2, False, "#486276")
    drawing_marker(drawing, 313, 181, 3)
    drawing_marker(drawing, 206, 144, 4)

    drawing.add(Rect(12, 10, 452, 110, rx=6, ry=6, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    drawing_text(drawing, 22, 102, "Sócios registados", 9.3, True, "#071b4d")
    drawing_text(drawing, 22, 90, "83 resultados", 6.4, False, "#486276")
    drawing_text(drawing, 327, 101, "Ordenar", 6.4, False, "#486276")
    drawing_button(drawing, 359, 91, 56, 22, "Nome A-Z")
    drawing_button(drawing, 420, 91, 34, 22, "CSV")
    drawing_marker(drawing, 454, 113, 5)
    drawing.add(Line(12, 82, 464, 82, strokeColor=colors.HexColor("#d8e5e8")))
    for x, label in [(22, "Nº"), (55, "NOME"), (170, "LOCALIDADE"), (252, "QUOTA ANUAL"), (407, "AÇÕES")]:
        drawing_text(drawing, x, 69, label, 6.2, True, "#456173")
    drawing.add(Line(12, 60, 464, 60, strokeColor=colors.HexColor("#d8e5e8")))
    drawing_text(drawing, 22, 42, "105", 7.2, False, "#17324a")
    drawing_text(drawing, 55, 42, "Maria Exemplo", 7.7, True, "#071b4d")
    drawing_text(drawing, 170, 42, "Localidade", 7.2, False, "#17324a")
    drawing_text(drawing, 252, 42, "Quota de 2026 paga", 7.2, False, "#17324a")
    drawing_button(drawing, 352, 28, 42, 23, "Pagar")
    drawing_button(drawing, 398, 28, 18, 23, "Ver")
    drawing_button(drawing, 419, 28, 20, 23, "Editar")
    drawing_button(drawing, 442, 28, 18, 23, "X", danger=True)
    drawing_marker(drawing, 462, 21, 6)
    return drawing


def socios_form_visual():
    width, height = 476, 240
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#ffffff"), strokeColor=colors.HexColor("#bfcfd4")))
    drawing.add(Rect(0, 198, width, 42, rx=7, ry=7, fillColor=colors.HexColor("#f5f9f9"), strokeColor=None))
    drawing_text(drawing, 18, 216, "Editar sócio: Maria Exemplo", 11, True, "#071b4d")
    drawing_button(drawing, 444, 207, 20, 23, "X")
    drawing_marker(drawing, 437, 233, 1)

    fields = [
        (18, 158, 135, "Nº de sócio", "105"),
        (169, 158, 135, "Data de adesão", "15/03/2024"),
        (320, 158, 138, "Última quota paga", "Quota de 2026"),
        (18, 111, 286, "Nome", "Maria Exemplo"),
        (320, 111, 138, "NIF", "000000000"),
        (18, 64, 286, "Email", "exemplo@associacao.pt"),
        (320, 64, 138, "Telemóvel", "900 000 000"),
    ]
    for x, y, w, label, value in fields:
        drawing_text(drawing, x, y + 28, label, 6.4, True, "#506879")
        drawing.add(Rect(x, y, w, 22, rx=4, ry=4, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
        drawing_text(drawing, x + 7, y + 7, value, 7, False, "#17324a")
    drawing_marker(drawing, 459, 177, 2)
    drawing_marker(drawing, 459, 130, 3)
    drawing_button(drawing, 18, 16, 55, 27, "Apagar", danger=True)
    drawing_button(drawing, 344, 16, 55, 27, "Cancelar")
    drawing_button(drawing, 405, 16, 53, 27, "Guardar", primary=True)
    drawing_marker(drawing, 333, 28, 4)
    drawing_marker(drawing, 465, 27, 5)
    return drawing


def socios_publish_visual():
    width, height = 476, 164
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f4f8f8"), strokeColor=colors.HexColor("#bfd1d6")))
    boxes = [
        (14, 99, 101, 42, "Ficheiros-fonte", "portal/modules/socios"),
        (135, 99, 91, 42, "Build", "npm run build"),
        (246, 99, 101, 42, "Saída gerada", "public/area/socios"),
        (367, 99, 94, 42, "Produção", "Vercel"),
    ]
    for x, y, w, h, title, detail in boxes:
        drawing.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#91b6b2")))
        drawing_text(drawing, x + w / 2, y + 25, title, 7.2, True, "#075f56", "middle")
        drawing_text(drawing, x + w / 2, y + 12, detail, 5.8, False, "#3d5869", "middle")
    for x in (122, 233, 354):
        drawing_text(drawing, x, 116, ">", 13, True, "#14846f", "middle")
    drawing.add(Rect(135, 25, 211, 42, rx=5, ry=5, fillColor=colors.HexColor("#e7f4ff"), strokeColor=colors.HexColor("#8bbad8")))
    drawing_text(drawing, 240, 50, "Supabase", 8, True, "#154f73", "middle")
    drawing_text(drawing, 240, 37, "Auth + members + app_users + auditoria + RLS", 6.2, False, "#325d75", "middle")
    drawing.add(Line(240, 67, 240, 94, strokeColor=colors.HexColor("#4e8dac"), strokeWidth=1.2))
    drawing_text(drawing, 18, 11, "Regra: altere a fonte, gere public/ pelo build e só depois publique.", 6.7, True, "#8a3b2d")
    return drawing


def utentes_dashboard_visual():
    width, height = 476, 246
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f3f8f7"), strokeColor=colors.HexColor("#bfd1d6")))
    drawing.add(Rect(0, 202, width, 44, rx=7, ry=7, fillColor=colors.white, strokeColor=None))
    drawing_text(drawing, 15, 219, "MenteMovimento", 11, True, "#071b4d")
    drawing_text(drawing, 147, 219, "Sócios   Utentes   Cibersegurança   Atividades", 6.7, True, "#5b716e")
    drawing_button(drawing, 350, 211, 82, 25, "+ Novo utente", primary=True)
    drawing_button(drawing, 437, 211, 22, 25, "Menu")
    drawing_button(drawing, 462, 211, 13, 25, "Conta")
    drawing_marker(drawing, 350, 237, 1)
    drawing_marker(drawing, 465, 238, 2)

    drawing.add(Rect(12, 137, 452, 54, rx=6, ry=6, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    drawing.add(Rect(22, 159, 432, 22, rx=4, ry=4, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 32, 166, "Pesquisar por nome", 7, False, "#708398")
    drawing_button(drawing, 22, 141, 63, 17, "Pesquisar")
    drawing_button(drawing, 90, 141, 68, 17, "Indicadores")
    drawing_button(drawing, 163, 141, 112, 17, "Exportar backup")
    drawing_marker(drawing, 454, 181, 3)
    drawing_marker(drawing, 279, 149, 4)

    drawing.add(Rect(12, 10, 452, 117, rx=6, ry=6, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    for x, label in [(22, "NOME"), (180, "ESTADO"), (250, "MENSALIDADE"), (400, "AÇÕES")]:
        drawing_text(drawing, x, 108, label, 6.2, True, "#456173")
    drawing.add(Line(12, 97, 464, 97, strokeColor=colors.HexColor("#d8e5e8")))
    drawing_text(drawing, 22, 78, "Maria Exemplo", 8, True, "#071b4d")
    drawing.add(Rect(180, 69, 43, 20, rx=10, ry=10, fillColor=colors.HexColor("#d9f6ec"), strokeColor=None))
    drawing_text(drawing, 201, 76, "Ativo", 6.5, True, "#08765e", "middle")
    drawing.add(Rect(250, 69, 91, 20, rx=10, ry=10, fillColor=colors.HexColor("#e0f7ef"), strokeColor=None))
    drawing_text(drawing, 295, 76, "Pago até julho", 6.2, True, "#08765e", "middle")
    drawing_button(drawing, 356, 67, 18, 23, "€")
    drawing_button(drawing, 377, 67, 18, 23, "Ver")
    drawing_button(drawing, 398, 67, 20, 23, "Editar")
    drawing_button(drawing, 421, 67, 18, 23, "Estado")
    drawing_button(drawing, 442, 67, 18, 23, "X", danger=True)
    drawing_marker(drawing, 462, 91, 5)
    drawing.add(Line(12, 58, 464, 58, strokeColor=colors.HexColor("#d8e5e8")))
    drawing_text(drawing, 22, 39, "Outro utente", 8, True, "#071b4d")
    drawing_text(drawing, 180, 39, "Inativo", 7, False, "#6b7d87")
    drawing_text(drawing, 250, 39, "Sem mensalidade", 7, False, "#b42318")
    drawing_marker(drawing, 463, 22, 6)
    return drawing


def utentes_record_visual():
    width, height = 476, 250
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.white, strokeColor=colors.HexColor("#bfd1d6")))
    drawing_text(drawing, 15, 225, "Maria Exemplo", 15, True, "#071b4d")
    drawing_button(drawing, 337, 218, 41, 23, "Imprimir")
    drawing_button(drawing, 382, 218, 39, 23, "Voltar")
    drawing_button(drawing, 425, 218, 38, 23, "Guardar", primary=True)
    drawing_marker(drawing, 466, 239, 1)

    drawing.add(Rect(12, 166, 452, 41, rx=5, ry=5, fillColor=colors.HexColor("#f4f9f8"), strokeColor=colors.HexColor("#c7d8dc")))
    tabs = ["Referência", "Emergência", "Inscrição", "Diagnóstica", "Atendimentos", "Proteção", "Outros", "Pagamentos"]
    x = 16
    for index, label in enumerate(tabs):
        tab_width = 52 if index not in (4, 7) else 63
        fill = "#2d887d" if index == 0 else "#f4f9f8"
        colour = "#ffffff" if index == 0 else "#17324a"
        drawing.add(Rect(x, 171, tab_width, 30, rx=4, ry=4, fillColor=colors.HexColor(fill), strokeColor=None))
        drawing_text(drawing, x + tab_width / 2, 182, label, 5.5, True, colour, "middle")
        x += tab_width + 2
    drawing_marker(drawing, 462, 203, 2)

    drawing_text(drawing, 18, 148, "Formulário de Referenciação", 9, True, "#16786b")
    fields = [
        (18, 106, 137, "Data de receção", "16/07/2026"),
        (169, 106, 137, "Processo n.º", "USO/07/2026"),
        (320, 106, 138, "Entidade", "Auto-referenciação"),
        (18, 59, 286, "Nome", "Maria Exemplo"),
        (320, 59, 65, "Nascimento", "14/09/1984"),
        (394, 59, 64, "Idade", "41"),
    ]
    for x, y, w, label, value in fields:
        drawing_text(drawing, x, y + 28, label, 6.2, True, "#506879")
        drawing.add(Rect(x, y, w, 22, rx=4, ry=4, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
        drawing_text(drawing, x + 7, y + 7, value, 6.8, False, "#17324a")
    drawing_marker(drawing, 460, 141, 3)
    drawing_marker(drawing, 458, 82, 4)
    drawing.add(Rect(18, 16, 288, 29, rx=4, ry=4, fillColor=colors.HexColor("#f7fbfb"), strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 29, 27, "Anexar folha PDF   |   PDFs anexados", 7, True, "#315568")
    drawing_button(drawing, 320, 16, 63, 29, "Adicionar registo")
    drawing_button(drawing, 391, 16, 67, 29, "Editar pagamento")
    drawing_marker(drawing, 309, 30, 5)
    drawing_marker(drawing, 464, 28, 6)
    return drawing


def utentes_publish_visual():
    width, height = 476, 174
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f4f8f8"), strokeColor=colors.HexColor("#bfd1d6")))
    boxes = [
        (14, 108, 111, 42, "Código Python", "modules/utentes/app.py"),
        (145, 108, 86, 42, "Entrada API", "api/utentes-app.py"),
        (251, 108, 94, 42, "Build central", "npm run build"),
        (365, 108, 96, 42, "Vercel", "/area/utentes/"),
    ]
    for x, y, w, h, title, detail in boxes:
        drawing.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#91b6b2")))
        drawing_text(drawing, x + w / 2, y + 25, title, 7.2, True, "#075f56", "middle")
        drawing_text(drawing, x + w / 2, y + 12, detail, 5.7, False, "#3d5869", "middle")
    for x in (135, 241, 355):
        drawing_text(drawing, x, 126, ">", 13, True, "#14846f", "middle")
    drawing.add(Rect(72, 31, 332, 48, rx=5, ry=5, fillColor=colors.HexColor("#e7f4ff"), strokeColor=colors.HexColor("#8bbad8")))
    drawing_text(drawing, 238, 60, "Supabase", 8.3, True, "#154f73", "middle")
    drawing_text(drawing, 238, 46, "utentes + utente_abas + historico + utente_anexos", 6.2, False, "#325d75", "middle")
    drawing_text(drawing, 238, 35, "Storage privado: documentos-utentes", 6.2, False, "#325d75", "middle")
    drawing.add(Line(238, 79, 238, 103, strokeColor=colors.HexColor("#4e8dac"), strokeWidth=1.2))
    drawing_text(drawing, 18, 13, "Produção usa Supabase; SQLite e ficheiros locais servem apenas para desenvolvimento.", 6.7, True, "#8a3b2d")
    return drawing


def ciber_dashboard_visual():
    width, height = 476, 246
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f3f8f7"), strokeColor=colors.HexColor("#bfd1d6")))
    drawing.add(Rect(0, 205, width, 41, rx=7, ry=7, fillColor=colors.white, strokeColor=None))
    drawing_text(drawing, 15, 220, "MenteMovimento", 11, True, "#071b4d")
    drawing_text(drawing, 144, 220, "Sócios   Utentes   Cibersegurança   Atividades", 6.6, True, "#5b716e")
    drawing_button(drawing, 431, 212, 21, 24, "Menu")
    drawing_button(drawing, 456, 212, 18, 24, "Conta")
    drawing_marker(drawing, 466, 239, 1)

    for x, label, value in [(12, "TOTAL", "42"), (126, "ATIVOS", "30"), (240, "MANUTENÇÃO", "8"), (354, "ARQUIVADOS", "4")]:
        drawing.add(Rect(x, 159, 105, 34, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
        drawing_text(drawing, x + 9, 178, label, 5.8, True, "#506879")
        drawing_text(drawing, x + 91, 170, value, 11, True, "#075f56", "end")
    drawing_marker(drawing, 461, 192, 2)

    drawing.add(Rect(12, 12, 178, 136, rx=6, ry=6, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    drawing_text(drawing, 23, 130, "Novo registo", 9, True, "#071b4d")
    for x, y, w, label in [(22, 91, 72, "ID"), (102, 91, 76, "Data entrada"), (22, 55, 72, "Marca"), (102, 55, 76, "Modelo")]:
        drawing_text(drawing, x, y + 24, label, 5.8, True, "#506879")
        drawing.add(Rect(x, y, w, 19, rx=3, ry=3, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_button(drawing, 22, 22, 156, 25, "Adicionar registo", primary=True)
    drawing_marker(drawing, 184, 140, 3)

    drawing.add(Rect(200, 12, 264, 136, rx=6, ry=6, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    drawing_text(drawing, 211, 130, "Registos", 9, True, "#071b4d")
    drawing_button(drawing, 278, 119, 42, 20, "CSV")
    drawing_button(drawing, 324, 119, 47, 20, "Imprimir")
    drawing_button(drawing, 375, 119, 43, 20, "Importar")
    drawing_button(drawing, 422, 119, 31, 20, "X", danger=True)
    drawing.add(Rect(211, 91, 156, 19, rx=3, ry=3, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 220, 98, "Pesquisar", 6.3, False, "#708398")
    drawing_button(drawing, 374, 91, 38, 19, "Estado")
    drawing_button(drawing, 416, 91, 37, 19, "Ordem")
    drawing_marker(drawing, 455, 139, 4)
    drawing.add(Line(200, 81, 464, 81, strokeColor=colors.HexColor("#d8e5e8")))
    drawing_text(drawing, 211, 68, "ID", 5.8, True, "#456173")
    drawing_text(drawing, 251, 68, "MARCA / MODELO", 5.8, True, "#456173")
    drawing_text(drawing, 351, 68, "ESTADO", 5.8, True, "#456173")
    drawing_text(drawing, 414, 68, "AÇÕES", 5.8, True, "#456173")
    drawing.add(Line(200, 58, 464, 58, strokeColor=colors.HexColor("#d8e5e8")))
    drawing_text(drawing, 211, 39, "17", 7, False, "#17324a")
    drawing_text(drawing, 251, 39, "Lenovo ThinkPad", 7, True, "#071b4d")
    drawing_text(drawing, 351, 39, "Ativo", 7, False, "#08765e")
    drawing_button(drawing, 414, 27, 19, 23, "Editar")
    drawing_button(drawing, 437, 27, 19, 23, "X", danger=True)
    drawing_marker(drawing, 461, 25, 5)
    return drawing


def ciber_record_visual():
    width, height = 476, 250
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.white, strokeColor=colors.HexColor("#bfd1d6")))
    drawing_text(drawing, 16, 226, "Editar registo: equipamento 17", 11, True, "#071b4d")
    drawing_button(drawing, 433, 216, 30, 24, "Cancelar")
    drawing_marker(drawing, 466, 241, 1)
    groups = [
        (15, 161, 215, 47, "Identificação", "ID · entrada · marca · modelo · n.º série"),
        (246, 161, 215, 47, "Hardware e sistema", "CPU · RAM · disco · SO · BIOS · estado físico"),
        (15, 101, 215, 47, "Diagnóstico e reparação", "avaria · diagnóstico · peças · custo · técnico"),
        (246, 101, 215, 47, "Configuração e contas", "backup · USB · conta GD · acessos · observações"),
    ]
    for x, y, w, h, title, detail in groups:
        drawing.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=colors.HexColor("#f7fbfb"), strokeColor=colors.HexColor("#b9ccd1")))
        drawing_text(drawing, x + 10, y + 30, title, 7.4, True, "#075f56")
        drawing_text(drawing, x + 10, y + 15, detail, 5.8, False, "#486276")
    drawing_marker(drawing, 232, 204, 2)
    drawing_marker(drawing, 462, 144, 3)
    drawing.add(Rect(15, 39, 215, 48, rx=5, ry=5, fillColor=colors.HexColor("#f2f8ff"), strokeColor=colors.HexColor("#a9c5d8")))
    drawing_text(drawing, 26, 69, "Anexos privados", 7.4, True, "#154f73")
    drawing_text(drawing, 26, 54, "foto · fatura · PDF · documento técnico", 5.9, False, "#486276")
    drawing.add(Rect(246, 39, 215, 48, rx=5, ry=5, fillColor=colors.HexColor("#f2f8ff"), strokeColor=colors.HexColor("#a9c5d8")))
    drawing_text(drawing, 257, 69, "Histórico do equipamento", 7.4, True, "#154f73")
    drawing_text(drawing, 257, 54, "criação · edição · importação · anexos", 5.9, False, "#486276")
    drawing_marker(drawing, 231, 77, 4)
    drawing_marker(drawing, 462, 77, 5)
    drawing_button(drawing, 346, 8, 115, 24, "Guardar alterações", primary=True)
    drawing_marker(drawing, 466, 18, 6)
    return drawing


def ciber_publish_visual():
    width, height = 476, 174
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f4f8f8"), strokeColor=colors.HexColor("#bfd1d6")))
    boxes = [
        (14, 108, 104, 42, "Código React", "src/App.tsx + CSS"),
        (138, 108, 90, 42, "Vite", "npm run build"),
        (248, 108, 104, 42, "Saída", "dist + public/area"),
        (372, 108, 89, 42, "Vercel", "/area/dispositivos/"),
    ]
    for x, y, w, h, title, detail in boxes:
        drawing.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#91b6b2")))
        drawing_text(drawing, x + w / 2, y + 25, title, 7.2, True, "#075f56", "middle")
        drawing_text(drawing, x + w / 2, y + 12, detail, 5.7, False, "#3d5869", "middle")
    for x in (128, 238, 362):
        drawing_text(drawing, x, 126, ">", 13, True, "#14846f", "middle")
    drawing.add(Rect(67, 29, 342, 51, rx=5, ry=5, fillColor=colors.HexColor("#e7f4ff"), strokeColor=colors.HexColor("#8bbad8")))
    drawing_text(drawing, 238, 60, "Supabase", 8.3, True, "#154f73", "middle")
    drawing_text(drawing, 238, 46, "Auth + app_users/permissões + devices + device_history", 6.1, False, "#325d75", "middle")
    drawing_text(drawing, 238, 35, "device_attachments + Storage privado device-attachments", 6.1, False, "#325d75", "middle")
    drawing.add(Line(238, 80, 238, 103, strokeColor=colors.HexColor("#4e8dac"), strokeWidth=1.2))
    drawing_text(drawing, 18, 12, "Altere src/, gere o build e publique; não edite dist/ ou public/ como fonte definitiva.", 6.7, True, "#8a3b2d")
    return drawing


def atividades_dashboard_visual():
    width, height = 476, 270
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f3f8f7"), strokeColor=colors.HexColor("#bfd1d6")))
    drawing.add(Rect(0, 228, width, 42, rx=7, ry=7, fillColor=colors.white, strokeColor=None))
    drawing_text(drawing, 15, 244, "MenteMovimento", 11, True, "#071b4d")
    drawing_text(drawing, 145, 244, "Sócios   Utentes   Cibersegurança   Atividades", 6.6, True, "#5b716e")
    drawing_button(drawing, 430, 235, 21, 24, "Menu")
    drawing_button(drawing, 455, 235, 18, 24, "Conta")

    drawing.add(Rect(12, 189, 452, 29, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    drawing_button(drawing, 20, 193, 22, 21, "<")
    drawing_text(drawing, 50, 203, "20/07/2026 a 24/07/2026", 7.2, True, "#17324a")
    drawing_button(drawing, 151, 193, 22, 21, ">")
    drawing_button(drawing, 218, 193, 87, 21, "Copiar semana")
    drawing_button(drawing, 309, 193, 54, 21, "Indicadores")
    drawing_button(drawing, 367, 193, 42, 21, "Imprimir")
    drawing_button(drawing, 413, 193, 43, 21, "Criar", primary=True)
    drawing_marker(drawing, 176, 216, 1)
    drawing_marker(drawing, 457, 217, 2)

    drawing.add(Rect(12, 12, 452, 167, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#c7d8dc")))
    day_width = 86
    drawing.add(Rect(12, 147, 452, 32, rx=5, ry=5, fillColor=colors.HexColor("#eef5f4"), strokeColor=None))
    for index, label in enumerate(["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]):
        x = 18 + index * 89
        drawing_text(drawing, x + 39, 164, label, 6.6, True, "#17324a", "middle")
        drawing_text(drawing, x + 39, 153, f"{20 + index}/07/2026", 5.4, False, "#506879", "middle")
        if index:
            drawing.add(Line(x - 5, 12, x - 5, 179, strokeColor=colors.HexColor("#d3e0e2"), strokeWidth=0.7))

    def activity_card(x, y, title, hours, monitor, summary=True):
        drawing.add(Rect(x, y, day_width - 5, 55, rx=5, ry=5, fillColor=colors.HexColor("#fbfcfc"), strokeColor=colors.HexColor("#aebfbc")))
        drawing.add(Rect(x, y, 3, 55, rx=2, ry=2, fillColor=colors.HexColor("#8c9e9b"), strokeColor=None))
        drawing_text(drawing, x + 8, y + 42, hours, 6.2, True, "#075f56")
        drawing_text(drawing, x + 8, y + 29, title, 7.2, True, "#071b4d")
        drawing_text(drawing, x + 8, y + 17, monitor, 5.7, True, "#5b716e")
        if summary:
            drawing_button(drawing, x + 7, y + 3, 31, 13, "Sumário")
        drawing_button(drawing, x + 41, y + 3, 11, 13, "Olho")
        drawing_button(drawing, x + 55, y + 3, 11, 13, "Lápis")
        drawing_button(drawing, x + 69, y + 3, 9, 13, "X", danger=True)

    activity_card(20, 85, "Moda", "09:00 - 12:00", "Belisa Moreira")
    activity_card(198, 85, "Recriarte", "10:00 - 12:00", "Belisa Moreira")
    activity_card(287, 85, "Teatro", "09:30 - 11:30", "Conceição Ferreira")
    drawing.add(Rect(12, 62, 452, 18, fillColor=colors.HexColor("#eef5f4"), strokeColor=colors.HexColor("#d3e0e2"), strokeWidth=0.7))
    drawing_text(drawing, 238, 68, "ALMOÇO · 12:00 - 13:00", 6.5, True, "#506879", "middle")
    activity_card(20, 4, "Movimento", "14:00 - 16:00", "Monitor 1 / Monitor 2")
    activity_card(376, 4, "Jogos", "16:00 - 17:00", "Monitor a definir")
    drawing_marker(drawing, 105, 138, 3)
    drawing_marker(drawing, 105, 61, 4)
    drawing_marker(drawing, 461, 141, 5)
    drawing_marker(drawing, 461, 60, 6)
    return drawing


def atividades_summary_visual():
    width, height = 476, 260
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.white, strokeColor=colors.HexColor("#bfd1d6")))
    drawing.add(Rect(0, 218, width, 42, rx=7, ry=7, fillColor=colors.HexColor("#f5f9f9"), strokeColor=None))
    drawing_text(drawing, 17, 235, "Sumário da atividade", 11, True, "#075f56")
    drawing_button(drawing, 401, 226, 42, 23, "Imprimir")
    drawing_button(drawing, 447, 226, 17, 23, "X")
    drawing_marker(drawing, 397, 252, 1)

    meta = [
        (16, 174, 82, "ATIVIDADE", "Moda"),
        (105, 174, 82, "DATA", "20/07/2026"),
        (194, 174, 82, "INÍCIO", "09:00"),
        (283, 174, 82, "FIM", "12:00"),
        (372, 174, 88, "DURAÇÃO", "3h 0min"),
    ]
    for x, y, w, label, value in meta:
        drawing.add(Rect(x, y, w, 34, rx=4, ry=4, fillColor=colors.HexColor("#f7fbfb"), strokeColor=colors.HexColor("#c7d8dc")))
        drawing_text(drawing, x + 7, y + 22, label, 5.5, True, "#506879")
        drawing_text(drawing, x + 7, y + 8, value, 7.1, True, "#071b4d")
    drawing_marker(drawing, 463, 204, 2)

    drawing_text(drawing, 16, 158, "Sumário", 7.1, True, "#506879")
    drawing.add(Rect(16, 105, 444, 47, rx=4, ry=4, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 25, 134, "Descrição objetiva do que foi realizado, objetivos e observações relevantes.", 6.4, False, "#486276")
    drawing_marker(drawing, 463, 150, 3)

    drawing_text(drawing, 16, 89, "Presenças", 7.1, True, "#075f56")
    people = [(16, "Maria Exemplo"), (127, "Ana Exemplo"), (238, "Carlos Exemplo"), (349, "Outro utente")]
    for x, name in people:
        drawing.add(Rect(x, 42, 102, 39, rx=4, ry=4, fillColor=colors.HexColor("#fbfcfc"), strokeColor=colors.HexColor("#c7d8dc")))
        drawing.add(Rect(x + 7, 62, 8, 8, fillColor=colors.white, strokeColor=colors.HexColor("#71868a")))
        drawing_text(drawing, x + 20, 63, name, 6.2, True, "#17324a")
        drawing_button(drawing, x + 44, 46, 49, 13, "Assinar (opcional)")
    drawing_marker(drawing, 462, 80, 4)
    drawing_button(drawing, 16, 9, 55, 24, "Limpar")
    drawing_button(drawing, 392, 9, 68, 24, "Guardar", primary=True)
    drawing_marker(drawing, 463, 31, 5)
    return drawing


def atividades_tools_visual():
    width, height = 476, 250
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f3f8f7"), strokeColor=colors.HexColor("#bfd1d6")))
    drawing.add(Rect(12, 175, 150, 62, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    for index, label in enumerate(["Atividades", "Monitores", "Histórico", "Manuais"]):
        x = 19 + (index % 2) * 70
        y = 210 - (index // 2) * 27
        drawing_button(drawing, x, y, 65, 21, label, primary=index == 0)
    drawing_marker(drawing, 165, 234, 1)

    drawing.add(Rect(174, 175, 290, 62, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 185, 222, "Monitores", 8.5, True, "#071b4d")
    drawing_text(drawing, 185, 210, "Nome · telefone · email · NIF · voluntariado · profissão", 5.8, False, "#486276")
    drawing_text(drawing, 185, 198, "Descrição · horas mensais/anuais · editar · remover", 5.8, False, "#486276")
    drawing_button(drawing, 383, 194, 70, 24, "Novo monitor", primary=True)
    drawing_marker(drawing, 461, 234, 2)

    drawing.add(Rect(12, 12, 452, 151, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
    drawing_text(drawing, 23, 145, "Indicadores de atividades", 9, True, "#075f56")
    drawing_button(drawing, 395, 136, 57, 21, "Imprimir")
    filters = [(23, 108, 92, "Período", "Semanal"), (125, 108, 92, "Semana", "20 a 24 julho"), (227, 108, 92, "Ano", "2026"), (329, 108, 123, "Atividade", "Todas")]
    for x, y, w, label, value in filters:
        drawing_text(drawing, x, y + 26, label, 5.8, True, "#506879")
        drawing.add(Rect(x, y, w, 20, rx=3, ry=3, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
        drawing_text(drawing, x + 7, y + 7, value, 6.4, False, "#17324a")
    metrics = [(23, "35", "ATIVIDADES"), (132, "8,4", "MÉDIA/ATIVIDADE"), (241, "29", "SUMÁRIOS"), (350, "186", "HORAS-PESSOA")]
    for x, value, label in metrics:
        drawing.add(Rect(x, 63, 102, 36, rx=4, ry=4, fillColor=colors.HexColor("#f7fbfb"), strokeColor=colors.HexColor("#c7d8dc")))
        drawing_text(drawing, x + 8, 84, label, 5.3, True, "#506879")
        drawing_text(drawing, x + 8, 69, value, 9, True, "#071b4d")
    drawing_text(drawing, 23, 49, "Taxa de assiduidade por utente", 6.8, True, "#075f56")
    drawing_text(drawing, 250, 49, "Volume por atividade", 6.8, True, "#075f56")
    drawing.add(Rect(23, 22, 202, 22, fillColor=colors.HexColor("#f2f7f7"), strokeColor=colors.HexColor("#d3e0e2")))
    drawing_text(drawing, 31, 30, "Utente · presenças · percentagem", 5.9, False, "#486276")
    drawing.add(Rect(250, 22, 202, 22, fillColor=colors.HexColor("#f2f7f7"), strokeColor=colors.HexColor("#d3e0e2")))
    drawing_text(drawing, 258, 30, "Atividade · sessões · duração · volume", 5.9, False, "#486276")
    drawing_marker(drawing, 461, 156, 3)
    drawing_marker(drawing, 461, 98, 4)
    return drawing


def atividades_questionnaire_visual():
    width, height = 476, 272
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.white, strokeColor=colors.HexColor("#bfd1d6")))
    drawing.add(Rect(0, 230, width, 42, rx=7, ry=7, fillColor=colors.HexColor("#f5f9f9"), strokeColor=None))
    drawing_text(drawing, 17, 247, "Questionários mensais", 11, True, "#075f56")
    drawing_button(drawing, 445, 238, 19, 23, "X")

    drawing_button(drawing, 17, 198, 72, 23, "Preencher", primary=True)
    drawing_button(drawing, 94, 198, 72, 23, "Consultar")
    drawing_marker(drawing, 170, 217, 1)

    fields = [
        (17, 158, 104, "ATIVIDADE", "Moda"),
        (128, 158, 119, "UTENTE", "Maria Exemplo"),
        (254, 158, 94, "MÊS", "Julho"),
        (355, 158, 104, "ANO", "2026"),
    ]
    for x, y, w, label, value in fields:
        drawing_text(drawing, x, y + 27, label, 5.6, True, "#506879")
        drawing.add(Rect(x, y, w, 21, rx=3, ry=3, fillColor=colors.white, strokeColor=colors.HexColor("#b9ccd1")))
        drawing_text(drawing, x + 7, y + 7, value, 6.4, False, "#17324a")
    drawing_marker(drawing, 462, 181, 2)

    drawing.add(Rect(17, 61, 442, 84, rx=5, ry=5, fillColor=colors.HexColor("#f8fbfb"), strokeColor=colors.HexColor("#c7d8dc")))
    drawing_text(drawing, 29, 129, "A. Participação", 7.5, True, "#075f56")
    drawing_text(drawing, 29, 111, "1. Gosto de participar nas atividades de Moda.", 6.4, False, "#17324a")
    for index, label in enumerate(["1", "2", "3", "4", "5"]):
        x = 250 + index * 36
        drawing.add(Circle(x, 112, 5, fillColor=colors.white, strokeColor=colors.HexColor("#71868a")))
        drawing_text(drawing, x, 95, label, 5.8, True, "#506879", "middle")
    drawing_text(drawing, 29, 75, "As seis secções só aparecem depois de escolher os quatro campos.", 6.1, True, "#486276")
    drawing_marker(drawing, 462, 142, 3)

    drawing_button(drawing, 17, 24, 82, 25, "Limpar respostas")
    drawing_button(drawing, 344, 24, 115, 25, "Guardar questionário", primary=True)
    drawing_marker(drawing, 462, 48, 4)
    drawing_text(drawing, 17, 8, "Consultar abre a lista guardada; Abrir mostra respostas em modo de leitura e Eliminar pede confirmação.", 6.2, True, "#8a3b2d")
    return drawing


def atividades_publish_visual():
    width, height = 476, 184
    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, rx=7, ry=7, fillColor=colors.HexColor("#f4f8f8"), strokeColor=colors.HexColor("#bfd1d6")))
    boxes = [
        (14, 118, 108, 42, "Marcação", "page.mjs"),
        (139, 118, 91, 42, "Comportamento", "static/app.js"),
        (247, 118, 91, 42, "Build", "npm run build"),
        (355, 118, 106, 42, "Produção", "public + Vercel"),
    ]
    for x, y, w, h, title, detail in boxes:
        drawing.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#91b6b2")))
        drawing_text(drawing, x + w / 2, y + 25, title, 7.2, True, "#075f56", "middle")
        drawing_text(drawing, x + w / 2, y + 12, detail, 5.8, False, "#3d5869", "middle")
    for x in (130, 238, 346):
        drawing_text(drawing, x, 136, ">", 13, True, "#14846f", "middle")
    drawing.add(Rect(35, 37, 406, 53, rx=5, ry=5, fillColor=colors.HexColor("#e7f4ff"), strokeColor=colors.HexColor("#8bbad8")))
    drawing_text(drawing, 238, 70, "Supabase partilhado", 8.3, True, "#154f73", "middle")
    drawing_text(drawing, 238, 56, "schedule · catalog · monitors · summaries · history", 6.3, False, "#325d75", "middle")
    drawing_text(drawing, 238, 44, "Auth + app_users/permissões + RLS + API serverless", 6.2, False, "#325d75", "middle")
    drawing.add(Line(238, 90, 238, 113, strokeColor=colors.HexColor("#4e8dac"), strokeWidth=1.2))
    drawing_text(drawing, 18, 14, "Fonte -> build -> testes -> Git -> Vercel. O schema é aplicado no Supabase antes do uso em produção.", 6.5, True, "#8a3b2d")
    return drawing


def manual_visual(name):
    visuals = {
        "socios-dashboard": socios_dashboard_visual,
        "socios-form": socios_form_visual,
        "socios-publish": socios_publish_visual,
        "utentes-dashboard": utentes_dashboard_visual,
        "utentes-record": utentes_record_visual,
        "utentes-publish": utentes_publish_visual,
        "ciber-dashboard": ciber_dashboard_visual,
        "ciber-record": ciber_record_visual,
        "ciber-publish": ciber_publish_visual,
        "atividades-dashboard": atividades_dashboard_visual,
        "atividades-summary": atividades_summary_visual,
        "atividades-tools": atividades_tools_visual,
        "atividades-questionnaire": atividades_questionnaire_visual,
        "atividades-publish": atividades_publish_visual,
    }
    if name not in visuals:
        raise ValueError(f"Visual desconhecido: {name}")
    return visuals[name]()


def section(title, body=None, bullets=None, steps=None, note=None, visual=None, table=None, code=None, page_break=False):
    parts = []
    if page_break:
        parts.append(PageBreak())
    parts.append(p(title, "h1"))
    if body:
        if isinstance(body, str):
            parts.append(p(body))
        else:
            parts.extend(p(item) for item in body)
    if visual:
        parts.extend([Spacer(1, 4), manual_visual(visual), Spacer(1, 6)])
    if bullets:
        parts.append(bullet_list(bullets))
    if steps:
        parts.append(numbered_list(steps))
    if table:
        parts.extend(
            [
                Spacer(1, 4),
                info_table(
                    table["headers"],
                    table["rows"],
                    table.get("widths"),
                    table.get("first_column_tint", False),
                ),
                Spacer(1, 6),
            ]
        )
    if code:
        blocks = [code] if isinstance(code, str) else code
        parts.extend(Preformatted(block, S["code"]) for block in blocks)
    if note:
        parts.append(p(note, "note"))
    return parts


def cover(title, subtitle, audience, branch, updated_at=UPDATED_AT):
    parts = []
    if LOGO.exists():
        img = Image(str(LOGO), width=5.6 * cm, height=2.0 * cm)
        img.hAlign = "CENTER"
        parts.extend([img, Spacer(1, 10)])
    parts.extend([p(title, "title"), p(subtitle, "subtitle")])
    meta = Table(
        [
            ["Ramo", branch],
            ["Destinatários", audience],
            ["Repositório", REPO_URL],
            ["Site", SITE_URL],
            ["Atualização", updated_at],
        ],
        colWidths=[3.2 * cm, 12.4 * cm],
    )
    meta.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f7f2")),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#b9d2d7")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d7e7ea")),
                ("FONTNAME", (0, 0), (0, -1), FONT_BOLD),
                ("FONTNAME", (1, 0), (1, -1), FONT_REGULAR),
                ("FONTSIZE", (0, 0), (-1, -1), 8.4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#06285a")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    parts.extend([Spacer(1, 8), meta, Spacer(1, 12)])
    return parts


def build_pdf(path: Path, title: str, subtitle: str, audience: str, branch: str, sections, updated_at=UPDATED_AT):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=1.6 * cm,
        rightMargin=1.6 * cm,
        topMargin=1.55 * cm,
        bottomMargin=1.65 * cm,
    )
    doc.title_text = title
    doc.updated_at = updated_at
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="manual", frames=[frame], onPage=on_page)])
    story = cover(title, subtitle, audience, branch, updated_at)
    story.append(PageBreak())
    for item in sections:
        story.extend(section(**item))
    doc.build(story)


COMMON_USER = [
    {
        "title": "1. Acesso ao site central",
        "body": "A Central MenteMovimento usa um único login para as áreas de gestão. Depois de entrar, o utilizador escolhe Gestão de Sócios, Gestão de Utentes, Cibersegurança ou Atividades sem repetir credenciais.",
        "steps": [
            "Abrir o site central na Vercel.",
            "Introduzir email e password autorizados.",
            "Opcionalmente, ativar a opção de lembrar credenciais neste browser.",
            "Escolher a área de trabalho no painel inicial ou na barra superior.",
            "Usar o botão de saída quando terminar, sobretudo em computadores partilhados.",
        ],
        "note": "As contas e permissões são globais. A criação e edição de utilizadores fica no menu de três tracinhos da página inicial.",
    },
    {
        "title": "2. Menu, idioma e tema",
        "bullets": [
            "O menu de três tracinhos da página inicial tem Utilizadores, Idioma e Tema escuro.",
            "Dentro de cada ramo, o menu de três tracinhos deve mostrar apenas Histórico e Manuais desse ramo.",
            "A alteração de idioma muda a interface do site; não traduz nomes, notas, moradas ou texto livre já escrito.",
            "O tema escuro/claro é comum ao site e fica guardado no browser.",
        ],
    },
]


SOCIOS_USER = [
    {
        "title": "1. Entrar e proteger a sessão",
        "steps": [
            "Abrir a Central MenteMovimento e iniciar sessão com a conta individual autorizada.",
            "Entrar na área Sócios pelo painel inicial ou pela barra superior.",
            "Confirmar que o nome da conta aparece no menu da pessoa antes de consultar dados.",
            "No fim do trabalho, abrir Conta e escolher Terminar sessão.",
        ],
        "note": "Não guardar a password nem deixar a sessão aberta em computadores ou tablets partilhados. Bloqueie o ecrã sempre que se afastar.",
    },
    {
        "title": "2. Visão geral do painel",
        "body": "A representação usa dados fictícios. Os números verdes identificam as zonas explicadas nas secções seguintes.",
        "visual": "socios-dashboard",
        "bullets": [
            "1 - Criar um novo sócio.",
            "2 - Abrir o menu da área e a conta da pessoa autenticada.",
            "3 - Pesquisar sem alterar a base de dados.",
            "4 - Filtrar rapidamente o estado das quotas.",
            "5 - Ordenar a lista ou exportar CSV.",
            "6 - Executar ações sobre o sócio certo.",
        ],
    },
    {
        "title": "3. Botões da barra superior",
        "page_break": True,
        "table": {
            "headers": ["Botão", "O que faz", "Cuidado recomendado"],
            "rows": [
                ["+ Novo sócio", "Abre uma ficha vazia para criar um registo.", "Pesquise primeiro por nome, NIF, email e telefone para evitar duplicados."],
                ["Menu - três traços", "Mostra Histórico e Manuais da área de Sócios.", "O histórico é para consulta; não use imagens do histórico com dados reais em canais externos."],
                ["Conta - pessoa", "Mostra o nome da conta e o botão Terminar sessão.", "Confirme que está a usar a sua conta. Nunca trabalhe com a conta de um colega."],
                ["Sócios / Utentes / Cibersegurança / Atividades", "Muda de área sem repetir o login.", "Confirme a área antes de introduzir dados; informação clínica não pertence à ficha de Sócios."],
            ],
            "widths": [3.5 * cm, 5.5 * cm, 7.6 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "4. Pesquisa, filtros, ordenação e CSV",
        "table": {
            "headers": ["Controlo", "O que faz", "Cuidado recomendado"],
            "rows": [
                ["Pesquisa", "Procura por número, nome, NIF, localidade ou email.", "Use-a antes de criar registos e antes de concluir que um sócio não existe."],
                ["Todos", "Mostra todos os sócios autorizados para a conta.", "É apenas um filtro; não altera nem recupera registos apagados."],
                ["Quotas em atraso", "Mostra quem tem a quota anual anterior à esperada.", "Confirme o pagamento real antes de contactar a pessoa ou atualizar a quota."],
                ["Em dia", "Mostra sócios com quota registada como regularizada.", "Uma quota visível como paga deve corresponder a comprovativo ou confirmação interna."],
                ["Ordenar", "Muda a ordem visual por nome, número ou quota.", "Não altera os dados nem a ordem guardada na base."],
                ["CSV", "Descarrega os dados permitidos para um ficheiro de folha de cálculo.", "O ficheiro contém dados pessoais: guarde-o apenas em pasta autorizada e elimine cópias temporárias."],
            ],
            "widths": [3.5 * cm, 5.5 * cm, 7.6 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "5. Botões em cada linha de sócio",
        "table": {
            "headers": ["Botão", "O que faz", "Antes de clicar"],
            "rows": [
                ["Pagar quota", "Avança a última quota anual paga e regista a data do pagamento.", "Leia o nome, o ano apresentado e a confirmação. Não clique duas vezes se a página demorar."],
                ["Olho - Ver", "Abre a ficha em modo de consulta, sem permitir alterações.", "Prefira este botão quando só precisa de confirmar informação."],
                ["Lápis - Editar", "Abre a ficha com campos editáveis.", "Confirme que a ficha pertence à pessoa certa e altere apenas o necessário."],
                ["Caixote - Apagar", "Elimina o registo após confirmação, se a conta tiver essa permissão.", "Use apenas com autorização. Confirme no histórico e faça uma exportação quando houver dúvida."],
            ],
            "widths": [3.5 * cm, 5.5 * cm, 7.6 * cm],
            "first_column_tint": True,
        },
        "note": "Se uma ação parecer lenta, aguarde a mensagem de sucesso ou erro. Repetir cliques pode criar alterações duplicadas, especialmente em pagamentos.",
    },
    {
        "title": "6. Criar, consultar e editar uma ficha",
        "page_break": True,
        "body": "A ficha abre numa janela à frente da lista. A representação seguinte usa valores fictícios.",
        "visual": "socios-form",
        "bullets": [
            "1 - X fecha a janela; alterações ainda não guardadas são descartadas.",
            "2 - Identificação administrativa: número de sócio, ata, adesão e quota.",
            "3 - Dados pessoais: nome, NIF, morada, contactos e outros campos necessários.",
            "4 - Apagar e Cancelar não guardam uma edição. Apagar remove o registo após confirmação.",
            "5 - Guardar valida os campos e grava a ficha na base de dados.",
        ],
        "steps": [
            "Pesquisar primeiro para confirmar que a pessoa ainda não está registada.",
            "Abrir Novo sócio ou usar o lápis numa linha existente.",
            "Preencher apenas informação necessária e confirmada.",
            "Rever nome, NIF, email, telefone, número de sócio e datas.",
            "Clicar uma vez em Guardar e aguardar a confirmação.",
            "Voltar à lista e pesquisar o nome para confirmar o resultado.",
        ],
    },
    {
        "title": "7. Regras para quotas e pagamentos",
        "bullets": [
            "A última quota paga identifica o ano até ao qual a situação está regularizada.",
            "A data do pagamento deve ser a data real de receção ou confirmação do pagamento.",
            "Nunca registe uma quota com base apenas numa mensagem não confirmada.",
            "Antes de confirmar Pagar quota, verifique o nome completo e o ano mostrado no aviso.",
            "Se o ano ficar errado, use Editar para corrigir a última quota paga e a data; consulte o histórico para registar o que aconteceu.",
            "Não apague a ficha para corrigir uma quota. A correção deve ser feita na própria ficha.",
        ],
        "note": "Quando existirem dúvidas contabilísticas, pare a operação e confirme com a pessoa responsável pelas quotas antes de guardar.",
    },
    {
        "title": "8. Histórico, manuais e atualização",
        "table": {
            "headers": ["Controlo", "O que faz", "Como usar corretamente"],
            "rows": [
                ["Histórico", "Mostra criação, edição e eliminação, com data e utilizador quando disponível.", "Use para esclarecer alterações; não substitui uma cópia de segurança."],
                ["Atualizar", "Volta a carregar os registos do histórico.", "Use uma vez depois de uma alteração; se continuar ausente, recarregue a página."],
                ["Manuais", "Abre a escolha entre Manual do Utilizador e Manual do Programador.", "Os PDFs abrem noutro separador e não alteram dados."],
                ["X / clicar fora", "Fecha janelas de Histórico ou Manuais.", "Fechar uma janela não apaga nem guarda informação."],
            ],
            "widths": [3.5 * cm, 5.5 * cm, 7.6 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "9. Permissões: porque alguns botões podem não aparecer",
        "table": {
            "headers": ["Permissão", "Permite", "Exemplo visível"],
            "rows": [
                ["Ver", "Abrir a área e consultar fichas.", "Lista e botão do olho."],
                ["Editar", "Criar, atualizar e registar quotas.", "Novo sócio, lápis, Guardar e Pagar quota."],
                ["Eliminar", "Apagar fichas quando autorizado.", "Caixote na lista e Apagar na ficha."],
                ["Exportar", "Criar ficheiros com dados dos sócios.", "Botão CSV e outras exportações autorizadas."],
                ["Ver histórico", "Consultar a auditoria da aplicação.", "Opção Histórico no menu."],
            ],
            "widths": [3.5 * cm, 7.0 * cm, 6.1 * cm],
            "first_column_tint": True,
        },
        "note": "A ausência de um botão pode ser uma regra de segurança, não uma avaria. Peça a um administrador para confirmar as permissões da conta.",
    },
    {
        "title": "10. Cuidados com a informação dos sócios",
        "table": {
            "headers": ["Tipo de informação", "Cuidados mínimos"],
            "rows": [
                ["Nome, morada e contactos", "Consultar apenas por necessidade de trabalho. Não copiar para listas pessoais nem grupos de mensagens."],
                ["NIF e BI/CC", "São identificadores pessoais. Recolher apenas quando necessário e nunca incluir em prints de suporte."],
                ["Data de nascimento", "Usar apenas para finalidade associativa autorizada; não divulgar aniversários sem base e autorização adequadas."],
                ["Observações internas", "Escrever informação objetiva e necessária. Não guardar diagnósticos, dados clínicos, passwords ou opiniões pessoais."],
                ["CSV e folhas de cálculo", "Guardar em localização aprovada, limitar acessos e eliminar cópias temporárias quando deixarem de ser necessárias."],
                ["Prints e pedidos de suporte", "Usar dados fictícios ou ocultar nomes, NIF, moradas, emails, telefones e notas antes de enviar."],
            ],
            "widths": [5.0 * cm, 11.6 * cm],
            "first_column_tint": True,
        },
        "note": "Este guia apresenta boas práticas operacionais. As regras internas da associação e as orientações do responsável pela proteção de dados prevalecem.",
    },
    {
        "title": "11. Como evitar situações comuns",
        "table": {
            "headers": ["Situação", "Prevenção", "Se acontecer"],
            "rows": [
                ["Sócio duplicado", "Pesquisar por nome, NIF, email e telefone antes de criar.", "Não apague sem comparar as fichas. Peça validação e consolide a informação correta."],
                ["Quota no sócio errado", "Confirmar nome e ano na mensagem antes de aceitar.", "Pare, corrija pela edição e consulte/registe o histórico com o responsável."],
                ["Eliminação acidental", "Usar o olho para consultar e o lápis para corrigir; reservar o caixote para casos autorizados.", "Não recrie às pressas. Informe o responsável técnico e preserve histórico/backups."],
                ["Dados não atualizados", "Aguardar a confirmação depois de Guardar.", "Pesquisar novamente, atualizar a página uma vez e verificar o histórico."],
                ["Exportação enviada para local errado", "Confirmar a pasta antes de descarregar e não usar email pessoal ou WhatsApp.", "Interromper a partilha, eliminar a cópia acessível e informar o responsável por dados."],
                ["Sessão deixada aberta", "Terminar sessão e bloquear o dispositivo ao afastar-se.", "Terminar a sessão assim que possível e informar o responsável se outra pessoa teve acesso."],
            ],
            "widths": [3.6 * cm, 6.1 * cm, 6.9 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "12. Checklist antes de terminar",
        "bullets": [
            "Confirmar que os novos registos aparecem apenas uma vez.",
            "Confirmar quotas, anos e datas alterados durante o trabalho.",
            "Fechar ficheiros CSV e movê-los para a pasta autorizada ou eliminá-los se eram temporários.",
            "Não deixar prints, PDFs ou listas de sócios no ambiente de trabalho do computador.",
            "Fechar janelas com dados e escolher Terminar sessão.",
            "Comunicar rapidamente qualquer erro, acesso indevido ou envio de dados para o local errado.",
        ],
    },
]


MANUAL_INICIAL = [
    {
        "title": "1. Bem-vindo à MenteMovimento",
        "body": "Este manual foi feito para quem vai usar a aplicação pela primeira vez. A MenteMovimento reúne as áreas de Sócios, Utentes, Cibersegurança e Atividades num só local, com uma conta individual e permissões próprias para cada pessoa.",
        "bullets": [
            "Utilize sempre a sua própria conta. Não partilhe email, palavra-passe ou sessão com colegas.",
            "Depois de iniciar sessão, a página inicial mostra apenas as áreas às quais a conta tem acesso.",
            "Se uma área ou botão não aparecer, pode ser uma regra de permissão e não uma avaria.",
            "Comece por consultar os dados com o botão do olho e só altere o que for necessário.",
        ],
        "note": "A aplicação contém dados pessoais e, em algumas áreas, dados sensíveis. Consulte apenas a informação necessária para a sua tarefa.",
    },
    {
        "title": "2. Entrar e terminar sessão",
        "steps": [
            "Abrir a aplicação no browser autorizado pela associação.",
            "Introduzir o email e a palavra-passe da sua conta.",
            "Depois de entrar, confirmar o nome no ícone de utilizador no canto superior direito.",
            "Escolher uma área no painel inicial ou na barra superior.",
            "Quando terminar, abrir o ícone de utilizador e escolher Terminar sessão.",
        ],
        "note": "Em computadores ou tablets partilhados, termine sempre a sessão e bloqueie o equipamento quando se afastar, mesmo que seja apenas por alguns minutos.",
    },
    {
        "title": "3. Navegação e botões mais usados",
        "table": {
            "headers": ["Elemento", "Para que serve", "Boa prática"],
            "rows": [
                ["Sócios", "Consultar e gerir fichas de sócios, quotas e exportações autorizadas.", "Pesquise antes de criar para evitar registos duplicados."],
                ["Utentes", "Consultar e gerir fichas, acompanhamentos, documentos e planos de intervenção.", "Abra apenas os separadores necessários e trate os dados sensíveis com especial cuidado."],
                ["Cibersegurança", "Registar e acompanhar equipamentos, estados, reparações e anexos.", "Confirme o equipamento certo antes de alterar o registo."],
                ["Atividades", "Consultar o horário, sumários, presenças, monitores e indicadores.", "Use o botão do olho para consultar e o Sumário para registar a sessão da atividade certa."],
                ["Olho", "Abre a informação em modo de consulta.", "É a opção mais segura quando só precisa de confirmar dados."],
                ["Lápis", "Permite editar quando a conta tem autorização.", "Reveja o nome e o contexto antes de guardar."],
                ["Caixote", "Elimina um registo ou item após confirmação.", "Use apenas quando tem a certeza; apagar pode ser irreversível."],
                ["Imprimir / exportar", "Cria uma impressão ou ficheiro com os dados permitidos.", "Não deixe documentos impressos expostos nem envie ficheiros por canais não autorizados."],
            ],
            "widths": [3.2 * cm, 7.2 * cm, 6.2 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "4. Um método simples para trabalhar com segurança",
        "steps": [
            "Confirmar a área de trabalho e a pessoa ou registo que precisa de consultar.",
            "Pesquisar pelo nome ou identificador antes de criar um novo registo.",
            "Consultar primeiro; editar apenas quando for necessário e autorizado.",
            "Preencher dados objetivos, confirmados e relevantes para a associação.",
            "Clicar uma vez em Guardar e aguardar a mensagem de sucesso ou erro.",
            "Voltar à lista e confirmar que a alteração ficou correta.",
        ],
        "note": "Se a página estiver lenta, não clique várias vezes no mesmo botão. Aguarde alguns segundos pela confirmação para evitar registos ou alterações duplicadas.",
    },
    {
        "title": "5. Proteção da informação",
        "table": {
            "headers": ["Situação", "Como agir"],
            "rows": [
                ["Dados pessoais", "Não copie nomes, contactos, NIF, moradas, diagnósticos, notas ou anexos para listas pessoais, mensagens ou emails não autorizados."],
                ["Dados sensíveis", "Aceda apenas se a sua função exigir. Não comente informação clínica, social ou financeira em espaços públicos."],
                ["Impressões", "Recolha a folha de imediato, guarde-a em local seguro e destrua rascunhos ou cópias que já não sejam necessários."],
                ["Exportações", "Guarde ficheiros CSV ou PDFs apenas em pastas autorizadas. Evite pen drives pessoais e elimine cópias temporárias."],
                ["Capturas de ecrã", "Não envie capturas com dados reais para pedir ajuda. Oculte os dados ou use exemplos fictícios."],
                ["Equipamento partilhado", "Não active a memorização da sessão se o equipamento for usado por várias pessoas."],
            ],
            "widths": [4.2 * cm, 12.4 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "6. Primeiros passos em cada área",
        "table": {
            "headers": ["Área", "Comece por", "Evite"],
            "rows": [
                ["Sócios", "Pesquisar o sócio, abrir com o olho e confirmar a ficha antes de editar ou registar uma mensalidade.", "Criar duplicados, confirmar pagamentos sem confirmação e exportar dados sem autorização."],
                ["Utentes", "Pesquisar o utente, consultar a ficha e entrar apenas no separador necessário para a tarefa.", "Abrir ou imprimir dados sensíveis sem necessidade, ou escrever opiniões em vez de factos."],
                ["Cibersegurança", "Procurar o registo do equipamento antes de alterar estado, reparação ou anexos.", "Registar o mesmo equipamento duas vezes ou anexar ficheiros sem relação com o equipamento."],
                ["Atividades", "Consultar o horário semanal; usar Sumário na atividade correta para registar texto e presenças.", "Alterar ou apagar atividades sem permissão, ou registar presenças na sessão errada."],
            ],
            "widths": [3.0 * cm, 7.3 * cm, 6.3 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "7. Quando algo não funciona",
        "bullets": [
            "Leia a mensagem mostrada pela aplicação antes de repetir a ação.",
            "Atualize a página uma vez e confirme que a ligação à internet está disponível.",
            "Verifique se a conta tem a permissão necessária para ver, editar, apagar, exportar ou aceder a dados sensíveis.",
            "Se o problema continuar, informe a pessoa responsável pela aplicação com a área, a ação tentada e a hora aproximada. Não envie dados pessoais ou sensíveis no pedido de apoio.",
            "Use Histórico quando precisar de confirmar quem alterou uma atividade ou registo, se a sua conta tiver acesso a essa funcionalidade.",
        ],
    },
    {
        "title": "8. Checklist antes de sair",
        "bullets": [
            "Confirme que todas as alterações necessárias foram guardadas.",
            "Feche janelas ou diálogos que já não está a usar.",
            "Não deixe impressões, exportações ou dados visíveis no ecrã.",
            "Termine sessão através do ícone de utilizador.",
            "Em caso de dúvida sobre uma ação, pare e peça confirmação antes de guardar ou apagar informação.",
        ],
        "note": "Depois de conhecer estes passos, consulte o Manual do Utilizador da área onde vai trabalhar para obter instruções detalhadas sobre cada botão e formulário.",
    },
]


UTENTES_USER_PT = COMMON_USER + [
    {
        "title": "3. Lista de utentes",
        "body": "A área de Utentes permite pesquisar, consultar, editar e gerir a situação ativa/inativa de cada utente.",
        "bullets": [
            "Pesquisar por nome para encontrar rapidamente a ficha.",
            "Abrir o olho para consultar sem editar.",
            "Usar o lápis para editar a ficha completa.",
            "Usar o botão de ativo/inativo para arquivar temporariamente sem apagar dados.",
            "Eliminar apenas quando houver autorização e depois de confirmar que os dados já não são necessários.",
        ],
    },
    {
        "title": "4. Separadores da ficha",
        "body": "Cada utente tem uma ficha dividida por separadores. Os campos comuns, como nome e processo, são reutilizados onde fizer sentido.",
        "bullets": [
            "Formulário de Referenciação: identificação, contactos, origem do pedido e situação inicial.",
            "Pagamentos e Mensalidades: mês pago, dia de pagamento, forma de pagamento, estado e observações.",
            "Informações em Caso de Emergência: contactos prioritários e informação de segurança.",
            "Ficha de Inscrição e Avaliação Inicial de Requisitos: elegibilidade, consentimentos e requisitos.",
            "Avaliação Diagnóstica Multidisciplinar: avaliação por áreas e notas técnicas.",
            "Registo de Atendimentos e Acompanhamentos: sessões, evolução e observações.",
            "Proteção de dados e Termos de Responsabilidade: autorizações e declarações.",
        ],
    },
    {
        "title": "5. Genograma, ecomapa e anexos",
        "bullets": [
            "O genograma representa relações familiares e deve manter nomes ou identificadores visíveis para leitura rápida.",
            "O ecomapa representa redes, apoios, instituições e contexto social.",
            "Os anexos aceitam PDFs associados ao utente selecionado.",
            "Antes de anexar, confirme que o PDF pertence ao utente correto.",
            "Remova anexos apenas quando houver confirmação, porque podem conter informação sensível.",
        ],
    },
    {
        "title": "6. Indicadores e permanência",
        "bullets": [
            "O botão de indicadores mostra indicadores de acompanhamento da base de utentes.",
            "A permanência média usa datas de entrada e saída quando disponíveis.",
            "A percentagem por concelho ajuda a perceber a distribuição territorial.",
            "Utentes inativos devem continuar disponíveis para indicadores e consulta histórica.",
        ],
    },
    {
        "title": "7. Backup de utentes",
        "body": "O backup de Utentes descarrega um ficheiro ZIP com cópias em CSV e outros ficheiros de consulta. Este botão só aparece a contas com permissão para exportar e ver dados sensíveis.",
        "steps": [
            "Entrar na área Gestão de Utentes com uma conta autorizada.",
            "Na lista principal, clicar em Exportar backup de utentes.",
            "Guardar o ficheiro backup-utentes-AAAA-MM-DD_HH-MM-SS.zip numa pasta segura e identificada pela data.",
            "Abrir o ZIP e confirmar o ficheiro indice.csv, que resume os utentes exportados.",
            "Para cada utente, confirmar os ficheiros pagamentos.csv e historico.csv quando for necessário consultar dados em CSV.",
            "Manter o ZIP apenas em locais autorizados, porque pode conter dados pessoais, clínicos, histórico e anexos.",
        ],
    },
    {
        "title": "8. Histórico, idioma e segurança",
        "bullets": [
            "O histórico de Utentes regista alterações feitas nas fichas e deve ser usado para auditoria.",
            "A gestão de utilizadores é global e deve ser feita no dashboard principal.",
            "Não escrever passwords, chaves Supabase ou dados de acesso em notas de utentes.",
            "Em computadores partilhados, terminar sessão ao sair.",
            "Dados de saúde e acompanhamento devem ser tratados com cuidado acrescido.",
        ],
    },
]


DISPOSITIVOS_USER = COMMON_USER + [
    {
        "title": "3. Painel de cibersegurança",
        "body": "A área de Cibersegurança organiza equipamentos, estados, reparações, anexos e indicadores.",
        "bullets": [
            "Os cartões de topo mostram total, ativos, em manutenção e arquivados.",
            "A aba Cibersegurança contém o formulário e a tabela principal.",
            "A aba Indicadores apresenta distribuição por estado, marcas, técnicos, avarias e resultados.",
            "A pesquisa e filtros afetam os registos visíveis.",
        ],
    },
    {
        "title": "4. Criar e editar registos",
        "steps": [
            "Preencher ID, data de entrada, marca, modelo e número de série.",
            "Completar hardware, sistema, diagnóstico, reparação, estado e observações.",
            "Guardar o registo e confirmar que aparece na tabela.",
            "Usar o lápis para editar uma linha existente.",
            "Atualizar o estado para Ativo, Manutenção ou Arquivado conforme a situação real.",
        ],
    },
    {
        "title": "5. CSV, relatório e anexos",
        "bullets": [
            "Exportar CSV cria uma cópia dos registos visíveis para arquivo ou análise.",
            "Importar CSV permite atualizar vários registos; confirmar colunas antes de importar.",
            "Imprimir relatório prepara uma vista adequada para impressão.",
            "Anexos podem guardar fotografias, faturas, relatórios ou comprovativos relacionados com o equipamento.",
            "O botão Apagar tudo deve ser usado apenas em testes ou com autorização expressa.",
        ],
    },
    {
        "title": "6. Recomendações operacionais",
        "bullets": [
            "Não reutilizar números de série para equipamentos diferentes.",
            "Registar sempre datas de entrada e intervenções importantes.",
            "Usar estado Arquivado para equipamentos que já não estão ativos, em vez de apagar.",
            "Exportar CSV antes de grandes importações ou limpezas.",
            "Guardar no histórico notas úteis para perceber o que foi alterado e porquê.",
        ],
    },
]


ATIVIDADES_USER = [
    {
        "title": "1. Entrar e proteger a sessão",
        "steps": [
            "Abrir a Central MenteMovimento e iniciar sessão com a conta individual autorizada.",
            "Entrar em Atividades pelo painel inicial ou pela barra superior.",
            "Abrir o ícone da pessoa e confirmar o nome da conta antes de consultar ou alterar dados.",
            "No final do trabalho, escolher Terminar sessão, sobretudo em computadores e tablets partilhados.",
        ],
        "note": "Não partilhe contas. O histórico identifica a pessoa autenticada que realizou cada ação.",
    },
    {
        "title": "2. Visão geral do horário semanal",
        "body": "A representação usa nomes fictícios. Os números verdes identificam os controlos explicados abaixo.",
        "visual": "atividades-dashboard",
        "bullets": [
            "1 - Mudar para a semana anterior ou seguinte e confirmar as datas reais.",
            "2 - Copiar a semana anterior, consultar indicadores, imprimir ou criar uma atividade.",
            "3 - Ler cada cartão: horas, nome, até dois monitores e ações permitidas.",
            "4 - Tratar o Almoço como uma atividade normal das 12:00 às 13:00, com monitor, sumário e presenças.",
            "5 - Usar as cinco colunas de segunda a sexta; um cartão pertence sempre à data indicada no topo.",
            "6 - A linha da tarde começa depois do Almoço e pode conter várias atividades por dia.",
        ],
    },
    {
        "title": "3. Botões acima do horário",
        "page_break": True,
        "table": {
            "headers": ["Botão", "O que faz", "Cuidado recomendado"],
            "rows": [
                ["Setas da semana", "Avançam ou recuam sete dias.", "Confirme sempre o intervalo apresentado antes de criar, copiar ou imprimir."],
                ["Copiar semana anterior", "Copia para a semana atual as atividades que ainda não existem.", "Reveja datas, monitores e alterações excecionais; não use como substituto da confirmação semanal."],
                ["Indicadores", "Abre resultados semanais, mensais ou anuais, para todas ou uma atividade.", "Os valores dependem dos sumários e presenças realmente registados."],
                ["Questionário", "Abre o registo e a consulta das avaliações mensais por atividade e utente.", "Confirme atividade, utente, mês e ano antes de responder; cada combinação só pode ter um questionário."],
                ["Imprimir semana", "Gera um PDF limpo do horário selecionado.", "Confirme a semana e proteja o PDF; não deixe impressões em espaços públicos."],
                ["Criar Atividade", "Abre a janela de criação.", "Só aparece a quem pode ver dados sensíveis de Atividades."],
            ],
            "widths": [3.4 * cm, 5.7 * cm, 7.5 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "4. Permissões e botões visíveis",
        "table": {
            "headers": ["Permissão", "Permite", "Não permite por si só"],
            "rows": [
                ["Ver", "Abrir o horário, usar o olho, consultar indicadores, histórico e manuais.", "Criar, editar, apagar, arrastar ou gerir monitores."],
                ["Editar", "Abrir Sumário, escrever o resumo e registar presenças/assinaturas opcionais.", "Alterar o cartão ou criar novas atividades."],
                ["Ver dados sensíveis", "Criar, editar, apagar e ordenar atividades; copiar semanas; gerir catálogo, monitores e questionários mensais.", "Imprimir sem a permissão Exportar."],
                ["Exportar", "Imprimir horário, sumário e indicadores.", "Modificar dados ou ver detalhes sem acesso à área."],
            ],
            "widths": [3.2 * cm, 7.1 * cm, 6.3 * cm],
            "first_column_tint": True,
        },
        "note": "Se um botão não aparecer, não tente contornar a restrição. Peça ao responsável para confirmar a matriz de permissões da sua conta.",
    },
    {
        "title": "5. Criar e editar uma atividade",
        "steps": [
            "No menu Atividades, confirmar que o nome da atividade e os monitores necessários já estão registados.",
            "Abrir Criar Atividade ou usar o lápis de um cartão existente.",
            "Escolher o dia entre segunda e sexta e selecionar início e fim em intervalos de 30 minutos.",
            "Escolher o nome no catálogo, o primeiro monitor e, se necessário, um segundo monitor diferente.",
            "Guardar uma única vez e aguardar a mensagem de confirmação; a janela fecha depois de uma gravação bem-sucedida.",
            "Confirmar o cartão no dia, semana e período corretos.",
        ],
        "bullets": [
            "O fim tem de ser posterior ao início.",
            "O Almoço é criado por defeito de segunda a sexta, das 12:00 às 13:00. Edite-o para indicar o monitor responsável.",
            "Use o lápis para corrigir. O caixote apaga a atividade, o respetivo sumário e as presenças associadas.",
            "Se duas atividades ocuparem a mesma zona, arraste o cartão inteiro; a pré-visualização mostra onde ficará ao largar.",
        ],
        "page_break": True,
    },
    {
        "title": "6. Ações de cada cartão",
        "table": {
            "headers": ["Botão", "O que faz", "Antes de clicar"],
            "rows": [
                ["Sumário", "Abre o registo editável do sumário e das presenças dessa atividade.", "Confirme nome, data e horas; o cartão certo abre diretamente o respetivo registo."],
                ["Olho", "Mostra em consulta o sumário, o número de participantes e os nomes presentes.", "Prefira este botão quando não precisa de alterar dados."],
                ["Lápis", "Edita dia, horas, atividade e até dois monitores.", "Uma alteração de horas afeta duração, indicadores e contador dos monitores."],
                ["Caixote", "Elimina definitivamente a atividade após confirmação.", "Use apenas quando não deve existir; para corrigir, use o lápis."],
                ["Arrastar cartão", "Muda a ordem visual entre cartões do mesmo período/dia.", "Aguarde a gravação; não mude de semana durante o arrasto."],
            ],
            "widths": [3.2 * cm, 6.6 * cm, 6.8 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "7. Sumário, presenças e assinatura",
        "body": "O Sumário pertence à atividade aberta e não permite trocar para outra atividade dentro da janela.",
        "visual": "atividades-summary",
        "bullets": [
            "1 - Imprimir o sumário guardado ou fechar a janela.",
            "2 - Confirmar nome, data, início, fim e duração antes de escrever.",
            "3 - Registar de forma objetiva o que foi realizado; não incluir informação clínica desnecessária.",
            "4 - Selecionar apenas os utentes realmente presentes. A lista vem automaticamente da área de Utentes.",
            "5 - Guardar grava o sumário e as presenças na base partilhada e fecha a janela.",
        ],
        "note": "A assinatura no tablet é opcional. Uma presença pode ser guardada sem assinatura; quando usada, peça ao próprio utente para assinar e confirme o nome apresentado.",
        "page_break": True,
    },
    {
        "title": "8. Catálogo, monitores, histórico e indicadores",
        "body": "O menu de três traços reúne as ferramentas próprias de Atividades.",
        "visual": "atividades-tools",
        "bullets": [
            "1 - Atividades gere os nomes disponíveis; Monitores gere os responsáveis; Histórico mostra data, utilizador, ação e detalhes; Manuais abre estes PDFs.",
            "2 - Em Monitores podem existir telefone, email, NIF, voluntariado, profissão, descrição e contador mensal/anual de horas.",
            "3 - Indicadores permitem escolher período semanal, mensal ou anual e imprimir o resultado.",
            "4 - O filtro Atividade permite ver o total de todas ou apenas uma atividade do catálogo.",
        ],
        "steps": [
            "Escolher o período e a data correspondente; no anual basta escolher o ano.",
            "Escolher Todas ou o nome de uma atividade.",
            "Ler número de sessões, média de utentes, sumários e volume em horas-pessoa.",
            "Rever a taxa de assiduidade por utente e o volume por atividade; valores zero podem significar sumários sem presenças.",
            "Imprimir apenas quando necessário e guardar o ficheiro em local institucional autorizado.",
        ],
    },
    {
        "title": "9. Preencher um questionário mensal",
        "body": "Cada utente pode ter um questionário por atividade, mês e ano. Os registos são partilhados no Supabase e ficam disponíveis noutros computadores autorizados.",
        "visual": "atividades-questionnaire",
        "steps": [
            "Abrir Questionário e manter selecionado o separador Preencher.",
            "Escolher uma atividade existente no catálogo, um utente existente, o mês e o ano da avaliação.",
            "Aguardar que apareçam as perguntas; o formulário só é apresentado quando os quatro campos estão preenchidos.",
            "Responder às 19 perguntas das secções Participação, Aprendizagem, Bem-estar, Relações com os outros, Autonomia e Inclusão.",
            "Usar a escala de 1 a 5, de Discordo totalmente a Concordo totalmente, e confirmar que nenhuma resposta ficou vazia.",
            "Guardar Questionário e aguardar a confirmação antes de fechar a janela.",
        ],
        "bullets": [
            "As listas usam os registos já existentes de Atividades e Utentes; não escreva nomes alternativos para a mesma pessoa ou atividade.",
            "Se a combinação já tiver sido respondida, o formulário novo não aparece. Use Ver questionário realizado para abrir o registo guardado.",
            "O questionário avalia aquele utente naquela atividade e naquele período; confirme sempre o contexto antes de começar.",
        ],
        "page_break": True,
    },
    {
        "title": "10. Consultar e eliminar questionários anteriores",
        "steps": [
            "Abrir Questionário e escolher o separador Consultar.",
            "Usar atividade, utente, mês e ano para reduzir a lista, ou manter os filtros gerais para consultar todos os registos permitidos.",
            "Escolher Abrir para ver uma página própria, apenas de leitura, com o contexto, a data de gravação e todas as perguntas e respostas.",
            "Usar Voltar à lista para regressar ao histórico sem misturar a consulta com o formulário de preenchimento.",
            "Usar o caixote apenas quando o questionário deve ser removido e confirmar explicitamente a eliminação.",
        ],
        "note": "Um questionário guardado não volta ao formulário inicial para ser alterado. Esta separação evita que uma avaliação concluída seja modificada por engano.",
    },
    {
        "title": "11. Consultar as médias dos questionários",
        "steps": [
            "Abrir Questionário e escolher o separador Média.",
            "Escolher uma atividade ou Todas as atividades, o mês e o ano que pretende analisar.",
            "Consultar a média geral e as médias de Participação, Aprendizagem, Bem-estar, Relações com os outros, Autonomia e Inclusão.",
            "Para ver o resultado individual, abrir Consultar e escolher o questionário do utente; cada cabeçalho mostra imediatamente a média dessa área.",
        ],
        "note": "As médias usam apenas respostas válidas de 1 a 5, são calculadas a partir dos questionários já guardados e aparecem com uma casa decimal.",
    },
    {
        "title": "12. Impressões disponíveis",
        "table": {
            "headers": ["Impressão", "Conteúdo", "Revisão necessária"],
            "rows": [
                ["Semana", "Dias, datas, horas, atividades e monitores numa folha de horário.", "Confirmar a semana, quebras e nomes antes de imprimir."],
                ["Sumário", "Identificação da atividade, resumo, participantes e assinaturas existentes.", "Guardar o sumário primeiro e confirmar que as presenças estão corretas."],
                ["Indicadores", "Filtros escolhidos, indicadores, taxa de assiduidade e volume.", "Confirmar período, ano/mês/semana e atividade selecionada."],
            ],
            "widths": [3.2 * cm, 7.0 * cm, 6.4 * cm],
            "first_column_tint": True,
        },
        "note": "No tablet, a aplicação prepara um PDF próprio. Se o navegador bloquear a abertura, será descarregado um PDF em vez de imprimir literalmente a página.",
    },
    {
        "title": "13. Cuidados obrigatórios com os dados",
        "page_break": True,
        "bullets": [
            "Presenças, assinaturas e sumários são dados pessoais. Consulte-os apenas para a finalidade autorizada.",
            "Telefone, email, NIF, profissão e voluntariado dos monitores são dados restritos; não os copie para o horário nem para mensagens externas.",
            "Não escreva diagnósticos, medicação ou detalhes clínicos no nome de uma atividade ou num sumário quando não forem necessários.",
            "Confirme sempre a atividade e o utente antes de assinalar uma presença ou recolher uma assinatura.",
            "Os questionários contêm avaliações pessoais. Não os mostre a outros utentes, não os fotografe e não responda em nome da pessoa sem autorização institucional.",
            "Antes de eliminar um questionário, confirme atividade, utente e período; a eliminação confirmada é definitiva.",
            "Não fotografe o ecrã nem envie PDFs por contas pessoais. Elimine cópias temporárias depois da utilização autorizada.",
            "Bloqueie o tablet/computador ao afastar-se e termine sessão no final.",
            "Se houver acesso indevido, exportação errada ou dispositivo perdido, informe imediatamente o responsável da associação.",
        ],
    },
    {
        "title": "14. Problemas frequentes",
        "table": {
            "headers": ["Situação", "O que verificar"],
            "rows": [
                ["Não aparece Criar, lápis ou caixote", "A conta precisa de Ver dados sensíveis em Atividades."],
                ["Não aparece Sumário", "A conta precisa de Editar em Atividades."],
                ["Não aparece Imprimir", "A conta precisa de Exportar, além do acesso à área."],
                ["Atividade/monitor não aparece na seleção", "Criar ou ativar o registo no menu e atualizar a página; confirme também a permissão sensível."],
                ["Colega não vê a alteração", "Aguarde a confirmação, atualize a página e confirme a ligação/sessão. Os dados válidos ficam no Supabase partilhado."],
                ["Aviso de tabelas/campos em falta", "Contactar o responsável técnico para aplicar o schema atualizado no projeto Supabase correto."],
                ["Indicadores mostram zero", "Confirmar o período, a atividade escolhida e se os sumários têm presenças guardadas."],
                ["Questionário não aparece", "A conta precisa de Ver dados sensíveis em Atividades."],
                ["As perguntas não aparecem", "Selecionar atividade, utente, mês e ano; os quatro campos são obrigatórios."],
                ["O registo já existe", "Abrir Ver questionário realizado ou o separador Consultar; não é criado um duplicado para o mesmo contexto."],
                ["Questionários não carregam", "Atualizar a sessão/página e confirmar a ligação. Se persistir, o responsável técnico deve rever a API e utente_abas no Supabase."],
                ["Cartão no sítio errado", "Usar o lápis para corrigir dia/horas; o arrasto altera apenas a ordem dentro da organização compatível."],
            ],
            "widths": [4.6 * cm, 12.0 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "15. Checklist antes de terminar",
        "bullets": [
            "Semana e datas confirmadas.",
            "Atividades, horas e monitores revistos, incluindo Almoço.",
            "Sumários objetivos guardados e presenças corretas.",
            "Assinaturas recolhidas apenas quando necessário e com o utente certo.",
            "Questionários guardados no mês/ano, atividade e utente corretos; registos antigos consultados no separador próprio.",
            "PDFs e impressões guardados ou destruídos conforme a regra interna.",
            "Mensagens de erro comunicadas sem expor dados pessoais.",
            "Sessão terminada no computador ou tablet partilhado.",
        ],
    },
]


DEV_COMMON = [
    {
        "title": "1. Visão geral da Central",
        "body": "A Central MenteMovimento junta Sócios, Utentes, Cibersegurança e Atividades num único projeto publicado na Vercel e ligado a um único projeto Supabase. A autenticação é centralizada; os dados continuam separados por tabelas e contexto funcional.",
        "bullets": [
            f"Repositório oficial: {REPO_URL}",
            f"Site de produção: {SITE_URL}",
            "Branch principal: main.",
            "Build de produção: npm run build.",
            "Diretório publicado pela Vercel: public.",
            "Não publicar ficheiros .env, bases SQLite locais, anexos reais, exports com dados pessoais ou chaves privadas.",
        ],
    },
    {
        "title": "2. Variáveis e segurança",
        "bullets": [
            "SUPABASE_URL e SUPABASE_ANON_KEY podem ser usadas pelo frontend.",
            "SUPABASE_SERVICE_ROLE_KEY é secreta e deve ficar apenas em Environment Variables da Vercel ou ambiente local protegido.",
            "SUPABASE_SECRET_KEY é usada pelo backend Python de Utentes quando aplicável.",
            "Depois de mudar variáveis na Vercel, fazer redeploy.",
            "Se uma chave secreta for exposta, gerar uma nova no Supabase, atualizar Vercel e revogar a antiga.",
        ],
    },
    {
        "title": "3. Fluxo de alteração",
        "steps": [
            "Alterar os ficheiros-fonte locais; não editar public diretamente.",
            "Executar npm run build na raiz.",
            "Testar as páginas afetadas.",
            "Rever git status e git diff para confirmar exatamente o que mudou.",
            "Fazer commit com mensagem clara.",
            "Fazer push para main.",
            "Verificar o deployment automático na Vercel.",
        ],
    },
]


SOCIOS_DEV = DEV_COMMON + [
    {
        "title": "4. Arquitetura e publicação do ramo Sócios",
        "body": "O módulo é mantido em portal/modules/socios, transformado pelo build e publicado em public/area/socios. A base de dados e autenticação permanecem no Supabase.",
        "visual": "socios-publish",
        "note": "public/ é uma saída gerada. Uma correção feita apenas nessa pasta desaparece no build seguinte.",
        "page_break": True,
    },
    {
        "title": "5. Ficheiros que deve conhecer",
        "table": {
            "headers": ["Ficheiro ou pasta", "Responsabilidade"],
            "rows": [
                ["portal/modules/socios/index.html", "Estrutura da página, diálogos, campos, botões, navegação e ligações para os PDFs."],
                ["portal/modules/socios/app.js", "Estado, traduções, permissões, CRUD de sócios, quotas, filtros, histórico, CSV, validação e eventos."],
                ["portal/modules/socios/styles.css", "Layout, cores, responsividade, tema escuro, tabelas, formulários e diálogos."],
                ["portal/modules/socios/central-socios-client.js", "Cliente usado na variante autónoma; a Central publicada injeta configuração e autenticação partilhadas no build."],
                ["portal/modules/socios/supabase/schema.sql", "Tabelas, funções privadas, triggers, constraints, grants e políticas RLS."],
                ["portal/modules/socios/supabase/*.sql", "Migrações incrementais e reforços aplicados a bases já existentes."],
                ["portal/modules/socios/docs/", "PDFs do utilizador e programador abertos pela janela Manuais."],
                ["scripts/generate-manual-pdfs.py", "Fonte reproduzível dos PDFs publicados."],
                ["scripts/prepare-vercel-output.mjs", "Copia módulos para public, injeta configuração central, versões de assets e páginas publicadas."],
                ["vercel.json", "Build, output, headers de segurança, rewrites e rotas da Vercel."],
            ],
            "widths": [6.5 * cm, 10.1 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "6. Fluxo de execução no browser",
        "bullets": [
            "A página carrega a biblioteca Supabase, central-config.js, config.js, central-module-auth.js e app.js.",
            "central-module-auth.js confirma sessão e permissões globais antes de libertar a interface.",
            "app.js cria o cliente com SUPABASE_URL e a chave anon/publishable, nunca com service_role.",
            "As consultas a members e member_audit_log são autorizadas novamente pelo PostgreSQL através de RLS.",
            "A interface mostra ou esconde botões conforme as permissões, mas a segurança real deve permanecer na base de dados.",
            "O build remove dependências antigas da variante autónoma e injeta os scripts partilhados da Central.",
        ],
    },
    {
        "title": "7. Dados, auditoria e permissões",
        "table": {
            "headers": ["Objeto", "Conteúdo e regra principal"],
            "rows": [
                ["public.members", "Ficha administrativa: número, ata, adesão, quota, pagamento, identificação, contactos, profissão e observações."],
                ["public.member_audit_log", "Registo imutável das inserções, edições e eliminações criado por trigger."],
                ["public.app_users", "Perfil global, estado ativo e JSON de permissões por área/ação."],
                ["private.current_app_permission", "Resolve a permissão efetiva da conta autenticada."],
                ["Triggers de members", "Preenchem created_by/updated_by/updated_at e escrevem auditoria."],
                ["RLS", "view autoriza SELECT; edit autoriza INSERT/UPDATE; delete autoriza DELETE; view_history autoriza auditoria."],
            ],
            "widths": [5.2 * cm, 11.4 * cm],
            "first_column_tint": True,
        },
        "note": "Adicionar um botão no frontend sem criar ou rever a política RLS correspondente não é uma implementação completa.",
    },
    {
        "title": "8. Regras de validação que não devem ser removidas",
        "bullets": [
            "member_number é único quando preenchido.",
            "tax_number aceita nove algarismos quando existe.",
            "postal_code segue o formato 0000-000 quando existe.",
            "birth_date e quota_paid_at não podem ficar no futuro.",
            "A última quota paga não deve ser anterior à data de adesão.",
            "O frontend valida para dar mensagens úteis; constraints e RLS protegem a base mesmo perante pedidos manuais.",
            "A escrita de observações deve continuar separada da apresentação pública e da exportação quando a permissão não a permitir.",
        ],
    },
    {
        "title": "9. Como alterar a interface manualmente",
        "steps": [
            "Abrir a raiz do repositório num editor como VS Code.",
            "Localizar o elemento em index.html, a lógica ou tradução em app.js e o aspeto em styles.css.",
            "Pesquisar pelo id, classe, texto ou data-action do botão antes de alterar.",
            "Fazer uma mudança pequena de cada vez e guardar com Ctrl+S.",
            "Não alterar ids usados por document.querySelector sem atualizar todas as referências.",
            "Quando adicionar texto visível, criar a versão portuguesa e inglesa na tabela de traduções.",
            "Quando adicionar um campo, atualizar HTML, leitura do formulário, normalização, payload Supabase, edição, validação, histórico e exportação.",
        ],
        "code": [
            "# Procurar um botão, campo ou tradução\nrg -n \"newMemberBtn|data-action|quotaPaidUntil\" portal/modules/socios",
            "# Rever apenas o módulo de Sócios\ngit diff -- portal/modules/socios scripts/generate-manual-pdfs.py",
        ],
        "note": "Evite substituições globais sem rever o resultado. Nomes de campos aparecem em HTML, JavaScript, SQL, importação, exportação e histórico.",
    },
    {
        "title": "10. Como adicionar ou alterar campos",
        "table": {
            "headers": ["Camada", "Alteração necessária"],
            "rows": [
                ["PostgreSQL", "Criar SQL incremental com ADD COLUMN IF NOT EXISTS, constraint adequada e eventual índice."],
                ["RLS e grants", "Confirmar quem pode ler, criar, editar, eliminar ou exportar o novo dado."],
                ["index.html", "Adicionar label, input/select/textarea, ajuda, id e name estáveis."],
                ["app.js - formulário", "Adicionar ao FORM_FIELDS, leitura, limpeza, validação, preenchimento de edição e tradução."],
                ["app.js - persistência", "Mapear entre camelCase e snake_case nos payloads e resultados."],
                ["Lista e consulta", "Mostrar apenas se for útil e permitido; evitar expor identificadores desnecessários."],
                ["CSV/importação", "Atualizar cabeçalhos, aliases, datas, validação e compatibilidade com ficheiros antigos."],
                ["Auditoria", "Confirmar que o trigger inclui o campo e que o histórico o apresenta de forma compreensível."],
                ["Manual e testes", "Documentar finalidade, cuidados e comportamento; testar criação, leitura, edição e permissões."],
            ],
            "widths": [4.6 * cm, 12.0 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "11. Guardar e rever alterações com Git",
        "body": "Guardar no editor escreve o ficheiro no disco. Git permite confirmar o que mudou e criar um ponto recuperável antes da publicação.",
        "code": "git status --short\ngit diff -- portal/modules/socios scripts/generate-manual-pdfs.py\ngit add portal/modules/socios scripts/generate-manual-pdfs.py\ngit commit -m \"Atualiza area de socios e manuais\"\ngit push origin main",
        "bullets": [
            "Nunca usar git reset --hard para resolver uma dúvida num repositório com trabalho não publicado.",
            "Não incluir .env, chaves, exports, bases locais, anexos reais ou prints com dados pessoais.",
            "Se existirem alterações de outras pessoas, adicionar apenas os ficheiros da tarefa e rever o diff antes do commit.",
            "Mensagens de commit devem explicar a intenção, não apenas dizer update.",
        ],
    },
    {
        "title": "12. Gerar os manuais e o site",
        "code": "python scripts/generate-manual-pdfs.py --only socios\nnpm run build",
        "bullets": [
            "O primeiro comando atualiza apenas os dois PDFs de Sócios.",
            "npm run build compila Cibersegurança e gera toda a pasta public usada pela Vercel.",
            "O build deve terminar com exit code 0; avisos devem ser lidos, mesmo quando não impedem a geração.",
            "Confirme que public/area/socios/docs contém os dois PDFs novos depois do build.",
            "Se app.js ou styles.css mudou e o browser continuar a mostrar a versão antiga, atualize assetVersion em prepare-vercel-output.mjs e volte a gerar.",
        ],
    },
    {
        "title": "13. Testar localmente antes de publicar",
        "code": "python -m http.server 4177 --directory public\n# Abrir: http://127.0.0.1:4177/area/socios/",
        "bullets": [
            "Testar desktop e telemóvel, tema claro e escuro e, quando aplicável, português e inglês.",
            "Testar com uma conta que apenas vê e outra que edita; botões sem permissão não devem aparecer nem funcionar por pedido direto.",
            "Criar um registo fictício, consultar, editar, pagar quota e apagar apenas no ambiente de teste autorizado.",
            "Abrir Histórico e Manuais e confirmar que os PDFs carregam noutro separador.",
            "Confirmar que CSV abre com acentos e colunas corretas e não contém campos indevidos.",
            "Verificar a consola do browser e a ausência de erros HTTP ou JavaScript.",
        ],
        "note": "Não use dados reais em testes locais, screenshots ou vídeos de demonstração.",
    },
    {
        "title": "14. Publicar na Vercel",
        "body": "O caminho preferido é fazer push para main e deixar a integração Git da Vercel criar o deployment. A publicação manual é útil apenas quando o projeto local está corretamente ligado e a pessoa tem autorização.",
        "code": "# Publicação automática\ngit push origin main\n\n# Alternativa manual, depois de autenticar a CLI\nnpx vercel login\nnpx vercel --prod --yes",
        "steps": [
            "Confirmar npm run build localmente.",
            "Confirmar que o commit contém apenas os ficheiros pretendidos.",
            "Fazer push para main ou executar a publicação manual autorizada.",
            "Esperar pelo estado Ready na Vercel.",
            "Abrir https://central-mente-movimento.vercel.app/area/socios/ numa janela limpa.",
            "Repetir o teste principal e abrir os dois PDFs em produção.",
        ],
        "note": "Tokens Vercel são secretos. Nunca os colocar no código, nos manuais, em commits ou em mensagens públicas. Se forem expostos, revogar imediatamente.",
    },
    {
        "title": "15. Alterações SQL e Supabase",
        "steps": [
            "Criar um ficheiro SQL incremental na pasta supabase; não substituir dados manualmente no painel sem registo.",
            "Fazer backup e testar o SQL num projeto de teste ou com dados fictícios.",
            "Usar IF NOT EXISTS quando a operação puder ser repetida com segurança.",
            "Aplicar no SQL Editor com uma conta autorizada e ler todos os avisos de RLS.",
            "Recarregar o schema cache quando necessário e testar SELECT/INSERT/UPDATE/DELETE com perfis diferentes.",
            "Atualizar schema.sql para que uma instalação nova já inclua o estado final.",
        ],
        "bullets": [
            "Nunca escolher Run without RLS para tabelas com dados de sócios.",
            "Não usar DROP ... CASCADE em produção sem analisar dependências e ter plano de recuperação.",
            "A service_role fica apenas em funções backend/variáveis protegidas; nunca no browser.",
        ],
    },
    {
        "title": "16. Reverter e recuperar",
        "table": {
            "headers": ["Problema", "Ação recomendada"],
            "rows": [
                ["Deployment com erro", "Promover o deployment anterior na Vercel ou criar um git revert do commit e voltar a publicar."],
                ["Erro apenas de interface", "Corrigir a fonte em portal/modules/socios, gerar, testar e publicar; não corrigir só em public/."],
                ["Migração SQL incompleta", "Parar novas escritas, avaliar dados afetados e aplicar uma migração corretiva testada; não improvisar DROP."],
                ["Dados apagados", "Preservar auditoria, interromper ações adicionais e restaurar a partir do backup de acordo com o procedimento interno."],
                ["Chave exposta", "Revogar no Supabase/Vercel, criar nova chave, atualizar variáveis e redeployar."],
            ],
            "widths": [5.0 * cm, 11.6 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "17. Checklist técnica final",
        "page_break": True,
        "bullets": [
            "O código-fonte foi alterado, guardado e revisto com git diff.",
            "Os dois manuais de Sócios foram regenerados quando houve alteração funcional.",
            "npm run build terminou sem erro e public contém a versão esperada.",
            "CRUD, quotas, pesquisa, filtros, CSV, histórico, manuais e permissões foram testados.",
            "Não existem dados reais, segredos, .env, exports ou anexos no commit.",
            "O deployment está Ready e a URL de produção foi testada em desktop e telemóvel.",
            "Existe um caminho claro de rollback para código e base de dados.",
        ],
    },
]


UTENTES_DEV_PT = DEV_COMMON + [
    {
        "title": "4. Estrutura do ramo Utentes",
        "bullets": [
            "Backend principal: portal/modules/utentes/app.py.",
            "Entrada serverless: api/utentes-app.py.",
            "Schema Supabase original: portal/modules/utentes/supabase_schema.sql.",
            "PDFs estáticos do manual: portal/modules/utentes/docs/.",
            "Tabelas principais: utentes, utente_abas, historico, utente_anexos.",
            "Bucket de anexos: documentos-utentes.",
        ],
    },
    {
        "title": "5. Separadores e persistência",
        "bullets": [
            "A lista base de utentes fica na tabela utentes.",
            "Separadores extensos são guardados em utente_abas por utente_id e nome do separador.",
            "Pagamentos e Mensalidades é um separador próprio e deve continuar entre Formulário de Referenciação e Informações em Caso de Emergência.",
            "Anexos PDF são gravados em utente_anexos e Storage quando Supabase está ativo.",
            "Histórico regista operações de criação, edição, estado, anexos e eliminação.",
        ],
    },
    {
        "title": "6. Cuidados técnicos",
        "bullets": [
            "A função Python em Vercel não deve depender de ficheiros locais persistentes.",
            "SQLite serve apenas para desenvolvimento local.",
            "Ao alterar HTML gerado em app.py, testar navegação, gravação e retorno aos separadores.",
            "Campos clínicos e dados pessoais exigem cuidado com logs, screenshots e exports.",
            "Manter traduções PT/EN quando adicionar texto de interface.",
        ],
    },
]


DISPOSITIVOS_DEV = DEV_COMMON + [
    {
        "title": "4. Estrutura do ramo Cibersegurança",
        "bullets": [
            "Aplicação React/Vite: portal/modules/dispositivos/src/App.tsx.",
            "Estilos: portal/modules/dispositivos/src/App.css.",
            "Build do ramo: portal/modules/dispositivos/dist.",
            "Vite base path: /area/dispositivos/.",
            "Manuais PDF fonte: portal/modules/dispositivos/public/docs/.",
            "Schema Supabase: portal/modules/dispositivos/supabase/schema.sql.",
            "Tabelas principais: devices, profiles, device_attachments.",
        ],
    },
    {
        "title": "5. Dados e funcionalidades",
        "bullets": [
            "devices guarda identificação, hardware, software, estado, diagnóstico, reparação, técnico, datas e observações.",
            "device_attachments guarda metadados dos ficheiros associados a equipamentos.",
            "O Storage device-attachments guarda os ficheiros físicos.",
            "CSV usa mapeamento de colunas para importar/exportar listas.",
            "Indicadores são calculadas a partir dos registos carregados no estado da app.",
        ],
    },
    {
        "title": "6. Manutenção React",
        "bullets": [
            "Executar npm --prefix portal/modules/dispositivos run build depois de alterações.",
            "Evitar duplicar lógica de importação/exportação em componentes diferentes.",
            "Ao adicionar campos, atualizar estado inicial, formulário, tabela, CSV, indicadores e manual.",
            "Manter botões e ícones alinhados com a barra comum das restantes áreas.",
        ],
    },
]


UTENTES_USER_EN = [
    {
        "title": "1. Central access",
        "body": "Central MenteMovimento uses one sign-in for members, clients, cybersecurity and activities. After signing in, choose the working area from the dashboard or the top navigation.",
        "bullets": [
            "Use an authorised email and password.",
            "Remember credentials only on trusted browsers.",
            "Use Sign out when leaving a shared computer.",
            "User management, language and dark mode are global dashboard tools.",
        ],
    },
    {
        "title": "2. Client list and records",
        "bullets": [
            "Search by name to find a client.",
            "Use the eye button for read-only view.",
            "Use the pencil button to edit.",
            "Use active/inactive instead of deleting when a client may return.",
            "Delete only when authorised and after confirming that the record is no longer needed.",
        ],
    },
    {
        "title": "3. Record tabs",
        "bullets": [
            "Referral Form: identification, contacts and initial context.",
            "Payments and Monthly Fees: paid month, payment date, method, status and notes.",
            "Emergency Information: priority contacts and safety information.",
            "Registration and Initial Requirements Assessment: eligibility, consent and requirements.",
            "Multidisciplinary Diagnostic Assessment: technical assessment by area.",
            "Appointments and Follow-up Records: sessions, evolution and notes.",
            "Individual Intervention Plan: sensitive case managers, CIFsm, objectives, assessment, activities, dates and expandable technical observations.",
            "Data Protection and Responsibility Terms: authorisations and declarations.",
        ],
    },
    {
        "title": "4. Diagrams, attachments and indicators",
        "bullets": [
            "Genogram and ecomap nodes must keep names or identifiers visible.",
            "PDF attachments belong only to the selected client.",
            "Indicators show average permanence and percentage by municipality when data exists.",
            "Changing the interface language does not translate names, notes or clinical text already entered.",
        ],
    },
    {
        "title": "5. Client backup",
        "body": "The client backup downloads a ZIP file with CSV copies and supporting files. The button is visible only to accounts allowed to export and view sensitive data.",
        "steps": [
            "Sign in to Client Management with an authorised account.",
            "On the main client list, choose Export clients backup.",
            "Save the backup-utentes-YYYY-MM-DD_HH-MM-SS.zip file in a protected folder named with the date.",
            "Open the ZIP and check indice.csv, which summarises the exported clients.",
            "For each client, use pagamentos.csv and historico.csv when payment or history data is needed in CSV format.",
            "Keep the ZIP only in authorised locations because it may contain personal data, health information, history and attachments.",
        ],
    },
    {
        "title": "6. Data protection",
        "bullets": [
            "Do not store passwords, Supabase keys or access data in client notes.",
            "Avoid sharing screenshots with personal or health data.",
            "Use history to audit record changes.",
            "Handle clinical and social information with additional care.",
        ],
    },
]


UTENTES_DEV_EN = [
    {
        "title": "1. Central overview",
        "body": "The clients area is part of the Central MenteMovimento project. It runs inside the same Vercel deployment and shares the central authentication flow.",
        "bullets": [
            f"Official repository: {REPO_URL}",
            f"Production site: {SITE_URL}",
            "Main branch: main.",
            "Production build: npm run build.",
            "Vercel output directory: public.",
        ],
    },
    {
        "title": "2. Clients module structure",
        "bullets": [
            "Main backend: portal/modules/utentes/app.py.",
            "Serverless entry point: api/utentes-app.py.",
            "Original Supabase schema: portal/modules/utentes/supabase_schema.sql.",
            "Static manual PDFs: portal/modules/utentes/docs/.",
            "Main tables: utentes, utente_abas, historico and utente_anexos.",
            "Storage bucket: documentos-utentes.",
        ],
    },
    {
        "title": "3. Persistence and security",
        "bullets": [
            "SQLite is only for local development.",
            "Production must use Supabase and Vercel environment variables.",
            "Never expose SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in frontend code.",
            "When changing record tabs, update app.py, translations, save/load logic and manuals.",
            "The sensitive plano_intervencao tab is stored as JSON in utente_abas. Preserve plano_row_count and every plano_{n}_ field when evolving the form.",
            "Test the plan table with long text and printing: text areas must grow instead of hiding clinical or technical notes.",
            "Personal, social and health data must not be committed, logged or shared in screenshots.",
        ],
    },
    {
        "title": "4. Deployment workflow",
        "steps": [
            "Change code locally.",
            "Run npm run build from the repository root.",
            "Test sign-in, list, edit, attachments and manual links.",
            "Commit with a clear message.",
            "Push to main.",
            "Check the automatic Vercel deployment.",
        ],
    },
]


ATIVIDADES_DEV = DEV_COMMON + [
    {
        "title": "4. Arquitetura atual de Atividades",
        "body": "Atividades é um módulo JavaScript integrado no portal central. O horário, sumários, questionários mensais e restantes registos partilhados residem no Supabase; APIs serverless executam operações que exigem validação adicional.",
        "visual": "atividades-publish",
        "bullets": [
            "A marcação da página é gerada por page.mjs e enriquecida pelo build central.",
            "app.js gere estado, Supabase no browser, diálogos, traduções, arrasto e geração de PDFs.",
            "As APIs validam o token Bearer e as permissões antes de usar a service role.",
            "RLS continua ativa nas tabelas acessíveis diretamente pelo cliente autenticado.",
            "public/ é artefacto de build; a fonte deve ser alterada em portal/, api/ e scripts/.",
        ],
    },
    {
        "title": "5. Mapa de ficheiros",
        "table": {
            "headers": ["Ficheiro", "Responsabilidade"],
            "rows": [
                ["portal/modules/atividades/page.mjs", "HTML dos controlos, calendário e diálogos de atividade, sumário, questionários, assinatura e indicadores."],
                ["portal/static/app.js", "Estado e CRUD do horário, catálogo/monitores, sumários, questionários, indicadores, histórico, impressão e i18n."],
                ["portal/static/styles.css", "Layout semanal, cartões, drag and drop, diálogos, impressão e temas."],
                ["api/activities-options.js", "CRUD do catálogo/monitores e leitura/escrita do histórico com utilizador."],
                ["api/activities-summaries.js", "Sumários, lista de utentes, presenças, assinaturas opcionais e sanitização."],
                ["api/activities-questionnaires.js", "Referências, gravação, listagem, consulta e eliminação dos questionários mensais."],
                ["api/activities-statistics.js", "Filtros semanal/mensal/anual, taxa de assiduidade, volume e horas de monitores."],
                ["portal/modules/atividades/supabase/schema.sql", "Tabelas, índices, triggers, grants e políticas RLS."],
                ["supabase/20260721-activities-sensitive-permissions.sql", "Migração da matriz atual: gestão do horário requer view_sensitive."],
                ["scripts/prepare-vercel-output.mjs", "Monta menu, diálogos e páginas finais em public/ durante o build."],
                ["scripts/generate-manual-pdfs.py", "Fonte editável dos dois manuais PDF de Atividades."],
            ],
            "widths": [6.2 * cm, 10.4 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "6. Modelo de dados Supabase",
        "table": {
            "headers": ["Tabela", "Conteúdo", "Observações"],
            "rows": [
                ["activities_catalog", "Nomes selecionáveis das atividades e estado ativo.", "Nome único; timestamps e created_by."],
                ["activities_monitors", "Nome, telefone, email, NIF, voluntariado, profissão e descrição.", "Detalhes privados; horas são calculadas, não guardadas num contador."],
                ["activities_schedule", "id text, semana, dia, horas, título, teacher e sort_order.", "teacher contém até dois nomes unidos por ' / '."],
                ["activities_summaries", "Resumo, data, duração e attendance JSONB.", "FK activity_id text; único por atividade/data; apagar cartão elimina o sumário."],
                ["activities_history", "Ação, atividade, horários, semana, created_by e data.", "A API acrescenta actor_name a partir do perfil central."],
                ["utente_abas", "Questionário mensal em conteudo JSONB, associado ao utente.", "Usa tab_key determinística; não cria uma tabela nova nem usa localStorage."],
            ],
            "widths": [4.1 * cm, 7.1 * cm, 5.4 * cm],
            "first_column_tint": True,
        },
        "note": "Não altere o tipo de activities_schedule.id sem migrar a FK activities_summaries.activity_id. A incompatibilidade text/uuid impede criar a constraint.",
    },
    {
        "title": "7. Fluxo de leitura e escrita",
        "steps": [
            "O módulo confirma a sessão central, carrega a matriz de permissões e cria o cliente Supabase autenticado.",
            "activities_schedule é lida diretamente com o token do utilizador e filtrada pela semana.",
            "Criar, editar, apagar, copiar e reordenar escrevem no Supabase e dependem de RLS view_sensitive.",
            "Catálogo, monitores e histórico usam activities-options com Authorization: Bearer <access token>.",
            "Sumários e utentes usam activities-summaries; questionários usam activities-questionnaires; indicadores e horas usam activities-statistics.",
            "Depois de cada gravação, o estado local é atualizado e o histórico recebe a ação e o nome do utilizador.",
        ],
        "bullets": [
            "saveActivities e saveActivitiesHistory são no-op: não são a persistência de produção.",
            "As chaves localStorage antigas existem apenas para uma migração única para Supabase e para preferências de idioma/tema.",
            "Uma falha remota deve gerar erro visível; nunca fingir que uma alteração partilhada ficou guardada.",
        ],
    },
    {
        "title": "8. Matriz de permissões e RLS",
        "table": {
            "headers": ["Permissão", "Interface/API", "Persistência"],
            "rows": [
                ["atividades.view", "Horário, olho, histórico, indicadores, manuais e nomes necessários.", "SELECT schedule/history; APIs devolvem consulta sanitizada."],
                ["atividades.edit", "Sumário, presenças e assinatura opcional.", "CRUD summaries; API inclui lista de utentes e assinaturas ao editar."],
                ["atividades.view_sensitive", "Criar/editar/apagar/arrastar/copiar; catálogo, detalhes de monitores e questionários mensais.", "INSERT/UPDATE/DELETE schedule/catalog/monitors e CRUD de questionários via API."],
                ["atividades.export", "Impressão da semana, sumário e indicadores.", "Regista ações de impressão no histórico."],
                ["edit_sensitive/delete", "Sem controlo próprio no módulo atual.", "Não devem substituir view_sensitive sem uma migração coordenada."],
            ],
            "widths": [3.6 * cm, 7.0 * cm, 6.0 * cm],
            "first_column_tint": True,
        },
        "bullets": [
            "private.current_app_permission(area, action) lê public.app_users e reconhece administradores.",
            "A função private é SECURITY DEFINER com search_path fixo e execução apenas para authenticated.",
            "As APIs voltam a validar a permissão no servidor; esconder um botão nunca é a única barreira.",
            "activities-options pode devolver nomes a contas com view, mas só inclui detalhes privados do monitor com view_sensitive.",
            "activities-summaries permite consulta sanitizada com view; edição e assinaturas exigem edit.",
        ],
    },
    {
        "title": "9. Contratos e validação das APIs",
        "table": {
            "headers": ["Endpoint", "Métodos", "Validação essencial"],
            "rows": [
                ["/api/activities-options", "GET/POST/PATCH/DELETE", "kind catalog/monitors/history, token, permissão, limites de texto e nomes de monitor sem '/'."],
                ["/api/activities-summaries", "GET/POST", "atividade existente, utentes permitidos, resumo até 20 000 caracteres e attendance normalizado."],
                ["/api/activities-questionnaires", "GET/POST/DELETE", "view_sensitive, atividade/utente existentes, período válido, 19 respostas de 1 a 5 e combinação única."],
                ["/api/activities-statistics", "GET", "period week/month/year, limites de datas, atividade opcional e exposição de presenças apenas com edit."],
            ],
            "widths": [4.3 * cm, 3.4 * cm, 8.9 * cm],
            "first_column_tint": True,
        },
        "bullets": [
            "readBody deve limitar payloads; respostas de erro usam mensagens destinadas ao cliente e não expõem chaves.",
            "A service role fica exclusivamente em variáveis protegidas da Vercel, nunca em page.mjs, app.js ou PDFs.",
            "Assinaturas aceitam apenas data:image/png;base64 válida, com limites individual e agregado.",
            "IDs e nomes de presenças são reconstruídos a partir da tabela de Utentes; o browser não pode inventar participantes.",
            "Histórico calcula o nome visível da conta no servidor e não confia num actor_name enviado pelo cliente.",
        ],
    },
    {
        "title": "10. Regras do horário e compatibilidade",
        "bullets": [
            "A semana começa à segunda-feira e inclui apenas segunda a sexta.",
            "Inícios: 09:00 a 16:30; fins: 09:30 a 17:00; ambos em intervalos de 30 minutos.",
            "end_time tem de ser posterior a start_time, validado no cliente e por constraint SQL.",
            "Até dois monitores diferentes são guardados no campo teacher com separador ' / '. Preserve o parser ao renomear monitores.",
            "O Almoço é uma atividade normal criada por defeito em cada dia, das 12:00 às 13:00, inicialmente com Monitor a definir.",
            "Copiar semana anterior evita duplicados equivalentes e cria novos IDs/datas na semana de destino.",
            "sort_order controla a ordem de cartões; o drag and drop grava imediatamente a sequência.",
        ],
        "note": "Ao alterar nomes padrão, horários ou separadores, teste semanas antigas e a renomeação de monitores para não quebrar dados já guardados.",
    },
    {
        "title": "11. Sumários, presenças e assinaturas",
        "bullets": [
            "A janela recebe um activity_id fixo do cartão e apresenta metadados derivados do horário; não permite escolher outra atividade.",
            "attendance é um array JSONB com utente id/name e, opcionalmente, signature/signatureAt.",
            "Guardar presença não exige assinatura. A UI deve manter checkbox e canvas independentes.",
            "Ao desmarcar uma presença, remover também a assinatura associada no estado antes de gravar.",
            "A lista de Utentes é carregada no servidor apenas para contas com edit; uma conta só com view recebe o sumário sanitizado para o olho.",
            "Depois de guardar um sumário, o diálogo fecha e a consulta/indicador deve refletir os novos dados.",
            "A impressão usa dados persistidos; não deve depender de campos não guardados no DOM.",
        ],
    },
    {
        "title": "12. Questionários mensais",
        "body": "O questionário mensal reutiliza a infraestrutura existente de Utentes. Não existe uma tabela activities_questionnaires e não deve ser introduzida persistência em localStorage.",
        "table": {
            "headers": ["Elemento", "Contrato técnico"],
            "rows": [
                ["Referências", "Atividades ativas vêm de activities_catalog; utentes vêm de utentes. A API valida novamente IDs e nomes no servidor."],
                ["Identificador", "tab_key = activities_questionnaire:<activityId>:<AAAA-MM>, único dentro do utente em public.utente_abas."],
                ["Conteúdo", "conteudo JSONB com kind activity_questionnaire, version 1, atividade, utente, mês/ano, responses e metadados de criação/atualização."],
                ["Respostas", "19 chaves estáveis, todas obrigatórias, com inteiro de 1 a 5. Não renomear chaves ao ajustar o texto visível."],
                ["Médias", "A interface calcula no cliente a média geral e a média de cada secção a partir de responses já persistido, sem criar outra tabela."],
                ["Autorização", "GET, POST e DELETE exigem sessão central verificada e atividades.view_sensitive; a service role fica apenas no servidor."],
                ["Consulta", "A lista aceita filtros; Abrir usa um estado separado e somente de leitura. O registo concluído não regressa ao formulário inicial."],
            ],
            "widths": [4.0 * cm, 12.6 * cm],
            "first_column_tint": True,
        },
        "bullets": [
            "A UI só monta as perguntas depois de receber atividade, utente, mês e ano válidos.",
            "Antes de gravar, a API normaliza o período e rejeita respostas em falta, fora de 1-5 ou contextos inexistentes.",
            "A combinação já guardada é detetada antes do preenchimento e encaminha para Ver questionário realizado, evitando duplicados.",
            "O separador Média filtra exatamente por mês e ano e, opcionalmente, por atividade; Todas as atividades cria um grupo por atividade.",
            "A média de cada secção usa apenas as chaves dessa secção, ignora valores inválidos e é formatada com uma casa decimal na escala de 1 a 5.",
            "A consulta individual reutiliza o mesmo cálculo para apresentar a média no cabeçalho de cada secção, sem gravar campos derivados.",
            "A eliminação exige confirmação na interface e autorização novamente no servidor.",
            "createdBy e updatedBy são derivados da sessão autenticada; não confiar em identidade enviada pelo browser.",
            "As traduções PT/EN devem cobrir separadores, filtros, 19 perguntas, escala, estados vazios, consulta e confirmações.",
        ],
        "page_break": True,
    },
    {
        "title": "13. Indicadores e horas de monitores",
        "table": {
            "headers": ["Indicador", "Cálculo"],
            "rows": [
                ["Atividades", "Número de linhas schedule dentro do intervalo e filtro escolhidos."],
                ["Sumários", "Número de summaries no período."],
                ["Média de utentes", "Total de presenças dividido pelo número de sumários."],
                ["Taxa de assiduidade", "Tempo efetivamente presente / duração total das atividades em que o utente marcou presença x 100."],
                ["Volume", "Soma de duração da sessão x número de presentes, em minutos convertidos para horas-pessoa."],
                ["Horas do monitor", "Soma da duração das atividades schedule em que o nome aparece como primeiro ou segundo monitor."],
            ],
            "widths": [4.4 * cm, 12.2 * cm],
            "first_column_tint": True,
        },
        "bullets": [
            "Semanal usa weekStart; mensal usa mês/ano; anual esconde o mês e usa apenas o ano.",
            "O filtro de atividade compara o título guardado; renomes de catálogo não reescrevem automaticamente históricos antigos.",
            "Presenças e taxa de assiduidade só são expostas a quem tem edit; utilizadores só com view recebem totais sem a lista pessoal.",
            "As horas não são um contador mutável: são recalculadas, evitando divergências ao editar ou apagar atividades.",
        ],
    },
    {
        "title": "14. Histórico, tradução e impressão",
        "bullets": [
            "O histórico guarda created, updated, deleted, reordered, printed, summary_saved e summary_printed conforme a ação.",
            "A página mostra Data, Utilizador, Ação, Atividade e Detalhes; o modo escuro deve preservar contraste.",
            "Todas as strings visíveis dos diálogos e cartões precisam de chaves PT/EN em portal/static/app.js.",
            "Novos títulos de página devem seguir 'Atividades | MenteMovimento' e a tradução ativa.",
            "A impressão semanal e dos sumários usa pdfMake com fallback de download para tablets; não chamar window.print sobre a página completa.",
            "A impressão de indicadores deve reproduzir os filtros e valores apresentados no diálogo.",
        ],
    },
    {
        "title": "15. Alterar código manualmente",
        "steps": [
            "Confirmar o estado do trabalho e criar uma branch/commit identificável antes de alterações grandes.",
            "Localizar marcação, tradução, listener, API, schema e CSS relacionados com rg; uma funcionalidade atravessa vários ficheiros.",
            "Editar apenas as fontes em portal/, api/, api-lib/, supabase/ e scripts/; não tratar public/ como fonte.",
            "Se o contrato de dados mudar, escrever SQL compatível com tabelas existentes e preservar tipos/FKs.",
            "Atualizar PT/EN, permissões, histórico, impressão e estes manuais na mesma alteração.",
            "Rever git diff e executar testes antes de gerar novamente public/.",
        ],
        "code": "git status --short\nrg -n \"activities\\.|data-activities|activities_\" portal api scripts supabase\ngit diff --check\nnpm run build",
        "page_break": True,
    },
    {
        "title": "16. Testes mínimos por alteração",
        "table": {
            "headers": ["Área", "Testes obrigatórios"],
            "rows": [
                ["Horário", "Semanas anterior/seguinte, datas, criar, editar, apagar, copiar, almoço, dois monitores e ordem por arrasto."],
                ["Permissões", "Contas só view, view+edit, view_sensitive e export; confirmar botões e bloqueio real de API/RLS."],
                ["Sumário", "Criar/editar, presenças sem assinatura, assinatura tablet, desmarcar, fechar ao guardar e olho em consulta."],
                ["Questionários", "Quatro seleções obrigatórias, 19 respostas, duplicado, filtros, consulta só de leitura, eliminação confirmada, permissões, PT/EN e tablet."],
                ["Catálogo/monitores", "CRUD, renomear monitor usado, dados privados, mês/ano atual e horas calculadas."],
                ["Indicadores", "Semana/mês/ano, todas/uma atividade, taxa de assiduidade, volume, zero dados e impressão."],
                ["Histórico", "Nome do utilizador, todas as ações, tradução e tema escuro."],
                ["Impressão", "Desktop e tablet; semana numa folha, sumário/participantes, indicadores e fallback PDF."],
                ["UI", "Desktop/tablet, claro/escuro, PT/EN, menus exclusivos e clique fora para fechar."],
            ],
            "widths": [3.7 * cm, 12.9 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "17. Aplicar SQL no Supabase",
        "steps": [
            "Fazer backup e confirmar que o SQL Editor está aberto no projeto Supabase da produção correta.",
            "Em instalação nova, executar portal/modules/atividades/supabase/schema.sql por completo.",
            "Numa base existente, rever e executar a migração datada necessária, por exemplo 20260721-activities-sensitive-permissions.sql.",
            "Escolher Run and enable RLS quando o editor alertar para tabelas sem RLS; o schema também ativa RLS explicitamente.",
            "Confirmar Success, executar notify pgrst, 'reload schema' quando necessário e voltar a testar com contas de permissões diferentes.",
        ],
        "bullets": [
            "Os questionários não exigem uma tabela nova: dependem de public.utente_abas já existente e da respetiva RLS/API.",
            "Não usar DROP ... CASCADE para resolver dependências sem um plano de migração.",
            "Não mudar nomes de parâmetros de funções existentes com CREATE OR REPLACE; remova/recrie de forma controlada ou preserve a assinatura.",
            "Políticas dependem de private.current_app_permission(text, text); alterar essa função exige considerar todas as policies dependentes.",
            "Guardar a migração no repositório depois de validada; nunca depender apenas do histórico do SQL Editor.",
        ],
    },
    {
        "title": "18. Gerar e verificar os manuais",
        "body": "Os PDFs são artefactos gerados. A fonte editável é scripts/generate-manual-pdfs.py.",
        "code": "python scripts/generate-manual-pdfs.py --only atividades\npdfinfo portal/modules/atividades/docs/Manual_Utilizador_Atividades.pdf\npdftotext portal/modules/atividades/docs/Manual_Programador_Atividades.pdf -",
        "bullets": [
            "Confirmar os dois PDFs em portal/modules/atividades/docs/.",
            "Renderizar todas as páginas em PNG e rever cortes, sobreposições, acentos, tabelas e código.",
            "Procurar descrições antigas como professor, localStorage como armazenamento principal ou falta de Supabase.",
            "Executar npm run build para copiar os PDFs para public/area/atividades/docs/.",
        ],
        "page_break": True,
    },
    {
        "title": "19. Build, Git e publicação",
        "steps": [
            "Executar npm install apenas quando as dependências mudarem e confirmar o lockfile.",
            "Executar npm run build na raiz e verificar public/area/atividades/ e os PDFs gerados.",
            "Testar localmente login, horário, API, permissões, PDFs e fluxos principais.",
            "Rever git status, git diff --check e o diff dos ficheiros alterados; remover segredos e dados reais.",
            "Criar commit claro e enviar para main conforme o processo da equipa.",
            "Aguardar o deployment automático ou executar npx vercel deploy --prod --yes numa sessão autorizada.",
            "Na produção, repetir testes rápidos e confirmar o deployment Ready antes de encerrar.",
        ],
        "code": "npm run build\ngit status --short\ngit diff --check\ngit add <ficheiros-revistos>\ngit commit -m \"Atualizar modulo de atividades\"\ngit push origin main",
    },
    {
        "title": "20. Segurança, diagnóstico e rollback",
        "table": {
            "headers": ["Sintoma", "Verificação"],
            "rows": [
                ["Tabela/campo não encontrado", "Aplicar schema/migração no projeto correto e recarregar o cache PostgREST."],
                ["RLS bloqueia", "Confirmar app_users, action atual, função private e JWT auth.uid()."],
                ["Atividade não partilha", "Verificar Supabase URL/anon key, sessão, RLS e erro de activities_schedule; não reativar localStorage."],
                ["API 401/403", "Confirmar Authorization Bearer, validade da sessão e permissão exigida."],
                ["API 500", "Confirmar service role na Vercel, logs sem dados pessoais, tabela/colunas e limites do payload."],
                ["Impressão tablet errada", "Confirmar pdfMake carregado, fallback de download e que não é usado window.print da página."],
                ["Horas/indicadores erradas", "Rever datas, nomes de monitor, duração, sumários, presenças e filtro selecionado."],
                ["Questionários não carregam", "Confirmar utente_abas, referências ativas, sessão verificada, view_sensitive, resposta da API e cache PostgREST; não criar tabela paralela."],
            ],
            "widths": [4.4 * cm, 12.2 * cm],
            "first_column_tint": True,
        },
        "bullets": [
            "Para rollback de código, promover o deployment anterior ou reverter o commit sem apagar trabalho alheio.",
            "Para dados, preferir migração corretiva testada com backup; não repor toda a base por causa de um erro isolado.",
            "Antes de fechar: build verde, RLS/API testadas, PDFs revistos, produção Ready e nenhum token no repositório.",
        ],
    },
]


def user_extra_sections(branch: str, records: str, has_import_export: bool = True, has_attachments: bool = True):
    extra = [
        {
            "title": "Procedimento diário recomendado",
            "steps": [
                f"Entrar na Central e confirmar que está no ramo {branch}.",
                f"Pesquisar primeiro antes de criar novos {records}, para evitar duplicados.",
                "Abrir o registo existente e confirmar dados principais antes de editar.",
                "Guardar alterações e confirmar que a tabela/lista voltou a carregar corretamente.",
                "Usar o histórico do ramo para confirmar alterações importantes.",
                "Terminar sessão no fim do trabalho, sobretudo em computadores partilhados.",
            ],
        },
        {
            "title": "Validação antes de guardar",
            "bullets": [
                "Confirmar nomes, contactos e identificadores antes de gravar.",
                "Evitar abreviaturas difíceis de perceber por outros colegas.",
                "Não usar campos de observações para passwords, chaves técnicas ou acessos.",
                "Quando existir data, preencher no formato esperado pelo campo do site.",
                "Se algo parecer errado depois de guardar, consultar o histórico antes de repetir a alteração.",
            ],
        },
        {
            "title": "Permissões e responsabilidades",
            "bullets": [
                "Administradores podem gerir dados e utilizadores globais.",
                "Utilizadores de consulta devem evitar alterações operacionais quando não forem necessárias.",
                "A criação de novas contas deve ser feita apenas no dashboard principal.",
                "A remoção de contas deve acontecer quando alguém deixa de precisar de acesso.",
                "Cada pessoa deve usar a sua própria conta; contas partilhadas dificultam auditoria.",
            ],
        },
    ]
    if has_import_export:
        extra.append(
            {
                "title": "Importação, exportação e cópias de segurança",
                "bullets": [
                    "Exportar antes de importações grandes ou alterações em massa.",
                    "Abrir o ficheiro exportado e confirmar se as colunas fazem sentido.",
                    "Nunca importar um ficheiro se existirem dúvidas sobre nomes de colunas, datas ou identificadores.",
                    "Se uma importação acusar erro, corrigir o ficheiro e repetir só depois da validação.",
                    "Guardar cópias fora do site apenas em local autorizado pela associação.",
                ],
            }
        )
    if has_attachments:
        extra.append(
            {
                "title": "Anexos e documentos",
                "bullets": [
                    "Antes de anexar, confirmar que o registo aberto é o correto.",
                    "Usar nomes de ficheiro claros, com data quando possível.",
                    "Não anexar documentos provisórios ou versões erradas.",
                    "Remover documentos apenas com confirmação da equipa responsável.",
                    "Evitar partilhar PDFs descarregados fora dos canais internos autorizados.",
                ],
            }
        )
    extra.extend(
        [
            {
                "title": "Erros comuns e como agir",
                "bullets": [
                    "Se a sessão expirar, voltar ao login e entrar novamente.",
                    "Se uma lista parecer desatualizada, usar atualizar ou recarregar a página.",
                    "Se uma página não abrir, confirmar primeiro a ligação à internet e tentar Ctrl+F5.",
                    "Se um botão não responder, não repetir várias vezes operações destrutivas; recarregar e confirmar o estado.",
                    "Se surgir um erro de permissões, pedir a um administrador para confirmar o perfil do utilizador.",
                ],
            },
            {
                "title": "Checklist antes de pedir suporte técnico",
                "bullets": [
                    "Indicar o ramo onde ocorreu o problema.",
                    "Indicar a ação feita imediatamente antes do erro.",
                    "Indicar se aconteceu em modo claro, escuro, português ou inglês.",
                    "Enviar print apenas se não mostrar dados pessoais sensíveis.",
                    "Nunca enviar chaves Supabase, passwords ou ficheiros com dados reais em canais inseguros.",
                ],
            },
        ]
    )
    return extra


def user_extra_sections_en(branch: str, records: str):
    return [
        {
            "title": "Recommended daily procedure",
            "steps": [
                f"Sign in to Central MenteMovimento and confirm that the active area is {branch}.",
                f"Search before creating new {records}, to avoid duplicates.",
                "Open the existing record and confirm the main details before editing.",
                "Save changes and confirm that the list loads again correctly.",
                "Use the area history to review relevant changes.",
                "Sign out when leaving a shared computer.",
            ],
        },
        {
            "title": "Validation before saving",
            "bullets": [
                "Confirm names, contacts and identifiers before saving.",
                "Avoid unclear abbreviations in operational notes.",
                "Do not store passwords, technical keys or access details in notes.",
                "Use the date format expected by each field.",
                "If something looks wrong after saving, check history before repeating the operation.",
            ],
        },
        {
            "title": "Permissions and support",
            "bullets": [
                "Global user management belongs on the dashboard menu.",
                "Each person should use their own account.",
                "Screenshots sent for support must not expose sensitive personal or health data.",
                "If a permission error appears, ask an administrator to confirm the user's profile.",
                "If a page does not load, refresh with Ctrl+F5 and try again before reporting the issue.",
            ],
        },
    ]


def dev_extra_sections(branch: str, module_files: list[str], data_notes: list[str]):
    return [
        {
            "title": "Checklist técnica antes de publicar",
            "steps": [
                "Confirmar que as alterações estão na pasta local correta.",
                "Executar o gerador de manuais quando houver mudança funcional.",
                "Executar npm run build na raiz do projeto.",
                "Abrir pelo menos login, dashboard e o ramo alterado.",
                "Testar navegação entre Sócios, Utentes e Cibersegurança.",
                "Confirmar que tema escuro, idioma e menu mantêm comportamento global.",
                "Fazer commit e push para main apenas depois dos testes básicos passarem.",
            ],
        },
        {
            "title": "Ficheiros principais deste ramo",
            "bullets": module_files,
        },
        {
            "title": "Dados, tabelas e Storage",
            "bullets": data_notes,
        },
        {
            "title": "Regras de compatibilidade",
            "bullets": [
                "Não alterar nomes de colunas em produção sem migração SQL e plano de reversão.",
                "Não remover campos usados por importação, exportação, indicadores ou histórico.",
                "Manter a navegação com caminhos absolutos, por exemplo /area/socios/ e não caminhos relativos.",
                "Manter textos novos nas tabelas de tradução quando o conteúdo aparece na interface.",
                "Confirmar que o build da Vercel usa os mesmos ficheiros que foram testados localmente.",
            ],
        },
        {
            "title": "Diagnóstico de problemas em produção",
            "bullets": [
                "Se só a Vercel falhar, verificar logs do deployment e variáveis de ambiente.",
                "Se Supabase devolver erro de sessão, verificar SUPABASE_SERVICE_ROLE_KEY e permissões.",
                "Se uma API Python falhar, confirmar importações, caminhos de ficheiros e limites serverless.",
                "Se um PDF antigo continuar a abrir, limpar cache do browser ou confirmar se o ficheiro foi copiado para public.",
                "Se houver lentidão, confirmar chamadas repetidas, listas muito grandes e loops de renderização.",
            ],
        },
        {
            "title": "Política de dados reais",
            "bullets": [
                "Nunca commitar exports reais de sócios, utentes ou cibersegurança.",
                "Nunca commitar anexos reais ou bases SQLite com dados pessoais.",
                "Usar dados fictícios em testes e prints de suporte.",
                "Se uma chave ou ficheiro sensível for publicado por engano, revogar, substituir e registar o incidente.",
            ],
        },
    ]


def dev_extra_sections_en(branch: str):
    return [
        {
            "title": "Technical pre-release checklist",
            "steps": [
                "Run the manual generator whenever functionality changes.",
                "Run npm run build from the repository root.",
                f"Open the {branch} area and test the changed workflow.",
                "Test navigation between members, clients and cybersecurity.",
                "Confirm that dark mode, language and the menu still behave globally.",
                "Push to main only after the basic production checks pass.",
            ],
        },
        {
            "title": "Compatibility rules",
            "bullets": [
                "Do not rename production columns without a SQL migration and rollback plan.",
                "Do not remove fields used by import, export, indicators or history.",
                "Use absolute navigation paths such as /area/utentes/ instead of relative paths.",
                "Keep translations updated when adding visible interface text.",
                "Never commit real exports, attachments, local databases or private keys.",
            ],
        },
        {
            "title": "Production troubleshooting",
            "bullets": [
                "If Vercel fails, check deployment logs and environment variables.",
                "If Supabase returns session errors, verify service role and database permissions.",
                "If a Python route fails, check imports, filesystem paths and serverless limits.",
                "If an old PDF is still shown, clear browser cache and confirm the file was copied to public.",
                "If the app is slow, inspect repeated requests, large lists and render loops.",
            ],
        },
    ]


UTENTES_USER_PT = [
    {
        "title": "1. Entrar e confirmar a conta",
        "steps": [
            "Iniciar sessão na Central MenteMovimento com a conta individual autorizada.",
            "Entrar em Utentes pelo painel inicial ou pela barra superior.",
            "Abrir o ícone da pessoa e confirmar o nome da conta antes de consultar ou alterar fichas.",
            "No final, escolher Terminar sessão, sobretudo em computadores e tablets partilhados.",
        ],
        "note": "Nunca partilhe contas. O histórico identifica a pessoa autenticada que realizou cada operação.",
    },
    {
        "title": "2. Visão geral da lista de utentes",
        "body": "A imagem usa dados fictícios. Os números identificam os controlos explicados abaixo.",
        "visual": "utentes-dashboard",
        "bullets": [
            "1 - Criar uma ficha nova, se a conta tiver permissão de edição.",
            "2 - Abrir Histórico/Manuais ou consultar a conta e terminar sessão.",
            "3 - Pesquisar por nome sem modificar dados.",
            "4 - Abrir Indicadores ou exportar um backup protegido.",
            "5 - Executar ações apenas sobre a linha correta.",
            "6 - Comparar o nome, o estado e a situação da mensalidade antes de agir.",
        ],
    },
    {
        "title": "3. Botões da lista principal",
        "page_break": True,
        "table": {
            "headers": ["Botão", "O que faz", "Cuidado"],
            "rows": [
                ["Pagar mensalidade (€)", "Abre o registo rápido de uma mensalidade.", "Confirme utente, mês, data, método e valor antes de registar."],
                ["Olho", "Abre a ficha em consulta.", "Abas sensíveis só aparecem com a permissão respetiva."],
                ["Lápis", "Abre a ficha em edição.", "Guardar apenas alterações confirmadas com a documentação."],
                ["Estado", "Ativa ou inativa o utente.", "Inativar preserva o histórico; não equivale a apagar."],
                ["Caixote", "Elimina a ficha e os dados associados.", "A eliminação é definitiva. Faça backup e confirme a identidade."],
            ],
            "widths": [3.4 * cm, 6.0 * cm, 7.2 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "4. Criar uma ficha com segurança",
        "steps": [
            "Clicar em Novo utente e preencher primeiro os dados de identificação indispensáveis.",
            "Confirmar a grafia do nome e evitar criar um duplicado; pesquisar antes de guardar.",
            "Introduzir a data de nascimento: a idade é calculada automaticamente.",
            "Preencher o número de processo exatamente como consta na documentação da associação.",
            "Guardar e confirmar que a nova pessoa aparece na lista principal.",
            "Abrir a ficha criada e completar apenas as abas necessárias e autorizadas.",
        ],
        "note": "Recolha apenas informação necessária para a finalidade do acompanhamento. Não use campos livres para passwords, chaves ou comentários informais.",
    },
    {
        "title": "5. Trabalhar dentro da ficha",
        "body": "O nome grande mantém visível a pessoa que está a ser consultada ou editada.",
        "visual": "utentes-record",
        "bullets": [
            "1 - Imprimir a aba atual, voltar à lista ou guardar alterações.",
            "2 - Mudar de separador; a aplicação mantém o contexto do mesmo utente.",
            "3 - Confirmar o título da aba e preencher os campos dessa finalidade.",
            "4 - A idade acompanha a data de nascimento e não deve ser escrita como substituto da data.",
            "5 - Anexar apenas PDFs legíveis, relevantes e associados à aba correta.",
            "6 - Adicionar registos ou editar pagamentos sem apagar todo o histórico anterior.",
        ],
        "page_break": True,
    },
    {
        "title": "6. Abas e nível de acesso",
        "table": {
            "headers": ["Aba", "Acesso", "Utilização principal"],
            "rows": [
                ["Formulário de Referenciação", "Normal", "Origem, motivo, identificação, informação inicial e folha PDF."],
                ["Informações em Caso de Emergência", "Normal", "Contactos de emergência e informação essencial de saúde."],
                ["Ficha de Inscrição", "Sensível", "Requisitos, enquadramento e dados de avaliação inicial."],
                ["Avaliação Diagnóstica", "Sensível", "Avaliação clínica/social, genograma, ecomapa e notas técnicas."],
                ["Atendimentos", "Sensível", "Registos datados de intervenções, observações e profissionais."],
                ["Plano Individual de Intervenção", "Sensível", "Gestores de caso, CIFsm, objetivos, avaliação, atividades, datas e observações técnicas."],
                ["Proteção de dados", "Normal", "Termos, responsabilidade e PDFs assinados."],
                ["Outros", "Sensível", "Documentos adicionais que não pertencem às restantes abas."],
                ["Pagamentos", "Normal", "Mensalidades, valores, referências, métodos e observações."],
            ],
            "widths": [4.6 * cm, 2.4 * cm, 9.6 * cm],
            "first_column_tint": True,
        },
        "note": "“Normal” significa que usa a permissão geral de Utentes; não significa informação pública. Toda a ficha contém dados pessoais e exige acesso autorizado.",
    },
    {
        "title": "7. Guardar, imprimir e anexar",
        "bullets": [
            "Guardar depois de rever a aba. Ao mudar de separador, aguarde a conclusão da gravação.",
            "O botão Imprimir prepara apenas a página atual; reveja a pré-visualização antes de criar o PDF.",
            "Aumente caixas de texto quando necessário para verificar o conteúdo completo antes de imprimir.",
            "Os anexos aceites são PDFs. Dê nomes claros, sem dados desnecessários no nome do ficheiro.",
            "Abra o PDF depois do envio para confirmar legibilidade e ligação ao utente certo.",
            "Apague um anexo apenas quando estiver incorreto e existir autorização para o fazer.",
        ],
        "page_break": True,
    },
    {
        "title": "8. Mensalidades e pagamentos",
        "steps": [
            "Escolher Pago ou Isento conforme o comprovativo e a regra aplicável.",
            "Selecionar a mensalidade, a data e a forma de pagamento.",
            "Introduzir o valor livremente, incluindo cêntimos, e a referência do recibo quando existir.",
            "Registar o pagamento e confirmar a atualização do estado na lista principal.",
            "Usar o lápis do histórico para corrigir um engano; não apagar e recriar sem necessidade.",
            "Usar o caixote apenas para anular um registo realmente incorreto e documentar o motivo.",
        ],
        "note": "Os pagamentos usam a permissão normal de Utentes, mas continuam a ser informação financeira pessoal e devem ser tratados como confidenciais.",
    },
    {
        "title": "9. Avaliação, genograma, atendimentos e plano individual",
        "bullets": [
            "No genograma, selecione figuras antes de ligar, editar, marcar como falecido ou definir a pessoa índice.",
            "A borda dupla identifica a pessoa índice, tanto homem como mulher.",
            "Use apenas símbolos e relações confirmados: filiação, união, conflito, proximidade, dependência e corte têm significados diferentes.",
            "Guarde depois de alterações no diagrama e confirme visualmente as ligações.",
            "Em Atendimentos, use Adicionar registo para preservar cada intervenção como linha separada.",
            "Registe factos, data, âmbito, intervenção, recomendações e pessoas envolvidas com linguagem profissional.",
            "No Plano Individual de Intervenção, confirme o nome, os dois gestores de caso e a linha certa antes de guardar.",
            "Use Adicionar objetivo para criar uma linha nova; as células e observações técnicas crescem para manter o texto visível.",
            "A aba é sensível: abra-a apenas se a sua conta tiver essa autorização.",
        ],
        "page_break": True,
    },
    {
        "title": "10. Indicadores, histórico e backup",
        "table": {
            "headers": ["Ferramenta", "Conteúdo", "Quem deve usar"],
            "rows": [
                ["Indicadores", "Permanência, ativos/inativos, mensalidades e distribuições demográficas/referral/diagnóstico.", "Contas com acesso à área; imprimir apenas para finalidade autorizada."],
                ["Histórico", "Ações realizadas, pessoa, alvo, data e detalhe.", "Contas com permissão global para consultar histórico."],
                ["Backup ZIP", "Índice, ficha completa, pagamentos, histórico e anexos por utente.", "Apenas quem pode exportar e ver dados sensíveis."],
            ],
            "widths": [3.0 * cm, 8.1 * cm, 5.5 * cm],
            "first_column_tint": True,
        },
        "note": "O backup contém informação altamente sensível. Guarde-o cifrado ou num local institucional protegido, valide o conteúdo e elimine cópias temporárias.",
    },
    {
        "title": "11. Cuidados obrigatórios com a informação",
        "bullets": [
            "Confirme sempre o nome grande do utente antes de ler, escrever, anexar, imprimir ou pagar.",
            "Não fotografe ecrãs nem envie fichas por contas pessoais de email ou mensagens.",
            "Não deixe impressões, PDFs ou backups em áreas comuns ou pastas de transferências.",
            "Bloqueie o dispositivo ao afastar-se e termine sessão no final.",
            "Evite copiar informação clínica para Observações quando já existe uma aba própria.",
            "Em caso de acesso indevido, ficheiro enviado à pessoa errada ou perda de dispositivo, informe imediatamente o responsável da associação.",
        ],
        "page_break": True,
    },
    {
        "title": "12. Problemas frequentes",
        "table": {
            "headers": ["Situação", "O que verificar"],
            "rows": [
                ["Uma aba não aparece", "A conta pode não ter permissão para ver dados sensíveis."],
                ["Não consigo guardar", "Verifique permissão de edição, campos obrigatórios e ligação; não repita cliques rapidamente."],
                ["PDF não abre", "Confirme que o envio terminou, que é um PDF válido e que a sessão continua ativa."],
                ["Backup não aparece", "É necessário Exportar e Ver dados sensíveis em Utentes."],
                ["Impressão corta texto", "Aumente a caixa de texto, reveja a pré-visualização e use a escala sugerida pelo browser."],
                ["Registo errado", "Use o lápis quando existe; caso contrário, corrija a aba e guarde, preservando o histórico."],
            ],
            "widths": [4.2 * cm, 12.4 * cm],
            "first_column_tint": True,
        },
    },
]


UTENTES_DEV_PT = [
    {
        "title": "1. Arquitetura atual de Utentes",
        "body": "O módulo é uma aplicação Python server-rendered integrada no build central. Em produção, dados e PDFs ficam no Supabase.",
        "visual": "utentes-publish",
        "bullets": [
            "A interface, as rotas HTTP, a validação e a persistência estão concentradas em app.py.",
            "A entrada serverless adapta a aplicação para a Vercel.",
            "A service role é usada apenas no servidor; nunca deve ser enviada ao browser.",
            "SQLite e anexos locais existem para desenvolvimento, não para persistência serverless.",
        ],
    },
    {
        "title": "2. Mapa de ficheiros",
        "table": {
            "headers": ["Ficheiro", "Responsabilidade"],
            "rows": [
                ["portal/modules/utentes/app.py", "Rotas, HTML/CSS/JS gerado, permissões, CRUD, tabs, pagamentos, anexos, impressão e backup."],
                ["portal/modules/utentes/api/index.py", "Adaptador/entrada do módulo quando executado isoladamente."],
                ["api/utentes-app.py", "Entrada serverless usada pelo projeto central na Vercel."],
                ["portal/modules/utentes/supabase_schema.sql", "Tabelas base, índices, RLS e bucket documentos-utentes."],
                ["portal/modules/utentes/docs/", "PDFs PT/EN servidos no diálogo Manuais."],
                ["scripts/generate-manual-pdfs.py", "Fonte programática dos PDFs; altere aqui, não diretamente no PDF."],
                ["scripts/prepare-vercel-output.mjs", "Copia os artefactos necessários para public/ durante o build central."],
            ],
            "widths": [6.1 * cm, 10.5 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "3. Modelo de dados",
        "page_break": True,
        "table": {
            "headers": ["Tabela/bucket", "Conteúdo", "Ligação"],
            "rows": [
                ["utentes", "Identificação base, contactos, estado e timestamps.", "id é bigint identity."],
                ["utente_abas", "JSON/texto serializado de cada tab_key.", "Único por utente_id + tab_key."],
                ["utente_anexos", "Metadados do PDF, aba, tamanho e autor.", "FK para utentes; objeto no Storage."],
                ["historico", "Ação, utilizador, alvo, detalhe e data.", "alvo_tipo='Utente' para histórico individual."],
                ["documentos-utentes", "PDFs privados.", "stored_name inclui o caminho lógico do utente."],
            ],
            "widths": [3.5 * cm, 8.0 * cm, 5.1 * cm],
            "first_column_tint": True,
        },
        "note": "A tabela utente_abas permite evoluir formulários extensos sem criar uma coluna para cada campo, mas exige normalização e validação cuidadosas no código Python.",
    },
    {
        "title": "4. Fluxo de leitura e escrita",
        "steps": [
            "A rota autentica a sessão e obtém o utilizador central.",
            "can_view_utentes/can_edit_utentes e as variantes sensitive validam a ação.",
            "A ficha base é lida de utentes; o separador é lido de utente_abas.",
            "O formulário é convertido para a estrutura esperada pela aba e validado.",
            "save_tab_content faz upsert e log_action cria a auditoria.",
            "A resposta redireciona para o mesmo utente e tab com uma mensagem de resultado.",
        ],
    },
    {
        "title": "5. Permissões e classificação das abas",
        "table": {
            "headers": ["Permissão", "Efeito"],
            "rows": [
                ["utentes.view", "Lista, ficha e abas normais: referenciação, emergência, proteção e pagamentos."],
                ["utentes.edit", "Criação, edição e ações nas abas normais."],
                ["utentes.view_sensitive", "Consulta de inscrição, diagnóstica, atendimentos, plano individual e outros."],
                ["utentes.edit_sensitive", "Alteração das cinco abas sensíveis."],
                ["utentes.export", "Só mostra backup quando view_sensitive também está ativo."],
                ["utentes.delete", "Eliminação de utentes e dados associados."],
                ["central.view_history", "Consulta do histórico global no menu."],
            ],
            "widths": [5.2 * cm, 11.4 * cm],
            "first_column_tint": True,
        },
        "note": "UTENTES_PUBLIC_TABS é apenas uma classificação técnica de acesso normal. Não significa que os dados sejam públicos fora da aplicação.",
    },
    {
        "title": "6. Abas, JSON e compatibilidade",
        "page_break": True,
        "bullets": [
            "TAB_SECTIONS define ordem, chave e título. Ao adicionar uma aba, atualize classificação, renderização, parsing, impressão, backup e manual.",
            "normalize_tab_key rejeita chaves desconhecidas e regressa a uma aba válida.",
            "Campos antigos devem continuar a ser aceites quando a forma do JSON evolui.",
            "Pagamentos mantêm pag_historico dentro do conteúdo da aba e têm funções próprias de normalização, edição e cancelamento.",
            "plano_intervencao é guardado em utente_abas como JSON com os gestores de caso, plano_row_count e campos plano_{n}_*. Preserve as linhas e a respetiva ordem.",
            "O Plano Individual usa áreas de texto expansíveis e sheet-table; ao alterar a tabela, valide sempre a impressão para garantir que o conteúdo não fica cortado.",
            "O genograma é conteúdo estruturado; qualquer alteração deve preservar diagramas já guardados.",
            "Não renomeie tab_key existentes sem uma migração explícita dos dados.",
        ],
    },
    {
        "title": "7. Anexos, backups e auditoria",
        "bullets": [
            "A aplicação aceita PDF e usa SUPABASE_BUCKET, por defeito documentos-utentes.",
            "Os metadados são criados em utente_anexos apenas depois do upload bem-sucedido.",
            "Downloads são servidos inline com no-store; o bucket permanece privado.",
            "Ao eliminar um utente, remova objetos, linhas de anexos, abas e ficha sem deixar órfãos.",
            "O backup cria ZIP em memória com indice.csv, ficha-completa.html, pagamentos.csv, historico.csv e anexos/.",
            "Não escreva conteúdo clínico, tokens ou service role em logs de erro.",
        ],
    },
    {
        "title": "8. Alterar código manualmente",
        "steps": [
            "Criar uma branch ou confirmar que o trabalho atual está identificado com git status.",
            "Localizar o fluxo com rg antes de editar; app.py contém várias representações relacionadas do mesmo campo.",
            "Alterar a fonte em portal/modules/utentes/app.py e, se necessário, o schema/migração.",
            "Atualizar textos PT/EN, impressão, validação, permissões e histórico da mesma funcionalidade.",
            "Rever git diff e procurar alterações acidentais, dados reais e segredos.",
            "Executar testes locais e o build central antes de publicar.",
        ],
        "code": "git status --short\nrg -n \"texto-ou-função\" portal/modules/utentes/app.py\ngit diff -- portal/modules/utentes/app.py",
    },
    {
        "title": "9. Testes mínimos por alteração",
        "table": {
            "headers": ["Área alterada", "Testes obrigatórios"],
            "rows": [
                ["Lista/ações", "Pesquisar, abrir, editar, estado, apagar bloqueado/permitido e pagamento rápido."],
                ["Aba normal", "Ver/editar com permissões normais e confirmar histórico."],
                ["Aba sensível", "Testar conta sem sensitive, só view_sensitive e edit_sensitive."],
                ["Pagamentos", "Criar, editar, anular, cêntimos, Pago/Isento e resumo da lista."],
                ["PDF/anexos", "Upload, abertura, impressão, eliminação e utente errado bloqueado."],
                ["Backup", "Permissão dupla, estrutura ZIP, PDFs e ausência de ficheiros temporários."],
                ["UI", "Desktop, tablet, tema claro/escuro, menus e clique fora para fechar."],
            ],
            "widths": [4.0 * cm, 12.6 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "10. Gerar os manuais",
        "body": "Os PDFs são artefactos gerados. A fonte editável é este script.",
        "code": "python scripts/generate-manual-pdfs.py --only utentes",
        "bullets": [
            "Confirme os dois PDFs portugueses em portal/modules/utentes/docs/.",
            "Renderize todas as páginas e verifique cortes, sobreposição, tabelas e acentos.",
            "Mantenha o parâmetro de versão dos links quando publicar uma revisão.",
        ],
        "page_break": True,
    },
    {
        "title": "11. Build, Git e publicação",
        "code": [
            "npm run build",
            "git status --short\ngit diff --check",
            "npx vercel --prod --yes",
        ],
        "steps": [
            "Executar npm run build na raiz do repositório e corrigir qualquer erro.",
            "Confirmar que os PDFs e a rota de Utentes foram copiados para public/.",
            "Testar localmente login, lista, ficha, permissões e PDFs.",
            "Criar commit com mensagem objetiva e enviar para o repositório autorizado.",
            "Publicar na Vercel e aguardar estado Ready.",
            "Abrir produção, testar com uma conta de permissões limitadas e validar o PDF num novo separador.",
        ],
    },
    {
        "title": "12. Variáveis e segurança",
        "table": {
            "headers": ["Variável", "Regra"],
            "rows": [
                ["SUPABASE_URL", "Pode identificar o projeto, mas deve ser configurada no ambiente correto."],
                ["SUPABASE_SERVICE_ROLE_KEY", "Segredo de servidor. Nunca expor no HTML, JavaScript, Git ou screenshots."],
                ["SUPABASE_BUCKET", "Opcional; por defeito documentos-utentes."],
                ["SQLite/local uploads", "Apenas desenvolvimento; não confiar para dados persistentes na Vercel."],
            ],
            "widths": [5.4 * cm, 11.2 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "13. Diagnóstico de falhas",
        "table": {
            "headers": ["Sintoma", "Diagnóstico"],
            "rows": [
                ["500 na rota", "Rever logs Vercel, import do handler, variáveis e exceção Supabase."],
                ["Ficha não guarda", "Verificar permissão, parsing do formulário, upsert e resposta da tabela."],
                ["Anexo falha", "Verificar bucket, service role, MIME PDF, tamanho e metadados."],
                ["Aba desapareceu", "Verificar classificação sensitive e matriz da conta."],
                ["PDF antigo", "Confirmar hash do ficheiro publicado, query de versão e cache do browser/CDN."],
                ["Função lenta", "Procurar pedidos repetidos, backups grandes e renderização de todos os anexos."],
            ],
            "widths": [4.2 * cm, 12.4 * cm],
            "first_column_tint": True,
        },
        "page_break": True,
    },
    {
        "title": "14. Rollback e checklist final",
        "bullets": [
            "Preservar o deployment anterior e evitar alterações destrutivas de schema sem backup.",
            "Em falha de código, reverter o commit ou promover o deployment estável anterior.",
            "Em falha de dados, parar escritas, recolher evidência e aplicar migração corretiva testada.",
            "Confirmar CRUD, oito abas, permissões normais/sensíveis, pagamentos, anexos, impressão, indicadores, backup e histórico.",
            "Confirmar build sem erros, PDFs revistos, produção Ready e ausência de segredos/dados reais no Git.",
        ],
    },
]


DISPOSITIVOS_USER = [
    {
        "title": "1. Entrar e proteger a sessão",
        "steps": [
            "Iniciar sessão com a conta individual autorizada.",
            "Entrar em Cibersegurança pelo painel inicial ou pela barra superior.",
            "Confirmar o nome da conta no ícone da pessoa.",
            "Terminar sessão quando concluir o trabalho.",
        ],
        "note": "O nome Cibersegurança substitui Gestão de Dispositivos na interface; a rota técnica continua /area/dispositivos/.",
    },
    {
        "title": "2. Visão geral da área",
        "body": "A imagem usa equipamentos fictícios. Os números assinalam os grupos principais.",
        "visual": "ciber-dashboard",
        "bullets": [
            "1 - Abrir Histórico/Manuais ou consultar a conta.",
            "2 - Acompanhar total, ativos, em manutenção e arquivados.",
            "3 - Criar ou editar um registo no formulário.",
            "4 - Exportar, imprimir, importar, atualizar ou eliminar conforme as permissões.",
            "5 - Editar ou eliminar apenas o equipamento confirmado pela identificação e série.",
        ],
    },
    {
        "title": "3. Criar um registo sem duplicados",
        "page_break": True,
        "steps": [
            "Pesquisar o número de série antes de criar o equipamento.",
            "Preencher ID, data de entrada, marca, modelo e número de série.",
            "Completar hardware e sistema com os dados observados.",
            "Registar diagnóstico, peças, custo/tempo estimado, técnico, estado e resultado.",
            "Preencher configuração e contas apenas com referências aprovadas, nunca passwords em claro.",
            "Guardar e confirmar o novo registo na tabela.",
        ],
        "note": "O número de série é único. Se a aplicação indicar duplicado, edite o registo existente em vez de criar outro.",
    },
    {
        "title": "4. Formulário e informação associada",
        "visual": "ciber-record",
        "bullets": [
            "1 - Cancelar sai da edição sem criar uma segunda versão.",
            "2 - Identificação e hardware permitem reconhecer fisicamente o equipamento.",
            "3 - Diagnóstico/reparação e configuração documentam o trabalho técnico.",
            "4 - Anexos guardam fotos, faturas, PDFs e documentos úteis.",
            "5 - O histórico mostra alterações ligadas ao equipamento.",
            "6 - Guardar alterações atualiza o registo existente.",
        ],
        "page_break": True,
    },
    {
        "title": "5. Pesquisa, filtros, ordenação e ações",
        "table": {
            "headers": ["Controlo", "Comportamento", "Boa prática"],
            "rows": [
                ["Pesquisar", "Filtra os valores visíveis da tabela.", "Use série, ID, marca ou modelo para confirmar o alvo."],
                ["Estado", "Mostra todos, ativos, manutenção ou arquivados.", "Arquive equipamentos fora de uso em vez de apagar."],
                ["Ordenar", "Escolhe coluna e direção crescente/decrescente.", "Ordene por entrada ou série antes de rever lotes."],
                ["Lápis", "Carrega o registo no formulário de edição.", "Confirme o título Editar registo e guarde uma única vez."],
                ["Caixote", "Elimina o equipamento.", "Só usar com autorização e após exportação/validação."],
                ["Atualizar", "Volta a consultar a base de dados.", "Use após alterações feitas por outra pessoa."],
            ],
            "widths": [3.2 * cm, 6.0 * cm, 7.4 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "6. CSV e relatório",
        "bullets": [
            "Exportar CSV descarrega apenas os registos atualmente visíveis após pesquisa e filtro.",
            "Imprimir relatório usa a mesma lista visível; confirme filtros e pré-visualização.",
            "Importar CSV cria ou atualiza pelo número de série e deve ser precedido por um backup/exportação.",
            "No Google Sheets, transfira como Valores separados por vírgulas (.csv), sem mudar os títulos das colunas.",
            "Revise acentos, datas, números de série e estados antes de importar.",
            "Nunca use Apagar tudo como etapa normal de uma importação.",
        ],
        "note": "As colunas incluem identificação, hardware, diagnóstico, reparação, configuração, contas e observações. Uma coluna desconhecida não substitui validação manual.",
        "page_break": True,
    },
    {
        "title": "7. Anexos, histórico e indicadores",
        "table": {
            "headers": ["Ferramenta", "Como usar"],
            "rows": [
                ["Anexos", "Editar o equipamento, escolher Anexar foto/fatura, confirmar o ficheiro e abrir para validar."],
                ["Histórico do registo", "Consultar no próprio formulário as ações relacionadas com o equipamento."],
                ["Histórico global", "Abrir no menu de três tracinhos quando a conta tem a permissão global."],
                ["Indicadores", "Consultar totais e distribuições por marca, técnico, avaria e resultado final."],
                ["Imprimir relatório", "Criar uma vista dos registos visíveis sem botões de edição."],
            ],
            "widths": [4.2 * cm, 12.4 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "8. Estados e manutenção do inventário",
        "table": {
            "headers": ["Estado", "Quando usar"],
            "rows": [
                ["Ativo", "Equipamento em utilização ou disponível sem intervenção pendente."],
                ["Manutenção", "Existe avaria, diagnóstico ou reparação em curso."],
                ["Arquivado", "Equipamento fora de serviço, abatido ou preservado apenas para histórico."],
            ],
            "widths": [3.4 * cm, 13.2 * cm],
            "first_column_tint": True,
        },
        "note": "Arquivar preserva rastreabilidade. Eliminar remove o registo e pode apagar anexos associados.",
    },
    {
        "title": "9. Cuidados de segurança",
        "bullets": [
            "Não guardar passwords, códigos MFA, service roles ou tokens em credencial administrador, contas ou observações.",
            "Quando for necessário indicar acesso, registe apenas uma referência ao cofre institucional aprovado.",
            "Anexos podem conter números de série, faturas e dados pessoais: abra-os apenas em dispositivos autorizados.",
            "Não exporte CSV para serviços pessoais nem deixe ficheiros na pasta Transferências.",
            "Registe diagnósticos factuais e evite informação pessoal que não seja necessária à reparação.",
            "Termine sessão e bloqueie o ecrã ao afastar-se.",
        ],
        "page_break": True,
    },
    {
        "title": "10. Problemas frequentes e verificação final",
        "table": {
            "headers": ["Situação", "Ação"],
            "rows": [
                ["Série duplicada", "Cancelar a criação, pesquisar a série e editar o registo existente."],
                ["Não consigo editar", "A conta pode ter apenas Ver; pedir revisão da permissão."],
                ["Anexo não aparece", "Confirmar upload concluído, tipo/tamanho e ligação; atualizar a página."],
                ["Importação inesperada", "Parar, não apagar tudo, comparar CSV/export anterior e consultar histórico."],
                ["Indicador errada", "Rever estados e valores de técnico/avaria escritos de formas diferentes."],
                ["Dados antigos", "Usar Atualizar e confirmar que outra pessoa guardou a alteração."],
            ],
            "widths": [4.0 * cm, 12.6 * cm],
            "first_column_tint": True,
        },
        "note": "Antes de terminar: confirme que o equipamento certo foi alterado, o estado corresponde à realidade e os anexos abrem.",
    },
]


DISPOSITIVOS_DEV = [
    {
        "title": "1. Arquitetura atual de Cibersegurança",
        "body": "A área é uma aplicação React/Vite integrada no build central e ligada diretamente ao Supabase com sessão autenticada e RLS.",
        "visual": "ciber-publish",
        "bullets": [
            "A rota pública mantém /area/dispositivos/ por compatibilidade, embora o nome visível seja Cibersegurança.",
            "Auth e permissões centrais determinam as operações permitidas.",
            "devices guarda a linha base; detalhes extensos são codificados em notes.",
            "Histórico, metadados de anexos e ficheiros físicos ficam separados.",
        ],
    },
    {
        "title": "2. Mapa de ficheiros",
        "table": {
            "headers": ["Ficheiro", "Responsabilidade"],
            "rows": [
                ["portal/modules/dispositivos/src/App.tsx", "Estado, sessão, permissões, CRUD, menus, CSV, anexos, histórico, indicadores e impressão."],
                ["src/App.css", "Layout, temas, formulários, tabelas, modais, impressão e responsividade."],
                ["src/types.ts", "Contratos Device, RepairDetails, Profile, permissões, histórico e anexos."],
                ["src/repairInventory.ts", "Campos, secções, mapeamento CSV e serialização/deserialização de notes."],
                ["src/lib/supabase.ts", "Criação do cliente e configuração da sessão Auth."],
                ["supabase/schema.sql", "Tabelas, triggers, RLS, políticas e bucket principal."],
                ["supabase/feature-upgrades.sql", "Upgrade histórico para histórico/anexos; preferir schema atual em instalações novas."],
                ["public/docs/", "PDFs abertos em novo separador pelo diálogo Manuais."],
            ],
            "widths": [6.4 * cm, 10.2 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "3. Modelo de dados",
        "page_break": True,
        "table": {
            "headers": ["Tabela/bucket", "Conteúdo", "Segurança"],
            "rows": [
                ["devices", "ID UUID, name, serial único, model, location/brand, status, notes e autoria.", "RLS por ação dispositivos.*."],
                ["device_history", "Dispositivo, série, ação, resumo, autor e timestamp.", "view para ler; edit para inserir."],
                ["device_attachments", "Nome, path, tipo, tamanho, autor e device_id.", "view para ler; edit para criar/apagar."],
                ["device-attachments", "Ficheiros físicos privados.", "Políticas Storage com a mesma matriz."],
                ["profiles", "Compatibilidade com Auth: nome, email e role.", "Perfil próprio; permissões reais vêm do sistema central."],
            ],
            "widths": [4.0 * cm, 8.2 * cm, 4.4 * cm],
            "first_column_tint": True,
        },
    },
    {
        "title": "4. Serialização dos detalhes técnicos",
        "body": "RepairDetails não corresponde a colunas individuais. encodeRepairDetails guarda JSON no campo devices.notes com o prefixo __MENTEMOVIMENTO_REPAIR_V1__.",
        "bullets": [
            "decodeRepairDetails aceita o formato atual e mantém fallback para registos antigos sem prefixo.",
            "brand é sincronizada com location para compatibilidade.",
            "Ao adicionar um campo, atualize tipo, emptyRepairDetails, secção do formulário, coluna/aliases CSV e leitura/escrita.",
            "Não altere nem remova o prefixo sem uma migração e um decoder compatível.",
            "Valores de estado no enum são active, maintenance e retired; os textos visíveis são traduzidos.",
        ],
    },
    {
        "title": "5. Permissões e RLS",
        "table": {
            "headers": ["Permissão", "Efeito na aplicação e base de dados"],
            "rows": [
                ["dispositivos.view", "Carrega devices, histórico/anexos permitidos e abre a área."],
                ["dispositivos.edit", "Cria/atualiza devices, histórico e anexos."],
                ["dispositivos.export", "Exporta CSV e imprime relatórios/indicadores."],
                ["dispositivos.delete", "Elimina equipamentos e apresenta Apagar tudo."],
                ["central.view_history", "Abre o histórico global no menu."],
                ["central.manage_users", "Mostra gestão de utilizadores quando aplicável; a gestão global é a fonte de verdade."],
            ],
            "widths": [5.0 * cm, 11.6 * cm],
            "first_column_tint": True,
        },
        "note": "As políticas do schema chamam private.current_app_permission('dispositivos', ação). Esta função central deve existir antes de executar o schema.",
    },
    {
        "title": "6. Fluxo React e CRUD",
        "page_break": True,
        "steps": [
            "O cliente Supabase restaura a sessão e carrega perfil/permissões.",
            "refreshData consulta devices e atualiza o estado da aplicação.",
            "deviceToForm descodifica o registo ao clicar no lápis.",
            "handleDeviceSubmit valida série, codifica RepairDetails e faz insert/update.",
            "Após sucesso, a aplicação regista device_history e atualiza a lista.",
            "Filtros, ordenação e indicadores são derivados dos devices carregados.",
        ],
    },
    {
        "title": "7. CSV, aliases e duplicados",
        "bullets": [
            "repairTableColumns é a fonte dos cabeçalhos, larguras, aliases e exportação.",
            "normalizeCsvKey remove acentos e pontuação para reconhecer títulos equivalentes.",
            "csvRowToDeviceForm converte cada linha e parseCsvStatus normaliza estados.",
            "A importação usa número de série como chave funcional; séries vazias ou duplicadas exigem validação.",
            "Ao mudar um cabeçalho, preserve aliases antigos para não quebrar ficheiros existentes.",
            "Teste vírgulas, aspas, quebras de linha, UTF-8, Google Sheets e atualização de registos existentes.",
        ],
    },
    {
        "title": "8. Anexos e histórico",
        "bullets": [
            "O input aceita imagem, PDF, Word e Excel; valide tamanho e tipo também no backend/política quando necessário.",
            "O objeto é enviado para device-attachments e os metadados para device_attachments.",
            "A abertura deve usar URL assinada/temporária; o bucket não é público.",
            "Apagar deve remover objeto e metadado, sem ocultar falhas parciais.",
            "device_history deve registar criação, edição, importação e ações relevantes sem incluir segredos.",
            "A ausência das tabelas de upgrade deve gerar mensagem clara, não fallback silencioso com dados locais.",
        ],
    },
    {
        "title": "9. Alterar código manualmente",
        "steps": [
            "Rever git status e criar uma branch/commit de segurança.",
            "Localizar estado, texto e handlers com rg antes de editar App.tsx.",
            "Alterar src/, nunca dist/ como fonte definitiva.",
            "Se o modelo mudar, atualizar types.ts, repairInventory.ts, UI, CSV, indicadores, histórico e manual.",
            "Se o schema mudar, escrever SQL idempotente, preservar RLS e testar num projeto de desenvolvimento.",
            "Rever git diff e executar lint/build antes da publicação.",
        ],
        "code": "git status --short\nrg -n \"handleDeviceSubmit|repairTableColumns\" portal/modules/dispositivos/src\ngit diff -- portal/modules/dispositivos",
    },
    {
        "title": "10. Testes mínimos",
        "table": {
            "headers": ["Mudança", "Cobertura"],
            "rows": [
                ["Formulário", "Criar, editar, cancelar, série duplicada, campos longos e tema escuro."],
                ["Permissões", "view apenas, edit, export, delete e histórico global em contas diferentes."],
                ["CSV", "Export filtrado, import novo, atualização por série, UTF-8 e erro por ficheiro inválido."],
                ["Anexos", "Upload, abertura, tamanho, eliminação, bucket privado e dispositivo correto."],
                ["Indicadores", "Totais, marcas, técnicos, avarias, resultados e impressão."],
                ["Responsividade", "Desktop, tablet, tabela horizontal, menus e modais sem sobreposição."],
            ],
            "widths": [4.0 * cm, 12.6 * cm],
            "first_column_tint": True,
        },
        "page_break": True,
    },
    {
        "title": "11. Gerar manuais, build e publicação",
        "code": [
            "python scripts/generate-manual-pdfs.py --only ciberseguranca",
            "npm --prefix portal/modules/dispositivos run build\nnpm run build",
            "git diff --check\nnpx vercel --prod --yes",
        ],
        "steps": [
            "Gerar e renderizar os dois PDFs; verificar todas as páginas.",
            "Executar o build Vite do módulo e depois o build central.",
            "Confirmar dist, public/area/dispositivos e public/docs sem editar artefactos manualmente.",
            "Testar login, CRUD, CSV, anexos, histórico, indicadores e PDFs localmente.",
            "Criar commit, publicar e aguardar Ready na Vercel.",
            "Repetir os testes essenciais em produção com permissões limitadas.",
        ],
    },
    {
        "title": "12. Segurança e gestão de segredos",
        "bullets": [
            "VITE_SUPABASE_URL e a anon key são públicas por natureza; a segurança depende de RLS correta.",
            "Nunca introduza service role em variáveis VITE_, código React ou ficheiros publicados.",
            "Não coloque passwords reais nos campos admin_credential, gd_account ou observations.",
            "Preserve políticas do bucket e URLs assinadas para anexos.",
            "Não faça commit de CSV reais, faturas, fotos, dumps, .env ou tokens.",
            "Revogue imediatamente qualquer token exposto e crie um deployment com as novas credenciais.",
        ],
    },
    {
        "title": "13. Diagnóstico, rollback e checklist",
        "table": {
            "headers": ["Sintoma", "Verificação"],
            "rows": [
                ["Tabela não existe", "Executar schema/upgrade correto e notify pgrst; confirmar projeto Supabase."],
                ["RLS bloqueia", "Confirmar app_users/permissões, função private e sessão auth.uid()."],
                ["Dados antigos", "Verificar decoder do prefixo e fallback de notes antes de migrar."],
                ["CSV corrompe", "Confirmar aliases, aspas, UTF-8 e não alterar série/ID inadvertidamente."],
                ["Anexo falha", "Verificar bucket, políticas Storage, path, MIME, tamanho e limpeza parcial."],
                ["Build branco", "Rever base path, assets, consola do browser e conteúdo de dist/public."],
            ],
            "widths": [4.0 * cm, 12.6 * cm],
            "first_column_tint": True,
        },
        "bullets": [
            "Para rollback de código, promover o deployment anterior ou reverter o commit.",
            "Para dados, evitar DROP CASCADE e aplicar migração corretiva testada com backup.",
            "Antes de fechar: build verde, RLS testada, CRUD/CSV/anexos/indicadores validados, PDFs revistos e produção Ready.",
        ],
        "page_break": True,
    },
]


def main():
    parser = argparse.ArgumentParser(description="Gerar os manuais PDF da Central MenteMovimento.")
    parser.add_argument(
        "--only",
        choices=["inicial", "socios", "utentes", "ciberseguranca", "atividades"],
        help="Gera apenas os manuais do módulo indicado; sem esta opção gera todos.",
    )
    args = parser.parse_args()

    if args.only in (None, "inicial"):
        build_pdf(
            OUTPUTS["initial"],
            "Manual Inicial - MenteMovimento",
            "Guia simples para os primeiros passos na aplicação, navegação segura e utilização responsável de cada área.",
            "Todos os utilizadores autorizados da associação",
            "Aplicação MenteMovimento",
            MANUAL_INICIAL,
            updated_at="24/07/2026",
        )
    if args.only == "inicial":
        return

    if args.only in (None, "socios"):
        build_pdf(
            OUTPUTS["socios_user"],
            "Manual do Utilizador - Gestão de Sócios",
            "Guia visual para utilizar a área de Sócios, compreender cada botão e proteger a informação da associação.",
            "Administradores e operadores da associação",
            "Gestão de Sócios",
            SOCIOS_USER,
            updated_at="16/07/2026",
        )
        build_pdf(
            OUTPUTS["socios_dev"],
            "Manual do Programador - Gestão de Sócios",
            "Guia técnico da arquitetura atual, edição manual, testes, Supabase, Git e publicação da área de Sócios.",
            "Programadores e responsáveis técnicos",
            "Gestão de Sócios",
            SOCIOS_DEV,
            updated_at="16/07/2026",
        )
    if args.only == "socios":
        return
    if args.only in (None, "utentes"):
        build_pdf(
            OUTPUTS["utentes_user_pt"],
            "Manual do Utilizador - Gestão de Utentes",
            "Guia visual para utilizar fichas, separadores, mensalidades, anexos, indicadores e proteger a informação dos utentes.",
            "Administradores, técnicos e utilizadores autorizados",
            "Gestão de Utentes",
            UTENTES_USER_PT,
            updated_at="23/07/2026",
        )
        build_pdf(
            OUTPUTS["utentes_dev_pt"],
            "Manual do Programador - Gestão de Utentes",
            "Guia técnico da arquitetura atual, permissões, dados, edição manual, testes, Git e publicação da área de Utentes.",
            "Programadores e responsáveis técnicos",
            "Gestão de Utentes",
            UTENTES_DEV_PT,
            updated_at="23/07/2026",
        )

    if args.only in (None, "utentes"):
        build_pdf(
            OUTPUTS["utentes_user_en"],
            "User Manual - Client Management",
            "Practical guide for using client records, tabs, payments, attachments and indicators.",
            "Administrators, staff and authorised users",
            "Client Management",
            UTENTES_USER_EN + user_extra_sections_en("Client Management", "clients"),
            updated_at="23/07/2026",
        )
        build_pdf(
            OUTPUTS["utentes_dev_en"],
            "Developer Manual - Client Management",
            "Technical guide for maintaining the clients area in the central project.",
            "Developers and technical maintainers",
            "Client Management",
            UTENTES_DEV_EN + dev_extra_sections_en("Client Management"),
            updated_at="23/07/2026",
        )
    if args.only == "utentes":
        return

    if args.only in (None, "ciberseguranca"):
        build_pdf(
            OUTPUTS["dispositivos_user"],
            "Manual do Utilizador - Cibersegurança",
            "Guia visual para gerir inventário, reparações, CSV, relatórios, anexos e indicadores com segurança.",
            "Administradores e operadores da associação",
            "Cibersegurança",
            DISPOSITIVOS_USER,
            updated_at="16/07/2026",
        )
        build_pdf(
            OUTPUTS["dispositivos_dev"],
            "Manual do Programador - Cibersegurança",
            "Guia técnico da arquitetura React/Vite, Supabase, RLS, CSV, testes, Git e publicação da área de Cibersegurança.",
            "Programadores e responsáveis técnicos",
            "Cibersegurança",
            DISPOSITIVOS_DEV,
            updated_at="16/07/2026",
        )
    if args.only == "ciberseguranca":
        return

    build_pdf(
        OUTPUTS["atividades_user"],
        "Manual do Utilizador - Gestão de Atividades",
        "Guia visual para planear o horário, gerir sumários, presenças e questionários mensais, consultar indicadores e proteger a informação da área de Atividades.",
        "Administradores, técnicos e utilizadores autorizados",
        "Gestão de Atividades",
        ATIVIDADES_USER,
        updated_at="29/07/2026",
    )
    build_pdf(
        OUTPUTS["atividades_dev"],
        "Manual do Programador - Gestão de Atividades",
        "Guia técnico da arquitetura atual, questionários mensais, Supabase, permissões, APIs, testes, Git e publicação da área de Atividades.",
        "Programadores e responsáveis técnicos",
        "Gestão de Atividades",
        ATIVIDADES_DEV,
        updated_at="29/07/2026",
    )


if __name__ == "__main__":
    main()
