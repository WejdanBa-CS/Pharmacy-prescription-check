// In-browser drug-drug interaction (DDI) predictor built and trained with
// TensorFlow.js. This is an ADDITIVE machine-learning layer: the existing
// rule-based interaction lookup (findInteractions / renderResults) keeps
// working untouched. The model learns interaction probability from curated
// pharmacological features (js/ml-features.js) so it can flag risky pairs
// even when that exact pair is absent from the SQL interaction table.

var mlModel = null
var mlReady = false
var mlAccuracy = null
var mlTrainingPromise = null

// --- Feature engineering ---------------------------------------------------

// Order-invariant pair encoding: concatenate element-wise OR and AND of the
// two drugs' binary feature vectors. OR captures "this trait is present in the
// pair", AND captures "both drugs share this trait". The dense layers can then
// combine OR bits (e.g. OR(cyp3a4_inhibitor) with OR(cyp3a4_substrate)) to
// learn inhibitor-meets-substrate style interactions regardless of drug order.
function pairFeatureVector(nameA, nameB) {
  var a = drugFeatureVector(nameA)
  var b = drugFeatureVector(nameB)
  var orv = []
  var andv = []
  var i
  for (i = 0; i < a.length; i++) {
    orv.push(a[i] || b[i] ? 1 : 0)
    andv.push(a[i] && b[i] ? 1 : 0)
  }
  return orv.concat(andv)
}

// --- Labels from the SQL interaction table ---------------------------------

// Hardcoded fallback in case the DB is not reachable. Prefer deriving at
// runtime (getInteractionPairSet) so labels stay in sync with pharmacy.db.
var ML_FALLBACK_POSITIVE_PAIRS = [
  ["Ibuprofen", "Warfarin"],
  ["Aspirin", "Warfarin"],
  ["Ibuprofen", "Aspirin"],
  ["Metronidazole", "Warfarin"],
  ["Azithromycin", "Warfarin"],
  ["Amlodipine", "Atorvastatin"],
  ["Omeprazole", "Warfarin"],
  ["Paracetamol", "Warfarin"],
  ["Clopidogrel", "Omeprazole"],
  ["Clopidogrel", "Aspirin"],
  ["Prednisolone", "Aspirin"],
  ["Bisoprolol", "Amlodipine"],
  ["Metformin", "Prednisolone"],
  ["Ibuprofen", "Prednisolone"],
  ["Atorvastatin", "Clarithromycin"],
  ["Warfarin", "Amoxicillin/Clavulanate"],
  ["Cetirizine", "Lorazepam"],
  ["Salbutamol", "Bisoprolol"],
]

function pairKey(a, b) {
  return a < b ? a + "||" + b : b + "||" + a
}

function getInteractionPairSet() {
  var set = {}
  var rows = null
  try {
    if (typeof pharmacyDb !== "undefined" && pharmacyDb) {
      rows = sqlRows(pharmacyDb, "SELECT drug1, drug2 FROM interaction")
    }
  } catch (e) {
    rows = null
  }
  if (rows && rows.length) {
    rows.forEach(function (r) {
      set[pairKey(r.drug1, r.drug2)] = true
    })
  } else {
    ML_FALLBACK_POSITIVE_PAIRS.forEach(function (p) {
      set[pairKey(p[0], p[1])] = true
    })
  }
  return set
}

// Build the full training set: all unordered pairs of the 26 drugs (325 rows).
function buildTrainingData() {
  var positives = getInteractionPairSet()
  var xs = []
  var ys = []
  var i, j
  for (i = 0; i < ML_DRUGS.length; i++) {
    for (j = i + 1; j < ML_DRUGS.length; j++) {
      var a = ML_DRUGS[i]
      var b = ML_DRUGS[j]
      xs.push(pairFeatureVector(a, b))
      ys.push(positives[pairKey(a, b)] ? 1 : 0)
    }
  }
  return { xs: xs, ys: ys }
}

// --- Model definition + training -------------------------------------------

function buildModel(inputDim) {
  var model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [inputDim], units: 16, activation: "relu" }))
  model.add(tf.layers.dense({ units: 8, activation: "relu" }))
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }))
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  })
  return model
}

function trainInteractionModel(onStatus) {
  if (mlTrainingPromise) return mlTrainingPromise

  var data = buildTrainingData()
  var nPos = data.ys.reduce(function (s, v) {
    return s + v
  }, 0)
  var nTotal = data.ys.length
  var nNeg = nTotal - nPos
  var inputDim = data.xs[0].length

  if (onStatus) {
    onStatus("training", "ML model: training… (" + nPos + " positive / " + nTotal + " pairs)")
  }
  console.log(
    "[ML-DDI] Training on " +
      nTotal +
      " unordered drug pairs (" +
      nPos +
      " positive interactions), input dim = " +
      inputDim
  )

  // Class weighting handles the heavy imbalance (only ~18 positives).
  var classWeight = {
    0: nTotal / (2 * Math.max(1, nNeg)),
    1: nTotal / (2 * Math.max(1, nPos)),
  }

  var xsT = tf.tensor2d(data.xs)
  var ysT = tf.tensor2d(data.ys, [data.ys.length, 1])
  mlModel = buildModel(inputDim)

  mlTrainingPromise = mlModel
    .fit(xsT, ysT, {
      epochs: 250,
      batchSize: 32,
      shuffle: true,
      classWeight: classWeight,
      verbose: 0,
      callbacks: {
        onEpochEnd: function (epoch, logs) {
          if ((epoch + 1) % 50 === 0 || epoch === 0) {
            console.log(
              "[ML-DDI] epoch " +
                (epoch + 1) +
                " — loss " +
                logs.loss.toFixed(4) +
                ", acc " +
                (logs.acc !== undefined ? logs.acc : logs.accuracy).toFixed(4)
            )
          }
        },
      },
    })
    .then(function (history) {
      var accArr = history.history.acc || history.history.accuracy
      var finalAcc = accArr[accArr.length - 1]
      var finalLoss = history.history.loss[history.history.loss.length - 1]
      mlAccuracy = finalAcc
      mlReady = true
      xsT.dispose()
      ysT.dispose()
      console.log(
        "[ML-DDI] Training complete — final loss " +
          finalLoss.toFixed(4) +
          ", final accuracy " +
          (finalAcc * 100).toFixed(1) +
          "%"
      )
      // Sanity check: report how the known positives score.
      try {
        var knownProbs = ML_FALLBACK_POSITIVE_PAIRS.map(function (p) {
          return predictInteraction(p[0], p[1])
        })
        var meanKnown =
          knownProbs.reduce(function (s, v) {
            return s + v
          }, 0) / knownProbs.length
        console.log(
          "[ML-DDI] Mean predicted probability on known interaction pairs: " +
            meanKnown.toFixed(3)
        )
      } catch (e) {}
      if (onStatus) {
        onStatus(
          "trained",
          "ML model: trained (acc " + Math.round(finalAcc * 100) + "%)"
        )
      }
      return { accuracy: finalAcc, loss: finalLoss }
    })
    .catch(function (err) {
      console.error("[ML-DDI] Training failed:", err)
      if (onStatus) onStatus("error", "ML model: training failed")
      throw err
    })

  return mlTrainingPromise
}

// --- Inference -------------------------------------------------------------

// Returns interaction probability (0..1) for a drug pair, or null if the model
// is not ready or a drug is unknown to the feature table.
function predictInteraction(drugA, drugB) {
  if (!mlReady || !mlModel) return null
  if (!hasDrugFeatures(drugA) || !hasDrugFeatures(drugB)) return null
  var vec = pairFeatureVector(drugA, drugB)
  var input = tf.tensor2d([vec])
  var out = mlModel.predict(input)
  var prob = out.dataSync()[0]
  input.dispose()
  out.dispose()
  return prob
}

// Scores every unordered pair among a set of found scientific names.
// Returns [{ a, b, prob }] sorted by probability descending.
function scorePairs(names) {
  var uniq = []
  var seen = {}
  names.forEach(function (n) {
    if (!seen[n] && hasDrugFeatures(n)) {
      seen[n] = true
      uniq.push(n)
    }
  })
  var out = []
  var i, j
  for (i = 0; i < uniq.length; i++) {
    for (j = i + 1; j < uniq.length; j++) {
      var prob = predictInteraction(uniq[i], uniq[j])
      if (prob === null) continue
      out.push({ a: uniq[i], b: uniq[j], prob: prob })
    }
  }
  out.sort(function (x, y) {
    return y.prob - x.prob
  })
  return out
}

// --- Header status badge ----------------------------------------------------

function setMlBadge(state, text) {
  var badge = document.getElementById("ml-status")
  if (!badge) {
    var pills = document.getElementById("db-pills")
    if (!pills) return
    badge = document.createElement("span")
    badge.id = "ml-status"
    pills.appendChild(badge)
  }
  badge.className = "ml-badge ml-" + state
  badge.textContent = text
}

// --- Results UI integration -------------------------------------------------

// Called from app.js renderResults(). Appends an "ML interaction risk" section
// to #results listing every found pair with its predicted probability.
function renderMlRisk(result) {
  var box = document.getElementById("results")
  if (!box || !result || !result.found) return

  var names = result.found.map(function (d) {
    return d.name
  })

  var section = document.createElement("div")
  section.className = "ml-section"

  var head =
    '<div class="ml-head"><strong>ML interaction risk</strong>' +
    '<span class="ml-sub">TensorFlow.js neural net · predicts from drug features</span></div>'

  if (!mlReady) {
    section.innerHTML =
      head + '<p class="muted ml-note">Model is still training — scores will appear shortly.</p>'
    box.appendChild(section)
    return
  }

  var scored = scorePairs(names)
  if (scored.length === 0) {
    section.innerHTML =
      head +
      '<p class="muted ml-note">Need at least two catalog drugs to score interaction risk.</p>'
    box.appendChild(section)
    return
  }

  var rows = scored
    .map(function (s) {
      var pct = Math.round(s.prob * 100)
      var level = s.prob >= 0.5 ? "bad" : s.prob >= 0.2 ? "warn" : "ok"
      var label = level === "bad" ? "High risk" : level === "warn" ? "Possible" : "Low"
      return (
        '<div class="ml-row ml-row-' +
        level +
        '"><div class="ml-pair">' +
        escapeText(s.a) +
        " + " +
        escapeText(s.b) +
        '</div><div class="ml-meter"><div class="ml-meter-fill ml-fill-' +
        level +
        '" style="width:' +
        pct +
        '%"></div></div><div class="ml-prob"><span class="ml-tag ml-tag-' +
        level +
        '">' +
        label +
        "</span> " +
        pct +
        "%</div></div>"
      )
    })
    .join("")

  section.innerHTML =
    head +
    '<p class="muted ml-note">Predicted probability that each pair interacts (model acc ' +
    (mlAccuracy !== null ? Math.round(mlAccuracy * 100) : "–") +
    '%). Pairs at or above 50% are flagged high risk.</p>' +
    rows
  box.appendChild(section)
}

// --- Bootstrap: train once the SQL databases are ready ----------------------

function initMlWhenReady() {
  var tries = 0
  var timer = setInterval(function () {
    tries++
    var dbReady = typeof pharmacyDb !== "undefined" && pharmacyDb
    var tfReady = typeof tf !== "undefined"
    if (dbReady && tfReady) {
      clearInterval(timer)
      setMlBadge("training", "ML model: training…")
      trainInteractionModel(setMlBadge)
        .then(function () {
          // Re-render if results are already on screen so scores show up.
          if (typeof checkNow === "function") {
            var rx = document.getElementById("rx")
            if (rx && rx.value.trim()) checkNow()
          }
        })
        .catch(function () {})
    } else if (tries > 200) {
      clearInterval(timer)
      setMlBadge("error", "ML model: unavailable")
      console.warn("[ML-DDI] Databases or TensorFlow.js not ready; ML disabled.")
    }
  }, 100)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMlWhenReady)
} else {
  initMlWhenReady()
}
