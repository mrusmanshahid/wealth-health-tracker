# WHEALTH - Your Financial Health Companion

> **W**ealth + **Health** = **WHEALTH**

A beautiful, modern stock portfolio tracker that treats your financial wellness like health. Track your investments, visualize historical performance, get quarterly earnings reports, and see projected wealth growth over the next 5 years.

![WHEALTH Screenshot](screenshot.png)

## Features

### Portfolio Tracking
- **10 Years of Historical Data** - Fetch and visualize stock performance from the past decade
- **Complete Portfolio View** - Track multiple stocks, ETFs, and mutual funds
- **Per-Stock Contributions** - Set monthly contributions for each holding
- **Multi-Currency Support** - Automatic currency conversion for international stocks
- **Portfolio Weights** - See each stock's weight in your total portfolio

### Forecasting & Analysis
- **5-Year Projections** - Multiple growth scenarios (6M, 1Y, 5Y, 10Y trends)
- **Weighted Median Growth** - Outlier-filtered, realistic projections
- **Performance Metrics** - CAGR, volatility, annual returns

### Financial Data
- **Quarterly Earnings** - EPS actuals vs estimates, beat/miss history
- **Financial Metrics** - Revenue, margins, P/E, ROE, and more
- **Stock News** - Latest news for your portfolio stocks

### User Experience
- **Modern Glass UI** - Beautiful glass-morphism design
- **Local Storage** - Your data stays in your browser
- **Easy Editing** - Update holdings anytime

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm

### Installation

```bash
# Navigate to project directory
cd wealth-health-tracker

# Frontend dependencies
npm install

# Backend dependencies (recommended: use a virtualenv)
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Development

Run the FastAPI backend and Vite frontend (two terminals, or use `dev:all`):

```bash
# Terminal 1 — API on http://localhost:8010
npm run api

# Terminal 2 — UI on http://localhost:5173 (proxies /api → FastAPI)
npm run dev
```

Or:

```bash
npm run dev:all
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the FastAPI server on port **8010** (avoids clashes with other local apps on 8000).

### Production (local)

```bash
npm run build
source .venv/bin/activate
npm start
```

Uvicorn serves the API and the built React app from `dist` at `http://localhost:8010`.

### Accounts & database

- **Sign in / Register** in the header saves portfolio, settings, watchlist, and cash to the database.
- Without login, data still uses browser `localStorage`.
- Locally, if `DATABASE_URL` is unset, the API uses **SQLite** (`./whealth.db`).
- For production, use free **[Neon](https://neon.tech)** Postgres and set `DATABASE_URL`.

```bash
cp .env.example .env
# edit DATABASE_URL + SECRET_KEY, then:
export $(grep -v '^#' .env | xargs)   # or use your shell’s env loader
npm run api
```

### Free hosting (Render + Neon)

1. Create a free Postgres DB at [neon.tech](https://neon.tech) → copy the connection string.
2. Push this repo to GitHub.
3. Sign up at [render.com](https://render.com) with GitHub.
4. **New → Web Service** → Docker → Free plan → health check `/api/health`.
5. Set env vars on Render:
   - `DATABASE_URL` = Neon connection string
   - `SECRET_KEY` = long random string
   - `CORS_ORIGINS=*`
6. Deploy and open `*.onrender.com` → Register → your portfolio syncs to the cloud.

**Notes**
- Render free web services sleep when idle (~30–60s cold start).
- Render’s own free Postgres is limited/trial; **Neon free** is the better long-term free DB.
- Yahoo Finance can rate-limit cloud IPs occasionally.

## Usage

1. **Add a Stock** - Click "Add Your First Stock" or the "Add Stock" button
2. **Search** - Type a stock symbol (e.g., AAPL, MSFT) or ETF (e.g., VOO, VTI)
3. **Enter Investment** - Specify shares, average price, and monthly contribution
4. **View Performance** - See historical charts and growth projections
5. **Check Financials** - View quarterly earnings and key financial metrics

## How Forecasting Works

WHEALTH uses sophisticated forecasting with multiple time horizons:

| Trend Line | Description |
|------------|-------------|
| **6M Trend** | Based on last 6 months of price movement |
| **1Y Trend** | Based on last 12 months of performance |
| **5Y Avg** | 5-year compound annual growth rate |
| **10Y Avg** | 10-year compound annual growth rate |

### Calculation Method
- Uses **weighted median returns** to filter outliers
- Monthly moves >±20% are filtered
- Annual growth capped between -15% and +35%
- Results in realistic, actionable projections

**Disclaimer**: Forecasts are estimates based on historical performance. Past performance does not guarantee future results. This tool is for educational and planning purposes only, not financial advice.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Frontend build tool
- **FastAPI** - Backend API (Yahoo Finance & currency proxy)
- **Uvicorn** - ASGI server
- **TailwindCSS 4** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Yahoo Finance API** - Stock data & financials (fetched server-side)

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/stocks/history/{symbol}` | Historical prices |
| `GET /api/stocks/quote/{symbol}` | Live quote |
| `GET /api/stocks/search?q=` | Symbol search |
| `GET /api/stocks/insights/{symbol}` | Insights / metrics |
| `GET /api/stocks/trending` | Trending stocks |
| `GET /api/stocks/movers` | Gainers & most active |
| `GET /api/stocks/sectors` | Sector leaders |
| `GET /api/stocks/undervalued` | Undervalued large caps |
| `GET /api/stocks/growth` | Growth stocks |
| `GET /api/stocks/recommendations/{symbol}` | Similar symbols |
| `GET /api/stocks/news?symbols=` | Multi-symbol news |
| `GET /api/stocks/news/{symbol}` | Single-symbol news |
| `GET /api/currency/rates` | FX rates (USD base helpers) |
| `GET /api/stocks/etfs/high-performing` | Top ETFs by 5Y/10Y returns |
| `GET /api/projector/profiles` | Wealth projector risk profiles |
| `POST /api/projector/project` | Project income/backtest for capital + profile |
| `GET /api/health` | Health check |

Interactive docs: `http://localhost:8010/docs`

## Privacy

Without an account, portfolio data stays in your browser (`localStorage`). With **Sign in**, portfolio / settings / watchlist / cash sync to your database account. Stock and currency quotes still go through the FastAPI backend (Yahoo Finance / FX APIs).

## Roadmap

- [ ] Database integration (Supabase/Firebase)
- [ ] User authentication
- [ ] Multiple portfolios
- [ ] Dividend tracking
- [ ] More advanced forecasting models (ML)
- [ ] Export/import portfolio data
- [ ] Mobile app version
- [ ] Alerts & notifications

## License

MIT License - feel free to use and modify as needed.

---

<p align="center">
  <strong>WHEALTH</strong> - Because your financial health matters
</p>
