"""Generates the diagrams used in the project report (report/figures/*.png)."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUT = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(OUT, exist_ok=True)
plt.rcParams["font.family"] = "Times New Roman"


def box(ax, x, y, w, h, text, fc="#e8eef7", ec="#1f3b63", fs=11, bold=False):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.08",
                                fc=fc, ec=ec, lw=1.4))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs,
            weight="bold" if bold else "normal", wrap=True)


def arrow(ax, x1, y1, x2, y2, label=None, both=False):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="<|-|>" if both else "-|>",
                                 mutation_scale=14, lw=1.3, color="#333"))
    if label:
        ax.text((x1 + x2) / 2 + 0.08, (y1 + y2) / 2, label, fontsize=9, style="italic",
                ha="left", va="center")


def architecture():
    fig, ax = plt.subplots(figsize=(8, 5.4), dpi=200)
    ax.set_xlim(0, 10); ax.set_ylim(0, 7); ax.axis("off")
    box(ax, 2.5, 5.7, 5, 1.0, "Presentation Tier\nHTML5 / CSS3 / JavaScript (Browser)", fc="#fdf1dc", bold=True)
    box(ax, 2.5, 3.5, 5, 1.3, "Application Tier — Flask REST API\nauth · books · reservations · loans · reviews · recommendations",
        fc="#e3f1e6", bold=True)
    box(ax, 0.4, 0.6, 4.2, 1.6, "PostgreSQL 16 (authoritative)\n10 tables · 6 views · 3 functions\n2 procedures · 3 triggers · indexes", fc="#e8eef7")
    box(ax, 5.4, 0.6, 4.2, 1.6, "MongoDB (optional)\nactivity events\n(view / search / reserve)", fc="#f3e6f1")
    arrow(ax, 5, 5.7, 5, 4.8, "HTTP / JSON (fetch)", both=True)
    arrow(ax, 4.0, 3.5, 2.5, 2.2, "psycopg2 pool\nparameterised SQL", both=True)
    arrow(ax, 6.0, 3.5, 7.5, 2.2, "pymongo", both=True)
    fig.savefig(os.path.join(OUT, "fig_architecture.png"), bbox_inches="tight"); plt.close(fig)


def er_diagram():
    ents = {
        "USERS": (0.3, 5.6, ["user_id PK", "email UK", "full_name", "role", "department"]),
        "RESERVATIONS": (0.3, 2.6, ["reservation_id PK", "user_id FK", "book_id FK", "status", "queue_position"]),
        "LOANS": (3.6, 0.2, ["loan_id PK", "user_id FK", "copy_id FK", "due_at", "status", "fine_amount"]),
        "REVIEWS": (3.6, 5.6, ["review_id PK", "user_id FK", "book_id FK", "rating (1-5)"]),
        "BOOKS": (6.9, 3.4, ["book_id PK", "isbn UK", "title", "category_id FK", "publisher_id FK"]),
        "BOOK_COPIES": (6.9, 0.2, ["copy_id PK", "book_id FK", "barcode UK", "status"]),
        "CATEGORIES": (10.2, 5.9, ["category_id PK", "category_name UK"]),
        "PUBLISHERS": (10.2, 3.9, ["publisher_id PK", "publisher_name UK"]),
        "BOOK_AUTHORS": (10.2, 1.8, ["book_id PK,FK", "author_id PK,FK", "author_order"]),
        "AUTHORS": (10.2, -0.2, ["author_id PK", "author_name"]),
    }
    fig, ax = plt.subplots(figsize=(11, 6.6), dpi=200)
    ax.set_xlim(0, 13); ax.set_ylim(-0.6, 7.6); ax.axis("off")
    W = 2.5
    geom = {}
    for name, (x, y, attrs) in ents.items():
        h = 0.32 * (len(attrs) + 1)
        ax.add_patch(plt.Rectangle((x, y), W, h, fc="#f7f9fc", ec="#1f3b63", lw=1.2))
        ax.add_patch(plt.Rectangle((x, y + h - 0.32), W, 0.32, fc="#1f3b63", ec="#1f3b63"))
        ax.text(x + W / 2, y + h - 0.16, name, color="white", ha="center", va="center", fontsize=9.5, weight="bold")
        for i, a in enumerate(attrs):
            ax.text(x + 0.08, y + h - 0.48 - 0.32 * i, a, fontsize=8.3, va="center")
        geom[name] = (x, y, W, h)

    def exit_t(rect, c, d):
        # parameter t in [0,1] where the segment c->d leaves the rectangle centred on c
        x, y, w, h = rect
        dx, dy = d[0] - c[0], d[1] - c[1]
        ts = []
        if dx: ts.append((w / 2) / abs(dx))
        if dy: ts.append((h / 2) / abs(dy))
        return min(ts)

    def edge(a, b, la, lb):
        ra, rb = geom[a], geom[b]
        ca = (ra[0] + ra[2] / 2, ra[1] + ra[3] / 2); cb = (rb[0] + rb[2] / 2, rb[1] + rb[3] / 2)
        ta = exit_t(ra, ca, cb); tb = 1 - exit_t(rb, cb, ca)
        pa = (ca[0] + (cb[0] - ca[0]) * ta, ca[1] + (cb[1] - ca[1]) * ta)
        pb = (ca[0] + (cb[0] - ca[0]) * tb, ca[1] + (cb[1] - ca[1]) * tb)
        ax.plot([pa[0], pb[0]], [pa[1], pb[1]], color="#555", lw=1, zorder=0)
        for (p, q, lab) in ((pa, pb, la), (pb, pa, lb)):
            lx = p[0] + (q[0] - p[0]) * 0.12; ly = p[1] + (q[1] - p[1]) * 0.12
            ax.text(lx, ly, lab, fontsize=9, color="#a33", weight="bold", ha="center", va="center",
                    bbox=dict(fc="white", ec="none", pad=0.5))

    edge("USERS", "RESERVATIONS", "1", "N")
    edge("USERS", "REVIEWS", "1", "N")
    edge("USERS", "LOANS", "1", "N")
    edge("BOOKS", "RESERVATIONS", "1", "N")
    edge("BOOKS", "REVIEWS", "1", "N")
    edge("BOOKS", "BOOK_COPIES", "1", "N")
    edge("BOOK_COPIES", "LOANS", "1", "N")
    edge("CATEGORIES", "BOOKS", "1", "N")
    edge("PUBLISHERS", "BOOKS", "1", "N")
    edge("BOOKS", "BOOK_AUTHORS", "1", "N")
    edge("AUTHORS", "BOOK_AUTHORS", "1", "N")
    fig.savefig(os.path.join(OUT, "fig_er.png"), bbox_inches="tight"); plt.close(fig)


def checkout_flow():
    steps = ["Patron requests checkout\n(user_id, copy_id)",
             "fn_can_user_borrow()\nactive? no overdue? fines < 10?",
             "SELECT … FROM book_copies\nWHERE copy_id = ? FOR UPDATE",
             "Status AVAILABLE\nor RESERVED?",
             "INSERT loan · UPDATE copy → LOANED\nfulfil matching reservation",
             "COMMIT"]
    fig, ax = plt.subplots(figsize=(6.4, 7.4), dpi=200)
    ax.set_xlim(0, 10); ax.set_ylim(0, 12.4); ax.axis("off")
    ys = [11, 9.1, 7.2, 5.3, 3.4, 1.5]
    for i, (s, y) in enumerate(zip(steps, ys)):
        fc = "#fdf1dc" if i in (1, 3) else ("#e3f1e6" if i == 5 else "#e8eef7")
        box(ax, 1.5, y, 5, 1.2, s, fc=fc, fs=10)
        if i:
            arrow(ax, 4, ys[i - 1], 4, y + 1.2, "yes" if i in (2, 4) else None)
    box(ax, 7.3, 6.2, 2.5, 1.2, "RAISE EXCEPTION\n→ ROLLBACK", fc="#f8dede", fs=10)
    arrow(ax, 6.5, 9.7, 8.5, 7.4, "no")
    arrow(ax, 6.5, 5.9, 7.3, 6.5, "no")
    fig.savefig(os.path.join(OUT, "fig_checkout_flow.png"), bbox_inches="tight"); plt.close(fig)


def index_chart():
    import json
    path = os.path.join(os.path.dirname(__file__), "results.json")
    if not os.path.exists(path):
        return
    rows = json.load(open(path))["explain"]
    labels = [f"{r['query']}\n({r['index']})" for r in rows]
    before = [r["before_ms"] for r in rows]; after = [r["after_ms"] for r in rows]
    fig, ax = plt.subplots(figsize=(7, 3.8), dpi=200)
    x = range(len(rows)); w = 0.36
    b1 = ax.bar([i - w / 2 for i in x], before, w, label="Without index", color="#b9c4d6")
    b2 = ax.bar([i + w / 2 for i in x], after, w, label="With index", color="#1f3b63")
    ax.set_yscale("log"); ax.set_ylabel("Execution time (ms, log scale)")
    ax.set_xticks(list(x)); ax.set_xticklabels(labels, fontsize=9)
    for bars in (b1, b2):
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() * 1.15, f"{bar.get_height():g}",
                    ha="center", fontsize=8)
    ax.set_ylim(top=max(before) * 8)
    ax.legend(frameon=False, loc="upper left", ncol=2); ax.spines[["top", "right"]].set_visible(False)
    fig.savefig(os.path.join(OUT, "fig_index.png"), bbox_inches="tight"); plt.close(fig)


if __name__ == "__main__":
    architecture(); er_diagram(); checkout_flow(); index_chart()
    print("figures written to", OUT)
