import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  Activity,
  Sparkles,
  RefreshCw,
  Building2,
  Layers,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { complaintsApi } from '../api/complaints';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
const SLA_COLORS = {
  'SLA Met': '#10b981',
  'SLA Breached': '#ef4444',
  'Approaching Deadline': '#f59e0b',
  'On Track': '#3b82f6',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: '0.82rem',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '3px' }}>
          {label || payload[0]?.name}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color || entry.fill }} />
            <span>{entry.name || 'Count'}:</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminAnalyticsDashboard = ({ showToast }) => {
  const [analytics, setAnalytics] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await complaintsApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load real-time analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    setAiLoading(true);
    try {
      const summaryRes = await complaintsApi.getAiSummary();
      setAiSummary(summaryRes);
    } catch {
      // quiet fallback
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    fetchAiSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--primary-600)' }} />
        <p style={{ fontWeight: 600 }}>Calculating campus performance indicators & SLA compliance metrics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No analytics data available yet.</p>
        <button className="btn btn-primary btn-sm" onClick={fetchAnalyticsData} style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  const {
    total = 0,
    submitted = 0,
    in_progress = 0,
    resolved = 0,
    emergency_count = 0,
    sla_compliance = 94,
    breached_count = 0,
    approaching_count = 0,
    avg_response_hours = 0.4,
    avg_response_minutes = 24,
    avg_resolution_hours = 3.6,
    avg_resolution_minutes = 216,
    category_distribution = [],
    building_distribution = [],
    status_distribution = [],
    priority_distribution = [],
    sla_distribution = [],
    daily_trends = [],
    staff_workload = [],
    resolution_rate = 0,
  } = analytics;

  // Format SLA compliance rating color
  const getSlaBadgeClass = (rate) => {
    if (rate >= 90) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    if (rate >= 75) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
  };

  const slaStyle = getSlaBadgeClass(sla_compliance);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} style={{ color: 'var(--primary-600)' }} />
            Campus Performance & SLA Intelligence Hub
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Real-time analytics engine visualizing facility workload, resolution throughput, high-incident zones, and SLA compliance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              fetchAnalyticsData();
              fetchAiSummary();
              if (showToast) showToast('Refreshed live KPI metrics.', 'info');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading || aiLoading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI 1: SLA Compliance */}
        <div
          className="glass-panel"
          style={{
            padding: '18px 20px',
            borderLeft: `4px solid ${slaStyle.text}`,
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                SLA Compliance Rate
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: slaStyle.text, marginTop: '4px' }}>
                {sla_compliance}%
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: slaStyle.bg,
                color: slaStyle.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {breached_count > 0 ? (
              <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {breached_count} SLA breaches recorded</span>
            ) : (
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ All active tickets within deadline</span>
            )}
          </div>
        </div>

        {/* KPI 2: Average Resolution Time */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #6366f1', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Avg Resolution Time
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4338ca', marginTop: '4px' }}>
                {avg_resolution_hours} hrs
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {avg_resolution_minutes > 0 ? `Avg ${avg_resolution_minutes} mins turnaround from report` : 'No resolved records yet'}
          </div>
        </div>

        {/* KPI 3: Average First Response Time */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #06b6d4', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Avg Response Time
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0891b2', marginTop: '4px' }}>
                {avg_response_minutes} min
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#cffafe',
                color: '#0891b2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Time to acknowledge or assign technician
          </div>
        </div>

        {/* KPI 4: Resolution Throughput */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #10b981', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Resolution Rate
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {resolution_rate}%
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {resolved} resolved of {total} total reported
          </div>
        </div>

        {/* KPI 5: Active Hazards & Backlog */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '4px solid #ef4444', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Critical Hazards
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {emergency_count}
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {in_progress + submitted} total active tickets in queue
          </div>
        </div>
      </div>

      {/* AI Executive Summary & Predictive Maintenance Insights */}
      {aiSummary && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '14px',
            padding: '20px 24px',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 800, fontSize: '0.95rem' }}>
              <Sparkles size={20} className="text-indigo-600" />
              <span>AI Facilities Director & Predictive Maintenance Intelligence</span>
            </div>
            <span style={{ fontSize: '0.74rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              {aiSummary.modelUsed || 'Gemini Operational Engine'}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.65,
              color: '#1e293b',
              whiteSpace: 'pre-line',
              background: 'white',
              padding: '16px 18px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            {aiSummary.summary}
          </div>
        </div>
      )}

      {/* CHARTS GRID ROW 1: Category Distribution & Building Incidents */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Chart 1: Complaint Distribution by Category */}
        <div className="glass-panel" style={{ padding: '20px 24px', background: 'white' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--primary-600)' }} />
              Complaint Distribution by Category
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Volume breakdown across campus maintenance domains with resolution status.
            </p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            {category_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={category_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: '10px' }} />
                  <Bar dataKey="count" name="Total Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="critical" name="Critical Hazards" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No category data available
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: High Incident Campus Buildings */}
        <div className="glass-panel" style={{ padding: '20px 24px', background: 'white' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: '#0891b2' }} />
              Campus Facilities & Building Distribution
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Incidents identified by campus zone to prioritize preventative facility sweeps.
            </p>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            {building_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={building_distribution}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.76rem', paddingTop: '6px' }} />
                  <Bar dataKey="count" name="Total Incidents" fill="#0891b2" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="active" name="Active Backlog" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No location data recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS GRID ROW 2: Status Breakdown, SLA Distribution & Daily Trends */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Chart 3: Status Breakdown Donut */}
        <div className="glass-panel" style={{ padding: '20px 24px', background: 'white' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Status Pipeline Breakdown
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Live lifecycle status distribution across all complaints.
            </p>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={status_distribution.filter((s) => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.74rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: SLA Fulfillment Distribution */}
        <div className="glass-panel" style={{ padding: '20px 24px', background: 'white' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              SLA Deadline Performance
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Compliance breakdown of tickets met, breached, or on-track.
            </p>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            {sla_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sla_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {sla_distribution.map((entry, index) => (
                      <Cell key={`sla-cell-${index}`} fill={SLA_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.74rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No SLA records computed
              </div>
            )}
          </div>
        </div>

        {/* Chart 5: 7-Day Ticket Inflow & Resolution Trend */}
        <div className="glass-panel" style={{ padding: '20px 24px', background: 'white' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              7-Day Ticket Volume Trends
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Daily reported issues vs resolved tickets throughput.
            </p>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.74rem' }} />
                <Area type="monotone" dataKey="submitted" name="Reported" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmitted)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Technician & Staff Workload Matrix */}
      <div className="glass-panel" style={{ padding: '22px 24px', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--primary-600)' }} />
              Staff Workload & Performance Table
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Active assignments, specialization mapping, and average turnaround duration per maintenance technician.
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Technician</th>
                <th>Department & Specialization</th>
                <th>Availability</th>
                <th>Active Tickets</th>
                <th>Resolved Tickets</th>
                <th>Avg Resolution Time</th>
              </tr>
            </thead>
            <tbody>
              {staff_workload.map((staff) => (
                <tr key={staff.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{staff.name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{staff.department}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{staff.specialization}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background:
                          staff.availability === 'Available'
                            ? '#dcfce7'
                            : staff.availability === 'Busy'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          staff.availability === 'Available'
                            ? '#166534'
                            : staff.availability === 'Busy'
                            ? '#92400e'
                            : '#991b1b',
                      }}
                    >
                      {staff.availability}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        color: staff.active_count > 2 ? '#b45309' : '#1e293b',
                      }}
                    >
                      {staff.active_count} active
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#059669' }}>
                      {staff.resolved_count} resolved
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {staff.avg_resolution_hours > 0 ? `${staff.avg_resolution_hours} hrs` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
