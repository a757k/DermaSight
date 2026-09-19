import { pipeline } from "@huggingface/transformers";

let classifier = null;

async function getClassifier() {
  if (!classifier) {
    classifier = await pipeline(
      "image-classification",
      "LaurianeMD/vit-skin-disease"
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

    console.log("DERMA AI RESULTS:", results);

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
      title: `Possible ${top.label}`,
      message:
        "The image has visual features that may be associated with this condition. This is not a diagnosis.",
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
        "The AI could not analyze this image. Please try another clear photo.",
      confidence: 0,
      findings: [],
      bodyPart
    };
  }
}
