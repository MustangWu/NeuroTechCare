"""
excel_to_sql_dementia_burden.py
---------------------------------
Converts AIHW-DEM-02-S4-Burden-of-disease.xlsx (sheet S4.1) into a
PostgreSQL-compatible SQL file for the dementia_burden_of_disease table.

Expected folder layout (relative to this script)
-------------------------------------------------
  db/
  ├── Excel/
  │   └── AIHW-DEM-02-S4-Burden-of-disease.xlsx
  ├── scripts/
  │   └── excel_to_sql_dementia_burden.py        ← this file
  └── dementia_burden_of_disease.sql             ← written/overwritten here

Sheet layout (S4.1)
-------------------
  Row 0  : Table title                                  (skipped)
  Row 1  : Group labels Sex | Age | Measure | Rank ...  (skipped)
  Row 2  : Rank labels  NaN | NaN | NaN | 1st...10th    (skipped)
  Row 3+ : Alternating Disease / DALY row pairs
  Row 69+: Notes and footer rows                        (ignored automatically)

Usage
-----
    python db/scripts/excel_to_sql_dementia_burden.py

    python db/scripts/excel_to_sql_dementia_burden.py \\
        --input  path/to/custom.xlsx \\
        --output path/to/custom.sql

Dependencies
------------
    pip install pandas openpyxl
"""

import argparse
import sys
from pathlib import Path
import pandas as pd

# ---------------------------------------------------------------------------
# Resolve default paths relative to THIS script's location
# ---------------------------------------------------------------------------
DB_DIR          = Path(__file__).resolve().parent.parent
EXCEL_DIR       = DB_DIR / "Excel"
INPUT_DEFAULT   = EXCEL_DIR / "AIHW-DEM-02-S4-Burden-of-disease.xlsx"
OUTPUT_DEFAULT  = DB_DIR / "dementia_burden_of_disease.sql"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SHEET_NAME      = "S4.1"
SOURCE_YEAR     = 2024
EXPECTED_ROWS   = 330
VALID_SEX       = {"Men", "Women", "Persons"}

AGE_ORDER = [
    "Under 30", "30\u201364", "65\u201369", "70\u201374", "75\u201379",
    "80\u201384", "85\u201389", "90\u201394", "95\u201399", "100+", "Total",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def escape_str(val):
    return str(val).replace("'", "''")


def to_int_sql(val):
    if val is None:
        return "NULL"
    try:
        f = float(val)
        if f != f:
            return "NULL"
        return str(int(round(f)))
    except (ValueError, TypeError):
        return "NULL"


# ---------------------------------------------------------------------------
# Parse the alternating Disease/DALY row pairs
# ---------------------------------------------------------------------------

def parse_sheet(df):
    """
    Walk rows maintaining running sex and age_group state (merged-cell
    carry-forward). Emit one flat record per (sex, age_group, rank).
    Uses bracket-style dict access (r['disease_rank']) to avoid collision
    with the pandas built-in .rank() method.
    """
    records          = []
    current_sex      = None
    current_age      = None
    current_diseases = []

    for _, row in df.iterrows():
        sex_val = str(row[0]).strip() if pd.notna(row[0]) else ""
        if sex_val in VALID_SEX:
            current_sex = sex_val

        age_val = str(row[1]).strip() if pd.notna(row[1]) else ""
        if age_val and age_val != "nan":
            current_age = age_val

        measure = str(row[2]).strip() if pd.notna(row[2]) else ""

        if measure == "Disease":
            current_diseases = [
                str(row[c]).strip() if pd.notna(row[c]) else None
                for c in range(3, 13)
            ]

        elif measure == "DALY":
            for rank_i, (disease_name, daly_val) in enumerate(
                zip(current_diseases, [row[c] for c in range(3, 13)]),
                start=1,
            ):
                if disease_name and disease_name != "nan":
                    records.append({
                        "sex":          current_sex,
                        "age_group":    current_age,
                        "disease_rank": rank_i,
                        "disease":      disease_name,
                        "daly":         daly_val,
                    })

    return records


# ---------------------------------------------------------------------------
# Build SQL
# ---------------------------------------------------------------------------

def build_sql(records):
    print("[3/4] Building SQL...")

    header = f"""\
-- =============================================================================
-- dementia_burden_of_disease.sql
-- =============================================================================
-- Source  : AIHW Dementia in Australia supplementary data tables (AIHW-DEM-02)
-- Sheet   : S4.1 — Leading 10 causes of disease burden (DALY), 2024
-- URL     : https://www.aihw.gov.au/reports/dementia/dementia-in-aus/data
-- Year    : {SOURCE_YEAR} (fixed — source table covers 2024 only)
-- Sex     : Men, Women, Persons
-- Ages    : Under 30, 30-64, 65-69, 70-74, 75-79, 80-84, 85-89,
--           90-94, 95-99, 100+, Total
-- Rows    : {EXPECTED_ROWS}  (3 sexes x 11 age groups x 10 ranks)
--
-- Notes
-- -----
-- * rank = 1 means highest disease burden within that sex/age combination
-- * Persons totals may not equal Men + Women due to AIHW rounding
-- =============================================================================

DROP TABLE IF EXISTS dementia_burden_of_disease CASCADE;

CREATE TABLE dementia_burden_of_disease (
    id          SERIAL          PRIMARY KEY,
    year        SMALLINT        NOT NULL DEFAULT {SOURCE_YEAR},
    sex         VARCHAR(10)     NOT NULL,
    age_group   VARCHAR(10)     NOT NULL,
    rank        SMALLINT        NOT NULL,
    disease     TEXT            NOT NULL,
    daly        INTEGER         NOT NULL,

    CONSTRAINT chk_bod_sex  CHECK (sex  IN ('Men', 'Women', 'Persons')),
    CONSTRAINT chk_bod_rank CHECK (rank BETWEEN 1 AND 10)
);

INSERT INTO dementia_burden_of_disease (year, sex, age_group, rank, disease, daly)
VALUES
"""

    rows = []
    for r in records:
        rows.append(
            f"    ({SOURCE_YEAR}, '{escape_str(r['sex'])}', '{escape_str(r['age_group'])}', "
            f"{r['disease_rank']}, '{escape_str(r['disease'])}', {to_int_sql(r['daly'])})"
        )

    body = ",\n".join(rows) + ";\n"

    footer = """
-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_bod_sex      ON dementia_burden_of_disease (sex);
CREATE INDEX idx_bod_age      ON dementia_burden_of_disease (age_group);
CREATE INDEX idx_bod_rank     ON dementia_burden_of_disease (rank);
CREATE INDEX idx_bod_disease  ON dementia_burden_of_disease (disease);
CREATE INDEX idx_bod_sex_age  ON dementia_burden_of_disease (sex, age_group);

-- =============================================================================
-- Convenience views
-- =============================================================================

-- Graph 2 default: top 10 by DALY — Persons / Total (horizontal bar chart)
CREATE OR REPLACE VIEW v_burden_persons_total AS
SELECT rank, disease, daly
FROM dementia_burden_of_disease
WHERE sex = 'Persons' AND age_group = 'Total'
ORDER BY rank;

-- All sex totals side-by-side
CREATE OR REPLACE VIEW v_burden_totals_by_sex AS
SELECT sex, rank, disease, daly
FROM dementia_burden_of_disease
WHERE age_group = 'Total'
ORDER BY sex, rank;

-- Dementia rank + DALY across every sex/age combination
CREATE OR REPLACE VIEW v_burden_dementia_only AS
SELECT sex, age_group, rank, daly
FROM dementia_burden_of_disease
WHERE disease = 'Dementia'
ORDER BY sex, age_group;
"""

    return header + body + footer


# ---------------------------------------------------------------------------
# Main ETL logic
# ---------------------------------------------------------------------------

def run(input_path, output_path):
    input_path  = Path(input_path)
    output_path = Path(output_path)

    print(f"[1/4] Reading sheet '{SHEET_NAME}' from:\n       {input_path}")
    try:
        df = pd.read_excel(input_path, sheet_name=SHEET_NAME, header=None)
    except FileNotFoundError:
        sys.exit(f"ERROR: File not found: {input_path}")
    except Exception as e:
        sys.exit(f"ERROR: Could not read Excel file: {e}")

    print(f"       Sheet dimensions: {df.shape[0]} rows x {df.shape[1]} columns")

    print("[2/4] Parsing Disease/DALY row pairs...")
    records = parse_sheet(df.iloc[3:].reset_index(drop=True))
    print(f"       Records extracted: {len(records)}")

    if len(records) != EXPECTED_ROWS:
        print(f"WARNING: Expected {EXPECTED_ROWS} records, got {len(records)}. Proceeding anyway.")

    sql = build_sql(records)

    existed = output_path.exists()
    print(f"[4/4] Writing SQL to:\n       {output_path}")
    if existed:
        print("       (overwriting existing file)")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sql, encoding="utf-8")
    print(f"       Done. {sql.count(chr(10)):,} lines written.")

    sexes      = sorted({r["sex"]       for r in records})
    age_groups = sorted({r["age_group"] for r in records},
                        key=lambda x: AGE_ORDER.index(x) if x in AGE_ORDER else 99)
    print("\nSummary")
    print("-------")
    print(f"  Input      : {input_path}")
    print(f"  Output     : {output_path}")
    print(f"  Year       : {SOURCE_YEAR}")
    print(f"  Rows       : {len(records)}")
    print(f"  Sex        : {sexes}")
    print(f"  Age groups : {age_groups}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert AIHW-DEM-02-S4 Excel to dementia_burden_of_disease SQL."
    )
    parser.add_argument("--input",  "-i", default=str(INPUT_DEFAULT),
                        help="Excel source file (default: db/Excel/...xlsx)")
    parser.add_argument("--output", "-o", default=str(OUTPUT_DEFAULT),
                        help="Output SQL file  (default: db/dementia_burden_of_disease.sql)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(args.input, args.output)
