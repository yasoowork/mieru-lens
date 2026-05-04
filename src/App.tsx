import { useEffect, useRef, useState } from "react"

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strength, setStrength] = useState(50)

  useEffect(() => {
    let animationFrameId: number
    let stream: MediaStream | null = null

    const startCamera = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      if (!videoRef.current) return

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      drawFrame()
    }

    const drawFrame = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) return

      const width = video.videoWidth
      const height = video.videoHeight

      if (width && height) {
        canvas.width = width
        canvas.height = height

        context.drawImage(video, 0, 0, width, height)

        const imageData = context.getImageData(0, 0, width, height)
        applyClearFilter(imageData.data, strength)
        context.putImageData(imageData, 0, 0)
      }

      animationFrameId = requestAnimationFrame(drawFrame)
    }

    startCamera().catch((error) => {
      console.error("Camera error:", error)
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [strength])

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <video ref={videoRef} playsInline muted style={{ display: "none" }} />

      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 24,
          padding: 16,
          borderRadius: 20,
          background: "rgba(15, 23, 42, 0.72)",
          color: "white",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 14 }}>強さ</div>
        <input
          type="range"
          min="0"
          max="100"
          value={strength}
          onChange={(event) => setStrength(Number(event.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  )
}

function applyClearFilter(data: Uint8ClampedArray, strength: number) {
  const amount = strength / 100

  const contrast = 1 + amount * 0.8
  const brightness = amount * 18

  for (let index = 0; index < data.length; index += 4) {
    data[index] = clamp((data[index] - 128) * contrast + 128 + brightness)
    data[index + 1] = clamp((data[index + 1] - 128) * contrast + 128 + brightness)
    data[index + 2] = clamp((data[index + 2] - 128) * contrast + 128 + brightness)
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value))
}

export default App