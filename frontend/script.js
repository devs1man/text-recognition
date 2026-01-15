const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const overlay = document.getElementById("overlay");
const runBtn = document.getElementById("runBtn");

const clickedText = document.getElementById("clickedText");
const clickedConf = document.getElementById("clickedConf");
const allResults = document.getElementById("allResults");

let ocrBoxes = []; // store OCR data with bbox + text + confidence

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  preview.src = URL.createObjectURL(file);

  preview.onload = () => {
    overlay.width = preview.clientWidth;
    overlay.height = preview.clientHeight;
    clearCanvas();
    allResults.innerHTML = "";
    clickedText.innerText = "---";
    clickedConf.innerText = "---";
    ocrBoxes = [];
  };
});

runBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    alert("Upload an image first!");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("http://127.0.0.1:5000/ocr", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  ocrBoxes = data.results || [];

  drawBoxes();
  renderAllResults();
});

function clearCanvas() {
  const ctx = overlay.getContext("2d");
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

function drawBoxes() {
  clearCanvas();
  const ctx = overlay.getContext("2d");

  // Scaling because preview is resized in browser
  const scaleX = overlay.width / preview.naturalWidth;
  const scaleY = overlay.height / preview.naturalHeight;

  ctx.lineWidth = 2;

  ocrBoxes.forEach((item) => {
    const bbox = item.bbox; // 4 points
    ctx.beginPath();

    const x1 = bbox[0][0] * scaleX;
    const y1 = bbox[0][1] * scaleY;
    const x2 = bbox[1][0] * scaleX;
    const y2 = bbox[1][1] * scaleY;
    const x3 = bbox[2][0] * scaleX;
    const y3 = bbox[2][1] * scaleY;
    const x4 = bbox[3][0] * scaleX;
    const y4 = bbox[3][1] * scaleY;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.stroke();
  });
}

// click detection
overlay.addEventListener("click", (e) => {
  if (ocrBoxes.length === 0) return;

  const rect = overlay.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // scaling
  const scaleX = overlay.width / preview.naturalWidth;
  const scaleY = overlay.height / preview.naturalHeight;

  // find which box contains clicked point
  for (let item of ocrBoxes) {
    const bbox = item.bbox;

    // convert bbox to simple rectangle bounds (min/max)
    const xs = bbox.map((p) => p[0] * scaleX);
    const ys = bbox.map((p) => p[1] * scaleY);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      clickedText.innerText = item.text;
      clickedConf.innerText = (item.confidence * 100).toFixed(2) + "%";
      return;
    }
  }
});

function renderAllResults() {
  allResults.innerHTML = "";
  ocrBoxes.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "resultItem";
    div.innerHTML = `
      <b>${idx + 1})</b> ${item.text}<br/>
      <small>Confidence: ${(item.confidence * 100).toFixed(2)}%</small>
    `;
    allResults.appendChild(div);
  });
}
