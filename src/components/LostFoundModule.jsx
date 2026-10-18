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
  Eye,
  Bot,
  AlertCircle,
  Building,
  CheckCircle2,
  Tag,
  X,
  Phone,
  Mail,
  Send,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lostFoundService } from '../services/api';

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

const CAMPUS_BUILDINGS = [
  'All Locations',
  'Science Block B',
  'Technology Block C',
  'Central Library',
  'Mechanical Workshop Block',
  'Main Administrative Building',
  'Student Center & Canteen',
  'Sports Complex & Ground',
  'Indoor Auditorium',
  'Hostel Block 1',
  'Hostel Block 2',
];

export const LostFoundModule = ({ showToast }) => {
  const { user, isAdmin, isStaff } = useAuth();

  // Active Tab: 'browse' | 'report-lost' | 'report-found' | 'ai-assistant' | 'matches' | 'claims'
  const [activeTab, setActiveTab] = useState('browse');

  // Items and Claims Data
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({ totalLost: 0, totalFound: 0, pendingClaims: 0, returnedCount: 0 });
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'LOST' | 'FOUND'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBuilding, setSelectedBuilding] = useState('All Locations');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals & Sub-views
  const [viewingItem, setViewingItem] = useState(null);
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimProof, setClaimProof] = useState('');
  const [claimPhone, setClaimPhone] = useState(user?.phone || '');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Lost Item Form State
  const [lostForm, setLostForm] = useState({
    itemName: '',
    category: 'Electronics',
    description: '',
    location: '',
    building: 'Technology Block C',
    date: '2026-10-18',
    approxTime: '10:30 AM',
    distinguishingMarks: '',
    image: null,
    contactPreference: 'email',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
  });

  // Found Item Form State
  const [foundForm, setFoundForm] = useState({
    itemName: '',
    category: 'Personal Belongings',
    description: '',
    location: '',
    building: 'Science Block B',
    date: '2026-10-18',
    approxTime: '02:15 PM',
    distinguishingMarks: '',
    custodyStatus: 'Security Desk Gate 1',
    image: null,
    isPrivateIdentity: false,
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleLostImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Image should be under 5MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setLostForm((prev) => ({ ...prev, image: event.target?.result }));
      if (showToast) showToast('Photo attached to Lost Report!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleFoundImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('Image should be under 5MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFoundForm((prev) => ({ ...prev, image: event.target?.result }));
      if (showToast) showToast('Photo attached to Found Item Report!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // AI Recovery Assistant ("Help Me Find It") State
  const [assistantStep, setAssistantStep] = useState(1);
  const [assistantInput, setAssistantInput] = useState({
    lostWhat: '',
    lostCategory: 'Electronics',
    lostWhere: 'Central Library',
    lostWhen: new Date().toISOString().split('T')[0],
    lostMarks: '',
  });
  const [assistantMatches, setAssistantMatches] = useState([]);
  const [assistantAnalyzing, setAssistantAnalyzing] = useState(false);

  // Fetch all data from centralized api service
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, claimsData, statsData] = await Promise.all([
        lostFoundService.fetchLostFoundItems(),
        lostFoundService.fetchItemClaims(),
        lostFoundService.fetchLostFoundStats(),
      ]);
      setItems(itemsData || []);
      setClaims(claimsData || []);
      setStats(statsData || { totalLost: 0, totalFound: 0, pendingClaims: 0, returnedCount: 0 });
    } catch (err) {
      console.warn('[LostFound] Notice loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit Lost Item Report
  const handleLostSubmit = async (e) => {
    e.preventDefault();
    if (!lostForm.itemName.trim() || !lostForm.location.trim()) {
      if (showToast) showToast('Please fill in Item Name and Location.', 'warning');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        type: 'LOST',
        itemName: lostForm.itemName.trim(),
        title: lostForm.itemName.trim(),
        category: lostForm.category,
        building: lostForm.building,
        location: `${lostForm.building} - ${lostForm.location.trim()}`,
        date: lostForm.date,
        dateOccurred: lostForm.date,
        approxTime: lostForm.approxTime,
        description: lostForm.description.trim(),
        identifyingMarks: lostForm.distinguishingMarks.trim() || lostForm.description.trim(),
        image: lostForm.image || '',
        reporterId: user ? String(user.id || user.uid) : 'anonymous',
        reporterName: user?.name || user?.username || 'Student User',
        reporterRole: user?.role || 'STUDENT',
        contactEmail: lostForm.contactEmail || user?.email || '',
        contactPhone: lostForm.contactPhone || user?.phone || '',
      };

      const created = await lostFoundService.createLostFoundItem(payload);
      if (showToast) showToast(`Lost item report (#${created.itemCode || created.id}) registered successfully!`, 'success');

      // Reset form
      setLostForm({
        itemName: '',
        category: 'Electronics',
        description: '',
        location: '',
        building: 'Technology Block C',
        date: '2026-10-18',
        approxTime: '10:30 AM',
        distinguishingMarks: '',
        image: null,
        contactPreference: 'email',
        contactPhone: user?.phone || '',
        contactEmail: user?.email || '',
      });

      await fetchData();
      setActiveTab('browse');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Could not submit lost item report.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Found Item Report
  const handleFoundSubmit = async (e) => {
    e.preventDefault();
    if (!foundForm.itemName.trim() || !foundForm.location.trim()) {
      if (showToast) showToast('Please fill in Item Name and Location.', 'warning');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        type: 'FOUND',
        itemName: foundForm.itemName.trim(),
        title: foundForm.itemName.trim(),
        category: foundForm.category,
        building: foundForm.building,
        location: `${foundForm.building} - ${foundForm.location.trim()}`,
        date: foundForm.date,
        dateOccurred: foundForm.date,
        approxTime: foundForm.approxTime,
        description: foundForm.description.trim(),
        identifyingMarks: foundForm.distinguishingMarks.trim() || foundForm.description.trim(),
        holdingLocation: foundForm.custodyStatus.trim() || 'Campus Security Main Desk',
        image: foundForm.image || '',
        reporterId: user ? String(user.id || user.uid) : 'anonymous',
        reporterName: user?.name || user?.username || 'Campus Finder',
        reporterRole: user?.role || 'STUDENT',
        contactEmail: foundForm.contactEmail || user?.email || '',
        contactPhone: foundForm.contactPhone || user?.phone || '',
      };

      const created = await lostFoundService.createLostFoundItem(payload);
      if (showToast) showToast(`Found item (#${created.itemCode || created.id}) cataloged successfully!`, 'success');

      setFoundForm({
        itemName: '',
        category: 'Personal Belongings',
        description: '',
        location: '',
        building: 'Science Block B',
        date: '2026-10-18',
        approxTime: '02:15 PM',
        distinguishingMarks: '',
        custodyStatus: 'Security Desk Gate 1',
        image: null,
        isPrivateIdentity: false,
        contactEmail: user?.email || '',
        contactPhone: user?.phone || '',
      });

      await fetchData();
      setActiveTab('browse');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Could not submit found item report.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Ownership Claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimingItem || !claimProof.trim()) {
      if (showToast) showToast('Please provide verifiable proof of ownership.', 'warning');
      return;
    }
    setSubmittingClaim(true);
    try {
      const payload = {
        itemId: claimingItem.id,
        itemTitle: claimingItem.itemName || claimingItem.title,
        claimantId: user ? String(user.id || user.uid) : 'anonymous',
        claimantName: user?.name || user?.username || 'Claimant',
        claimantEmail: user?.email || '',
        claimantPhone: claimPhone || user?.phone || '',
        ownershipProof: claimProof.trim(),
      };

      const claim = await lostFoundService.submitItemClaim(payload);
      if (showToast) showToast(`Claim Request #${claim.claimCode || claim.id} submitted for staff review!`, 'success');

      setClaimingItem(null);
      setClaimProof('');
      await fetchData();
      setActiveTab('claims');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to submit claim request.', 'error');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Admin/Staff Update Claim Status
  const handleUpdateClaimStatus = async (claimId, newStatus) => {
    try {
      await lostFoundService.updateClaimStatus(claimId, { status: newStatus, adminNotes: 'Verified by authorized personnel' });
      if (showToast) showToast(`Claim status updated to: ${newStatus}`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Could not update claim status.', 'error');
    }
  };

  // Run AI Recovery Assistant Query
  const handleRunAssistant = () => {
    setAssistantAnalyzing(true);
    setTimeout(() => {
      // Find candidate found items matching category, building, or keywords
      const foundItems = items.filter((i) => i.type === 'FOUND' && i.status !== 'CLOSED');
      const qWords = `${assistantInput.lostWhat} ${assistantInput.lostMarks}`.toLowerCase().split(/\W+/).filter((w) => w.length > 2);

      const scored = foundItems.map((candidate) => {
        let score = 0;
        const reasons = [];

        if (candidate.category && candidate.category.toLowerCase() === assistantInput.lostCategory.toLowerCase()) {
          score += 40;
          reasons.push(`Matching Category: ${candidate.category}`);
        }
        if (candidate.location && candidate.location.toLowerCase().includes(assistantInput.lostWhere.toLowerCase())) {
          score += 30;
          reasons.push(`Located in/near ${assistantInput.lostWhere}`);
        }
        const cWords = `${candidate.title} ${candidate.itemName} ${candidate.description}`.toLowerCase();
        const matchedKeywords = qWords.filter((w) => cWords.includes(w));
        if (matchedKeywords.length > 0) {
          score += Math.min(30, matchedKeywords.length * 10);
          reasons.push(`Keywords matched: ${matchedKeywords.join(', ')}`);
        }

        return {
          candidate,
          confidence: Math.min(score, 98),
          reasons,
        };
      });

      const best = scored.filter((s) => s.confidence >= 30).sort((a, b) => b.confidence - a.confidence);
      setAssistantMatches(best);
      setAssistantAnalyzing(false);
      setAssistantStep(3);
    }, 600);
  };

  // Filtered reports for catalog view
  const filteredReports = items.filter((item) => {
    if (selectedType !== 'ALL' && item.type !== selectedType) return false;
    if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) return false;
    if (selectedBuilding !== 'All Locations' && !item.location?.includes(selectedBuilding)) return false;
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const combined = `${item.itemName || item.title || ''} ${item.description || ''} ${item.location || ''} ${item.category || ''} ${item.itemCode || ''}`.toLowerCase();
      return combined.includes(q);
    }
    return true;
  });

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
      {/* Hero Header (.glass-panel) */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span
              className="badge"
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}
            >
              <Sparkles size={13} />
              CAMPUSFIND AI • LOST & FOUND INTELLIGENCE
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Campus Lost & Found Management
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '640px', lineHeight: 1.5 }}>
            Report misplaced belongings, catalog discovered items, match probable correlations with AI, and verify ownership claims securely.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab('report-lost')}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
          >
            <HelpCircle size={16} />
            <span>Report Lost Item</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab('report-found')}
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            }}
          >
            <Gift size={16} />
            <span>Report Found Item</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row (.dashboard-grid & .stat-card) */}
      <div className="dashboard-grid">
        <div className="stat-card stat-rose">
          <div className="stat-info">
            <h3>Lost Items Reported</h3>
            <div className="stat-value">{stats.totalLost}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <HelpCircle size={24} />
          </div>
        </div>

        <div className="stat-card stat-emerald">
          <div className="stat-info">
            <h3>Found Items Cataloged</h3>
            <div className="stat-value">{stats.totalFound}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Gift size={24} />
          </div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-info">
            <h3>Active Claims</h3>
            <div className="stat-value">{stats.pendingClaims}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-info">
            <h3>Reunited with Owners</h3>
            <div className="stat-value">{stats.returnedCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Module Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '8px',
          marginBottom: '22px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {[
          { key: 'browse', label: 'Browse & Search Catalog', icon: Layers },
          { key: 'report-lost', label: 'Report Lost Item', icon: HelpCircle },
          { key: 'report-found', label: 'Report Found Item', icon: Gift },
          { key: 'ai-assistant', label: 'AI Recovery Assistant', icon: Bot },
          { key: 'claims', label: `Claims & Returns (${claims.length})`, icon: ShieldCheck },
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
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: BROWSE AND SEARCH CATALOG
          ===================================================================== */}
      {activeTab === 'browse' && (
        <div>
          {/* Search & Filter Bar (.glass-panel) */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '22px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by item name, location, keywords..."
                style={{ paddingLeft: '38px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div style={{ flex: '0 1 140px' }}>
              <select
                className="form-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Items</option>
                <option value="LOST">Lost Only</option>
                <option value="FOUND">Found Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ flex: '0 1 180px' }}>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Building Filter */}
            <div style={{ flex: '0 1 180px' }}>
              <select
                className="form-select"
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
              >
                {CAMPUS_BUILDINGS.map((bld) => (
                  <option key={bld} value={bld}>
                    {bld}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {(searchQuery || selectedType !== 'ALL' || selectedCategory !== 'All Categories' || selectedBuilding !== 'All Locations') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('ALL');
                  setSelectedCategory('All Categories');
                  setSelectedBuilding('All Locations');
                  setSelectedStatus('ALL');
                }}
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>

          {/* Cards Grid (.glass-panel items) */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #e0e7ff',
                  borderTopColor: 'var(--primary-600)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading campus items catalog...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                No Reports Matching Your Criteria
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                Try adjusting your search query, or submit a new report using the buttons above.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredReports.map((item) => {
                const isLost = item.type === 'LOST';
                const isReturned = item.status === 'RETURNED';

                return (
                  <div
                    key={item.id}
                    className="glass-panel"
                    style={{
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: isReturned
                        ? '3px solid #16a34a'
                        : isLost
                        ? '3px solid #ef4444'
                        : '3px solid #22c55e',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="badge"
                            style={{
                              background: isLost ? '#fee2e2' : '#dcfce7',
                              color: isLost ? '#b91c1c' : '#15803d',
                              border: `1px solid ${isLost ? '#fecaca' : '#86efac'}`,
                            }}
                          >
                            {isLost ? <HelpCircle size={12} /> : <Gift size={12} />}
                            {isLost ? 'LOST' : 'FOUND'}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: isReturned ? '#dcfce7' : '#eff6ff',
                              color: isReturned ? '#15803d' : '#1d4ed8',
                              border: `1px solid ${isReturned ? '#86efac' : '#bfdbfe'}`,
                            }}
                          >
                            {isReturned ? 'Returned' : 'Active'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          #{item.itemCode || `LF-${item.id}`}
                        </span>
                      </div>

                      {/* Photo Thumbnail if attached */}
                      {item.image && (
                        <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '130px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                          <img src={item.image} alt={item.itemName || 'Campus item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Title & Category */}
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                        {item.itemName || item.title}
                      </h3>
                      <div style={{ marginBottom: '12px' }}>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.74rem' }}>
                          <Tag size={12} /> {item.category}
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          marginBottom: '16px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description || 'No detailed description provided.'}
                      </p>

                      {/* Location & Metadata */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color={isLost ? '#ef4444' : '#22c55e'} style={{ flexShrink: 0 }} />
                          <span><strong>Location:</strong> {item.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} color="var(--primary-600)" style={{ flexShrink: 0 }} />
                          <span><strong>Date:</strong> {item.date || item.dateOccurred}</span>
                        </div>
                        {item.holdingLocation && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857' }}>
                            <Building size={14} style={{ flexShrink: 0 }} />
                            <span><strong>Custody:</strong> {item.holdingLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div
                      style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setViewingItem(item)}
                      >
                        <Eye size={14} /> View Details
                      </button>

                      {!isLost && item.status !== 'RETURNED' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setClaimingItem(item)}
                          style={{ background: '#16a34a', borderColor: '#15803d' }}
                        >
                          <ShieldCheck size={14} /> Claim Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: REPORT A LOST ITEM FORM (.glass-panel)
          ===================================================================== */}
      {activeTab === 'report-lost' && (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Report a Lost Item
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Log your missing possession. CampusFind AI will correlate newly reported items and notify you.
              </p>
            </div>
          </div>

          <form onSubmit={handleLostSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="lostItemName">
                  Item Name <span className="required">*</span>
                </label>
                <input
                  id="lostItemName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Casio Scientific Calculator fx-991EX"
                  value={lostForm.itemName}
                  onChange={(e) => setLostForm({ ...lostForm, itemName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lostCategory">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="lostCategory"
                  className="form-select"
                  value={lostForm.category}
                  onChange={(e) => setLostForm({ ...lostForm, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lostBuilding">
                  Campus Building / Block <span className="required">*</span>
                </label>
                <select
                  id="lostBuilding"
                  className="form-select"
                  value={lostForm.building}
                  onChange={(e) => setLostForm({ ...lostForm, building: e.target.value })}
                >
                  {CAMPUS_BUILDINGS.filter((b) => b !== 'All Locations').map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lostLocation">
                  Specific Spot / Room <span className="required">*</span>
                </label>
                <input
                  id="lostLocation"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Room 304, 2nd row bench, lab desk"
                  value={lostForm.location}
                  onChange={(e) => setLostForm({ ...lostForm, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lostDate">
                  Date Last Seen <span className="required">*</span>
                </label>
                <input
                  id="lostDate"
                  type="date"
                  className="form-control"
                  value={lostForm.date}
                  onChange={(e) => setLostForm({ ...lostForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lostTime">
                  Approximate Time
                </label>
                <input
                  id="lostTime"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 10:30 AM (after math lecture)"
                  value={lostForm.approxTime}
                  onChange={(e) => setLostForm({ ...lostForm, approxTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lostMarks">
                Distinguishing Marks & Secret Identifiers
              </label>
              <input
                id="lostMarks"
                type="text"
                className="form-control"
                placeholder="e.g. Small sticker on back, serial number initials, specific scratch"
                value={lostForm.distinguishingMarks}
                onChange={(e) => setLostForm({ ...lostForm, distinguishingMarks: e.target.value })}
              />
            </div>

            {/* Photo Upload for Lost Item */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} color="var(--primary-600)" />
                  Item Photograph (Optional)
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>JPG, PNG up to 5MB</span>
              </label>
              {lostForm.image ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <img src={lostForm.image} alt="Lost item" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Photo Attached</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Will be visible on the card to help finders</div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLostForm({ ...lostForm, image: null })} style={{ color: '#dc2626' }}>
                    <Trash2 size={14} style={{ marginRight: 4 }} /> Remove
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: '2px dashed var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(248, 250, 252, 0.6)' }}>
                  <Upload size={18} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Click to upload an image of the lost item</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLostImage} />
                </label>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lostDesc">
                Detailed Description <span className="required">*</span>
              </label>
              <textarea
                id="lostDesc"
                className="form-control"
                rows={4}
                placeholder="Describe color, size, brand, attachments, or circumstances..."
                value={lostForm.description}
                onChange={(e) => setLostForm({ ...lostForm, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('browse')}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formSubmitting}
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
              >
                {formSubmitting ? 'Registering Report...' : 'Submit Lost Item Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 3: REPORT A FOUND ITEM FORM (.glass-panel)
          ===================================================================== */}
      {activeTab === 'report-found' && (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Report a Found Item
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Log an item discovered on campus so the rightful owner can verify ownership.
              </p>
            </div>
          </div>

          <form onSubmit={handleFoundSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="foundItemName">
                  Item Name / Approximate Title <span className="required">*</span>
                </label>
                <input
                  id="foundItemName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Blue Water Flask / Black Power Bank"
                  value={foundForm.itemName}
                  onChange={(e) => setFoundForm({ ...foundForm, itemName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="foundCategory">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="foundCategory"
                  className="form-select"
                  value={foundForm.category}
                  onChange={(e) => setFoundForm({ ...foundForm, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="foundBuilding">
                  Found in Campus Building / Block <span className="required">*</span>
                </label>
                <select
                  id="foundBuilding"
                  className="form-select"
                  value={foundForm.building}
                  onChange={(e) => setFoundForm({ ...foundForm, building: e.target.value })}
                >
                  {CAMPUS_BUILDINGS.filter((b) => b !== 'All Locations').map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="foundLocation">
                  Exact Spot Discovered <span className="required">*</span>
                </label>
                <input
                  id="foundLocation"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Near Library circulation desk / Staircase landing"
                  value={foundForm.location}
                  onChange={(e) => setFoundForm({ ...foundForm, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="foundDate">
                  Date Found <span className="required">*</span>
                </label>
                <input
                  id="foundDate"
                  type="date"
                  className="form-control"
                  value={foundForm.date}
                  onChange={(e) => setFoundForm({ ...foundForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="foundCustody">
                  Current Safe Custody / Holding Location <span className="required">*</span>
                </label>
                <input
                  id="foundCustody"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Security Gate 1 Main Desk / Dept HOD Office"
                  value={foundForm.custodyStatus}
                  onChange={(e) => setFoundForm({ ...foundForm, custodyStatus: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="foundMarks">
                Distinguishing Characteristics (Hidden from public to verify claims)
              </label>
              <input
                id="foundMarks"
                type="text"
                className="form-control"
                placeholder="e.g. Internal name tag or brand serial to check during claim"
                value={foundForm.distinguishingMarks}
                onChange={(e) => setFoundForm({ ...foundForm, distinguishingMarks: e.target.value })}
              />
            </div>

            {/* Photo Upload for Found Item */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} color="#16a34a" />
                  Item Photograph / Found Picture (Optional)
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>JPG, PNG up to 5MB</span>
              </label>
              {foundForm.image ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                  <img src={foundForm.image} alt="Found item" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#14532d' }}>Photo Attached</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>Will help the rightful owner recognize it</div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFoundForm({ ...foundForm, image: null })} style={{ color: '#dc2626' }}>
                    <Trash2 size={14} style={{ marginRight: 4 }} /> Remove
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: '2px dashed var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(240, 253, 244, 0.5)' }}>
                  <Upload size={18} color="#16a34a" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Click to upload an image of the found item</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoundImage} />
                </label>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="foundDesc">
                Public Description <span className="required">*</span>
              </label>
              <textarea
                id="foundDesc"
                className="form-control"
                rows={3}
                placeholder="General description without exposing private identifiers..."
                value={foundForm.description}
                onChange={(e) => setFoundForm({ ...foundForm, description: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('browse')}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formSubmitting}
                style={{ background: '#16a34a', borderColor: '#15803d' }}
              >
                {formSubmitting ? 'Submitting Report...' : 'Submit Found Item Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 4: AI RECOVERY ASSISTANT ("HELP ME FIND IT")
          ===================================================================== */}
      {activeTab === 'ai-assistant' && (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #e0e7ff, #fae8ff)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                CampusFind AI Recovery Assistant
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Guided step-by-step assistant correlating campus locations, categories, and found records.
              </p>
            </div>
          </div>

          {assistantStep === 1 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
                Step 1: What did you misplace?
              </h3>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Casio fx-991EX Calculator / Dell Laptop Charger"
                  value={assistantInput.lostWhat}
                  onChange={(e) => setAssistantInput({ ...assistantInput, lostWhat: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={assistantInput.lostCategory}
                  onChange={(e) => setAssistantInput({ ...assistantInput, lostCategory: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!assistantInput.lostWhat.trim()}
                  onClick={() => setAssistantStep(2)}
                >
                  Next: Where & When <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {assistantStep === 2 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
                Step 2: Where & When was it last seen?
              </h3>
              <div className="form-group">
                <label className="form-label">Last Seen Building or Area</label>
                <select
                  className="form-select"
                  value={assistantInput.lostWhere}
                  onChange={(e) => setAssistantInput({ ...assistantInput, lostWhere: e.target.value })}
                >
                  {CAMPUS_BUILDINGS.filter((b) => b !== 'All Locations').map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Any specific markings or features?</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Yellow sticker, black lanyard, circular scratch"
                  value={assistantInput.lostMarks}
                  onChange={(e) => setAssistantInput({ ...assistantInput, lostMarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssistantStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRunAssistant}
                  disabled={assistantAnalyzing}
                >
                  {assistantAnalyzing ? 'Correlating Campus Catalog...' : 'Run Match Radar'}
                </button>
              </div>
            </div>
          )}

          {assistantStep === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Potential Match Results ({assistantMatches.length})
                </h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAssistantStep(1)}>
                  Start New Search
                </button>
              </div>

              {assistantMatches.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                  <AlertCircle size={32} color="#d97706" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    No Immediate Found Item Matches
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '6px auto 16px', lineHeight: 1.5 }}>
                    We recommend checking the <strong>{assistantInput.lostWhere} Department Office</strong> or <strong>Security Gate 1 Help Desk</strong>. You can also file a formal Lost Report so we automatically match future submissions.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setLostForm((prev) => ({
                        ...prev,
                        itemName: assistantInput.lostWhat,
                        category: assistantInput.lostCategory,
                        building: assistantInput.lostWhere,
                        distinguishingMarks: assistantInput.lostMarks,
                      }));
                      setActiveTab('report-lost');
                    }}
                  >
                    File Formal Lost Report
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {assistantMatches.map(({ candidate, confidence, reasons }, idx) => (
                    <div
                      key={candidate.id || idx}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '14px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                            FOUND
                          </span>
                          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{candidate.itemName || candidate.title}</strong>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                          📍 {candidate.location} • 🏢 Custody: {candidate.holdingLocation || 'Campus Security'}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {reasons.map((r, i) => (
                            <span key={i} style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: confidence >= 70 ? '#15803d' : '#d97706' }}>
                          {confidence}%
                        </div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Match Score</div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '8px', fontSize: '0.75rem', background: '#16a34a' }}
                          onClick={() => setClaimingItem(candidate)}
                        >
                          Claim Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: CLAIMS AND RETURNS MANAGEMENT
          ===================================================================== */}
      {activeTab === 'claims' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Campus Ownership Claims & Item Handover
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Verifications submitted by students to reclaim found property.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchData}>
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          {claims.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShieldCheck size={36} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 600 }}>No ownership claims submitted yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Claim Code</th>
                    <th style={{ padding: '10px 12px' }}>Item Title</th>
                    <th style={{ padding: '10px 12px' }}>Claimant Details</th>
                    <th style={{ padding: '10px 12px' }}>Verifiable Ownership Proof</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    {(isAdmin || isStaff) && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Staff Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary-700)' }}>
                        {claim.claimCode || `CLM-${claim.id}`}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {claim.itemTitle}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div><strong>{claim.claimantName}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.claimantEmail}</div>
                      </td>
                      <td style={{ padding: '12px', maxWidth: '300px' }}>
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #e2e8f0', lineHeight: 1.4 }}>
                          {claim.ownershipProof}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          className="badge"
                          style={{
                            background:
                              claim.status === 'APPROVED' || claim.status === 'HANDED_OVER'
                                ? '#dcfce7'
                                : claim.status === 'REJECTED'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              claim.status === 'APPROVED' || claim.status === 'HANDED_OVER'
                                ? '#15803d'
                                : claim.status === 'REJECTED'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {claim.status || 'PENDING'}
                        </span>
                      </td>
                      {(isAdmin || isStaff) && (
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            {claim.status === 'PENDING' && (
                              <>
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ background: '#16a34a', fontSize: '0.72rem' }}
                                  onClick={() => handleUpdateClaimStatus(claim.id, 'APPROVED')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: '#dc2626', fontSize: '0.72rem' }}
                                  onClick={() => handleUpdateClaimStatus(claim.id, 'REJECTED')}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {claim.status === 'APPROVED' && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ background: '#4f46e5', fontSize: '0.72rem' }}
                                onClick={() => handleUpdateClaimStatus(claim.id, 'HANDED_OVER')}
                              >
                                Record Handover
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
      )}

      {/* =====================================================================
          CLAIM MODAL
          ===================================================================== */}
      {claimingItem && (
        <div className="modal-overlay" onClick={() => setClaimingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#4f46e5" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  File Ownership Claim
                </h3>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setClaimingItem(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{claimingItem.itemName || claimingItem.title}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Found at: {claimingItem.location} • Safe Custody: {claimingItem.holdingLocation || 'Security Desk'}
              </div>
            </div>

            <form onSubmit={handleClaimSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Proof of Ownership <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Provide verifiable evidence: serial numbers, purchase bill details, internal wallet contents, specific stickers, device wallpaper, or secret traits..."
                  value={claimProof}
                  onChange={(e) => setClaimProof(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Campus staff check this proof before authorizing physical handover.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setClaimingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingClaim} style={{ background: '#4f46e5' }}>
                  {submittingClaim ? 'Submitting Claim...' : 'Submit Claim Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW DETAILS MODAL
          ===================================================================== */}
      {viewingItem && (
        <div className="modal-overlay" onClick={() => setViewingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="badge"
                  style={{
                    background: viewingItem.type === 'LOST' ? '#fee2e2' : '#dcfce7',
                    color: viewingItem.type === 'LOST' ? '#b91c1c' : '#15803d',
                  }}
                >
                  {viewingItem.type}
                </span>
                <strong style={{ fontSize: '1.15rem' }}>#{viewingItem.itemCode || `LF-${viewingItem.id}`}</strong>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewingItem(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Photo preview in details modal */}
              {viewingItem.image && (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', maxHeight: '240px', background: '#0f172a', display: 'flex', justifyContent: 'center' }}>
                  <img src={viewingItem.image} alt={viewingItem.itemName} style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Item Name</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {viewingItem.itemName || viewingItem.title}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORY</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{viewingItem.category}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{viewingItem.date || viewingItem.dateOccurred}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>LOCATION</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>📍 {viewingItem.location}</div>
              </div>

              {viewingItem.holdingLocation && (
                <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>SAFE CUSTODY</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#065f46', marginTop: '2px' }}>🏢 {viewingItem.holdingLocation}</div>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Description</span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '4px', lineHeight: 1.5 }}>
                  {viewingItem.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFoundModule;
