import { useTheme } from '../../contexts/ThemeContext';
import { SalesTrend } from '../../lib/dataTransformer';

interface SalesTrendChartProps {
  data: SalesTrend[];
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        No trend data available
      </div>
    );
  }

  // Calculate scales
  let maxVal = Math.max(
    ...data.map(d => Math.max(Number(d.sales || 0), Number(d.spend || 0), Number(d.sales || 0) - Number(d.spend || 0)))
  );

  // Fallback if maxVal is 0 or invalid (prevents divide by zero)
  if (!maxVal || maxVal <= 0) maxVal = 1000;

  const maxClicks = Math.max(...data.map(d => Number(d.clicks || 0)));
  const clicksScale = maxVal > 0 && maxClicks > 0 ? maxVal / maxClicks : 1;

  // Dimensions
  const height = 300;
  const width = 800;
  const padding = 40;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  const getX = (index: number) => {
    if (data.length <= 1) return padding + chartWidth / 2; // Center if single point
    return padding + (index / (data.length - 1)) * chartWidth;
  };
  const getY = (value: number) => height - padding - (value / maxVal) * chartHeight;

  // Generate paths
  const createPath = (key: 'sales' | 'spend' | 'profit' | 'clicks' | 'budget', scaleMultiplier = 1) => {
    return data.map((d, i) => {
      let val = 0;
      if (key === 'profit') val = (Number(d.sales || 0) - Number(d.spend || 0));
      else val = Number(d[key as keyof SalesTrend] || 0);

      if (key === 'clicks') val = val * scaleMultiplier;

      // Clamp negative profit to 0 for chart y-axis bottom (or handle negative?)
      // For simplicity, let's clamp to bottom if negative, or shift axis. 
      // User image shows lines going up.
      return `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(val)}`;
    }).join(' ');
  };

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col font-sans">
      <div className="flex flex-wrap gap-4 mb-4 justify-center text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Profit</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Spend</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Success (Sales)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Clicks</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> Daily Budget</div>
      </div>

      <div className="relative flex-1 w-full h-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1={padding}
              y1={getY(maxVal * tick)}
              x2={width - padding}
              y2={getY(maxVal * tick)}
              stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
            />
          ))}

          {/* Paths */}
          {/* Clicks (Blue) - Scaled */}
          <path d={createPath('clicks', clicksScale)} fill="none" stroke="#3B82F6" strokeWidth="3" />

          {/* Spend (Red) */}
          <path d={createPath('spend')} fill="none" stroke="#EF4444" strokeWidth="3" />

          {/* Sales/Success (Yellow) */}
          <path d={createPath('sales')} fill="none" stroke="#EAB308" strokeWidth="3" />

          {/* Profit (Green) */}
          <path d={createPath('profit')} fill="none" stroke="#22C55E" strokeWidth="4" />

          {/* Budget (Purple) */}
          <path d={createPath('budget')} fill="none" stroke="#A855F7" strokeWidth="3" strokeDasharray="5,5" />
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-4 mt-2 text-xs text-gray-400">
          <span>{new Date(data[0].date).toLocaleDateString()}</span>
          <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
