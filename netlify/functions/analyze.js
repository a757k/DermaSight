import { Client, handle_file } from "@gradio/client";

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
      throw new Error("No image was received.");
    }

    console.log("DERMA AI: Received image.");

    const commaIndex = body.image.indexOf(",");

    if (commaIndex === -1) {
      throw new Error("Invalid image format.");
    }

    const base64Image =
      body.image.substring(commaIndex + 1);

    const imageBuffer = Buffer.from(
      base64Image,
      "base64"
    );

    if (!imageBuffer.length) {
      throw new Error("Image conversion failed.");
    }

    console.log(
      "DERMA AI: Image size:",
      imageBuffer.length
    );

    const imageBlob = new Blob(
      [imageBuffer],
      {
        type: "image/jpeg"
      }
    );

    console.log(
      "DERMA AI: Connecting to skin model..."
    );

    const app = await Client.connect(
      "cybernatedArt/Skin_disease_detection"
    );

    console.log(
      "DERMA AI: Connected."
    );

    console.log(
      "DERMA AI: Sending image..."
    );

    const imageInput =
      handle_file(imageBlob);

    const result = await app.predict(
      "/predict",
      [imageInput]
    );

    console.log(
      "DERMA AI: Model result:",
      JSON.stringify(result)
    );

    if (
      !result ||
      !result.data ||
      !result.data[0]
    ) {
      throw new Error(
        "The skin model returned no predictions."
      );
    }

    const predictionData =
      result.data[0];

    let predictions = [];

    /*
     * Gradio Label output normally returns
     * an object such as:
     *
     * {
     *   "Eczema": 0.72,
     *   "Acne / Rosacea": 0.10
     * }
     */

    if (
      predictionData &&
      typeof predictionData === "object" &&
      !Array.isArray(predictionData)
    ) {
      predictions =
        Object.entries(
          predictionData
        ).map(
          ([label, score]) => ({
            label: String(label),
            confidence: Number(score)
          })
        );
    }

    /*
     * Backup handling in case Gradio returns
     * an array instead.
     */

    if (Array.isArray(predictionData)) {
      predictions =
        predictionData
          .map((item) => {
            if (
              Array.isArray(item) &&
              item.length >= 2
            ) {
              return {
                label: String(item[0]),
                confidence:
                  Number(item[1])
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
                  Number(
                    item.confidence
                  ) ||
                  Number(item.score) ||
                  0
              };
            }

            return null;
          })
          .filter(Boolean);
    }

    predictions =
      predictions
        .filter(
          (item) =>
            item.label &&
            Number.isFinite(
              item.confidence
            )
        )
        .sort(
          (a, b) =>
            b.confidence -
            a.confidence
        )
        .slice(0, 5);

    if (!predictions.length) {
      throw new Error(
        "The model responded, but no predictions could be read."
      );
    }

    const topPrediction =
      predictions[0];

    const topConfidence =
      Math.round(
        topPrediction.confidence * 100
      );

    let status = "complete";

    let title =
      "Possible visual match";

    let message =
      "The AI detected visual characteristics that may be associated with " +
      topPrediction.label +
      ". This is not a medical diagnosis.";

    if (topConfidence < 55) {
      status = "unable";

      title =
        "Unable to assess reliably";

      message =
        "The AI did not find a strong enough visual match to provide a reliable screening result.";
    }

    const findings =
      predictions.map(
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
        confidence:
          topConfidence,
        findings: findings,
        bodyPart:
          body.bodyPart ||
          "Unknown"
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
      "DERMA AI ERROR:",
      error
    );

    return new Response(
      JSON.stringify({
        status: "error",
        title: "Analysis failed",
        message:
          error &&
          error.message
            ? error.message
            : String(error),
        confidence: 0,
        findings: [],
        bodyPart:
          "Unknown"
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
