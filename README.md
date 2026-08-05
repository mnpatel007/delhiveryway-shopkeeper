# DelhiveryWay Shop-Owner Portal

The web app shop owners / vendors use to manage their store on DelhiveryWay —
tracking sales, reviewing commission rates, and configuring how their shop
operates.

## ✨ Key Features

*   **📊 Dashboard**
    *   Overview of the shop's activity on the platform.

*   **📈 Sales Reports**
    *   Review sales performance for the shop over time.

*   **⚙️ Shop Settings**
    *   **Commission Settings** — view the commission rate applied to the
        shop's orders (see `backend`'s admin Commissions page for how this is
        calculated).
    *   **Timing Settings** — configure the shop's operating hours.

*   **🔐 Authentication & Onboarding**
    *   Login, signup, and email verification for vendor accounts.
    *   Consent page for platform terms during onboarding.

## 🛠️ Technology Stack

*   **Frontend Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vite.dev/) — faster dev server and builds
    than the CRA-based apps in this project.
*   **Routing**: [React Router v7](https://reactrouter.com/)
*   **State Management**: React Context API & Hooks
*   **HTTP Client**: [Axios](https://axios-http.com/)
*   **Real-time**: Socket.io client for live updates
*   **Auth**: `jwt-decode` for reading the session token client-side

## 📂 Project Structure

```
delhiveryway-shopkeeper/
├── .env.development            # Committed, non-secret dev config (see backend README)
├── env.example                 # Template for a real .env (production)
├── package.json
├── vite.config.js              # Dev server runs on port 3003 (see backend README)
├── vercel.json                 # Deployment config
├── index.html                  # Vite entry HTML (not under public/)
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.jsx / App.css       # Root component and route definitions
    ├── main.jsx / index.css    # App entry point and global styles
    ├── assets/                  # Static assets used within components
    ├── components/
    │   └── Layout.jsx            # Shared page layout/shell
    ├── context/
    │   └── AuthContext.jsx       # Authentication state
    ├── services/
    │   └── api.js                # Axios instance and API endpoint calls
    └── pages/
        ├── auth/                  # LoginPage, SignupPage, VerifyEmailPage
        ├── consent/                # ConsentPage — onboarding terms
        ├── dashboard/              # Dashboard
        ├── reports/                # SalesReport
        └── settings/               # CommissionSettings, TimingSettings
```

For the complete local development setup — installing WSL, Docker, Node, cloning
all five DelhiveryWay repos, seeding the database, and running everything
together — see the
[`backend` repo's README](https://github.com/mnpatel007/delhiveryway-backend#readme).
That's the single source of truth for setup; once it's done, come back here and
run `npm run dev` in this repo (`http://localhost:3003`).
