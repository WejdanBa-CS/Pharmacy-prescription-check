# Flowcharts

The flowcharts are image files. They are **not** pages on the website.

## System flowchart

- `images/system-flowchart.png`
- `images/system-flowchart.svg`

Shows the check process: open the page, enter medicines, run SQL on the two databases, then in stock / not available / interaction.

## Database flowchart

- `images/database-flowchart.png`
- `images/database-flowchart.svg`

Two SQLite databases:

**prescriptions.db** — PATIENT, PRESCRIPTION_ITEM

**pharmacy.db** — DRUG, TRADE_NAME, SIDE_EFFECT, INTERACTION

A medicine name in a prescription is matched with a trade name or scientific name in the pharmacy database.
