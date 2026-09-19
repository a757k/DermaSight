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

    /*
     * HUGGING FACE CONNECTION
     *
     * We will put the Hugging Face model/API request here.
     *
     * The token must be stored in Netlify as:
     *
     * HUGGINGFACE_TOKEN
     *
     * Never put the actual token directly in this file.
     */

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
     * The exact Hugging Face model endpoint will be
     * connected here after choosing the model.
     */

    return new Response(
      JSON.stringify({
        status: "unable",
        title: "AI model not connected yet",
        message:
          "The Derma AI interface is working, but the dermatology AI model has not been connected yet.",
        confidence: 0,
        findings: []
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Server error"
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
