import React, { useEffect, useRef, useState } from 'react';

/**
 * PriceChart:
 *  - props: series = [{ t: ISOstring, price: number }]
 *  - tenta importar 'lightweight-charts' dinamicamente;
 *  - se falhar, renderiza um fallback SVG (linha + área) com tooltip básico.
 */
export default function PriceChart({ series = [] }) {
  const containerRef = useRef();
  const chartRef = useRef(null);
  const [useFallback, setUseFallback] = useState(false);
  const [libErrorMsg, setLibErrorMsg] = useState(null);
  const [hover, setHover] = useState(null);

  // Try dynamic import once
  useEffect(() => {
    let mounted = true;
    import('lightweight-charts')
      .then(({ createChart }) => {
        if (!mounted || !containerRef.current) return;
        // create chart
        const chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 260,
          layout: {
            background: { type: 'solid', color: '#071029' },
            textColor: '#d1e6ff'
          },
          grid: {
            vertLines: { color: 'rgba(255,255,255,0.03)' },
            horzLines: { color: 'rgba(255,255,255,0.03)' }
          },
          crosshair: { mode: 1 },
          rightPriceScale: { visible: true },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: 'rgba(255,255,255,0.04)'
          }
        });

        const line = chart.addLineSeries({ color: '#26a69a', lineWidth: 2 });

        const setData = (s) => {
          const data = s
            .filter(p => p.price != null)
            .map(p => ({ time: Math.floor(new Date(p.t).getTime() / 1000), value: Number(p.price) }));
          line.setData(data);
        };

        setData(series);

        const handleResize = () => chart.applyOptions({ width: containerRef.current.clientWidth });
        window.addEventListener('resize', handleResize);

        chartRef.current = { chart, line, setData, handleResize };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  // update chart or fallback when series changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.setData) {
      chartRef.current.setData(series);
      return;
    }
    // otherwise, fallback state remains and SVG will re-render via props
  }, [series]);

  if (!useFallback) {
    // container for lightweight-charts (or pending)
    return (
      <div style={{ width: '100%', height: 260, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: 260 }} />
        {/* If the lib failed silently, message will be shown by fallback after import rejection */}
      </div>
    );
  }

  // ---------- SVG fallback chart ----------
  const points = series.filter(p => p.price != null);
  if (points.length === 0) {
    return (
      <div style={{ padding: 18, borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: '#cfe6ff' }}>
        Sem dados para mostrar.
        {libErrorMsg ? <div style={{fontSize:12, marginTop:6, color:'#fca5a5'}}>lightweight-charts erro: {libErrorMsg}</div> : null}
      </div>
    );
  }

  // prepare data for SVG
  const w = containerRef.current ? containerRef.current.clientWidth : 760;
  const h = 260;
  const padding = { left: 36, right: 10, top: 12, bottom: 24 };
  const innerW = Math.max(10, w - padding.left - padding.right);
  const innerH = Math.max(10, h - padding.top - padding.bottom);

  // map times sorted ascending
  const sorted = [...points].sort((a,b) => new Date(a.t) - new Date(b.t));
  const prices = sorted.map(p => Number(p.price));
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || maxP || 1;

  const xs = sorted.map((p, i) => {
    const ratio = sorted.length === 1 ? 0.5 : i / (sorted.length - 1);
    return padding.left + ratio * innerW;
  });
  const ys = sorted.map((p) => {
    const ratio = (Number(p.price) - minP) / range;
    return padding.top + (1 - ratio) * innerH;
  });

  // build path
  const pathD = xs.map((x, i) => `${i===0 ? 'M' : 'L'} ${x.toFixed(2)} ${ys[i].toFixed(2)}`).join(' ');
  const areaD = `${pathD} L ${xs[xs.length-1].toFixed(2)} ${ (padding.top + innerH).toFixed(2) } L ${xs[0].toFixed(2)} ${(padding.top + innerH).toFixed(2)} Z`;

  // axis labels (left)
  const ticks = 4;
  const tickVals = Array.from({length: ticks+1}, (_,i) => minP + (i/ticks)*range).reverse();

  // tooltip handling: basic nearest point
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    // find nearest x index
    let nearest = 0;
    let bestDist = Infinity;
    xs.forEach((x,i) => {
      const d = Math.abs(x - mx);
      if (d < bestDist) { bestDist = d; nearest = i; }
    });
    setHover({ idx: nearest, x: xs[nearest], y: ys[nearest], item: sorted[nearest] });
  }
  function handleMouseLeave() { setHover(null); }

  return (
    <div ref={containerRef} style={{ width: '100%', height: h, position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.003))' }}>
      <svg width={w} height={h} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{display:'block'}}>
        {/* left axis labels */}
        <g>
          {tickVals.map((v,i) => {
            const ty = padding.top + (i / ticks) * innerH;
            return <text key={i} x={6} y={ty+4} fontSize={11} fill="#9fb0d4">{Number(v).toFixed(6)}</text>;
          })}
        </g>

        {/* area fill */}
        <path d={areaD} fill="rgba(38,166,154,0.08)" stroke="none" />

        {/* line */}
        <path d={pathD} fill="none" stroke="#26a69a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* points (invisible but for hit target) */}
        {xs.map((x,i) => <circle key={i} cx={x} cy={ys[i]} r={2} fill="#26a69a" opacity={0.0} />)}

        {/* optional hover marker */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padding.top} y2={padding.top + innerH} stroke="rgba(255,255,255,0.06)" />
            <circle cx={hover.x} cy={hover.y} r={4} fill="#fff" stroke="#02695d" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* tooltip */}
      {hover && (
        <div style={{
          position:'absolute', left: Math.min(w - 180, hover.x + 8), top: Math.max(6, hover.y - 36),
          background: 'rgba(2,6,23,0.9)', color:'#d1e6ff', padding:'8px 10px', borderRadius:8, fontSize:13, pointerEvents:'none', boxShadow:'0 8px 24px rgba(2,6,23,0.4)'
        }}>
          <div style={{fontWeight:800}}>{hover.item.price}</div>
          <div style={{color:'#9fb0d4', fontSize:12}}>{new Date(hover.item.t).toLocaleString()}</div>
        </div>
      )}

      {/* small notice */}
      <div style={{ position:'absolute', left:10, bottom:6, color:'#9fb0d4', fontSize:12 }}>
        {libErrorMsg ? 'Gráfico: fallback (lightweight-charts indisponível)' : 'Gráfico (fallback)'}
      </div>
    </div>
  );
}
