export async function analyzeImage(image, bodyPart) {
  if (!image) {
    throw new Error("No image provided.");
  }

  console.log("DERMA AI: Sending image to Netlify...");

  const response = await fetch(
    "/.netlify/functions/analyze",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image,
        bodyPart
      })
    }
  );

  const text = await response.text();

  console.log(
    "DERMA AI STATUS:",
    response.status
  );

  console.log(
    "DERMA AI RESPONSE:",
    text
  );

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      "Server returned invalid data: " + text
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
      result.error ||
      "AI server error " + response.status
    );
  }

  if (result.status === "error") {
    throw new Error(
      result.message ||
      "AI analysis failed."
    );
  }

  return result;
}
