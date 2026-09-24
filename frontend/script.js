// ── Character Counter ─────────────────────────────────────────────────────
const textarea  = document.getElementById("newsInput");
const charCount = document.getElementById("charCount");
/* ── Dynamic Placeholder Text ───────────────────────── */

const placeholders = [
  "Paste a news article to verify authenticity...",
  "Check whether a headline is REAL or FAKE...",
  "AI-powered misinformation detection...",
  "Analyze political, sports, or viral news instantly..."
];

let placeholderIndex = 0;

setInterval(() => {
  textarea.setAttribute(
    "placeholder",
    placeholders[placeholderIndex]
  );

  placeholderIndex =
    (placeholderIndex + 1) % placeholders.length;

}, 3000);

textarea.addEventListener("input", () => {

  const length = textarea.value.length;

  charCount.textContent = length;

  // Dynamic colors
  if (length > 300) {
    charCount.style.color = "#00d97e";
  }
  else if (length > 100) {
    charCount.style.color = "#facc15";
  }
  else {
    charCount.style.color = "#8888aa";
  }

});


// ── Analyze News ──────────────────────────────────────────────────────────
async function analyzeNews() {
  const text      = textarea.value.trim();
  const btn       = document.getElementById("analyzeBtn");
  const btnText   = btn.querySelector(".btn-text");
  const btnLoader = btn.querySelector(".btn-loader");
  const errorMsg  = document.getElementById("errorMsg");
  const resultSec = document.getElementById("resultSection");

  // Hide previous state
  errorMsg.classList.add("hidden");
  resultSec.classList.add("hidden");

  // Validate
  if (!text) {
    errorMsg.classList.remove("hidden");
    document.getElementById("errorText").textContent = "Please enter some news text before analyzing.";
    return;
  }
  if (text.split(" ").length < 5) {
    errorMsg.classList.remove("hidden");
    document.getElementById("errorText").textContent = "Please enter at least a few sentences for better accuracy.";
    return;
  }

  // Loading state
  btn.disabled = true;
  btnText.classList.add("hidden");
  btnLoader.classList.remove("hidden");

  /* AI Loading Messages */

const loadingMessages = [
  "Scanning article...",
  "Checking credibility...",
  "Running AI analysis...",
  "Detecting misinformation...",
  "Analyzing language patterns..."
];

let msgIndex = 0;

btnLoader.innerHTML =
  `<i class="fa-solid fa-circle-notch fa-spin"></i>
   ${loadingMessages[0]}`;
let loadingInterval;
 loadingInterval = setInterval(() => {

  msgIndex =
    (msgIndex + 1) % loadingMessages.length;

  btnLoader.innerHTML =
    `<i class="fa-solid fa-circle-notch fa-spin"></i>
     ${loadingMessages[msgIndex]}`;

}, 1200);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error("Server error. Please try again.");

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    displayResult(data);

  } catch (err) {
    errorMsg.classList.remove("hidden");
    document.getElementById("errorText").textContent = err.message || "Something went wrong.";
  } finally {
  clearInterval(loadingInterval);

  btn.disabled = false;
  btnText.classList.remove("hidden");
  btnLoader.classList.add("hidden");
}
}

// ── Display Result ────────────────────────────────────────────────────────
function displayResult(data) {

  const isFake = data.raw_prediction === 1;
  playResultSound(isFake);

  const resultSec  = document.getElementById("resultSection");
  const badge      = document.getElementById("verdictBadge");
  const icon       = document.getElementById("verdictIcon");
  const text       = document.getElementById("verdictText");
  const sub        = document.getElementById("verdictSub");
  const confPct    = document.getElementById("confPercent");
  const barFill    = document.getElementById("confBarFill");
  const fakeProb   = document.getElementById("fakeProb");
  const realProb   = document.getElementById("realProb");

  // Verdict
  badge.className  = `verdict-badge ${isFake ? "fake" : "real"}`;

  icon.textContent = isFake ? "🚨" : "✅";

  text.textContent = isFake
    ? "FAKE NEWS"
    : "REAL NEWS";

  sub.textContent = isFake
    ? "This article shows signs of misinformation."
    : "This article appears to be credible.";

  // Animated confidence
  animateValue(confPct, 0, data.confidence, 1200, "%");

  // Confidence bar
  barFill.className =
    `conf-bar-fill ${isFake ? "fake" : "real"}`;

  setTimeout(() => {
    barFill.style.width = `${data.confidence}%`;
  }, 100);

  // Animated probabilities
  animateValue(fakeProb, 0, data.fake_prob, 1200, "%");

  animateValue(realProb, 0, data.real_prob, 1200, "%");

  // Show result
  resultSec.classList.remove("hidden");

  resultSec.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });

}
  /* ── Animated Counter ───────────────────────────────── */



function animateValue(element, start, end, duration, suffix = "") {

  let startTimestamp = null;

  function step(timestamp) {

    if (!startTimestamp)
      startTimestamp = timestamp;

    const progress = Math.min(
      (timestamp - startTimestamp) / duration,
      1
    );

    const value =
      Math.floor(progress * (end - start) + start);

    element.textContent = value + suffix;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}
  

  
// ── Reset Form ────────────────────────────────────────────────────────────
function resetForm() {
  textarea.value = "";
  charCount.textContent = "0";
  document.getElementById("resultSection").classList.add("hidden");
  document.getElementById("errorMsg").classList.add("hidden");
  document.getElementById("confBarFill").style.width = "0%";
  textarea.focus();
}

// ── Enter key shortcut (Ctrl + Enter) ────────────────────────────────────
textarea.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") analyzeNews();
});
/* ── Result Sound ─────────────────────────────────── */

function playResultSound(isFake) {

  const audio = new Audio(
    isFake
      ? "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
      : "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
  );

  audio.volume = 0.25;

  audio.play();
} 
  const examples = {
  example1: `SHOCKING TRUTH REVEALED: Government whistleblower exposes secret chemtrail program that has been poisoning citizens for decades.`,

  example2: `MIRACLE CURE HIDDEN FROM PUBLIC: A retired nurse discovered that drinking bleach mixed with lemon juice every morning completely eliminates diseases.`,

  example3: `The United States Federal Reserve raised interest rates by 25 basis points on Wednesday as policymakers continue efforts to bring inflation under control.`,

  example4:' No Change Expected for ESPN Political Agenda Despite Huge Subscriber Decline - Breitbart',
  }
window.loadExample = function (key) {
  textarea.value = examples[key];
  charCount.textContent = examples[key].length;

  document.getElementById('resultSection').classList.add('hidden');
  document.getElementById('errorMsg').classList.add('hidden');
};
window.analyzeURL = async function () {
  const url = document.getElementById("urlInput").value.trim();
  const analyzeBtn = document.querySelector(".popup button:first-of-type");

  if (!url) {
    alert("Please enter a URL");
    return;
  }

  // Loading state
  analyzeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...';
  analyzeBtn.disabled = true;

  try {
    const response = await fetch('/predict_url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // Close popup & clear input
    closePopup();
    document.getElementById("urlInput").value = "";

    const resultSection = document.getElementById('resultSection');
    const badge = document.getElementById('verdictBadge');
    const icon  = document.getElementById('verdictIcon');
    const sub   = document.getElementById('verdictSub');

    resultSection.classList.remove('hidden');
    document.getElementById('verdictText').innerText = data.prediction;
    document.getElementById('confPercent').innerText = data.confidence + "%";
    document.getElementById('confBarFill').style.width = data.confidence + "%";

    let fakeProb, realProb;

    if (data.prediction === "FAKE NEWS") {
      badge.className = 'verdict-badge fake';
      icon.innerHTML  = '🚨';
      sub.innerText   = "This article appears misleading or fake.";
      document.getElementById('confBarFill').className = 'conf-bar-fill fake'; 
      fakeProb = data.confidence;
      realProb = 100 - data.confidence;
    } else {
      badge.className = 'verdict-badge real';
      icon.innerHTML  = '✅';
      sub.innerText   = "This article appears authentic and reliable.";
      document.getElementById('confBarFill').className = 'conf-bar-fill real'; 
      realProb = data.confidence;
      fakeProb = 100 - data.confidence;
    }

    document.getElementById('fakeProb').innerText = fakeProb.toFixed(2) + "%";
    document.getElementById('realProb').innerText = realProb.toFixed(2) + "%";

    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (error) {
    console.log(error);
    alert("Error analyzing URL. Please check the URL and try again.");
  } finally {
    analyzeBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Analyze URL';
    analyzeBtn.disabled = false;
  }
};

function openPopup() {
  document.getElementById("urlPopup").style.display = "flex";
}

function closePopup() {
  document.getElementById("urlPopup").style.display = "none";
}
