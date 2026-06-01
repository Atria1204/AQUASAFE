import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ExactSensorCard({ title, onClick, cfg }) {
    const valueDisplay = cfg.val !== undefined && cfg.val.toFixed ? cfg.val.toFixed(1) : cfg.val;

    return (
        <div
            onClick={onClick}
            className={`border rounded-[2rem] p-6 flex flex-col justify-between h-44 cursor-pointer butter-hover butter-click group relative overflow-hidden shadow-lg ${cfg.bg} ${cfg.border}`}
        >
            <div className={`absolute right-0 bottom-4 translate-x-1/4 opacity-10 group-hover:scale-110 butter-transition pointer-events-none ${cfg.color}`}>
                {React.cloneElement(cfg.icon, { size: 90, strokeWidth: 1.5 })}
            </div>
            <div className="flex justify-between items-start relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 group-hover:text-white butter-transition">{title}</p>
                <div className={`w-8 h-8 rounded-full border border-current flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 butter-transition ${cfg.color}`}>
                    {React.cloneElement(cfg.icon, { size: 14, strokeWidth: 2 })}
                </div>
            </div>
            <div className="relative z-10 mt-4">
                <p className="text-[2.5rem] font-bold tracking-tight text-white group-hover:drop-shadow-lg butter-transition flex items-baseline">
                    {valueDisplay}
                    <span className="text-[11px] font-bold text-slate-400 ml-1.5 uppercase">{cfg.unit}</span>
                </p>
            </div>
            <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 butter-transition translate-x-2 group-hover:translate-x-0">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <ArrowUpRight size={12} className="text-white" />
                </div>
            </div>
        </div>
    );
}