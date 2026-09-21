export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed"
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
          error: "No image provided"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const token = process.env.HUGGINGFACE_TOKEN;

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Hugging Face token is not configured."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    /*
     * TEMPORARY SERVER TEST
     *
     * This confirms that:
     * Phone/browser
     *      ↓
     * analyzer.js
     *      ↓
     * Netlify Function
     *
     * is working before we connect the actual AI model.
     */

    return new Response(
      JSON.stringify({
        status: "clear",
        title: "Server connection working",
        message:
          "Derma AI successfully sent the image to the secure AI server. The dermatology model is the next component to connect.",
        confidence: 0,
        findings: [],
        bodyPart: body.bodyPart || "Unknown"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("DERMA AI SERVER ERROR:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        title: "Analysis failed",
        message:
          "The AI server could not process this image.",
        confidence: 0,
        findings: []
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
