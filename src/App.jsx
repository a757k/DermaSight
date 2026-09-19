import { useState } from "react";
import BodyPartSelector from "./components/BodyPartSelector";
import Camera from "./components/Camera";
import AnalysisScreen from "./components/AnalysisScreen";
import ResultCard from "./components/ResultCard";
import Disclaimer from "./components/Disclaimer";

function App() {
  const [step, setStep] = useState("body");
  const [bodyPart, setBodyPart] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  function handleBodyPart(part) {
    setBodyPart(part);
    setStep("camera");
  }

  function handleImage(photo) {
    setImage(photo);
    setStep("analysis");
  }

  function handleResult(data) {
    setResult(data);
    setStep("result");
  }

  function reset() {
    setBodyPart("");
    setImage(null);
    setResult(null);
    setStep("body");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <div>
            <div className="brand-name">Derma AI</div>
            <div className="brand-subtitle">Skin screening prototype</div>
          </div>
        </div>
      </header>

      <main className="main">
        {step === "body" && (
          <section className="hero-section">
            <div className="hero-badge">
              AI-POWERED VISUAL SCREENING
            </div>

            <h1>
              Understand what
              <br />
              your skin <span>may show.</span>
            </h1>

            <p className="hero-text">
              Take a clear photo of a visible area of skin and
              Derma AI will look for visual patterns that may
              be associated with different skin conditions.
            </p>

            <div className="privacy-card">
              <span>🔒</span>
              <div>
                <strong>Designed with privacy in mind</strong>
                <p>
                  No account or login is required for the prototype.
                </p>
              </div>
            </div>

            <BodyPartSelector onSelect={handleBodyPart} />

            <Disclaimer />
          </section>
        )}

        {step === "camera" && (
          <Camera
            bodyPart={bodyPart}
            onCapture={handleImage}
            onBack={() => setStep("body")}
          />
        )}

        {step === "analysis" && (
          <AnalysisScreen
            image={image}
            bodyPart={bodyPart}
            onComplete={handleResult}
            onBack={() => setStep("camera")}
          />
        )}

        {step === "result" && (
          <ResultCard
            result={result}
            image={image}
            bodyPart={bodyPart}
            onNewScan={reset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
