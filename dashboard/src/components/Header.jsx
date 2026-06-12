import React, { useState, useRef, useEffect } from 'react';
import { Power, CirclePlus, ChevronDown, Check } from 'lucide-react';

export default function Header({
    devices,
    selectedDevice,
    setSelectedDevice,
    sensorData,
    activeAlarms,
    onOpenAddModal,
    allStatuses,
    userName
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // OTAK LENCANA KANAN
    const isMati = !sensorData?.lastUpdated || (Date.now() - sensorData.lastUpdated > 300000);
    const isBermasalah = activeAlarms?.length > 0;
    const selectedDeviceName = devices?.find(d => d.device_id === selectedDevice)?.nama_kolam || 'Memuat...';

    // === PERBAIKAN 1: OTAK DOT UTAMA (PASTI SINKRON SAMA LENCANA KANAN) ===
    let mainDotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'; // Default Hijau
    if (isMati) {
        mainDotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse';
    } else if (isBermasalah) {
        mainDotColor = 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse';
    }

    // === PERBAIKAN 2: OTAK DOT DI DALAM LIST DROPDOWN (Lebih Sensitif) ===
    const getStatusColor = (deviceId) => {
        const data = allStatuses?.[deviceId];

        if (!data || Object.keys(data).length === 0 || (data.suhu === 0 && data.flow1 === 0)) {
            return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
        }

        // Hapus syarat " !== 0 " biar sama sensitifnya kayak alarm!
        const isSuhuBahaya = data.suhu > 30 || data.suhu < 24;
        const isPhBahaya = data.ph < 6.0 || data.ph > 8.0;
        const isDoBahaya = data.do < 4.0;
        const isTdsBahaya = data.tds < 300 || data.tds > 1000;
        const isFlow1Bahaya = data.flow1 < 5.0;
        const isFlow2Bahaya = data.flow2 < 5.0;

        if (isSuhuBahaya || isPhBahaya || isDoBahaya || isTdsBahaya || isFlow1Bahaya || isFlow2Bahaya) {
            return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse';
        }

        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
    };

    return (
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-5 border-b border-white/[0.05] pb-6">

            <div className="flex-shrink-0">
                <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
                    AQUASAFE
                </h1>
                <p className="text-slate-400 text-xs font-bold mt-1 tracking-[0.2em] uppercase">
                    DASHBOARD &nbsp;&bull;&nbsp; HAI, {userName}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto relative z-40">

                <div className="relative flex-grow sm:flex-grow-0 min-w-[280px]" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between bg-[#131b2c] border ${isDropdownOpen ? 'border-cyan-500/50' : 'border-white/10'} hover:border-cyan-500/30 rounded-xl px-4 py-2.5 transition-all duration-300 shadow-sm`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Panggil warna Dot Utama yang udah pasti sinkron */}
                            <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${mainDotColor}`} />
                            <span className="text-xs font-bold tracking-wide text-cyan-400">
                                {selectedDeviceName}
                            </span>
                        </div>
                        <ChevronDown size={16} className={`text-cyan-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div
                        className={`absolute top-full left-0 right-0 mt-2 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
                    >
                        {devices?.map(d => (
                            <button
                                key={d.device_id}
                                onClick={() => {
                                    setSelectedDevice(d.device_id);
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 border-b border-white/[0.02] last:border-0 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(d.device_id)}`} />
                                    <span className={`text-xs ${selectedDevice === d.device_id ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                                        {d.nama_kolam} <span className="text-slate-500 font-normal">({d.device_id})</span>
                                    </span>
                                </div>
                                {selectedDevice === d.device_id && <Check size={14} className="text-cyan-400" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center">
                    {isMati ? (
                        <span className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> MATI
                        </span>
                    ) : isBermasalah ? (
                        <span className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> BERMASALAH
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> AKTIF
                        </span>
                    )}
                </div>

                <button
                    onClick={onOpenAddModal}
                    className="flex items-center gap-2 bg-[#131b2c] border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ml-auto xl:ml-0"
                >
                    <CirclePlus size={16} />
                    <span>Tambah</span>
                </button>

            </div>
        </header>
    );
}