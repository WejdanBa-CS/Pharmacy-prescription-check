#!/usr/bin/env python3
"""Build SQLite databases from the attached CSV sources."""

import csv
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "sources"
SQL = ROOT / "sql"
JS = ROOT / "js"


def read_csv(name):
    with (SRC / name).open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def write_db(path, script):
    if path.exists():
        path.unlink()
    con = sqlite3.connect(path)
    con.executescript(script)
    con.commit()
    con.close()
    path.with_suffix(".sql").write_text(script, encoding="utf-8")


def prescriptions_sql(rows):
    patients = {}
    items = []
    for r in rows:
        pid = r["Patient_ID"]
        if pid not in patients:
            patients[pid] = r
        items.append(r)

    lines = [
        "-- Built from sources/medical_prescription_dataset.csv",
        "PRAGMA foreign_keys = ON;",
        "",
        "CREATE TABLE patient (",
        "  patient_id TEXT PRIMARY KEY,",
        "  name TEXT NOT NULL,",
        "  age INTEGER NOT NULL,",
        "  gender TEXT NOT NULL,",
        "  diagnosis TEXT NOT NULL,",
        "  hospital TEXT NOT NULL,",
        "  doctor_specialty TEXT NOT NULL,",
        "  prescription_date TEXT NOT NULL",
        ");",
        "",
        "CREATE TABLE prescription_item (",
        "  item_id INTEGER PRIMARY KEY AUTOINCREMENT,",
        "  patient_id TEXT NOT NULL,",
        "  medicine_name TEXT NOT NULL,",
        "  dosage TEXT NOT NULL,",
        "  frequency TEXT NOT NULL,",
        "  duration TEXT NOT NULL,",
        "  route TEXT NOT NULL,",
        "  FOREIGN KEY (patient_id) REFERENCES patient(patient_id)",
        ");",
        "",
        "INSERT INTO patient (patient_id, name, age, gender, diagnosis, hospital, doctor_specialty, prescription_date) VALUES",
    ]
    pvals = []
    for pid, r in patients.items():
        pvals.append(
            "  (%s, %s, %s, %s, %s, %s, %s, %s)"
            % (
                q(r["Patient_ID"]),
                q(r["Patient_Name"]),
                int(r["Age"]),
                q(r["Gender"]),
                q(r["Diagnosis"]),
                q(r["Hospital"]),
                q(r["Doctor_Specialty"]),
                q(r["Prescription_Date"]),
            )
        )
    lines.append(",\n".join(pvals) + ";")
    lines.append("")
    lines.append(
        "INSERT INTO prescription_item (patient_id, medicine_name, dosage, frequency, duration, route) VALUES"
    )
    ivals = []
    for r in items:
        ivals.append(
            "  (%s, %s, %s, %s, %s, %s)"
            % (
                q(r["Patient_ID"]),
                q(r["Medicine_Name"]),
                q(r["Dosage"]),
                q(r["Frequency"]),
                q(r["Duration"]),
                q(r["Route"]),
            )
        )
    lines.append(",\n".join(ivals) + ";")
    lines.append("")
    return "\n".join(lines)


def pharmacy_sql(catalog, effects, ddi):
    drugs = []
    seen = set()
    for r in catalog:
        n = r["Scientific_Name"]
        if n not in seen:
            seen.add(n)
            drugs.append(n)

    lines = [
        "-- Built from sources/pharmacy_catalog.csv, drug_side_effects.csv, drug_drug_interactions.csv",
        "PRAGMA foreign_keys = ON;",
        "",
        "CREATE TABLE drug (",
        "  scientific_name TEXT PRIMARY KEY",
        ");",
        "",
        "CREATE TABLE trade_name (",
        "  trade_name TEXT PRIMARY KEY,",
        "  scientific_name TEXT NOT NULL,",
        "  FOREIGN KEY (scientific_name) REFERENCES drug(scientific_name)",
        ");",
        "",
        "CREATE TABLE side_effect (",
        "  effect_id INTEGER PRIMARY KEY AUTOINCREMENT,",
        "  scientific_name TEXT NOT NULL,",
        "  effect_text TEXT NOT NULL,",
        "  FOREIGN KEY (scientific_name) REFERENCES drug(scientific_name)",
        ");",
        "",
        "CREATE TABLE interaction (",
        "  interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,",
        "  drug1 TEXT NOT NULL,",
        "  drug2 TEXT NOT NULL,",
        "  description TEXT NOT NULL,",
        "  FOREIGN KEY (drug1) REFERENCES drug(scientific_name),",
        "  FOREIGN KEY (drug2) REFERENCES drug(scientific_name)",
        ");",
        "",
        "INSERT INTO drug (scientific_name) VALUES",
        ",\n".join("  (%s)" % q(n) for n in drugs) + ";",
        "",
        "INSERT INTO trade_name (trade_name, scientific_name) VALUES",
        ",\n".join(
            "  (%s, %s)" % (q(r["Trade_Name"]), q(r["Scientific_Name"])) for r in catalog
        )
        + ";",
        "",
        "INSERT INTO side_effect (scientific_name, effect_text) VALUES",
        ",\n".join(
            "  (%s, %s)" % (q(r["Scientific_Name"]), q(r["Side_Effect"])) for r in effects
        )
        + ";",
        "",
        "INSERT INTO interaction (drug1, drug2, description) VALUES",
        ",\n".join(
            "  (%s, %s, %s)" % (q(r["Drug 1"]), q(r["Drug 2"]), q(r["Interaction Description"]))
            for r in ddi
        )
        + ";",
        "",
    ]
    return "\n".join(lines)


def main():
    rx = read_csv("medical_prescription_dataset.csv")
    cat = read_csv("pharmacy_catalog.csv")
    se = read_csv("drug_side_effects.csv")
    ddi = read_csv("drug_drug_interactions.csv")

    p_sql = prescriptions_sql(rx)
    ph_sql = pharmacy_sql(cat, se, ddi)
    write_db(SQL / "prescriptions.db", p_sql)
    write_db(SQL / "pharmacy.db", ph_sql)

    schema = (
        "// Generated from sources/*.csv by sql/build_from_sources.py\n"
        + "var PRESCRIPTIONS_SQL = "
        + json.dumps(p_sql)
        + ";\n"
        + "var PHARMACY_SQL = "
        + json.dumps(ph_sql)
        + ";\n"
    )
    (JS / "schema.js").write_text(schema, encoding="utf-8")

    con = sqlite3.connect(SQL / "prescriptions.db")
    print("patients", con.execute("select count(*) from patient").fetchone()[0])
    print("items", con.execute("select count(*) from prescription_item").fetchone()[0])
    con.close()
    con = sqlite3.connect(SQL / "pharmacy.db")
    print("drugs", con.execute("select count(*) from drug").fetchone()[0])
    print("trade", con.execute("select count(*) from trade_name").fetchone()[0])
    print("ddi", con.execute("select count(*) from interaction").fetchone()[0])
    con.close()
    print("ok")


if __name__ == "__main__":
    main()
