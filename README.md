# WHEALTH - Your Financial Health Companion

> **W**ealth + **Health** = **WHEALTH**

A beautiful, modern stock portfolio tracker that treats your financial wellness like health. Track your investments, visualize historical performance, get quarterly earnings reports, and see projected wealth growth over the next 5 years.

![WHEALTH Screenshot](screenshot.png)

## ✨ Features

### Portfolio Tracking
- 📈 **10 Years of Historical Data** - Fetch and visualize stock performance from the past decade
- 💰 **Complete Portfolio View** - Track multiple stocks, ETFs, and mutual funds
- 💵 **Per-Stock Contributions** - Set monthly contributions for each holding
- 🌍 **Multi-Currency Support** - Automatic currency conversion for international stocks
- ⚖️ **Portfolio Weights** - See each stock's weight in your total portfolio

### Forecasting & Analysis
- 🔮 **5-Year Projections** - Multiple growth scenarios (6M, 1Y, 5Y, 10Y trends)
- 📊 **Weighted Median Growth** - Outlier-filtered, realistic projections
- 📉 **Performance Metrics** - CAGR, volatility, annual returns

### Financial Data
- 📋 **Quarterly Earnings** - EPS actuals vs estimates, beat/miss history
- 💹 **Financial Metrics** - Revenue, margins, P/E, ROE, and more
- 📰 **Stock News** - Latest news for your portfolio stocks

### User Experience
- 🎨 **Modern Glass UI** - Beautiful glass-morphism design
- 💾 **Local Storage** - Your data stays in your browser
- ✏️ **Easy Editing** - Update holdings anytime

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd stock-wealth-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## 📖 Usage

1. **Add a Stock** - Click "Add Your First Stock" or the "Add Stock" button
2. **Search** - Type a stock symbol (e.g., AAPL, MSFT) or ETF (e.g., VOO, VTI)
3. **Enter Investment** - Specify shares, average price, and monthly contribution
4. **View Performance** - See historical charts and growth projections
5. **Check Financials** - View quarterly earnings and key financial metrics

## 📊 How Forecasting Works

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

⚠️ **Disclaimer**: Forecasts are estimates based on historical performance. Past performance does not guarantee future results. This tool is for educational and planning purposes only, not financial advice.

## 🛠 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS 4** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Yahoo Finance API** - Stock data & financials

## 🔒 Privacy

All portfolio data is stored locally in your browser using localStorage. No data is sent to any server (except Yahoo Finance API calls for stock data).

## 🗺 Roadmap

- [ ] Database integration (Supabase/Firebase)
- [ ] User authentication
- [ ] Multiple portfolios
- [ ] Dividend tracking
- [ ] More advanced forecasting models (ML)
- [ ] Export/import portfolio data
- [ ] Mobile app version
- [ ] Alerts & notifications

## 📄 License

MIT License - feel free to use and modify as needed.

---

<p align="center">
  <strong>WHEALTH</strong> - Because your financial health matters 💚
</p>
