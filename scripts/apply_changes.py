#!/usr/bin/env python3
"""Apply cell edits to data/cases.csv or data/defendants.csv and log each one
in data/CHANGELOG.md.

Usage:
    python3 scripts/apply_changes.py changes.json

changes.json is a list of objects:
    {
      "id": "DF-007",                 # Case ID (CS-###) or Defendant ID (DF-###)
      "field": "Current status",      # exact column header
      "new": "Sentenced",             # new value ("" to blank a cell)
      "source": "https://...",        # URL (or a short description if no URL)
      "primary": "Yes",               # Yes / No
      "note": "optional short reason"
    }

The script refuses to run if an ID or column does not exist, and it records
the old value automatically, so the changelog always matches the data.
"""
import csv
import datetime
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = {"CS": "data/cases.csv", "DF": "data/defendants.csv"}
LOG = os.path.join(ROOT, "data", "CHANGELOG.md")
HEADER = (
    "| Date | Row ID | Field | Old value | New value | Source | Primary source? | Note |\n"
    "|---|---|---|---|---|---|---|---|\n"
)


def load(path):
    with open(os.path.join(ROOT, path), newline="", encoding="utf-8") as f:
        return list(csv.reader(f))


def save(path, rows):
    out = io.StringIO()
    csv.writer(out, lineterminator="\n").writerows(rows)
    with open(os.path.join(ROOT, path), "w", encoding="utf-8", newline="") as f:
        f.write(out.getvalue())


def cell(s):
    s = "" if s is None else str(s)
    s = s.replace("|", "\\|").replace("\n", " ")
    return s if s else "(blank)"


def main():
    changes = json.load(open(sys.argv[1], encoding="utf-8"))
    date = os.environ.get("CHANGE_DATE") or datetime.date.today().isoformat()
    tables = {k: load(v) for k, v in FILES.items()}
    log_lines = []
    for ch in changes:
        prefix = ch["id"][:2]
        rows = tables[prefix]
        head = rows[0]
        if ch["field"] not in head:
            sys.exit(f"Unknown column {ch['field']!r} in {FILES[prefix]}")
        col = head.index(ch["field"])
        match = [r for r in rows[1:] if r[0] == ch["id"]]
        if len(match) != 1:
            sys.exit(f"ID {ch['id']} found {len(match)} times")
        row = match[0]
        old = row[col]
        new = ch["new"]
        if old == new:
            print(f"skip (unchanged): {ch['id']} {ch['field']}")
            continue
        row[col] = new
        log_lines.append(
            "| " + " | ".join(
                cell(x) for x in [date, ch["id"], ch["field"], old, new,
                                  ch.get("source", ""), ch.get("primary", ""),
                                  ch.get("note", "")]
            ) + " |\n"
        )
    for k, v in FILES.items():
        save(v, tables[k])
    if not os.path.exists(LOG):
        with open(LOG, "w", encoding="utf-8") as f:
            f.write("# Changelog\n\nEvery change to the data, newest last. "
                    "'Primary source' means a court record or an official "
                    "government release.\n\n" + HEADER)
    with open(LOG, "a", encoding="utf-8") as f:
        f.writelines(log_lines)
    print(f"Applied {len(log_lines)} change(s); logged to data/CHANGELOG.md")


if __name__ == "__main__":
    main()
