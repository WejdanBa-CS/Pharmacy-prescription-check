-- SQL used by the check page (after import from sources/)

SELECT patient_id, name, age, gender, diagnosis, hospital, doctor_specialty, prescription_date
FROM patient
ORDER BY CAST(substr(patient_id, 2) AS INTEGER);

SELECT medicine_name, dosage, frequency, duration, route
FROM prescription_item
WHERE patient_id = 'P1'
ORDER BY item_id;

SELECT d.scientific_name
FROM drug d
LEFT JOIN trade_name t ON t.scientific_name = d.scientific_name
WHERE lower(d.scientific_name) = lower('Panadol')
   OR lower(t.trade_name) = lower('Panadol')
   OR instr(lower('Panadol'), lower(t.trade_name)) > 0
LIMIT 1;

SELECT trade_name FROM trade_name WHERE scientific_name = 'Paracetamol';
SELECT effect_text FROM side_effect WHERE scientific_name = 'Paracetamol';

SELECT drug1, drug2, description
FROM interaction
WHERE drug1 IN ('Ibuprofen', 'Warfarin', 'Aspirin')
  AND drug2 IN ('Ibuprofen', 'Warfarin', 'Aspirin');
