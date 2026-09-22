import {
  pipeline,
  env
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

let classifier = null;

async function getClassifier() {
  if (classifier) {
    return classifier;
  }

  console.log("DERMA AI: Loading skin model...");

  classifier = await pipeline(
    "image-classification",
    "Eraly-ml/Skin-AI",
    {
      device: "webgpu"
    }
  );

  console.log("DERMA AI: Skin model loaded.");

  return classifier;
}

export async function analyzeImage(
  image,
  bodyPart
) {
  if (!image) {
    throw new Error("No image provided.");
  }

  console.log(
    "DERMA AI: Starting browser AI..."
  );

  try {
    const classifier =
      await getClassifier();

    console.log(
      "DERMA AI: Analyzing image..."
    );

    const predictions =
      await classifier(image, {
        topk: 5
      });

    console.log(
      "DERMA AI PREDICTIONS:",
      predictions
    );

    if (
      !predictions ||
      !predictions.length
    ) {
      throw new Error(
        "The AI returned no predictions."
      );
    }

    const findings =
      predictions.map((prediction) => ({
        name: prediction.label,
        description:
          "Visual characteristics identified by the AI classifier.",
        confidence:
          Math.round(
            prediction.score * 100
          ) + "%"
      }));

    const top =
      predictions[0];

    const topConfidence =
      Math.round(
        top.score * 100
      );

    /*
      Confidence gating.

      This is a classifier score, NOT the probability
      that a person has a disease.
    */

    if (topConfidence < 55) {
      return {
        status: "unable",
        title:
          "Unable to assess reliably",
        message:
          "The AI did not produce a strong enough visual classification. No condition should be assumed from this result.",
        confidence: topConfidence,
        findings,
        bodyPart:
          bodyPart || "unknown"
      };
    }

    return {
      status: "complete",
      title:
        "Possible visual match",
      message:
        "The AI detected visual characteristics that may be associated with the categories shown below. This is not a medical diagnosis.",
      confidence: topConfidence,
      findings,
      bodyPart:
        bodyPart || "unknown"
    };
  } catch (error) {
    console.error(
      "DERMA AI ERROR:",
      error
    );

    throw new Error(
      error?.message ||
      "The browser AI could not load or analyze the image."
    );
  }
}
