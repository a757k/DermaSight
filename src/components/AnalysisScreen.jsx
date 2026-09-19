import { useEffect, useState } from "react";
import { analyzeImage } from "../ai/analyzer";

function AnalysisScreen({
  image,
  bodyPart,
  onComplete,
  onBack
}) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(
    "Preparing image..."
  );

  useEffect(() => {
    let cancelled = false;

    async function runAnalysis() {
      const stages = [
        [15, "Checking image quality..."],
        [35, "Examining visible patterns..."],
        [55, "Analyzing skin characteristics..."],
        [75, "Comparing visual patterns..."],
        [90, "Applying safety checks..."]
      ];

      for (const [value, text] of stages) {
        if (cancelled) return;

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        if (cancelled) return;

        setProgress(value);
        setMessage(text);
      }

      try {
        const result = await analyzeImage(image, bodyPart);

        if (!cancelled) {
          setProgress(100);
          setMessage("Analysis complete.");

          setTimeout(() => {
            onComplete(result);
          }, 400);
        }
      } catch {
        if (!cancelled) {
          onComplete({
            status: "unable",
            title: "Unable to assess reliably",
            message:
              "The image could not be assessed reliably. Try taking another clear photo in good lighting.",
            findings: []
          });
        }
      }
    }

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [image, bodyPart, onComplete]);

  return (
    <section className="analysis-page">
      <div className="analysis-image-wrapper">
        <img
          src={image}
          alt="Skin area being analyzed"
          className="analysis-image"
        />

        <div className="analysis-overlay">
          <div className="scan-line"></div>

          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
        </div>
      </div>

      <div className="analysis-content">
        <div className="hero-badge">AI ANALYSIS</div>

        <h1>Examining your image</h1>

        <p>{message}</p>

        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="progress-number">
          {progress}%
        </div>

        <div className="analysis-note">
          <span>✦</span>
          <div>
            <strong>Safety-first analysis</strong>
            <p>
              The system can decline to give a result when
              an image is unclear or confidence is insufficient.
            </p>
          </div>
        </div>

        <button className="secondary-button" onClick={onBack}>
          Cancel analysis
        </button>
      </div>
    </section>
  );
}

export default AnalysisScreen;
