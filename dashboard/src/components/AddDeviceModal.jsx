import React, { useState } from 'react';
import { X, CirclePlus } from 'lucide-react';

export default function AddDeviceModal({ isOpen, onClose, onAdd }) {
    const [deviceId, setDeviceId] = useState('');
    const [namaKolam, setNamaKolam] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!deviceId || !namaKolam) return alert('ID Perangkat dan Nama Kolam wajib diisi!');

        setIsLoading(true);
        onAdd({ device_id: deviceId, nama_kolam: namaKolam });

        setDeviceId('');
        setNamaKolam('');
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-surface-card border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-2 text-cyan-400 mb-4">
                    <CirclePlus size={20} />
                    <h3 className="font-bold tracking-wider uppercase text-xs">Tambahkan Kolam Baru</h3>
                </div>

                <h2 className="text-xl font-bold text-white mb-6">Daftarkan Alat Anda</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                            ID Perangkat
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: AQUA-003"
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                            className="w-full bg-surface-card border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                            required
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">ID harus sama persis dengan yang tertera pada alat.</span>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                            Nama Kolam
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Kolam Pembibitan Lele"
                            value={namaKolam}
                            onChange={(e) => setNamaKolam(e.target.value)}
                            className="w-full bg-bg-overlay border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold px-5 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity shadow-lg"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Kolam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}