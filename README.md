# Wealth Forecast - Stock Portfolio Tracker

A beautiful, modern stock portfolio tracker with AI-powered forecasting. Track your investments, visualize historical performance, and see projected wealth growth over the next 5 years.

![Wealth Forecast Screenshot](screenshot.png)

## Features

- 📈 **10 Years of Historical Data** - Fetch and visualize stock performance from the past decade
- 🔮 **5-Year Forecasting** - AI-powered predictions using multiple algorithms (CAGR, linear regression, momentum)
- 💰 **Portfolio Tracking** - Add multiple stocks with investment amounts and track total portfolio value
- 📊 **Beautiful Charts** - Interactive charts showing historical performance and future projections
- 💵 **Monthly Contributions** - Factor in recurring investments to see compound growth
- 💾 **Local Storage** - All data persists locally in your browser
- 🎨 **Modern UI** - Glass-morphism design with smooth animations

## Getting Started

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

## Usage

1. **Add a Stock** - Click "Add Your First Stock" or the "Add Stock" button
2. **Search** - Type a stock symbol (e.g., AAPL, MSFT, GOOGL) or company name
3. **Enter Investment** - Specify how much you've invested and the purchase price
4. **View Forecasts** - See historical performance and 5-year projections
5. **Configure Settings** - Set monthly contributions and forecast period

## How Forecasting Works

The app uses a combination of forecasting methods:

- **CAGR (Compound Annual Growth Rate)** - Projects future value based on historical compound growth
- **Linear Regression** - Identifies and extrapolates the trend line
- **Momentum Analysis** - Weights recent performance for short-term accuracy

These methods are combined with weighted averaging to produce balanced forecasts. Confidence intervals widen over time to reflect increasing uncertainty.

⚠️ **Disclaimer**: Forecasts are estimates based on historical performance. Past performance does not guarantee future results. This tool is for educational and planning purposes only, not financial advice.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS 4** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Yahoo Finance API** - Stock data

## Data Storage

All portfolio data is stored locally in your browser using localStorage. No data is sent to any server (except Yahoo Finance API calls for stock data).

## Future Improvements

- [ ] Database integration (Supabase/Firebase)
- [ ] User authentication
- [ ] Multiple portfolios
- [ ] Dividend tracking
- [ ] More advanced forecasting models
- [ ] Export/import portfolio data
- [ ] Mobile app version

## License

MIT License - feel free to use and modify as needed.
