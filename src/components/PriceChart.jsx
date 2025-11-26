import React, { useEffect, useRef, useState } from 'react';

export default function PriceChart({ series = [] }) {
  const containerRef = useRef();
  const chartRef = useRef(null);
  const [useFallback, setUseFallback] = useState(false);
  const [libErrorMsg, setLibErrorMsg] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let mounted = true;
    import('lightweight-charts')
      .then(({ createChart }) => {
        if (!mounted || !containerRef.current) return;
        const chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 300,
          layout: {
            background: { type: 'solid', color: '#000000' },
            textColor: '#787b86'
          },
          grid: {
            vertLines: { color: '#1e222d', style: 0 },
            horzLines: { color: '#1e222d', style: 0 }
          },
          crosshair: {
            mode: 1,
            vertLine: {
              width: 1,
              color: '#787b86',
              style: 3,
              labelBackgroundColor: '#363a45'
            },
            horzLine: {
              width: 1,
              color: '#787b86',
              style: 3,
              labelBackgroundColor: '#363a45'
            }
          },
          rightPriceScale: {
            visible: true,
            borderColor: '#2b2b43',
            textColor: '#787b86',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1
            }
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: '#2b2b43',
            textColor: '#787b86'
          }
        });

        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#089981',
          downColor: '#f23645',
          borderUpColor: '#089981',
          borderDownColor: '#f23645',
          wickUpColor: '#089981',
          wickDownColor: '#f23645',
          priceLineVisible: false,
          borderVisible: false
        });

        const setData = (s) => {
          const data = s
            .filter(p => p.open != null && p.high != null && p.low != null && p.close != null)
            .map(p => ({
              time: Math.floor(new Date(p.time).getTime() / 1000),
              open: Number(p.open),
              high: Number(p.high),
              low: Number(p.low),
              close: Number(p.close)
            }));
          candlestickSeries.setData(data);
        };

        setData(series);

        const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth });
        window.addEventListener('resize', handleResize);

        chartRef.current = { chart, candlestickSeries, setData, handleResize };
      })
      .catch(err => {
        console.warn('lightweight-charts import failed (fallback enabled):', err);
        if (mounted) {
          setUseFallback(true);
          setLibErrorMsg(String(err && err.message ? err.message : err));
        }
      });

    return () => {
      mounted = false;
      if (chartRef.current) {
        window.removeEventListener('resize', chartRef.current.handleResize);
        try { chartRef.current.chart.remove(); } catch (_) {}
        chartRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (chartRef.current && chartRef.current.setData) {
      chartRef.current.setData(series);
      return;
    }
  }, [series]);

  if (!useFallback) {
    return (
      <div style={{ width: '100%', height: 300, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: 300 }} />
      </div>
    );
  }

  const points = series.filter(p => p.close != null);
  if (points.length === 0) {
    return (
      <div style={{ padding: 18, borderRadius: 8, background: '#000000', color: '#787b86', border: '1px solid #1e222d' }}>
        No data available
        {libErrorMsg ? <div style={{fontSize:12, marginTop:6, color:'#f23645'}}>Error: {libErrorMsg}</div> : null}
      </div>
    );
  }

  const w = containerRef.current ? containerRef.current.clientWidth : 760;
  const h = 300;
  const padding = { left: 60, right: 10, top: 15, bottom: 30 };
  const innerW = Math.max(10, w - padding.left - padding.right);
  const innerH = Math.max(10, h - padding.top - padding.bottom);

  const sorted = [...points].sort((a,b) => new Date(a.time) - new Date(b.time));
  const allPrices = sorted.flatMap(p => [p.open, p.high, p.low, p.close]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || maxP || 1;

  const candleSpacing = innerW / sorted.length;
  const candleWidth = Math.max(3, Math.min(16, candleSpacing * 0.85));
  const wickWidth = Math.max(1, candleWidth * 0.12);

  function priceToY(price) {
    const ratio = (Number(price) - minP) / range;
    return padding.top + (1 - ratio) * innerH;
  }

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const idx = Math.floor((mx - padding.left) / candleSpacing);
    if (idx >= 0 && idx < sorted.length) {
      setHover({ idx, item: sorted[idx], x: padding.left + (idx + 0.5) * candleSpacing });
    }
  }
  
  function handleMouseLeave() { setHover(null); }

  const ticks = 5;
  const tickVals = Array.from({length: ticks+1}, (_,i) => minP + (i/ticks)*range).reverse();

  return (
    <div ref={containerRef} style={{ width: '100%', height: h, position: 'relative', background: '#000000', border: '1px solid #2b2b43' }}>
      <svg width={w} height={h} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{display:'block'}}>
        <rect width={w} height={h} fill="#000000"/>
        
        <g>
          {tickVals.map((v,i) => {
            const ty = padding.top + (i / ticks) * innerH;
            return (
              <g key={i}>
                <line x1={padding.left} x2={w - padding.right} y1={ty} y2={ty} stroke="#1e222d" strokeWidth={1} />
                <text x={padding.left - 8} y={ty+4} fontSize={11} fill="#787b86" textAnchor="end" fontFamily="Arial, sans-serif">{Number(v).toFixed(6)}</text>
              </g>
            );
          })}
        </g>

        {Array.from({length: Math.floor(sorted.length / 10)}).map((_, i) => {
          const x = padding.left + (i * 10 + 5) * candleSpacing;
          return (
            <line key={i} x1={x} x2={x} y1={padding.top} y2={h - padding.bottom} stroke="#1e222d" strokeWidth={1} />
          );
        })}

        {sorted.map((candle, i) => {
          const x = padding.left + (i + 0.5) * candleSpacing;
          const yOpen = priceToY(candle.open);
          const yClose = priceToY(candle.close);
          const yHigh = priceToY(candle.high);
          const yLow = priceToY(candle.low);
          
          const isUp = candle.close >= candle.open;
          const color = isUp ? '#089981' : '#f23645';
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

          const isHovered = hover?.idx === i;

          return (
            <g key={i} opacity={isHovered ? 1 : 0.95}>
              <line 
                x1={x} 
                x2={x} 
                y1={yHigh} 
                y2={yLow} 
                stroke={color} 
                strokeWidth={wickWidth}
              />
              <rect 
                x={x - candleWidth / 2} 
                y={bodyTop} 
                width={candleWidth} 
                height={bodyHeight} 
                fill={color}
              />
            </g>
          );
        })}

        {hover && (
          <line 
            x1={hover.x} 
            x2={hover.x}
            y1={padding.top} 
            y2={h - padding.bottom} 
            stroke="#787b86" 
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        )}
      </svg>

      {hover && (
        <div style={{
          position:'absolute', 
          left: hover.x < w / 2 ? hover.x + 15 : hover.x - 195, 
          top: 20,
          background: '#1e222d', 
          color:'#d1d4dc', 
          padding:'8px 10px', 
          borderRadius:4, 
          fontSize:12, 
          pointerEvents:'none', 
          boxShadow:'0 2px 8px rgba(0,0,0,0.8)',
          fontFamily: 'Arial, sans-serif',
          minWidth: 150
        }}>
          <div style={{fontSize:10, color:'#787b86', marginBottom:6}}>
            {new Date(hover.item.time).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:2, fontSize:11}}>
            <span style={{color:'#787b86', marginRight:10}}>O</span>
            <span style={{fontWeight:500}}>{hover.item.open}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:2, fontSize:11}}>
            <span style={{color:'#787b86', marginRight:10}}>H</span>
            <span style={{fontWeight:500}}>{hover.item.high}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:2, fontSize:11}}>
            <span style={{color:'#787b86', marginRight:10}}>L</span>
            <span style={{fontWeight:500}}>{hover.item.low}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11}}>
            <span style={{color:'#787b86', marginRight:10}}>C</span>
            <span style={{fontWeight:500}}>{hover.item.close}</span>
          </div>
          <div style={{fontSize:11, textAlign:'right'}}>
            <span style={{
              fontWeight:600, 
              color: hover.item.close >= hover.item.open ? '#089981' : '#f23645'
            }}>
              {hover.item.close >= hover.item.open ? '+' : ''}
              {((hover.item.close - hover.item.open) / hover.item.open * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
