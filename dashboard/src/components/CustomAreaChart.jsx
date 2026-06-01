import React from 'react';

export default function CustomAreaChart({ data, hexColor }) {
    if (!data || data.length === 0) return null;
    const min = Math.min(...data.map(d => d.val));
    const max = Math.max(...data.map(d => d.val));
    const padding = (max - min) * 0.3 === 0 ? 1 : (max - min) * 0.3;
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    const range = paddedMax - paddedMin;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const y = 100 - (((d.val - paddedMin) / range) * 100);
        return { x, y, ...d };
    });

    const linePath = points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        return `C ${cp1x} ${prev.y}, ${cp1x} ${p.y}, ${p.x} ${p.y}`;
    }).join(' ');

    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    return (
        <div className="w-full h-full flex flex-col relative group">
            <div className="flex-1 relative w-full border-b border-l border-white/[0.05]">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`grad-${hexColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={hexColor} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={hexColor} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#grad-${hexColor.replace('#', '')})`} />
                    <path d={linePath} fill="none" stroke={hexColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 4px 6px ${hexColor}40)` }} />
                </svg>
                {points.map((p, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full cursor-crosshair butter-transition opacity-0 group-hover:opacity-100 hover:scale-[2.5] z-30"
                        style={{ left: `calc(${p.x}% - 4px)`, top: `calc(${p.y}% - 4px)`, backgroundColor: hexColor, border: '1px solid #0a0f1a' }}
                        title={`${p.time} : ${p.val.toFixed(2)}`}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-mono font-bold px-1">
                <span>{data[0]?.time}</span>
                <span>{data[Math.floor(data.length / 2)]?.time}</span>
                <span>{data[data.length - 1]?.time}</span>
            </div>
        </div>
    );
}