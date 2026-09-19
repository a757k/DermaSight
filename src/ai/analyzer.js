import { pipeline } from "@huggingface/transformers";

let classifier = null;

async function getClassifier() {
  if (!classifier) {
    classifier = await pipeline(
      "image-classification",
      "sazio/skin-mole-vit-onnx"
    );
  }

  return classifier;
}

export async function analyzeImage(image, bodyPart) {
  try {
    if (!image) {
      throw new Error("No image provided.");
    }

    const pipe = await getClassifier();

    const results = await pipe(image);

    console.log("DERMA AI MODEL RESULTS:", results);

    if (!results || results.length === 0) {
      return {
        status: "uncertain",
        title: "Unable to assess reliably",
        message:
          "The image could not be assessed reliably. Try taking a clearer, closer photo.",
        confidence: 0,
        findings: [],
        bodyPart
      };
    }

    const top = results[0];

    return {
      status: "possible",
      title: "Visual pattern detected",
      message:
        "The AI identified a visual pattern in the image. This is a screening result, not a diagnosis.",
      confidence: top.score,
      findings: results.slice(0, 5).map((item) => ({
        label: item.label,
        confidence: item.score
      })),
      bodyPart
    };
  } catch (error) {
    console.error("DERMA AI ERROR:", error);

    return {
      status: "error",
      title: "Analysis failed",
      message:
        "The image could not be analyzed. Please try another clear photo.",
      confidence: 0,
      findings: [],
      bodyPart
    };
  }
}
