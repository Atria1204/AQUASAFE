import React, { useState, useEffect } from 'react';
import { Activity, Calendar, X, DatabaseBackup } from 'lucide-react';

/**
 * Komponen HistoryTable
 * Menampilkan tabel riwayat parameter sensor dengan fitur paginasi dan filter tanggal
 */

const HistoryTable = React.memo(function HistoryTable({
    filteredTableData,
    searchQuery,
    filterDate,
    setFilterDate,
    className = ""
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20; // 20 data per halaman agar tidak terlalu panjang di HP

    // Reset ke halaman 1 jika user mencari teks atau mengubah filter tanggal
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterDate]);

    // Hitung total halaman & potong data sesuai halaman aktif
    const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
    const paginatedData = filteredTableData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className={`backdrop-blur-2xl bg-surface/95 border border-white/10 rounded-[2rem] p-4 md:p-5 flex flex-col flex-1 min-h-[380px] xl:min-h-0 shadow-2xl relative overflow-hidden ${className}`}>
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-15 bg-blue-500 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-2 border-b border-white/[0.05] pb-1.5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/25 border border-blue-500/35 rounded-xl">
                        <Activity size={14} className="text-blue-300 animate-pulse" />
                    </div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-slate-200 drop-shadow-sm">Riwayat Catatan Sistem</h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex items-center">
                        {!filterDate ? (
                            <label className="relative flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-cyan-400 cursor-pointer transition-all shadow-inner text-[10px] font-black uppercase tracking-wider group">
                                <Calendar size={13} className="transition-transform group-hover:scale-110" />
                                <span>Tanggal</span>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer [color-scheme:dark]"
                                />
                            </label>
                        ) : (
                            <div className="relative flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.05)] text-[10px] font-black uppercase tracking-wider">
                                <Calendar size={13} className="text-cyan-400" />
                                <span className="cursor-pointer" onClick={(e) => {
                                    const input = e.currentTarget.parentNode.querySelector('input[type="date"]');
                                    if (input && input.showPicker) input.showPicker();
                                }}>
                                    {(() => {
                                        try {
                                            const [y, m, d] = filterDate.split('-');
                                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                                            return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
                                        } catch (err) {
                                            return filterDate;
                                        }
                                    })()}
                                </span>
                                <button onClick={() => setFilterDate('')} className="ml-1 text-red-400 hover:text-red-300 hover:scale-115 transition-transform flex items-center justify-center">
                                    <X size={12} className="stroke-[3]" />
                                </button>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                    className="opacity-0 absolute inset-0 w-full h-full pointer-events-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto pr-3 custom-scrollbar scroll-smooth relative z-10 min-h-0">
                <table className="w-full min-w-[600px] text-left text-sm text-slate-200 border-collapse">
                    <thead className="sticky top-0 bg-surface/95 backdrop-blur-xl z-20 before:content-[''] before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-white/[0.05] whitespace-nowrap">
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
                            paginatedData.map((row) => (
                                <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.05] transition-colors group">
                                    <td className="py-3 pl-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{row.date ? row.date : 'Hari Ini'}</span>
                                            <span className="font-mono text-[10px] text-slate-400">{row.time}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 font-bold text-white text-sm whitespace-nowrap">
                                        {row.temp} <span className="text-[10px] text-slate-500 font-normal ml-0.5">°C</span>
                                    </td>
                                    <td className="py-3 font-bold text-white text-sm whitespace-nowrap">
                                        {row.ph}
                                    </td>
                                    <td className="py-3 font-bold text-white text-sm whitespace-nowrap">
                                        {row.doVal} <span className="text-[10px] text-slate-500 font-normal ml-0.5">mg/L</span>
                                    </td>
                                    <td className="py-3 font-bold text-white text-sm whitespace-nowrap">
                                        {row.tdsVal} <span className="text-[10px] text-lime-600 font-normal ml-0.5">PPM</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-white/[0.05] flex justify-between items-center">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-full text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-mono text-slate-400">
                        {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-full text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
});

export default HistoryTable;
