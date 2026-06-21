import { useState } from 'react';
import { User, Lock, Mail } from 'lucide-react'; // Import icon agar mirip gambar

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
                    onLogin(data.userId, data.nama);
                }
            } else {
                setMessage({ text: data.message, type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Coba lagi beberapa saat', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans text-slate-200 bg-[url('/background1.jpg')] bg-cover bg-center relative">

            {/* Overlay Gelap agar teks mudah dibaca dan background tidak merusak mata */}
            <div className="absolute inset-0 bg-[#030712]/85 backdrop-blur-sm z-0"></div>

            {/* SISI KIRI: Logo Utama & Slogan */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 relative z-10">
                {/* Logo yang diperbesar seukuran teks */}
                <div className="flex items-center gap-6 mb-6">
                    <img src="/logo1.png" alt="AquaSafe Logo" className="w-20 h-auto drop-shadow-2xl" />
                    <span className="text-6xl font-extrabold tracking-tight drop-shadow-lg">
                        <span className="text-white">Aqua</span>
                        <span className="text-primary">Safe</span>
                    </span>

                </div>
                <p className="text-slate-300 text-lg leading-relaxed max-w-md border-l-4 border-primary pl-4 font-medium">
                    Pantau kualitas dan kendalikan perangkat dalam satu sentuhan.
                </p>
            </div>


            {/* SISI KANAN: Form Minimalis */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 relative z-10">
                <div className="w-full max-w-md bg-surface/60 backdrop-blur-xl p-10 rounded-2xl border border-white/10 shadow-2xl">

                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {isRegistering ? 'Daftar Akun Baru' : 'Selamat Datang!'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {isRegistering ? 'Silakan isi formulir di bawah untuk mendaftar.' : 'Silakan masuk menggunakan akun Anda.'}
                        </p>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-xl mb-6 text-sm text-center font-bold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {isRegistering && (
                            <div>
                                <label htmlFor="nama" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nama Lengkap</label>
                                <div className="relative group">
                                    <input id="nama" type="text" placeholder="Masukkan Nama" value={nama} onChange={(e) => setNama(e.target.value)} required
                                        className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary transition-all" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email</label>
                            <div className="relative group">
                                <input id="email" type="email" placeholder="Masukkan Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary transition-all" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                            </div>
                            <div className="relative group">
                                <input id="password" type="password" placeholder="Masukkan Password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl py-3.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary transition-all" />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-primary hover:bg-cyan-400 text-[#030712] py-4 rounded-xl font-bold tracking-wide transition-all mt-4 shadow-lg shadow-primary/10 hover:-translate-y-0.5">
                            {isRegistering ? 'DAFTAR' : 'MASUK'}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/10 pt-6">
                        <span className="text-sm font-medium text-slate-400">
                            {isRegistering ? 'Sudah memiliki akun? ' : 'Belum memiliki akun? '}
                        </span>
                        <button onClick={() => { setIsRegistering(!isRegistering); setMessage({ text: '', type: '' }); }} className="text-sm font-bold text-primary hover:text-cyan-300 hover:underline transition-all ml-1">
                            {isRegistering ? 'Masuk' : 'Daftar'}
                        </button>
                    </div>


                </div>
            </div>
        </div>
    );
}
