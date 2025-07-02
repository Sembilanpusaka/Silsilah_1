// Silsilah_1/src/components/GuestbookPage.tsx
import React, { useState } from 'react';
import { useGuestbook } from '../hooks/useGuestbookData';
import { Tables } from '../types/supabase';
type GuestbookEntry = Tables<'guestbook_entries'>['Row'];

import { GuestbookIcon, UserIcon } from './Icons';

export const GuestbookPage: React.FC = () => {
    const { entries, addEntry } = useGuestbook();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [comment, setComment] = useState(''); // <--- Tambahkan state untuk komentar
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !message.trim()) {
            setError('Nama dan pesan tidak boleh kosong.');
            return;
        }
        try {
            // Panggil addEntry dengan parameter 'comment'
            await addEntry(name, message, comment); // <--- Kirim komentar
            setName('');
            setMessage('');
            setComment(''); // <--- Reset komentar setelah kirim
            setError('');
        } catch (err: any) {
            setError(err.message || 'Gagal mengirim pesan.');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-base-200 p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <GuestbookIcon className="w-16 h-16 text-accent mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-white">Buku Tamu</h1>
                    <p className="text-gray-400 mt-2">Silakan tinggalkan pesan, masukan, atau komentar Anda.</p>
                </div>

                <form onSubmit={handleSubmit} className="mb-12 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nama Anda</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="Contoh: John Doe"
                            required // Tambahkan required
                        />
                    </div>
                     <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Pesan Anda</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={4}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="Tulis komentar Anda di sini..."
                            required // Tambahkan required
                        />
                    </div>
                    {/* Tambahkan input untuk komentar */}
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-1">Komentar (opsional)</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={2}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="Tambahkan komentar di sini..."
                        />
                    </div>
                    {error && <p className="text-error text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Kirim Pesan
                    </button>
                </form>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white border-b border-base-300 pb-2">Pesan Terbaru</h2>
                    {entries.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Belum ada pesan. Jadilah yang pertama!</p>
                    ) : (
                        entries.map(entry => (
                            <div key={entry.id} className="flex space-x-4 bg-base-100/50 p-4 rounded-lg">
                                <div className="flex-shrink-0 bg-base-300 rounded-full h-12 w-12 flex items-center justify-center">
                                    <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-white">{entry.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(entry.created_at!).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                    <p className="text-gray-300 mt-1 whitespace-pre-wrap">{entry.message}</p>
                                    {/* Tampilkan kolom komentar jika ada */}
                                    {entry.comment && (
                                        <div className="mt-2 text-sm text-gray-400 border-t border-base-300 pt-2">
                                            <p className="font-semibold">Komentar:</p>
                                            <p className="whitespace-pre-wrap">{entry.comment}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};