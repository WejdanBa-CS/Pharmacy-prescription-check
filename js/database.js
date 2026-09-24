var prescriptionsDb = null
var pharmacyDb = null

function sqlEscape(s) {
  return String(s).replace(/'/g, "''")
}

function sqlRows(db, query) {
  var stmt = db.prepare(query)
  var out = []
  while (stmt.step()) out.push(stmt.getAsObject())
  stmt.free()
  return out
}

function sqlValue(db, query) {
  var rows = sqlRows(db, query)
  return rows.length ? rows[0] : null
}

function loadPatients() {
  var pts = sqlRows(
    prescriptionsDb,
    "SELECT patient_id, name, age, gender, diagnosis, hospital, doctor_specialty, prescription_date FROM patient ORDER BY CAST(substr(patient_id, 2) AS INTEGER)"
  )
  return pts.map(function (p) {
    var meds = sqlRows(
      prescriptionsDb,
      "SELECT medicine_name FROM prescription_item WHERE patient_id = '" +
        sqlEscape(p.patient_id) +
        "' ORDER BY item_id"
    )
    return {
      id: p.patient_id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      diagnosis: p.diagnosis,
      hospital: p.hospital,
      specialty: p.doctor_specialty,
      date: p.prescription_date,
      medicines: meds.map(function (m) {
        return m.medicine_name
      }),
    }
  })
}

function findInPharmacy(typed) {
  var q = String(typed).toLowerCase().trim()
  var qsql = sqlEscape(q)
  var row = sqlValue(
    pharmacyDb,
    "SELECT d.scientific_name AS name FROM drug d " +
      "LEFT JOIN trade_name t ON t.scientific_name = d.scientific_name " +
      "WHERE lower(d.scientific_name) = '" +
      qsql +
      "' OR lower(t.trade_name) = '" +
      qsql +
      "' OR instr('" +
      qsql +
      "', lower(t.trade_name)) > 0 OR instr('" +
      qsql +
      "', lower(d.scientific_name)) > 0 LIMIT 1"
  )
  if (!row) return null
  var name = row.name
  var ns = sqlEscape(name)
  var trade = sqlRows(
    pharmacyDb,
    "SELECT trade_name FROM trade_name WHERE scientific_name = '" + ns + "' ORDER BY trade_name"
  )
  var effects = sqlRows(
    pharmacyDb,
    "SELECT effect_text FROM side_effect WHERE scientific_name = '" + ns + "' ORDER BY effect_id"
  )
  return {
    name: name,
    tradeNames: trade.map(function (t) {
      return t.trade_name
    }),
    sideEffects: effects.map(function (e) {
      return e.effect_text
    }),
  }
}

function findInteractions(foundNames) {
  if (foundNames.length < 2) return []
  var list = foundNames
    .map(function (n) {
      return "'" + sqlEscape(n) + "'"
    })
    .join(", ")
  return sqlRows(
    pharmacyDb,
    "SELECT drug1, drug2, description FROM interaction WHERE drug1 IN (" +
      list +
      ") AND drug2 IN (" +
      list +
      ")"
  )
}

function openSqlDatabases(done) {
  initSqlJs().then(function (SQL) {
    prescriptionsDb = new SQL.Database()
    prescriptionsDb.run(PRESCRIPTIONS_SQL)
    pharmacyDb = new SQL.Database()
    pharmacyDb.run(PHARMACY_SQL)
    done()
  })
}
