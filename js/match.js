function splitNames(text) {
  return text
    .split(/[,،\n;]+/)
    .map(function (p) {
      return p.trim()
    })
    .filter(function (p) {
      return p.length > 0
    })
}

function checkPrescription(text) {
  var names = splitNames(text)
  var found = []
  var missing = []
  var seen = {}
  var n
  for (n = 0; n < names.length; n++) {
    var typed = names[n]
    var drug = findInPharmacy(typed)
    if (!drug) {
      missing.push(typed)
      continue
    }
    if (seen[drug.name]) continue
    seen[drug.name] = true
    found.push({
      typed: typed,
      name: drug.name,
      tradeNames: drug.tradeNames,
      sideEffects: drug.sideEffects,
    })
  }

  var foundNames = found.map(function (d) {
    return d.name
  })
  return {
    found: found,
    missing: missing,
    interactions: findInteractions(foundNames),
  }
}
