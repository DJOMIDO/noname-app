# ✈️🚆 Travel Tracker App

A modern travel journaling web app for logging flights and train journeys.  
Built with **Vue 3**, **TypeScript**, **Shadcn-Vue**, **Supabase**, and **Leaflet** for real-time stats and visualizations.

## 🧭 Features

- ✨ User authentication (register/login)
- 🛫 Add flight journeys with detailed info (airline, date, seat, price, etc.)
- 🚆 Add train journeys with similar structure
- 🗺️ Interactive map to visualize flight routes
- 📊 Beautiful dashboard with summary statistics and charts
- 🔍 Browse past journeys (split into Flights and Trains tabs)
- 🧾 View and edit each journey’s details
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

### 4. Setup Supabase

- Create a Supabase project
- Add tables: `flights`, `trains`, `users` as required
- Set up Supabase URL and anon key in your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=https://your-netlify-site.netlify.app
```

`VITE_SITE_URL` is used as the email confirmation redirect URL. In Supabase,
add the same URL to **Authentication → URL Configuration → Redirect URLs**
(and set it as the Site URL if desired). For local development, you can use
`http://localhost:3000`.

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