import { useEffect, useMemo, useRef, useState } from "react"
import "./App.css"

type Mode = "clear" | "color"

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [mode, setMode] = useState<Mode>("clear")
  const [strength, setStrength] = useState(50)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

      <button
        className="menuButton"
        type="button"
        aria-label="メニュー"
        onClick={() => setIsMenuOpen(true)}
      >
        ☰
      </button>

      {isMenuOpen && (
        <div className="menuOverlay" onClick={() => setIsMenuOpen(false)}>
          <aside className="menuPanel" onClick={(event) => event.stopPropagation()}>
            <div className="menuHeader">
              <div>
                <h1>MieruLens</h1>
                <p>見やすくするための視認補助レンズ</p>
              </div>

              <button
                className="closeButton"
                type="button"
                aria-label="閉じる"
                onClick={() => setIsMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <section className="menuSection">
              <h2>About</h2>
              <p>
                MieruLensは、スマホのカメラ映像をリアルタイムで補正し、
                文字・輪郭・色の見やすさを補助するWebアプリです。
              </p>
            </section>

            <section className="menuSection">
              <h2>使い方</h2>
              <p>
                くっきりモードまたは色モードを選び、下部スライダーで補正の強さを調整してください。
                見づらくなった場合は強さを下げてください。
              </p>
            </section>

            <section className="menuSection">
              <h2>プライバシー</h2>
              <p>
                カメラ映像は端末内で処理され、サーバーへ送信されることはありません。
              </p>
            </section>

            <section className="menuSection">
              <h2>広告・アクセス解析</h2>
              <p>
                Google Analytics、Google AdSense、Amazonアソシエイトを利用しています。
              </p>
            </section>

            <section className="menuSection">
              <h2>免責</h2>
              <p>
                本アプリは視認補助を目的としています。
                医療用途や安全確認には使用しないでください。
                本アプリの利用によって生じたいかなる損害についても責任を負いません。
              </p>
            </section>

            <section className="menuSection">
              <h2>不具合報告</h2>
              <p>
                不具合や改善要望は 
                <a href="https://github.com/yasoowork/mieru-lens/issues" target="_blank" rel="noreferrer">
                  GitHub Issues
                </a>      
                 までご連絡ください。
              </p>
            </section>

            <section className="menuSection">
              <h2>Related</h2>
              <div className="linkList">
                <a href="https://www.amazon.co.jp/?tag=yasoowork-22" target="_blank" rel="noreferrer">
                  Amazon
                </a>
              </div>
            </section>

            <p className="createdBy">
              Created by <a href="https://yasoo.work" target="_blank" rel="noreferrer">yasoo.work</a>
            </p>
            
          </aside>
        </div>
      )}

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