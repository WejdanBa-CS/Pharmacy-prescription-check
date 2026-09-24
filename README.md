# Medical Prescription System for Drug-Drug Interaction using OCR and Machine Learning

Section **2800-23**. Supervisor: **Prasanna Lakshmi**.

A browser based system that reads a medical prescription — typed or scanned from a **printed image via OCR** — and checks it against two SQLite databases (stock, trade names, side effects, and drug–drug interactions). It combines an SQL rule engine with an in browser **machine learning** model that predicts drug–drug interaction risk from pharmacological features.

## Features

- **OCR**: upload a printed prescription image; medicine names are recognized with Tesseract.js (LSTM neural network) and matched to the catalog.
- **SQL lookup**: trade name → active ingredient, side effects, and known interactions from `pharmacy.db`.
- **Machine learning**: a TensorFlow.js neural network trained in the browser on drug-feature pairs, predicting interaction risk (and generalizing to pairs not in the rule table).

## Team

- Norah Saeed Alqahtani (445804256)
- Noura Hamad Hasan (445804642)
- Rawan Ali Almeshary (445804606)
- Wejdan Bandar (444820762)
- Zinah Ibrahem Saeed (445804594)

## How to run

The OCR and ML features use WebAssembly and Web Workers, so the page must be served over HTTP (not opened directly with `file://`). From the project folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/ in Chrome. Keep `css`, `js`, `sql`, `sources`, and `samples` next to `index.html`. A printed sample prescription is provided at `samples/sample-prescription.png`.

Inspect the databases with [DB Browser for SQLite](https://sqlitebrowser.org/): `sql/prescriptions.db` and `sql/pharmacy.db`.

Rebuild from the attached CSVs:

```
python3 sql/build_from_sources.py
```

## Sources (attached)

See `sources/SOURCES.md`.

| File | Origin |
| --- | --- |
| `sources/medical_prescription_dataset.csv` | [Medical Prescription Dataset](https://www.kaggle.com/datasets/mmumairkhattak/medical-prescription-dataset) |
| `sources/drug_drug_interactions.csv` | [Drug-Drug Interactions](https://www.kaggle.com/datasets/mghobashy/drug-drug-interactions) |
| `sources/pharmacy_catalog.csv` | Pharmacy stock (scientific name + trade name) |
| `sources/drug_side_effects.csv` | Side effects for catalog drugs |

## SQL databases

- `sql/prescriptions.db` — PATIENT, PRESCRIPTION_ITEM
- `sql/pharmacy.db` — DRUG, TRADE_NAME, SIDE_EFFECT, INTERACTION

Flowchart images: `images/system-flowchart.png`, `images/database-flowchart.png`.
