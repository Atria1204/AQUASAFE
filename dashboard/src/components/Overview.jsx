import React, { useState, useEffect } from 'react';
import {
    Activity, AlertTriangle, CheckCircle2,
    Thermometer, FlaskConical, Wind, Leaf,
    Waves, DatabaseBackup, Calendar, Timer
} from 'lucide-react';

// =================================================================
// KONFIGURASI TEMA WARNA & ICON TIAP KARTU SENSOR
// =================================================================
const sensorConfig = {
    'Suhu Air': {
        icon: <Thermometer />, unit: '°C',
        text: 'text-blue-100', border: 'border-blue-300/60',
        bgBase: 'from-blue-800/70 to-blue-400/50', bgGlow: 'bg-blue-300',
        glow: 'hover:shadow-[0_10px_45px_-10px_rgba(30,144,255,0.8)]'
    },
    'pH Level': {
        icon: <FlaskConical />, unit: 'pH',
        text: 'text-fuchsia-100', border: 'border-fuchsia-300/60',
        bgBase: 'from-fuchsia-800/70 to-fuchsia-400/50', bgGlow: 'bg-fuchsia-300',
        glow: 'hover:shadow-[0_10px_45px_-10px_rgba(219,112,147,0.8)]'
    },
    'O2 Terlarut': {
        icon: <Wind />, unit: 'MG/L',
        text: 'text-sky-100', border: 'border-sky-300/60',
        bgBase: 'from-sky-800/70 to-sky-400/50', bgGlow: 'bg-sky-300',
        glow: 'hover:shadow-[0_10px_45px_-10px_rgba(100,206,230,0.8)]'
    },
    'TDS Nutrisi': {
        icon: <Leaf />, unit: 'PPM',
        text: 'text-lime-100', border: 'border-lime-300/60',
        bgBase: 'from-lime-800/70 to-lime-400/50', bgGlow: 'bg-lime-300',
        glow: 'hover:shadow-[0_10px_45px_-10px_rgba(173,255,47,0.8)]'
    },
    'Flow 1': {
        icon: <Waves />, unit: 'L/M',
        text: 'text-cyan-100', border: 'border-cyan-300/60',
        bgBase: 'from-cyan-800/70 to-cyan-400/50', bgGlow: 'bg-cyan-300',
        glow: 'hover:shadow-[0_10px_45px_-10px_rgba(0,255,255,0.8)]'
    },
    'Flow 2': {
        icon: <Waves />, unit: 'L/M',
        text: 'text-teal-100', border: 'border-teal-300/60',
        bgBase: 'from-teal-800/70 to-teal-400/50', bgGlow: 'bg-teal-300',
        glow: 'hover:shadow-[0_10px_45px_-10px_rgba(0,128,128,0.8)]'
    }
};

// =================================================================
// SUB-KOMPONEN: KARTU SENSOR BERGAYA GLASSMORPHISM
// =================================================================
const GlassSensorCard = ({ title, valueKey, sensorData, setActiveDetail }) => {
    const cfg = sensorConfig[title];
    const val = sensorData?.[valueKey];
    const displayValue = val !== undefined ? val.toFixed(title === 'pH Level' ? 2 : 1) : '0.0';

    let isBahaya = false;
    if (val !== undefined) {
        if (valueKey === 'suhu' && (val > 30 || val < 24)) isBahaya = true;
        if (valueKey === 'ph' && (val < 6.0 || val > 8.0)) isBahaya = true;
        if (valueKey === 'do' && val < 4.0) isBahaya = true;
        if (valueKey === 'tds' && (val < 300 || val > 1000)) isBahaya = true;
        if (valueKey.startsWith('flow') && val < 5.0) isBahaya = true;
    } else {
        isBahaya = true;
    }

    const bgBase = isBahaya ? 'from-red-600/90 to-red-400/70 animate-pulse' : cfg.bgBase;
    const bgGlow = isBahaya ? 'bg-red-400' : cfg.bgGlow;
    const border = isBahaya ? 'border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)]' : cfg.border;
    const text = isBahaya ? 'text-red-100' : cfg.text;
    const glow = isBahaya ? 'hover:shadow-[0_10px_50px_-10px_rgba(239,68,68,0.9)]' : cfg.glow;

    return (
        <div
            onClick={() => setActiveDetail(title)}
            className={`group relative cursor-pointer backdrop-blur-2xl bg-gradient-to-br ${bgBase} p-5 rounded-3xl h-36 flex flex-col justify-between border ${border} hover:border-white/60 transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.03] ${glow} overflow-hidden shadow-lg hover:z-10`}
        >
            <div className={`absolute -inset-10 opacity-0 group-hover:opacity-40 transition-all duration-700 ease-out rounded-full blur-[45px] group-hover:scale-130 ${bgGlow}`} />
            <div className={`absolute -right-3 -bottom-3 opacity-[0.25] group-hover:opacity-[0.4] transition-all duration-700 ease-out pointer-events-none transform group-hover:scale-130 group-hover:-rotate-12 ${text}`}>
                {React.cloneElement(cfg.icon, { size: 95 })}
            </div>
            <div className="flex justify-between items-center relative z-10 mb-1">
                <h3 className="text-[10px] uppercase font-black tracking-widest text-white/95 group-hover:text-white transition-colors duration-300 drop-shadow-md">
                    {title}
                </h3>
                <div className={`p-1.5 rounded-full border bg-black/25 shadow-inner ${border} ${text} group-hover:scale-115 transition-transform duration-500`}>
                    {React.cloneElement(cfg.icon, { size: 15 })}
                </div>
            </div>
            <div className="flex items-end gap-1.5 font-black relative z-10">
                <span className="text-4xl tracking-tight font-sans text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_3px_25px_rgba(255,255,255,0.8)] transition-all duration-500">
                    {displayValue}
                </span>
                <span className={`text-xs font-bold tracking-wider uppercase pb-1 drop-shadow-md ${text}`}>
                    {cfg.unit}
                </span>
            </div>
        </div>
    );
};

// =================================================================
// KOMPONEN UTAMA: DASHBOARD OVERVIEW VIEW
// =================================================================
export default function Overview({
    setActiveDetail,
    filteredTableData,
    searchQuery,
    setSearchQuery,
    activeAlarms,
    selectedDevice,
    sensorData,
    filterDate,
    setFilterDate
}) {

    const isMati = sensorData?.suhu === 0 && sensorData?.flow1 === 0;
    const isBermasalah = activeAlarms?.length > 0;

    // Laci memori penampung data resmi database lokal React
    const [toast, setToast] = useState(null);
    const [savedPagi, setSavedPagi] = useState('08:00');
    const [savedSore, setSavedSore] = useState('16:00');
    const [savedGramPagi, setSavedGramPagi] = useState(70);
    const [savedGramSore, setSavedGramSore] = useState(70);
    const [isManualFeedOn, setIsManualFeedOn] = useState(false);
    const [showManualConfirm, setShowManualConfirm] = useState(false);

    // Laci kotak form pengetikan user (Mengunci tulisan tanpa interupsi)
    const [inputPagi, setInputPagi] = useState('');
    const [inputSore, setInputSore] = useState('');
    const [inputGramPagi, setInputGramPagi] = useState('');
    const [inputGramSore, setInputGramSore] = useState('');

    // 🔥 KUNCI UTAMA: Pisahkan memori server (saved) dan ketikan user (input)
    const [savedGramManual, setSavedGramManual] = useState(70);
    const [inputGramManual, setInputGramManual] = useState('');

    // =================================================================
    // LOGIKA POLLING: MENGAMBIL DATA DARI SERVER TIAP 2 DETIK
    // =================================================================
    useEffect(() => {
        if (!selectedDevice) return;

        const fetchPakan = () => {
            fetch(`https://api.aquasafe.my.id/api/pakan/${selectedDevice}`)
                .then(res => res.json())
                .then(data => {

                    // Memaksa format teks waktu selalu rapi dua digit (09:00) anti-pecah
                    const formatJam = (val) => {
                        if (val === undefined || val === null || val === '') return '00:00';
                        if (typeof val === 'string' && val.includes(':')) {
                            const pecahan = val.split(':');
                            const hh = pecahan[0].trim().padStart(2, '0');
                            const mm = pecahan[1].trim().padStart(2, '0');
                            return `${hh}:${mm}`;
                        }
                        return val.toString().padStart(2, '0') + ':00';
                    };

                    const jamPagiTerformat = formatJam(data.pagi);
                    const jamSoreTerformat = formatJam(data.sore);

                    // Update data status text kecil neon
                    setSavedPagi(jamPagiTerformat);
                    setSavedSore(jamSoreTerformat);
                    if (data.sekarang !== undefined) setIsManualFeedOn(data.sekarang === 1);
                    if (data.gram_pagi !== undefined) setSavedGramPagi(data.gram_pagi);
                    if (data.gram_sore !== undefined) setSavedGramSore(data.gram_sore);

                    // 🔥 SERVER CUMA BOLEH UPDATE 'SAVED', DILARANG NYENTUH KOTAK 'INPUT'
                    if (data.gram_manual !== undefined) setSavedGramManual(data.gram_manual);
                })
                .catch(err => console.error("Gagal load data pakan:", err));
        };

        fetchPakan();
        const intervalId = setInterval(fetchPakan, 2000);
        return () => clearInterval(intervalId);
    }, [selectedDevice]);

    const showToast = (pesan, tipe) => {
        setToast({ pesan, tipe });
        setTimeout(() => setToast(null), 3000)
    }

    // =================================================================
    // LOGIKA KLIK TOMBOL SET JADWAL & GRAM PAKAN
    // =================================================================
    const handleSetPakan = async (waktu) => {
        const currentInputJam = waktu === 'pagi' ? inputPagi : inputSore;
        const currentInputGram = waktu === 'pagi' ? inputGramPagi : inputGramSore;

        // 2. Cegah tombol ditekan kalau kedua kotak (jam & gram) kosong sama sekali
        if (!currentInputJam && currentInputGram === '') {
            return showToast('❌ Isi waktu atau dosis gram yang mau diubah!', 'error');
        }

        // VALIDASI WAKTU STRICT (00:00 - 12:00 PAGI | 12:01 - 23:59 SORE)
        if (currentInputJam) {
            const [jam, menit] = currentInputJam.split(':').map(Number);

            if (waktu === 'pagi') {
                if (jam > 12 || (jam === 12 && menit > 0)) {
                    return showToast('❌ Jadwal Pagi hanya berlaku dari jam 00:00 - 12:00!', 'error');
                }
            } else if (waktu === 'sore') {
                if (jam < 12 || (jam === 12 && menit === 0)) {
                    return showToast('❌ Jadwal Sore hanya berlaku dari jam 12:01 - 23:59!', 'error');
                }
            }
        }

        let finalJadwalPagi = waktu === 'pagi' ? (inputPagi || savedPagi) : savedPagi;
        let finalJadwalSore = waktu === 'sore' ? (inputSore || savedSore) : savedSore;

        let finalGramPagi = waktu === 'pagi' ? (inputGramPagi !== '' ? parseInt(inputGramPagi) : savedGramPagi) : savedGramPagi;
        let finalGramSore = waktu === 'sore' ? (inputGramSore !== '' ? parseInt(inputGramSore) : savedGramSore) : savedGramSore;

        if (isNaN(finalGramPagi)) finalGramPagi = savedGramPagi;
        if (isNaN(finalGramSore)) finalGramSore = savedGramSore;

        try {
            const response = await fetch('https://api.aquasafe.my.id/api/feeder/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: selectedDevice,
                    jadwalPagi: finalJadwalPagi,
                    jadwalSore: finalJadwalSore,
                    gramPagi: finalGramPagi,
                    gramSore: finalGramSore
                })
            });
            const data = await response.json();

            if (data.success) {
                showToast(`✅ Jadwal ${waktu.toUpperCase()} telah diperbarui! Jika hari ini sudah diberi makan, jadwal baru berlaku besok.`, "success");

                if (waktu === 'pagi') {
                    setSavedPagi(finalJadwalPagi);
                    setSavedGramPagi(finalGramPagi);
                    setInputPagi('');
                    setInputGramPagi('');
                } else if (waktu === 'sore') {
                    setSavedSore(finalJadwalSore);
                    setSavedGramSore(finalGramSore);
                    setInputSore('');
                    setInputGramSore('');
                }
            }
        } catch (error) {
            console.error("Error:", error);
            showToast("❌ Gagal connect ke server!", "error");
        }
    };

    // =================================================================
    // LOGIKA KLIK TOMBOL BERI MAKAN INSTAN (MANUAL)
    // =================================================================

    // Fungsi 1: Mencegat klik tombol untuk nampilin pop-up
    const handleToggleClick = () => {
        const newState = !isManualFeedOn ? 1 : 0;
        if (newState === 1) {
            setShowManualConfirm(true);
        } else {
            executeManualFeed(0);
        }
    };

    // Fungsi 2: Sang Eksekutor (Berjalan kalau klik "Ya" di pop-up)
    const executeManualFeed = async (actionState) => {
        setShowManualConfirm(false);

        // 🔥 Logika Pintar: Kalau kotak input diisi, pakai itu. Kalau kosong, pakai data database (saved)
        let finalGramManual = inputGramManual !== '' ? parseInt(inputGramManual) : savedGramManual;
        if (isNaN(finalGramManual)) finalGramManual = savedGramManual;

        try {
            const response = await fetch('https://api.aquasafe.my.id/api/feeder/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: selectedDevice,
                    action: actionState,
                    gramManual: finalGramManual
                })
            });
            const data = await response.json();

            if (data.success) {
                setIsManualFeedOn(actionState === 1);

                // Kosongkan form input dan perbarui state lokal memori
                setInputGramManual('');
                setSavedGramManual(finalGramManual);

                showToast(`✅ Motor Pakan ${actionState === 1 ? 'Dinyalakan' : 'Dimatikan'}!`, "success");
            }
        } catch (error) {
            showToast("❌ Gagal connect ke server! Pastikan backend nyala.", "error");
        }
    };


    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">

            {/* Injeksi Teks Style CSS Custom */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
                input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(1) opacity(0.5); cursor: pointer;
                }
                input[type="number"]::-webkit-inner-spin-button, 
                input[type="number"]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type="number"] { -moz-appearance: textfield; }
            `}</style>

            <div className="xl:col-span-3 flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                    <GlassSensorCard title="Suhu Air" valueKey="suhu" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard title="pH Level" valueKey="ph" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard title="O2 Terlarut" valueKey="do" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard title="TDS Nutrisi" valueKey="tds" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard title="Flow 1" valueKey="flow1" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard title="Flow 2" valueKey="flow2" sensorData={sensorData} setActiveDetail={setActiveDetail} />

                    <div className="col-span-2 md:col-span-2 group relative backdrop-blur-2xl bg-gradient-to-br from-indigo-950/80 to-slate-900/80 p-4 rounded-3xl h-36 flex flex-col justify-between border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-500 shadow-xl overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 opacity-5 text-indigo-300 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                            <Timer size={100} />
                        </div>

                        <div className="flex justify-between items-center relative z-10 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                                    <Timer size={12} />
                                </div>
                                <h3 className="text-[10px] uppercase font-black tracking-widest text-indigo-100 drop-shadow-md">
                                    Kontrol Auto-Feeder
                                </h3>
                            </div>
                        </div>

                        <div className="flex flex-row gap-3 relative z-10 w-full h-full items-center">

                            <div className="flex flex-col gap-1.5 w-[58%] justify-center h-full">
                                {/* WIDGET PAGI */}
                                <div className="flex items-center justify-between bg-black/40 px-2 py-1.5 rounded-xl border border-white/5 shadow-sm">
                                    <div className="flex flex-col min-w-[65px]">
                                        <span className="text-[7px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Jadwal Pagi</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-black text-white tracking-tight">{savedPagi}</span>
                                            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[7px] font-bold px-1 py-0.5 rounded leading-none">{savedGramPagi}g</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <input
                                            type="time"
                                            value={inputPagi}
                                            onChange={(e) => setInputPagi(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-md text-white text-[9px] font-bold w-[65px] px-1.5 py-1 [color-scheme:dark] focus:outline-none focus:border-indigo-400 transition-colors"
                                        />
                                        <div className="relative flex items-center">
                                            <input
                                                type="number"
                                                placeholder="Gr"
                                                value={inputGramPagi}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (val === '') setInputGramPagi('');
                                                    else if (val >= 0 && val <= 140) setInputGramPagi(parseInt(val).toString());
                                                    else if (val > 140) setInputGramPagi('140');
                                                }}
                                                className="bg-white/5 border border-white/10 rounded-md text-white text-[9px] font-bold w-[45px] pl-1.5 pr-3 py-1 focus:outline-none focus:border-indigo-400 transition-colors text-center"
                                            />
                                        </div>
                                        <button onClick={() => handleSetPakan('pagi')} className="bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-md hover:bg-indigo-500 font-black tracking-wide transition-colors">SET</button>
                                    </div>
                                </div>

                                {/* WIDGET SORE */}
                                <div className="flex items-center justify-between bg-black/40 px-2 py-1.5 rounded-xl border border-white/5 shadow-sm">
                                    <div className="flex flex-col min-w-[65px]">
                                        <span className="text-[7px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Jadwal Sore</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-black text-white tracking-tight">{savedSore}</span>
                                            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[7px] font-bold px-1 py-0.5 rounded leading-none">{savedGramSore}g</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <input
                                            type="time"
                                            value={inputSore}
                                            onChange={(e) => setInputSore(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-md text-white text-[9px] font-bold w-[65px] px-1.5 py-1 [color-scheme:dark] focus:outline-none focus:border-indigo-400 transition-colors"
                                        />
                                        <div className="relative flex items-center">
                                            <input
                                                type="number"
                                                placeholder="Gr"
                                                value={inputGramSore}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (val === '') setInputGramSore('');
                                                    else if (val >= 0 && val <= 140) setInputGramSore(parseInt(val).toString());
                                                    else if (val > 140) setInputGramSore('140');
                                                }}
                                                className="bg-white/5 border border-white/10 rounded-md text-white text-[9px] font-bold w-[45px] pl-1.5 pr-3 py-1 focus:outline-none focus:border-indigo-400 transition-colors text-center"
                                            />
                                        </div>
                                        <button onClick={() => handleSetPakan('sore')} className="bg-indigo-600 text-white text-[8px] px-2 py-1 rounded-md hover:bg-indigo-500 font-black tracking-wide transition-colors">SET</button>
                                    </div>
                                </div>
                            </div>

                            {/* KANAN: Manual Feed */}
                            <div className="flex flex-col gap-1.5 w-[42%] justify-center h-full border-l border-white/[0.08] pl-3">
                                <div className="flex items-center justify-between bg-black/40 px-2 py-1.5 rounded-xl border border-white/5 shadow-sm">
                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Dosis Instan</span>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            placeholder={savedGramManual.toString()} // 🔥 Trik Placeholder Transparan
                                            value={inputGramManual}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (val === '') setInputGramManual('');
                                                else if (val >= 0 && val <= 140) setInputGramManual(parseInt(val).toString());
                                                else if (val > 140) setInputGramManual('140');
                                            }}
                                            className="bg-white/5 border border-white/10 rounded-md text-white text-[10px] font-black focus:outline-none focus:border-indigo-400 text-center w-[50px] py-1 pr-3 placeholder:text-white/40"
                                        />
                                        <span className="absolute right-1.5 text-[8px] font-bold text-slate-400 pointer-events-none">g</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleToggleClick}
                                    className={`flex-1 flex items-center justify-center gap-1.5 text-white text-[9px] font-black tracking-widest uppercase rounded-xl border transition-all duration-300 h-full ${isManualFeedOn
                                        ? "bg-gradient-to-r from-red-600 to-red-500 border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                                        : "bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
                                        }`}
                                    type="button"
                                >
                                    <Timer size={14} className={isManualFeedOn ? "animate-spin" : ""} />
                                    <span>{isManualFeedOn ? "STOP MOTOR" : "MAKAN INSTAN"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABEL CATATAN LOG RIWAYAT */}
                <div className="backdrop-blur-2xl bg-[#0f172a]/95 border border-white/10 rounded-[2rem] p-6 flex flex-col h-[380px] shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-15 bg-blue-500 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-2 border-b border-white/[0.05] pb-5 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/25 border border-blue-500/35 rounded-xl">
                                <Activity size={18} className="text-blue-300 animate-pulse" />
                            </div>
                            <h2 className="text-sm font-black tracking-widest uppercase text-white drop-shadow-sm">Riwayat Catatan Sistem</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto flex items-center group">
                                <div className="absolute left-4 z-10 pointer-events-none text-slate-400 group-hover:text-cyan-400 transition-colors">
                                    <Calendar size={15} />
                                </div>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="bg-[#0a0f1a] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500/50 text-slate-200 w-full sm:w-40 transition-colors shadow-inner [color-scheme:dark]"
                                />
                                {filterDate && (
                                    <button onClick={() => setFilterDate('')} className="absolute right-9 text-[10px] text-red-400 hover:text-red-300 font-bold z-20">X</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar scroll-smooth relative z-10">
                        <table className="w-full text-left text-sm text-slate-200 border-collapse">
                            <thead className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-xl z-20 before:content-[''] before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-white/[0.05]">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <th className="pb-4 pt-4 pl-4 w-[24%] rounded-tl-xl">Tanggal & Waktu</th>
                                    <th className="pb-4 pt-4 w-[19%] text-blue-300">Suhu Air</th>
                                    <th className="pb-4 pt-4 w-[19%] text-fuchsia-300">pH Level</th>
                                    <th className="pb-4 pt-4 w-[19%] text-sky-300">O2 Terlarut</th>
                                    <th className="pb-4 pt-4 w-[19%] text-lime-300 rounded-tr-xl">TDS Nutrisi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTableData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-16">
                                            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                                                <DatabaseBackup size={35} className="opacity-45 mb-1" />
                                                <span className="text-xs font-bold tracking-widest uppercase opacity-75">Data Tidak Ditemukan</span>
                                                <span className="text-[10px] opacity-55">Coba ubah filter tanggal atau pilih opsi perangkat lain.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTableData.map((row) => (
                                        <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.05] transition-colors group">
                                            <td className="py-3 pl-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{row.date ? row.date : 'Hari Ini'}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">{row.time}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 font-bold text-white text-sm">
                                                {row.temp} <span className="text-[10px] text-slate-500 font-normal ml-0.5">°C</span>
                                            </td>
                                            <td className="py-3 font-bold text-white text-sm">
                                                {row.ph}
                                            </td>
                                            <td className="py-3 font-bold text-white text-sm">
                                                {row.doVal} <span className="text-[10px] text-slate-500 font-normal ml-0.5">mg/L</span>
                                            </td>
                                            <td className="py-3 font-bold text-white text-sm">
                                                {row.tdsVal} <span className="text-[10px] text-lime-600 font-normal ml-0.5">PPM</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SIDEBAR LOG ALARM DAN INFORMASI STATUS TELEMETRI KANAN */}
            <div className="flex flex-col gap-6 h-full">
                <div className="backdrop-blur-xl bg-[#131b2c]/95 border border-white/10 rounded-[2rem] p-6 flex flex-col relative overflow-hidden flex-1 shadow-xl">
                    <AlertTriangle className={`absolute -right-8 -bottom-8 w-40 h-40 opacity-[0.03] pointer-events-none ${activeAlarms.length > 0 ? 'text-red-400 animate-pulse opacity-[0.09]' : 'text-slate-500'}`} />

                    <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-4 relative z-10">
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                            <AlertTriangle size={15} className={activeAlarms.length > 0 ? 'text-red-400 animate-pulse' : ''} />
                            <h2 className="text-[10px] uppercase tracking-widest">Alarms Log</h2>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeAlarms.length > 0 ? 'bg-red-500/25 text-red-300' : 'bg-black/35 text-slate-400 border border-white/5'}`}>
                            {activeAlarms.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {activeAlarms.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-85 py-4">
                                <CheckCircle2 size={30} className="text-emerald-400/80" strokeWidth={1.5} />
                                <p className="text-[10px] font-bold tracking-widest uppercase mt-1">Sistem Optimal</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-2">
                                {activeAlarms.map((alarm, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border backdrop-blur-md ${alarm.type === 'critical' ? 'bg-red-500/10 border-red-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest ${alarm.type === 'critical' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>{alarm.type}</span>
                                            <span className="text-[9px] text-slate-300 font-mono">{alarm.time}</span>
                                        </div>
                                        <p className={`text-xs font-bold leading-relaxed ${alarm.type === 'critical' ? 'text-red-300' : 'text-yellow-300'}`}>{alarm.msg}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="backdrop-blur-xl bg-[#131b2c]/95 border border-white/10 rounded-[2rem] p-6 h-fit flex flex-col justify-between relative overflow-hidden shadow-xl">
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[65px] pointer-events-none ${isMati ? 'bg-red-500/20' : isBermasalah ? 'bg-yellow-500/20' : 'bg-cyan-500/20'}`} />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Node Telemetri</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isMati ? 'bg-red-500/25 text-red-300 border-red-500/45' : isBermasalah ? 'bg-yellow-500/25 text-yellow-300 border-yellow-500/45' : 'bg-cyan-500/25 text-cyan-300 border-cyan-500/45'}`}>
                                {isMati ? 'TERPUTUS' : isBermasalah ? 'PERINGATAN' : 'TERKALIBRASI'}
                            </span>
                        </div>

                        <p className="text-xl font-bold text-white">{selectedDevice || 'Memuat...'}</p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {isMati
                                ? "Sistem tidak mendeteksi aliran perangkat. Periksa power alat."
                                : "Akurasi metrik dikoreksi secara terpusat oleh mesin Cloud Auto-Offset."}
                        </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/[0.05] text-[11px] text-slate-300 space-y-2.5 relative z-10">
                        <div className="flex justify-between items-center">
                            <span>Koneksi Hardware:</span>
                            <span className={`font-bold flex items-center gap-1.5 ${isMati ? 'text-red-400' : 'text-emerald-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMati ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                                {isMati ? 'DISCONNECTED' : 'SECURE'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Periode Kalibrasi:</span>
                            <span className="text-slate-300 font-mono text-xs bg-black/35 px-2 py-0.5 rounded border border-white/5">Otomatis (Server)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* COMPONENT TOAST NOTIFICATION FLOATING */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 backdrop-blur-xl bg-[#0f172a]/90 px-5 py-3.5 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-3 ${toast.tipe === 'success' ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                    <div className={`p-1.5 rounded-full ${toast.tipe === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {toast.tipe === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <p className="text-xs font-bold tracking-wide text-slate-200">{toast.pesan}</p>
                </div>
            )}

            {/* 🔥 KODE BARU: POP-UP KONFIRMASI MANUAL FEED */}
            {showManualConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f1a]/80 backdrop-blur-sm px-4 animate-in fade-in duration-300">
                    <div className="bg-[#131b2c] border border-white/10 p-7 rounded-[2rem] shadow-2xl max-w-sm w-full flex flex-col gap-4 text-center relative overflow-hidden">
                        {/* Efek Glow di belakang pop-up */}
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-[40px] pointer-events-none" />

                        <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-1 relative z-10">
                            <AlertTriangle size={28} />
                        </div>

                        <h3 className="text-lg font-black text-white tracking-wide uppercase relative z-10">
                            Konfirmasi Pakan
                        </h3>

                        <p className="text-xs font-medium leading-relaxed text-slate-300 relative z-10 px-2">
                            {/* 🔥 Teks Pop-Up Pintar: Pakai input kalau ada, pakai saved kalau kotak inputnya kosong */}
                            Apakah Anda yakin ingin memberikan pakan instan sebanyak <span className="font-black text-cyan-400 text-sm">{inputGramManual !== '' ? inputGramManual : savedGramManual}g</span> sekarang? Motor otomatis akan berputar.
                        </p>

                        <div className="flex gap-3 mt-5 relative z-10">
                            <button
                                onClick={() => setShowManualConfirm(false)}
                                className="flex-1 px-4 py-3 bg-black/40 hover:bg-black/60 text-slate-300 font-black text-[10px] tracking-widest uppercase rounded-xl transition-colors border border-white/5"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => executeManualFeed(1)}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                            >
                                Ya, Berikan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}