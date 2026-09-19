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

    if (!results || results.length === 0) {
      return {
        status: "uncertain",
        title: "Unable to assess reliably",
        message:
          "The AI could not find a reliable visual pattern in this image.",
        confidence: 0,
        findings: [],
        bodyPart
      };
    }

    const top = results[0];

    return {
      status: top.score >= 0.65 ? "possible" : "uncertain",
      title:
        top.score >= 0.65
          ? "Visual pattern detected"
          : "Unable to assess reliably",
      message:
        "This is an AI-generated visual screening result, not a diagnosis.",
      confidence: top.score,
      findings: results.slice(0, 5).map((item) => ({
        label: item.label,
        confidence: item.score
      })),
      bodyPart
    };
  } catch (error) {
    console.error("Derma AI error:", error);

    return {
      status: "error",
      title: "Analysis failed",
      message:
        "The AI could not analyze this image. Please try another clear image.",
      confidence: 0,
      findings: [],
      bodyPart
    };
  }
}
