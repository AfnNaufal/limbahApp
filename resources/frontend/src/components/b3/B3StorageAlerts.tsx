import { useApp } from '../../context'
import type { StorageAlertItem } from '../../types/waste'

interface B3StorageAlertsProps {
  alerts: StorageAlertItem[]
}

export default function B3StorageAlerts({ alerts }: B3StorageAlertsProps) {
  const { tokens, t } = useApp()

  if (!alerts || alerts.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tokens.warning} strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {t('storageAlertTitle')} ({alerts.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {alerts.map((a) => {
          const isExceeded = a.urgency === 'exceeded'
          const maxDays = 90
          const daysInStorage = Math.max(0, maxDays - (a.storageDeadlineDays ?? 0))
          const color = isExceeded ? tokens.danger : tokens.warning
          const pct = Math.min(100, Math.round((daysInStorage / maxDays) * 100))
          const barColor = isExceeded ? tokens.danger : pct > 75 ? tokens.warning : tokens.success

          return (
            <div key={a.id} style={{
              background: `${color}10`, border: `1px solid ${color}40`,
              borderRadius: tokens.radius, padding: '10px 14px', fontSize: 12,
              display: 'flex', flexDirection: 'column', gap: 6,
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = tokens.shadow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: tokens.text }}>{a.type || a.waste_name} ({a.wasteCode || a.waste_code || '-'})</div>
                  <div style={{ color: tokens.textMuted, fontSize: 11 }}>{a.amountKg ?? a.weight_kg ?? 0} kg · Tersimpan {daysInStorage}/{maxDays} hari ({pct}%)</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                  background: color, color: '#fff', whiteSpace: 'nowrap',
                }}>
                  {isExceeded ? `${daysInStorage - maxDays} HR LEWAT` : `${maxDays - daysInStorage} HR LAGI`}
                </span>
              </div>
              <div style={{ height: 5, background: `${color}25`, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
