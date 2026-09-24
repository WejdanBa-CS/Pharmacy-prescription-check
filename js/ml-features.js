// Drug features used by the ML model (1 = yes, missing = 0).

var ML_FEATURE_COLUMNS = [
  "anticoagulant",
  "antiplatelet",
  "nsaid",
  "statin",
  "corticosteroid",
  "cyp3a4_inhibitor",
  "cyp3a4_substrate",
  "cyp2c9_substrate",
  "cyp2c9_inhibitor",
  "cyp2c19_substrate",
  "cyp2c19_inhibitor",
  "qt_prolonging",
  "antihypertensive",
  "antibiotic",
  "ppi",
  "cns_depressant",
  "beta_blocker",
  "bronchodilator",
  "increases_bleeding_risk",
  "gi_irritant",
  "antidiabetic",
]

// Only list features that are on (=1). Others are treated as 0.
var DRUG_FEATURE_FLAGS = {
  Paracetamol: ["increases_bleeding_risk"],
  Ibuprofen: ["nsaid", "cyp2c9_substrate", "increases_bleeding_risk", "gi_irritant"],
  Warfarin: [
    "anticoagulant",
    "cyp2c9_substrate",
    "cyp2c19_substrate",
    "cyp3a4_substrate",
    "increases_bleeding_risk",
  ],
  Aspirin: ["antiplatelet", "nsaid", "increases_bleeding_risk", "gi_irritant"],
  Metformin: ["antidiabetic"],
  Atorvastatin: ["statin", "cyp3a4_substrate"],
  Amlodipine: ["antihypertensive", "cyp3a4_substrate", "cyp3a4_inhibitor"],
  Omeprazole: ["ppi", "cyp2c19_inhibitor"],
  "Amoxicillin/Clavulanate": ["antibiotic", "increases_bleeding_risk"],
  Azithromycin: ["antibiotic", "cyp3a4_inhibitor", "qt_prolonging"],
  Metronidazole: ["antibiotic", "cyp2c9_inhibitor", "increases_bleeding_risk"],
  Salbutamol: ["bronchodilator"],
  Cetirizine: ["cns_depressant"],
  Clopidogrel: ["antiplatelet", "cyp2c19_substrate", "increases_bleeding_risk"],
  Bisoprolol: ["beta_blocker", "antihypertensive"],
  Prednisolone: ["corticosteroid", "gi_irritant"],
  Clarithromycin: ["antibiotic", "cyp3a4_inhibitor", "qt_prolonging"],
  Lorazepam: ["cns_depressant"],
  Simvastatin: ["statin", "cyp3a4_substrate"],
  Lisinopril: ["antihypertensive"],
  Levothyroxine: [],
  Amoxicillin: ["antibiotic"],
  Ciprofloxacin: ["antibiotic", "qt_prolonging"],
  Furosemide: ["antihypertensive"],
  Pantoprazole: ["ppi"],
  Gliclazide: ["antidiabetic"],
}

// Scientific names used for training.
var ML_DRUGS = Object.keys(DRUG_FEATURE_FLAGS)

function drugFeatureVector(name) {
  var flags = DRUG_FEATURE_FLAGS[name] || []
  var set = {}
  var i
  for (i = 0; i < flags.length; i++) set[flags[i]] = true
  var vec = []
  for (i = 0; i < ML_FEATURE_COLUMNS.length; i++) {
    vec.push(set[ML_FEATURE_COLUMNS[i]] ? 1 : 0)
  }
  return vec
}

function hasDrugFeatures(name) {
  return Object.prototype.hasOwnProperty.call(DRUG_FEATURE_FLAGS, name)
}
