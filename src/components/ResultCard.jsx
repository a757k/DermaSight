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
            : status === "clear"
            ? "result-clear"
            : "result-unable"
        }`}
      >
        <div className="result-icon">
          {status === "concerning"
            ? "!"
            : status === "clear"
            ? "✓"
            : "?"}
        </div>

        <div>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
      </div>

      {result?.findings?.length > 0 && (
        <div className="findings-card">
          <h2>Visual findings</h2>

          {result.findings.map((finding, index) => (
            <div className="finding" key={index}>
              <div>
                <strong>{finding.name}</strong>
                <p>{finding.description}</p>
              </div>

              {finding.confidence && (
                <span>{finding.confidence}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="important-card">
        <strong>Important</strong>

        <p>
          This result is a visual screening result, not a
          medical diagnosis. Skin conditions can look similar
          and an image cannot reliably rule out disease.
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
