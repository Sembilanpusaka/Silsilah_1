// App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Sesuaikan path import untuk hooks dan components
import { useFamilyData, FamilyDataContext } from './hooks/useFamilyData';
import { useGuestbookData, GuestbookContext } from './hooks/useGuestbookData';
import { useAuth } from './src/hooks/useAuth'; // Import hook autentikasi baru
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { IndividualProfile } from './components/IndividualProfile';
import { FamilyTreeView } from './components/FamilyTreeView';
import { LoginModal } from './components/LoginModal';
import { InteractiveRelationshipFinder } from './components/InteractiveRelationshipFinder';
import { AdminPage } from './components/AdminPage';
import { GuestbookPage } from './components/GuestbookPage';
import { AboutPage } from './components/AboutPage';

const AppContent: React.FC = () => {
    const { user, loading: authLoading, isAdminUser, logout } = useAuth(); // Gunakan useAuth
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

    useEffect(() => {
        // Tambahkan kelas dark mode ke HTML root
        document.documentElement.classList.add('dark');
    }, []);

    const handleLoginSuccess = () => {
        // useAuth akan secara otomatis memperbarui status isAdminUser setelah login Supabase
        setLoginModalOpen(false);
    };
    
    const handleLogout = async () => {
        await logout(); // Panggil fungsi logout dari useAuth
    }

    // Jika autentikasi sedang dimuat, tampilkan loading screen
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="text-xl text-white">Memuat sesi pengguna...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-base-100">
            <Header 
                isAdmin={isAdminUser} // Gunakan isAdminUser dari useAuth
                onLoginClick={() => setLoginModalOpen(true)}
                onLogout={handleLogout}
            />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/individual/:id" element={<IndividualProfile />} />
                    <Route path="/tree" element={<FamilyTreeView />} />
                    <Route path="/relationship-finder" element={<InteractiveRelationshipFinder />} />
                    <Route path="/guestbook" element={<GuestbookPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route 
                        path="/admin" 
                        // Akses halaman admin hanya jika user terautentikasi DAN adalah admin
                        element={isAdminUser ? <AdminPage /> : <Navigate to="/" replace />} 
                    />
                </Routes>
            </main>
            <Footer />
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    );
}


const App: React.FC = () => {
    // FamilyData dan GuestbookData mungkin tidak perlu isLoaded,
    // cukup gunakan 'loading' state dari masing-masing hook.
    // Jika Anda ingin loading screen gabungan:
    const familyData = useFamilyData();
    const guestbookData = useGuestbookData();

    if (familyData.loading || guestbookData.loading) { // Gunakan state 'loading' dari hook data
        return (
            <div className="flex items-center justify-center h-screen bg-base-100">
                <div className="text-xl text-white">Memuat Silsilah Keluarga dan Guestbook...</div>
            </div>
        );
    }

    return (
        <FamilyDataContext.Provider value={familyData}>
            <GuestbookContext.Provider value={guestbookData}>
                <AppContent />
            </GuestbookContext.Provider>
        </FamilyDataContext.Provider>
    );
};

export default App;