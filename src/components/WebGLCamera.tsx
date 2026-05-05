import { useEffect, useRef } from "react"

export type ViewMode = "clear" | "color"
export type ColorType = "C" | "P" | "D" | "T" | "A"

type WebGLCameraProps = {
  mode: ViewMode
  strength: number
  colorType: ColorType
  onError: (message: string) => void
}

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

const fragmentShaderSource = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_strength;
uniform int u_mode;
uniform int u_colorType;

varying vec2 v_texCoord;

vec3 adjustContrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

vec3 adjustSaturation(vec3 color, float saturation) {
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(gray), color, saturation);
}

vec3 applyColorMatrix(vec3 color, mat3 matrix) {
  return clamp(matrix * color, 0.0, 1.0);
}

void main() {
  vec4 tex = texture2D(u_texture, v_texCoord);
  vec3 color = tex.rgb;
  float s = u_strength;
  float intensity = smoothstep(0.0, 1.0, s);

  if (u_mode == 0) {
    float contrast = 1.0 + s * 0.6;
    float saturation = 1.0 + s * 0.2;
    float brightness = 1.0 + s * 0.08;

    color = adjustContrast(color, contrast);
    color = adjustSaturation(color, saturation);
    color *= brightness;
  }

    if (u_mode == 1) {
        if (u_colorType == 0) {
            color = adjustContrast(color, 1.0 + intensity * 0.3);
            color = adjustSaturation(color, 1.0 + intensity * 0.3);
        }

        if (u_colorType == 1) {
            mat3 protan = mat3(
            0.567, 0.433, 0.000,
            0.558, 0.442, 0.000,
            0.000, 0.242, 0.758
            );
            color = mix(color, applyColorMatrix(color, protan), intensity);
            color = adjustContrast(color, 1.0 + intensity * 0.4);
            color = adjustSaturation(color, 1.0 + intensity * 0.25);
        }

        if (u_colorType == 2) {
            mat3 deutan = mat3(
            0.625, 0.375, 0.000,
            0.700, 0.300, 0.000,
            0.000, 0.300, 0.700
            );
            color = mix(color, applyColorMatrix(color, deutan), intensity);
            color = adjustContrast(color, 1.0 + intensity * 0.35);
            color = adjustSaturation(color, 1.0 + intensity * 0.2);
        }

        if (u_colorType == 3) {
            mat3 tritan = mat3(
            0.950, 0.050, 0.000,
            0.000, 0.433, 0.567,
            0.000, 0.475, 0.525
            );
            color = mix(color, applyColorMatrix(color, tritan), intensity);
            color = adjustContrast(color, 1.0 + intensity * 0.35);
            color = adjustSaturation(color, 1.0 + intensity * 0.2);
        }

        if (u_colorType == 4) {
            float gray = dot(color, vec3(0.299, 0.587, 0.114));
            color = vec3(gray);
            color = adjustContrast(color, 1.0 + intensity * 0.7);
        }
    }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a);
}
`

export function WebGLCamera({
  mode,
  strength,
  colorType,
  onError,
}: WebGLCameraProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const propsRef = useRef({ mode, strength, colorType })

  useEffect(() => {
    propsRef.current = { mode, strength, colorType }
  }, [mode, strength, colorType])

  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
        // ページ復帰時に再読み込み
        window.location.reload()
        }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationId = 0
    let disposed = false

    const start = async () => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: false,
      })

      if (!gl) {
        onError("WebGLを利用できません。別のブラウザでお試しください。")
        return
      }

      const program = createProgram(gl, vertexShaderSource, fragmentShaderSource)
      if (!program) {
        onError("WebGLの初期化に失敗しました。")
        return
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
        },
        audio: false,
      })

      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      await video.play()

      const positionLocation = gl.getAttribLocation(program, "a_position")
      const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")
      const textureLocation = gl.getUniformLocation(program, "u_texture")
      const strengthLocation = gl.getUniformLocation(program, "u_strength")
      const modeLocation = gl.getUniformLocation(program, "u_mode")
      const colorTypeLocation = gl.getUniformLocation(program, "u_colorType")

      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
        ]),
        gl.STATIC_DRAW
      )

      const texCoordBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          0, 1,
          1, 1,
          0, 0,
          0, 0,
          1, 1,
          1, 0,
        ]),
        gl.STATIC_DRAW
      )

      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const width = Math.floor(window.innerWidth * dpr)
        const height = Math.floor(window.innerHeight * dpr)

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
          gl.viewport(0, 0, width, height)
        }
      }

      const render = () => {
        if (disposed) return

        resize()

        const current = propsRef.current

        gl.useProgram(program)

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.enableVertexAttribArray(texCoordLocation)
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)

        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            video
          )
        }

        const normalized = current.strength / 100
        const adjusted = Math.pow(normalized, 1.4)

        gl.uniform1i(textureLocation, 0)
        gl.uniform1f(strengthLocation, adjusted)
        gl.uniform1i(modeLocation, current.mode === "clear" ? 0 : 1)
        gl.uniform1i(colorTypeLocation, colorTypeToIndex(current.colorType))

        gl.drawArrays(gl.TRIANGLES, 0, 6)

        animationId = requestAnimationFrame(render)
      }

      render()
    }
    start().catch(() => {
        onError(
            "カメラを起動できませんでした。\nカメラの利用を許可するか、スマートフォンなどカメラ対応端末でお試しください。"
        )
    })

    return () => {
      disposed = true
      cancelAnimationFrame(animationId)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [onError])

  return (
    <>
      <video ref={videoRef} className="hiddenVideo" />
      <canvas ref={canvasRef} className="webglCanvas" />
    </>
  )
}

function colorTypeToIndex(type: ColorType): number {
  switch (type) {
    case "C":
      return 0
    case "P":
      return 1
    case "D":
      return 2
    case "T":
      return 3
    case "A":
      return 4
  }
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader)
    console.error("Shader compile error:", error)
    alert(error)
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}