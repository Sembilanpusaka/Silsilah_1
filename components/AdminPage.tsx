// components/AdminPage.tsx
import React, { useState } from 'react';
import { useFamily } from '../hooks/useFamilyData';
import { Individual, Family } from '../src/types'; // Path diperbaiki
import { EditIcon, DeleteIcon, PlusIcon, DownloadIcon, UploadIcon } from './Icons'; // Import icon baru
import { Modal } from './Modal';
import { AdminIndividualForm } from './AdminIndividualForm';
import { AdminFamilyForm } from './AdminFamilyForm';
import { useAuth } from '../hooks/useAuth'; 

export const AdminPage: React.FC = () => {
    // Destructuring diperbaiki
    const { individuals, families, loading, error, addIndividual, updateIndividual, deleteIndividual, addFamily, updateFamily, deleteFamily, exportData, importData } = useFamily();
    const { isAdminUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'individuals' | 'families' | 'import-export'>('individuals');
    const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // State untuk file impor

    // Tidak perlu lagi Array.from di sini, karena properti individuals/families sudah Map
    // const individuals = Array.from(data.individuals.values());
    // const families = Array.from(data.families.values());

    if (!isAdminUser) {
        return <div className="text-error text-center p-8">Akses ditolak. Anda bukan administrator.</div>;
    }

    if (loading) {
        return <div className="text-white text-center p-8">Memuat data admin...</div>;
    }

    if (error) {
        return <div className="text-error text-center p-8">Error: {error}</div>;
    }

    const openIndividualModal = (individual: Individual | null = null) => {
        setEditingIndividual(individual);
        setIndividualModalOpen(true);
    };

    const openFamilyModal = (family: Family | null = null) => {
        setEditingFamily(family);
        setFamilyModalOpen(true);
    };

    const handleSaveIndividual = (individualData: Individual) => { // Tipe sudah Individual
        if (individualData.id) {
            updateIndividual(individualData);
        } else {
            // `addIndividual` menerima Omit<Individual, 'id'>, jadi pastikan ID tidak disertakan di sini.
            const { id, ...newIndividualData } = individualData;
            addIndividual(newIndividualData);
        }
        setIndividualModalOpen(false);
    };

    const handleSaveFamily = (familyData: Family) => { // Tipe sudah Family
        if (familyData.id) {
            updateFamily(familyData);
        } else {
            // `addFamily` menerima Omit<Family, 'id'>
            const { id, ...newFamilyData } = familyData;
            addFamily(newFamilyData);
        }
        setFamilyModalOpen(false);
    };
    
    const handleDeleteIndividual = (id: string) => {
        if(window.confirm("Apakah Anda yakin ingin menghapus individu ini? Tindakan ini tidak dapat diurungkan.")){
            deleteIndividual(id);
        }
    };
    
    const handleDeleteFamily = (id: string) => {
        if(window.confirm("Apakah Anda yakin ingin menghapus keluarga ini? Ini akan menghapus hubungan pasangan dan orang tua-anak.")){
            deleteFamily(id);
        }
    };

    // Fungsi helper untuk mendapatkan nama pasangan
    const getSpouseName = (id: string | null) => id ? individuals.get(id)?.name || 'N/A' : 'N/A'; // Gunakan individuals langsung

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleImportClick = () => {
        if (selectedFile) {
            importData(selectedFile);
        } else {
            alert("Please select a file to import.");
        }
    };

    return (
        <div className="container mx-auto p-4 bg-base-100 min-h-screen">
            <h1 className="text-3xl font-bold text-primary mb-6 text-center">Admin Dashboard</h1>

            <div className="tabs tabs-boxed mb-6 justify-center">
                <button
                className={`tab ${activeTab === 'individuals' ? 'tab-active bg-primary text-white' : 'text-gray-300'}`}
                onClick={() => setActiveTab('individuals')}
                >
                Individuals
                </button>
                <button
                className={`tab ${activeTab === 'families' ? 'tab-active bg-primary text-white' : 'text-gray-300'}`}
                onClick={() => setActiveTab('families')}
                >
                Families
                </button>
                <button
                className={`tab ${activeTab === 'import-export' ? 'tab-active bg-primary text-white' : 'text-gray-300'}`}
                onClick={() => setActiveTab('import-export')}
                >
                Import/Export
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="bg-base-200 p-6 rounded-lg shadow-xl">
                {activeTab === 'individuals' && (
                    <AdminIndividualForm
                    initialData={editingIndividual || undefined} // Sesuaikan prop ke initialData
                    onSave={handleSaveIndividual}
                    onClose={() => setIndividualModalOpen(false)} // Menggunakan onClose dari modal
                    // onDelete={handleDeleteIndividual} // Delete button handled outside form in AdminPage
                    />
                )}

                {activeTab === 'families' && (
                    <AdminFamilyForm
                    initialData={editingFamily || undefined} // Sesuaikan prop ke initialData
                    onSave={handleSaveFamily}
                    onClose={() => setFamilyModalOpen(false)} // Menggunakan onClose dari modal
                    // onDelete={handleDeleteFamily} // Delete button handled outside form in AdminPage
                    />
                )}

                {activeTab === 'import-export' && (
                    <div className="p-4 bg-base-300 rounded-lg shadow-md space-y-4 text-white">
                    <h3 className="text-xl font-bold mb-4">Import / Export Data</h3>
                    <div className="space-y-4">
                        <h4>Export Data (JSON)</h4>
                        <button
                        onClick={exportData}
                        className="w-full bg-info hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                        >
                        Export All Data
                        </button>

                        <h4 className="pt-4">Import Data (JSON)</h4>
                        <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="file-input file-input-bordered file-input-primary w-full max-w-xs text-gray-300"
                        />
                        <button
                        onClick={handleImportClick}
                        className="w-full bg-success hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                        disabled={!selectedFile}
                        >
                        Import Data
                        </button>
                        <p className="text-sm text-gray-400 mt-2">
                        <span className="font-bold text-warning">Peringatan:</span> Mengimpor data akan <span className="font-bold text-red-500">menghapus semua data yang ada</span> di database dan menggantinya dengan isi file yang diimpor. Lakukan backup terlebih dahulu!
                        </p>
                    </div>
                    </div>
                )}
                </div>

                {/* List Section */}
                <div className="bg-base-200 p-6 rounded-lg shadow-xl">
                {activeTab === 'individuals' && (
                    <div>
                    <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
                        Individuals List
                        <button
                        onClick={() => openIndividualModal()} // Reset form untuk tambah baru
                        className="bg-accent hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md transition-colors text-sm"
                        >
                        Add New
                        </button>
                    </h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {Array.from(individuals.values()).length > 0 ? (
                        Array.from(individuals.values())
                            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                            .map(ind => (
                            <li key={ind.id} className="p-2 bg-base-300 rounded-md flex justify-between items-center">
                                <span className="text-gray-200">{ind.name}</span>
                                <div className="flex items-center space-x-2">
                                    <button
                                    onClick={() => openIndividualModal(ind)}
                                    className="p-1 text-blue-400 hover:text-blue-300"
                                    title="Edit Individual"
                                    >
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button
                                    onClick={() => handleDeleteIndividual(ind.id)}
                                    className="p-1 text-error hover:text-red-400"
                                    title="Delete Individual"
                                    >
                                        <DeleteIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </li>
                            ))
                        ) : (
                        <li className="text-gray-400 text-center">No individuals found.</li>
                        )}
                    </ul>
                    </div>
                )}

                {activeTab === 'families' && (
                    <div>
                    <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
                        Families List
                        <button
                        onClick={() => openFamilyModal()} // Reset form untuk tambah baru
                        className="bg-accent hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md transition-colors text-sm"
                        >
                        Add New
                        </button>
                    </h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {Array.from(families.values()).length > 0 ? (
                        Array.from(families.values())
                            .map(fam => (
                            <li key={fam.id} className="p-2 bg-base-300 rounded-md flex justify-between items-center">
                                <span className="text-gray-200">
                                Family: {getSpouseName(fam.spouse1_id)} & {getSpouseName(fam.spouse2_id)}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <button
                                    onClick={() => openFamilyModal(fam)}
                                    className="p-1 text-blue-400 hover:text-blue-300"
                                    title="Edit Family"
                                    >
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button
                                    onClick={() => handleDeleteFamily(fam.id)}
                                    className="p-1 text-error hover:text-red-400"
                                    title="Delete Family"
                                    >
                                        <DeleteIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </li>
                            ))
                        ) : (
                        <li className="text-gray-400 text-center">No families found.</li>
                        )}
                    </ul>
                    </div>
                )}
                </div>
            </div>

            <Modal isOpen={isIndividualModalOpen} onClose={() => setIndividualModalOpen(false)} title={editingIndividual ? 'Edit Individu' : 'Tambah Individu Baru'}>
                <AdminIndividualForm 
                    onSave={handleSaveIndividual} 
                    onClose={() => setIndividualModalOpen(false)} 
                    initialData={editingIndividual}
                />
            </Modal>
            
            <Modal isOpen={isFamilyModalOpen} onClose={() => setFamilyModalOpen(false)} title={editingFamily ? 'Edit Keluarga' : 'Tambah Keluarga Baru'}>
                <AdminFamilyForm
                    onSave={handleSaveFamily}
                    onClose={() => setFamilyModalOpen(false)}
                    initialData={editingFamily}
                />
            </Modal>
        </div>
    );
};