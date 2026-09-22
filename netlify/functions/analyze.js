import { Client } from "@gradio/client";

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Method not allowed"
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    const body = await request.json();

    if (!body.image) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "No image was received."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    console.log("DERMA AI: Image received.");

    const commaIndex = body.image.indexOf(",");

    if (commaIndex === -1) {
      throw new Error(
        "Invalid image data."
      );
    }

    const base64 = body.image.substring(
      commaIndex + 1
    );

    const buffer = Buffer.from(
      base64,
      "base64"
    );

    if (!buffer.length) {
      throw new Error(
        "Image conversion produced an empty file."
      );
    }

    console.log(
      "DERMA AI: Image size:",
      buffer.length
    );

    const imageFile = new File(
      [buffer],
      "skin-image.jpg",
      {
        type: "image/jpeg"
      }
    );

    console.log(
      "DERMA AI: Connecting to Hugging Face..."
    );

    const app = await Client.connect(
      "cybernatedArt/Skin_disease_detection"
    );

    console.log(
      "DERMA AI: Hugging Face connected."
    );

    /*
     * The Space has one image input and one
     * classification output.
     *
     * Current Gradio clients accept File/Blob
     * objects for image inputs.
     */

    const result = await app.predict(
      "/predict",
      [imageFile]
    );

    console.log(
      "DERMA AI: RAW MODEL RESULT:",
      JSON.stringify(result)
    );

    if (
      !result ||
      !result.data ||
      result.data.length === 0
    ) {
      throw new Error(
        "Hugging Face returned no prediction."
      );
    }

    const raw = result.data[0];

    console.log(
      "DERMA AI: RAW PREDICTION:",
      JSON.stringify(raw)
    );

    let predictions = [];

    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw)
    ) {
      predictions = Object.entries(raw).map(
        ([label, score]) => ({
          label: String(label),
          confidence: Number(score)
        })
      );
    }

    if (Array.isArray(raw)) {
      predictions = raw
        .map((item) => {
          if (
            Array.isArray(item) &&
            item.length >= 2
          ) {
            return {
              label: String(item[0]),
              confidence: Number(item[1])
            };
          }

          if (
            item &&
            typeof item === "object"
          ) {
            return {
              label:
                item.label ||
                item.name ||
                "Unknown",
              confidence:
                Number(item.confidence) ||
                Number(item.score) ||
                0
            };
          }

          return null;
        })
        .filter(Boolean);
    }

    predictions = predictions
      .filter(
        (item) =>
          item.label &&
          Number.isFinite(item.confidence)
      )
      .sort(
        (a, b) =>
          b.confidence - a.confidence
      )
      .slice(0, 5);

    if (!predictions.length) {
      throw new Error(
        "The model responded, but the prediction format was unexpected."
      );
    }

    const top = predictions[0];

    const confidence = Math.round(
      top.confidence * 100
    );

    let status = "complete";

    let title = "Possible visual match";

    let message =
      "The AI detected visual characteristics that may be associated with " +
      top.label +
      ". This is not a medical diagnosis.";

    if (confidence < 55) {
      status = "unable";

      title =
        "Unable to assess reliably";

      message =
        "The AI did not find a strong enough visual match to provide a reliable screening result.";
    }

    const findings = predictions.map(
      (item) => ({
        name: item.label,

        description:
          "Visual characteristics may be associated with this category.",

        confidence:
          Math.round(
            item.confidence * 100
          ) + "%"
      })
    );

    return new Response(
      JSON.stringify({
        status: status,
        title: title,
        message: message,
        confidence: confidence,
        findings: findings,
        bodyPart:
          body.bodyPart || "Unknown"
      }),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  } catch (error) {
    console.error(
      "DERMA AI REAL ERROR:",
      error
    );

    return new Response(
      JSON.stringify({
        status: "error",
        title: "Analysis failed",
        message:
          error?.message ||
          String(error) ||
          "Unknown server error.",
        confidence: 0,
        findings: [],
        bodyPart:
          body?.bodyPart || "Unknown"
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}
