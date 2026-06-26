import React, { useState, useRef, useEffect } from 'react';
import { CirclePlus, ChevronDown, Check, Video, Pencil, X } from 'lucide-react';


export default function Header({
    devices,
    selectedDevice,
    setSelectedDevice,
    sensorData,
    activeAlarms,
    onOpenAddModal,
    onOpenCctvModal,
    allStatuses,
    userName,
    onEditDeviceName
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [editingDeviceId, setEditingDeviceId] = useState(null);
    const [tempDeviceName, setTempDeviceName] = useState('');
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

    // Penentuan status peringatan perangkat
    const isMati = !sensorData?.lastUpdated || (Date.now() - sensorData.lastUpdated > 300000);
    const isBermasalah = activeAlarms?.length > 0;
    const selectedDeviceName = devices?.find(d => d.device_id === selectedDevice)?.nama_kolam || 'Memuat...';

    // Indikator status utama yang sinkron dengan status peringatan
    let mainDotColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
    if (isMati) {
        mainDotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse';
    } else if (isBermasalah) {
        mainDotColor = 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse';
    }

    // Deteksi kegagalan koneksi di dalam daftar dropdown
    const getStatusColor = (deviceId) => {
        const data = allStatuses?.[deviceId];

        // Cek apakah device mati (tidak ada update lebih dari 5 menit)
        const isDeviceMati = !data || !data.lastUpdated || (Date.now() - data.lastUpdated > 300000);

        if (isDeviceMati || Object.keys(data).length === 0 || (data.suhu === 0 && data.flow1 === 0)) {
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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-5 border-b border-white/[0.05] pb-3 shrink-0">

            <div className="flex flex-shrink-0 items-center gap-4">
                <img src="/logo2.png" alt="AquaSafe Logo" className="w-12 h-12 md:w-10 md:h-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight drop-shadow-md">
                        <span className="text-white">Aqua</span>
                        <span className="text-cyan-400">Safe</span>
                    </h1>

                    <p className="text-slate-400 text-[9px] md:text-[10px] font-bold mt-1 tracking-[0.2em] uppercase">
                        DASHBOARD &nbsp;&bull;&nbsp; Selamat Datang, {userName}!
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto relative z-40">

                <div className="relative flex-grow sm:flex-grow-0 min-w-[280px]" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between bg-surface-card border ${isDropdownOpen ? 'border-cyan-500/50' : 'border-white/10'} hover:border-cyan-500/30 rounded-xl px-4 py-2.5 transition-all duration-300 shadow-sm`}
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
                        className={`absolute z-50 top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
                    >
                        {devices?.map(d => {
                            const isEditing = editingDeviceId === d.device_id;

                            return (
                                <div
                                    key={d.device_id}
                                    onClick={() => {
                                        if (!isEditing) {
                                            setSelectedDevice(d.device_id);
                                            setIsDropdownOpen(false);
                                        }
                                    }}
                                    className={`group w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 border-b border-white/[0.02] last:border-0 transition-colors ${!isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-center gap-3 flex-grow mr-2 min-w-0">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(d.device_id)}`} />
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={tempDeviceName}
                                                onChange={(e) => setTempDeviceName(e.target.value)}
                                                onClick={(e) => e.stopPropagation()} // Mencegah dropdown menutup saat klik input
                                                className="bg-white/5 border border-cyan-500/50 rounded-md text-white text-xs font-bold px-2 py-1 w-full focus:outline-none focus:border-cyan-400"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={`text-xs truncate ${selectedDevice === d.device_id ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                                                {d.nama_kolam} <span className="text-slate-500 font-normal">({d.device_id})</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (tempDeviceName.trim()) {
                                                            onEditDeviceName(d.device_id, tempDeviceName.trim());
                                                        }
                                                        setEditingDeviceId(null);
                                                    }}
                                                    className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-all"
                                                    title="Simpan"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingDeviceId(null);
                                                    }}
                                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                                                    title="Batal"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingDeviceId(d.device_id);
                                                        setTempDeviceName(d.nama_kolam);
                                                    }}
                                                    className="p-1 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Edit Nama"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                {selectedDevice === d.device_id && <Check size={14} className="text-cyan-400" />}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

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

                <div className="flex items-center gap-2 ml-auto xl:ml-0">
                    <button
                        onClick={onOpenCctvModal}
                        className="flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        title="Live CCTV"
                    >
                        <Video size={16} className="animate-pulse" />
                        <span className="hidden sm:inline uppercase tracking-wider">CCTV</span>
                    </button>

                    <button
                        onClick={onOpenAddModal}
                        className="flex items-center justify-center gap-2 bg-surface-card border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all"
                        title="Tambah Perangkat"
                    >
                        <CirclePlus size={16} />
                        <span className="hidden sm:inline">Tambah</span>
                    </button>
                </div>

            </div>
        </header>
    );
}