```js
export async function analyzeImage(image, bodyPart) {
  try {
    if (!image) {
      throw new Error("No image provided.");
    }

    console.log("DERMA AI: Sending image to AI server...");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image,
        bodyPart
      })
    });

    if (!response.ok) {
      throw new Error(
        `AI server returned ${response.status}`
      );
    }

    const result = await response.json();

    console.log(
      "DERMA AI RESULT:",
      result
    );

    return result;
  } catch (error) {
    console.error(
      "DERMA AI ERROR:",
      error
    );

    return {
      status: "error",
      title: "Analysis failed",
      message:
        "The AI could not analyze this image. Please try another clear, well-lit photo.",
      confidence: 0,
      findings: [],
      bodyPart
    };
  }
}
```
