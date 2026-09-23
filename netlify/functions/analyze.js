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

    /*
      IMPORTANT:
      Dermex expects the uploaded image
      under the field name "file".
    */

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
        "Dermex returned invalid JSON: " +
          responseText
      );
    }

    console.log(
      "DERMA AI: Parsed prediction:",
      prediction
    );

    /*
      Dermex may return predictions in
      different structures, so normalize them.
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
      Array.isArray(
        prediction.results
      )
    ) {
      predictions =
        prediction.results;
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
          label:
            prediction.label,

          confidence:
            prediction.confidence ??
            prediction.score ??
            prediction.probability ??
            0
        }
      ];
    }

    if (
      !predictions.length &&
      prediction.result &&
      typeof prediction.result ===
        "object" &&
      !Array.isArray(
        prediction.result
      )
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

    /*
      Normalize individual prediction objects.
    */

    predictions =
      predictions
        .map((item) => {
          if (Array.isArray(item)) {
            return {
              label: String(
                item[0]
              ),

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
                item.category ||
                "Unknown",

              confidence:
                Number(
                  item.confidence
                ) ||
                Number(
                  item.score
                ) ||
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
        "Dermex successfully received the image, but its prediction response could not be read. Raw response: " +
          responseText
      );
    }

    console.log(
      "DERMA AI: Final predictions:",
      predictions
    );

    const topPrediction =
      predictions[0];

    let topConfidence =
      Number(
        topPrediction.confidence
      );

    /*
      Some APIs return 0.91.
      Others return 91.
    */

    if (
      topConfidence >= 0 &&
      topConfidence <= 1
    ) {
      topConfidence *= 100;
    }

    topConfidence =
      Math.round(
        topConfidence
      );

    const findings =
      predictions.map(
        (item) => {
          let confidence =
            Number(
              item.confidence
            );

          if (
            confidence >= 0 &&
            confidence <= 1
          ) {
            confidence *= 100;
          }

          return {
            name:
              item.label,

            description:
              "The AI classifier detected visual characteristics associated with this category. This is not a medical diagnosis.",

            confidence:
              Math.round(
                confidence
              ) + "%"
          };
        }
      );

    /*
      Safety threshold.
      A classifier score is NOT a medical
      probability.
    */

    if (
      topConfidence < 55
    ) {
      return new Response(
        JSON.stringify({
          status:
            "unable",

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
        status:
          "complete",

        title:
          "Possible visual match",

        message:
          "The AI detected visual characteristics that may be associated with the categories shown below. This is an AI screening result, not a medical diagnosis.",

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
        status:
          "error",

        title:
          "Analysis failed",

        message:
          error?.message ||
          String(error),

        confidence:
          0,

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
