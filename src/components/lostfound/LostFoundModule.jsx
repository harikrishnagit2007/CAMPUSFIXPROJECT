import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  Gift,
  Sparkles,
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle,
  RotateCcw,
  Clock,
  Filter,
  Layers,
  XCircle,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { lostAndFoundApi } from '../../api/lostAndFound';
import { LostFoundStatusBadge } from './LostFoundStatusBadge';
import { ItemReportModal } from './ItemReportModal';
import { ClaimModal } from './ClaimModal';
import { MatchFinderModal } from './MatchFinderModal';

const CATEGORIES = [
  'All Categories',
  'Electronics',
  'ID Cards & Keys',
  'Wallets & Bags',
  'Books & Notebooks',
  'Personal Belongings',
  'Sports Equipment',
  'Clothing & Accessories',
  'Other Items',
];

export const LostFoundModule = ({ showToast }) => {
  const { user, isAdmin, isStaff } = useAuth();

  // Navigation Tabs: 'all' | 'lost' | 'found' | 'claims' | 'my-reports'
  const [activeTab, setActiveTab] = useState('all');

  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({ totalLost: 0, totalFound: 0, pendingClaims: 0, returnedCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState('LOST');
  const [matchingItem, setMatchingItem] = useState(null);
  const [claimingItem, setClaimingItem] = useState(null);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, claimsData, statsData] = await Promise.all([
        lostAndFoundApi.getItems(),
        lostAndFoundApi.getClaims(),
        lostAndFoundApi.getStats(),
      ]);
      setItems(itemsData || []);
      setClaims(claimsData || []);
      setStats(statsData || { totalLost: 0, totalFound: 0, pendingClaims: 0, returnedCount: 0 });
    } catch (err) {
      console.error(err);
      showToast('Could not load Lost & Found catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReportModal = (type) => {
    setReportModalType(type);
    setIsReportModalOpen(true);
  };

  // Filter items based on activeTab, search, category, status
  const filteredItems = items.filter((item) => {
    // Tab filter
    if (activeTab === 'lost' && item.type !== 'LOST') return false;
    if (activeTab === 'found' && item.type !== 'FOUND') return false;
    if (activeTab === 'my-reports') {
      const myId = user ? String(user.id || user.uid) : 'anonymous';
      if (String(item.reporterId) !== myId) return false;
    }

    // Category
    if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${item.title} ${item.description} ${item.location} ${item.category} ${item.identifyingMarks} ${item.itemCode}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // Handle claim status updates by Admin/Staff
  const handleUpdateClaimStatus = async (claimId, newStatus) => {
    try {
      await lostAndFoundApi.updateClaimStatus(claimId, newStatus, 'Verified by campus personnel');
      showToast(`Claim status updated to: ${newStatus}`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update claim status.', 'error');
    }
  };

  // Handle Mark Item as Returned
  const handleMarkReturned = async (itemId) => {
    try {
      await lostAndFoundApi.updateItem(itemId, { status: 'RETURNED' });
      showToast('Item status updated to Returned to Owner!', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Could not update status.', 'error');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* Module Hero & Quick Actions */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ maxWidth: '620px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 600, marginBottom: '10px' }}>
            <Sparkles size={13} />
            <span>Campus Management System • Spring Boot REST Ready</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Campus Lost & Found Management
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#e0e7ff', marginTop: '8px', lineHeight: 1.5 }}>
            Report misplaced belongings, catalog discovered campus items, run automated match correlation, and securely verify ownership claim requests.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-sm"
            onClick={() => handleOpenReportModal('LOST')}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={16} />
            + Report Lost Item
          </button>
          <button
            className="btn btn-sm"
            onClick={() => handleOpenReportModal('FOUND')}
            style={{
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)',
              cursor: 'pointer',
            }}
          >
            <Gift size={16} />
            + Report Found Item
          </button>
        </div>
      </div>

      {/* Key Metric Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lost Items Reported</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.totalLost}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gift size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Found Items Cataloged</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.totalFound}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Claims</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.pendingClaims}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reunited with Owner</span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.returnedCount}</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {[
          { key: 'all', label: 'All Catalog Items', icon: Layers },
          { key: 'lost', label: 'Lost Items', icon: HelpCircle },
          { key: 'found', label: 'Found Items', icon: Gift },
          { key: 'claims', label: `Claim Requests (${claims.length})`, icon: ShieldCheck },
          { key: 'my-reports', label: 'My Submissions', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Claims Management View */}
      {activeTab === 'claims' ? (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Campus Item Claim Requests
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Ownership claims submitted by campus students and staff requiring verification before handover.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Refresh Claims">
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          {claims.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600 }}>No claims submitted yet.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                When someone claims a found item, their verification details will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Claim Code</th>
                    <th style={{ padding: '10px 12px' }}>Item Title</th>
                    <th style={{ padding: '10px 12px' }}>Claimant Details</th>
                    <th style={{ padding: '10px 12px' }}>Ownership Proof</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    {(isAdmin || isStaff) && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary-700)' }}>
                        {claim.claimCode}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {claim.itemTitle}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div><strong>{claim.claimantName}</strong></div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{claim.claimantEmail}</div>
                        {claim.claimantPhone && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{claim.claimantPhone}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', maxWidth: '280px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', lineHeight: 1.4 }}>
                          {claim.ownershipProof}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <LostFoundStatusBadge status={claim.status} isClaim={true} />
                      </td>
                      {(isAdmin || isStaff) && (
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {claim.status === 'PENDING' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                                onClick={() => handleUpdateClaimStatus(claim.id, 'UNDER_REVIEW')}
                              >
                                Verify
                              </button>
                            )}
                            {(claim.status === 'PENDING' || claim.status === 'UNDER_REVIEW') && (
                              <>
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '4px 8px', background: '#16a34a', borderColor: '#15803d' }}
                                  onClick={() => handleUpdateClaimStatus(claim.id, 'APPROVED')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '4px 8px', color: '#dc2626' }}
                                  onClick={() => handleUpdateClaimStatus(claim.id, 'REJECTED')}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {claim.status === 'APPROVED' && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '4px 8px', background: '#4f46e5' }}
                                onClick={() => handleUpdateClaimStatus(claim.id, 'HANDED_OVER')}
                              >
                                Mark Handed Over
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Items Catalog Grid / Search View */
        <div>
          {/* Search & Filter Bar */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, location, marks, or item code..."
                style={{ paddingLeft: '36px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
            <div style={{ flex: '0 1 180px' }}>
              <select
                className="form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div style={{ flex: '0 1 160px' }}>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Active / Open</option>
                <option value="CLAIM_PENDING">Claim in Progress</option>
                <option value="RETURNED">Returned to Owner</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || selectedCategory !== 'All Categories' || selectedStatus !== 'ALL') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Categories');
                  setSelectedStatus('ALL');
                }}
                title="Reset filters"
              >
                <RotateCcw size={14} /> Clear
              </button>
            )}
          </div>

          {/* Catalog Listing */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Lost & Found items catalog...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#94a3b8' }}>
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '6px' }}>No Items Match Your Criteria</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                Try adjusting your search terms or filters, or be the first to report an item.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenReportModal('LOST')}>
                  + Report Lost Item
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenReportModal('FOUND')}>
                  + Report Found Item
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '18px',
              }}
            >
              {filteredItems.map((item) => {
                const isLost = item.type === 'LOST';
                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: isLost ? '3px solid #ef4444' : '3px solid #22c55e',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <LostFoundStatusBadge type={item.type} />
                          <LostFoundStatusBadge status={item.status} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          #{item.itemCode}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                        {item.title}
                      </h3>
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginBottom: '12px' }}>
                        {item.category}
                      </span>

                      {/* Description */}
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '12px' }}>
                        {item.description}
                      </p>

                      {/* Identifying Marks */}
                      {item.identifyingMarks && (
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '0.76rem', color: '#334155', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                          <strong>Distinctive Marks:</strong> {item.identifyingMarks}
                        </div>
                      )}

                      {/* Location & Holding Place */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} color="#6366f1" />
                          <span><strong>Location:</strong> {item.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#6366f1" />
                          <span><strong>Date:</strong> {item.dateOccurred}</span>
                        </div>
                        {item.holdingLocation && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857' }}>
                            <ShieldCheck size={13} />
                            <span><strong>Custody:</strong> {item.holdingLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      {/* Match Finder Radar Button */}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => setMatchingItem(item)}
                        title="Search automated correlations between lost and found items"
                      >
                        <Sparkles size={13} color="#6366f1" />
                        Find Matches
                      </button>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {/* Claim Button for Found Items */}
                        {!isLost && item.status !== 'RETURNED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#16a34a', borderColor: '#15803d' }}
                            onClick={() => setClaimingItem(item)}
                          >
                            <ShieldCheck size={13} />
                            Claim
                          </button>
                        )}

                        {/* Mark Returned (Admin / Staff) */}
                        {(isAdmin || isStaff) && item.status !== 'RETURNED' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', color: '#047857' }}
                            onClick={() => handleMarkReturned(item.id)}
                            title="Mark as Reunited & Returned to Owner"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Item Report Modal */}
      <ItemReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialType={reportModalType}
        onSuccess={() => fetchData()}
        showToast={showToast}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={Boolean(claimingItem)}
        onClose={() => setClaimingItem(null)}
        item={claimingItem}
        onSuccess={() => fetchData()}
        showToast={showToast}
      />

      {/* Match Finder Modal */}
      <MatchFinderModal
        isOpen={Boolean(matchingItem)}
        onClose={() => setMatchingItem(null)}
        item={matchingItem}
        onClaimMatch={(foundMatch) => {
          setMatchingItem(null);
          setClaimingItem(foundMatch);
        }}
        showToast={showToast}
      />
    </div>
  );
};
