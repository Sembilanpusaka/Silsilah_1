// components/LoginModal.tsx
import React, { useState } from 'react';
import { supabase } from '../src/supabaseClient'; // Path diperbaiki

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            onLoginSuccess();
            onClose();
        } catch (err: any) {
            console.error("Login Error:", err.message);
            setError(`Login gagal: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-base-200 rounded-lg shadow-xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Login Admin</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="your@email.com"
                            autoComplete="username"
                            required
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
                            autoComplete="current-password"
                            required
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