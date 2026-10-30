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

  const labelStep = gap >= 65 ? 1 : gap >= 42 ? 2 : gap >= 28 ? 3 : 4
  const labelFont = gap >= 60 ? '11px' : gap >= 40 ? '10px' : '9px'
  const showValueLabels = barW >= 12 && dates.length <= 60

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

    if (i % labelStep === 0) {
      ctx.fillStyle = '#a5adcb'
      ctx.font = `${labelFont} sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(date, x + barW / 2, pad.top + chartH + 18)
    }

    if (showValueLabels && barH > 14) {
      ctx.fillStyle = '#cad3f5'
      ctx.font = `${labelFont} sans-serif`
      ctx.fillText(formatDuration(values[i]), x + barW / 2, y - 6)
    }
  })
}

// ── Calendar heatmap ──

const CAL_COLORS = ['#1e2030', '#494d64', '#8bd5ca', '#a6da95', '#c6a0f6']
const CAL_MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const CAL_DAYS = ['一','三','五','日']
const CAL_DAY_ROWS = [0, 2, 4, 6]

function getDailyTotals(sessions) {
  const map = {}
  for (const s of sessions) {
    const d = new Date(s.start)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    map[key] = (map[key] || 0) + s.duration
  }
  return map
}

function getColorLevel(value) {
  if (value === 0) return 0
  const hours = value / MS_PER_HOUR
  if (hours < 1) return 1
  if (hours < 2) return 2
  if (hours < 3) return 3
  return 4
}

let calState = null

function drawCalendar(canvas, sessions) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const w = rect.width * dpr
  canvas.width = w
  ctx.scale(dpr, dpr)
  const cssW = rect.width

  const dailyTotals = getDailyTotals(sessions)

  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - 363)
  const dow = startDate.getDay()
  startDate.setDate(startDate.getDate() + (dow === 0 ? -6 : 1 - dow))

  const cellGap = 2
  const leftPad = 30
  const topPad = 18
  const cols = 53
  const availW = cssW - leftPad - 8
  const cellStep = availW / cols
  const cellSize = Math.max(3, Math.floor(cellStep - cellGap))

  const calH = topPad + 7 * cellStep + 4
  canvas.height = Math.ceil(calH) * dpr
  const h = Math.ceil(calH)

  ctx.clearRect(0, 0, cssW, h)

  // cells
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < 7; row++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + col * 7 + row)
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const val = dailyTotals[key] || 0
      const level = getColorLevel(val)
      const x = leftPad + col * cellStep
      const y = topPad + row * cellStep

      ctx.fillStyle = CAL_COLORS[level]
      ctx.beginPath()
      ctx.roundRect(x, y, cellSize, cellSize, 2)
      ctx.fill()
    }
  }

  // month labels
  const drawnMonths = new Set()
  for (let col = 0; col < cols - 1; col++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + col * 7 + 3)
    const m = date.getMonth()
    if (!drawnMonths.has(m)) {
      drawnMonths.add(m)
      ctx.fillStyle = '#6c7086'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'start'
      ctx.fillText(CAL_MONTHS[m], leftPad + col * cellStep, 12)
    }
  }

  // day labels
  CAL_DAYS.forEach((label, i) => {
    ctx.fillStyle = '#6c7086'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'end'
    ctx.fillText(label, leftPad - 4, topPad + CAL_DAY_ROWS[i] * cellStep + cellSize - 1)
  })

  calState = {startDate, cols, cellStep, cellSize, leftPad, topPad, dailyTotals}
}

function initCalendarHover() {
  const canvas = document.getElementById('calendar')
  const tooltip = document.getElementById('calTooltip')

  canvas.addEventListener('mousemove', (e) => {
    if (!calState) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const {startDate, cols, dailyTotals} = calState

    const leftPad = 30
    const topPad = 18
    const availW = rect.width - leftPad - 8
    const cellStep = availW / cols

    const col = Math.floor((mx - leftPad) / cellStep)
    const row = Math.floor((my - topPad) / cellStep)
    if (col < 0 || col >= cols || row < 0 || row >= 7) {
      tooltip.hidden = true
      return
    }

    const date = new Date(startDate)
    date.setDate(date.getDate() + col * 7 + row)
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    const val = dailyTotals[key] || 0

    const dateStr = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`
    const durStr = val > 0 ? formatDuration(val) : '无记录'

    tooltip.textContent = `${dateStr} — ${durStr}`
    tooltip.hidden = false

    let tx = e.clientX + 12
    let ty = e.clientY - 30
    if (ty < 0) ty = e.clientY + 16
    if (tx + tooltip.offsetWidth + 12 > window.innerWidth) {
      tx = e.clientX - tooltip.offsetWidth - 12
    }
    tooltip.style.left = tx + 'px'
    tooltip.style.top = ty + 'px'
  })

  canvas.addEventListener('mouseleave', () => {
    tooltip.hidden = true
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
  timerInterval = setInterval(() => {
    updateTimer()
    refreshStats()
  }, 1000)
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

function refreshCalendar() {
  drawCalendar(document.getElementById('calendar'), completedSessions)
}

function reloadData(data) {
  completedSessions = parseSessions(data.sessions)
  dailyData = groupByDay(completedSessions)
  refreshChart()
  refreshCalendar()
  refreshStats()
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await window.electronAPI.readCodeTime()

    if (data.activeStart) {
      startTimer(data.activeStart)
    }

    reloadData(data)
    initCalendarHover()
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

  let zoomFactor = 1
  document.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    zoomFactor = Math.max(0.5, Math.min(2, zoomFactor + delta))
    document.body.style.zoom = zoomFactor
    refreshChart()
    refreshCalendar()
  }, {passive: false})

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
