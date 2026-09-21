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
      return new Response(
        JSON.stringify({
          status: "error",
          message: "No image was received by the AI server."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    console.log("DERMA AI: Starting analysis.");

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

    console.log(
      "DERMA AI: Image received. Size:",
      imageBuffer.length
    );

    if (imageBuffer.length === 0) {
      throw new Error("The uploaded image was empty.");
    }

    const imageBlob = new Blob(
      [imageBuffer],
      {
        type: "image/jpeg"
      }
    );

    console.log(
      "DERMA AI: Connecting to Gradio model..."
    );

    const app = await Client.connect(
      "cybernatedArt/Skin_disease_detection"
    );

    console.log(
      "DERMA AI: Connected successfully."
    );

    console.log(
      "DERMA AI: Sending image to /predict..."
    );

    const result = await app.predict(
      "/predict",
      [
        handle_file(imageBlob)
      ]
    );

    console.log(
      "DERMA AI: Model returned:",
      result
    );

    if (
      !result ||
      !result.data ||
      result.data.length === 0
    ) {
      throw new Error(
        "The AI model returned an empty response."
      );
    }

    const predictionData = result.data[0];

    console.log(
      "DERMA AI: Prediction data:",
      predictionData
    );

    let predictions = [];

    if (
      predictionData &&
      typeof predictionData === "object" &&
      !Array.isArray(predictionData)
    ) {
      predictions = Object.entries(
        predictionData
      ).map(([label, score]) => ({
        label: String(label),
        confidence: Number(score)
      }));
    }

    if (Array.isArray(predictionData)) {
      predictions = predictionData
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

    if (predictions.length === 0) {
      throw new Error(
        "The AI responded, but its prediction format could not be read."
      );
    }

    const topPrediction = predictions[0];

    const topConfidence = Math.round(
      topPrediction.confidence * 100
    );

    let status = "complete";
    let title = "Possible visual match";
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
        confidence: topConfidence,
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

    const errorMessage =
      error &&
      error.message
        ? error.message
        : String(error);

    return new Response(
      JSON.stringify({
        status: "error",
        title: "AI server error",
        message:
          "REAL ERROR: " +
          errorMessage,
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
