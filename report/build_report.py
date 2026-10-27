"""Builds the 3rd IA project report (report/DBMS_Project_Report.docx).
Run after report/run_validation.py so that results.json holds real test output."""
import json, os
from docx import Document
from docx.document import Document as _Doc
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Inches, RGBColor, Cm

HERE = os.path.dirname(os.path.abspath(__file__))
FIG = os.path.join(HERE, "figures")
R = json.load(open(os.path.join(HERE, "results.json")))

# ---- details that only the student can fill in ----
STUDENT = "ASWIN SAMUEL A"
REGNO = "URK24CS9014"
FACULTY = "Mrs. M. Denisha"
TITLE = "DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM"

doc = Document()
FONT = "Times New Roman"
_orig_add_paragraph = _Doc.add_paragraph


def _add_paragraph(self, *a, **k):
    # paragraphs following a table get breathing room without an empty spacer line
    para_ = _orig_add_paragraph(self, *a, **k)
    if after_table["flag"]:
        para_.paragraph_format.space_before = Pt(10); after_table["flag"] = False
    return para_


_Doc.add_paragraph = _add_paragraph


# ------------------------------------------------------------------ styles
def set_font(style, size, bold=False):
    style.font.name = FONT; style.font.size = Pt(size); style.font.bold = bold
    style.font.color.rgb = RGBColor(0, 0, 0)
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts"); rpr.append(rfonts)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(a), FONT)
    for a in ("w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme"):
        if rfonts.get(qn(a)) is not None:
            del rfonts.attrib[qn(a)]


normal = doc.styles["Normal"]
set_font(normal, 12)
normal.paragraph_format.line_spacing = 1.5
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
for name, size in (("Heading 1", 16), ("Heading 2", 14), ("Heading 3", 12)):
    st = doc.styles[name]; set_font(st, size, True)
    st.paragraph_format.space_before = Pt(12 if name != "Heading 1" else 0)
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.line_spacing = 1.5
    st.paragraph_format.keep_with_next = True
doc.styles["Heading 1"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.styles["Heading 2"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
doc.styles["Heading 3"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
cap = doc.styles["Caption"]; set_font(cap, 11, True); cap.font.italic = False
cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
cap.paragraph_format.line_spacing = 1.5
cap.paragraph_format.space_after = Pt(8)
for lst in ("List Bullet", "List Number"):
    set_font(doc.styles[lst], 12)
    doc.styles[lst].paragraph_format.line_spacing = 1.5
    doc.styles[lst].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    doc.styles[lst].paragraph_format.space_after = Pt(3)


for toc_name in ("TOC 1", "TOC 2"):
    try:
        ts = doc.styles[toc_name]
    except KeyError:
        from docx.enum.style import WD_STYLE_TYPE
        ts = doc.styles.add_style(toc_name, WD_STYLE_TYPE.PARAGRAPH); ts.base_style = normal
    set_font(ts, 12); ts.paragraph_format.line_spacing = 1.5
    ts.paragraph_format.space_after = Pt(0); ts.paragraph_format.space_before = Pt(0)
    ts.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT


def setup_section(sec):
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)  # A4
    for m in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, m, Inches(1))


setup_section(doc.sections[0])


# ------------------------------------------------------------------ helpers
def field(paragraph, instr):
    run = paragraph.add_run()
    for tag, text in (("begin", None), (None, instr), ("separate", None), ("end", None)):
        if tag:
            el = OxmlElement("w:fldChar"); el.set(qn("w:fldCharType"), tag); run._r.append(el)
        else:
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = text; run._r.append(it)
    return run


def page_numbers(sec, fmt="decimal", start=1):
    sec.footer.is_linked_to_previous = False
    p = sec.footer.paragraphs[0]; p.text = ""
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    field(p, "PAGE").font.name = FONT
    pg = sec._sectPr.find(qn("w:pgNumType"))
    if pg is None:
        pg = OxmlElement("w:pgNumType"); sec._sectPr.append(pg)
    pg.set(qn("w:fmt"), fmt); pg.set(qn("w:start"), str(start))


def centered(text, size=12, bold=False, space_after=6, italic=False):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(text); r.font.size = Pt(size); r.bold = bold; r.italic = italic
    return p


def para(text):
    """Paragraph with **bold** spans."""
    p = doc.add_paragraph()
    parts = text.split("**")
    for i, part in enumerate(parts):
        if part:
            p.add_run(part).bold = bool(i % 2)
    return p


def bullets(items, style="List Bullet"):
    for n, it in enumerate(items, 1):
        if style == "List Number":
            p = doc.add_paragraph(); p.paragraph_format.left_indent = Inches(0.35)
            p.paragraph_format.first_line_indent = Inches(-0.25); p.paragraph_format.space_after = Pt(3)
            p.add_run(f"{n}.  ")
        else:
            p = doc.add_paragraph(style=style)
        parts = it.split("**")
        for i, part in enumerate(parts):
            if part:
                p.add_run(part).bold = bool(i % 2)


def page_break():
    body = doc.element.body
    last = [el for el in body if el.tag != qn("w:sectPr")][-1]
    if last.tag == qn("w:p"):
        doc.paragraphs[-1].add_run().add_break(WD_BREAK.PAGE)
    else:
        q = doc.add_paragraph(); q.paragraph_format.line_spacing = 1.0
        q.add_run().add_break(WD_BREAK.PAGE)


after_table = {"flag": False}
fig_no = {"n": 0}
tab_no = {"n": 0}
chapter = {"n": 0}


def figure(path, caption, width=6.0):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True; p.paragraph_format.line_spacing = 1.0
    p.add_run().add_picture(path, width=Inches(width))
    fig_no["n"] += 1
    doc.add_paragraph(f"Fig. {chapter['n']}.{fig_no['n']}: {caption}", style="Caption")


def shade(cell, color):
    tcpr = cell._tc.get_or_add_tcPr()
    s = OxmlElement("w:shd"); s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), color)
    tcpr.append(s)


def table(caption, header, rows, widths=None, size=10.5):
    tab_no["n"] += 1
    c = doc.add_paragraph(f"Table {chapter['n']}.{tab_no['n']}: {caption}", style="Caption")
    c.paragraph_format.keep_with_next = True; c.paragraph_format.space_after = Pt(4)
    t = doc.add_table(rows=1, cols=len(header)); t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
    for i, h in enumerate(header):
        cell = t.rows[0].cells[i]; cell.text = ""; shade(cell, "D9E2F3")
        r = cell.paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(size)
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ""
            r = cells[i].paragraphs[0].add_run(str(v)); r.font.size = Pt(size)
    for row in t.rows:
        for i, cell in enumerate(row.cells):
            for p in cell.paragraphs:
                p.paragraph_format.line_spacing = 1.5; p.paragraph_format.space_after = Pt(0)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            if widths:
                cell.width = Inches(widths[i])
    last = len(t.rows) - 1
    for ri, row in enumerate(t.rows):
        trpr = row._tr.get_or_add_trPr()
        trpr.append(OxmlElement("w:cantSplit"))
        if ri == 0:
            trpr.append(OxmlElement("w:tblHeader"))
        if len(t.rows) <= 7 and ri < last:
            for cell in row.cells:
                for q in cell.paragraphs:
                    q.paragraph_format.keep_with_next = True
    after_table["flag"] = True
    return t


def code(text):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing = 1.5; p.paragraph_format.left_indent = Inches(0.3)
    p.paragraph_format.space_after = Pt(8)
    ppr = p._p.get_or_add_pPr(); s = OxmlElement("w:shd")
    s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), "F2F2F2"); ppr.append(s)
    r = p.add_run(text); r.font.name = "Courier New"; r.font.size = Pt(9.5)
    r._r.get_or_add_rPr().find(qn("w:rFonts")).set(qn("w:hAnsi"), "Courier New")


def new_chapter(num, title):
    if title in ("REFERENCES", "EVALUATION SHEET"):
        page_break()
    chapter["n"] = num; fig_no["n"] = 0; tab_no["n"] = 0
    if num:
        h = doc.add_heading(f"CHAPTER {num}\n{title}", level=1)
    else:
        h = doc.add_heading(title, level=1)
    if title not in ("REFERENCES", "EVALUATION SHEET"):
        h.paragraph_format.space_before = Pt(24)


# =================================================================== COVER (faculty template)
def logo(name, width):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    p.add_run().add_picture(os.path.join(FIG, name), width=Inches(width))


logo("karunya_banner.png", 4.6)
centered("SCHOOL OF COMPUTER SCIENCE AND TECHNOLOGY", 12, True, 30)
centered("DIVISION OF COMPUTER SCIENCE AND ENGINEERING", 12, True, 30)
centered("A PROJECT BASED EVALUATION REPORT", 14, True, 70)
centered("SUBMITTED BY", 12, True, 2)
centered(f"{STUDENT} ({REGNO})", 12, True, 70)
centered("COURSE CODE", 12, True, 2)
centered("23CS2013", 12, True, 70)
centered("COURSE NAME", 12, True, 2)
centered("DATABASE MANAGEMENT SYSTEMS", 12, True, 80)
centered("OCTOBER 2026", 12, True)

# =================================================================== CERTIFICATE
page_break()
centered("ONLINE CERTIFICATE", 14, True, 12)
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.line_spacing = 1.0
p.add_run().add_picture(os.path.join(FIG, "ecertificate.png"), width=Inches(5.4))
doc.add_paragraph("Certificate: Oracle AI Database Certified Foundations Associate (ID 102443128OCI26DCFA)",
                  style="Caption")
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.line_spacing = 1.0
p.add_run().add_picture(os.path.join(FIG, "oracle_score.png"), width=Inches(3.7))
doc.add_paragraph("Score report: Oracle AI Database Foundations Associate (1Z0-1195-26) — Passed, 100%",
                  style="Caption")

# =================================================================== TITLE PAGE
page_break()
logo("karunya_banner.png", 4.6)
centered(TITLE, 18, True, 60)
t = centered("A REAL TIME PROJECT REPORT", 12, True, 50); t.runs[0].italic = True
t = centered("Submitted by", 12, True, 4); t.runs[0].italic = True
centered(f"{STUDENT} ({REGNO})", 16, True, 60)
logo("karunya_emblem.png", 1.8)
p = doc.paragraphs[-1]; p.paragraph_format.space_after = Pt(60)
centered("DIVISION OF COMPUTER SCIENCE AND ENGINEERING", 12, True, 24)
centered("OCTOBER 2026", 12, True)

# =================================================================== FRONT MATTER (roman)
front = doc.add_section(WD_SECTION.NEW_PAGE); setup_section(front)
page_numbers(front, "lowerRoman", 1)
doc.add_heading("ABSTRACT", level=1)
c = R["counts"]
para("University libraries still run circulation on registers or on catalogue tools that cannot tell a "
     "student whether a physical copy is actually on the shelf, how long a reservation queue is, or which "
     "book to read next. This project designs and implements a **Digital Library Book Reservation and "
     "Recommendation System** in which a relational database is the single source of truth for books, "
     "physical copies, loans, reservations and reviews.")
para(f"The database was modelled with an ER diagram, mapped to ten relations and normalised to BCNF. It was "
     f"implemented in PostgreSQL {R['server_version'].split()[0]} with primary, foreign, unique, check and "
     f"partial-unique constraints, {R['object_counts']['views']} views, {R['object_counts']['functions']} stored "
     f"functions, {R['object_counts']['procedures']} transactional procedures, {R['object_counts']['triggers']} "
     f"triggers and {R['object_counts']['indexes']} indexes, and loaded with {c['books']} titles, "
     f"{c['book_copies']} physical copies and {c['users']} users. A Flask service connects to the database "
     "through a pooled, parameterised driver and serves a browser interface for searching, inspecting "
     "copies, borrowing and viewing queues. A deterministic scoring query produces explainable "
     "recommendations.")
passed = sum(t["status"] == "PASS" for t in R["tests"])
para(f"Validation ran {len(R['tests'])} automated test cases against the live database, covering valid "
     f"operations, constraint violations, rollback and a two-session concurrent checkout; {passed} passed. "
     "Index experiments on a 200,000-row table reduced lookup time by two to three orders of magnitude. "
     "Key features: real-time availability, FIFO reservation queues, row-locked checkout, automatic fines, "
     "and recommendation reasons.")
para("**Keywords:** relational database, PostgreSQL, normalisation, stored procedures, concurrency control, "
     "indexing, library management, recommendation.")

page_break()
centered("TABLE OF CONTENTS", 16, True, 12)
toc = doc.add_paragraph(); field(toc, 'TOC \\o "1-2" \\h \\z \\u')

# =================================================================== MAIN (arabic)
main = doc.add_section(WD_SECTION.NEW_PAGE); setup_section(main)
page_numbers(main, "decimal", 1)
chapter["n"] = 1
doc.add_heading("CHAPTER 1\nINTRODUCTION", level=1)
doc.add_heading("1.1 Background", level=2)
para("A college library holds several physical copies of popular textbooks, and demand for them peaks "
     "just before examinations. Students need to know whether a copy is free before walking to the "
     "library, librarians need an accurate record of who holds each copy, and the institution needs "
     "reports on overdue items and fines. All of these questions are about shared, frequently updated "
     "data, which is exactly the problem a DBMS solves [1], [2].")
doc.add_heading("1.2 Problem Statement and Motivation", level=2)
para("Manual registers and spreadsheet catalogues allow two staff members to issue the same copy, do not "
     "keep reservation order fairly, and calculate fines by hand. Generic catalogue search shows a title "
     "but not the state of each copy, and gives no guidance on what to read next. The problem addressed "
     "here is therefore: **design a consistent, concurrent-safe database for library circulation and expose "
     "it through an application that supports search, reservation, borrowing, review and recommendation.**")
para("The primary users are students and faculty (search, reserve, borrow, review), librarians (catalogue "
     "and circulation) and administrators (roles and reports).")
doc.add_heading("1.3 Objectives", level=2)
bullets(["Model the library domain with an ER diagram and derive a BCNF relational schema.",
         "Enforce business rules (one active loan per copy, one active reservation per user and title, "
         "ratings 1–5) inside the database through constraints.",
         "Implement circulation as ACID transactions with row-level locking so concurrent checkouts are safe.",
         "Provide views, functions, procedures and triggers that the application can reuse.",
         "Measure the effect of B-Tree, hash and composite indexes using EXPLAIN ANALYZE.",
         "Connect a web application to the database and generate explainable book recommendations."],
        "List Number")
doc.add_heading("1.4 Literature Review", level=2)
para("Codd's relational model [4] separates the logical view of data from its storage and underpins every "
     "table in this system. Chen's entity–relationship model [5] provides the notation used to capture "
     "entities such as Book, Copy and Loan and the cardinality between them. Standard texts [1], [2] "
     "describe how functional dependencies guide decomposition to 3NF and BCNF, and how two-phase locking "
     "and strict schedules give serialisable transactions; Gray and Reuter [6] explain why atomic commit "
     "and rollback are essential for operations such as issuing a copy. PostgreSQL implements these ideas "
     "with MVCC, explicit row locks and several index access methods [3].")
para("For recommendation, item-to-item approaches such as Amazon's [7] rank items related to what a user "
     "already consumed. A full collaborative filter needs large interaction data, so this project uses a "
     "transparent rule-based score over the same signals (shared category, shared author, rating, "
     "popularity) that can be computed in SQL. Brewer's CAP discussion [8] motivates keeping authoritative "
     "circulation data in a consistent relational store while loose activity logs live in a document store.")
doc.add_heading("1.5 Existing System", level=2)
para("Open-source integrated library systems such as Koha [9] provide cataloguing and circulation but are "
     "heavy to deploy for a single department and do not show the database design to the learner. Many "
     "college libraries instead use a register or spreadsheet. Table 1.1 summarises the gaps.")
table("Comparison of the existing approach and the proposed system", ["Aspect", "Existing (register / basic OPAC)", "Proposed system"], [
    ["Copy availability", "Title-level only, often stale", "Per-copy status from book_copies, live"],
    ["Double issue", "Possible when two staff act together", "Blocked by row lock + partial unique index"],
    ["Reservations", "Informal list, order disputed", "FIFO queue_position assigned by trigger"],
    ["Fines", "Calculated manually", "fn_calculate_overdue_fines() on return"],
    ["Recommendations", "None", "Scored list with a reason string"],
    ["Reports", "Manual counting", "SQL views for overdue loans, queues, inventory"],
], widths=[1.4, 2.4, 2.5])
doc.add_heading("1.6 DBMS Concepts Used", level=2)
table("Course outcomes and where each is applied", ["CO", "Concept", "Where it appears in this project"], [
    ["CO1", "DBMS architecture, roles", "Three-tier design; admin / librarian / student roles"],
    ["CO2", "SQL: DDL, DML, joins, subqueries, aggregates", "schema.sql, 22 queries in queries.sql, views"],
    ["CO3", "ER model, FDs, normalisation", "10-entity ER model, 1NF→BCNF analysis"],
    ["CO4", "File structures, indexing", "B-Tree, hash, composite, partial indexes; EXPLAIN ANALYZE"],
    ["CO5", "Transactions, concurrency", "sp_checkout_book with SELECT … FOR UPDATE; rollback tests"],
    ["CO6", "NoSQL", "MongoDB activity-event documents as recommendation signals"],
], widths=[0.6, 2.2, 3.5])

# ------------------------------------------------------------------ CH3
new_chapter(2, "SYSTEM DESIGN")
doc.add_heading("2.1 Architecture and High-Level Design", level=2)
para("The system follows a three-tier architecture (Fig. 2.1). The browser tier renders the catalogue and "
     "circulation screens; the Flask tier validates requests and calls the database only through "
     "parameterised statements; PostgreSQL stores every authoritative fact and enforces the rules. MongoDB "
     "is optional and holds activity events, so the library still works if it is unavailable.")
figure(os.path.join(FIG, "fig_architecture.png"), "Three-tier architecture of the system", 3.6)
doc.add_heading("2.2 Methodology", level=2)
bullets(["**Requirements:** identified users, functional requirements and business rules (borrow period "
         "14 days, maximum 3 reservations, fine ₹1 per day, 48-hour pickup window).",
         "**Conceptual design:** drew the ER model and resolved the many-to-many Book–Author relationship.",
         "**Logical design:** mapped entities to relations, listed functional dependencies and checked BCNF.",
         "**Physical design:** wrote DDL with constraints, then added indexes after studying query patterns.",
         "**Programmability:** implemented views, functions, procedures and triggers for repeated logic.",
         "**Application:** connected Flask through a psycopg2 connection pool and built the web interface.",
         "**Validation:** scripted positive, negative, rollback, concurrency and index tests (Chapter 4)."],
        "List Number")
doc.add_heading("2.3 ER Model", level=2)
para("A key design decision is to separate the **title** (BOOKS) from the **physical item** (BOOK_COPIES). "
     "A reservation targets a title, because any copy will do, while a loan targets a specific copy with a "
     "barcode. Fig. 2.2 shows the ten entities and their cardinalities.")
figure(os.path.join(FIG, "fig_er.png"), "ER diagram (1 : N relationships; BOOK_AUTHORS resolves M : N)", 5.2)
doc.add_heading("2.4 Relational Schema and Normalisation", level=2)
table("Relations, keys and main constraints", ["Relation", "Primary key", "Other keys / constraints"], [
    ["users", "user_id", "email UNIQUE; role CHECK in 4 values"],
    ["publishers / categories", "publisher_id / category_id", "name UNIQUE"],
    ["authors", "author_id", "—"],
    ["books", "book_id", "isbn UNIQUE; FK category, publisher; year CHECK"],
    ["book_authors", "(book_id, author_id)", "FKs with ON DELETE CASCADE; author_order ≥ 1"],
    ["book_copies", "copy_id", "barcode UNIQUE; status CHECK in 5 values"],
    ["reservations", "reservation_id", "partial UNIQUE(user_id, book_id) WHERE active"],
    ["loans", "loan_id", "partial UNIQUE(copy_id) WHERE active; due ≥ checkout; fine ≥ 0"],
    ["reviews", "review_id", "UNIQUE(user_id, book_id); rating CHECK 1–5"],
], widths=[1.5, 1.6, 3.2])
para("Every attribute is atomic (1NF); all multi-author data moved to book_authors. Each non-composite key "
     "table has no partial dependency (2NF). Transitive dependencies such as isbn → category_id → "
     "category_name were removed by keeping category and publisher details in their own tables (3NF). In "
     "every relation, the determinant of each non-trivial FD is a candidate key — for example, in users "
     "both user_id and email determine all attributes — so the schema is in **BCNF**. Derived values such "
     "as average rating and available-copy count are computed by views, not stored, which avoids update "
     "anomalies.")

doc.add_heading("2.5 Working Flow of the System", level=2)
para("A student searches the catalogue, opens a title and sees the status of every copy. If a copy is "
     "AVAILABLE the student borrows it; otherwise the student joins the reservation queue for the title. "
     "When a copy is returned, the first WAITING reservation becomes READY and the copy is held for 48 hours. "
     "Every borrow and return runs as a single database transaction.")
para("Fig. 2.3 shows the logic of sp_checkout_book. Eligibility is checked with fn_can_user_borrow "
     "(account active, no overdue loan, unpaid fines below ₹10). The copy row is then locked with SELECT … "
     "FOR UPDATE; a concurrent caller waits until the first transaction commits and then sees the new "
     "LOANED status. Any RAISE EXCEPTION aborts the whole transaction.")
figure(os.path.join(FIG, "fig_checkout_flow.png"), "Transaction flow of sp_checkout_book", 2.9)

# ------------------------------------------------------------------ CH4
new_chapter(3, "IMPLEMENTATION AND SCREEN SHOT")
doc.add_heading("3.1 Database Implementation", level=2)
oc = R["object_counts"]
table("Database objects implemented", ["Object type", "Count", "Examples"], [
    ["Tables", "10", "users, books, book_copies, loans, reservations, reviews …"],
    ["Views", oc["views"], "v_book_catalog, v_book_inventory, v_overdue_loans, v_reservation_queues"],
    ["Functions", oc["functions"], "fn_calculate_overdue_fines, fn_get_available_copy_count, fn_can_user_borrow"],
    ["Procedures", oc["procedures"], "sp_checkout_book, sp_return_book"],
    ["Triggers", oc["triggers"], "auto queue position, sync copy status on loan, review timestamp"],
    ["Indexes", oc["indexes"], "B-Tree, composite, partial (active loans), hash (barcode)"],
    ["SQL queries", "22", "joins, GROUP BY/HAVING, correlated subqueries, set operations, DENSE_RANK"],
], widths=[1.3, 0.7, 4.3])
para("The most important rule — a copy can never be on two active loans — is enforced twice. The "
     "procedure locks the copy row before checking its status, and the storage engine rejects any second "
     "active loan through a partial unique index:")
code("CREATE UNIQUE INDEX uq_single_active_loan_per_copy\n"
     "    ON loans (copy_id) WHERE status IN ('ACTIVE', 'OVERDUE');")
para("The transaction flow of sp_checkout_book is described in Section 2.5 (Fig. 2.3).")
para("sp_return_book closes the loan, computes the fine and, if a WAITING reservation exists, moves the "
     "head of the queue to READY with a 48-hour expiry and marks the copy RESERVED; otherwise the copy "
     "returns to AVAILABLE. A BEFORE INSERT trigger on reservations assigns the next FIFO queue_position. "
     "Representative queries include a correlated NOT EXISTS for never-borrowed books, INTERSECT for "
     "titles with both active loans and reservations, and DENSE_RANK() to rank popularity within a category.")
doc.add_heading("3.2 Recommendation Logic", level=2)
para("For a given user the recommendation query scores every book the user has not borrowed: +5 if it is "
     "in a category the user borrowed from, +3 if it shares an author, +2 if its average rating is at "
     "least 4.0 and +2 if it is among the most borrowed. The top five are returned with a reason such as "
     "“Recommended because you borrowed books in Database Systems.” New users receive the highest-rated titles.")
doc.add_heading("3.3 Application and Database Connectivity", level=2)
para("The Flask backend (backend/app.py) reads credentials from an environment file and opens a "
     "ThreadedConnectionPool. A context manager commits on success and rolls back on any exception, so "
     "each request is one transaction. All SQL uses placeholders (%s) to prevent SQL injection. The "
     "/api/books endpoint queries v_book_catalog with optional search and category filters, and "
     "/api/books/<id>/inventory returns the copies of a title. The frontend calls /api/books first and "
     "falls back to an exported JSON catalogue when the server is not running. Fig. 3.1 shows the catalogue screen.")
figure(os.path.join(FIG, "ui_home.png"), "Catalogue screen with category filter and availability badges", 5.3)

# ------------------------------------------------------------------ CH5
new_chapter(4, "TESTING AND VALIDATION")
doc.add_heading("4.1 Testing Approach", level=2)
para("Testing was automated in report/run_validation.py. The script drops and recreates the database, "
     "loads all SQL files in dependency order, and runs each test case in its own transaction that is "
     "rolled back afterwards, so tests do not affect each other. Negative tests pass only when PostgreSQL "
     "raises the expected error.")
load_ok = all(x["ok"] for x in R["load"])
para(f"All {len(R['load'])} SQL files loaded {'without error' if load_ok else 'with errors (see Table 4.1)'}. "
     f"Row counts after loading: {c['users']} users, {c['books']} books, {c['authors']} authors, "
     f"{c['book_copies']} copies, {c['loans']} loans, {c['reservations']} reservations and {c['reviews']} reviews.")
rows = []
for i, t in enumerate(R["tests"], 1):
    got = t.get("detail") or t.get("error", "")
    rows.append([i, t["name"], t["expected"], got[:110], t["status"]])
table("Test cases and observed results", ["#", "Test case", "Expected", "Observed", "Result"], rows,
      widths=[0.3, 1.9, 0.8, 2.7, 0.6], size=9.5)
doc.add_heading("4.2 Concurrency Validation", level=2)
para("Two independent connections attempted to check out the same copy. Session A called the procedure "
     "and held its row lock without committing; session B blocked on the same row. After A committed, B's "
     "retry was rejected because the copy was already LOANED. Exactly one active loan existed at the end, "
     "which demonstrates that the FOR UPDATE lock serialises conflicting checkouts.")
doc.add_heading("4.3 Index Performance", level=2)
para("To make index effects measurable, a 200,000-row copy of the book_copies structure was generated. "
     "Each query was run five times before and after creating the index and the best execution time was "
     "kept (Table 4.2, Fig. 4.1).")
erows = []
for e in R["explain"]:
    sp = e["before_ms"] / e["after_ms"] if e["after_ms"] else 0
    before_plan = "Parallel Seq Scan" if e["before_plan"] == "Gather" else e["before_plan"]
    erows.append([e["query"], e["index"], f"{before_plan} / {e['before_ms']}",
                  f"{e['after_plan']} / {e['after_ms']}", f"{sp:,.0f}×"])
table("EXPLAIN ANALYZE before and after indexing (200,000 rows)",
      ["Query", "Index", "Before: plan / ms", "After: plan / ms", "Speed-up"], erows,
      widths=[1.6, 0.9, 1.5, 1.6, 0.7], size=9.5)
figure(os.path.join(FIG, "fig_index.png"), "Execution time before and after indexing (log scale)", 4.6)
doc.add_heading("4.4 Validation Against Requirements", level=2)
table("Requirement coverage", ["Requirement", "Evidence", "Status"], [
    ["Search and filter catalogue", "v_book_catalog, /api/books, UI filter", "Met"],
    ["Show per-copy availability", "v_book_inventory, /api/books/<id>/inventory", "Met"],
    ["Prevent double checkout", "Tests 2 and concurrency test", "Met"],
    ["Fair reservation queue", "FIFO trigger test", "Met"],
    ["Automatic fines", "Overdue fine test", "Met"],
    ["Data integrity rules", "CHECK / UNIQUE / FK negative tests", "Met"],
    ["Full REST API + login", "Only catalogue endpoints exist so far", "In progress"],
    ["MongoDB activity log", "Design ready; integration pending", "In progress"],
], widths=[2.0, 3.1, 1.1])

# ------------------------------------------------------------------ CH6
new_chapter(5, "RESULTS AND DISCUSSION")
doc.add_heading("5.1 Presentation of the Final System", level=2)
para(f"The delivered database loads cleanly and holds {c['books']} titles across {c['categories']} categories "
     f"with {c['book_copies']} barcoded copies. Circulation, reservation and fine logic run entirely inside "
     "PostgreSQL, so every client — the web interface, psql or pgAdmin — sees the same rules. Table 5.1 "
     "shows sample output of the inventory view.")
inv = R["queries"]["inventory_top"]
table("Sample output of v_book_inventory", ["Title", "Total", "Available", "Loaned"],
      [[r[0], r[1], r[2], r[3]] for r in inv], widths=[3.6, 0.8, 0.9, 0.8])
doc.add_heading("5.2 Evaluation Against Objectives", level=2)
para("Objectives 1 to 5 are fully met: the schema is in BCNF, constraints reject every invalid input "
     "tested, the checkout procedure is concurrency-safe and indexes give large measured gains. Objective "
     "6 is partly met: the database connection and catalogue endpoints work, while authentication, "
     "circulation endpoints and the MongoDB event log are still being integrated.")
doc.add_heading("5.3 Challenges Faced", level=2)
cons = R["consistency"]
items = ["**Title versus copy:** reserving a title but loaning a copy required two separate status "
         "machines and careful hand-off in sp_return_book."]
if cons.get("catalog_rows_with_duplicate_authors"):
    items.append("**Join fan-out:** v_book_catalog joins authors and reviews in one GROUP BY, so a title with "
                 "three reviews lists each author three times. The exported catalogue file used by the UI also "
                 "joined copies, which repeats names further and inflates copy counts (visible in Fig. 3.1). "
                 "The fix is to aggregate authors, reviews and copies in separate sub-queries before joining.")
if cons.get("dept_view_mismatches"):
    m = next(iter(cons["dept_view_mismatches"].items()))
    items.append(f"**Aggregate inflation:** v_department_circulation_stats joins loans and reviews to users at "
                 f"the same time, so it reports {m[1]['view']} checkouts for {m[0]} where the loans table holds "
                 f"{m[1]['actual']}; pre-aggregating each table fixes it.")
if cons.get("loaned_copies_without_loan"):
    items.append(f"**Seed consistency:** {cons['loaned_copies_without_loan']} copies are marked LOANED in the "
                 "seed data without a matching loan row; the extended seed should insert loans instead of "
                 "setting the status directly.")
items.append("**Queue position under concurrency:** the trigger uses MAX(queue_position)+1, which two "
             "simultaneous inserts could duplicate; a per-book advisory lock or a unique index would close this.")
bullets(items)

# ------------------------------------------------------------------ CONCLUSION
new_chapter(0, "CONCLUSION")
para("This project built a library reservation and recommendation system on a carefully designed relational "
     "database. The ER model and BCNF schema separate titles from physical copies, and the core rules are "
     "enforced by the database itself through constraints, triggers and locked transactions. Automated tests "
     "confirmed correct behaviour for valid and invalid inputs, rollback and concurrent access, and index "
     "experiments quantified the benefit of choosing the right access method.")
para("The main achievements are a BCNF schema, 22 analytical queries, reusable views, procedures and "
     "triggers, a concurrency-safe checkout, measured indexing gains and a catalogue interface connected to "
     "PostgreSQL. The current limitations are that the login, reservation and loan endpoints and the MongoDB "
     "activity log are not yet integrated, the demo password hashes in the seed data are placeholders, and "
     "recommendations are rule-based rather than learned.")
para("Future work will complete the REST API with bcrypt-based authentication and connect every screen to "
     "it, store view and search events in MongoDB as extra recommendation signals, schedule a job that marks "
     "overdue loans and expires unclaimed reservations, notify students by e-mail when a reserved copy "
     "becomes ready, and replace pattern matching with full-text search using a GIN index.")

# ------------------------------------------------------------------ REFERENCES
new_chapter(0, "REFERENCES")
refs = [
    "A. Silberschatz, H. F. Korth, and S. Sudarshan, Database System Concepts, 7th ed. New York, NY, USA: McGraw-Hill, 2019.",
    "R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed. Boston, MA, USA: Pearson, 2016.",
    "PostgreSQL Global Development Group, “PostgreSQL 16 Documentation,” 2024. [Online]. Available: https://www.postgresql.org/docs/16/",
    "E. F. Codd, “A relational model of data for large shared data banks,” Commun. ACM, vol. 13, no. 6, pp. 377–387, Jun. 1970.",
    "P. P. Chen, “The entity-relationship model—Toward a unified view of data,” ACM Trans. Database Syst., vol. 1, no. 1, pp. 9–36, Mar. 1976.",
    "J. Gray and A. Reuter, Transaction Processing: Concepts and Techniques. San Mateo, CA, USA: Morgan Kaufmann, 1992.",
    "G. Linden, B. Smith, and J. York, “Amazon.com recommendations: Item-to-item collaborative filtering,” IEEE Internet Comput., vol. 7, no. 1, pp. 76–80, Jan. 2003.",
    "E. Brewer, “CAP twelve years later: How the ‘rules’ have changed,” Computer, vol. 45, no. 2, pp. 23–29, Feb. 2012.",
    "Koha Community, “Koha Library Software.” [Online]. Available: https://koha-community.org/",
    "Pallets Projects, “Flask Documentation (3.0.x).” [Online]. Available: https://flask.palletsprojects.com/",
    "MongoDB Inc., “MongoDB Manual.” [Online]. Available: https://www.mongodb.com/docs/manual/",
    "Oracle, “Become an Oracle AI Database Foundations Associate (2026),” Oracle MyLearn. [Online]. Available: https://mylearn.oracle.com/ou/learning-path/become-an-oracle-ai-database-foundations-associate-2026/162213",
]
for i, r in enumerate(refs, 1):
    p = doc.add_paragraph(f"[{i}]  {r}"); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.left_indent = Inches(0.45); p.paragraph_format.first_line_indent = Inches(-0.45)

# ------------------------------------------------------------------ EVALUATION SHEET
new_chapter(0, "EVALUATION SHEET")
for label, val in (("Reg. No", REGNO), ("Name", STUDENT), ("Course code", "23CS2013"),
                   ("Course Name", "DATABASE MANAGEMENT SYSTEMS")):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.add_run(f"{label}: ").bold = True; p.add_run(val)
t = doc.add_table(rows=1, cols=4); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, h in enumerate(["S. No", "Rubrics", "Maximum Marks", "Marks Obtained"]):
    t.rows[0].cells[i].text = ""; t.rows[0].cells[i].paragraphs[0].add_run(h).bold = True
for row in (["1", "Online Certification Completion (Online Course)", "15", ""],
            ["2", "Problem statement and SQL implementation", "10", ""],
            ["3", "Application development", "12", ""],
            ["4", "Presentation & Documentation", "3", ""],
            ["", "Total", "40", ""]):
    cells = t.add_row().cells
    for i, v in enumerate(row):
        cells[i].text = v
for row in t.rows:
    for i, w in enumerate((0.7, 3.4, 1.2, 1.2)):
        row.cells[i].width = Inches(w)
for _ in range(4):
    doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p.add_run("Signature of the Faculty-in-charge\n").bold = True
p.add_run(FACULTY)

out = os.path.join(HERE, "DBMS_Project_Report.docx")
doc.save(out)
print("saved", out)
