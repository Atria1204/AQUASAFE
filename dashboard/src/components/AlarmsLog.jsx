import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Komponen AlarmsLog
 * Menampilkan daftar log peringatan parameter yang berada di luar ambang batas aman
 */
export default function AlarmsLog({ activeAlarms = [], className = "" }) {
    return (
        <div className={`backdrop-blur-xl bg-surface-card/95 border border-white/10 rounded-[2rem] p-5 flex flex-col flex-1 relative overflow-hidden shadow-xl min-h-[300px] xl:min-h-0 ${className}`}>
            <AlertTriangle
                className={`absolute -right-8 -bottom-8 w-40 h-40 opacity-[0.03] pointer-events-none ${activeAlarms.length > 0 ? 'text-red-400 animate-pulse opacity-[0.09]' : 'text-slate-500'}`}
            />

            <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-4 relative z-10">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                    <AlertTriangle size={15} className={activeAlarms.length > 0 ? 'text-red-400 animate-pulse' : ''} />
                    <h2 className="text-xs uppercase tracking-widest font-black text-slate-200">Alarms Log</h2>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeAlarms.length > 0 ? 'bg-red-500/25 text-red-300' : 'bg-black/35 text-slate-400 border border-white/5'}`}>
                    {activeAlarms.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 min-h-0">
                {activeAlarms.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-85 py-4">
                        <CheckCircle2 size={30} className="text-emerald-400/80" strokeWidth={1.5} />
                        <p className="text-[10px] font-bold tracking-widest uppercase mt-1 text-emerald-400">Sistem Optimal</p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-2">
                        {activeAlarms.map((alarm, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-xl border backdrop-blur-md ${alarm.type === 'critical' ? 'bg-red-500/10 border-red-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${alarm.type === 'critical' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                        {alarm.type}
                                    </span>
                                    <span className="text-[9px] text-slate-300 font-mono">{alarm.time}</span>
                                </div>
                                <p className={`text-xs font-bold leading-relaxed ${alarm.type === 'critical' ? 'text-red-300' : 'text-yellow-300'}`}>
                                    {alarm.msg}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
