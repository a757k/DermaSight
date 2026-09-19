function ResultCard({
  result,
  image,
  bodyPart,
  onNewScan
}) {
  const status = result?.status || "unable";

  const title =
    result?.title ||
    "Unable to assess reliably";

  const message =
    result?.message ||
    "No reliable result could be produced.";

  const confidence =
    typeof result?.confidence === "number"
      ? Math.round(result.confidence * 100)
      : null;

  return (
    <section className="result-page">
      <div className="hero-badge">ANALYSIS COMPLETE</div>

      <h1>Your skin analysis</h1>

      <div className="result-image-wrapper">
        <img
          src={image}
          alt="Analyzed skin area"
          className="result-image"
        />

        <div className="result-tag">
          {bodyPart}
        </div>
      </div>

      <div
        className={`result-card ${
          status === "concerning"
            ? "result-concerning"
            : status === "clear" || status === "low_confidence"
            ? "result-clear"
            : status === "possible"
            ? "result-unable"
            : "result-unable"
        }`}
      >
        <div className="result-icon">
          {status === "concerning"
            ? "!"
            : status === "clear" || status === "low_confidence"
            ? "✓"
            : "?"}
        </div>

        <div>
          <h2>{title}</h2>
          <p>{message}</p>

          {confidence !== null && status !== "error" && (
            <div className="confidence-display">
              AI confidence: <strong>{confidence}%</strong>
            </div>
          )}
        </div>
      </div>

      {result?.findings?.length > 0 && (
        <div className="findings-card">
          <h2>Other possible patterns</h2>

          {result.findings
            .filter((finding) => finding.label)
            .slice(1, 4)
            .map((finding, index) => {
              const percentage =
                typeof finding.confidence === "number"
                  ? Math.round(finding.confidence * 100)
                  : null;

              return (
                <div className="finding" key={index}>
                  <div>
                    <strong>{finding.label}</strong>
                    <p>
                      Possible visual match based on the AI model.
                    </p>
                  </div>

                  {percentage !== null && (
                    <span>{percentage}%</span>
                  )}
                </div>
              );
            })}
        </div>
      )}

      <div className="important-card">
        <strong>Important</strong>

        <p>
          This is an AI visual screening result, not a
          medical diagnosis. The AI can make mistakes and
          cannot reliably rule out skin conditions.
        </p>

        <p>
          If a spot or lesion is new, changing, bleeding,
          painful, persistent, or concerning to you, consider
          having it assessed by a qualified healthcare
          professional.
        </p>
      </div>

      <button
        className="primary-button"
        onClick={onNewScan}
      >
        Scan another area
      </button>
    </section>
  );
}

export default ResultCard;
