"""
excel_to_sql_dementia_mortality.py
-------------------------------------
Converts AIHW-DEM-02-S3-Mortality.xlsx (sheet S3.3) into a PostgreSQL-
compatible SQL file for the dementia_mortality table.

Expected folder layout (relative to this script)
-------------------------------------------------
  db/
  ├── Excel/
  │   └── AIHW-DEM-02-S3-Mortality.xlsx
  ├── scripts/
  │   └── excel_to_sql_dementia_mortality.py     ← this file
  └── dementia_mortality.sql                     ← written/overwritten here

Sheet layout (S3.3)
-------------------
  Row 0  : Table title                              (skipped)
  Row 1  : Three group headers (deaths / ASR / crude rate)
                                                   (skipped)
  Row 2  : Sub-column labels NaN|Men|Women|Persons (x3)
                                                   (skipped)
  Row 3–17: 15 data rows, years 2009-2023
  Row 18+: Notes and footer                        (skipped via nrows=15)

Column mapping (after skiprows=3, nrows=15)
  col 0 : year
  col 1 : deaths_men      col 2 : deaths_women    col 3 : deaths_persons
  col 4 : asr_men         col 5 : asr_women        col 6 : asr_persons
  col 7 : crude_men       col 8 : crude_women      col 9 : crude_persons

Usage
-----
    python db/scripts/excel_to_sql_dementia_mortality.py

    python db/scripts/excel_to_sql_dementia_mortality.py \\
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
INPUT_DEFAULT   = EXCEL_DIR / "AIHW-DEM-02-S3-Mortality.xlsx"
OUTPUT_DEFAULT  = DB_DIR / "dementia_mortality.sql"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SHEET_NAME      = "S3.3"
SKIP_ROWS       = 3
DATA_ROWS       = 15
EXPECTED_ROWS   = 15

COLUMN_NAMES = [
    "year",
    "deaths_men",   "deaths_women",   "deaths_persons",
    "asr_men",      "asr_women",      "asr_persons",
    "crude_men",    "crude_women",    "crude_persons",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_year(val):
    try:
        y = int(float(str(val).strip()))
        return 1900 <= y <= 2200
    except (ValueError, TypeError):
        return False


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


def to_numeric_sql(val, precision=6):
    if val is None:
        return "NULL"
    try:
        f = float(val)
        if f != f:
            return "NULL"
        return f"{f:.{precision}f}"
    except (ValueError, TypeError):
        return "NULL"


# ---------------------------------------------------------------------------
# Build SQL
# ---------------------------------------------------------------------------

def build_sql(df):
    print("[3/4] Building SQL...")

    header = """\
-- =============================================================================
-- dementia_mortality.sql
-- =============================================================================
-- Source  : AIHW Dementia in Australia supplementary data tables (AIHW-DEM-02)
-- Sheet   : S3.3 — Deaths due to dementia: number, age-standardised and
--           crude rates by sex, 2009 to 2023
-- URL     : https://www.aihw.gov.au/reports/dementia/dementia-in-aus/data
-- Years   : 2009 to 2023  (15 rows)
--
-- Notes
-- -----
-- * asr_* rates are age-standardised to the 2001 Australian Standard
--   Population by 5-year age group up to 95+, per 100,000 population
-- * crude_* rates are per 100,000 population
-- * Rate columns use NUMERIC(8,6) to preserve full source precision
-- * Based on underlying cause of death only (not associated causes)
-- * 2021 = revised ABS version; 2022-2023 = preliminary (subject to revision)
-- =============================================================================

DROP TABLE IF EXISTS dementia_mortality CASCADE;

CREATE TABLE dementia_mortality (
    year             SMALLINT       NOT NULL PRIMARY KEY,

    -- Number of deaths
    deaths_men       INTEGER        NOT NULL,
    deaths_women     INTEGER        NOT NULL,
    deaths_persons   INTEGER        NOT NULL,

    -- Age-standardised rate (per 100,000 population)
    asr_men          NUMERIC(8,6)   NOT NULL,
    asr_women        NUMERIC(8,6)   NOT NULL,
    asr_persons      NUMERIC(8,6)   NOT NULL,

    -- Crude rate (per 100,000 population)
    crude_men        NUMERIC(8,6)   NOT NULL,
    crude_women      NUMERIC(8,6)   NOT NULL,
    crude_persons    NUMERIC(8,6)   NOT NULL
);

INSERT INTO dementia_mortality (
    year,
    deaths_men,    deaths_women,    deaths_persons,
    asr_men,       asr_women,       asr_persons,
    crude_men,     crude_women,     crude_persons
)
VALUES
"""

    rows = []
    for _, r in df.iterrows():
        rows.append(
            f"    ({to_int_sql(r['year'])}, "
            f"{to_int_sql(r['deaths_men'])}, "
            f"{to_int_sql(r['deaths_women'])}, "
            f"{to_int_sql(r['deaths_persons'])}, "
            f"{to_numeric_sql(r['asr_men'])}, "
            f"{to_numeric_sql(r['asr_women'])}, "
            f"{to_numeric_sql(r['asr_persons'])}, "
            f"{to_numeric_sql(r['crude_men'])}, "
            f"{to_numeric_sql(r['crude_women'])}, "
            f"{to_numeric_sql(r['crude_persons'])})"
        )

    body = ",\n".join(rows) + ";\n"

    footer = """
-- =============================================================================
-- Convenience views
-- =============================================================================

-- Graph 4 default: age-standardised rate by sex
CREATE OR REPLACE VIEW v_mortality_asr_by_sex AS
SELECT year, asr_men, asr_women, asr_persons
FROM dementia_mortality
ORDER BY year;

-- Death counts by sex
CREATE OR REPLACE VIEW v_mortality_deaths_by_sex AS
SELECT year, deaths_men, deaths_women, deaths_persons
FROM dementia_mortality
ORDER BY year;

-- Crude rates by sex
CREATE OR REPLACE VIEW v_mortality_crude_by_sex AS
SELECT year, crude_men, crude_women, crude_persons
FROM dementia_mortality
ORDER BY year;
"""

    return header + body + footer


# ---------------------------------------------------------------------------
# Main ETL logic
# ---------------------------------------------------------------------------

def run(input_path, output_path):
    input_path  = Path(input_path)
    output_path = Path(output_path)

    print(f"[1/4] Opening workbook:\n       {input_path}")
    try:
        xl = pd.ExcelFile(input_path)
    except FileNotFoundError:
        sys.exit(f"ERROR: File not found: {input_path}")
    except Exception as e:
        sys.exit(f"ERROR: Could not open Excel file: {e}")

    if SHEET_NAME not in xl.sheet_names:
        sys.exit(f"ERROR: Sheet '{SHEET_NAME}' not found. Available: {xl.sheet_names}")

    print(f"[2/4] Reading sheet '{SHEET_NAME}'...")
    df = pd.read_excel(xl, sheet_name=SHEET_NAME, header=None,
                       skiprows=SKIP_ROWS, nrows=DATA_ROWS)
    df.columns = COLUMN_NAMES
    df = df[df["year"].apply(is_year)].copy()

    df["year"] = df["year"].astype(int)
    for col in ["deaths_men", "deaths_women", "deaths_persons"]:
        df[col] = pd.to_numeric(df[col]).astype(int)
    for col in ["asr_men", "asr_women", "asr_persons",
                "crude_men", "crude_women", "crude_persons"]:
        df[col] = pd.to_numeric(df[col])

    print(f"       Rows: {len(df)}  |  Years: {df['year'].min()}-{df['year'].max()}")

    if len(df) != EXPECTED_ROWS:
        print(f"WARNING: Expected {EXPECTED_ROWS} rows, got {len(df)}. Proceeding anyway.")

    sql = build_sql(df)

    existed = output_path.exists()
    print(f"[4/4] Writing SQL to:\n       {output_path}")
    if existed:
        print("       (overwriting existing file)")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sql, encoding="utf-8")
    print(f"       Done. {sql.count(chr(10)):,} lines written.")

    print("\nSummary")
    print("-------")
    print(f"  Input        : {input_path}")
    print(f"  Output       : {output_path}")
    print(f"  Rows         : {len(df)}")
    print(f"  Year range   : {df['year'].min()} to {df['year'].max()}")
    print(f"  Deaths range : {df['deaths_persons'].min():,} (2009) "
          f"to {df['deaths_persons'].max():,} (peak year)")
    print(f"  ASR range    : {df['asr_persons'].min():.3f} "
          f"to {df['asr_persons'].max():.3f} per 100,000 (persons)")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert AIHW-DEM-02-S3 Excel to dementia_mortality SQL."
    )
    parser.add_argument("--input",  "-i", default=str(INPUT_DEFAULT),
                        help="Excel source file (default: db/Excel/...xlsx)")
    parser.add_argument("--output", "-o", default=str(OUTPUT_DEFAULT),
                        help="Output SQL file  (default: db/dementia_mortality.sql)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(args.input, args.output)
