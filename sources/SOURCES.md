# Data sources

We build the SQLite databases from the CSV files in this folder.

| File | Source | Used in |
| --- | --- | --- |
| `medical_prescription_dataset.csv` | [Medical Prescription Dataset](https://www.kaggle.com/datasets/mmumairkhattak/medical-prescription-dataset) (Kaggle) | `sql/prescriptions.db` |
| `drug_drug_interactions.csv` | [Drug-Drug Interactions](https://www.kaggle.com/datasets/mghobashy/drug-drug-interactions) (Kaggle) | `sql/pharmacy.db` interaction table |
| `pharmacy_catalog.csv` | Stock list made for this project | `sql/pharmacy.db` drug and trade_name tables |
| `drug_side_effects.csv` | Side effects for our stock list | `sql/pharmacy.db` side_effect table |

The original Kaggle files are large. Our files keep the same columns but with a smaller sample for the project.

To rebuild the databases:

```
python3 sql/build_from_sources.py
```
