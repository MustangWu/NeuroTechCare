"""
excel_to_sql_neurological_burden.py
-------------------------------------
Converts AIHW-BOD-40-ABDS-2024-national-disease-burden-data-tables.xlsx
into a PostgreSQL-compatible SQL file for the neurological_burden table.

Expected folder layout (relative to this script)
-------------------------------------------------
  db/
  ├── Excel/
  │   └── AIHW-BOD-40-ABDS-2024-national-disease-burden-data-tables.xlsx
  ├── scripts/
  │   └── excel_to_sql_neurological_burden.py   ← this file
  └── neurological_burden.sql                   ← written/overwritten here

Source sheet : S1_Disease_5yrs
Target table : neurological_burden
Output file  : db/neurological_burden.sql  (auto-resolved; overwritten if exists)

Usage
-----
    # Run from anywhere — paths resolve relative to this script
    python db/scripts/excel_to_sql_neurological_burden.py

    # Override input and/or output
    python db/scripts/excel_to_sql_neurological_burden.py \\
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
# Script lives at:  db/scripts/excel_to_sql_neurological_burden.py
# db/ is:           db/scripts/../../  →  one level up from scripts/
DB_DIR          = Path(__file__).resolve().parent.parent
EXCEL_DIR       = DB_DIR / "Excel"
INPUT_DEFAULT   = EXCEL_DIR / "AIHW-BOD-40-ABDS-2024-national-disease-burden-data-tables.xlsx"
OUTPUT_DEFAULT  = DB_DIR / "neurological_burden.sql"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SHEET_NAME      = "S1_Disease_5yrs"
FILTER_GROUP    = "Neurological conditions"
EXPECTED_ROWS   = 2760

EXCEL_COLUMNS = [
    "data_year", "disease_group", "disease", "sex", "age_group",
    "yll", "crude_yll_rate", "yld", "crude_yld_rate",
    "daly", "crude_daly_rate", "standard_population",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def to_int_sql(val):
    """Return an INTEGER SQL literal, or NULL for missing/suppressed values."""
    if val is None:
        return "NULL"
    try:
        f = float(val)
        if f != f:
            return "NULL"
        return str(int(round(f)))
    except (ValueError, TypeError):
        return "NULL"


def to_numeric_sql(val, precision=3):
    """Return a NUMERIC SQL literal rounded to `precision` dp, or NULL."""
    if val is None:
        return "NULL"
    try:
        f = float(val)
        if f != f:
            return "NULL"
        return f"{f:.{precision}f}"
    except (ValueError, TypeError):
        return "NULL"


def to_bigint_sql(val):
    """Return a BIGINT SQL literal, or NULL for '.' suppression placeholder."""
    if val is None:
        return "NULL"
    s = str(val).strip()
    if s in (".", "", "nan", "None"):
        return "NULL"
    try:
        return str(int(float(s)))
    except (ValueError, TypeError):
        return "NULL"


def escape_str(val):
    """Escape single quotes for SQL string literals."""
    return str(val).replace("'", "''")


# ---------------------------------------------------------------------------
# ETL steps
# ---------------------------------------------------------------------------

def load_and_filter(input_path):
    print(f"[1/4] Reading sheet '{SHEET_NAME}' from:\n       {input_path}")
    try:
        df = pd.read_excel(input_path, sheet_name=SHEET_NAME, header=0)
    except FileNotFoundError:
        sys.exit(f"ERROR: File not found: {input_path}")
    except Exception as e:
        sys.exit(f"ERROR: Could not read Excel file: {e}")

    missing = [c for c in EXCEL_COLUMNS if c not in df.columns]
    if missing:
        sys.exit(f"ERROR: Expected columns not found: {missing}")

    df = df[EXCEL_COLUMNS].copy()
    print(f"       Total rows in sheet: {len(df):,}")

    print(f"[2/4] Filtering disease_group = '{FILTER_GROUP}'")
    df = df[df["disease_group"] == FILTER_GROUP].copy()
    print(f"       Rows after filter: {len(df):,}")

    if len(df) != EXPECTED_ROWS:
        print(f"WARNING: Expected {EXPECTED_ROWS} rows, got {len(df)}. Proceeding anyway.")

    return df


def build_sql(df):
    print("[3/4] Building SQL...")

    header = """\
-- =============================================================================
-- neurological_burden.sql
-- =============================================================================
-- Source  : AIHW Australian Burden of Disease Study 2024
--           National disease burden data tables (AIHW-BOD-40)
-- Sheet   : S1_Disease_5yrs
-- Filter  : disease_group = 'Neurological conditions'
-- Diseases: Dementia, Epilepsy, Guillain-Barre Syndrome, Migraine,
--           Motor neurone disease, Multiple sclerosis,
--           Other neurological conditions, Parkinson disease
-- Years   : 2003, 2011, 2015, 2018, 2024
-- Sex     : Females, Males, Persons
-- Age     : 0, 1-4, 5-9, ..., 95-99, 100+, Total
-- Rows    : 2,760
--
-- Notes
-- -----
-- * crude_yll_rate, crude_yld_rate, crude_daly_rate are per 1,000 population
-- * standard_population is populated only for age_group = 'Total' rows;
--   all other rows are NULL (AIHW uses '.' as a suppression placeholder)
-- * yll, yld, daly are NULL for any suppressed cells
-- =============================================================================

DROP TABLE IF EXISTS neurological_burden CASCADE;

CREATE TABLE neurological_burden (
    id                   SERIAL          PRIMARY KEY,
    data_year            SMALLINT        NOT NULL,
    disease_group        VARCHAR(50)     NOT NULL,
    disease              VARCHAR(100)    NOT NULL,
    sex                  VARCHAR(10)     NOT NULL,
    age_group            VARCHAR(10)     NOT NULL,
    yll                  INTEGER,
    crude_yll_rate       NUMERIC(10,3),
    yld                  INTEGER,
    crude_yld_rate       NUMERIC(10,3),
    daly                 INTEGER,
    crude_daly_rate      NUMERIC(10,3),
    standard_population  BIGINT,

    CONSTRAINT chk_nb_sex CHECK (sex IN ('Females', 'Males', 'Persons'))
);

INSERT INTO neurological_burden (
    data_year, disease_group, disease, sex, age_group,
    yll, crude_yll_rate, yld, crude_yld_rate,
    daly, crude_daly_rate, standard_population
)
VALUES
"""

    rows = []
    for _, r in df.iterrows():
        rows.append(
            f"    ({int(r['data_year'])}, "
            f"'{escape_str(r['disease_group'])}', "
            f"'{escape_str(r['disease'])}', "
            f"'{escape_str(r['sex'])}', "
            f"'{escape_str(r['age_group'])}', "
            f"{to_int_sql(r['yll'])}, "
            f"{to_numeric_sql(r['crude_yll_rate'])}, "
            f"{to_int_sql(r['yld'])}, "
            f"{to_numeric_sql(r['crude_yld_rate'])}, "
            f"{to_int_sql(r['daly'])}, "
            f"{to_numeric_sql(r['crude_daly_rate'])}, "
            f"{to_bigint_sql(r['standard_population'])})"
        )

    body = ",\n".join(rows) + ";\n"

    footer = """
-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_nb_year         ON neurological_burden (data_year);
CREATE INDEX idx_nb_disease      ON neurological_burden (disease);
CREATE INDEX idx_nb_sex          ON neurological_burden (sex);
CREATE INDEX idx_nb_age          ON neurological_burden (age_group);
CREATE INDEX idx_nb_disease_year ON neurological_burden (disease, data_year);

-- =============================================================================
-- Convenience views
-- =============================================================================

-- Graph 1 default: Dementia DALY + crude rate by age group, Persons, 2024
CREATE OR REPLACE VIEW v_dementia_daly_by_age_2024 AS
SELECT age_group, daly, crude_daly_rate
FROM neurological_burden
WHERE disease   = 'Dementia'
  AND sex       = 'Persons'
  AND data_year = 2024
  AND age_group != 'Total'
ORDER BY
    CASE age_group
        WHEN '0'     THEN 0  WHEN '1\u20134'   THEN 1  WHEN '5\u20139'   THEN 2
        WHEN '10\u201314' THEN 3  WHEN '15\u201319' THEN 4  WHEN '20\u201324' THEN 5
        WHEN '25\u201329' THEN 6  WHEN '30\u201334' THEN 7  WHEN '35\u201339' THEN 8
        WHEN '40\u201344' THEN 9  WHEN '45\u201349' THEN 10 WHEN '50\u201354' THEN 11
        WHEN '55\u201359' THEN 12 WHEN '60\u201364' THEN 13 WHEN '65\u201369' THEN 14
        WHEN '70\u201374' THEN 15 WHEN '75\u201379' THEN 16 WHEN '80\u201384' THEN 17
        WHEN '85\u201389' THEN 18 WHEN '90\u201394' THEN 19 WHEN '95\u201399' THEN 20
        WHEN '100+' THEN 21
    END;

-- All neurological diseases: total DALY for Persons, 2024
CREATE OR REPLACE VIEW v_all_neurological_totals_2024 AS
SELECT disease, yll, yld, daly, crude_daly_rate
FROM neurological_burden
WHERE sex       = 'Persons'
  AND data_year = 2024
  AND age_group = 'Total'
ORDER BY daly DESC NULLS LAST;

-- Dementia DALY trend across all study years (Persons, Total age)
CREATE OR REPLACE VIEW v_dementia_daly_trend AS
SELECT data_year, sex, daly, crude_daly_rate, standard_population
FROM neurological_burden
WHERE disease   = 'Dementia'
  AND age_group = 'Total'
ORDER BY data_year, sex;
"""

    return header + body + footer


def write_sql(sql_text, output_path):
    output_path = Path(output_path)
    existed = output_path.exists()
    print(f"[4/4] Writing SQL to:\n       {output_path}")
    if existed:
        print(f"       (overwriting existing file)")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sql_text, encoding="utf-8")
    print(f"       Done. {sql_text.count(chr(10)):,} lines written.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert AIHW BOD 2024 Excel to neurological_burden SQL."
    )
    parser.add_argument("--input",  "-i", default=str(INPUT_DEFAULT),
                        help=f"Excel source file (default: db/Excel/...xlsx)")
    parser.add_argument("--output", "-o", default=str(OUTPUT_DEFAULT),
                        help=f"Output SQL file  (default: db/neurological_burden.sql)")
    return parser.parse_args()


def main():
    args = parse_args()
    df   = load_and_filter(args.input)
    sql  = build_sql(df)
    write_sql(sql, args.output)

    print("\nSummary")
    print("-------")
    print(f"  Input   : {args.input}")
    print(f"  Output  : {args.output}")
    print(f"  Rows    : {len(df):,}")
    print(f"  Years   : {sorted(df['data_year'].unique())}")
    print(f"  Disease : {df['disease'].nunique()} neurological conditions")


if __name__ == "__main__":
    main()
