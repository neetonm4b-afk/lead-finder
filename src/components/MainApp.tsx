'use client';

import React, { useState, useEffect } from 'react';
import styles from './MainApp.module.css';

interface Lead {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  website?: string;
  rating: number;
  userRatingCount: number;
  leadScore: number;
  types: string;
  filterPass: boolean;
  failReasons: string[];
  createdAt?: string;
}

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(3.8);
  const [minReviews, setMinReviews] = useState(20);
  const [websiteMissingOnly, setWebsiteMissingOnly] = useState(true);
  const [showFailedCandidates, setShowFailedCandidates] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedLeads();
    }
  }, [activeTab]);

  const fetchSavedLeads = async () => {
    setSavedLoading(true);
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      setSavedLeads(data.leads || []);
    } catch (error) {
      console.error('Failed to fetch saved leads:', error);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchSavedLeads();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('エラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          location, 
          minRating, 
          minReviews, 
          websiteMissingOnly 
        }),
      });
      const data = await response.json();
      setLeads(data.leads || []);
      setSelectedLead(null);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCRM = async (lead: Lead) => {
    console.log("CRM_SAVE_CLICKED", lead.name);
    setSaving(true);
    try {
      const response = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      
      if (response.status === 409) {
        setNotification({ message: 'このリードはすでに保存済みです', type: 'warning' });
      } else {
        const data = await response.json();
        if (data.success) {
          setNotification({ message: 'CRMに保存しました！', type: 'success' });
        } else {
          setNotification({ message: `保存に失敗しました: ${data.error}`, type: 'warning' });
        }
      }
      
      // 3秒後に通知を消す
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Failed to save lead:', error);
      setNotification({ message: 'エラーが発生しました', type: 'warning' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredLeads = leads.filter(lead => showFailedCandidates || lead.filterPass);

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'search' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'saved' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          📂 Saved Leads
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className={styles.container}>
          {/* Sidebar - Search & Filters */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h1>Lead Finder</h1>
              <p>高確度の営業リストを瞬時に作成</p>
            </div>

            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.inputGroup}>
                <label>キーワード</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="例: 歯科医院, 美容室" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label>エリア</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="例: 渋谷, 東京都" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className={styles.filterSection}>
                <h3>フィルター設定</h3>
                <div className={styles.filterItem}>
                  <label>最低評価: {minRating}</label>
                  <input 
                    type="range" 
                    min="0" max="5" step="0.1" 
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  />
                </div>
                <div className={styles.filterItem}>
                  <label>最低レビュー数: {minReviews}</label>
                  <input 
                    type="number" 
                    className={styles.input}
                    value={minReviews}
                    onChange={(e) => setMinReviews(parseInt(e.target.value))}
                  />
                </div>
                <div className={styles.checkboxItem}>
                  <input 
                    type="checkbox" 
                    id="web-missing"
                    checked={websiteMissingOnly}
                    onChange={(e) => setWebsiteMissingOnly(e.target.checked)}
                  />
                  <label htmlFor="web-missing">ウェブサイトなしのみ</label>
                </div>
              </div>

              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? '検索中...' : 'リードを検索'}
              </button>
            </form>

            <div className={styles.displayToggle}>
              <div className={styles.checkboxItem}>
                <input 
                  type="checkbox" 
                  id="show-failed"
                  checked={showFailedCandidates}
                  onChange={(e) => setShowFailedCandidates(e.target.checked)}
                />
                <label htmlFor="show-failed">条件未達の候補も表示</label>
              </div>
            </div>
          </aside>

          {/* Middle Column - Results List */}
          <section className={styles.content}>
            <div className={styles.resultsHeader}>
              <h2>{filteredLeads.length} 件の候補が見つかりました</h2>
            </div>

            {filteredLeads.map((lead, index) => (
              <div 
                key={lead.id} 
                className={`premium-card ${styles.leadCard} animate-fade-in ${!lead.filterPass ? styles.failedCard : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedLead(lead)}
              >
                <div className={styles.leadHeader}>
                  <span className={styles.scoreBadge}>{lead.leadScore} pts</span>
                  <h3 className={styles.leadTitle}>{lead.name}</h3>
                  {!lead.filterPass && <span className={styles.failBadge}>未達</span>}
                </div>
                <p className={styles.address}>{lead.address}</p>
                <div className={styles.leadMeta}>
                  <span>⭐ {lead.rating} ({lead.userRatingCount})</span>
                  <span>{lead.types}</span>
                </div>
              </div>
            ))}
            {filteredLeads.length === 0 && !loading && (
              <div className={styles.emptyState}>
                <p>検索結果がありません。条件を緩めるか、別のキーワードで試してください。</p>
              </div>
            )}
          </section>

          {/* Right Column - Details */}
          <main className={styles.detail}>
            {selectedLead ? (
              <div className={`animate-fade-in ${styles.detailContent}`}>
                <div className={styles.detailHeader}>
                  <h1>{selectedLead.name}</h1>
                  <div className={`${styles.statusBadge} ${selectedLead.filterPass ? styles.statusPass : styles.statusFail}`}>
                    {selectedLead.filterPass ? '高確度ターゲット' : '基準未達'}
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h3 style={{ marginBottom: '15px' }}>判定ステータス</h3>
                  <div className={styles.statusGrid}>
                    <div className={styles.statusItem}>
                      <label>Website</label>
                      <span>{(!selectedLead.website) ? '✅ なし' : '❌ あり'}</span>
                    </div>
                    <div className={styles.statusItem}>
                      <label>評価</label>
                      <span>{selectedLead.rating} (基準:{minRating}+)</span>
                    </div>
                    <div className={styles.statusItem}>
                      <label>レビュー</label>
                      <span>{selectedLead.userRatingCount} (基準:{minReviews}+)</span>
                    </div>
                  </div>
                  {!selectedLead.filterPass && (
                    <div className={styles.failReasonBox}>
                      <strong>基準未達の理由:</strong>
                      <ul>
                        {selectedLead.failReasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.detailSection}>
                  <h3 style={{ marginBottom: '15px' }}>連絡先情報</h3>
                  <p style={{ marginBottom: '10px' }}><strong>住所:</strong> {selectedLead.address}</p>
                  <p style={{ marginBottom: '10px' }}><strong>電話番号:</strong> {selectedLead.phoneNumber || '未登録'}</p>
                  <p style={{ marginBottom: '10px' }}><strong>ウェブサイト:</strong> {selectedLead.website ? (
                    <a href={selectedLead.website} target="_blank" rel="noopener noreferrer">{selectedLead.website}</a>
                  ) : '未登録'}</p>
                </div>

                <div className={styles.actionSection} style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                  <button 
                    className={styles.button} 
                    onClick={() => handleSaveToCRM(selectedLead)}
                    disabled={saving}
                  >
                    {saving ? '保存中...' : 'CRMに保存'}
                  </button>
                  <button 
                    className={styles.button} 
                    style={{ background: '#444' }}
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.name + ' ' + selectedLead.address)}`, '_blank')}
                  >
                    Google Maps
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.emptyDetails} style={{ textAlign: 'center', marginTop: '100px', color: '#666' }}>
                <p>リストからリードを選択すると詳細が表示されます</p>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className={styles.savedLeadsContent}>
          <div className={styles.savedLeadsInner}>
            <div className={styles.savedLeadsHeader}>
              <h2>保存済みリード一覧</h2>
              <p>{savedLeads.length} 件のリードが保存されています</p>
            </div>

            {savedLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>データを読み込んでいます...</p>
              </div>
            ) : (
              <div className={styles.savedLeadsList}>
                {savedLeads.map((lead) => (
                  <div key={lead.id} className={styles.savedLeadCard}>
                    <div className={styles.savedLeadHeader}>
                      <h3 className={styles.savedLeadTitle}>{lead.name}</h3>
                      <span className={styles.savedLeadDate}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''} 保存
                      </span>
                    </div>
                    <div className={styles.savedLeadDetails}>
                      <div className={styles.savedLeadInfoRow}>
                        <span>📍</span> {lead.address}
                      </div>
                      <div className={styles.savedLeadInfoRow}>
                        <span>⭐</span> {lead.rating ? `${lead.rating} / 5.0` : '評価なし'}
                      </div>
                      <div className={styles.savedLeadInfoRow}>
                        <span>🌐</span> {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline'}}>
                            {lead.website}
                          </a>
                        ) : 'ウェブサイト未登録'}
                      </div>
                    </div>
                    <div className={styles.savedLeadMeta}>
                      <div className={styles.leadMeta}>
                        <span>⭐ {lead.rating || 'N/A'}</span>
                      </div>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => handleDeleteLead(lead.id)}
                        disabled={deletingId === lead.id}
                      >
                        {deletingId === lead.id ? 'Deleting...' : '削除'}
                      </button>
                    </div>
                  </div>
                ))}
                {savedLeads.length === 0 && (
                  <div className={styles.emptyState} style={{textAlign: 'center', padding: '100px 0'}}>
                    <p style={{fontSize: '1.2rem', color: '#666'}}>保存済みのリードはまだありません。</p>
                    <button 
                      className={styles.button} 
                      style={{marginTop: '20px'}}
                      onClick={() => setActiveTab('search')}
                    >
                      リードを探しに行く
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {notification && (
        <div className={`${styles.notification} ${notification.type === 'success' ? styles.notificationSuccess : styles.notificationWarning}`}>
          <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
          {notification.message}
        </div>
      )}
    </div>
  );
}
