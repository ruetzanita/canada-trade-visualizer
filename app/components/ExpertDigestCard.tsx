'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, Globe, ShieldCheck, History } from 'lucide-react';
import styles from './ExpertDigestCard.module.css';

export interface KeyDevelopment {
  title: string;
  tag: string;
  source_name: string;
  source_url: string;
  description: string;
}

export interface PrimarySource {
  title: string;
  url: string;
}

export interface DigestData {
  id: string;
  edition_date: string;
  headline: string;
  summary: string;
  key_developments: KeyDevelopment[];
  countries_affected: string[];
  primary_sources: PrimarySource[];
  created_at?: string;
}

export interface DigestEditionMeta {
  id: string;
  edition_date: string;
  headline: string;
}

interface ExpertDigestCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry?: (countryName: string) => void;
}

export default function ExpertDigestCard({
  isOpen,
  onClose,
  onSelectCountry
}: ExpertDigestCardProps) {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [editions, setEditions] = useState<DigestEditionMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load available editions list and initial latest digest
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch list of past editions for the dropdown
    fetch('/api/digest?all=true')
      .then(res => res.json())
      .then(res => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.editions)) {
          setEditions(res.editions);
        }
      })
      .catch(err => {
        console.warn('Could not load editions list:', err);
      });

    // Fetch latest edition
    fetch('/api/digest')
      .then(res => res.json())
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.digest) {
          setDigest(res.digest);
        } else {
          setError(res.error || 'Failed to load weekly digest.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Network error fetching digest.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const loadEdition = (id: string) => {
    if (!id || id === digest?.id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/digest?id=${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.digest) {
          setDigest(res.digest);
        } else {
          setError(res.error || `Could not load edition ${id}`);
        }
      })
      .catch(err => {
        setError(err.message || 'Error loading historical edition.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!isOpen) return null;

  const handleCountryClick = (countryName: string) => {
    if (onSelectCountry) {
      onSelectCountry(countryName);
      onClose();
    }
  };

  const paragraphs = digest?.summary
    ? digest.summary.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    : [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.cardContainer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.badgeRow}>
              <span className={styles.digestBadge}>
                <Sparkles size={12} />
                Canada Export Intelligence
              </span>

              {/* Historical Edition Switcher */}
              {editions.length > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <History size={12} color="#8e95a5" />
                  <select
                    className={styles.editionSelect}
                    value={digest?.id || ''}
                    onChange={e => loadEdition(e.target.value)}
                    aria-label="Select digest edition"
                  >
                    {editions.map(ed => (
                      <option key={ed.id} value={ed.id}>
                        {ed.id} • {ed.edition_date}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <h2 className={styles.headline}>
              {digest?.headline || 'Weekly Trade Intelligence Briefing'}
            </h2>
          </div>

          <button className={styles.closeButton} onClick={onClose} aria-label="Close digest">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.cardBody}>
          {loading && (
            <div className={styles.loadingContainer}>
              Loading Trade Intelligence...
            </div>
          )}

          {error && !loading && (
            <div className={styles.loadingContainer} style={{ color: '#F03A47' }}>
              {error}
            </div>
          )}

          {digest && !loading && (
            <>
              {/* Editorial Summary (Multi-Paragraph Long Form) */}
              <div className={styles.summarySection}>
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, idx) => (
                    <p key={idx} className={styles.summaryText}>
                      {para.trim()}
                    </p>
                  ))
                ) : (
                  <p className={styles.summaryText}>{digest.summary}</p>
                )}
              </div>

              {/* Key Global Developments */}
              {digest.key_developments && digest.key_developments.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>
                    <ShieldCheck size={14} color="#00b4ff" />
                    Verified Global Developments
                  </h3>
                  <div className={styles.developmentsList}>
                    {digest.key_developments.map((dev, idx) => (
                      <div key={idx} className={styles.developmentCard}>
                        <div className={styles.devHeader}>
                          <span className={styles.tagBadge}>{dev.tag || 'Policy Update'}</span>
                          {dev.source_url && (
                            <a
                              href={dev.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.sourceLink}
                            >
                              <span>{dev.source_name || 'Official Source'}</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <h4 className={styles.devTitle}>{dev.title}</h4>
                        <p className={styles.devDescription}>{dev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Countries */}
              {digest.countries_affected && digest.countries_affected.length > 0 && (
                <div className={styles.countriesSection}>
                  <h3 className={styles.sectionTitle}>
                    <Globe size={14} color="#00b4ff" />
                    Active Partner Focus (Click to View Globe)
                  </h3>
                  <div className={styles.chipsContainer}>
                    {digest.countries_affected.map((country, idx) => (
                      <button
                        key={idx}
                        className={styles.countryChip}
                        onClick={() => handleCountryClick(country)}
                      >
                        <span>{country}</span>
                        <ExternalLink size={11} style={{ opacity: 0.6 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Sources */}
              {digest.primary_sources && digest.primary_sources.length > 0 && (
                <div className={styles.sourcesSection}>
                  <h3 className={styles.sectionTitle}>Primary Intelligence Sources</h3>
                  <div className={styles.sourcesList}>
                    {digest.primary_sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.verifiedSourceLink}
                      >
                        <ExternalLink size={12} />
                        <span>{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
