export function resizeImage(
  dataUrl,
  maxSize = 1280
) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      let width = image.width;
      let height = image.height;

      if (width > height && width > maxSize) {
        height = Math.round(
          height * (maxSize / width)
        );
        width = maxSize;
      } else if (
        height >= width &&
        height > maxSize
      ) {
        width = Math.round(
          width * (maxSize / height)
        );
        height = maxSize;
      }

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      resolve(
        canvas.toDataURL("image/jpeg", 0.85)
      );
    };

    image.onerror = () => {
      reject(new Error("Unable to process image."));
    };

    image.src = dataUrl;
  });
}
