# Data sources (attached)

The SQLite databases are built from the CSV files in this folder.

| File | Source | Used in |
| --- | --- | --- |
| `medical_prescription_dataset.csv` | [Medical Prescription Dataset](https://www.kaggle.com/datasets/mmumairkhattak/medical-prescription-dataset) (Kaggle, mmumairkhattak) | `sql/prescriptions.db` |
| `drug_drug_interactions.csv` | [Drug-Drug Interactions](https://www.kaggle.com/datasets/mghobashy/drug-drug-interactions) (Kaggle, MGhobashy / DrugBank text) | `sql/pharmacy.db` table `interaction` |
| `pharmacy_catalog.csv` | Pharmacy stock list prepared for this project (scientific name + trade names used in KSA) | `sql/pharmacy.db` tables `drug`, `trade_name` |
| `drug_side_effects.csv` | Side-effect notes for the catalog drugs | `sql/pharmacy.db` table `side_effect` |

The full Kaggle files are large and need a Kaggle account. These CSVs keep the **same columns** as the published datasets and a **sample of rows** used by the page.

Rebuild the databases:

```
python3 sql/build_from_sources.py
```
