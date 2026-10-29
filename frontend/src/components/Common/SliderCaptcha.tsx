import { ArrowRight, Lock, RefreshCw, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/utils"

const W = 320
const H = 160
const L = 42
const R = 9
const PI = Math.PI
const ACCURACY = 5

type Status = "idle" | "moving" | "success" | "fail"


function puzzlePath(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arc(x + L / 2, y - R + 2, R, 0.72 * PI, 2.26 * PI)
  ctx.lineTo(x + L, y)
  ctx.arc(x + L + R - 2, y + L / 2, R, 1.21 * PI, 2.78 * PI)
  ctx.lineTo(x + L, y + L)
  ctx.lineTo(x, y + L)
  ctx.arc(x + R - 2, y + L / 2, R + 0.4, 2.76 * PI, 1.24 * PI, true)
  ctx.lineTo(x, y)
  ctx.closePath()
}

function drawHole(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // 挖空缺口
  ctx.save()
  puzzlePath(ctx, x, y)
  ctx.globalCompositeOperation = "destination-out"
  ctx.fill()
  ctx.restore()

  // 半透明遮罩，形成缺口阴影
  ctx.save()
  puzzlePath(ctx, x, y)
  ctx.fillStyle = "rgba(0,0,0,0.4)"
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.4)"
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

function drawPiece(
  bctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  x: number,
  y: number,
  blockW: number,
) {
  bctx.clearRect(0, 0, blockW, H)
  // 先把缺口对应区域画到 block
  bctx.drawImage(source, x, 0, blockW, H, 0, 0, blockW, H)
  // 只保留拼图形状
  bctx.save()
  bctx.globalCompositeOperation = "destination-in"
  puzzlePath(bctx, 0, y)
  bctx.fillStyle = "#000"
  bctx.fill()
  bctx.restore()

  // 白边描边
  bctx.save()
  puzzlePath(bctx, 0, y)
  bctx.lineWidth = 1.5
  bctx.strokeStyle = "#fff"
  bctx.shadowColor = "rgba(0,0,0,0.35)"
  bctx.shadowBlur = 4
  bctx.stroke()
  bctx.restore()
}

function paintScene(ctx: CanvasRenderingContext2D, seed: number) {
  const palettes = [
    ["#312e81", "#1e3a8a", "#0f766e"],
    ["#4c1d95", "#5b21b6", "#2563eb"],
    ["#0f172a", "#1e293b", "#475569"],
    ["#134e4a", "#155e75", "#1d4ed8"],
  ]
  const c = palettes[seed % palettes.length]
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, c[0])
  g.addColorStop(0.5, c[1])
  g.addColorStop(1, c[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < 12; i++) {
    const cx = ((seed * 41 + i * 47) % (W - 30)) + 15
    const cy = ((seed * 19 + i * 31) % (H - 20)) + 10
    const rr = 12 + ((seed + i * 13) % 36)
    const rg = ctx.createRadialGradient(cx, cy, 1, cx, cy, rr)
    rg.addColorStop(0, "rgba(255,255,255,0.32)")
    rg.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, PI * 2)
    ctx.fill()
  }
}

function buildSource(seed: number) {
  const source = document.createElement("canvas")
  source.width = W
  source.height = H
  paintScene(source.getContext("2d")!, seed)
  return source
}

interface PanelProps {
  onSuccess: () => void
  onClose: () => void
}

function SliderCaptchaPanel({ onSuccess, onClose }: PanelProps) {
  const { t } = useTranslation()
  const bgRef = useRef<HTMLCanvasElement>(null)
  const blockRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(() => Date.now())
  const [targetX, setTargetX] = useState(0)
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState<Status>("idle")
  const dragging = useRef(false)
  const startX = useRef(0)
  const startOffset = useRef(0)

  const blockW = L + R * 2 + 3
  const maxOffset = W - blockW - 2

  const resetPuzzle = useCallback(() => {
    const bg = bgRef.current
    const block = blockRef.current
    if (!bg || !block) return
    const ctx = bg.getContext("2d")
    const bctx = block.getContext("2d")
    if (!ctx || !bctx) return

    const source = buildSource(seed)
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(source, 0, 0)

    const x = 120 + Math.floor(Math.random() * (W - L - 150))
    const y = 24 + Math.floor(Math.random() * (H - L - 48))
    setTargetX(x)
    setOffset(0)
    setStatus("idle")

    drawHole(ctx, x, y)

    block.width = blockW
    block.height = H
    drawPiece(bctx, source, x, y, blockW)
  }, [blockW, seed])

  useEffect(() => {
    resetPuzzle()
  }, [resetPuzzle])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (status === "success") return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    startX.current = e.clientX
    startOffset.current = offset
    setStatus("moving")
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const next = Math.max(
      0,
      Math.min(maxOffset, startOffset.current + e.clientX - startX.current),
    )
    setOffset(next)
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (Math.abs(offset - targetX) <= ACCURACY) {
      setStatus("success")
      setOffset(targetX)
      window.setTimeout(() => onSuccess(), 300)
    } else {
      setStatus("fail")
      window.setTimeout(() => {
        setOffset(0)
        setStatus("idle")
      }, 380)
    }
  }

  const progress = maxOffset > 0 ? offset / maxOffset : 0

  return (
    <div className="w-[336px] max-w-[calc(100vw-2rem)] rounded-xl bg-white p-3 shadow-2xl dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm text-foreground">{t("captcha.dragTip")}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            title={t("captcha.refresh")}
            onClick={() => setSeed(Date.now())}
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={onClose}
            aria-label="close"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto overflow-hidden rounded-md" style={{ width: W }}>
        <canvas ref={bgRef} width={W} height={H} className="block" />
        <canvas
          ref={blockRef}
          width={blockW}
          height={H}
          className="pointer-events-none absolute top-0 will-change-[left]"
          style={{
            left: offset,
            transition: status === "fail" ? "left .35s ease" : "none",
          }}
        />
      </div>

      <div
        className={cn(
          "relative mt-3 h-10 touch-none select-none overflow-hidden rounded-md border bg-[#f7f9fa]",
          status === "success" && "border-emerald-400",
          status === "fail" && "border-rose-300",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{

            width: offset <= 0 ? 0 : progress * W + 20,
            background:
              status === "success"
                ? "linear-gradient(90deg,#86efac,#10b981)"
                : status === "fail"
                  ? "linear-gradient(90deg,#fda4af,#f43f5e)"
                  : "linear-gradient(90deg,#6ee7b7,#14b8a6)",
            transition: status === "fail" ? "width .35s ease" : "none",
          }}
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-11 text-xs",
            status === "success" || status === "fail"
              ? "text-muted-foreground"
              : "captcha-track__text",
          )}
        >
          {status === "success"
            ? t("captcha.success")
            : status === "fail"
              ? t("captcha.fail")
              : t("captcha.holdTip")}
        </div>

        <div
          className={cn(
            "absolute inset-y-0 left-0 z-[2] flex w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm",
            status === "success" && "border-emerald-500 text-emerald-600",
            status === "fail" && "border-rose-400 text-rose-500",
          )}
          style={{
            transform: `translateX(${progress * (W - 40)}px)`,
            transition: status === "fail" ? "transform .35s ease" : "none",
          }}
        >
          <ArrowRight className="size-4" />
        </div>
      </div>
    </div>
  )
}

interface SliderCaptchaProps {
  verified: boolean
  onVerifiedChange: (verified: boolean) => void
  className?: string
}

export function SliderCaptcha({
  verified,
  onVerifiedChange,
  className,
}: SliderCaptchaProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        data-testid="slider-captcha-trigger"
        className={cn(
          "captcha-entry flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-[13px] font-medium transition-[background,border-color] duration-200",
          verified
            ? "captcha-entry--passed border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
            : "border-primary/35 bg-primary/[0.06] text-primary hover:bg-primary/10",
        )}
        onClick={() => {
          if (verified) return
          setOpen(true)
        }}
      >
        <Lock className="size-3.5 shrink-0" />
        <span
          className={cn(
            "captcha-entry__text",
            !verified && "captcha-entry__text--shimmer",
          )}
        >
          {verified ? t("captcha.verified") : t("captcha.clickTip")}
        </span>
        {!verified && (
          <ArrowRight
            className="captcha-entry__arrow size-3 shrink-0 opacity-75"
            aria-hidden
          />
        )}
      </button>

      {open && !verified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10">
            <SliderCaptchaPanel
              onClose={() => setOpen(false)}
              onSuccess={() => {
                onVerifiedChange(true)
                setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SliderCaptcha
