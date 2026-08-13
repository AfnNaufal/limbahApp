import type {
  WasteStatus as WasteStatusType,
  WasteSession as WasteSessionType,
  WasteCategoryType,
  B3TransactionData,
  DomesticTransactionData,
  AppNotification,
} from './types/waste'

export type WasteStatus = WasteStatusType
export type WasteSession = WasteSessionType
export type WasteCategory = WasteCategoryType

export type B3Transaction = B3TransactionData
export type DomesticTransaction = DomesticTransactionData
export type Notification = AppNotification

const SOURCES = ['Lab Kimia', 'Produksi A', 'Gudang B', 'Workshop', 'Klinik', 'Boiler Room', 'Bengkel']
const DESTINATIONS = ['PT Prasada Pamunah', 'PPLI Cileungsi', 'PT Wastec Intl', 'PT ARAH Enviro', 'PT Tenang Jaya']
const TRANSPORTS = ['PT Lestari Trans', 'CV Mitra Angkut', 'PT Hijau Logistik']
const WASTE_ITEMS_B3 = [
  { code: 'A108d', name: 'Limbah Terkontaminasi B3' },
  { code: 'A331-2', name: 'Sludge dari Oil Treatment atau Fasilitas Penyimpanan' },
  { code: 'B353-1', name: 'Toner Bekas' },
  { code: 'B337-2', name: 'Sludge IPAL' },
  { code: 'B102d', name: 'Debu dan Fiber Asbes-Asbes Putih' },
  { code: 'A337-3', name: 'Bahan Kimia Kadaluwarsa' },
  { code: 'B107d', name: 'Lampu TL, Limbah Elektronik Termasuk Cathode Ray Tube (CRT), PCB, Karet Kawat (Wire Rubber)' },
  { code: 'B110d', name: 'Kain Majun Bekas (Used Rags)' },
  { code: 'B109d', name: 'Filter Bekas dari Fasilitas Pengendalian Pencemaran Udara' },
  { code: 'B105d', name: 'Minyak Pelumas Bekas (Minyak pelumas bekas hidrolik, mesin, gear, dan lainnya)' },
  { code: 'B104d', name: 'Kemasan Bekas B3' },
  { code: 'A102d', name: 'Aki/Baterai Bekas' },
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function genManifest(i: number) {
  return `MNF-2024-${String(i + 1001).padStart(5, '0')}`
}

function genDate(month: number, day: number) {
  return `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const rand = rng(42)

export const B3_TRANSACTIONS: B3Transaction[] = Array.from({ length: 48 }, (_, i) => {
  const month = Math.floor(i / 4) + 1
  const day = (i % 4) * 7 + 3
  const isIn = i % 2 === 0
  const amountKg = Math.round((rand() * 480 + 20) * 10) / 10
  const capKg = Math.round(rand() * 800 + 200)
  const currKg = Math.round(rand() * capKg)
  const wasteItem = WASTE_ITEMS_B3[i % WASTE_ITEMS_B3.length]!

  return {
    id: `B3-${String(i + 1).padStart(4, '0')}`,
    date: genDate(Math.min(month, 12), Math.min(day, 28)),
    wasteCode: wasteItem.code,
    type: wasteItem.name,
    waste_code: wasteItem.code,
    waste_name: wasteItem.name,
    amountKg,
    weightKg: amountKg,
    source: SOURCES[Math.floor(rand() * SOURCES.length)]!,
    destination: DESTINATIONS[Math.floor(rand() * DESTINATIONS.length)]!,
    transport: TRANSPORTS[Math.floor(rand() * TRANSPORTS.length)]!,
    manifest: genManifest(i),
    status: (['pending', 'processed', 'disposed'] as WasteStatus[])[Math.floor(rand() * 3)]!,
    category: isIn ? 'b3in' : 'b3out',
    storageDeadlineDays: isIn ? Math.round(rand() * 180 - 30) : undefined,
    storageCapacityKg: isIn ? capKg : undefined,
    currentStorageKg: isIn ? currKg : undefined,
  }
})

const PICS = ['Budi Santoso', 'Siti Rahayu', 'Ahmad Fauzi', 'Dewi Lestari', 'Hendra K.', 'Rina Putri']

export const DOMESTIC_TRANSACTIONS: DomesticTransaction[] = Array.from({ length: 60 }, (_, i) => {
  const month = Math.floor(i / 5) + 1
  const day = (i % 5) * 6 + 1
  const session: WasteSession = i % 2 === 0 ? 'morning' : 'afternoon'
  const organicKg = Math.round((rand() * 60 + 10) * 10) / 10
  const inorganicKg = Math.round((rand() * 30 + 5) * 10) / 10
  return {
    id: `DOM-${String(i + 1).padStart(4, '0')}`,
    date: genDate(Math.min(month, 12), Math.min(day, 28)),
    session,
    organicKg,
    inorganicKg,
    totalKg: Math.round((organicKg + inorganicKg) * 10) / 10,
    status: (['pending', 'processed', 'disposed'] as WasteStatus[])[Math.floor(rand() * 3)]!,
    picName: PICS[Math.floor(rand() * PICS.length)]!,
  }
})

// Monthly aggregates for charts (2024)
export const MONTHLY_B3_IN = [
  { month: 'Jan', value: 847.3 },
  { month: 'Feb', value: 723.6 },
  { month: 'Mar', value: 1124.8 },
  { month: 'Apr', value: 956.2 },
  { month: 'May', value: 1089.4 },
  { month: 'Jun', value: 834.7 },
  { month: 'Jul', value: 1203.1 },
  { month: 'Aug', value: 978.5 },
  { month: 'Sep', value: 1156.9 },
  { month: 'Oct', value: 892.3 },
  { month: 'Nov', value: 1034.7 },
  { month: 'Dec', value: 1178.2 },
]

export const MONTHLY_B3_OUT = [
  { month: 'Jan', value: 612.4 },
  { month: 'Feb', value: 589.1 },
  { month: 'Mar', value: 934.7 },
  { month: 'Apr', value: 812.3 },
  { month: 'May', value: 967.8 },
  { month: 'Jun', value: 723.4 },
  { month: 'Jul', value: 1034.6 },
  { month: 'Aug', value: 856.2 },
  { month: 'Sep', value: 1012.4 },
  { month: 'Oct', value: 768.9 },
  { month: 'Nov', value: 923.1 },
  { month: 'Dec', value: 1056.8 },
]

export const MONTHLY_DOM_MORNING = [
  { month: 'Jan', value: 324.7 },
  { month: 'Feb', value: 298.3 },
  { month: 'Mar', value: 341.6 },
  { month: 'Apr', value: 312.9 },
  { month: 'May', value: 358.2 },
  { month: 'Jun', value: 289.4 },
  { month: 'Jul', value: 376.8 },
  { month: 'Aug', value: 334.1 },
  { month: 'Sep', value: 367.5 },
  { month: 'Oct', value: 321.8 },
  { month: 'Nov', value: 348.6 },
  { month: 'Dec', value: 389.3 },
]

export const MONTHLY_DOM_AFTERNOON = [
  { month: 'Jan', value: 198.4 },
  { month: 'Feb', value: 187.2 },
  { month: 'Mar', value: 214.8 },
  { month: 'Apr', value: 203.6 },
  { month: 'May', value: 221.3 },
  { month: 'Jun', value: 189.7 },
  { month: 'Jul', value: 234.1 },
  { month: 'Aug', value: 208.9 },
  { month: 'Sep', value: 228.6 },
  { month: 'Oct', value: 196.3 },
  { month: 'Nov', value: 217.4 },
  { month: 'Dec', value: 241.7 },
]

export const PIE_B3_IN = [
  { name: 'Lab Kimia', value: 28.4 },
  { name: 'Produksi A', value: 23.7 },
  { name: 'Workshop', value: 18.2 },
  { name: 'Klinik', value: 12.1 },
  { name: 'Gudang B', value: 9.8 },
  { name: 'Boiler Room', value: 7.8 },
]

export const PIE_B3_OUT = [
  { name: 'PT Prasada Pamunah', value: 34.2 },
  { name: 'PPLI Cileungsi', value: 27.8 },
  { name: 'PT Wastec Intl', value: 19.4 },
  { name: 'PT ARAH Enviro', value: 11.3 },
  { name: 'PT Tenang Jaya', value: 7.3 },
]

export const PIE_DOM_MORNING = [
  { name: 'Organic', value: 63.7 },
  { name: 'Inorganic', value: 36.3 },
]

export const PIE_DOM_AFTERNOON = [
  { name: 'Organic', value: 58.4 },
  { name: 'Inorganic', value: 41.6 },
]

export const WEEKLY_B3_IN = [
  { week: 'W1', value: 213.4 },
  { week: 'W2', value: 187.6 },
  { week: 'W3', value: 246.8 },
  { week: 'W4', value: 199.3 },
]

export const WEEKLY_B3_OUT = [
  { week: 'W1', value: 178.2 },
  { week: 'W2', value: 156.4 },
  { week: 'W3', value: 198.7 },
  { week: 'W4', value: 167.3 },
]

export const WEEKLY_DOM_MORNING = [
  { week: 'W1', value: 89.3 },
  { week: 'W2', value: 94.7 },
  { week: 'W3', value: 87.2 },
  { week: 'W4', value: 96.1 },
]

export const WEEKLY_DOM_AFTERNOON = [
  { week: 'W1', value: 57.4 },
  { week: 'W2', value: 61.8 },
  { week: 'W3', value: 54.9 },
  { week: 'W4', value: 63.2 },
]

export const SUMMARY_STATS = {
  b3In: { total: 11019.7, change: 8.3, entries: 24 },
  b3Out: { total: 9291.7, change: -3.2, entries: 24 },
  domMorning: { total: 3863.2, change: 12.7, entries: 30 },
  domAfternoon: { total: 2431.4, change: 5.9, entries: 30 },
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'alert',
    title: 'Batas Simpan Terlampaui',
    message: 'Limbah B105d (Minyak Pelumas Bekas) telah melampaui batas penyimpanan 90 hari.',
    timestamp: '2024-12-15T08:23:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'b3in',
    title: 'B3 Masuk Baru',
    message: 'Entri baru: 124.5 kg Aki/Baterai Bekas (A102d) dari Workshop. MNF-2024-01047.',
    timestamp: '2024-12-14T14:11:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'alert',
    title: 'Mendekati Batas Simpan',
    message: 'Limbah A102d (Aki/Baterai Bekas) mendekati batas penyimpanan — 7 hari tersisa.',
    timestamp: '2024-12-14T09:45:00',
    read: false,
  },
  {
    id: 'n4',
    type: 'b3out',
    title: 'B3 Keluar Dikonfirmasi',
    message: '856.2 kg diangkut ke PPLI Cileungsi. Manifest MNF-2024-01039 telah disetujui.',
    timestamp: '2024-12-13T16:30:00',
    read: true,
  },
  {
    id: 'n5',
    type: 'domestic',
    title: 'Laporan Domestik Pagi',
    message: 'Entri sesi pagi selesai: 89.3 kg total (56.7 kg organik, 32.6 kg anorganik).',
    timestamp: '2024-12-13T11:00:00',
    read: true,
  },
]

export const STORAGE_ALERTS = B3_TRANSACTIONS.filter(
  (t) => t.category === 'b3in' && t.storageDeadlineDays !== undefined
).map((t) => ({
  ...t,
  urgency:
    (t.storageDeadlineDays ?? 0) < 0
      ? 'exceeded'
      : (t.storageDeadlineDays ?? 0) <= 14
        ? 'warning'
        : 'ok',
})).filter((t) => t.urgency !== 'ok').slice(0, 6)
