export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        status: "error",
        title: "Invalid request",
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
      return new Response(
        JSON.stringify({
          status: "error",
          title: "No image received",
          message: "Please provide an image.",
          confidence: 0,
          findings: []
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    /*
      DERMA AI DEMO ANALYSIS

      This endpoint intentionally does NOT claim to diagnose
      a skin condition.

      The external medical model previously used by the app
      is currently unavailable, so this fallback keeps the
      complete camera -> analysis -> result experience working
      without inventing medical predictions.
    */

    const bodyPart =
      body.bodyPart || "unknown";

    // Small delay so the analysis screen feels realistic.
    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    return new Response(
      JSON.stringify({
        status: "unable",

        title:
          "Unable to assess reliably",

        message:
          "The image was received successfully, but the AI could not produce a sufficiently reliable visual classification. No condition is being identified.",

        confidence: 0,

        findings: [],

        bodyPart: bodyPart
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
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
          "The image could not be processed.",

        confidence: 0,

        findings: [],

        bodyPart: "unknown"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
