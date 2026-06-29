import React, { useState, useEffect, useRef } from 'react';
import { Camera, Activity, WifiOff, Power } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../config';


const CctvKolam = ({ deviceId }) => {
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

    const deviceIdRef = useRef(deviceId);
    useEffect(() => {
        deviceIdRef.current = deviceId;
    }, [deviceId]);

    // 1. EFEK UNMOUNT (Menembak sinyal OFF saat Pop-up ditutup)
    useEffect(() => {
        return () => {
            // Fungsi ini akan dieksekusi otomatis detik itu juga saat pop-up hilang dari layar
            if (isCamActiveRef.current) {
                console.log("[FRONTEND] Pop-up tertutup! Memaksa kamera OFF dari latar belakang...");
                // Menggunakan keepalive: true agar fetch tetap jalan walaupun web sudah tidak menampilkan popup
                fetch(`${API_BASE_URL}/api/kamera/toggle`, {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: "OFF", deviceId: deviceIdRef.current })
                }).catch(err => console.error("Gagal Auto-OFF:", err));
            }
        };
    }, []);

    // 2. EFEK WEBSOCKETS
    useEffect(() => {
        if (!deviceId) return;
        const wsUrl = `${WS_BASE_URL}/api/stream/output?deviceId=${deviceId}`;
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
    }, [deviceId]);

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

        console.log(`[FRONTEND] Tombol ditekan! Mengirim perintah ${newAction} untuk ${deviceId}`);
        try {
            const res = await fetch(`${API_BASE_URL}/api/kamera/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newAction, deviceId })
            });
            const data = await res.json();

            console.log(`[FRONTEND] Jawaban dari server:`, data);

            if (data.success) {
                setIsCamActive(newAction === "ON");
                if (newAction === "OFF") {
                    setImageUrl('');
                }
            } else {
                setErrorMessage(`GAGAL: ${data.message}`);
                setTimeout(() => setErrorMessage(''), 5000);
            }
        } catch (error) {
            console.error("Gagal mengontrol kamera", error);
            setErrorMessage("Gagal terhubung ke server!");
            setTimeout(() => setErrorMessage(''), 5000);
        }

        setTimeout(() => {
            setIsCooldown(false);
        }, 3000);
    };

    return (
        <div className="backdrop-blur-2xl bg-surface/95 border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col w-full">
            <div className={`absolute -left-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none transition-colors duration-500 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-4 border-b border-white/[0.05] pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 border rounded-xl transition-colors duration-300 ${isConnected ? 'bg-emerald-500/25 border-emerald-500/35 text-emerald-300' : 'bg-red-500/25 border-red-500/35 text-red-300'}`}>
                        <Camera size={18} className={isConnected && isCamActive ? 'animate-pulse' : ''} />
                    </div>
                    <h2 className="text-sm font-black tracking-widest uppercase text-white drop-shadow-sm truncate">Live Monitor Kolam</h2>
                </div>

                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleToggleCamera}
                        disabled={!isConnected || !isEspReady || isCooldown}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border 
                            ${(!isConnected || !isEspReady || isCooldown) ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                                : isCamActive ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'}`}
                    >
                        <Power size={12} /> {isCooldown ? 'Tunggu..' : (isCamActive ? 'Matikan' : 'Nyalakan')}
                    </button>

                    <div className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2.5 py-2 md:py-1 rounded-xl md:rounded-full text-[9px] font-bold tracking-widest uppercase border 
                        ${!isConnected ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : isEspReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                        {!isConnected ? (
                            <><WifiOff size={10} /> Terputus</>
                        ) : isEspReady ? (
                            <><Activity size={10} className="animate-pulse" />Online</>
                        ) : (
                            <><WifiOff size={10} />Offline</>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full rounded-xl overflow-hidden bg-bg-overlay border border-white/5 aspect-video flex items-center justify-center shadow-inner">

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
                                    {isCamActive ? 'Menunggu Frame Pertama...' : 'Kamera Standby'}
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