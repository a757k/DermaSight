function ResultCard({
  result,
  image,
  bodyPart,
  onNewScan
}) {
  const status =
    result?.status || "unable";

  const title =
    result?.title ||
    "Unable to assess reliably";

  const message =
    result?.message ||
    "No reliable result could be produced.";

  return (
    <section className="result-page">
      <div className="hero-badge">
        ANALYSIS COMPLETE
      </div>

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
        className={
          "result-card " +
          (
            status === "complete"
              ? "result-clear"
              : status === "concerning"
              ? "result-concerning"
              : "result-unable"
          )
        }
      >
        <div className="result-icon">
          {status === "complete"
            ? "✓"
            : status === "concerning"
            ? "!"
            : "?"}
        </div>

        <div>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
      </div>

      {result?.findings?.length > 0 && (
        <div className="findings-card">
          <h2>AI predictions</h2>

          {result.findings.map(
            (finding, index) => (
              <div
                className="finding"
                key={index}
              >
                <div>
                  <strong>
                    {finding.name}
                  </strong>

                  <p>
                    {finding.description}
                  </p>
                </div>

                <span>
                  {finding.confidence}
                </span>
              </div>
            )
          )}
        </div>
      )}

      <div className="important-card">
        <strong>Important</strong>

        <p>
          This is an AI visual screening
          result, not a medical diagnosis.
          The model can make mistakes and
          skin conditions can look similar.
        </p>

        <p>
          The percentage shown is the
          model's classification score. It
          is NOT the probability that you
          have the condition.
        </p>

        <p>
          A normal or low-confidence result
          does not rule out disease. If a
          spot or lesion is new, changing,
          bleeding, painful, persistent, or
          concerning to you, consider having
          it assessed by a qualified
          healthcare professional.
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
