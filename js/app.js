var picked = null
var unavailable = []

function $(id) {
  return document.getElementById(id)
}

function renderPatients() {
  var box = $("patient-list")
  box.innerHTML = ""
  loadPatients().forEach(function (p) {
    var btn = document.createElement("button")
    btn.type = "button"
    btn.className = "patient" + (picked === p.id ? " patient-on" : "")
    btn.innerHTML =
      "<strong>" +
      escapeText(p.id) +
      " · " +
      escapeText(p.name) +
      "</strong><span>" +
      escapeText(p.diagnosis) +
      " · " +
      escapeText(String(p.age)) +
      " yrs</span>"
    btn.onclick = function () {
      picked = p.id
      $("rx").value = p.medicines.join(", ")
      $("patient-info").textContent =
        p.gender +
        " · " +
        p.hospital +
        " · " +
        p.specialty +
        " · " +
        p.date
      $("slip-meta").textContent = p.id + " · " + p.name
      $("results").innerHTML = emptyResultHtml()
      renderPatients()
    }
    box.appendChild(btn)
  })
}

function emptyResultHtml() {
  return (
    '<div class="empty"><strong>Waiting for a check</strong>' +
    "<span>Pick a patient on the left, then press Check against pharmacy.</span></div>"
  )
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderResults(result) {
  var html = ""
  var i

  if (result.interactions.length > 0) {
    for (i = 0; i < result.interactions.length; i++) {
      var row = result.interactions[i]
      html +=
        '<div class="alert alert-bad"><strong>Drug interaction</strong><br>' +
        escapeText(row.drug1) +
        " + " +
        escapeText(row.drug2) +
        "<br>" +
        escapeText(row.description) +
        "</div>"
    }
  } else if (result.found.length >= 2) {
    html +=
      '<div class="alert"><strong>No interaction in this list</strong><br>The found drugs have no pair in the interaction table.</div>'
  }

  for (i = 0; i < result.missing.length; i++) {
    var name = result.missing[i]
    html +=
      '<div class="card card-bad"><div class="card-head"><span>' +
      escapeText(name) +
      '</span> <span class="badge badge-bad">Not in catalog</span></div>' +
      "<p class=\"muted\">This name is not in pharmacy.db.</p>" +
      '<button type="button" class="btn btn-outline" data-add="' +
      escapeText(name) +
      '">Mark as not available</button></div>'
  }

  for (i = 0; i < result.found.length; i++) {
    var drug = result.found[i]
    var effects = drug.sideEffects
      .map(function (s) {
        return "<li>" + escapeText(s) + "</li>"
      })
      .join("")
    html +=
      '<div class="card"><div class="card-head"><span>' +
      escapeText(drug.name) +
      '</span> <span class="badge">In stock</span></div>' +
      '<div class="meta">' +
      "<div><span class=\"k\">Requested as</span><span>" +
      escapeText(drug.typed) +
      "</span></div>" +
      "<div><span class=\"k\">Active ingredient</span><span>" +
      escapeText(drug.name) +
      "</span></div>" +
      "<div><span class=\"k\">Trade names</span><span>" +
      escapeText(drug.tradeNames.join(", ")) +
      "</span></div>" +
      "</div>" +
      "<p class=\"k\" style=\"margin:12px 0 0;font-family:'Segoe UI',Tahoma,sans-serif;font-size:12px\">Side effects</p><ul>" +
      effects +
      "</ul></div>"
  }

  if (unavailable.length > 0) {
    html +=
      '<div class="alert alert-bad"><strong>Marked as not available</strong><br>' +
      escapeText(unavailable.join(", ")) +
      "</div>"
  }

  $("results").innerHTML = html || emptyResultHtml()

  if (typeof renderMlRisk === "function") {
    renderMlRisk(result)
  }

  var buttons = $("results").querySelectorAll("[data-add]")
  for (i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function () {
      var n = this.getAttribute("data-add")
      var exists = unavailable.some(function (x) {
        return x.toLowerCase() === n.toLowerCase()
      })
      if (!exists) unavailable.push(n)
      renderResults(checkPrescription($("rx").value))
    }
  }
}

function checkNow() {
  var text = $("rx").value
  if (!text.trim()) {
    $("results").innerHTML =
      '<div class="alert"><strong>Empty field</strong><br>Type at least one drug name, or choose a sample patient, then press Check.</div>'
    return
  }
  renderResults(checkPrescription(text))
}

function clearNow() {
  picked = null
  $("rx").value = ""
  $("patient-info").textContent = "Select a case, or type medicine names in the slip."
  $("slip-meta").textContent = "New entry"
  $("results").innerHTML = emptyResultHtml()
  renderPatients()
}

window.onload = function () {
  $("rx-form").onsubmit = function (e) {
    e.preventDefault()
    checkNow()
  }
  $("btn-clear").onclick = clearNow
  openSqlDatabases(function () {
    renderPatients()
    var nP = sqlRows(prescriptionsDb, "SELECT COUNT(*) AS n FROM patient")[0].n
    var nD = sqlRows(pharmacyDb, "SELECT COUNT(*) AS n FROM drug")[0].n
    $("db-pills").innerHTML =
      "<span>prescriptions.db · " +
      nP +
      " patients</span><span>pharmacy.db · " +
      nD +
      " drugs</span>"
  })
}
