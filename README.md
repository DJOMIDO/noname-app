# ✈️🚆 Travel Tracker App

A modern travel journaling web app for logging flights and train journeys.  
Built with **Vue 3**, **TypeScript**, **Shadcn-Vue**, **Neon** (Postgres, Auth and Data API), and **Leaflet** for real-time stats and visualizations.

## 📐 Project Development Requirements

All feature work must follow the project-level development requirements, including
`feat/*` branches, componentized implementation, shadcn-vue/Tailwind CSS usage,
and successful tests before merging into `master`.

See [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md).

## 🧭 Features

- ✨ User authentication (register/login)
- 🛫 Add flight journeys with detailed info (airline, date, seat, price, etc.)
- 🚆 Add train journeys with similar structure
- 🗺️ Interactive map to visualize flight routes
- 📊 Beautiful dashboard with summary statistics and charts
- 🔍 Browse past journeys (split into Flights and Trains tabs)
- 🧾 View and edit each journey’s details
- 📥 Import multiple flight or train journeys from CSV
- 🌗 Light/dark mode support
- 🛑 Custom 404 page

---

## 🛠️ Getting Started

### 🌐 Live Demo

You can try the app online here:  
👉 [https://nonameapp.netlify.app](https://nonameapp.netlify.app)

### 1. Clone the project

```bash
git clone https://github.com/DJOMIDO/noname-app
cd noname-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Setup Neon

- Create a Neon project
- In the Neon Console, enable **Auth** (Neon Auth) and the **Data API** for
  the project's database. The Data API must be enabled before applying the
  migration, because it creates the `authenticated` role used by the RLS
  policies. Enable it on the same branch and database you run the migration
  against.
- Apply the migration in
  [`neon/migrations/20261009000000_create_journey_tables.sql`](./neon/migrations/20261009000000_create_journey_tables.sql)
  in the Neon SQL Editor. It creates the `flights` and `trains` tables,
  indexes, grants, and per-user Row Level Security policies.
- Set up the Neon URL in your `.env` file:

```env
VITE_NEON_URL=https://ep-xxx.c-2.us-east-2.aws.neon.tech/neondb
VITE_SITE_URL=https://your-netlify-site.netlify.app
```

`VITE_NEON_URL` is the database base URL, without credentials or query
parameters. Take the **API URL** from **Postgres database → Data API**, remove
`.apirest` from the hostname and `/rest/v1` from the path, e.g.
`https://ep-xxx.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1` becomes
`https://ep-xxx.c-2.us-east-2.aws.neon.tech/neondb`. The SDK derives the Neon
Auth and Data API endpoints from it. Restart the Vite dev server after changing
`.env`; Vite does not reload environment files automatically.

`VITE_SITE_URL` is used as the email verification redirect URL. In Neon,
add your site's origin (e.g. `https://your-netlify-site.netlify.app`, no
trailing slash) under **Auth → Configuration → Domains**. Localhost on any port
is allowed by default.

### CSV journey import

After signing in, open **Add Flight** or **Add Train** from the home page.
The **Import CSV** and **Download template** actions are placed beside the
Basic/Detailed tabs. Download the matching template before importing so that
the column names match the existing `flights` or `trains` table fields exactly.

Required flight columns:

`airline_code`, `flight_number`, `departure_airport`, `arrival_airport`,
`departure_date`

Required train columns:

`train_company`, `train_number`, `departure_station`, `arrival_station`,
`departure_date`

Optional columns are included in each downloaded template. Dates must use
`YYYY-MM-DD`; times use `HH:mm` (or `HH:mm:ss`), and prices must be
non-negative numbers. Rows with validation errors are shown in the preview and
are skipped when valid rows are imported.

---

## 📸 Screenshots

### Authentication
- **Signup**
  ![Signup](./screenshots/signup.png)
- **Login**
  ![Login](./screenshots/login.png)

### Home
- **Light Mode**
  ![Home](./screenshots/home.png)
- **Dark Mode**
  ![Home Dark](./screenshots/home_dark.png)

### Add Flight / Train
- **Add Flight (Light)**
  ![Add Flight](./screenshots/add-flight.png)
- **Add Flight (Dark)**
  ![Add Flight Dark](./screenshots/add-flight_dark.png)
- **Add Train (Dark)**
  ![Add Train Dark](./screenshots/add-train_dark.png)

### View Journeys
- **Flights Tab**
  ![Journeys Flight](./screenshots/journeys_flight.png)
- **Trains Tab (Dark)**
  ![Journeys Train Dark](./screenshots/journeys_train_dark.png)

### Dashboard
- **Overview**
  ![Stats Overview](./screenshots/stats_overview.png)
- **Flight Stats (Dark)**
  ![Stats Flight Dark](./screenshots/stats_flight_dark.png)
- **Train Stats (Dark)**
  ![Stats Train Dark](./screenshots/stats_train.png)

### 404 Page
- ![Not Found](./screenshots/not_found.png)

---

## 📄 License

MIT