// Silsilah_1/src/components/AdminPage.tsx
import React, { useState } from 'react';
import { useFamily } from '../hooks/useFamilyData';
import { useGuestbook } from '../hooks/useGuestbookData'; // <--- Tambahkan ini
import { Tables } from '../types/supabase';
type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type GuestbookEntry = Tables<'guestbook_entries'>['Row']; // <--- Tambahkan ini

import { EditIcon, DeleteIcon, PlusIcon, GuestbookIcon } from './Icons'; // <--- Tambahkan GuestbookIcon
import { Modal } from './Modal';
import { AdminIndividualForm } from './AdminIndividualForm';
import { AdminFamilyForm } from './AdminFamilyForm';

export const AdminPage: React.FC = () => {
    const { data, addIndividual, updateIndividual, deleteIndividual, addFamily, updateFamily, deleteFamily } = useFamily();
    const { entries: guestbookEntries, updateEntry: updateGuestbookEntry } = useGuestbook(); // <--- Ambil entries & updateEntry

    const [isIndividualModalOpen, setIndividualModalOpen] = useState(false);
    const [isFamilyModalOpen, setFamilyModalOpen] = useState(false);
    const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);

    // Untuk manajemen komentar buku tamu
    const [isGuestbookCommentModalOpen, setGuestbookCommentModalOpen] = useState(false);
    const [editingGuestbookEntry, setEditingGuestbookEntry] = useState<GuestbookEntry | null>(null);
    const [currentComment, setCurrentComment] = useState(''); // State untuk input komentar admin

    const individuals = Array.from(data.individuals.values());
    const families = Array.from(data.families.values());

    const openIndividualModal = (individual: Individual | null = null) => {
        setEditingIndividual(individual);
        setIndividualModalOpen(true);
    };

    const openFamilyModal = (family: Family | null = null) => {
        setEditingFamily(family);
        setFamilyModalOpen(true);
    };

    // Fungsi untuk membuka modal komentar buku tamu
    const openGuestbookCommentModal = (entry: GuestbookEntry) => {
        setEditingGuestbookEntry(entry);
        setCurrentComment(entry.comment || ''); // Isi dengan komentar yang sudah ada
        setGuestbookCommentModalOpen(true);
    };

    const handleSaveIndividual = (individualData: Tables<'individuals'>['Insert'] | Tables<'individuals'>['Update']) => {
        if ('id' in individualData && individualData.id) {
            updateIndividual(individualData as Tables<'individuals'>['Update']);
        } else {
            addIndividual(individualData as Tables<'individuals'>['Insert']);
        }
        setIndividualModalOpen(false);
    };

    const handleSaveFamily = (familyData: Tables<'families'>['Insert'] | Tables<'families'>['Update']) => {
        if ('id' in familyData && familyData.id) {
            updateFamily(familyData as Tables<'families'>['Update']);
        } else {
            addFamily(familyData as Tables<'families'>['Insert']);
        }
        setFamilyModalOpen(false);
    };

    // Fungsi untuk menyimpan komentar admin
    const handleSaveComment = async () => {
        if (editingGuestbookEntry) {
            await updateGuestbookEntry(editingGuestbookEntry.id, currentComment);
            setGuestbookCommentModalOpen(false);
            setEditingGuestbookEntry(null);
            setCurrentComment('');
        }
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

    const getSpouseName = (id?: string | null) => id ? data.individuals.get(id)?.name : 'N/A';

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-bold text-white mb-8">Panel Admin</h1>

            {/* Individuals Section (Tetap sama) */}
            <div className="bg-base-200 p-6 rounded-lg shadow-xl mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Kelola Individu</h2>
                    <button onClick={() => openIndividualModal()} className="flex items-center bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">
                        <PlusIcon className="w-5 h-5 mr-2" /> Tambah Individu
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-base-300">
                                <th className="p-3">Nama</th>
                                <th className="p-3 hidden md:table-cell">Tanggal Lahir</th>
                                <th className="p-3 hidden md:table-cell">Tanggal Meninggal</th>
                                <th className="p-3">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {individuals.map(ind => (
                                <tr key={ind.id} className="border-b border-base-300 hover:bg-base-300/50">
                                    <td className="p-3 font-medium">{ind.name}</td>
                                    <td className="p-3 hidden md:table-cell">{ind.birth_date ?? '-'}</td>
                                    <td className="p-3 hidden md:table-cell">{ind.death_date ?? '-'}</td>
                                    <td className="p-3 flex items-center space-x-2">
                                        <button onClick={() => openIndividualModal(ind)} className="p-2 text-blue-400 hover:text-blue-300"><EditIcon/></button>
                                        <button onClick={() => handleDeleteIndividual(ind.id)} className="p-2 text-error hover:text-red-400"><DeleteIcon/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Families Section (Tetap sama) */}
            <div className="bg-base-200 p-6 rounded-lg shadow-xl mb-8"> {/* Tambahkan mb-8 untuk spasi sebelum Guestbook */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Kelola Keluarga</h2>
                    <button onClick={() => openFamilyModal()} className="flex items-center bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">
                        <PlusIcon className="w-5 h-5 mr-2" /> Tambah Keluarga
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-base-300">
                                <th className="p-3">Pasangan 1</th>
                                <th className="p-3">Pasangan 2</th>
                                <th className="p-3 hidden md:table-cell">Jumlah Anak</th>
                                <th className="p-3">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {families.map(fam => (
                                <tr key={fam.id} className="border-b border-base-300 hover:bg-base-300/50">
                                    <td className="p-3 font-medium">{getSpouseName(fam.spouse1_id)}</td>
                                    <td className="p-3 font-medium">{getSpouseName(fam.spouse2_id)}</td>
                                    <td className="p-3 hidden md:table-cell">{fam.children_ids?.length ?? 0}</td>
                                    <td className="p-3 flex items-center space-x-2">
                                        <button onClick={() => openFamilyModal(fam)} className="p-2 text-blue-400 hover:text-blue-300"><EditIcon/></button>
                                        <button onClick={() => handleDeleteFamily(fam.id)} className="p-2 text-error hover:text-red-400"><DeleteIcon/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Guestbook Section (BARU) */}
            <div className="bg-base-200 p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Kelola Buku Tamu</h2>
                    <GuestbookIcon className="w-8 h-8 text-accent" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-base-300">
                                <th className="p-3">Nama Pengunjung</th>
                                <th className="p-3">Pesan</th>
                                <th className="p-3 hidden md:table-cell">Komentar Admin</th>
                                <th className="p-3">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {guestbookEntries.map(entry => (
                                <tr key={entry.id} className="border-b border-base-300 hover:bg-base-300/50">
                                    <td className="p-3 font-medium">{entry.name}</td>
                                    <td className="p-3">{entry.message}</td>
                                    <td className="p-3 hidden md:table-cell">{entry.comment || '-'}</td>
                                    <td className="p-3 flex items-center space-x-2">
                                        <button onClick={() => openGuestbookCommentModal(entry)} className="p-2 text-blue-400 hover:text-blue-300" title="Tambah/Edit Komentar Admin"><EditIcon/></button>
                                        {/* Jika Anda ingin admin juga bisa menghapus entri buku tamu, tambahkan tombol delete di sini */}
                                        {/* <button onClick={() => handleDeleteGuestbookEntry(entry.id)} className="p-2 text-error hover:text-red-400"><DeleteIcon/></button> */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Modals (Tetap sama) */}
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

            {/* Modal untuk Komentar Buku Tamu (BARU) */}
            <Modal isOpen={isGuestbookCommentModalOpen} onClose={() => setGuestbookCommentModalOpen(false)} title="Tambah/Edit Komentar Buku Tamu">
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Pesan dari:</label>
                        <p className="p-2 bg-base-300 rounded-md text-white">{editingGuestbookEntry?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Isi Pesan:</label>
                        <p className="p-2 bg-base-300 rounded-md text-white whitespace-pre-wrap">{editingGuestbookEntry?.message || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Komentar Admin</label>
                        <textarea
                            value={currentComment}
                            onChange={(e) => setCurrentComment(e.target.value)}
                            rows={4}
                            className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white"
                            placeholder="Tulis komentar admin di sini..."
                        />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => setGuestbookCommentModalOpen(false)} className="bg-base-300 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Batal</button>
                        <button type="button" onClick={handleSaveComment} className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">Simpan Komentar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};