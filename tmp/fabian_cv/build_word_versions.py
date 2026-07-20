from __future__ import annotations

import html
import shutil
import zipfile
from pathlib import Path


OUT = Path("/Users/uhorizon/Desktop")
WORK = Path("/Users/uhorizon/Documents/CrazyCatGranny/tmp/fabian_cv")
NAVY = "071638"
BLUE = "002F88"
GRAY = "F1F1F1"
INK = "080B14"


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def r(text: str = "", *, bold: bool = False, color: str | None = None, size: int | None = None) -> str:
    props = []
    if bold:
        props.append("<w:b/>")
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    if size:
        props.append(f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    preserve = ' xml:space="preserve"' if text.startswith(" ") or text.endswith(" ") else ""
    return f"<w:r>{rpr}<w:t{preserve}>{esc(text)}</w:t></w:r>"


def br() -> str:
    return "<w:r><w:br/></w:r>"


def p(
    runs: list[str] | str = "",
    *,
    style: str | None = None,
    size: int | None = None,
    color: str = INK,
    bold: bool = False,
    before: int = 0,
    after: int = 80,
    line: int = 240,
    num: bool = False,
    indent_left: int | None = None,
    hanging: int | None = None,
    align: str | None = None,
    border_bottom: bool = False,
) -> str:
    if isinstance(runs, str):
        runs = [r(runs, bold=bold, color=color, size=size)]
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    if num:
        ppr.append('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>')
    spacing = f'<w:spacing w:before="{before}" w:after="{after}" w:line="{line}" w:lineRule="auto"/>'
    ppr.append(spacing)
    if indent_left is not None:
        hanging_xml = f' w:hanging="{hanging}"' if hanging is not None else ""
        ppr.append(f'<w:ind w:left="{indent_left}"{hanging_xml}/>')
    if border_bottom:
        ppr.append('<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="071638"/></w:pBdr>')
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>"
    return f"<w:p>{ppr_xml}{''.join(runs)}</w:p>"


def image_run(rid: str, cx: int, cy: int) -> str:
    return f"""
<w:r>
  <w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="{cx}" cy="{cy}"/>
      <wp:docPr id="1" name="Fabian Portrait"/>
      <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic>
            <pic:nvPicPr><pic:cNvPr id="0" name="original_portrait.png"/><pic:cNvPicPr/></pic:nvPicPr>
            <pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
            <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing>
</w:r>
"""


def tc(content: str, width: int, *, fill: str | None = None, valign: str = "top", margins: tuple[int, int, int, int] = (80, 80, 100, 100)) -> str:
    top, bottom, start, end = margins
    fill_xml = f'<w:shd w:fill="{fill}"/>' if fill else ""
    return f"""
<w:tc>
  <w:tcPr>
    <w:tcW w:w="{width}" w:type="dxa"/>
    {fill_xml}
    <w:vAlign w:val="{valign}"/>
    <w:tcMar><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:start w:w="{start}" w:type="dxa"/><w:end w:w="{end}" w:type="dxa"/></w:tcMar>
  </w:tcPr>
  {content}
</w:tc>
"""


def tbl(cells: list[str], widths: list[int], *, borders: bool = False) -> str:
    border_val = "single" if borders else "nil"
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    border_xml = "".join(
        f'<w:{side} w:val="{border_val}" w:sz="4" w:space="0" w:color="FFFFFF"/>'
        for side in ["top", "left", "bottom", "right", "insideH", "insideV"]
    )
    return f"""
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="{sum(widths)}" w:type="dxa"/>
    <w:tblLayout w:type="fixed"/>
    <w:tblBorders>{border_xml}</w:tblBorders>
  </w:tblPr>
  <w:tblGrid>{grid}</w:tblGrid>
  <w:tr>{''.join(cells)}</w:tr>
</w:tbl>
"""


def package_docx(path: Path, document_xml: str, *, image: Path | None = None) -> None:
    rel_image = (
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/original_portrait.png"/>'
        if image
        else ""
    )
    content_image = '<Override PartName="/word/media/original_portrait.png" ContentType="image/png"/>' if image else ""
    content_types = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  {content_image}
</Types>"""
    package_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdOfficeDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""
    doc_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  {rel_image}
</Relationships>"""
    styles = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="{INK}"/></w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="{INK}"/></w:rPr><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="{NAVY}"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr><w:pPr><w:spacing w:after="120"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="{NAVY}"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:pPr><w:spacing w:before="140" w:after="80"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="{NAVY}"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:pPr><w:spacing w:before="80" w:after="50"/></w:pPr></w:style>
</w:styles>"""
    numbering = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="360"/></w:tabs><w:ind w:left="360" w:hanging="180"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:hint="default"/></w:rPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", package_rels)
        z.writestr("word/_rels/document.xml.rels", doc_rels)
        z.writestr("word/styles.xml", styles)
        z.writestr("word/numbering.xml", numbering)
        z.writestr("word/document.xml", document_xml)
        if image:
            z.write(image, "word/media/original_portrait.png")


def doc(body: str, sect_pr: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    {body}
    {sect_pr}
  </w:body>
</w:document>"""


def sect(a4: bool = True, margins: tuple[int, int, int, int] = (720, 720, 720, 720)) -> str:
    top, right, bottom, left = margins
    return f"""
<w:sectPr>
  <w:pgSz w:w="11906" w:h="16838"/>
  <w:pgMar w:top="{top}" w:right="{right}" w:bottom="{bottom}" w:left="{left}" w:header="709" w:footer="709" w:gutter="0"/>
</w:sectPr>"""


def heading(text: str, *, size: int = 20, before: int = 100, after: int = 50) -> str:
    return p(text.upper(), bold=True, color=NAVY, size=size, before=before, after=after, line=240, border_bottom=True)


def bullet(text: str, *, size: int = 14, after: int = 20) -> str:
    return p(text, size=size, after=after, line=220, num=True, indent_left=360, hanging=180)


def side_block(title: str, paras: list[str] | None = None, bullets: list[str] | None = None) -> str:
    out = [heading(title, size=18, before=110, after=55)]
    if paras:
        for para in paras:
            chunks = para.split("\n")
            runs: list[str] = []
            for i, chunk in enumerate(chunks):
                if i:
                    runs.append(br())
                runs.append(r(chunk, size=14))
            out.append(p(runs, size=14, after=50, line=225))
    if bullets:
        for item in bullets:
            out.append(bullet(item, size=14, after=16))
    return "".join(out)


def cv_docx() -> None:
    left = []
    left.append(p([image_run("rId1", 1936800, 2134800)], after=140, align="center"))
    left.append(side_block("Personal Details", ["21.02.1995, Bamberg, Germany\nGerman"]))
    left.append(side_block("Contact", ["Flößaustr. 67\n90763 Fürth, Germany\nfafoe95@icloud.com\n+49 170 1833918"]))
    left.append(heading("Skills", size=18, before=120, after=45))
    for title, items in [
        ("Customer Service", ["Customer communication", "Active listening", "Case documentation", "Complaint handling", "Issue escalation"]),
        ("IT Support", ["1st & 2nd Level Support", "Ticketing systems", "Remote support", "Troubleshooting"]),
        ("Microsoft", ["Microsoft 365", "Intune", "Azure fundamentals", "Windows Server 2022"]),
        ("Professional", ["Solution-oriented thinking", "Organization", "Teamwork", "Adaptability", "Time management"]),
    ]:
        left.append(p(title, bold=True, size=14, after=20, line=220))
        for item in items:
            left.append(bullet(item, size=13, after=8))
    left.append(side_block("Languages", ["German    Native\nEnglish    Professional working proficiency"]))
    left.append(side_block("Hobbies & Interests", bullets=["Music", "Guitar playing", "Sport", "Reading", "Animals"]))

    right = []
    right.append(p("FABIAN FÖRTSCH", style="Title", size=52, bold=True, color=NAVY, after=90, line=240, border_bottom=True))
    right.append(heading("Professional Profile", size=18, before=70, after=60))
    right.append(p("Customer-focused professional with experience in order processing, customs documentation, coordination and direct customer support. Recently completed comprehensive training in IT service management, technical support and Microsoft technologies, including CompTIA A+, ITIL 4 Foundation and Microsoft 365 Endpoint Administration. Known for a structured, solution-oriented approach, clear communication and the ability to remain calm and reliable when handling complex requests. Native German speaker with strong English communication skills and willingness to relocate to the Maastricht region.", size=14, after=85, line=220))
    right.append(heading("Work Experience", size=18, before=85, after=50))
    right.append(p([r("Feb 2022 - Oct 2022", size=14), br(), r("Customer Service & Customs Administration Specialist", bold=True, size=14), br(), r("Protoform Konrad Hofmann GmbH, Fürth", bold=True, color=BLUE, size=14)], after=25, line=220))
    for item in [
        "Managed customer requests, order processing, scheduling and export-related customs documentation with a high level of accuracy.",
        "Coordinated with customers, colleagues and external stakeholders to resolve operational issues and ensure timely processing.",
        "Documented cases and shipment information carefully, identified discrepancies and escalated complex matters to the responsible departments.",
        "Supported both customers and internal employees through clear communication and a reliable, solution-focused approach.",
    ]:
        right.append(bullet(item, size=13, after=8))
    right.append(heading("Education", size=18, before=90, after=50))
    education = [
        ("Sep 2018 - Jul 2021", "Office Management Assistant (Apprenticeship)", "Quast GmbH, Fürth", ["Supported order coordination, administrative processing, bookkeeping and customer communication.", "Maintained accurate records and worked independently across different commercial and organizational tasks."]),
        ("Oct 2013 - Jan 2014", "Wholesale and Foreign Trade Management (Apprenticeship)", "Metro Cash & Carry, Nuremberg", []),
        ("Jul 2012", "Secondary School Certificate (Mittlere Reife)", "Hans-Böckler-Realschule, Fürth", []),
    ]
    for date, role, org, items in education:
        right.append(p([r(date, size=14), br(), r(role, bold=True, size=14), br(), r(org, bold=True, color=BLUE, size=14)], after=20, line=220))
        for item in items:
            right.append(bullet(item, size=13, after=8))
    right.append(heading("Certifications", size=18, before=70, after=40))
    for item in [
        "Microsoft 365 Certified: Endpoint Administrator Associate - Microsoft, 2025",
        "Microsoft Certified: Azure Fundamentals (AZ-900) - Microsoft, 2025",
        "ITIL 4 Foundation Certificate in IT Service Management - PeopleCert, 2025",
        "CompTIA A+ ce Certification - CompTIA, 2025",
    ]:
        right.append(bullet(item, size=13, after=8))
    right.append(heading("Professional Training", size=18, before=70, after=45))
    right.append(p([r("Dec 2024 - Aug 2025", size=14), br(), r("Certified IT Administrator - 1st & 2nd Level Support", bold=True, size=14), br(), r("GFN GmbH, Remote", bold=True, color=BLUE, size=14)], after=20, line=220))
    for item in [
        "Completed intensive training in IT service desk operations, ticket handling, remote support and customer communication.",
        "Developed practical knowledge of Microsoft 365, Azure, Windows Server 2022, endpoint administration, networking, hardware and security.",
        "Trained in structured troubleshooting, SLA awareness, escalation processes and communication in difficult customer situations.",
        "Worked collaboratively in virtual classrooms using digital communication, file-management and teamwork tools.",
    ]:
        right.append(bullet(item, size=13, after=8))
    right.append(heading("Additional Training", size=18, before=70, after=40))
    for item in [
        "Microsoft Windows Server 2022 - GFN GmbH, 2025. PowerShell fundamentals, installation, storage, networking and identity management.",
        "IT Service Desk Specialist - GFN GmbH, 2025. Ticketing systems, remote support, Microsoft 365 support, SLA principles and conflict-sensitive customer communication.",
        "General Vocational Education - Kolping Berufsbildung, 2016-2017",
        "General Vocational Education - DAA Fürth, 2014",
    ]:
        right.append(bullet(item, size=12, after=5))
    right.append(heading("Internships", size=18, before=70, after=40))
    for date, role, org, desc in [
        ("Mar 2015 - Apr 2015", "Wholesale and Foreign Trade Intern", "Richter & Frenzel, Nuremberg", "Supported commercial administration, customer-related processes and daily organizational tasks."),
        ("Mar 2012 - Apr 2012", "Childcare Assistant Intern", "Kinderhort Südstadtstrolche, Fürth", "Assisted with daily activities and developed patience, responsibility and clear interpersonal communication."),
        ("Nov 2011 - Dec 2011", "Office Management Intern", "Winklbauer & Sohn GmbH, Nuremberg", "Supported office administration and organizational processes."),
        ("Jul 2010 - Aug 2010", "Intern", "Fürth Police Department", "Assisted during daily operations and gained insight into public service responsibilities."),
    ]:
        right.append(p([r(date, size=12), br(), r(role, bold=True, size=12), br(), r(org, bold=True, color=BLUE, size=12), r(f" - {desc}", size=12)], after=12, line=200))

    body = tbl(
        [
            tc("".join(left), 3000, fill=GRAY, margins=(80, 80, 120, 120)),
            tc("".join(right), 7900, margins=(80, 80, 180, 120)),
        ],
        [3000, 7900],
        borders=False,
    )
    package_docx(OUT / "Fabian_Foertsch_CV_high_quality.docx", doc(body, sect(margins=(350, 350, 350, 350))), image=WORK / "original_portrait.png")


def letter_docx() -> None:
    body = []
    body.append(p("FABIAN FÖRTSCH", style="Title", size=52, bold=True, color=NAVY, after=120, border_bottom=True))
    body.append(p("MOTIVATION LETTER", bold=True, color=NAVY, size=22, before=260, after=260))
    meta = tbl(
        [
            tc(
                p("Mercedes-Benz Customer Assistance Center Maastricht", bold=True, color=NAVY, size=18, after=10)
                + p("Application for Senior Customer Service Representative CAT DACH", size=18, after=10)
                + p("Customer Advocacy | Deutsch", size=18, after=20),
                6500,
                margins=(0, 0, 0, 0),
            ),
            tc(p("July 20, 2026", bold=True, color=NAVY, size=18, after=20, align="right"), 2860, margins=(0, 0, 0, 0)),
        ],
        [6500, 2860],
        borders=False,
    )
    body.append(meta)
    body.append(p("Dear Hiring Team,", bold=True, color=NAVY, size=20, before=360, after=230))
    paragraphs = [
        "I am applying for the Senior Customer Service Representative CAT DACH position in Customer Advocacy because the role matches the way I like to work: speaking with customers directly, listening carefully, and helping to find a reliable way forward.",
        "During my work in customer service and customs administration, I learned how important it is to stay calm when a situation is unclear, document details accurately, and follow through until a request is handled properly. I enjoy this kind of work because it combines patience, responsibility, and clear communication.",
        "My recent IT service training has strengthened that foundation. ITIL 4 improved the way I think about service processes, responsibilities, and escalation when a topic needs extra attention. My CompTIA A+, Microsoft 365, and Azure Fundamentals certifications also give me more confidence when customer questions have a technical side. For me, this background is useful because it helps me ask better questions, explain things clearly, and work well with specialist teams.",
        "I would like to contribute from the beginning while continuing to grow with the team. I am motivated, reliable, eager to learn, and ready to take responsibility. As a native German speaker with professional English, I would be happy to support the CAT DACH team and keep improving through feedback and experience.",
        "Maastricht is also part of my motivation. I already know and like the city, and I can genuinely imagine building my future there. I have also heard positive things about the CAC's international community and supportive working atmosphere, which makes the opportunity even more interesting to me.",
        "I would be happy to discuss my motivation in an interview and learn more about how I could support the team.",
        "Kind regards,",
    ]
    for para in paragraphs:
        body.append(p(para, size=20, after=170, line=300))
    body.append(p("Fabian Förtsch", bold=True, color=NAVY, size=20, before=80, after=80))
    package_docx(OUT / "motivation letter fabi.docx", doc("".join(body), sect(margins=(1020, 1260, 1020, 1260))))


if __name__ == "__main__":
    cv_docx()
    letter_docx()
