import { useState } from 'react';

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [nama, setNama] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        const endpoint = isRegistering ? '/api/register' : '/api/login';
        const payload = isRegistering ? { nama, email, password } : { email, password };

        try {
            const res = await fetch(`https://api.aquasafe.my.id${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                if (isRegistering) {
                    setMessage({ text: 'Daftar berhasil! Silakan masuk.', type: 'success' });
                    setIsRegistering(false);
                    setPassword('');
                } else {
                    onLogin(data.userId);
                }
            } else {
                setMessage({ text: data.message, type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Coba lagi beberapa saat', type: 'error' });
        }
    };

    return (
        // Background utama yang lebih gelap dengan animasi overflow hidden
        <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">

            {/* Bola Cahaya (Orbs) buat efek Glassmorphism */}
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Kartu Login Glassmorphism */}
            <div className="relative bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-md transition-all duration-500 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] z-10">

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        Aqua<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Safe</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
                        {isRegistering ? 'Buat Akun' : ' Selamat Datang!'}
                    </p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl mb-6 text-sm text-center border backdrop-blur-sm transition-all ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/30 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isRegistering && (
                        <div className="space-y-1">
                            <input type="text" placeholder="Nama Lengkap" value={nama} onChange={(e) => setNama(e.target.value)} required
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" />
                        </div>
                    )}

                    <div className="space-y-1">
                        <input type="email" placeholder="Masukan Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" />
                    </div>

                    <div className="space-y-1">
                        <input type="password" placeholder="Masukan Password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" />
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3.5 rounded-xl font-bold tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 mt-4">
                        {isRegistering ? 'DAFTAR SEKARANG' : 'MASUK'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    {isRegistering ? 'Sudah punya akses? ' : 'Belum terdaftar? '}
                    <button onClick={() => { setIsRegistering(!isRegistering); setMessage({ text: '', type: '' }); }} className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                        {isRegistering ? 'Login di sini' : 'Daftar sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
}