import {
  getConfidencePercent,
  isReliable
} from "./confidence";

export async function analyzeImage(image, bodyPart) {
  if (!image) {
    return {
      status: "unable",
      title: "No image available",
      message: "No image was provided.",
      findings: []
    };
  }

  /*
   * Hugging Face connection will be added here.
   *
   * IMPORTANT:
   * Never put your Hugging Face API token in this file.
   *
   * The frontend will send the image to:
   *
   * /api/analyze
   *
   * A Netlify serverless function will then securely
   * communicate with Hugging Face.
   */

  try {
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
      throw new Error("AI request failed");
    }

    const data = await response.json();

    if (
      !data ||
      typeof data.confidence !== "number" ||
      !isReliable(data.confidence)
    ) {
      return {
        status: "unable",
        title: "Unable to assess reliably",
        message:
          "The AI was not confident enough to provide a reliable visual result.",
        findings: []
      };
    }

    return {
      status: data.status || "clear",
      title: data.title || "Visual pattern detected",
      message:
        data.message ||
        "The AI identified a visual pattern that may be associated with the result below.",
      confidence: getConfidencePercent(data.confidence),
      findings: Array.isArray(data.findings)
        ? data.findings
        : []
    };
  } catch (error) {
    console.error(error);

    return {
      status: "unable",
      title: "Unable to assess reliably",
      message:
        "The AI service is currently unavailable or the image could not be assessed reliably.",
      findings: []
    };
  }
}
