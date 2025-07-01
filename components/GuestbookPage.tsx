// components/GuestbookPage.tsx
import React, { useState } from 'react';
import { useGuestbook } from '../hooks/useGuestbookData'; // Sesuaikan path
import { useAuth } from '../hooks/useAuth'; // Sesuaikan path

export const GuestbookPage: React.FC = () => {
  const { entries, loading, error, addEntry } = useGuestbook();
  const { user, loading: authLoading } = useAuth(); // Ambil user info
  const [name, setName] = useState(user?.email || ''); // Pre-fill with user email if logged in
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      alert("Name and message cannot be empty.");
      return;
    }
    await addEntry(name, message);
    setMessage(''); // Clear message after sending
  };

  if (loading || authLoading) {
    return <div className="text-white text-center p-8">Memuat Guestbook...</div>;
  }

  if (error) {
    return <div className="text-error text-center p-8">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-base-200 shadow-xl rounded-lg mt-8 mb-8">
      <h1 className="text-3xl font-bold text-primary mb-6 text-center">Guestbook</h1>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-base-300 rounded-lg shadow-md space-y-4 text-white">
        <h2 className="text-xl font-semibold mb-3">Tinggalkan Pesan</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nama:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-base-200 border border-gray-600 rounded-md p-2 text-white"
            placeholder="Your Name"
            disabled={!!user} // Disable if logged in (assuming name is user's email)
            required
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Pesan:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-base-200 border border-gray-600 rounded-md p-2 text-white"
            placeholder="Your message here..."
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Kirim Pesan
        </button>
      </form>

      <h2 className="text-2xl font-semibold text-white mb-4">Pesan-Pesan</h2>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-center">Belum ada pesan di guestbook.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map(entry => (
            <li key={entry.id} className="p-4 bg-base-300 rounded-lg shadow-md">
              <p className="text-gray-200 font-semibold">{entry.name}</p>
              <p className="text-gray-400 text-sm">{new Date(entry.created_at).toLocaleString()}</p>
              <p className="text-white mt-2 leading-relaxed">{entry.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};