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

    console.log("DERMA AI RESULTS:", results);

    if (!results || results.length === 0) {
      return {
        status: "uncertain",
        title: "Unable to assess reliably",
        message:
          "The image did not produce a reliable result. Try a clearer, closer photo.",
        confidence: 0,
        findings: [],
        bodyPart
      };
    }

    const top = results[0];
    const confidence = top.score;
    const label = top.label;

    if (confidence >= 0.65) {
      return {
        status: "possible",
        title: `Possible ${label}`,
        message:
          "The image shows visual characteristics associated with this category. This is not a diagnosis and should not be used to confirm a medical condition.",
        confidence,
        findings: results.slice(0, 5).map((item) => ({
          label: item.label,
          confidence: item.score
        })),
        bodyPart
      };
    }

    return {
      status: "low_confidence",
      title: "No clear concerning pattern detected",
      message:
        "The AI did not identify a strong match to the categories it was trained to recognize. This does not rule out a skin condition.",
      confidence,
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
