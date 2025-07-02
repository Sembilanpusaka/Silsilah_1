import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useFamilyData, FamilyDataContext } from './hooks/useFamilyData';
import { useGuestbookData, GuestbookContext } from './hooks/useGuestbookData';
import { useAuth } from './hooks/useAuth';
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
    const { isAdminUser, logout, loading: authLoading } = useAuth();
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

     useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const handleLoginSuccess = () => {
        setLoginModalOpen(false);
    };

    const handleLogout = () => {
        logout();
    }

    if (authLoading) {
      return (
        <div className="flex items-center justify-center h-screen bg-base-100">
            <div className="text-xl text-white">Memuat Autentikasi...</div>
        </div>
      );
    }

    return (
        <div className="min-h-screen flex flex-col bg-base-100">
            <Header
                isAdmin={isAdminUser}
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
                        element={isAdminUser ? <AdminPage /> : <Navigate to="/" />}
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
    // Ambil loading dari useFamilyData() dan isLoaded dari useGuestbookData()
    const familyData = useFamilyData();
    const guestbookData = useGuestbookData();

    // Perbaiki kondisi pemuatan: gunakan familyData.loading
    if (familyData.loading || !guestbookData.isLoaded) { // <--- PERBAIKAN DI SINI
        return (
            <div className="flex items-center justify-center h-screen bg-base-100">
                <div className="text-xl text-white">Memuat Silsilah Keluarga...</div>
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