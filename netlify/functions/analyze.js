export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Only POST requests are allowed."
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

    // Convert base64 data URL into binary image data
    const commaIndex = body.image.indexOf(",");

    if (commaIndex === -1) {
      throw new Error("Invalid image format.");
    }

    const base64 = body.image.substring(
      commaIndex + 1
    );

    const imageBuffer = Buffer.from(
      base64,
      "base64"
    );

    if (!imageBuffer.length) {
      throw new Error("Could not decode image.");
    }

    console.log(
      "DERMA AI: Image size:",
      imageBuffer.length
    );

    // Send image to the running Dermex API
    const form = new FormData();

    const blob = new Blob(
      [imageBuffer],
      {
        type: "image/jpeg"
      }
    );

    form.append(
      "image",
      blob,
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
        "Dermex returned invalid JSON: " +
        responseText
      );
    }

    console.log(
      "DERMA AI: Prediction:",
      prediction
    );

    /*
      Try to support the common response formats:
      
      {
        "label": "...",
        "confidence": 0.91
      }

      or

      {
        "predictions": [...]
      }

      or

      {
        "result": {...}
      }
    */

    let predictions = [];

    if (Array.isArray(prediction)) {
      predictions = prediction;
    }

    if (
      Array.isArray(
        prediction.predictions
      )
    ) {
      predictions =
        prediction.predictions;
    }

    if (
      prediction.result &&
      Array.isArray(
        prediction.result
      )
    ) {
      predictions =
        prediction.result;
    }

    if (
      !predictions.length &&
      prediction.label
    ) {
      predictions = [
        {
          label: prediction.label,
          confidence:
            prediction.confidence ??
            prediction.score ??
            0
        }
      ];
    }

    if (
      !predictions.length &&
      prediction.result &&
      typeof prediction.result ===
        "object"
    ) {
      predictions =
        Object.entries(
          prediction.result
        ).map(
          ([label, confidence]) => ({
            label,
            confidence
          })
        );
    }

    // Convert different possible formats
    predictions =
      predictions
        .map((item) => {
          if (
            Array.isArray(item)
          ) {
            return {
              label: String(item[0]),
              confidence:
                Number(item[1])
            };
          }

          if (
            item &&
            typeof item ===
              "object"
          ) {
            return {
              label:
                item.label ||
                item.name ||
                item.class ||
                "Unknown",

              confidence:
                Number(
                  item.confidence
                ) ||
                Number(item.score) ||
                Number(
                  item.probability
                ) ||
                0
            };
          }

          return null;
        })
        .filter(Boolean)
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
        "Dermex responded, but its prediction format could not be read. Raw response: " +
          responseText
      );
    }

    const top =
      predictions[0];

    let confidence =
      top.confidence;

    // Handle either 0.92 or 92
    if (confidence <= 1) {
      confidence *= 100;
    }

    confidence =
      Math.round(confidence);

    const findings =
      predictions.map(
        (item) => {
          let score =
            item.confidence;

          if (score <= 1) {
            score *= 100;
          }

          return {
            name: item.label,

            description:
              "The AI classifier detected visual characteristics associated with this category. This is not a diagnosis.",

            confidence:
              Math.round(score) + "%"
          };
        }
      );

    /*
      Safety gate:
      We do NOT turn the classifier score into
      a claim that the person has the disease.
    */

    if (confidence < 55) {
      return new Response(
        JSON.stringify({
          status: "unable",

          title:
            "Unable to assess reliably",

          message:
            "The AI did not produce a strong enough visual classification. No condition should be assumed from this result.",

          confidence,

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
          "The AI detected visual characteristics that may be associated with the categories shown below. This is an AI screening result, not a medical diagnosis.",

        confidence,

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
