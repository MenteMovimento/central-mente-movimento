# -*- coding: utf-8 -*-
"""Generate the PDF manuals published by the Central MenteMovimento site."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
UPDATED_AT = "22/06/2026"
REPO_URL = "https://github.com/MenteMovimento/central-mente-movimento"
SITE_URL = "https://central-mente-movimento.vercel.app"

OUTPUTS = {
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


def section(title, body=None, bullets=None, steps=None, note=None):
    parts = [p(title, "h1")]
    if body:
        if isinstance(body, str):
            parts.append(p(body))
        else:
            parts.extend(p(item) for item in body)
    if bullets:
        parts.append(bullet_list(bullets))
    if steps:
        parts.append(numbered_list(steps))
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


SOCIOS_USER = COMMON_USER + [
    {
        "title": "3. Painel de sócios",
        "body": "A área de Sócios mostra pesquisa, filtros de quotas, métricas rápidas e a tabela de sócios registados.",
        "bullets": [
            "Pesquisar por número de sócio, nome, NIF, localidade ou email.",
            "Filtrar por Todos, Quotas em atraso ou Em dia.",
            "Ordenar por nome, número ou estado das quotas.",
            "Exportar CSV para análise externa ou arquivo.",
            "Abrir o histórico próprio dos sócios no menu do ramo.",
        ],
    },
    {
        "title": "4. Criar e editar sócios",
        "steps": [
            "Clicar em Novo sócio.",
            "Preencher número, nome, dados fiscais, contactos, localidade, número de ata e quota anual.",
            "Indicar até que mês/ano a quota está paga e, quando existir, a data do pagamento.",
            "Guardar e confirmar que o registo aparece na tabela.",
            "Para alterar, usar o lápis na linha do sócio, rever os campos e guardar.",
        ],
        "note": "Antes de importar ou editar muitos registos, exporte uma cópia CSV/Excel para ter uma referência de segurança.",
    },
    {
        "title": "5. Quotas e pagamentos",
        "bullets": [
            "O estado das quotas é calculado com base no mês/ano até ao qual a quota está paga.",
            "Sócios com pagamento em atraso aparecem nos filtros e métricas de atraso.",
            "A data do pagamento serve para histórico interno e controlo administrativo.",
            "Ao confirmar uma quota, verifique sempre se o mês, o ano e o sócio selecionado estão corretos.",
        ],
    },
    {
        "title": "6. Importação, exportação e histórico",
        "bullets": [
            "A importação de ficheiros deve ser validada antes de entrar em produção; se algum campo obrigatório falhar, cancele e corrija o ficheiro.",
            "A exportação CSV respeita filtros e ordenação visíveis no momento.",
            "O histórico de sócios regista criação, edição, eliminação e alterações relevantes.",
            "Use nomes de ficheiro com data quando guardar exportações fora do site.",
        ],
    },
    {
        "title": "7. Boas práticas",
        "bullets": [
            "Não partilhar credenciais entre colegas.",
            "Confirmar NIF, email e número de sócio antes de guardar.",
            "Não eliminar sócios sem exportar ou confirmar com a equipa.",
            "Evitar escrever dados clínicos ou sensíveis na área de sócios se não forem necessários à gestão associativa.",
        ],
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
        "title": "6. Estatísticas e permanência",
        "bullets": [
            "O botão de estatísticas mostra indicadores de acompanhamento da base de utentes.",
            "A permanência média usa datas de entrada e saída quando disponíveis.",
            "A percentagem por concelho ajuda a perceber a distribuição territorial.",
            "Utentes inativos devem continuar disponíveis para estatísticas e consulta histórica.",
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
        "body": "A área de Cibersegurança organiza equipamentos, estados, reparações, anexos e estatísticas.",
        "bullets": [
            "Os cartões de topo mostram total, ativos, em manutenção e arquivados.",
            "A aba Cibersegurança contém o formulário e a tabela principal.",
            "A aba Estatísticas apresenta distribuição por estado, marcas, técnicos, avarias e resultados.",
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


ATIVIDADES_USER = COMMON_USER + [
    {
        "title": "3. Painel de atividades",
        "body": "A area de Atividades organiza a semana de segunda a sexta num horario escolar simples, com blocos de manha, almoco e tarde.",
        "bullets": [
            "Usar as setas para navegar entre semanas reais.",
            "Confirmar o intervalo de datas mostrado antes de criar ou imprimir atividades.",
            "Consultar as atividades diretamente nos cartoes do horario.",
            "Usar o menu do ramo para abrir o historico especifico de Atividades.",
        ],
    },
    {
        "title": "4. Criar e editar atividades",
        "steps": [
            "Clicar em Criar Atividade.",
            "Escolher o dia da semana, a hora de inicio e a hora de fim.",
            "Preencher o nome da atividade e o professor.",
            "Guardar e confirmar que a atividade apareceu na linha horaria correta.",
            "Usar o olho para consultar, o lapis para editar e o caixote para eliminar.",
        ],
    },
    {
        "title": "5. Organizar atividades no mesmo horario",
        "bullets": [
            "Quando existirem varias atividades no mesmo espaco, arrastar o cartao inteiro para reorganizar.",
            "Durante o arrasto, a previa indica onde a atividade vai ficar ao largar.",
            "A ordem fica guardada neste browser para a semana selecionada.",
            "Evitar largar atividades noutra linha se a hora real nao corresponder.",
        ],
    },
    {
        "title": "6. Imprimir horario semanal",
        "bullets": [
            "Clicar em Imprimir semana para gerar uma folha em formato de horario escolar.",
            "A impressao mostra apenas a informacao essencial: datas, horas, atividade e professor.",
            "Botoes de consulta, edicao e eliminacao nao aparecem na folha impressa.",
            "Confirmar se o destino e Guardar como PDF ou impressora antes de finalizar.",
        ],
    },
]


DEV_COMMON = [
    {
        "title": "1. Visão geral da Central",
        "body": "A Central MenteMovimento junta os três ramos num único projeto publicado na Vercel e ligado a um único projeto Supabase. A autenticação é centralizada; os dados continuam separados por tabelas e contexto funcional.",
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
            "Alterar o código localmente.",
            "Executar npm run build na raiz.",
            "Testar as páginas afetadas.",
            "Copiar as alterações para a cópia ligada ao GitHub, se estiver a usar a pasta .publish.",
            "Fazer commit com mensagem clara.",
            "Fazer push para main.",
            "Verificar o deployment automático na Vercel.",
        ],
    },
]


SOCIOS_DEV = DEV_COMMON + [
    {
        "title": "4. Estrutura do ramo Sócios",
        "bullets": [
            "Código principal: portal/modules/socios/app.js.",
            "Interface base: portal/modules/socios/index.html.",
            "Estilos: portal/modules/socios/styles.css.",
            "Ligação Supabase: portal/modules/socios/central-socios-client.js.",
            "Manuais PDF: portal/modules/socios/docs/.",
            "Tabela principal: public.members.",
            "Utilizadores globais: public.app_users.",
        ],
    },
    {
        "title": "5. Dados e validação",
        "bullets": [
            "members guarda número de sócio, nome, NIF, contactos, localidade, quota anual, mês pago e data do pagamento.",
            "O número de sócio deve ser único.",
            "A importação faz validação antes de gravar; se houver erro, cancelar e corrigir o ficheiro.",
            "O estado das quotas é calculado no frontend com base no mês pago.",
            "Alterações relevantes devem ficar no histórico do ramo.",
        ],
    },
    {
        "title": "6. Manutenção",
        "bullets": [
            "Quando mudar campos de sócios, atualizar app.js, HTML, validação, importação/exportação e manual.",
            "Se adicionar colunas ao Supabase, criar SQL incremental e testar em projeto de teste.",
            "Não usar service_role no browser.",
            "Confirmar que CSV exportado continua a abrir corretamente no Excel/Google Sheets.",
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
            "Estatísticas são calculadas a partir dos registos carregados no estado da app.",
        ],
    },
    {
        "title": "6. Manutenção React",
        "bullets": [
            "Executar npm --prefix portal/modules/dispositivos run build depois de alterações.",
            "Evitar duplicar lógica de importação/exportação em componentes diferentes.",
            "Ao adicionar campos, atualizar estado inicial, formulário, tabela, CSV, estatísticas e manual.",
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
            "Data Protection and Responsibility Terms: authorisations and declarations.",
        ],
    },
    {
        "title": "4. Diagrams, attachments and statistics",
        "bullets": [
            "Genogram and ecomap nodes must keep names or identifiers visible.",
            "PDF attachments belong only to the selected client.",
            "Statistics show average permanence and percentage by municipality when data exists.",
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
        "title": "4. Estrutura do ramo Atividades",
        "bullets": [
            "Marcacao HTML: portal/modules/atividades/page.mjs.",
            "Logica de agenda, formulario, historico e impressao: portal/static/app.js.",
            "Estilos visuais globais e especificos da agenda: portal/static/styles.css.",
            "Geracao de paginas e copia de PDFs: scripts/prepare-vercel-output.mjs.",
            "Manuais PDF fonte: portal/modules/atividades/docs/.",
        ],
    },
    {
        "title": "5. Dados e armazenamento",
        "bullets": [
            "As atividades ficam em localStorage na chave central-activities-weekly-calendar-v1.",
            "O historico do ramo fica em localStorage e regista criacao, edicao, eliminacao e impressao.",
            "Cada atividade guarda semana, dia, hora de inicio, hora de fim, titulo, professor e ordem visual.",
            "Atividades ainda nao tem tabela Supabase propria; qualquer migracao deve preservar os dados locais existentes.",
        ],
    },
    {
        "title": "6. Permissoes e manutencao",
        "bullets": [
            "Ver controla o acesso ao horario e ao botao de consulta.",
            "Editar controla criacao, lapis, eliminacao e reordenacao.",
            "Exportar controla a impressao da semana.",
            "Ao alterar textos visiveis, atualizar traducoes, manuais e o output gerado.",
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
                "Não remover campos usados por importação, exportação, estatísticas ou histórico.",
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
                "Do not remove fields used by import, export, statistics or history.",
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


def main():
    build_pdf(
        OUTPUTS["socios_user"],
        "Manual do Utilizador - Gestão de Sócios",
        "Guia prático para utilizar a área de Sócios dentro da Central MenteMovimento.",
        "Administradores e operadores da associação",
        "Gestão de Sócios",
        SOCIOS_USER + user_extra_sections("Gestão de Sócios", "sócios"),
    )
    build_pdf(
        OUTPUTS["socios_dev"],
        "Manual do Programador - Gestão de Sócios",
        "Guia técnico para manutenção da área de Sócios no projeto central.",
        "Programadores e responsáveis técnicos",
        "Gestão de Sócios",
        SOCIOS_DEV
        + dev_extra_sections(
            "Gestão de Sócios",
            [
                "portal/modules/socios/index.html - estrutura da página e ligações dos manuais.",
                "portal/modules/socios/app.js - lógica de listagem, edição, quotas, importação e histórico.",
                "portal/modules/socios/styles.css - tema visual específico do ramo.",
                "portal/modules/socios/central-socios-client.js - cliente Supabase usado no browser.",
                "portal/modules/socios/docs/ - PDFs publicados no botão Manuais.",
            ],
            [
                "Tabela members guarda dados administrativos dos sócios.",
                "Tabela app_users é global e não deve ser duplicada por ramo.",
                "Histórico de alterações deve identificar ação, registo e utilizador.",
                "Importações devem validar tudo antes de gravar qualquer linha.",
                "Exports reais devem ficar fora do GitHub.",
            ],
        ),
    )
    build_pdf(
        OUTPUTS["utentes_user_pt"],
        "Manual do Utilizador - Gestão de Utentes",
        "Guia prático para utilizar fichas, separadores, pagamentos, anexos e estatísticas de Utentes.",
        "Administradores, técnicos e utilizadores autorizados",
        "Gestão de Utentes",
        UTENTES_USER_PT + user_extra_sections("Gestão de Utentes", "utentes", has_import_export=False),
        updated_at="01/07/2026",
    )
    build_pdf(
        OUTPUTS["utentes_dev_pt"],
        "Manual do Programador - Gestão de Utentes",
        "Guia técnico para manutenção da área de Utentes no projeto central.",
        "Programadores e responsáveis técnicos",
        "Gestão de Utentes",
        UTENTES_DEV_PT
        + dev_extra_sections(
            "Gestão de Utentes",
            [
                "portal/modules/utentes/app.py - backend, HTML gerado, rotas e persistência.",
                "api/utentes-app.py - entrada serverless usada pela Vercel.",
                "portal/modules/utentes/docs/ - manuais PT/EN descarregados pelo site.",
                "portal/modules/utentes/supabase_schema.sql - schema original do ramo.",
                "scripts/prepare-vercel-output.mjs - cópia do ramo para a pasta public.",
            ],
            [
                "Tabela utentes guarda a ficha base e estado ativo/inativo.",
                "Tabela utente_abas guarda o conteúdo dos separadores por utente.",
                "Tabela utente_anexos e bucket documentos-utentes guardam PDFs associados.",
                "Histórico deve registar alterações de fichas, anexos, estado e eliminações.",
                "SQLite só deve ser usado localmente; produção deve usar Supabase.",
            ],
        ),
    )
    build_pdf(
        OUTPUTS["utentes_user_en"],
        "User Manual - Client Management",
        "Practical guide for using client records, tabs, payments, attachments and statistics.",
        "Administrators, staff and authorised users",
        "Client Management",
        UTENTES_USER_EN + user_extra_sections_en("Client Management", "clients"),
        updated_at="01/07/2026",
    )
    build_pdf(
        OUTPUTS["utentes_dev_en"],
        "Developer Manual - Client Management",
        "Technical guide for maintaining the clients area in the central project.",
        "Developers and technical maintainers",
        "Client Management",
        UTENTES_DEV_EN + dev_extra_sections_en("Client Management"),
    )
    build_pdf(
        OUTPUTS["dispositivos_user"],
        "Manual do Utilizador - Cibersegurança",
        "Guia prático para gerir registos, CSV, relatórios, anexos e estatísticas.",
        "Administradores e operadores da associação",
        "Cibersegurança",
        DISPOSITIVOS_USER + user_extra_sections("Cibersegurança", "cibersegurança"),
    )
    build_pdf(
        OUTPUTS["dispositivos_dev"],
        "Manual do Programador - Cibersegurança",
        "Guia técnico para manutenção da área de Cibersegurança no projeto central.",
        "Programadores e responsáveis técnicos",
        "Cibersegurança",
        DISPOSITIVOS_DEV
        + dev_extra_sections(
            "Cibersegurança",
            [
                "portal/modules/dispositivos/src/App.tsx - componente principal, formulários, tabela e estatísticas da área de cibersegurança.",
                "portal/modules/dispositivos/src/App.css - estilos do ramo e adaptação ao tema.",
                "portal/modules/dispositivos/public/docs/ - PDFs descarregados no botão Manuais.",
                "portal/modules/dispositivos/supabase/schema.sql - tabelas e políticas do ramo.",
                "portal/modules/dispositivos/dist/ - resultado do build React/Vite.",
            ],
            [
                "Tabela devices guarda equipamentos, estado, hardware, diagnóstico e reparação.",
                "Tabela device_attachments guarda metadados dos anexos.",
                "Bucket device-attachments guarda documentos/fotos dos equipamentos.",
                "Tabela profiles pode existir por compatibilidade, mas a gestão global fica em app_users.",
                "CSV deve preservar números de série e identificadores para evitar duplicados.",
            ],
        ),
    )

    build_pdf(
        OUTPUTS["atividades_user"],
        "Manual do Utilizador - Gestao de Atividades",
        "Guia pratico para criar, consultar, organizar e imprimir o horario semanal de atividades.",
        "Administradores e utilizadores autorizados",
        "Gestao de Atividades",
        ATIVIDADES_USER + user_extra_sections("Gestao de Atividades", "atividades", has_import_export=False, has_attachments=False),
        updated_at="07/07/2026",
    )
    build_pdf(
        OUTPUTS["atividades_dev"],
        "Manual do Programador - Gestao de Atividades",
        "Guia tecnico para manutencao do modulo de atividades dentro da Central MenteMovimento.",
        "Programadores e responsaveis tecnicos",
        "Gestao de Atividades",
        ATIVIDADES_DEV
        + dev_extra_sections(
            "Gestao de Atividades",
            [
                "portal/modules/atividades/page.mjs - estrutura da pagina, historico e paginas de fallback dos manuais.",
                "portal/static/app.js - calendario semanal, ordenacao por arrasto, dialogos, historico e impressao.",
                "portal/static/styles.css - estilos do horario, dialogos e estados de permissao.",
                "portal/modules/atividades/docs/ - PDFs abertos pelo botao Manuais.",
                "scripts/prepare-vercel-output.mjs - publicacao da area em public/area/atividades/.",
            ],
            [
                "Sem tabela Supabase propria neste momento.",
                "localStorage guarda atividades e historico no browser.",
                "Permissoes usadas: view, edit e export.",
                "A impressao e gerada num iframe temporario para evitar separadores vazios.",
                "Se passar para base de dados, criar migracao e plano de importacao dos dados locais.",
            ],
        ),
        updated_at="07/07/2026",
    )


if __name__ == "__main__":
    main()
