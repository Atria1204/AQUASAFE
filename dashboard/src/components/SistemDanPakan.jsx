import React from 'react';
import { Timer, Sun, Moon, DatabaseBackup, RefreshCcw, CheckCircle2, XCircle, AlertTriangle, Activity } from 'lucide-react';

/**
 * Komponen SistemDanPakan
 * Menampilkan ringkasan status pakan pagi/sore, stok pakan, dan konektivitas perangkat (ONLINE/OFFLINE)
 */
const SistemDanPakan = React.memo(function SistemDanPakan({
    sensorData,
    savedPagi,
    savedSore,
    isMati,
    className = ""
}) {
    // Menghitung status pakan berdasarkan data dari hardware ESP32
    const sudahPagi = sensorData?.sudahPakan1 === 1 || sensorData?.sudahPakan1 === true;
    const sudahSore = sensorData?.sudahPakan2 === 1 || sensorData?.sudahPakan2 === true;

    return (
        <div className={`backdrop-blur-xl bg-gradient-to-b from-surface-card/95 to-bg-overlay/95 border border-cyan-500/20 shadow-xl hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] rounded-3xl p-4 2xl:p-5 flex flex-col xl:h-[285px] relative overflow-hidden transition-all duration-500 ${className}`}>
            <div className="absolute -right-5 -top-5 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />

            <div className="flex items-center justify-between mb-2.5 relative z-10 border-b border-white/[0.05] pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
                        <Timer size={11} className="animate-pulse" />
                    </div>
                    <h2 className="text-[10px] uppercase tracking-widest font-black text-slate-200 drop-shadow-sm">Sistem & Pakan</h2>
                </div>
            </div>

            <div className="flex flex-col justify-between flex-1 gap-2 relative z-10 mt-1 mb-1">
                {/* Header Kolom */}
                <div className="flex justify-between items-center px-2 mb-[-4px]">
                    <span className="text-[7px] font-black text-slate-500 tracking-widest uppercase">Jadwal / Stok</span>
                    <span className="text-[7px] font-black text-slate-500 tracking-widest uppercase">Status</span>
                </div>

                {/* Baris Pagi */}
                <div className="group flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent hover:from-blue-800/30 py-1 px-3 rounded-xl border border-blue-500/10 hover:border-blue-400/30 transition-all duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] text-blue-300 group-hover:scale-110 transition-transform">
                            <Sun size={12} className="animate-spin-slow" style={{ animationDuration: '10s' }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white tracking-wide">Jadwal Pagi</span>
                            <span className="text-[8px] font-bold text-blue-300 font-mono tracking-widest bg-black/40 px-1 rounded mt-0.5 w-fit border border-blue-500/20">{savedPagi}</span>
                        </div>
                    </div>
                    {sudahPagi ? (
                        <span className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[8px] font-black min-w-[85px] py-1 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500/30 transition-colors">
                            <CheckCircle2 size={10} strokeWidth={2.5} /> Sudah
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-1.5 bg-red-500/15 text-red-400 border border-red-500/30 text-[8px] font-black min-w-[85px] py-1 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)] group-hover:bg-red-500/25 transition-colors">
                            <XCircle size={10} strokeWidth={2.5} /> Belum
                        </span>
                    )}
                </div>

                {/* Baris Sore */}
                <div className="group flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-transparent hover:from-indigo-800/30 py-1 px-3 rounded-xl border border-indigo-500/10 hover:border-indigo-400/30 transition-all duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.2)] text-indigo-300 group-hover:scale-110 transition-transform">
                            <Moon size={11} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white tracking-wide">Jadwal Sore</span>
                            <span className="text-[8px] font-bold text-indigo-300 font-mono tracking-widest bg-black/40 px-1 rounded mt-0.5 w-fit border border-indigo-500/20">{savedSore}</span>
                        </div>
                    </div>
                    {sudahSore ? (
                        <span className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[8px] font-black min-w-[85px] py-1 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500/30 transition-colors">
                            <CheckCircle2 size={10} strokeWidth={2.5} /> Sudah
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-1.5 bg-red-500/15 text-red-400 border border-red-500/30 text-[8px] font-black min-w-[85px] py-1 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)] group-hover:bg-red-500/25 transition-colors">
                            <XCircle size={10} strokeWidth={2.5} /> Belum
                        </span>
                    )}
                </div>

                {/* Baris Stok Pakan */}
                <div className="group flex justify-between items-center bg-gradient-to-r from-slate-800/40 to-transparent hover:from-slate-700/40 py-1 px-3 rounded-xl border border-slate-500/20 hover:border-slate-400/30 transition-all duration-300">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center border border-slate-400/30 shadow-[0_0_10px_rgba(100,116,139,0.2)] text-slate-300 group-hover:scale-110 transition-transform">
                            <DatabaseBackup size={11} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white tracking-wide">Stok Pakan</span>
                            <span className="text-[8px] font-bold text-slate-400 font-mono tracking-widest bg-black/40 px-1 rounded mt-0.5 w-fit border border-slate-500/20">IR Sensor</span>
                        </div>
                    </div>

                    {sensorData?.pakanKosong === 1 ? (
                        <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center justify-center gap-1.5 bg-red-500/15 text-red-400 border border-red-500/30 text-[8px] font-black min-w-[85px] py-1 px-2 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)] group-hover:bg-red-500/25 transition-colors">
                                <XCircle size={10} strokeWidth={2.5} className="animate-pulse" /> Isi Ulang
                            </span>
                        </div>
                    ) : sensorData?.pakanKosong === 0 ? (
                        <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[8px] font-black min-w-[85px] py-1 px-2 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500/30 transition-colors">
                                <CheckCircle2 size={10} strokeWidth={2.5} /> Aman
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center justify-center gap-1.5 bg-slate-500/15 text-slate-400 border border-slate-500/30 text-[8px] font-black min-w-[85px] py-1 px-2 rounded-md tracking-widest uppercase shadow-[0_0_10px_rgba(148,163,184,0.1)] group-hover:bg-slate-500/25 transition-colors">
                                <RefreshCcw size={10} strokeWidth={2.5} className="animate-spin-slow" /> Menunggu
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Koneksi Perangkat */}
            <div className="mt-0.5 pt-1.5 border-t border-white/[0.05] relative z-10">
                <div className={`flex items-center justify-between p-1.5 rounded-xl border mt-auto mb-1 ${isMati ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-xl ${isMati ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}>
                            {isMati ? <AlertTriangle size={13} className="animate-pulse" /> : <Activity size={13} />}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[7.5px] uppercase tracking-widest font-black text-slate-400">Status Alat</h2>
                            <p className={`text-[10px] font-black tracking-widest mt-0.5 ${isMati ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : 'text-emerald-400'}`}>
                                {isMati ? 'OFFLINE' : 'ONLINE'}
                            </p>
                        </div>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${isMati ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'} shadow-[0_0_10px_currentColor] opacity-80`} />
                </div>
            </div>
        </div>
    );
});

export default SistemDanPakan;

