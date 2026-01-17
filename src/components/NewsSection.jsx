import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchStockNews } from '../services/stockApi';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export default function NewsSection({ symbols }) {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadNews = async () => {
    if (symbols.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const articles = await fetchStockNews(symbols);
      setNews(articles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load news:', err);
      setError('Failed to load news');
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadNews();
    
    // Refresh news every 5 minutes
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  if (symbols.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber/20">
            <Newspaper className="w-5 h-5 text-amber-bright" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-pearl">Market News</h2>
            <p className="text-sm text-steel">
              Latest news for your portfolio stocks
              {lastUpdated && (
                <span className="ml-2">
                  • Updated {timeAgo(lastUpdated.getTime() / 1000)}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={loadNews}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-ruby/10 border border-ruby/30 mb-4">
          <AlertCircle className="w-5 h-5 text-ruby-bright" />
          <p className="text-ruby-bright">{error}</p>
        </div>
      )}

      {isLoading && news.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 rounded-xl bg-slate-dark/50 animate-pulse">
              <div className="h-4 bg-slate-light/30 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-light/20 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-light/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8">
          <Newspaper className="w-12 h-12 text-steel mx-auto mb-3" />
          <p className="text-silver">No recent news found for your stocks</p>
          <p className="text-sm text-steel mt-1">News will appear here when available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((article, index) => (
            <a
              key={`${article.uuid || index}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 rounded-xl bg-gradient-to-br from-slate-dark/50 to-obsidian/50 border border-slate-light/10 hover:border-amber/30 transition-all duration-300"
            >
              <div className="flex gap-4">
                {article.thumbnail?.resolutions?.[0]?.url && (
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-dark">
                    <img
                      src={article.thumbnail.resolutions[0].url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-pearl group-hover:text-amber-bright transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-steel">
                    {article.publisher && (
                      <span className="truncate">{article.publisher}</span>
                    )}
                    {article.providerPublishTime && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeAgo(article.providerPublishTime)}
                      </span>
                    )}
                  </div>
                  
                  {article.relatedSymbol && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-glow/10 text-emerald-bright">
                        <TrendingUp className="w-3 h-3" />
                        {article.relatedSymbol}
                      </span>
                    </div>
                  )}
                </div>
                
                <ExternalLink className="w-4 h-4 text-steel group-hover:text-amber-bright transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

