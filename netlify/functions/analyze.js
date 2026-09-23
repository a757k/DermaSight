export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        status: "error",
        title: "Method not allowed",
        message: "Only POST requests are allowed.",
        confidence: 0,
        findings: []
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

    console.log("DERMA AI: Image received.");

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
      throw new Error("Could not decode the image.");
    }

    console.log(
      "DERMA AI: Image size:",
      imageBuffer.length
    );

    const form = new FormData();

    const imageBlob = new Blob(
      [imageBuffer],
      {
        type: "image/jpeg"
      }
    );

    form.append(
      "file",
      imageBlob,
      "skin.jpg"
    );

    console.log(
      "DERMA AI: Sending image to Dermex..."
    );

    const response = await fetch(
      "https://hassan73-dermex.hf.space/predict",
      {
        method: "POST",
        body: form
      }
    );

    const responseText =
      await response.text();

    console.log(
      "DERMA AI: Dermex status:",
      response.status
    );

    console.log(
      "DERMA AI: Dermex response:",
      responseText
    );

    if (!response.ok) {
      throw new Error(
        "Dermex returned HTTP " +
          response.status +
          ": " +
          responseText
      );
    }

    let prediction;

    try {
      prediction =
        JSON.parse(responseText);
    } catch {
      throw new Error(
        "Dermex returned invalid JSON."
      );
    }

    /*
      Dermex response:

      {
        success: true,
        prediction: "AK",
        confidence: 0.57,
        details: {
          AK: 0.57,
          DF: 0.26,
          ...
        }
      }
    */

    if (
      !prediction.details ||
      typeof prediction.details !==
        "object"
    ) {
      throw new Error(
        "Dermex returned no prediction details."
      );
    }

    const predictions =
      Object.entries(
        prediction.details
      )
        .map(
          ([label, score]) => ({
            label: String(label),
            confidence: Number(score)
          })
        )
        .filter(
          (item) =>
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
        "No usable predictions were returned."
      );
    }

    console.log(
      "DERMA AI: Parsed predictions:",
      predictions
    );

    const topPrediction =
      predictions[0];

    const topConfidence =
      Math.round(
        topPrediction.confidence * 100
      );

    const diseaseNames = {
      AK: "Actinic Keratosis",
      DF: "Dermatofibroma",
      VASC: "Vascular Lesion",
      SCC: "Squamous Cell Carcinoma",
      NV: "Melanocytic Nevus",
      BCC: "Basal Cell Carcinoma",
      BKL: "Benign Keratosis",
      MEL: "Melanoma"
    };

    const findings =
      predictions.map(
        (item) => ({
          name:
            diseaseNames[item.label] ||
            item.label,

          description:
            "The AI classifier detected visual characteristics associated with this category. This is not a medical diagnosis.",

          confidence:
            Math.round(
              item.confidence * 100
            ) + "%"
        })
      );

    const topName =
      diseaseNames[
        topPrediction.label
      ] ||
      topPrediction.label;

    /*
      Confidence gate.
    */

    if (topConfidence < 55) {
      return new Response(
        JSON.stringify({
          status: "unable",

          title:
            "Unable to assess reliably",

          message:
            "The AI did not produce a strong enough visual classification. No condition should be assumed from this result.",

          confidence:
            topConfidence,

          findings,

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
    }

    return new Response(
      JSON.stringify({
        status: "complete",

        title:
          "Possible visual match",

        message:
          "The AI detected visual characteristics that may be associated with " +
          topName +
          ". This is an AI screening result, not a medical diagnosis.",

        confidence:
          topConfidence,

        findings,

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

        title:
          "Analysis failed",

        message:
          error?.message ||
          String(error),

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
