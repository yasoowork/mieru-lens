import { useEffect, useRef } from "react"

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

      const context = canvas.getContext("2d")
      if (!context) return

      const width = video.videoWidth
      const height = video.videoHeight

      if (width && height) {
        canvas.width = width
        canvas.height = height
        context.drawImage(video, 0, 0, width, height)
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
  }, [])

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        overflow: "hidden",
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
    </div>
  )
}

export default App