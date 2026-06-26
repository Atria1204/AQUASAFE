import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Timer, X } from 'lucide-react';

/**
 * Komponen AutoFeederCard
 * Khusus menangani pengaturan jadwal pakan pagi/sore dan pakan instan (manual)
 */
export default function AutoFeederCard({
    selectedDevice,
    savedPagi,
    savedSore,
    savedGramPagi,
    savedGramSore,
    savedGramManual,
    isManualFeedOn,
    handleSetPakan,
    executeManualFeed,
    showToast,
    className = ""
}) {
    // State untuk form pengetikan (lokal di komponen ini)
    const [inputPagi, setInputPagi] = useState('');
    const [inputSore, setInputSore] = useState('');
    const [inputGramPagi, setInputGramPagi] = useState('');
    const [inputGramSore, setInputGramSore] = useState('');
    const [inputGramManual, setInputGramManual] = useState('');
    const [showManualConfirm, setShowManualConfirm] = useState(false);

    // Mencegat tombol pakan instan untuk memunculkan konfirmasi modal
    const handleToggleClick = () => {
        const newState = !isManualFeedOn ? 1 : 0;
        if (newState === 1) {
            setShowManualConfirm(true);
        } else {
            executeManualFeed(0, '');
        }
    };

    // Eksekusi pemberian pakan manual setelah konfirmasi
    const handleConfirmManual = () => {
        executeManualFeed(1, inputGramManual);
        setInputGramManual('');
        setShowManualConfirm(false);
    };

    // Validasi & Kirim Jadwal Pagi/Sore
    const onSubmitSchedule = (waktu) => {
        const currentInputJam = waktu === 'pagi' ? inputPagi : inputSore;
        const currentInputGram = waktu === 'pagi' ? inputGramPagi : inputGramSore;

        // Validasi kosong
        if (!currentInputJam && currentInputGram === '') {
            return showToast('❌ Isi waktu atau dosis gram yang mau diubah!', 'error');
        }

        // Validasi waktu strict
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

        // Teruskan ke API handler di parent
        handleSetPakan(waktu, currentInputJam, currentInputGram, () => {
            // Callback pembersihan form jika sukses
            if (waktu === 'pagi') {
                setInputPagi('');
                setInputGramPagi('');
            } else {
                setInputSore('');
                setInputGramSore('');
            }
        });
    };

    return (
        <div className={`order-last md:order-none col-span-2 md:col-span-1 row-span-2 group relative backdrop-blur-2xl bg-gradient-to-br from-indigo-950/80 to-slate-900/80 p-4 2xl:p-5 rounded-3xl h-full flex flex-col justify-between border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-500 shadow-xl overflow-hidden cursor-default ${className}`}>
            <div className="absolute -right-6 -bottom-6 opacity-5 text-indigo-300 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                <Timer size={100} />
            </div>

            <div className="flex justify-between items-center relative z-10 mb-2.5 border-b border-white/[0.05] pb-2">
                <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                        <Timer size={11} />
                    </div>
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-200 drop-shadow-md">
                        Auto-Feeder
                    </h3>
                </div>
            </div>


            <div className="flex flex-col justify-between relative z-10 w-full h-full mt-0.5">
                <div className="flex flex-col gap-0.5">
                    {/* Jadwal Pagi */}
                    <div className="flex flex-col bg-black/40 px-3 py-1 rounded-xl border border-white/5 shadow-sm gap-0.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Jadwal Pagi</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-black text-white tracking-tight">{savedPagi}</span>
                                <span className="text-[10px] font-bold text-indigo-300">({savedGramPagi}g)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 justify-between w-full">
                            <div className="flex gap-1.5 flex-1">
                                <input
                                    type="time"
                                    value={inputPagi}
                                    onChange={(e) => setInputPagi(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-md text-white text-[10px] font-bold w-full max-w-[80px] px-1.5 py-1 focus:outline-none focus:border-indigo-400"
                                />
                                <input
                                    type="number"
                                    placeholder={savedGramPagi.toString()}
                                    value={inputGramPagi}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val === '') setInputGramPagi('');
                                        else if (val >= 0 && val <= 140) setInputGramPagi(parseInt(val).toString());
                                        else if (val > 140) setInputGramPagi('140');
                                    }}
                                    className="bg-white/5 border border-white/10 rounded-md text-white text-[10px] font-bold w-full max-w-[45px] px-1 py-1 text-center focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <button
                                onClick={() => onSubmitSchedule('pagi')}
                                className="bg-indigo-600 text-white text-[9px] px-3 py-1 rounded-md hover:bg-indigo-500 font-black tracking-wide ml-1 shrink-0 shadow-sm"
                            >
                                SET
                            </button>
                        </div>
                    </div>

                    {/* Jadwal Sore */}
                    <div className="flex flex-col bg-black/40 px-3 py-1 rounded-xl border border-white/5 shadow-sm gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Jadwal Sore</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-black text-white tracking-tight">{savedSore}</span>
                                <span className="text-[10px] font-bold text-indigo-300">({savedGramSore}g)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 justify-between w-full">
                            <div className="flex gap-1.5 flex-1">
                                <input
                                    type="time"
                                    value={inputSore}
                                    onChange={(e) => setInputSore(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-md text-white text-[10px] font-bold w-full max-w-[80px] px-1.5 py-1 focus:outline-none focus:border-indigo-400"
                                />
                                <input
                                    type="number"
                                    placeholder={savedGramSore.toString()}
                                    value={inputGramSore}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val === '') setInputGramSore('');
                                        else if (val >= 0 && val <= 140) setInputGramSore(parseInt(val).toString());
                                        else if (val > 140) setInputGramSore('140');
                                    }}
                                    className="bg-white/5 border border-white/10 rounded-md text-white text-[10px] font-bold w-full max-w-[45px] px-1 py-1 text-center focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <button
                                onClick={() => onSubmitSchedule('sore')}
                                className="bg-indigo-600 text-white text-[9px] px-3 py-1 rounded-md hover:bg-indigo-500 font-black tracking-wide ml-1 shrink-0 shadow-sm"
                            >
                                SET
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bagian Pakan Instan / Manual */}
                <div className="flex flex-col justify-center bg-black/40 px-4 py-1.5 rounded-2xl border border-white/5 shadow-sm mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Instan</span>
                            <span className="text-[8px] font-medium text-slate-500">Pemberian Manual</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                placeholder={savedGramManual.toString()}
                                value={inputGramManual}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val === '') setInputGramManual('');
                                    else if (val >= 0 && val <= 140) setInputGramManual(parseInt(val).toString());
                                    else if (val > 140) setInputGramManual('140');
                                }}
                                className="bg-white/5 border border-white/10 rounded-lg text-white text-[11px] font-bold w-[45px] px-1.5 py-1 text-center focus:outline-none focus:border-indigo-400"
                            />
                            <span className="text-[9px] font-bold text-slate-400">g</span>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleClick}
                        className={`w-full flex items-center justify-center gap-2 text-white text-[9px] font-black tracking-widest uppercase rounded-xl border py-2 px-4 ${isManualFeedOn ? "bg-red-600 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" : "bg-emerald-600 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-transform duration-300"}`}
                    >
                        <Timer size={13} className={isManualFeedOn ? "animate-spin" : ""} />
                        <span>{isManualFeedOn ? "STOP PEMBERIAN" : "BERI PAKAN SEKARANG"}</span>
                    </button>
                </div>
            </div>

            {/* Modal Pop-up Konfirmasi Manual */}
            {showManualConfirm && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-overlay/80 backdrop-blur-sm px-4 animate-in fade-in duration-300">
                    <div className="bg-surface-card border border-white/10 p-7 rounded-[2rem] shadow-2xl max-w-sm w-full flex flex-col gap-4 text-center relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl" />
                        <div className="mx-auto p-3 bg-blue-500/10 text-cyan-400 rounded-full border border-cyan-500/20 w-fit">
                            <Timer size={26} className="animate-pulse" />
                        </div>

                        <h3 className="text-sm font-black tracking-widest text-white uppercase relative z-10">
                            Konfirmasi Pakan
                        </h3>

                        <p className="text-xs font-medium leading-relaxed text-slate-300 relative z-10 px-2">
                            Apakah Anda yakin ingin memberikan pakan instan sebanyak <span className="font-black text-cyan-400 text-sm">{inputGramManual !== '' ? inputGramManual : savedGramManual}g</span> sekarang? Motor otomatis akan berputar.
                        </p>

                        <div className="flex gap-3 mt-5 relative z-10">
                            <button
                                onClick={() => setShowManualConfirm(false)}
                                className="flex-1 px-4 py-3 bg-black/40 hover:bg-red-500/10 hover:text-red-500 hover:border-red-700/20 text-slate-300 font-black text-[10px] tracking-widest uppercase rounded-xl transition-all border border-white/5"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmManual}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                            >
                                Ya, Berikan
                            </button>
                        </div>
                    </div>
                </div>,
                document.body // Renders the modal node directly inside <body>
            )}

        </div>
    );
}
