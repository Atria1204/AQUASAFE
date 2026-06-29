import React, { useState, useEffect, useCallback } from 'react';
import {
    Thermometer, FlaskConical, Wind, Leaf, Waves, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { API_BASE_URL } from '../config';


import AutoFeederCard from './AutoFeederCard';
import HistoryTable from './HistoryTable';
import AlarmsLog from './AlarmsLog';
import SistemDanPakan from './SistemDanPakan';

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
const GlassSensorCard = ({ title, valueKey, sensorData, setActiveDetail, className = "" }) => {
    const cfg = sensorConfig[title];
    const val = sensorData?.[valueKey];
    const displayValue = val !== null ? val.toFixed(title === 'pH Level' ? 2 : 1) : '0.0';

    let isBahaya = false;
    if (val !== undefined) {
        if (valueKey === 'suhu' && (val > 30 || val < 24)) isBahaya = true;
        if (valueKey === 'ph' && (val < 5.5 || val > 8.0)) isBahaya = true;
        if (valueKey === 'do' && val < 3.0) isBahaya = true;
        if (valueKey === 'tds' && (val > 1000 || val < 300)) isBahaya = true;
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
            className={`group relative cursor-pointer backdrop-blur-2xl bg-gradient-to-br ${bgBase} p-5 rounded-3xl w-full h-full min-h-[110px] flex flex-col justify-between border ${border} hover:border-white/60 transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.03] ${glow} overflow-hidden shadow-lg hover:z-10 ${className}`}
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
// KOMPONEN UTAMA: DASHBOARD OVERVIEW VIEW (ORCHESTRATOR)
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
    const isMati = !sensorData?.lastUpdated || (Date.now() - sensorData.lastUpdated > 300000);

    // State untuk menyimpan data pakan resmi dari server (database)
    const [toast, setToast] = useState(null);
    const [savedPagi, setSavedPagi] = useState('08:00');
    const [savedSore, setSavedSore] = useState('16:00');
    const [savedGramPagi, setSavedGramPagi] = useState(70);
    const [savedGramSore, setSavedGramSore] = useState(70);
    const [isManualFeedOn, setIsManualFeedOn] = useState(false);
    const [savedGramManual, setSavedGramManual] = useState(70);

    // Helper untuk floating toast notification
    const showToast = (pesan, tipe) => {
        setToast({ pesan, tipe });
        setTimeout(() => setToast(null), 3000);
    };

    // =================================================================
    // LOGIKA SINKRONISASI JADWAL PAKAN DARI DATA SENSOR
    // =================================================================
    useEffect(() => {
        if (!sensorData || !sensorData.pakan) return;

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

        const pakan = sensorData.pakan;
        setSavedPagi(formatJam(pakan.pagi));
        setSavedSore(formatJam(pakan.sore));
        if (pakan.sekarang !== undefined) setIsManualFeedOn(pakan.sekarang === 1);
        if (pakan.gram_pagi !== undefined) setSavedGramPagi(pakan.gram_pagi);
        if (pakan.gram_sore !== undefined) setSavedGramSore(pakan.gram_sore);
        if (pakan.gram_manual !== undefined) setSavedGramManual(pakan.gram_manual);
    }, [sensorData]);

    // =================================================================
    // LOGIKA KLIK TOMBOL SET JADWAL & GRAM PAKAN
    // =================================================================
    const handleSetPakan = useCallback(async (waktu, currentInputJam, currentInputGram, onSuccess) => {
        let finalJadwalPagi = waktu === 'pagi' ? (currentInputJam || savedPagi) : savedPagi;
        let finalJadwalSore = waktu === 'sore' ? (currentInputJam || savedSore) : savedSore;

        let finalGramPagi = waktu === 'pagi' ? (currentInputGram !== '' ? parseInt(currentInputGram) : savedGramPagi) : savedGramPagi;
        let finalGramSore = waktu === 'sore' ? (currentInputGram !== '' ? parseInt(currentInputGram) : savedGramSore) : savedGramSore;

        if (isNaN(finalGramPagi)) finalGramPagi = savedGramPagi;
        if (isNaN(finalGramSore)) finalGramSore = savedGramSore;

        try {
            const response = await fetch(`${API_BASE_URL}/api/feeder/schedule`, {
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
                } else if (waktu === 'sore') {
                    setSavedSore(finalJadwalSore);
                    setSavedGramSore(finalGramSore);
                }
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Error:", error);
            showToast("❌ Gagal connect ke server!", "error");
        }
    }, [savedPagi, savedSore, savedGramPagi, savedGramSore, selectedDevice]);

    // =================================================================
    // LOGIKA KLIK TOMBOL BERI MAKAN INSTAN (MANUAL)
    // =================================================================
    const executeManualFeed = useCallback(async (actionState, inputGramManual) => {
        let finalGramManual = inputGramManual !== '' ? parseInt(inputGramManual) : savedGramManual;
        if (isNaN(finalGramManual)) finalGramManual = savedGramManual;

        try {
            const response = await fetch(`${API_BASE_URL}/api/feeder/manual`, {
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
                setSavedGramManual(finalGramManual);
                showToast(`✅ Motor Pakan ${actionState === 1 ? 'Dinyalakan' : 'Dimatikan'}!`, "success");
            }
        } catch (error) {
            showToast("❌ Gagal connect ke server! Pastikan backend nyala.", "error");
        }
    }, [savedGramManual, selectedDevice]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0 animate-in fade-in duration-700">
            {/* Injeksi Teks Style CSS Custom */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 7px; height: 7px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
                input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(1) opacity(0.5); cursor: pointer;
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
                input[type="number"]::-webkit-inner-spin-button, 
                input[type="number"]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type="number"] { -moz-appearance: textfield; }
            `}</style>

            {/* Kolom 1 (Sensor & Tabel Riwayat) */}
            <div className="contents xl:flex xl:flex-col xl:col-span-3 gap-6 h-full flex-1 min-h-0">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-rows-2 gap-4 md:gap-5 xl:h-[285px] order-1 xl:order-1">
                    <GlassSensorCard className="order-1 md:order-none" title="Suhu Air" valueKey="suhu" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard className="order-2 md:order-none" title="pH Level" valueKey="ph" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard className="order-3 md:order-none" title="O2 Terlarut" valueKey="do" sensorData={sensorData} setActiveDetail={setActiveDetail} />

                    <AutoFeederCard
                        selectedDevice={selectedDevice}
                        savedPagi={savedPagi}
                        savedSore={savedSore}
                        savedGramPagi={savedGramPagi}
                        savedGramSore={savedGramSore}
                        savedGramManual={savedGramManual}
                        isManualFeedOn={isManualFeedOn}
                        handleSetPakan={handleSetPakan}
                        executeManualFeed={executeManualFeed}
                        showToast={showToast}
                    />

                    <GlassSensorCard className="order-5 md:order-none" title="Flow 1" valueKey="flow1" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard className="order-6 md:order-none" title="Flow 2" valueKey="flow2" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                    <GlassSensorCard className="order-4 md:order-none" title="TDS Nutrisi" valueKey="tds" sensorData={sensorData} setActiveDetail={setActiveDetail} />
                </div>

                <HistoryTable
                    filteredTableData={filteredTableData}
                    searchQuery={searchQuery}
                    filterDate={filterDate}
                    setFilterDate={setFilterDate}
                    className="order-4 xl:order-2"
                />
            </div>

            {/* Kolom 2 (Sistem & Pakan, Alarms Log) */}
            <div className="contents xl:flex xl:flex-col gap-6 h-full flex-1 min-h-0">
                <SistemDanPakan
                    sensorData={sensorData}
                    savedPagi={savedPagi}
                    savedSore={savedSore}
                    isMati={isMati}
                    className="order-3 xl:order-1"
                />

                <AlarmsLog
                    activeAlarms={activeAlarms}
                    className="order-2 xl:order-2"
                />
            </div>

            {/* Floating Toast Notification */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 backdrop-blur-xl bg-surface/90 px-5 py-3.5 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-3 ${toast.tipe === 'success' ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
                    <div className={`p-1.5 rounded-full ${toast.tipe === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {toast.tipe === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <p className="text-xs font-bold tracking-wide text-slate-200">{toast.pesan}</p>
                </div>
            )}
        </div>
    );
}