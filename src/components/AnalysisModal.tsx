'use client';

import React, { useState, useEffect } from 'react';
import styles from './AnalysisModal.module.css';

interface AnalysisResult {
  placeId: string;
  summary: string;
  tags: string[];
  reviewCount: number;
  averageRating: number;
  analyzedAt: string;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    placeId: string;
    name: string;
  };
}

export default function AnalysisModal({ isOpen, onClose, lead }: AnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lead) {
      handleAnalyze();
    }
  }, [isOpen, lead]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/positioning/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: lead.placeId, leadId: lead.id }),
      });
      
      if (!response.ok) throw new Error('分析に失敗しました');
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const response = await fetch('/api/positioning/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          placeId: lead.placeId,
          summary: result.summary,
          tags: result.tags,
          reviewCount: result.reviewCount,
          averageRating: result.averageRating,
        }),
      });
      
      if (response.ok) {
        alert('分析結果を保存しました！');
        onClose();
      } else {
        alert('保存に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Positioning Analysis</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.leadInfo}>
            <span className={styles.label}>店名：</span>
            <span className={styles.value}>{lead.name}</span>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>レビューを分析中...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>⚠️ {error}</p>
              <button onClick={handleAnalyze} className={styles.retryButton}>再試行</button>
            </div>
          ) : result ? (
            <div className={styles.result}>
              <section className={styles.section}>
                <h3>📋 要約</h3>
                <p className={styles.summary}>{result.summary}</p>
              </section>

              <section className={styles.section}>
                <h3>🏷️ タグ</h3>
                <div className={styles.tags}>
                  {result.tags.map((tag, i) => (
                    <span key={i} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3>📊 レビュー統計</h3>
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <label>分析対象</label>
                    <span>{result.reviewCount} 件</span>
                  </div>
                  <div className={styles.statItem}>
                    <label>平均評価</label>
                    <span>{result.averageRating.toFixed(1)} ★</span>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <button className={styles.secondaryButton} onClick={onClose}>閉じる</button>
          <button 
            className={styles.primaryButton} 
            disabled={loading || !result || saving}
            onClick={handleSave}
          >
            {saving ? '保存中...' : '結果を保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
