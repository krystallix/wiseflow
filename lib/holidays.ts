'use server'

import * as cheerio from 'cheerio'

const MONTH_NAME: Record<string, string> = {
    'januari': '01',
    'februari': '02',
    'maret': '03',
    'april': '04',
    'mei': '05',
    'juni': '06',
    'juli': '07',
    'agustus': '08',
    'september': '09',
    'oktober': '10',
    'november': '11',
    'desember': '12',
}

export interface Holiday {
    date: string // YYYY-MM-DD
    name: string
}

export async function getHolidays(year: number): Promise<Holiday[]> {
    try {
        const response = await fetch(`https://www.tanggalan.com/${year}`, { next: { revalidate: 86400 } })
        if (!response.ok) {
            throw new Error('Failed to fetch tanggalan')
        }

        const html = await response.text()
        const $ = cheerio.load(html)
        const holidays: Holiday[] = []

        $('#main article ul').each((_, ul) => {
            const href = $(ul).find('li:first-child a').attr('href') || ''
            const [monthName, yearStr] = href.split('-')

            if (!monthName || !yearStr) return

            const month = MONTH_NAME[monthName]
            if (!month) return

            $(ul).find('li:last-child table tr').each((_, tr) => {
                const day = $(tr).find('td:first-child').text().trim()
                const name = $(tr).find('td:last-child').text().trim()

                if (!day || !name) return

                if (day.includes('-')) {
                    const [startStr, endStr] = day.split('-')
                    const start = Number(startStr)
                    const end = Number(endStr)

                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = start; i <= end; i++) {
                            holidays.push({
                                date: `${yearStr}-${month}-${i.toString().padStart(2, '0')}`,
                                name
                            })
                        }
                    }
                } else {
                    holidays.push({
                        date: `${yearStr}-${month}-${day.padStart(2, '0')}`,
                        name
                    })
                }
            })
        })

        return holidays
    } catch (error) {
        console.error("Failed to fetch holidays:", error)
        return []
    }
}
