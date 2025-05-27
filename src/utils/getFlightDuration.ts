// src/utils/getFlightDuration.ts
import { DateTime } from 'luxon'
import airports from '@/assets/data/airports.json'

function getZone(iata: string): string {
  return airports.find(a => a.iata === iata)?.timezone || 'UTC'
}

export function getFlightDuration(
  depIATA: string,
  depDate: string,
  depTime: string,
  arrIATA: string,
  arrDate: string,
  arrTime: string
): number | null {
  if (!depDate || !depTime || !arrDate || !arrTime) return null

  const from = DateTime.fromISO(`${depDate}T${depTime}`, { zone: getZone(depIATA) })
  const to = DateTime.fromISO(`${arrDate}T${arrTime}`, { zone: getZone(arrIATA) })

  if (!from.isValid || !to.isValid) return null

  return Math.round(to.diff(from, 'minutes').as('minutes'))
}
