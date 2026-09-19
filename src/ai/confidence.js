const MIN_CONFIDENCE = 0.65;

export function isReliable(confidence) {
  if (typeof confidence !== "number") {
    return false;
  }

  return confidence >= MIN_CONFIDENCE;
}

export function getConfidencePercent(confidence) {
  if (typeof confidence !== "number") {
    return null;
  }

  return Math.round(confidence * 100);
}
