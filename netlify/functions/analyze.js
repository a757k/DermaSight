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
      throw new Error(
        "Image conversion failed."
      );
    }

    console.log(
      "DERMA AI: Image size:",
      imageBuffer.length
    );

    /*
     * Upload the image to the Hugging Face
     * Space's file endpoint.
     */

    const uploadResponse = await fetch(
      "https://cybernatedart-skin-disease-detection.hf.space/upload",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream"
        },
        body: imageBuffer
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(
        "Image upload to the AI server failed. HTTP " +
        uploadResponse.status
      );
    }

    const uploadData =
      await uploadResponse.json();

    console.log(
      "DERMA AI: Upload response:",
      JSON.stringify(uploadData)
    );

    if (
      !uploadData ||
      !uploadData.path
    ) {
      throw new Error(
        "AI server did not return an uploaded image path."
      );
    }

    /*
     * Ask the Space to make its prediction.
     */

    const predictResponse = await fetch(
      "https://cybernatedart-skin-disease-detection.hf.space/run/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [
            {
              path: uploadData.path
            }
          ]
        })
      }
    );

    const predictText =
      await predictResponse.text();

    console.log(
      "DERMA AI: Prediction response:",
      predictText
    );

    if (!predictResponse.ok) {
      throw new Error(
        "AI prediction failed. HTTP " +
        predictResponse.status +
        ": " +
        predictText
      );
    }

    const prediction =
      JSON.parse(predictText);

    if (
      !prediction ||
      !prediction.data ||
      !prediction.data[0]
    ) {
      throw new Error(
        "AI returned no prediction."
      );
    }

    const raw =
      prediction.data[0];

    let predictions = [];

    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw)
    ) {
      predictions =
        Object.entries(raw).map(
          ([label, score]) => ({
            label: String(label),
            confidence: Number(score)
          })
        );
    }

    if (Array.isArray(raw)) {
      predictions =
        raw
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
        "AI responded, but no predictions could be read."
      );
    }

    const top =
      predictions[0];

    const confidence =
      Math.round(
        top.confidence * 100
      );

    let status = "complete";
    let title =
      "Possible visual match";

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
        status,
        title,
        message,
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
      "DERMA AI REAL ERROR:",
      error
    );

    return new Response(
      JSON.stringify({
        status: "error",
        title: "Analysis failed",
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
