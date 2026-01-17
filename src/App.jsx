import { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Loader2 } from 'lucide-react';

import Header from './components/Header';
import StatsCards from './components/StatsCards';
import StockCard from './components/StockCard';
import WealthChart from './components/WealthChart';
import NewsSection from './components/NewsSection';
import AddStockModal from './components/AddStockModal';
import EditStockModal from './components/EditStockModal';
import SettingsPanel from './components/SettingsPanel';
import StockDetailModal from './components/StockDetailModal';
import EmptyState from './components/EmptyState';

import { fetchStockHistory } from './services/stockApi';
import { savePortfolio, loadPortfolio, saveSettings, loadSettings } from './services/storage';
import { generateForecast, calculateWealthGrowth, calculatePortfolioMetrics } from './utils/forecasting';
import { generateDemoPortfolio } from './utils/demoData';

function App() {
  const [stocks, setStocks] = useState([]);
  const [settings, setSettings] = useState({ forecastYears: 5 });
  const [wealthData, setWealthData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    projectedValue5Y: 0,
    projectedReturn5Y: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [error, setError] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const savedPortfolio = loadPortfolio();
        const savedSettings = loadSettings();
        setSettings(savedSettings);

        if (savedPortfolio.length > 0) {
          await refreshStockData(savedPortfolio);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load portfolio data');
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Calculate total monthly contribution from individual stocks
  const totalMonthlyContribution = stocks.reduce((sum, stock) => sum + (stock.monthlyContribution || 0), 0);

  // Recalculate wealth when stocks or settings change
  useEffect(() => {
    if (stocks.length > 0) {
      const totalContribution = stocks.reduce((sum, stock) => sum + (stock.monthlyContribution || 0), 0);
      const wealth = calculateWealthGrowth(stocks, totalContribution, settings.forecastYears);
      setWealthData(wealth);
      
      const portfolioMetrics = calculatePortfolioMetrics(stocks);
      setMetrics(portfolioMetrics);
    } else {
      setWealthData([]);
      setMetrics({
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        projectedValue5Y: 0,
        projectedReturn5Y: 0,
      });
    }
  }, [stocks, settings]);

  const refreshStockData = async (portfolioStocks) => {
    const updatedStocks = await Promise.all(
      portfolioStocks.map(async (stock) => {
        try {
          const data = await fetchStockHistory(stock.symbol, 10);
          const { forecast, confidence } = generateForecast(data.history, 60);
          
          return {
            ...stock,
            name: data.name || stock.name,
            currentPrice: data.currentPrice,
            history: data.history,
            forecast,
            confidence,
          };
        } catch (err) {
          console.error(`Failed to fetch ${stock.symbol}:`, err);
          return {
            ...stock,
            error: true,
          };
        }
      })
    );

    setStocks(updatedStocks);
    return updatedStocks;
  };

  const handleRefresh = async () => {
    if (stocks.length === 0) return;
    
    setIsRefreshing(true);
    setError(null);
    try {
      await refreshStockData(stocks);
    } catch (err) {
      setError('Failed to refresh data');
    }
    setIsRefreshing(false);
  };

  const handleAddStock = async (newStock) => {
    setIsRefreshing(true);
    try {
      const data = await fetchStockHistory(newStock.symbol, 10);
      const { forecast, confidence } = generateForecast(data.history, 60);
      
      const stockWithData = {
        ...newStock,
        name: data.name || newStock.name,
        currentPrice: data.currentPrice,
        history: data.history,
        forecast,
        confidence,
      };

      const updatedStocks = [...stocks, stockWithData];
      setStocks(updatedStocks);
      savePortfolio(updatedStocks);
    } catch (err) {
      console.error('Failed to add stock:', err);
      setError(`Failed to add ${newStock.symbol}. Please check the symbol and try again.`);
    }
    setIsRefreshing(false);
  };

  const handleRemoveStock = (symbol) => {
    const updatedStocks = stocks.filter(s => s.symbol !== symbol);
    setStocks(updatedStocks);
    savePortfolio(updatedStocks);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleViewChart = (stock) => {
    setSelectedStock(stock);
  };

  const handleLoadDemo = () => {
    setIsRefreshing(true);
    try {
      const demoPortfolio = generateDemoPortfolio();
      const stocksWithForecast = demoPortfolio.map(stock => {
        const { forecast, confidence } = generateForecast(stock.history, 60);
        return {
          ...stock,
          forecast,
          confidence,
          addedAt: new Date().toISOString(),
        };
      });
      
      setStocks(stocksWithForecast);
      savePortfolio(stocksWithForecast);
    } catch (err) {
      console.error('Failed to load demo:', err);
      setError('Failed to load demo data');
    }
    setIsRefreshing(false);
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
  };

  const handleSaveEdit = (updatedStock) => {
    const updatedStocks = stocks.map(s => 
      s.symbol === updatedStock.symbol 
        ? { ...s, ...updatedStock }
        : s
    );
    setStocks(updatedStocks);
    savePortfolio(updatedStocks);
    setEditingStock(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-bright animate-spin mx-auto mb-4" />
          <p className="text-silver">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-glow/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sapphire/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-violet/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <Header onRefresh={handleRefresh} isLoading={isRefreshing} />

        {error && (
          <div className="mb-6 p-4 glass-card border-ruby/30 bg-ruby/10">
            <p className="text-ruby-bright">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-sm text-steel hover:text-pearl mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {stocks.length === 0 ? (
          <EmptyState 
            onAddStock={() => setShowAddModal(true)} 
            onLoadDemo={handleLoadDemo}
          />
        ) : (
          <>
            {/* Stats Overview */}
            <StatsCards metrics={metrics} />

            {/* Main Wealth Chart */}
            <div className="mb-8">
              <WealthChart 
                wealthData={wealthData} 
                monthlyContribution={totalMonthlyContribution}
              />
            </div>

            {/* Stocks Grid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-pearl">Your Holdings</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Stock
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stocks.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    onRemove={handleRemoveStock}
                    onViewChart={handleViewChart}
                    onEdit={handleEditStock}
                  />
                ))}
              </div>
            </div>

            {/* News Section */}
            <NewsSection symbols={stocks.map(s => s.symbol)} />
          </>
        )}

        {/* Modals */}
        <AddStockModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddStock}
        />

        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={handleSaveSettings}
          totalMonthlyContribution={totalMonthlyContribution}
        />

        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />

        <EditStockModal
          stock={editingStock}
          onClose={() => setEditingStock(null)}
          onSave={handleSaveEdit}
        />

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-steel">
          <p>
            Stock data provided by Yahoo Finance • Forecasts are estimates based on historical performance
          </p>
          <p className="mt-1">
            Past performance does not guarantee future results
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
