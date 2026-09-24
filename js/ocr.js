var ocrWorkerPromise = null

function setOcrStatus(msg, kind) {
  var el = document.getElementById("ocr-status")
  if (!el) return
  el.textContent = msg || ""
  el.className = "ocr-status" + (kind ? " ocr-" + kind : "")
}

function ocrInit() {
  if (ocrWorkerPromise) return ocrWorkerPromise
  ocrWorkerPromise = Tesseract.createWorker("eng", 1, {
    workerPath: "js/vendor/tesseract/worker.min.js",
    corePath: "js/vendor/tesseract/tesseract-core-simd.wasm.js",
    langPath: "js/vendor/tesseract/",
    logger: function (m) {
      if (m.status === "recognizing text") {
        setOcrStatus("Reading prescription image... " + Math.round(m.progress * 100) + "%", "busy")
      }
    },
  })
  return ocrWorkerPromise
}

function ocrVocabulary() {
  if (!window.pharmacyDb) return []
  var rows = sqlRows(
    pharmacyDb,
    "SELECT trade_name AS n FROM trade_name UNION SELECT scientific_name AS n FROM drug"
  )
  return rows
    .map(function (r) {
      return r.n
    })
    .sort(function (a, b) {
      return b.length - a.length
    })
}

function extractMedicines(text) {
  var vocab = ocrVocabulary()
  var hay = String(text).toLowerCase()
  var byDrug = {}
  var order = []
  vocab.forEach(function (name) {
    if (hay.indexOf(String(name).toLowerCase()) === -1) return
    var info = findInPharmacy(name)
    var key = info ? info.name : name
    if (!(key in byDrug)) {
      byDrug[key] = name
      order.push(key)
    }
  })
  return order.map(function (k) {
    return byDrug[k]
  })
}

function handleOcrImage(file) {
  if (!file) return
  var preview = document.getElementById("ocr-preview")
  if (preview) {
    preview.src = URL.createObjectURL(file)
    preview.hidden = false
  }
  setOcrStatus("Loading OCR engine...", "busy")
  ocrInit()
    .then(function (worker) {
      setOcrStatus("Reading prescription image...", "busy")
      return worker.recognize(file)
    })
    .then(function (res) {
      var text = res && res.data && res.data.text ? res.data.text : ""
      var meds = extractMedicines(text)
      var rx = document.getElementById("rx")
      if (meds.length) {
        rx.value = meds.join(", ")
        setOcrStatus("OCR found " + meds.length + " medicine(s): " + meds.join(", "), "ok")
        if (typeof checkNow === "function") checkNow()
      } else {
        rx.value = String(text).trim()
        setOcrStatus("No catalog medicine matched. Raw text loaded - edit it, then press Check.", "warn")
      }
    })
    .catch(function (e) {
      setOcrStatus("OCR failed: " + (e && e.message ? e.message : e), "warn")
    })
}

document.addEventListener("DOMContentLoaded", function () {
  var input = document.getElementById("rx-image")
  if (input) {
    input.addEventListener("change", function () {
      handleOcrImage(this.files && this.files[0])
    })
  }
  var clear = document.getElementById("btn-clear")
  if (clear) {
    clear.addEventListener("click", function () {
      if (input) input.value = ""
      var preview = document.getElementById("ocr-preview")
      if (preview) {
        preview.hidden = true
        preview.removeAttribute("src")
      }
      setOcrStatus("")
    })
  }
})
