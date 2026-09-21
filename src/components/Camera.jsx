import { useRef, useState } from "react";

function Camera({ bodyPart, onCapture, onBack }) {
  const fileInput = useRef(null);
  const videoRef = useRef(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");

  async function startCamera() {
    setError("");

    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 1280 }
          },
          audio: false
        });

      setStream(mediaStream);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      setError(
        "Camera access was unavailable. You can upload a photo instead."
      );
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    setStream(null);
    setCameraOpen(false);
  }

  function takePhoto() {
    const video = videoRef.current;

    if (!video) return;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image = canvas.toDataURL(
      "image/jpeg",
      0.9
    );

    stopCamera();
    onCapture(image);
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onCapture(reader.result);
    };

    reader.onerror = () => {
      setError(
        "The image could not be loaded. Please try another photo."
      );
    };

    reader.readAsDataURL(file);

    // Allows the user to select the same image again later.
    event.target.value = "";
  }

  const readablePart =
    bodyPart.charAt(0).toUpperCase() +
    bodyPart.slice(1);

  return (
    <section className="camera-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back
      </button>

      <div className="page-heading">
        <div className="hero-badge">
          STEP 2 OF 3
        </div>

        <h1>
          Capture your
          <br />
          <span>
            {readablePart.toLowerCase()}
          </span>
        </h1>

        <p>
          Use bright, even lighting and keep the
          camera focused on the skin.
        </p>
      </div>

      {!cameraOpen && (
        <div className="capture-panel">
          <div className="capture-illustration">
            <div className="scan-circle">
              <span>✦</span>
            </div>
          </div>

          <div className="capture-buttons">
            <button
              className="primary-button"
              onClick={startCamera}
            >
              <span>⌾</span>
              Open Camera
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                fileInput.current?.click()
              }
            >
              <span>↑</span>
              Upload Photo
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={handleUpload}
            />
          </div>
        </div>
      )}

      {cameraOpen && (
        <div className="live-camera">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />

          <div className="camera-frame"></div>

          <button
            className="capture-button"
            onClick={takePhoto}
            aria-label="Take photo"
          >
            <span></span>
          </button>

          <button
            className="secondary-button camera-cancel"
            onClick={stopCamera}
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="photo-tips">
        <div>
          <span>☀</span>
          <strong>Good lighting</strong>
          <small>Avoid strong shadows</small>
        </div>

        <div>
          <span>◎</span>
          <strong>Focus clearly</strong>
          <small>Keep the skin sharp</small>
        </div>

        <div>
          <span>□</span>
          <strong>Fill the frame</strong>
          <small>Show the finding clearly</small>
        </div>
      </div>
    </section>
  );
}

export default Camera;
