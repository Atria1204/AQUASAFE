import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Activity, WifiOff } from 'lucide-react';

const CctvKolam = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    // Referensi untuk nyimpen koneksi websocket biar bisa diputus pas web diclose
    const wsRef = useRef(null);

    useEffect(() => {
        // =======================================================
        // 🛑 CARA 3: MEMATIKAN CCTV SEMENTARA DEMI HEMAT KUOTA 🛑
        // =======================================================
        // Sengaja gua jadikan komentar biar dia GAK OTOMATIS NELPON server.
        // Nanti kalau lu udah siap bikin tombol ON/OFF, komen ini tinggal dibuka lagi.

        /*
        const wsUrl = 'wss://api.aquasafe.my.id/api/stream/output';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Terhubung ke Server Video CCTV');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const url = URL.createObjectURL(event.data);
            setImageUrl(prevUrl => {
                if (prevUrl) {
                    URL.revokeObjectURL(prevUrl);
                }
                return url;
            });
        };

        ws.onclose = () => {
            console.log('❌ Terputus dari Server Video CCTV');
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setIsConnected(false);
        };
        */

        // Pastikan status tetap false (mati) di awal
        setIsConnected(false);

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return (
        <div className="backdrop-blur-2xl bg-[#0f172a]/95 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col w-full">
            {/* Efek Cahaya Latar */}
            <div className={`absolute -left-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none transition-colors duration-500 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />

            {/* Header Komponen */}
            <div className="relative z-10 flex items-center justify-between mb-4 border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 border rounded-xl transition-colors duration-300 ${isConnected ? 'bg-emerald-500/25 border-emerald-500/35 text-emerald-300' : 'bg-red-500/25 border-red-500/35 text-red-300'}`}>
                        <Camera size={18} className={isConnected ? 'animate-pulse' : ''} />
                    </div>
                    <h2 className="text-sm font-black tracking-widest uppercase text-white drop-shadow-sm">Live Monitor Kolam</h2>
                </div>

                {/* Indikator Status Koneksi */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                    {isConnected ? (
                        <><Activity size={10} className="animate-pulse" /> Live</>
                    ) : (
                        <><WifiOff size={10} /> Disconnected</>
                    )}
                </div>
            </div>

            {/* Kontainer Layar CCTV */}
            <div className="relative z-10 w-full rounded-xl overflow-hidden bg-[#0a0f1a] border border-white/5 aspect-video flex items-center justify-center shadow-inner">
                {imageUrl && isConnected ? (
                    <img
                        src={imageUrl}
                        alt="Live CCTV Kolam"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center text-slate-500 gap-3 opacity-80">
                        {isConnected ? (
                            <>
                                <RefreshCw size={24} className="animate-spin text-emerald-500/50" />
                                <span className="text-[10px] uppercase tracking-widest font-bold">Menunggu Video dari Kamera...</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={28} className="text-red-500/40 mb-1" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-red-400/70">Kamera Dinonaktifkan Sementara</span>
                                <span className="text-[9px] text-slate-600">Mode Hemat Kuota Aktif</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className="relative z-10 text-[9px] text-slate-500 mt-4 text-center font-bold tracking-widest uppercase">
                {isConnected ? '⚡ WebSocket Video Streaming Aktif' : 'Koneksi WebSocket Dihentikan'}
            </p>
        </div>
    );
};

export default CctvKolam;