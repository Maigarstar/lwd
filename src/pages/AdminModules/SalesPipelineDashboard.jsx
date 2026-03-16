/**
 * SalesPipelineDashboard.jsx
 * Dashboard / analytics view, extracted from SalesPipelineModule.jsx.
 *
 * IMPORTANT: S and G are passed as props so this component picks up the
 * themed values that SalesPipelineModule sets before rendering.
 */

import React from 'react';

function formatValue(v) { if (!v) return null; return `${Number(v).toLocaleString()}`; }

export default function DashboardView({ stats, stages, overdueFU, onRunFollowUps, followUpRunning, onRecalcScores, scoresRefreshing, intelligence, analytics, allProspects, S, G, C }) {
  const resolvedG = G || '#8f7420';
  const maxCount = Math.max(...stages.map(s => stats.stageCounts?.[s.name] || 0), 1);

  const sourceBreakdown = React.useMemo(() => {
    if (!allProspects?.length) return [];
    const counts = {};
    allProspects.forEach(p => {
      const s = p.source || 'Unknown';
      if (!counts[s]) counts[s] = { source: s, total: 0, converted: 0, active: 0 };
      counts[s].total++;
      if (p.status === 'converted') counts[s].converted++;
      if (p.status === 'active') counts[s].active++;
    });
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [allProspects]);

  const kpis = [
    { label: 'Total Prospects',   value: stats.totalProspects   || 0 },
    { label: 'Active',            value: stats.activeProspects  || 0 },
    { label: 'Emails This Month', value: stats.emailsThisMonth  || 0 },
    { label: 'Reply Rate',        value: `${stats.replyRate     || 0}%` },
    { label: 'Meetings Booked',   value: stats.meetingsBooked   || 0 },
    { label: 'Proposals Sent',    value: stats.proposalsSent    || 0 },
    { label: 'Closed Won',        value: stats.closedWon        || 0 },
    { label: 'Close Rate',        value: `${stats.closeRate     || 0}%` },
  ];

  return (
    <div style={S.dash}>
      {overdueFU.length > 0 && (
        <div style={{ background: '#fffdf8', border: '1px solid rgba(143,116,32,0.3)', borderRadius: 8, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={S.fuBadge}>{overdueFU.length} Follow-ups Due</span>
          <span style={{ fontSize: 13, color: '#555', flex: 1 }}>{overdueFU.map(p => p.company_name).slice(0, 3).join(', ')}{overdueFU.length > 3 ? ` +${overdueFU.length - 3} more` : ''}</span>
          <button style={{ ...S.goldBtn, opacity: followUpRunning ? 0.6 : 1 }} onClick={onRunFollowUps} disabled={followUpRunning}>{followUpRunning ? 'Sending...' : 'Send Follow-Ups Now'}</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button style={S.outlineBtn} onClick={onRunFollowUps} disabled={!!followUpRunning}>
          {followUpRunning ? 'Running...' : 'Run Follow-ups Now'}
        </button>
      </div>

      <div style={S.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiVal}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          style={{ ...S.outlineBtn, fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5, opacity: scoresRefreshing ? 0.6 : 1 }}
          onClick={onRecalcScores}
          disabled={scoresRefreshing}
        >
          {scoresRefreshing ? 'Recalculating...' : '\u21BB Recalculate Lead Scores'}
        </button>
      </div>

      {/* Pipeline Intelligence */}
      {intelligence && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>

          {/* Deals at risk */}
          <div style={{ background: '#fff', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Deals at Risk</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#fef3c7', color: '#92400e', borderRadius: 100, padding: '1px 8px', fontWeight: 700 }}>{intelligence.dealsAtRisk.length}</span>
            </div>
            {intelligence.dealsAtRisk.length === 0
              ? <div style={{ fontSize: 12, color: '#aaa' }}>No deals at risk.</div>
              : intelligence.dealsAtRisk.slice(0, 4).map(p => (
                  <div key={p.id} style={{ fontSize: 12, color: '#555', padding: '5px 0', borderBottom: '1px solid #fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{p.company_name}</span>
                    {p.proposal_value ? <span style={{ color: '#f59e0b', fontSize: 11 }}>GBP {formatValue(p.proposal_value)}</span> : null}
                  </div>
                ))
            }
          </div>

          {/* High probability deals */}
          <div style={{ background: '#fff', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>High Probability</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#dcfce7', color: '#166534', borderRadius: 100, padding: '1px 8px', fontWeight: 700 }}>{intelligence.highProbDeals.length}</span>
            </div>
            {intelligence.highProbDeals.length === 0
              ? <div style={{ fontSize: 12, color: '#aaa' }}>No high probability deals yet.</div>
              : intelligence.highProbDeals.slice(0, 4).map(p => (
                  <div key={p.id} style={{ fontSize: 12, color: '#555', padding: '5px 0', borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{p.company_name}</span>
                    {p.proposal_value ? <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>GBP {formatValue(p.proposal_value)}</span> : null}
                  </div>
                ))
            }
          </div>

          {/* Revenue potential + pipeline metrics */}
          <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>Revenue Intelligence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Weighted Revenue Potential</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#171717', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  GBP {intelligence.revenuePotential.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Total Pipeline Value</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>GBP {intelligence.totalPipelineValue.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Avg Time in Pipeline</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{intelligence.avgDaysInPipeline} days</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Won This Month</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{intelligence.wonThisMonth}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Email Analytics */}
      {analytics && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Email Analytics</div>
            <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>{analytics.openRateNote}</div>
          </div>

          {/* KPI row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Emails Sent',     value: analytics.totalSent },
              { label: 'Open Rate',       value: `${analytics.openRate}%`,        note: 'approx' },
              { label: 'Reply Rate',      value: `${analytics.replyRate}%` },
              { label: 'Open to Reply',   value: `${analytics.openToReplyRate}%` },
              { label: 'Avg Reply Time',  value: analytics.avgReplyHours > 0 ? `${analytics.avgReplyHours}h` : '--' },
            ].map(k => (
              <div key={k.label} style={S.analyticsKpi}>
                <div style={S.analyticsKpiVal}>{k.value}{k.note ? <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 4 }}>{k.note}</span> : null}</div>
                <div style={S.analyticsKpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Subject line table */}
          {analytics.subjectLines.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12 }}>Subject Line Performance</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>
                  {['Subject', 'Sent', 'Opens', 'Open %', 'Replies', 'Reply %'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Subject' ? 'left' : 'center', padding: '5px 8px', color: '#aaa', fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #f3f0ea' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {analytics.subjectLines.map((s, i) => (
                    <tr key={s.subject} style={{ background: i === 0 && s.openRate >= 40 ? `${resolvedG}08` : 'transparent' }}>
                      <td style={{ padding: '6px 8px', borderLeft: i === 0 && s.openRate >= 40 ? `3px solid ${resolvedG}` : '3px solid transparent', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }} title={s.subject}>{s.subject}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{s.sent}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{s.opens}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: s.openRate >= 40 ? '#22c55e' : s.openRate >= 20 ? '#f59e0b' : '#aaa' }}>{s.openRate}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{s.replies}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: s.replyRate >= 20 ? '#22c55e' : s.replyRate >= 10 ? '#f59e0b' : '#aaa' }}>{s.replyRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Send time heatmap */}
          {analytics.sendTimePatterns && (
            <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12 }}>Best Send Times (by Reply Rate)</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {analytics.sendTimePatterns.map(b => {
                  const intensity = Math.min(1, b.replyRate / 30);
                  const bg = b.sent > 0 ? `rgba(143,116,32,${0.1 + intensity * 0.7})` : '#f3f0ea';
                  const textC = intensity > 0.5 ? '#fff' : '#666';
                  return (
                    <div key={b.hour} title={`${b.label}: ${b.sent} sent, ${b.replyRate}% reply rate`} style={{ flex: '1 1 calc(8.33% - 3px)', minWidth: 36, height: 40, background: bg, borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
                      <div style={{ fontSize: 9, color: textC, fontWeight: 600, lineHeight: 1 }}>{b.label}</div>
                      {b.sent > 0 && <div style={{ fontSize: 9, color: textC, opacity: 0.8, marginTop: 1 }}>{b.replyRate}%</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 8 }}>Darker = higher reply rate. Hover for details.</div>
            </div>
          )}

          {sourceBreakdown.length > 0 && (
            <div style={{ background: S.kpiCard.background, border: S.kpiCard.border, borderRadius: 8, padding: '18px 20px', marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#888', marginBottom: 14 }}>Source Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sourceBreakdown.map(({ source, total, converted, active }) => {
                  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
                  const barW = `${Math.round((total / (sourceBreakdown[0]?.total || 1)) * 100)}%`;
                  return (
                    <div key={source} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px 60px', gap: 10, alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source}</div>
                      <div style={{ height: 8, background: '#f3f0ea', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: barW, background: '#8f7420', borderRadius: 4, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>{total} total</div>
                      <div style={{ fontSize: 11, color: convRate > 30 ? '#22c55e' : '#888', textAlign: 'right', fontWeight: convRate > 30 ? 700 : 400 }}>{convRate}% conv.</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 16 }}>Stage Distribution</div>
        {stages.map(stage => {
          const count = stats.stageCounts?.[stage.name] || 0;
          const pct   = Math.round((count / maxCount) * 100);
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
              <div style={{ width: 150, fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.name}</div>
              <div style={{ flex: 1, background: '#f3f0ea', borderRadius: 100, height: 8 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: stage.color, borderRadius: 100, transition: 'width 0.5s' }} />
              </div>
              <div style={{ width: 28, fontSize: 12, color: '#888', textAlign: 'right' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {overdueFU.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 12 }}>Overdue Follow-Ups</div>
          {overdueFU.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f0ea' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.company_name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Due: {p.next_follow_up_at ? new Date(p.next_follow_up_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '--'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
