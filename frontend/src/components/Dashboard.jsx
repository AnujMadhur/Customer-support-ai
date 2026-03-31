import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const COLORS = ['#6366f1','#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral:  '#f59e0b',
  negative: '#ef4444'
}

// ─── Small Stat Card ───────────────────────────────────────────
function StatCard({ title, value, sub, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px 24px',
      border: '1px solid #e2e8f0',
      borderLeft: `4px solid ${color}`
    }}>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>{title}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}

// ─── Section wrapper ───────────────────────────────────────────
function Card({ title, children, span = 1 }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      gridColumn: span > 1 ? `span ${span}` : undefined
    }}>
      {title && <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '600', color: '#374151' }}>{title}</h3>}
      {children}
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const [stats,       setStats]       = useState(null)
  const [topIssues,   setTopIssues]   = useState([])
  const [sentiment,   setSentiment]   = useState([])
  const [frustration, setFrustration] = useState([])
  const [byCountry,   setByCountry]   = useState([])
  const [byChannel,   setByChannel]   = useState([])
  const [summary,     setSummary]     = useState('')
  const [tickets,     setTickets]     = useState([])
  const [uploading,   setUploading]   = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState('')
  const [activeTab,   setActiveTab]   = useState('dashboard')
  const [selected,    setSelected]    = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [s, t, sent, frust, country, channel, tix] = await Promise.all([
        axios.get(`${API}/insights/stats`),
        axios.get(`${API}/insights/top-issues`),
        axios.get(`${API}/insights/sentiment-breakdown`),
        axios.get(`${API}/insights/frustration-by-category`),
        axios.get(`${API}/insights/by-country`),
        axios.get(`${API}/insights/by-channel`),
        axios.get(`${API}/tickets/list?limit=50`)
      ])
      setStats(s.data)
      setTopIssues(t.data)
      setSentiment(sent.data.map(d => ({
        ...d,
        fill: SENTIMENT_COLORS[d.sentiment] || '#94a3b8'
      })))
      setFrustration(frust.data)
      setByCountry(country.data)
      setByChannel(channel.data)
      setTickets(tix.data)
    } catch (e) {
      console.error('Fetch error:', e)
    }
  }

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await axios.get(`${API}/insights/summary`)
      setSummary(res.data.summary)
    } catch (e) {
      setSummary('Failed to generate summary.')
    }
    setLoadingSummary(false)
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('⏳ Uploading and processing with AI... this will take a few minutes for 1000 tickets')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post(`${API}/tickets/upload-csv`, form, { timeout: 600000 })
      setUploadMsg(`✅ Done! ${res.data.processed} tickets analyzed. ${res.data.skipped} skipped.`)
      fetchAll()
    } catch (err) {
      setUploadMsg(`❌ Error: ${err.response?.data?.detail || err.message}`)
    }
    setUploading(false)
  }

  const sentimentColor = (s) => SENTIMENT_COLORS[s] || '#94a3b8'
  const scoreColor = (n) => n >= 8 ? '#ef4444' : n >= 5 ? '#f59e0b' : '#10b981'

  // ── Tab: Dashboard ──────────────────────────────────────────
  const renderDashboard = () => (
    <>
      {/* Upload bar */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>📂 Upload Tickets CSV</span>
        <input
          type="file"
          accept=".csv"
          onChange={handleUpload}
          disabled={uploading}
          style={{ fontSize: '13px' }}
        />
        {uploadMsg && (
          <span style={{
            fontSize: '13px',
            color: uploading ? '#d97706' : uploadMsg.startsWith('✅') ? '#059669' : '#dc2626'
          }}>
            {uploadMsg}
          </span>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Total Tickets"     value={stats.total_tickets}           color="#6366f1" sub="all time" />
          <StatCard title="Avg Frustration"   value={`${stats.avg_frustration}/10`} color="#ef4444" sub="across all tickets" />
          <StatCard title="Negative Tickets"  value={`${stats.negative_pct}%`}      color="#f59e0b" sub={`${stats.negative_tickets} tickets`} />
          <StatCard title="Resolution Rate"   value={`${stats.resolution_rate}%`}   color="#10b981" sub={`${stats.resolved_tickets} resolved`} />
        </div>
      )}

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Top Issues */}
        <Card title="🔥 Top Issues by Volume">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topIssues} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {topIssues.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sentiment Pie */}
        <Card title="😊 Sentiment Breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sentiment}
                dataKey="count"
                nameKey="sentiment"
                cx="50%" cy="50%"
                outerRadius={85}
                label={({ sentiment: s, percent }) =>
                  `${s} ${(percent * 100).toFixed(0)}%`
                }
              >
                {sentiment.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Frustration Radar */}
        <Card title="😤 Avg Frustration by Category">
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={frustration}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
              <Radar name="Frustration" dataKey="avg_frustration" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* By Channel */}
        <Card title="📡 Tickets by Channel">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byChannel} dataKey="count" nameKey="channel" cx="50%" cy="50%" outerRadius={85} label={({ channel, percent }) => `${channel} ${(percent*100).toFixed(0)}%`}>
                {byChannel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Country bar full width */}
      <Card title="🌍 Tickets by Country" span={2}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCountry}>
            <XAxis dataKey="country" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {byCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* AI Summary */}
      <div style={{ marginTop: '20px' }}>
        <Card title="🤖 AI Executive Summary">
          {!summary && (
            <button
              onClick={fetchSummary}
              disabled={loadingSummary}
              style={{
                background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: '8px',
                padding: '10px 20px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600'
              }}
            >
              {loadingSummary ? '⏳ Generating...' : '✨ Generate AI Summary'}
            </button>
          )}
          {summary && (
            <p style={{ lineHeight: '1.7', color: '#374151', fontSize: '14px' }}>{summary}</p>
          )}
        </Card>
      </div>
    </>
  )

  // ── Tab: Tickets ─────────────────────────────────────────────
  const renderTickets = () => (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>
        🎫 Recent Tickets (with AI Analysis)
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['ID','Message','Product','Category','Sentiment','Score','Status',''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <td style={{ padding: '10px 12px', color: '#6366f1', fontWeight: '600' }}>#{t.ticket_id}</td>
                <td style={{ padding: '10px 12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.message}</td>
                <td style={{ padding: '10px 12px' }}>{t.product}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '999px', fontSize: '11px' }}>{t.category}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: sentimentColor(t.sentiment), fontWeight: '600', textTransform: 'capitalize' }}>{t.sentiment}</span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: '700', color: scoreColor(t.frustration_score) }}>{t.frustration_score}/10</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: t.resolution_status === 'resolved' ? '#d1fae5' : '#fef3c7',
                    color: t.resolution_status === 'resolved' ? '#065f46' : '#92400e',
                    padding: '2px 8px', borderRadius: '999px', fontSize: '11px'
                  }}>{t.resolution_status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => setSelected(t)}
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                  >View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: '#fff', borderRadius: '16px',
            padding: '28px', maxWidth: '600px', width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: '700', fontSize: '16px' }}>Ticket #{selected.ticket_id}</h3>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Customer Message</p>
                <p style={{ fontSize: '14px' }}>{selected.message}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Category</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>{selected.category}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Frustration Score</p>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: scoreColor(selected.frustration_score) }}>{selected.frustration_score}/10</p>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Key Issue (AI Summary)</p>
                <p style={{ fontSize: '14px' }}>{selected.key_issue}</p>
              </div>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <p style={{ fontSize: '12px', color: '#064e3b', marginBottom: '4px', fontWeight: '600' }}>💬 AI Suggested Response</p>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{selected.suggested_response}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ─── Layout ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px' }}>🎯</span>
            <span style={{ fontWeight: '700', fontSize: '16px' }}>Support Insights AI</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[['dashboard','📊 Dashboard'], ['tickets','🎫 Tickets']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: activeTab === key ? '#6366f1' : 'transparent',
                color: activeTab === key ? '#fff' : '#64748b',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer'
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '28px 32px' }}>
        {activeTab === 'dashboard' ? renderDashboard() : renderTickets()}
      </div>
    </div>
  )
}