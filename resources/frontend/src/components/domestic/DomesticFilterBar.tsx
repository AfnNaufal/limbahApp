import { useApp } from '../../context'
import { useIsMobile } from '../../hooks/useMediaQuery'

interface DomesticFilterBarProps {
  filterSession: 'all' | 'morning' | 'afternoon'
  setFilterSession: (val: 'all' | 'morning' | 'afternoon') => void
  filterStatus: 'all' | 'pending' | 'processed' | 'disposed'
  setFilterStatus: (val: 'all' | 'pending' | 'processed' | 'disposed') => void
  onReset: () => void
}

export default function DomesticFilterBar({
  filterSession,
  setFilterSession,
  filterStatus,
  setFilterStatus,
  onReset,
}: DomesticFilterBarProps) {
  const { tokens, t, search, setSearch } = useApp()
  const isMobile = useIsMobile()

  const hasFilter = search || filterSession !== 'all' || filterStatus !== 'all'

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: '5px 10px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          fontSize: 12,
          color: tokens.text,
          fontFamily: tokens.fontFamily,
          width: isMobile ? '100%' : 180,
          outline: 'none',
        }}
      />
      <select
        value={filterSession}
        onChange={(e) => setFilterSession(e.target.value as typeof filterSession)}
        style={{
          padding: '5px 8px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          fontSize: 12,
          color: tokens.text,
          fontFamily: tokens.fontFamily,
          cursor: 'pointer',
        }}
      >
        <option value="all">{t('allSessions')}</option>
        <option value="morning">{t('morning')}</option>
        <option value="afternoon">{t('afternoon')}</option>
      </select>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
        style={{
          padding: '5px 8px',
          background: tokens.inputBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: tokens.radius,
          fontSize: 12,
          color: tokens.text,
          fontFamily: tokens.fontFamily,
          cursor: 'pointer',
        }}
      >
        <option value="all">{t('allStatuses')}</option>
        <option value="pending">{t('pending')}</option>
        <option value="processed">{t('processed')}</option>
        <option value="disposed">{t('disposed')}</option>
      </select>
      {hasFilter && (
        <button
          onClick={onReset}
          style={{
            padding: '5px 10px',
            background: `${tokens.danger}15`,
            border: `1px solid ${tokens.danger}40`,
            borderRadius: tokens.radius,
            fontSize: 12,
            color: tokens.danger,
            cursor: 'pointer',
            fontFamily: tokens.fontFamily,
          }}
        >
          {t('reset')}
        </button>
      )}
    </div>
  )
}
