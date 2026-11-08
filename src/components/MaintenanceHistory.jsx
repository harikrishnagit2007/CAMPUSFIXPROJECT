import React, { useState } from 'react';
import { 
  History, 
  Wrench, 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ShieldAlert,
  Calendar
} from 'lucide-react';

export const MaintenanceHistory = ({ complaint, onAddNote, isStaffOrAdmin, showToast }) => {
  const [newNote, setNewNote] = useState('');
  const [partReplaced, setPartReplaced] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract history entries from complaint or fallback to sample audit logs
  const historyEntries = complaint?.repair_history || complaint?.status_history || [
    {
      id: 1,
      status: complaint?.status || 'Submitted',
      timestamp: complaint?.created_at || new Date().toISOString(),
      changed_by: complaint?.student_details?.name || 'Campus Student',
      role: 'STUDENT',
      notes: 'Initial maintenance request submitted.'
    }
  ];

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() && !partReplaced.trim()) return;

    setIsSubmitting(true);
    try {
      if (onAddNote) {
        await onAddNote(complaint.id, {
          note: newNote.trim(),
          part_replaced: partReplaced.trim(),
          timestamp: new Date().toISOString()
        });
      }
      setNewNote('');
      setPartReplaced('');
      if (showToast) showToast('Maintenance repair note logged successfully.', 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to add maintenance note.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-subtle)', padding: '18px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
            <History size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              Maintenance Repair History & Technician Notes
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Tracking previous repairs, parts replaced, and operational status logs over time.
            </span>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '9999px' }}>
          {historyEntries.length} Event{historyEntries.length === 1 ? '' : 's'} Logged
        </span>
      </div>

      {/* Timeline of Repairs & Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {historyEntries.map((entry, idx) => (
          <div
            key={entry.id || idx}
            style={{
              position: 'relative',
              paddingLeft: '24px',
              borderLeft: '2px solid #cbd5e1',
              marginLeft: '8px',
            }}
          >
            {/* Timeline node dot */}
            <div
              style={{
                position: 'absolute',
                left: '-7px',
                top: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: entry.status === 'Resolved' ? '#22c55e' : entry.status === 'In Progress' ? '#3b82f6' : '#6366f1',
                border: '2px solid #ffffff',
                boxShadow: '0 0 0 2px #cbd5e1',
              }}
            />

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                    {entry.status || 'Technician Update'}
                  </span>
                  {entry.part_replaced && (
                    <span style={{ fontSize: '0.72rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      Part: {entry.part_replaced}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#64748b' }}>
                  <Clock size={12} />
                  {new Date(entry.timestamp || entry.changed_at || Date.now()).toLocaleString()}
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, marginBottom: '6px' }}>
                {entry.notes || entry.description || 'Status update recorded for ticket.'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={12} /> Logged by: <strong>{entry.changed_by || entry.technician || 'System'}</strong>
                </span>
                {entry.role && (
                  <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {entry.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff / Admin Add Repair Note Form */}
      {isStaffOrAdmin && (
        <form
          onSubmit={handleSubmitNote}
          style={{
            background: '#f8fafc',
            border: '1px dashed #94a3b8',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={16} color="#4f46e5" />
            Add Technician Repair Note & Parts Log
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: '4px' }}>Replacement Part Used (Optional)</label>
              <input
                type="text"
                className="form-control"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                placeholder="e.g. 65W Fuse, PVC Pipe Joint, LED Bulb"
                value={partReplaced}
                onChange={(e) => setPartReplaced(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: '4px' }}>Technician Diagnostic & Repair Notes <span className="required">*</span></label>
            <textarea
              className="form-control"
              style={{ fontSize: '0.84rem', padding: '8px 10px' }}
              rows={2}
              placeholder="Describe diagnostic tests performed, repair steps taken, or testing results..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting || (!newNote.trim() && !partReplaced.trim())}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Wrench size={14} />
              {isSubmitting ? 'Logging...' : 'Log Repair Note'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
