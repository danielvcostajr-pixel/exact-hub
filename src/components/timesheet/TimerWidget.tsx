"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Square, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

interface TimerState {
  running: boolean
  paused: boolean
  client: string
  activity: string
  startedAt: number | null
  pausedSeconds: number
}

const fmtSeconds = (s: number): string => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((v) => v.toString().padStart(2, "0")).join(":")
}

export function TimerWidget() {
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Read timer state from localStorage ────────────────────────────────────
  const readTimer = useCallback(() => {
    try {
      const saved = localStorage.getItem("exacthub_timer")
      if (!saved) {
        setTimerState(null)
        return
      }
      const data: TimerState = JSON.parse(saved)
      setTimerState(data)
      if (data.running && !data.paused && data.startedAt) {
        const secs = Math.floor((Date.now() - data.startedAt) / 1000) + data.pausedSeconds
        setElapsed(secs)
      } else {
        setElapsed(data.pausedSeconds || 0)
      }
    } catch {
      setTimerState(null)
    }
  }, [])

  useEffect(() => {
    readTimer()
    // Poll localStorage every second so widget stays in sync across tabs
    const poll = setInterval(readTimer, 1000)
    return () => clearInterval(poll)
  }, [readTimer])

  // ── Live tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerState?.running && !timerState.paused) {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => s + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState?.running, timerState?.paused])

  const handleStop = () => {
    localStorage.removeItem("exacthub_timer")
    setTimerState(null)
    setElapsed(0)
  }

  // Do not render if no active timer
  if (!timerState || (!timerState.running && !timerState.paused)) {
    return null
  }

  const isPaused = timerState.paused

  return (
    <div
      className="fixed bottom-6 right-6 z-50 select-none"
      style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}
    >
      <div
        className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 ${
          minimized ? "w-44" : "w-72"
        }`}
      >
        {/* Header bar */}
        <div
          className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
            isPaused
              ? "bg-yellow-500/10 border-b border-yellow-500/20"
              : "bg-primary/10 border-b border-primary/20"
          }`}
          onClick={() => setMinimized((m) => !m)}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isPaused ? "bg-yellow-500" : "bg-primary animate-pulse"
              }`}
            />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isPaused
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-primary"
              }`}
            >
              {isPaused ? "Pausado" : "Gravando"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-bold tabular-nums font-numbers ${
                isPaused
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-primary"
              }`}
            >
              {fmtSeconds(elapsed)}
            </span>
            {minimized ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Body (visible when not minimized) */}
        {!minimized && (
          <div className="px-4 py-3 space-y-3">
            {/* Client + activity */}
            <div className="space-y-0.5">
              <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                {timerState.client || "Cliente nao selecionado"}
              </p>
              {timerState.activity && (
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  {timerState.activity}
                </p>
              )}
            </div>

            {/* Big timer */}
            <div
              className={`text-3xl font-bold text-center tabular-nums font-numbers py-1 rounded-xl ${
                isPaused
                  ? "text-yellow-600 dark:text-yellow-400 bg-yellow-500/5"
                  : "text-primary bg-primary/5"
              }`}
            >
              {fmtSeconds(elapsed)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
              >
                <Square className="size-3.5 fill-current" />
                Parar
              </button>
              <Link
                href="/timesheet?tab=timer"
                className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors border border-border"
              >
                <ExternalLink className="size-3.5" />
                Abrir
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
