'use client';

import { useState, useRef } from 'react';
import { useLang } from '@/lib/LanguageContext';

const TABS = [
  {
    key: 'members',
    label_zh: '成員',
    label_en: 'Members',
    icon: '👥',
    columns: ['full_name', 'email', 'role'],
    hint_zh: 'role 可填: student / teacher / org_admin',
    hint_en: 'role values: student / teacher / org_admin',
    sample: [
      ['王小明', 'student@example.com', 'student'],
      ['陳老師', 'teacher@example.com', 'teacher'],
      ['管理員', 'admin@example.com', 'org_admin'],
    ],
  },
  {
    key: 'subjects',
    label_zh: '科目',
    label_en: 'Subjects',
    icon: '📚',
    columns: ['name_en', 'name_zh', 'category'],
    hint_zh: 'category 非必填',
    hint_en: 'category is optional',
    sample: [
      ['Mathematics', '數學', 'STEM'],
      ['English', '英文', 'Language'],
      ['Piano', '鋼琴', 'Arts'],
    ],
  },
  {
    key: 'assignments',
    label_zh: '師生分配',
    label_en: 'Assignments',
    icon: '🔗',
    columns: ['student_email', 'teacher_email'],
    hint_zh: '請確認成員已匯入，且已執行 phase2.sql',
    hint_en: 'Members must be imported first and phase2.sql must be run',
    sample: [
      ['student@example.com', 'teacher@example.com'],
    ],
  },
];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

function buildCSV(columns, sample) {
  const header = columns.join(',');
  const body = sample.map(r => r.join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadCSV(filename, content) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportClient() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef();

  const tab = TABS[activeTab];

  const handleTabChange = (i) => {
    setActiveTab(i);
    setFile(null);
    setParsed(null);
    setResult(null);
    setShowErrors(false);
  };

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) return;
    setFile(f);
    setResult(null);
    setShowErrors(false);
    const reader = new FileReader();
    reader.onload = (e) => setParsed(parseCSV(e.target.result));
    reader.readAsText(f, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleImport = async () => {
    if (!parsed?.rows?.length) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab.key, rows: parsed.rows }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: 0, failed: parsed.rows.length, errors: [e.message] });
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsed(null);
    setResult(null);
    setShowErrors(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const PREVIEW_MAX = 8;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {lang === 'zh' ? '批量匯入' : 'Import Data'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh'
            ? '透過 CSV 批量匯入成員、科目與師生分配關係'
            : 'Bulk import members, subjects, and assignments via CSV'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '6px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px', padding: '4px',
        marginBottom: '1.75rem',
        width: 'fit-content',
      }}>
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => handleTabChange(i)} style={{
            padding: '8px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: activeTab === i ? 600 : 400,
            background: activeTab === i
              ? 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(236,72,153,0.3))'
              : 'transparent',
            color: activeTab === i ? '#fff' : '#64748b',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>{t.icon}</span>
            {lang === 'zh' ? t.label_zh : t.label_en}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left: Format + Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* CSV Format Card */}
          <div style={{
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '16px', padding: '1.25rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              {lang === 'zh' ? 'CSV 格式' : 'CSV Format'}
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px 14px',
              fontFamily: 'monospace', fontSize: '0.78rem', color: '#818cf8',
              marginBottom: '8px', overflowX: 'auto', whiteSpace: 'nowrap',
            }}>
              {tab.columns.join(', ')}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.875rem' }}>
              {lang === 'zh' ? tab.hint_zh : tab.hint_en}
            </p>
            <button
              onClick={() => downloadCSV(`template_${tab.key}.csv`, buildCSV(tab.columns, tab.sample))}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              ↓ {lang === 'zh' ? '下載範本' : 'Download Template'}
            </button>
          </div>

          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'rgba(99,102,241,0.6)' : file ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '16px', padding: '2rem',
              background: dragging ? 'rgba(99,102,241,0.06)' : file ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
              textAlign: 'center', cursor: file ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileRef} type="file" accept=".csv"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📄</div>
                <div style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>
                  {file.name}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '10px' }}>
                  {parsed?.rows?.length ?? 0} {lang === 'zh' ? '筆資料' : 'rows detected'}
                </div>
                <button onClick={(e) => { e.stopPropagation(); clearFile(); }} style={{
                  padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer',
                }}>
                  {lang === 'zh' ? '清除' : 'Clear'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '4px' }}>
                  {lang === 'zh' ? '拖曳 CSV 至此，或點擊選擇' : 'Drop CSV here, or click to select'}
                </div>
                <div style={{ color: '#475569', fontSize: '0.75rem' }}>
                  {lang === 'zh' ? '僅支援 .csv 格式' : '.csv files only'}
                </div>
              </div>
            )}
          </div>

          {/* Import Button */}
          {parsed?.rows?.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="submit-btn"
              style={{ marginTop: 0 }}
            >
              {importing
                ? (lang === 'zh' ? '匯入中...' : 'Importing...')
                : `${lang === 'zh' ? '匯入' : 'Import'} ${parsed.rows.length} ${lang === 'zh' ? '筆' : 'rows'}`}
            </button>
          )}
        </div>

        {/* Right: Preview / Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Preview Table */}
          {parsed?.rows?.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  {lang === 'zh' ? '預覽' : 'Preview'}
                </span>
                <span style={{
                  fontSize: '0.7rem', padding: '2px 10px', borderRadius: '999px',
                  background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                }}>
                  {parsed.rows.length} {lang === 'zh' ? '筆' : 'rows'}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      {tab.columns.map(col => (
                        <th key={col} style={{
                          padding: '8px 14px', textAlign: 'left',
                          color: '#64748b', fontWeight: 600, fontSize: '0.72rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          whiteSpace: 'nowrap',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, PREVIEW_MAX).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {tab.columns.map(col => (
                          <td key={col} style={{
                            padding: '8px 14px', color: '#f8fafc',
                            maxWidth: '160px', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {row[col] || <span style={{ color: '#374151' }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsed.rows.length > PREVIEW_MAX && (
                <div style={{ padding: '8px 14px', color: '#475569', fontSize: '0.72rem' }}>
                  + {parsed.rows.length - PREVIEW_MAX} {lang === 'zh' ? '筆未顯示' : 'more rows not shown'}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${result.failed > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              borderRadius: '16px', padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {lang === 'zh' ? '匯入結果' : 'Import Results'}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  flex: 1, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '12px', padding: '0.875rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4ade80' }}>
                    {result.success}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    {lang === 'zh' ? '成功' : 'Success'}
                  </div>
                </div>
                <div style={{
                  flex: 1, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '12px', padding: '0.875rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f87171' }}>
                    {result.failed}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    {lang === 'zh' ? '失敗' : 'Failed'}
                  </div>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowErrors(p => !p)}
                    style={{
                      background: 'none', border: 'none', color: '#f87171',
                      fontSize: '0.78rem', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <span style={{ transform: showErrors ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.2s' }}>▶</span>
                    {lang === 'zh' ? `查看 ${result.errors.length} 個錯誤` : `View ${result.errors.length} error(s)`}
                  </button>
                  {showErrors && (
                    <div style={{
                      marginTop: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                      padding: '10px', maxHeight: '160px', overflowY: 'auto',
                    }}>
                      {result.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: '0.72rem', color: '#f87171', lineHeight: 1.7 }}>
                          · {e}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={clearFile}
                className="submit-btn"
                style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}
              >
                {lang === 'zh' ? '繼續匯入' : 'Import More'}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!parsed && !result && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '3rem',
              textAlign: 'center', color: '#374151',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
              <div style={{ fontSize: '0.875rem' }}>
                {lang === 'zh' ? '上傳 CSV 後將在此顯示預覽' : 'Upload a CSV to preview data here'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
