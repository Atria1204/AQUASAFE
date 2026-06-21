import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Activity, WifiOff, Power } from 'lucide-react';

const CctvKolam = () => {
    const [imageUrl, setImageUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isCamActive, setIsCamActive] = useState(false);
    const [isEspReady, setIsEspReady] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');

    const wsRef = useRef(null);

    // Ref khusus untuk melacak status kamera saat komponen mati (unmount)
    const isCamActiveRef = useRef(isCamActive);
    useEffect(() => {
        isCamActiveRef.current = isCamActive;
    }, [isCamActive]);

    // 1. EFEK UNMOUNT (Menembak sinyal OFF saat Pop-up ditutup)
    useEffect(() => {
        return () => {
            // Fungsi ini akan dieksekusi otomatis detik itu juga saat pop-up hilang dari layar
            if (isCamActiveRef.current) {
                console.log("[FRONTEND] Pop-up tertutup! Memaksa kamera OFF dari latar belakang...");
                // Menggunakan keepalive: true agar fetch tetap jalan walaupun web sudah tidak menampilkan popup
                fetch('https://api.aquasafe.my.id/api/kamera/toggle', {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: "OFF" })
                }).catch(err => console.error("Gagal Auto-OFF:", err));
            }
        };
    }, []);

    // 2. EFEK WEBSOCKETS
    useEffect(() => {
        const wsUrl = 'wss://api.aquasafe.my.id/api/stream/output';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setIsConnected(true);
        ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'ESP_STATUS') {
                        setIsEspReady(msg.isReady);
                        setIsCamActive(msg.isStreaming);
                        if (!msg.isStreaming) setImageUrl('');
                    }
                } catch (e) {
                    console.error("Gagal membaca status:", e);
                }
            } else {
                const url = URL.createObjectURL(event.data);
                setImageUrl(prevUrl => {
                    if (prevUrl) URL.revokeObjectURL(prevUrl);
                    return url;
                });
            }
        };
        ws.onclose = () => setIsConnected(false);
        ws.onerror = () => setIsConnected(false);

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    // 3. EFEK DETEKSI JARINGAN LOKAL
    const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsNetworkOnline(true);
        const handleOffline = () => setIsNetworkOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Fungsi transmisi perintah ON/OFF manual
    const handleToggleCamera = async () => {
        if (isCooldown) return;

        setErrorMessage('');

        if (!isNetworkOnline) {
            setErrorMessage("🚨 KONEKSI TERPUTUS: Periksa WiFi atau Kuota internet perangkat Anda.");
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        setIsCooldown(true);
        const newAction = isCamActive ? "OFF" : "ON";

        console.log(`[FRONTEND] Tombol ditekan! Mengirim perintah: ${newAction}`);
        try {
            const res = await fetch('https://api.aquasafe.my.id/api/kamera/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newAction })
            });
            const data = await res.json();

            console.log(`[FRONTEND] Jawaban dari server:`, data);

            if (data.success) {
                setIsCamActive(newAction === "ON");
                if (newAction === "OFF") {
                    setImageUrl('');
                } else {
                    setTimeout(() => {
                        if (!document.getElementById('video-stream-image')) {
                            setErrorMessage("🚨 KAMERA OFFLINE!");
                            setIsCamActive(false);
                            setTimeout(() => setErrorMessage(''), 7000);
                        }
                    }, 10000);
                }
            } else {
                setErrorMessage(`GAGAL: ${data.message}`);
                setTimeout(() => setErrorMessage(''), 5000);
            }
        } catch (error) {
            console.error("Gagal mengontrol kamera", error);
            setErrorMessage("🚨 SERVER DOWN!");
            setTimeout(() => setErrorMessage(''), 5000);
        }

        setTimeout(() => {
            setIsCooldown(false);
        }, 3000);
    };

    return (
        <div className="backdrop-blur-2xl bg-[#0f172a]/95 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col w-full">
            <div className={`absolute -left-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none transition-colors duration-500 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />

            <div className="relative z-10 flex items-center justify-between mb-4 border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 border rounded-xl transition-colors duration-300 ${isConnected ? 'bg-emerald-500/25 border-emerald-500/35 text-emerald-300' : 'bg-red-500/25 border-red-500/35 text-red-300'}`}>
                        <Camera size={18} className={isConnected && isCamActive ? 'animate-pulse' : ''} />
                    </div>
                    <h2 className="text-sm font-black tracking-widest uppercase text-white drop-shadow-sm">Live Monitor Kolam</h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToggleCamera}
                        disabled={!isConnected || isCooldown}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border 
                            ${(!isConnected || isCooldown) ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                                : isCamActive ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'}`}
                    >
                        <Power size={12} /> {isCooldown ? 'Tunggu..' : (isCamActive ? 'Matikan' : 'Nyalakan')}
                    </button>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${isConnected ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                        {isConnected ? <><Activity size={10} className="animate-pulse" /> Server Ready</> : <><WifiOff size={10} /> Disconnected</>}
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full rounded-xl overflow-hidden bg-[#0a0f1a] border border-white/5 aspect-video flex items-center justify-center shadow-inner">

                {/* NOTIFIKASI ERROR MERAH OVERLAY */}
                {errorMessage && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm bg-red-500/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg text-[11px] font-bold tracking-wide z-50 border border-red-400 shadow-xl text-center flex items-center justify-center animate-in fade-in slide-in-from-top-4 duration-300">
                        {errorMessage}
                    </div>
                )}

                {imageUrl && isConnected && isCamActive ? (
                    <img
                        id="video-stream-image"
                        src={imageUrl}
                        alt="Live CCTV Kolam"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center text-slate-500 gap-3 opacity-80">
                        {isConnected ? (
                            <>
                                <Power size={28} className={isCamActive ? "text-emerald-500/50" : "text-slate-600"} />
                                <span className="text-[10px] uppercase tracking-widest font-bold">
                                    {isCamActive ? 'Menunggu Frame Pertama...' : 'Kamera Standby (Hemat Kuota)'}
                                </span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={28} className="text-red-500/40 mb-1" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-red-400/70">Koneksi Server Terputus</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CctvKolam;