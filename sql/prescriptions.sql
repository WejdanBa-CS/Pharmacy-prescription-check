-- Built from sources/medical_prescription_dataset.csv
PRAGMA foreign_keys = ON;

CREATE TABLE patient (
  patient_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  hospital TEXT NOT NULL,
  doctor_specialty TEXT NOT NULL,
  prescription_date TEXT NOT NULL
);

CREATE TABLE prescription_item (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  route TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
);

INSERT INTO patient (patient_id, name, age, gender, diagnosis, hospital, doctor_specialty, prescription_date) VALUES
  ('P1', 'Ahmed Ali', 32, 'Male', 'Fever and sinus infection', 'King Fahd Clinic', 'General Practice', '2026-02-03'),
  ('P2', 'Fatimah Hassan', 61, 'Female', 'Joint pain and blood thinner', 'Riyadh Medical Center', 'Rheumatology', '2026-02-08'),
  ('P3', 'Khalid Mohammed', 54, 'Male', 'Diabetes, blood pressure, cholesterol', 'Jeddah General Hospital', 'Internal Medicine', '2026-01-22'),
  ('P4', 'Noura Saad', 27, 'Female', 'Infection with pain', 'Al Ahsa Clinic', 'General Practice', '2026-03-01'),
  ('P5', 'Sara Ahmed', 19, 'Female', 'Allergy', 'King Fahd Clinic', 'Dermatology', '2026-03-11'),
  ('P6', 'Omar Saleh', 45, 'Male', 'Stomach burn with pain', 'Dammam Hospital', 'Gastroenterology', '2026-03-14'),
  ('P7', 'Layla Ibrahim', 70, 'Female', 'Heart rhythm and blood thinner', 'Riyadh Medical Center', 'Cardiology', '2026-03-18'),
  ('P8', 'Hassan Yusuf', 38, 'Male', 'Asthma flare', 'Jeddah General Hospital', 'Pulmonology', '2026-03-20'),
  ('P9', 'Maryam Fahad', 29, 'Female', 'Urinary infection', 'Al Ahsa Clinic', 'Urology', '2026-03-21'),
  ('P10', 'Abdullah Nasser', 66, 'Male', 'After heart stent', 'King Fahd Clinic', 'Cardiology', '2026-03-25');

INSERT INTO prescription_item (patient_id, medicine_name, dosage, frequency, duration, route) VALUES
  ('P1', 'Panadol', '500 mg', 'Three times daily', '5 days', 'Oral'),
  ('P1', 'Augmentin', '625 mg', 'Twice daily', '7 days', 'Oral'),
  ('P1', 'Ventolin', '100 mcg', 'As needed', '14 days', 'Inhalation'),
  ('P2', 'Brufen', '400 mg', 'Twice daily', '10 days', 'Oral'),
  ('P2', 'Marevan', '5 mg', 'Once daily', '30 days', 'Oral'),
  ('P2', 'Aspirin', '81 mg', 'Once daily', '30 days', 'Oral'),
  ('P3', 'Glucophage', '500 mg', 'Twice daily', '30 days', 'Oral'),
  ('P3', 'Lipitor', '20 mg', 'Once daily', '30 days', 'Oral'),
  ('P3', 'Norvasc', '5 mg', 'Once daily', '30 days', 'Oral'),
  ('P4', 'Adol', '500 mg', 'Three times daily', '5 days', 'Oral'),
  ('P4', 'Flagyl', '500 mg', 'Three times daily', '7 days', 'Oral'),
  ('P4', 'Xanax', '0.5 mg', 'At bedtime', '7 days', 'Oral'),
  ('P5', 'Zyrtec', '10 mg', 'Once daily', '14 days', 'Oral'),
  ('P6', 'Losec', '20 mg', 'Once daily', '14 days', 'Oral'),
  ('P6', 'Brufen', '400 mg', 'Twice daily', '5 days', 'Oral'),
  ('P7', 'Marevan', '3 mg', 'Once daily', '30 days', 'Oral'),
  ('P7', 'Concor', '5 mg', 'Once daily', '30 days', 'Oral'),
  ('P8', 'Ventolin', '100 mcg', 'As needed', '14 days', 'Inhalation'),
  ('P8', 'Prednisolone', '20 mg', 'Once daily', '5 days', 'Oral'),
  ('P9', 'Augmentin', '625 mg', 'Twice daily', '7 days', 'Oral'),
  ('P9', 'Flagyl', '500 mg', 'Twice daily', '5 days', 'Oral'),
  ('P10', 'Plavix', '75 mg', 'Once daily', '30 days', 'Oral'),
  ('P10', 'Aspirin', '81 mg', 'Once daily', '30 days', 'Oral'),
  ('P10', 'Lipitor', '40 mg', 'Once daily', '30 days', 'Oral');
