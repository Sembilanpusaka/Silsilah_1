// Silsilah_1/src/components/LoginModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Impor useAuth hook

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    // Ambil fungsi login dari useAuth (yang terhubung ke Supabase)
    const { login } = useAuth();
    const [email, setEmail] = useState(''); // Gunakan state 'email'
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        console.log("[DEBUG: LoginModal] Mencoba login dengan email:", email); // DEBUG
        try {
            // INI BAGIAN KRUSIAL: Panggil fungsi login dari useAuth yang ke Supabase
            // HAPUS SEMUA LOGIKA IF (username === 'admin' && password === 'password') JIKA ADA DI SINI
            const { user, session, error: authError } = await login(email, password);

            if (authError) {
                console.error("[ERROR: LoginModal] Supabase Auth Error:", authError); // DEBUG
                // Error dari Supabase: "Invalid login credentials", "Email not confirmed", dll.
                throw authError;
            }
            if (user) {
                console.log("[DEBUG: LoginModal] Login berhasil. User UID:", user.id); // DEBUG
                onLoginSuccess(); // Panggil callback sukses ke App.tsx
                onClose();
            } else {
                // Kasus fallback jika user null tanpa error spesifik dari Supabase
                setError('Login gagal. Periksa email dan password Anda.');
            }
        } catch (err: any) {
            console.error("[ERROR: LoginModal] Kesalahan umum saat login:", err.message); // DEBUG
            setError(err.message || 'Terjadi kesalahan saat login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-base-200 rounded-lg shadow-xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>
                <div className="space-y-4">
                    <div>
                        {/* Ubah label dan htmlFor menjadi 'email' */}
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email" // Pastikan type-nya 'email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="admin@example.com" // Placeholder yang sesuai
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="password"
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="text-error text-sm text-center">{error}</p>}
                    <button
                        onClick={handleLogin}
                        className="w-full bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition-colors"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};