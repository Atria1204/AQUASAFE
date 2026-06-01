import React from 'react';
import { Rocket, Plus, DatabaseZap } from 'lucide-react';

export default function EmptyState({ onOpenAddModal }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 animate-in fade-in duration-1000 relative overflow-hidden rounded-[3rem] border border-white/[0.03] bg-[#0a0f1a]/50 backdrop-blur-sm">

            {/* Bola Cahaya (Orbs) di Belakang buat efek Antigravity */}
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]" />

            {/* Bagian Ilustrasi/Icon Gede */}
            <div className="relative mb-12 flex items-center justify-center">
                {/* Lingkaran luar glowing */}
                <div className="absolute w-44 h-44 rounded-full bg-cyan-500/10 border border-cyan-500/30 blur-sm animate-pulse" />
                {/* Lingkaran dalam glassmorphism */}
                <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(34,211,238,0.2)]">
                    <Rocket size={70} strokeWidth={1} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.7)] rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500" />
                    <DatabaseZap size={24} className="absolute -bottom-2 -right-2 text-yellow-400 bg-[#0a0f1a] rounded-full p-0.5 border border-yellow-400/50 shadow-lg" />
                </div>
            </div>

            {/* Teks Sambutan Elit */}
            <div className="text-center max-w-lg mb-12 relative z-10 space-y-3">
                <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
                    Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">AquaSafe</span>
                </h1>
                <p className="text-sm font-bold tracking-widest uppercase text-cyan-500 pb-1">
                    Petualangan IoT Lu Dimulai Sekarang Bosku!
                </p>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full mb-5" />
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                    Kabin kontrol lu udah siap, tapi kita belum deteksi adanya node telemetri yang terdaftar. Yuk, tancepin ESP32 lu dan daftarin kolam pertama lu sekarang!
                </p>
            </div>

            {/* Tombol CTA (Call To Action) Gede & Glowing */}
            <button
                onClick={onOpenAddModal}
                className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.8)] hover:scale-105 transition-all duration-300 relative z-10"
            >
                <div className="p-1.5 rounded-full bg-white/10 border border-white/20 group-hover:rotate-90 transition-transform duration-300">
                    <Plus size={16} />
                </div>
                Daftarkan Kolam Pertama
            </button>
        </div>
    );
}