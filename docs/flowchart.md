# Flowcharts

These images are for the report only. They are not pages in the website.

## System flowchart

Files:

- `images/system-flowchart.png`
- `images/system-flowchart.svg`

This image shows the check steps: open the page, enter medicines, run SQL, then show found / not available / interaction.

## Database flowchart

Files:

- `images/database-flowchart.png`
- `images/database-flowchart.svg`

We have two SQLite databases:

- `prescriptions.db` has PATIENT and PRESCRIPTION_ITEM
- `pharmacy.db` has DRUG, TRADE_NAME, SIDE_EFFECT, and INTERACTION

A medicine name from the prescription is matched with a trade name or a scientific name in the pharmacy database.
