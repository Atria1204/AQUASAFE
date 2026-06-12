import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// KONFIGURASI WARNA NORMAL
const detailTheme = {
    'Suhu Air': { bgBase: 'from-blue-900/60 to-blue-500/40', text: 'text-blue-200', hex: '#3b82f6', glow: 'bg-blue-500' },
    'pH Level': { bgBase: 'from-fuchsia-900/60 to-fuchsia-500/40', text: 'text-fuchsia-200', hex: '#d946ef', glow: 'bg-fuchsia-500' },
    'O2 Terlarut': { bgBase: 'from-sky-900/60 to-sky-500/40', text: 'text-sky-200', hex: '#0ea5e9', glow: 'bg-sky-500' },
    'TDS Nutrisi': { bgBase: 'from-lime-900/60 to-lime-500/40', text: 'text-lime-200', hex: '#84cc16', glow: 'bg-lime-500' },
    'Flow 1': { bgBase: 'from-cyan-900/60 to-cyan-500/40', text: 'text-cyan-200', hex: '#06b6d4', glow: 'bg-cyan-500' },
    'Flow 2': { bgBase: 'from-teal-900/60 to-teal-500/40', text: 'text-teal-200', hex: '#14b8a6', glow: 'bg-teal-500' },
    'Flow 3': { bgBase: 'from-sky-900/60 to-sky-500/40', text: 'text-sky-200', hex: '#0ea5e9', glow: 'bg-sky-500' },
    'Flow 4': { bgBase: 'from-blue-900/60 to-blue-500/40', text: 'text-blue-200', hex: '#3b82f6', glow: 'bg-blue-500' },
};

export default function DetailView({
    activeDetail,
    setActiveDetail,
    detailData,
    chartData,
    selectedDevice,
    sensorData
}) {

    // === OTAK DETEKSI BAHAYA ===
    const val = detailData?.val;
    let isBahaya = false;

    if (val === 0 || val === undefined) {
        isBahaya = true;
    } else {
        if (activeDetail === 'Suhu Air' && (val > 30 || val < 24)) isBahaya = true;
        if (activeDetail === 'pH Level' && (val < 6.0 || val > 8.0)) isBahaya = true;
        if (activeDetail === 'O2 Terlarut' && val < 4.0) isBahaya = true;
        if (activeDetail === 'TDS Nutrisi' && (val < 300 || val > 1000)) isBahaya = true;
        if (activeDetail.startsWith('Flow') && val < 5.0) isBahaya = true;
    }

    // === TEMA DINAMIS (KALAU BAHAYA, SEMUA JADI MERAH) ===
    const theme = isBahaya ? {
        bgBase: 'from-red-700/80 to-red-500/60', // Background merah terang
        text: 'text-red-100', // Teks keputihan biar kontras
        hex: '#ef4444', // Grafik garis ikut merah!
        glow: 'bg-red-400 animate-pulse' // Orbs di belakang kedap-kedip merah
    } : (detailTheme[activeDetail] || detailTheme['Suhu Air']);

    // Fungsi pintar buat ngitung Nilai Tertinggi, Terendah, dan Rata-rata
    const stats = useMemo(() => {
        if (!chartData || chartData.length === 0) return { max: 0, min: 0, avg: 0 };
        const values = chartData.map(d => d.val).filter(v => !isNaN(v));
        if (values.length === 0) return { max: 0, min: 0, avg: 0 };

        const max = Math.max(...values);
        const min = Math.min(...values);
        let avg = values.reduce((a, b) => a + b, 0) / values.length; // Fallback rata-rata layar

        // 🔥 OVERRIDE AVG: Pake data 24 jam dari backend kalau ada
        if (sensorData?.avg24h) {
            if (activeDetail === 'Suhu Air' && sensorData.avg24h.avg_suhu !== null) avg = sensorData.avg24h.avg_suhu;
            else if (activeDetail === 'pH Level' && sensorData.avg24h.avg_ph !== null) avg = sensorData.avg24h.avg_ph;
            else if (activeDetail === 'O2 Terlarut' && sensorData.avg24h.avg_do !== null) avg = sensorData.avg24h.avg_do;
            else if (activeDetail === 'TDS Nutrisi' && sensorData.avg24h.avg_tds !== null) avg = sensorData.avg24h.avg_tds;
            else if (activeDetail === 'Flow 1' && sensorData.avg24h.avg_flow1 !== null) avg = sensorData.avg24h.avg_flow1;
            else if (activeDetail === 'Flow 2' && sensorData.avg24h.avg_flow2 !== null) avg = sensorData.avg24h.avg_flow2;
        }

        return {
            max: max.toFixed(activeDetail === 'pH Level' ? 2 : 1),
            min: min.toFixed(activeDetail === 'pH Level' ? 2 : 1),
            avg: (avg || 0).toFixed(activeDetail === 'pH Level' ? 2 : 1)
        };
    }, [chartData, activeDetail, sensorData]);

    // Tooltip Kustom buat Grafik
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`bg-[#0f172a]/95 backdrop-blur-md border ${isBahaya ? 'border-red-500/50' : 'border-white/10'} p-3 rounded-xl shadow-2xl`}>
                    <p className="text-[10px] font-mono text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-black text-white">
                        {payload[0].value} <span className="text-[10px] text-slate-400 font-normal">{detailData.unit}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 ease-out">

            {/* HEADER: TOMBOL KEMBALI & JUDUL */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setActiveDetail(null)}
                    className="p-2.5 bg-[#131b2c] border border-white/10 hover:border-white/30 rounded-full text-slate-300 hover:text-white transition-all duration-300 hover:-translate-x-1 shadow-lg"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
                        {detailData.icon && React.cloneElement(detailData.icon, { size: 24, className: theme.text })}
                        {activeDetail}
                    </h2>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-0.5">
                        Node: {selectedDevice}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* KOLOM KIRI: INFO UTAMA & STATISTIK */}
                <div className="flex flex-col gap-6">

                    {/* Kartu Utama (Vibrant Glassmorphism) */}
                    <div className={`relative backdrop-blur-2xl bg-gradient-to-br ${theme.bgBase} p-8 rounded-[2rem] border ${isBahaya ? 'border-red-400/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-white/20'} shadow-2xl overflow-hidden transition-all duration-500`}>
                        <div className={`absolute -right-10 -top-10 w-48 h-48 rounded-full blur-[60px] opacity-40 pointer-events-none ${theme.glow}`} />

                        <h3 className="text-[10px] uppercase font-black tracking-widest text-white/80 mb-2 relative z-10">
                            Live Reading {isBahaya && <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] animate-pulse">KRITIS</span>}
                        </h3>
                        <div className="flex items-end gap-2 relative z-10">
                            <span className="text-6xl tracking-tighter font-sans font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                                {detailData.val !== undefined ? detailData.val.toFixed(activeDetail === 'pH Level' ? 2 : 1) : '0.0'}
                            </span>
                            <span className={`text-sm font-bold tracking-wider uppercase pb-2 drop-shadow-md ${theme.text}`}>
                                {detailData.unit}
                            </span>
                        </div>
                        <p className="text-xs text-white/70 mt-6 leading-relaxed relative z-10 font-medium">
                            {detailData.desc}
                        </p>
                    </div>

                    {/* Kartu Mini Statistik (Max, Avg, Min) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="backdrop-blur-xl bg-[#131b2c]/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
                            <TrendingUp size={16} className="text-red-400 mb-2" />
                            <span className="text-lg font-black text-white">{stats.max}</span>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Tertinggi</span>
                        </div>
                        <div className="backdrop-blur-xl bg-[#131b2c]/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
                            <Minus size={16} className="text-emerald-400 mb-2" />
                            <span className="text-lg font-black text-white">{stats.avg}</span>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Rata-Rata (24 Jam)</span>
                        </div>
                        <div className="backdrop-blur-xl bg-[#131b2c]/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg">
                            <TrendingDown size={16} className="text-blue-400 mb-2" />
                            <span className="text-lg font-black text-white">{stats.min}</span>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Terendah</span>
                        </div>
                    </div>

                </div>

                {/* KOLOM KANAN: GRAFIK */}
                <div className="lg:col-span-2 backdrop-blur-2xl bg-[#0f172a]/90 border border-white/10 rounded-[2rem] p-6 flex flex-col min-h-[400px] shadow-2xl relative overflow-hidden">
                    <div className={`absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none ${theme.glow}`} />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 bg-white/5 border ${isBahaya ? 'border-red-500/50' : 'border-white/10'} rounded-xl`}>
                                <Activity size={16} className={theme.text} />
                            </div>
                            <h3 className="text-sm font-black tracking-widest uppercase text-white drop-shadow-sm">
                                Tren Data Terakhir
                            </h3>
                        </div>
                        <div className={`px-3 py-1 bg-white/5 border ${isBahaya ? 'border-red-500/50 text-red-300 animate-pulse' : 'border-white/10 text-slate-300'} rounded-full text-[10px] font-bold`}>
                            {isBahaya ? 'KONDISI KRITIS' : 'Real-time Polling'}
                        </div>
                    </div>

                    <div className="flex-1 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.hex} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={theme.hex} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => val}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke={theme.hex}
                                    strokeWidth={3}
                                    fill="url(#colorGradient)"
                                    animationDuration={700}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}