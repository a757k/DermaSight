export function checkImageQuality(imageElement) {
  if (!imageElement) {
    return {
      good: false,
      reason: "No image was provided."
    };
  }

  const width = imageElement.naturalWidth;
  const height = imageElement.naturalHeight;

  if (width < 500 || height < 500) {
    return {
      good: false,
      reason:
        "The image is too small. Please take a clearer photo."
    };
  }

  return {
    good: true,
    reason: ""
  };
}
