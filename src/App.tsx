import { useEffect, useRef, useState } from "react"
import "./App.css"
import { WebGLCamera } from "./components/WebGLCamera"
import type { ColorType, ViewMode } from "./components/WebGLCamera"

function App() {
  const [mode, setMode] = useState<ViewMode>("clear")
  const [strength, setStrength] = useState(50)
  const [colorType, setColorType] = useState<ColorType>("C")
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [keepScreenOn, setKeepScreenOn] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const colorTypeLabels: Record<ColorType, string> = {
    C: "通常の色補助",
    P: "赤系が見分けづらい方向け",
    D: "緑系が見分けづらい方向け",
    T: "青系が見分けづらい方向け",
    A: "色ではなく明暗で見分ける補助",
  }

  useEffect(() => {
    const requestWakeLock = async () => {
      if (!keepScreenOn) return
      if (!("wakeLock" in navigator)) return

      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
      } catch {
        setKeepScreenOn(false)
      }
    }

    const releaseWakeLock = async () => {
      try {
        await wakeLockRef.current?.release()
      } finally {
        wakeLockRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock()
      } else {
        releaseWakeLock()
      }
    }

    if (keepScreenOn) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      releaseWakeLock()
    }
  }, [keepScreenOn])

  return (
    <main className="app">
      <WebGLCamera
        mode={mode}
        strength={strength}
        colorType={colorType}
        onError={setError}
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

        {mode === "color" && (
          <div className="colorTabs">
            {(["C", "P", "D", "T", "A"] as ColorType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={colorType === type ? "active" : ""}
                onClick={() => setColorType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        )}

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

        {mode === "color" && (
          <p className="colorTypeDescription">
            {colorTypeLabels[colorType]}
          </p>
        )}

        <label className="wakeLockToggle">
          <input
            type="checkbox"
            checked={keepScreenOn}
            onChange={(event) => setKeepScreenOn(event.target.checked)}
          />
          <span>画面を点灯したままにする</span>
        </label>
      </section>

      {isMenuOpen && (
        <div className="menuOverlay" onClick={() => setIsMenuOpen(false)}>
          <aside
            className="menuPanel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="menuHeader">
              <div>
                <h1>MieruLens</h1>
                <p>カメラ映像を見やすくする視認補助レンズ</p>
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
                輪郭や色の見やすさを補助するWebアプリです。
              </p>
            </section>

            <section className="menuSection">
              <h2>使い方</h2>
              <p>
                くっきりモードまたは色モードを選び、下部スライダーで補正の強さを調整してください。
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
                不具合や改善要望は{" "}
                <a
                  href="https://github.com/yasoowork/mieru-lens/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub Issues
                </a>{" "}
                までご連絡ください。
              </p>
            </section>

            <section className="menuSection">
              <h2>Support</h2>
              <p>
                MieruLensは個人開発で運営しています。
                改善・機能追加を継続するため、よければGitHub Sponsorsで応援していただけると助かります。
              </p>

              <div className="linkList supportLinks">
                <a
                  href="https://github.com/sponsors/yasoowork"
                  target="_blank"
                  rel="noreferrer"
                >
                  応援する
                </a>
              </div>
            </section>

            <section className="menuSection">
              <h2>Related</h2>
              <div className="linkList">
                <a
                  href="https://www.amazon.co.jp/?tag=yasoowork-22"
                  target="_blank"
                  rel="noreferrer"
                >
                  Amazon
                </a>
              </div>
            </section>

            <p className="createdBy">
              Created by{" "}
              <a href="https://yasoo.work" target="_blank" rel="noreferrer">
                yasoo.work
              </a>
            </p>
          </aside>
        </div>
      )}
    </main>
  )
}

export default App