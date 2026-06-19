const MS_PER_HOUR = 3600000
const MS_PER_MIN = 60000
const MS_PER_SEC = 1000

function formatDuration(ms) {
  const h = Math.floor(ms / MS_PER_HOUR)
  const m = Math.floor((ms % MS_PER_HOUR) / MS_PER_MIN)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTimer(ms) {
  const h = String(Math.floor(ms / MS_PER_HOUR)).padStart(2, '0')
  const m = String(Math.floor((ms % MS_PER_HOUR) / MS_PER_MIN)).padStart(2, '0')
  const s = String(Math.floor((ms % MS_PER_MIN) / MS_PER_SEC)).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function parseSessions(sessions) {
  const parsed = []
  for (const s of sessions) {
    if (s.start && s.end) {
      parsed.push({start: s.start, end: s.end, duration: s.end - s.start})
    }
  }
  return parsed
}

function groupByDay(sessions) {
  const map = {}
  for (const s of sessions) {
    const date = new Date(s.start).toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'})
    map[date] = (map[date] || 0) + s.duration
  }
  return map
}

function drawChart(canvas, dailyData) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width
  const h = rect.height

  const dates = Object.keys(dailyData)
  const values = Object.values(dailyData)
  const maxVal = Math.max(...values, 1)

  const pad = {top: 20, right: 16, bottom: 40, left: 50}
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom
  const barW = Math.min(36, chartW / dates.length * 0.7)
  const gap = chartW / dates.length

  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = '#494d64'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(w - pad.right, y)
    ctx.stroke()

    ctx.fillStyle = '#6c7086'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    const val = Math.round((maxVal / 4) * (4 - i))
    ctx.fillText(formatDuration(val), pad.left - 8, y + 4)
  }

  dates.forEach((date, i) => {
    const x = pad.left + gap * i + (gap - barW) / 2
    const barH = (values[i] / maxVal) * chartH
    const y = pad.top + chartH - barH

    const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH)
    grad.addColorStop(0, '#c6a0f6')
    grad.addColorStop(1, '#8aadf4')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
    ctx.fill()

    ctx.fillStyle = '#a5adcb'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(date, x + barW / 2, pad.top + chartH + 18)

    ctx.fillStyle = '#cad3f5'
    ctx.font = '11px sans-serif'
    ctx.fillText(formatDuration(values[i]), x + barW / 2, y - 6)
  })
}

let completedSessions = []
let dailyData = {}
let timerInterval = null
let chartInterval = null
let activeStart = null

function updateTimer() {
  if (!activeStart) return
  const elapsed = Date.now() - activeStart
  document.getElementById('timerDisplay').textContent = formatTimer(elapsed)
}

function refreshChart() {
  const displayDaily = {...dailyData}
  if (activeStart) {
    const today = new Date().toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'})
    displayDaily[today] = (displayDaily[today] || 0) + (Date.now() - activeStart)
  }
  drawChart(document.getElementById('chart'), displayDaily)
}

function refreshStats() {
  const total = completedSessions.reduce((s, x) => s + x.duration, 0)
  const elapsed = activeStart ? Date.now() - activeStart : 0
  const days = Object.keys(dailyData).length
  document.getElementById('totalTime').textContent = formatDuration(total + elapsed)
  document.getElementById('totalDays').textContent = days
  document.getElementById('avgTime').textContent = days ? formatDuration(Math.round(total / days)) : '0'
}

function startTimer(startTs) {
  activeStart = startTs
  document.getElementById('recordBtn').textContent = '停止记录'
  document.getElementById('recordBtn').classList.add('recording')
  document.getElementById('timerDisplay').classList.add('active')
  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)
  chartInterval = setInterval(() => {
    refreshChart()
    refreshStats()
  }, 5000)
}

function stopTimer() {
  activeStart = null
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (chartInterval) {
    clearInterval(chartInterval)
    chartInterval = null
  }
  document.getElementById('timerDisplay').textContent = '00:00:00'
  document.getElementById('recordBtn').textContent = '开始记录'
  document.getElementById('recordBtn').classList.remove('recording')
  document.getElementById('timerDisplay').classList.remove('active')
}

function reloadData(data) {
  completedSessions = parseSessions(data.sessions)
  dailyData = groupByDay(completedSessions)
  refreshChart()
  refreshStats()
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await window.electronAPI.readCodeTime()

    if (data.activeStart) {
      startTimer(data.activeStart)
    }

    reloadData(data)
  } catch (err) {
    alert('读取数据失败: ' + err.message)
  }

  if (window.electronAPI.onAutoEndSession) {
    window.electronAPI.onAutoEndSession(async () => {
      if (!activeStart) return
      stopTimer()
      try {
        const data = await window.electronAPI.readCodeTime()
        reloadData(data)
      } catch (_) {}
    })
  }

  document.getElementById('recordBtn').addEventListener('click', async () => {
    try {
      if (activeStart) {
        const data = await window.electronAPI.endSession()
        stopTimer()
        reloadData(data)
      } else {
        const data = await window.electronAPI.startSession()
        startTimer(data.activeStart)
      }
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  })
})
