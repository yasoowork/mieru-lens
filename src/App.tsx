import { useEffect, useMemo, useRef, useState } from "react"
import "./App.css"

type Mode = "clear" | "color"

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [mode, setMode] = useState<Mode>("clear")
  const [strength, setStrength] = useState(50)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      } catch {
        setError("カメラを起動できませんでした。ブラウザのカメラ許可を確認してください。")
      }
    }

    startCamera()

    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const filterStyle = useMemo(() => {
    const amount = strength / 100

    if (mode === "clear") {
      const contrast = 1 + amount * 0.35
      const brightness = 1 + amount * 0.08
      const saturate = 1 + amount * 0.12

      return {
        filter: `contrast(${contrast}) brightness(${brightness}) saturate(${saturate})`,
      }
    }

    const contrast = 1 + amount * 0.25
    const saturate = 1 + amount * 0.45
    const brightness = 1 + amount * 0.04

    return {
      filter: `contrast(${contrast}) brightness(${brightness}) saturate(${saturate})`,
    }
  }, [mode, strength])

  return (
    <main className="app">
      <video
        ref={videoRef}
        className="camera"
        style={filterStyle}
        playsInline
        muted
        autoPlay
      />

      {error && <div className="error">{error}</div>}

      <button className="menuButton" type="button" aria-label="メニュー">
        ☰
      </button>

      <section className="controls" aria-label="補正設定">
        <div className="modeTabs">
          <button
            type="button"
            className={mode === "clear" ? "active" : ""}
            onClick={() => setMode("clear")}
          >
            くっきり
          </button>
          <button
            type="button"
            className={mode === "color" ? "active" : ""}
            onClick={() => setMode("color")}
          >
            色
          </button>
        </div>

        <label className="sliderLabel">
          <span>強さ</span>
          <span>{strength}</span>
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value={strength}
          onChange={(event) => setStrength(Number(event.target.value))}
        />
      </section>
    </main>
  )
}

export default App