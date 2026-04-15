"""
excel_to_sql_dementia_prevalence.py
--------------------------------------
Converts AIHW-DEM-02-S2-Prevalence.xlsx into a PostgreSQL-compatible SQL file
for the dementia_prevalence table.

Two sheets are combined via an inner join on year:
  S2.4 — estimated number by sex   (Men, Women, Persons)  2010-2065
  S2.5 — estimated number by age   (30-64, 65-84, 85+)    2010-2065

Expected folder layout (relative to this script)
-------------------------------------------------
  db/
  ├── Excel/
  │   └── AIHW-DEM-02-S2-Prevalence.xlsx
  ├── scripts/
  │   └── excel_to_sql_dementia_prevalence.py    ← this file
  └── dementia_prevalence.sql                    ← written/overwritten here

Sheet layout (both sheets identical)
-------------------------------------
  Row 0  : Table title     (skipped)
  Row 1  : Group headers   (skipped)
  Row 2  : Column labels   (skipped)
  Row 3–58: 56 data rows, years 2010-2065
  Row 59+: Notes/footer    (skipped via nrows=56)

Usage
-----
    python db/scripts/excel_to_sql_dementia_prevalence.py

    python db/scripts/excel_to_sql_dementia_prevalence.py \\
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
INPUT_DEFAULT   = EXCEL_DIR / "AIHW-DEM-02-S2-Prevalence.xlsx"
OUTPUT_DEFAULT  = DB_DIR / "dementia_prevalence.sql"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SHEET_S24       = "S2.4"
SHEET_S25       = "S2.5"
SKIP_ROWS       = 3
DATA_ROWS       = 56
EXPECTED_ROWS   = 56

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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


def is_year(val):
    try:
        y = int(float(str(val).strip()))
        return 1900 <= y <= 2200
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# Load and clean one sheet
# ---------------------------------------------------------------------------

def load_sheet(xl, sheet_name, col_names):
    df = pd.read_excel(xl, sheet_name=sheet_name, header=None,
                       skiprows=SKIP_ROWS, nrows=DATA_ROWS)
    df.columns = col_names
    df = df[df["year"].apply(is_year)].copy()
    df = df.astype(int)
    return df


# ---------------------------------------------------------------------------
# Build SQL
# ---------------------------------------------------------------------------

def build_sql(merged):
    print("[4/5] Building SQL...")

    header = """\
-- =============================================================================
-- dementia_prevalence.sql
-- =============================================================================
-- Source  : AIHW Dementia in Australia supplementary data tables (AIHW-DEM-02)
-- Sheets  : S2.4 (by sex: Men, Women, Persons)
--           S2.5 (by age: 30-64, 65-84, 85+)
--           Joined on year (inner join)
-- URL     : https://www.aihw.gov.au/reports/dementia/dementia-in-aus/data
-- Years   : 2010 to 2065  (56 rows)
--
-- Notes
-- -----
-- * Rows 2010-2024 are AIHW historical estimates
-- * Rows 2025-2065 are projections (ABS medium series population, ABS 2023)
-- * persons is the total from S2.4; not the sum of age columns
-- * age columns (S2.5) may not sum to persons due to independent modelling
-- =============================================================================

DROP TABLE IF EXISTS dementia_prevalence CASCADE;

CREATE TABLE dementia_prevalence (
    year          SMALLINT    NOT NULL PRIMARY KEY,

    -- From S2.4: estimated number by sex
    men           INTEGER     NOT NULL,
    women         INTEGER     NOT NULL,
    persons       INTEGER     NOT NULL,

    -- From S2.5: estimated number by age group
    age_30_64     INTEGER     NOT NULL,
    age_65_84     INTEGER     NOT NULL,
    age_85_plus   INTEGER     NOT NULL
);

INSERT INTO dementia_prevalence
    (year, men, women, persons, age_30_64, age_65_84, age_85_plus)
VALUES
"""

    rows = []
    for _, r in merged.iterrows():
        rows.append(
            f"    ({to_int_sql(r['year'])}, "
            f"{to_int_sql(r['men'])}, "
            f"{to_int_sql(r['women'])}, "
            f"{to_int_sql(r['persons'])}, "
            f"{to_int_sql(r['age_30_64'])}, "
            f"{to_int_sql(r['age_65_84'])}, "
            f"{to_int_sql(r['age_85_plus'])})"
        )

    body = ",\n".join(rows) + ";\n"

    footer = """
-- =============================================================================
-- Convenience views
-- =============================================================================

-- Graph 3a: prevalence by sex — Men / Women / Persons line chart
CREATE OR REPLACE VIEW v_prevalence_by_sex AS
SELECT year, men, women, persons
FROM dementia_prevalence
ORDER BY year;

-- Graph 3b: prevalence by age group line chart
CREATE OR REPLACE VIEW v_prevalence_by_age AS
SELECT year, age_30_64, age_65_84, age_85_plus
FROM dementia_prevalence
ORDER BY year;

-- Projection years only (2025-2065)
CREATE OR REPLACE VIEW v_prevalence_projections AS
SELECT year, men, women, persons, age_30_64, age_65_84, age_85_plus
FROM dementia_prevalence
WHERE year >= 2025
ORDER BY year;

-- Historical estimates only (2010-2024)
CREATE OR REPLACE VIEW v_prevalence_historical AS
SELECT year, men, women, persons, age_30_64, age_65_84, age_85_plus
FROM dementia_prevalence
WHERE year <= 2024
ORDER BY year;
"""

    return header + body + footer


# ---------------------------------------------------------------------------
# Main ETL logic
# ---------------------------------------------------------------------------

def run(input_path, output_path):
    input_path  = Path(input_path)
    output_path = Path(output_path)

    print(f"[1/5] Opening workbook:\n       {input_path}")
    try:
        xl = pd.ExcelFile(input_path)
    except FileNotFoundError:
        sys.exit(f"ERROR: File not found: {input_path}")
    except Exception as e:
        sys.exit(f"ERROR: Could not open Excel file: {e}")

    for required in [SHEET_S24, SHEET_S25]:
        if required not in xl.sheet_names:
            sys.exit(f"ERROR: Sheet '{required}' not found. Available: {xl.sheet_names}")

    print(f"[2/5] Reading sheet '{SHEET_S24}' (by sex: Men, Women, Persons)...")
    df_sex = load_sheet(xl, SHEET_S24, ["year", "men", "women", "persons"])
    print(f"       Rows: {len(df_sex)}  |  Years: {df_sex['year'].min()}-{df_sex['year'].max()}")

    print(f"[3/5] Reading sheet '{SHEET_S25}' (by age: 30-64, 65-84, 85+)...")
    df_age = load_sheet(xl, SHEET_S25, ["year", "age_30_64", "age_65_84", "age_85_plus"])
    print(f"       Rows: {len(df_age)}  |  Years: {df_age['year'].min()}-{df_age['year'].max()}")

    merged = pd.merge(df_sex, df_age, on="year", how="inner")
    print(f"       Rows after inner join on year: {len(merged)}")

    if len(merged) != EXPECTED_ROWS:
        print(f"WARNING: Expected {EXPECTED_ROWS} rows, got {len(merged)}. Proceeding anyway.")

    missing_years = [y for y in range(2010, 2066) if y not in merged["year"].tolist()]
    if missing_years:
        print(f"WARNING: Missing years: {missing_years}")

    sql = build_sql(merged)

    existed = output_path.exists()
    print(f"[5/5] Writing SQL to:\n       {output_path}")
    if existed:
        print("       (overwriting existing file)")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sql, encoding="utf-8")
    print(f"       Done. {sql.count(chr(10)):,} lines written.")

    print("\nSummary")
    print("-------")
    print(f"  Input       : {input_path}")
    print(f"  Output      : {output_path}")
    print(f"  Rows        : {len(merged)}")
    print(f"  Year range  : {merged['year'].min()} to {merged['year'].max()}")
    print(f"  Historical  : {merged[merged['year'] <= 2024]['year'].count()} rows (2010-2024)")
    print(f"  Projections : {merged[merged['year'] >= 2025]['year'].count()} rows (2025-2065)")
    print(f"  2025 persons: {merged.loc[merged['year'] == 2025, 'persons'].values[0]:,}")
    print(f"  2065 persons: {merged.loc[merged['year'] == 2065, 'persons'].values[0]:,}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert AIHW-DEM-02-S2 Excel to dementia_prevalence SQL."
    )
    parser.add_argument("--input",  "-i", default=str(INPUT_DEFAULT),
                        help="Excel source file (default: db/Excel/...xlsx)")
    parser.add_argument("--output", "-o", default=str(OUTPUT_DEFAULT),
                        help="Output SQL file  (default: db/dementia_prevalence.sql)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(args.input, args.output)
