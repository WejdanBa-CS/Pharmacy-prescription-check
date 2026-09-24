# Medical Prescription System for Drug-Drug Interaction using OCR and Machine Learning

Section **2800-23**. Supervisor: **Prasanalakshmi Balaji**.

This is our course project. The website checks medicines from a prescription. You can type the names, choose a sample patient, or upload a printed prescription image. The page searches in SQLite databases and shows if the medicine is available, its side effects, and known interactions. There is also a small ML score for medicine pairs.

## Features

- OCR for printed prescription images (Tesseract.js)
- SQL search for trade names and scientific names
- Side effects and drug-drug interaction messages
- ML risk score for pairs (TensorFlow.js)

## Team

- Norah Saeed Alqahtani (445804256)
- Noura Hamad Hasan (445804642)
- Rawan Ali Almeshary (445804606)
- Wejdan Bandar (444820762)
- Zinah Ibrahem Saeed (445804594)

## How to run

Use a local server (needed for OCR and ML):

```
python3 -m http.server 8000
```

Then open http://localhost:8000/ in Chrome.

Sample image: `samples/sample-prescription.png`

Database files:

- `sql/prescriptions.db`
- `sql/pharmacy.db`

Rebuild from CSV:

```
python3 sql/build_from_sources.py
```

## Sources

See `sources/SOURCES.md`.

| File | Origin |
| --- | --- |
| `sources/medical_prescription_dataset.csv` | [Medical Prescription Dataset](https://www.kaggle.com/datasets/mmumairkhattak/medical-prescription-dataset) |
| `sources/drug_drug_interactions.csv` | [Drug-Drug Interactions](https://www.kaggle.com/datasets/mghobashy/drug-drug-interactions) |
| `sources/pharmacy_catalog.csv` | Pharmacy stock list for this project |
| `sources/drug_side_effects.csv` | Side effects for the stock list |

## Databases

- `sql/prescriptions.db` - patients and prescription items
- `sql/pharmacy.db` - drugs, trade names, side effects, interactions

Report images: `images/system-flowchart.png` and `images/database-flowchart.png`.
