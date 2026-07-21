import { useEffect, useState, type ReactNode } from "react"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function formatLocalDate(now: Date) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

function formatLocalTime(now: Date) {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
}

function msUntilNextSecond(now: Date) {
  return 1000 - now.getMilliseconds() + 50
}

function StatusRightSegment({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`-ml-2 px-3 py-0.5 pl-5 [clip-path:polygon(8px_0,100%_0,100%_100%,8px_100%,0_50%)] ${className}`}
    >
      {children}
    </span>
  )
}

export default function StatusClock() {
  const [date, setDate] = useState("----/--/--")
  const [time, setTime] = useState("--:--:--")
  const [cpu, setCpu] = useState(3.4)

  useEffect(() => {
    let timeoutId = 0

    const tick = () => {
      const now = new Date()
      setDate(formatLocalDate(now))
      setTime(formatLocalTime(now))
      timeoutId = window.setTimeout(tick, msUntilNextSecond(now))
    }

    tick()
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    let timeoutId = 0

    const tick = () => {
      setCpu(0.2 + Math.random() * 9.8)
      timeoutId = window.setTimeout(tick, 3000 + Math.random() * 1000)
    }

    tick()
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <>
      <StatusRightSegment className="hidden bg-cyan-300/15 text-cyan-100 sm:inline">
        CPU {cpu.toFixed(1)}%
      </StatusRightSegment>
      <StatusRightSegment className="hidden bg-slate-800 text-slate-300 md:inline">
        {date}
      </StatusRightSegment>
      <StatusRightSegment className="bg-cyan-300 font-semibold text-slate-950">
        {time}
      </StatusRightSegment>
    </>
  )
}
