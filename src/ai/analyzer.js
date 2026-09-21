import * as ort from "onnxruntime-web";

let session = null;

const MODEL_URL =
  "https://huggingface.co/Eraly-ml/Skin-AI/resolve/main/skinconvnext.onnx";

const LABELS_URL =
  "https://huggingface.co/Eraly-ml/Skin-AI/resolve/main/labels.txt";

let labels = null;

async function loadLabels() {
  if (labels) return labels;

  const response = await fetch(LABELS_URL);

  if (!response.ok) {
    throw new Error("Could not load disease labels.");
  }

  const text = await response.text();

  labels = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  return labels;
}

async function loadModel() {
  if (session) return session;

  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ["wasm"]
  });

  return session;
}

function softmax(values) {
  const max = Math.max(...values);

  const exps = values.map((value) =>
    Math.exp(value - max)
  );

  const sum = exps.reduce((a, b) => a + b, 0);

  return exps.map((value) => value / sum);
}

async function imageToTensor(image) {
  const img = new Image();

  img.src = image;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");

  canvas.width = 224;
  canvas.height = 224;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, 224, 224);

  const pixels = ctx.getImageData(
    0,
    0,
    224,
    224
  ).data;

  const input = new Float32Array(
    3 * 224 * 224
  );

  for (let i = 0; i < 224 * 224; i++) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;

    input[i] = r;
    input[224 * 224 + i] = g;
    input[2 * 224 * 224 + i] = b;
  }

  return new ort.Tensor(
    "float32",
    input,
    [1, 3, 224, 224]
  );
}

function readableLabel(label) {
  return label
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export async function analyzeImage(image, bodyPart) {
  try {
    if (!image) {
      throw new Error("No image provided.");
    }

    console.log("DERMA AI: Loading model...");

    const model = await loadModel();
    const diseaseLabels = await loadLabels();

    console.log("DERMA AI: Model loaded.");
    console.log("DERMA AI: Labels:", diseaseLabels);

    const tensor = await imageToTensor(image);

    const inputName = model.inputNames[0];

    const output = await model.run({
      [inputName]: tensor
    });

    const outputName = model.outputNames[0];

    const rawScores = Array.from(
      output[outputName].data
    );

    const probabilities = softmax(rawScores);

    const results = probabilities
      .map((score, index) => ({
        label:
          diseaseLabels[index] ||
          `Class ${index}`,
        score
      }))
      .sort((a, b) => b.score - a.score);

    console.log(
      "DERMA AI RESULTS:",
      results
    );

    const top = results[0];

    if (!top || top.score < 0.55) {
      return {
        status: "uncertain",
        title: "No strong match found",
        message:
          "The AI did not find a strong visual match among the skin conditions it was trained to recognize. This does not mean your skin is disease-free.",
        confidence: top?.score || 0,
        findings: results.slice(0, 5).map((item) => ({
          label: readableLabel(item.label),
          confidence: item.score
        })),
        bodyPart
      };
    }

    const name = readableLabel(top.label);

    return {
      status: "possible",
      title: `Possible ${name}`,
      message:
        `The image contains visual features that may be associated with ${name}. This is a screening result, not a medical diagnosis.`,
      confidence: top.score,
      findings: results.slice(0, 5).map((item) => ({
        label: readableLabel(item.label),
        confidence: item.score
      })),
      bodyPart
    };
  } catch (error) {
    console.error(
      "DERMA AI ERROR:",
      error
    );

    return {
      status: "error",
      title: "Analysis failed",
      message:
        "The AI could not analyze this image. Please try another clear, well-lit photo.",
      confidence: 0,
      findings: [],
      bodyPart
    };
  }
}
