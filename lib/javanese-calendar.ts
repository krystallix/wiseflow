/**
 * Javanese Calendar utilities
 * - Pasaran (5-day market cycle): Pon, Wage, Kliwon, Legi, Pahing
 * - Javanese months (Bulan Jawa) based on the Javanese calendar (Anno Javanico / AJ)
 * - Hijri / Islamic calendar conversion
 */

// ─── Pasaran Jawa (5-day cycle) ──────────────────────────────────────────────
// The 5 Javanese market days cycle:
// Reference: January 1, 1970 (Thursday) is Wage
// The cycle is: Legi(0), Pahing(1), Pon(2), Wage(3), Kliwon(4)

const PASARAN_NAMES = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const
export type PasaranName = (typeof PASARAN_NAMES)[number]

/**
 * Get the Pasaran (Javanese market day) for a given Gregorian date.
 * Reference epoch: Jan 1, 1970 = Wage (index 3)
 */
export function getPasaran(date: Date): PasaranName {
    // Use UTC-based day calculation to avoid timezone issues
    const refDate = new Date(Date.UTC(1970, 0, 1))
    const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const diffDays = Math.floor((targetDate.getTime() - refDate.getTime()) / 86400000)
    // Jan 1, 1970 is Wage (index 3)
    const index = (((diffDays + 3) % 5) + 5) % 5
    return PASARAN_NAMES[index]
}

// ─── Hijri / Islamic Calendar ────────────────────────────────────────────────
// Using the Tabular Islamic Calendar (arithmetic approximation)

const HIJRI_MONTH_NAMES = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', "Sya'ban",
    'Ramadan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah',
] as const
export type HijriMonthName = (typeof HIJRI_MONTH_NAMES)[number]

export interface HijriDate {
    year: number
    month: number // 1-12
    day: number
    monthName: HijriMonthName
}

/**
 * Convert a Gregorian date to Hijri (Islamic) date.
 * Uses the Tabular Islamic Calendar algorithm (civil/Thursday epoch).
 */
export function toHijri(date: Date): HijriDate {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()

    // Convert Gregorian to Julian Day Number (JDN)
    const a = Math.floor((14 - m) / 12)
    const yy = y + 4800 - a
    const mm = m + 12 * a - 3
    const jdn =
        d +
        Math.floor((153 * mm + 2) / 5) +
        365 * yy +
        Math.floor(yy / 4) -
        Math.floor(yy / 100) +
        Math.floor(yy / 400) -
        32045

    // Convert JDN to Hijri (Tabular Islamic Calendar, civil epoch)
    const l = jdn - 1948440 + 10632
    const n = Math.floor((l - 1) / 10631)
    const ll = l - 10631 * n + 354
    const j =
        Math.floor((10985 - ll) / 5316) *
        Math.floor((50 * ll) / 17719) +
        Math.floor(ll / 5670) *
        Math.floor((43 * ll) / 15238)
    const lll =
        ll -
        Math.floor((30 - j) / 15) *
        Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) *
        Math.floor((15238 * j) / 43) +
        29
    const hijriMonth = Math.floor((24 * lll) / 709)
    const hijriDay = lll - Math.floor((709 * hijriMonth) / 24)
    const hijriYear = 30 * n + j - 30

    return {
        year: hijriYear,
        month: hijriMonth,
        day: hijriDay,
        monthName: HIJRI_MONTH_NAMES[hijriMonth - 1],
    }
}

// ─── Javanese Months (Bulan Jawa) ────────────────────────────────────────────
// The Javanese calendar (Anno Javanico) is based on the Islamic Hijri calendar
// but with Javanese month names. It was adopted by Sultan Agung in 1633 CE.
// Year 1 AJ = 1 Muharram 1043 AH (July 8, 1633 CE).
// The months correspond to Islamic months with Javanese names.

const JAVANESE_MONTH_NAMES = [
    'Sura', 'Sapar', 'Mulud', 'Bakda Mulud',
    'Jumadilawal', 'Jumadilakhir', 'Rejeb', 'Ruwah',
    'Pasa', 'Sawal', 'Sela', 'Besar',
] as const
export type JavaneseMonthName = (typeof JAVANESE_MONTH_NAMES)[number]

// Javanese year cycle names (windu - 8-year cycle)
// Each year in the cycle has a specific name and determines leap year
const JAVANESE_YEAR_NAMES = [
    'Alip', 'Ehe', 'Jimawal', 'Je',
    'Dal', 'Be', 'Wawu', 'Jimakir',
] as const

// In the Javanese calendar's 8-year (windu) cycle,
// leap years (tahun wuntu) are: Ehe(2), Jimawal(3), Je(4), Dal(5), Be(6), Jimakir(8)
// Common years: Alip(1), Wawu(7)
const JAVANESE_LEAP_POSITIONS = [2, 3, 4, 5, 6, 8] // 1-indexed position in windu

export interface JavaneseDate {
    year: number // Anno Javanico
    month: number // 1-12
    day: number
    monthName: JavaneseMonthName
    yearName: string
    windu: number
}

/**
 * Convert a Hijri date to Javanese (Anno Javanico) date.
 * Since Sultan Agung synchronized the Javanese calendar with Hijri in 1555 AJ = 1043 AH,
 * the month and day are the same as Hijri.
 * The year differs: AJ = AH - 1043 + 1555 initially, but they diverge over centuries
 * because Javanese uses an 8-year (120-year) cycle while Hijri uses 30-year cycle.
 */
export function toJavanese(hijri: HijriDate): JavaneseDate {
    // More precise calculation:
    // Sultan Agung's epoch: 1 Sura 1555 AJ = 1 Muharram 1043 AH (July 8, 1633 CE)
    // Both calendars have the same month/day structure
    // AJ year = AH year - 1043 + 1555 = AH year + 512
    // But they diverge slightly due to different leap year cycles
    // For practical purposes in modern times, this offset works well

    const ajYear = hijri.year + 512
    const winduPosition = ((ajYear - 1) % 8) + 1 // 1-8

    return {
        year: ajYear,
        month: hijri.month,
        day: hijri.day,
        monthName: JAVANESE_MONTH_NAMES[hijri.month - 1],
        yearName: JAVANESE_YEAR_NAMES[winduPosition - 1],
        windu: Math.floor((ajYear - 1) / 8) + 1,
    }
}

// ─── Combined Info ───────────────────────────────────────────────────────────

export interface DayInfo {
    gregorian: Date
    pasaran: PasaranName
    hijri: HijriDate
    javanese: JavaneseDate
}

/**
 * Get all calendar information for a given Gregorian date.
 */
export function getDayInfo(date: Date): DayInfo {
    const hijri = toHijri(date)
    const javanese = toJavanese(hijri)
    return {
        gregorian: date,
        pasaran: getPasaran(date),
        hijri,
        javanese,
    }
}

/**
 * Get the calendar grid for a given month/year.
 * Returns an array of weeks, each week being an array of 7 DayInfo entries.
 * Weeks start on Monday (ISO).
 */
export function getMonthGrid(year: number, month: number): DayInfo[][] {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const totalDays = lastDay.getDate()

    // Day of week: 0=Sunday, 1=Monday, ... 6=Saturday
    // We want Monday as first day (index 0)
    let startDow = firstDay.getDay() // 0-6
    startDow = startDow === 0 ? 6 : startDow - 1 // Convert: Mon=0, Tue=1, ..., Sun=6

    const weeks: DayInfo[][] = []
    let currentWeek: DayInfo[] = []

    // Fill leading days from previous month
    for (let i = startDow; i > 0; i--) {
        currentWeek.push(getDayInfo(new Date(year, month, 1 - i)))
    }

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day)
        currentWeek.push(getDayInfo(date))

        if (currentWeek.length === 7) {
            weeks.push(currentWeek)
            currentWeek = []
        }
    }

    // Fill trailing days from next month
    if (currentWeek.length > 0) {
        let nextMonthDay = 1
        while (currentWeek.length < 7) {
            currentWeek.push(getDayInfo(new Date(year, month + 1, nextMonthDay++)))
        }
        weeks.push(currentWeek)
    }

    return weeks
}

// ─── Month/Year names ────────────────────────────────────────────────────────

const GREGORIAN_MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const

const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export { GREGORIAN_MONTH_NAMES_EN, DAY_NAMES_EN, HIJRI_MONTH_NAMES, JAVANESE_MONTH_NAMES, PASARAN_NAMES }
