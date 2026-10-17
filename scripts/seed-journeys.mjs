// One-off seeder for journeys-list styling work. Connects DIRECTLY to Postgres
// as the table owner (neondb_owner), which bypasses RLS, so no JWT/role-token
// dance is needed. user_id is written explicitly.
//
//   node scripts/seed-journeys.mjs            -> insert marked test rows
//   node scripts/seed-journeys.mjs cleanup     -> delete all marked rows
//
// Requires in .env.local: DATABASE_URL (Neon connection string, pooled).
// Optional: SEED_USER_ID to force attribution instead of deriving it.
import { readFileSync } from 'node:fs'
import pg from 'pg'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const pick = (k) =>
  env
    .match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]
    ?.trim()
    ?.replace(/^['"]|['"]$/g, '')

const connectionString = pick('DATABASE_URL')
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env.local')
  process.exit(1)
}

const MARK = 'seed:journeys-list-style'

const flights = [
  { airline_code: 'CA', flight_number: '981', departure_airport: 'PEK', arrival_airport: 'LHR', departure_date: '2026-08-02', departure_time: '13:25', arrival_date: '2026-08-02', arrival_time: '18:40', seat_number: '12A', aircraft_type: 'B777-300ER', gate: 'E22', price: 742, currency: 'CNY', booking_ref: 'XK4M2P' },
  { airline_code: 'BA', flight_number: '38', departure_airport: 'LHR', arrival_airport: 'JFK', departure_date: '2026-08-04', departure_time: '11:15', arrival_date: '2026-08-04', arrival_time: '14:05', seat_number: '7C', aircraft_type: 'A380', gate: '432', price: 320, currency: 'GBP', booking_ref: 'BA7Q91' },
  { airline_code: 'DL', flight_number: '152', departure_airport: 'JFK', arrival_airport: 'LAX', departure_date: '2026-08-06', departure_time: '07:30', arrival_date: '2026-08-06', arrival_time: '10:55', seat_number: '21F', aircraft_type: 'A220-300', price: 189, currency: 'USD' },
  { airline_code: 'NH', flight_number: '95', departure_airport: 'LAX', arrival_airport: 'HND', departure_date: '2026-08-08', departure_time: '11:05', arrival_date: '2026-08-09', arrival_time: '15:50', seat_number: '34A', aircraft_type: 'B787-9', price: 615, currency: 'USD' },
  { airline_code: 'CX', flight_number: '503', departure_airport: 'HND', arrival_airport: 'HKG', departure_date: '2026-08-10', departure_time: '17:20', arrival_date: '2026-08-10', arrival_time: '21:35', seat_number: null, aircraft_type: 'A350-900', price: 430, currency: 'HKD' },
  { airline_code: 'SQ', flight_number: '351', departure_airport: 'HKG', arrival_airport: 'SIN', departure_date: '2026-08-12', departure_time: '09:10', arrival_date: '2026-08-12', arrival_time: '12:45', seat_number: '8D', aircraft_type: 'A350-900', price: 288, currency: 'SGD' },
  { airline_code: 'EK', flight_number: '354', departure_airport: 'SIN', arrival_airport: 'DXB', departure_date: '2026-08-14', departure_time: '21:50', arrival_date: '2026-08-15', arrival_time: '02:35', seat_number: '15E', aircraft_type: 'A380-800', price: 512, currency: 'USD' },
  { airline_code: 'AF', flight_number: '28', departure_airport: 'DXB', arrival_airport: 'CDG', departure_date: '2026-08-16', departure_time: '08:15', arrival_date: '2026-08-16', arrival_time: '13:30', seat_number: '3A', aircraft_type: 'B777-200LR', price: 640, currency: 'EUR' },
  { airline_code: 'LH', flight_number: '24', departure_airport: 'CDG', arrival_airport: 'FRA', departure_date: '2026-08-18', departure_time: '15:40', arrival_date: '2026-08-18', arrival_time: '17:05', seat_number: null, aircraft_type: null, price: null, currency: null },
  { airline_code: 'CA', flight_number: '932', departure_airport: 'FRA', arrival_airport: 'PVG', departure_date: '2026-08-20', departure_time: '22:30', arrival_date: '2026-08-21', arrival_time: '15:10', seat_number: '42K', aircraft_type: 'A350-900', price: 5280, currency: 'CNY' },
]
const trains = [
  { train_company: 'Eurostar', train_number: '9024', train_type: 'High-speed', departure_station: 'London St Pancras', arrival_station: 'Paris Gare du Nord', departure_date: '2026-07-03', departure_time: '07:31', arrival_date: '2026-07-03', arrival_time: '11:47', coach: '9', seat_number: '55A', price: 148, currency: 'GBP' },
  { train_company: 'TGV', train_number: '6632', train_type: 'High-speed', departure_station: 'Paris Gare de Lyon', arrival_station: 'Lyon Part-Dieu', departure_date: '2026-07-05', departure_time: '09:15', arrival_date: '2026-07-05', arrival_time: '11:22', coach: '14', seat_number: '78C', price: 59, currency: 'EUR' },
  { train_company: 'Frecciarossa', train_number: '9537', train_type: 'High-speed', departure_station: 'Milano Centrale', arrival_station: 'Roma Termini', departure_date: '2026-07-07', departure_time: '14:30', arrival_date: '2026-07-07', arrival_time: '17:05', coach: null, seat_number: '21B', price: 72, currency: 'EUR' },
  { train_company: 'DB', train_number: 'ICE 598', train_type: 'Intercity-Express', departure_station: 'München Hbf', arrival_station: 'Berlin Hbf', departure_date: '2026-07-09', departure_time: '08:44', arrival_date: '2026-07-09', arrival_time: '12:31', coach: '7', seat_number: '12F', price: 89, currency: 'EUR' },
  { train_company: 'SJ', train_number: '92', train_type: 'X2000', departure_station: 'Stockholm C', arrival_station: 'Göteborg C', departure_date: '2026-07-11', departure_time: '16:15', arrival_date: '2026-07-11', arrival_time: '19:40', coach: '3', seat_number: null, price: 420, currency: 'SEK' },
  { train_company: 'JR', train_number: 'Nozomi 217', train_type: 'Shinkansen', departure_station: 'Tokyo', arrival_station: 'Kyoto', departure_date: '2026-07-13', departure_time: '10:02', arrival_date: '2026-07-13', arrival_time: '12:28', coach: '8', seat_number: '10A', price: 13320, currency: 'JPY' },
  { train_company: '京沪高铁', train_number: 'G1', train_type: '复兴号', departure_station: '北京南', arrival_station: '上海虹桥', departure_date: '2026-07-15', departure_time: '07:00', arrival_date: '2026-07-15', arrival_time: '11:29', coach: '5', seat_number: '3F', price: 553, currency: 'CNY' },
  { train_company: 'Renfe', train_number: 'AVE 03106', train_type: 'High-speed', departure_station: 'Madrid Atocha', arrival_station: 'Barcelona Sants', departure_date: '2026-07-17', departure_time: '13:30', arrival_date: '2026-07-17', arrival_time: '16:45', coach: null, seat_number: null, price: null, currency: null },
]

const client = new pg.Client({ connectionString, ssl: true })

async function main() {
  await client.connect()
  try {
    if (process.argv[2] === 'cleanup') {
      for (const t of ['flights', 'trains']) {
        const r = await client.query(`delete from ${t} where notes = $1`, [MARK])
        console.log(`🧹 ${t}: ${r.rowCount} row(s) deleted`)
      }
      return
    }

    let userId = pick('SEED_USER_ID')
    if (!userId) {
      const { rows } = await client.query(
        `select user_id from flights where user_id is not null
         union select user_id from trains where user_id is not null limit 1`,
      )
      userId = rows[0]?.user_id
    }
    if (!userId) {
      console.error('Cannot determine user_id. Add one journey in-app first, or set SEED_USER_ID in .env.local.')
      process.exit(1)
    }
    console.log('Seeding for user', userId)

    for (const [table, rows] of [['flights', flights], ['trains', trains]]) {
      const cols = [...new Set(rows.flatMap(Object.keys))]
      const columns = ['user_id', 'notes', ...cols]
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(',')
      const sql = `insert into ${table} (${columns.join(',')}) values (${placeholders})`
      for (const row of rows) {
        const values = columns.map((c) => (c === 'user_id' ? userId : c === 'notes' ? MARK : row[c] ?? null))
        await client.query(sql, values)
      }
      console.log(`✅ ${table}: inserted ${rows.length}`)
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message ?? err)
  process.exit(1)
})
