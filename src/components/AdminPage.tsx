// src/components/AdminPage.tsx
import React, { useState } from 'react'; // <-- PERBAIKAN DI SINI
import { useFamily } from '../hooks/useFamilyData';
import { useGuestbook } from '../hooks/useGuestbookData';
import { useTableManager } from '../hooks/useTableManager';
import { Tables } from '../types/supabase';
import { EditIcon, DeleteIcon, PlusIcon, GuestbookIcon, SearchIcon } from './Icons';
import { Modal } from './Modal';
import { AdminIndividualForm } from './AdminIndividualForm';
import { AdminFamilyForm } from './AdminFamilyForm';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type GuestbookEntry = Tables<'guestbook_entries'>['Row'];

// Komponen UI Helper untuk Paginasi dan Pencarian
const SearchInput: React.FC<{ term: string, setTerm: (value: string) => void, placeholder: string }> = ({ term, setTerm, placeholder }) => (
  <div className="relative">
    <input
      type="text"
      placeholder={placeholder}
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      className="input input-bordered w-full max-w-xs pl-10"
    />
    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
      <SearchIcon className="w-5 h-5 text-gray-500" />
    </div>
  </div>
);

const PaginationControls: React.FC<{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center space-x-2 mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="btn btn-sm">«</button>
      <span className="font-semibold">Halaman {currentPage} dari {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="btn btn-sm">»</button>
    </div>
  );
};

export const AdminPage: React.FC = () => {
    const { data, ...familyActions } = useFamily();
    const { entries: guestbookEntries, ...guestbookActions } = useGuestbook();
    
    // State untuk Modals
    const [isIndividualModalOpen, setIndividualModalOpen] = useState(false);
    const [isFamilyModalOpen, setFamilyModalOpen] = useState(false);
    const [isGuestbookCommentModalOpen, setGuestbookCommentModalOpen] = useState(false);
    const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);
    const [editingGuestbookEntry, setEditingGuestbookEntry] = useState<GuestbookEntry | null>(null);
    const [currentComment, setCurrentComment] = useState('');

    const individuals = Array.from(data.individuals.values());
    const families = Array.from(data.families.values());
    const getSpouseName = (id?: string | null) => id ? data.individuals.get(id)?.name : 'N/A';

    // Kelola state untuk tabel Individu
    const individualsManager = useTableManager({
      initialData: individuals,
      itemsPerPage: 10,
      searchCallback: (item, term) => 
        item.name.toLowerCase().includes(term) || item.id.toLowerCase().includes(term)
    });

    // Kelola state untuk tabel Keluarga
    const familiesManager = useTableManager({
      initialData: families,
      itemsPerPage: 10,
      searchCallback: (item, term) => {
        const spouse1Name = getSpouseName(item.spouse1_id)?.toLowerCase() ?? '';
        const spouse2Name = getSpouseName(item.spouse2_id)?.toLowerCase() ?? '';
        return spouse1Name.includes(term) || spouse2Name.includes(term) || item.id.toLowerCase().includes(term);
      }
    });

    // Kelola state untuk tabel Buku Tamu
    const guestbookManager = useTableManager({
      initialData: guestbookEntries,
      itemsPerPage: 10,
      searchCallback: (item, term) => 
        (item.name?.toLowerCase() ?? '').includes(term) || (item.message?.toLowerCase() ?? '').includes(term)
    });

    // Fungsi-fungsi handler (disingkat untuk keringkasan)
    const openIndividualModal = (individual: Individual | null = null) => { setEditingIndividual(individual); setIndividualModalOpen(true); };
    const openFamilyModal = (family: Family | null = null) => { setEditingFamily(family); setFamilyModalOpen(true); };
    const openGuestbookCommentModal = (entry: GuestbookEntry) => { setEditingGuestbookEntry(entry); setCurrentComment(entry.comment || ''); setGuestbookCommentModalOpen(true); };
    const handleSaveIndividual = (d: any) => { 'id' in d ? familyActions.updateIndividual(d) : familyActions.addIndividual(d); setIndividualModalOpen(false); };
    const handleSaveFamily = (d: any) => { 'id' in d ? familyActions.updateFamily(d) : familyActions.addFamily(d); setFamilyModalOpen(false); };
    const handleDeleteIndividual = (id: string) => { if (window.confirm("Hapus individu?")) familyActions.deleteIndividual(id); };
    const handleDeleteFamily = (id: string) => { if (window.confirm("Hapus keluarga?")) familyActions.deleteFamily(id); };
    const handleSaveComment = async () => { if (editingGuestbookEntry) { await guestbookActions.updateEntry(editingGuestbookEntry.id, currentComment); setGuestbookCommentModalOpen(false); }};

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-bold text-white mb-8">Panel Admin</h1>

            {/* Individuals Section */}
            <div className="bg-base-200 p-6 rounded-lg shadow-xl mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-white">Kelola Individu</h2>
                    <SearchInput term={individualsManager.searchTerm} setTerm={individualsManager.setSearchTerm} placeholder="Cari nama atau ID..." />
                    <button onClick={() => openIndividualModal()} className="btn btn-primary w-full md:w-auto"><PlusIcon className="w-5 h-5 mr-2" /> Tambah</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr><th>Nama</th><th className="hidden md:table-cell">Lahir</th><th className="hidden md:table-cell">Meninggal</th><th>Tindakan</th></tr>
                        </thead>
                        <tbody>
                            {individualsManager.currentItems.map(ind => (
                                <tr key={ind.id} className="hover">
                                    <td className="font-medium">{ind.name}</td>
                                    <td className="hidden md:table-cell">{ind.birth_date ?? '-'}</td>
                                    <td className="hidden md:table-cell">{ind.death_date ?? '-'}</td>
                                    <td className="flex items-center space-x-2">
                                        <button onClick={() => openIndividualModal(ind)} className="btn btn-ghost btn-sm"><EditIcon/></button>
                                        <button onClick={() => handleDeleteIndividual(ind.id)} className="btn btn-ghost btn-sm text-error"><DeleteIcon/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls {...individualsManager} onPageChange={individualsManager.setCurrentPage} />
            </div>

            {/* Families Section */}
            <div className="bg-base-200 p-6 rounded-lg shadow-xl mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-white">Kelola Keluarga</h2>
                    <SearchInput term={familiesManager.searchTerm} setTerm={familiesManager.setSearchTerm} placeholder="Cari nama pasangan..." />
                    <button onClick={() => openFamilyModal()} className="btn btn-primary w-full md:w-auto"><PlusIcon className="w-5 h-5 mr-2" /> Tambah</button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr><th>Pasangan 1</th><th>Pasangan 2</th><th className="hidden md:table-cell">Jumlah Anak</th><th>Tindakan</th></tr>
                        </thead>
                        <tbody>
                            {familiesManager.currentItems.map(fam => (
                                <tr key={fam.id} className="hover">
                                    <td className="font-medium">{getSpouseName(fam.spouse1_id)}</td>
                                    <td className="font-medium">{getSpouseName(fam.spouse2_id)}</td>
                                    <td className="hidden md:table-cell">{fam.children_ids?.length ?? 0}</td>
                                    <td className="flex items-center space-x-2">
                                        <button onClick={() => openFamilyModal(fam)} className="btn btn-ghost btn-sm"><EditIcon/></button>
                                        <button onClick={() => handleDeleteFamily(fam.id)} className="btn btn-ghost btn-sm text-error"><DeleteIcon/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls {...familiesManager} onPageChange={familiesManager.setCurrentPage} />
            </div>

            {/* Guestbook Section */}
            <div className="bg-base-200 p-6 rounded-lg shadow-xl">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-4">
                      <GuestbookIcon className="w-8 h-8 text-accent" />
                      <h2 className="text-2xl font-bold text-white">Kelola Buku Tamu</h2>
                    </div>
                    <SearchInput term={guestbookManager.searchTerm} setTerm={guestbookManager.setSearchTerm} placeholder="Cari nama atau pesan..." />
                </div>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr><th>Nama</th><th>Pesan</th><th className="hidden md:table-cell">Komentar Admin</th><th>Tindakan</th></tr>
                        </thead>
                        <tbody>
                            {guestbookManager.currentItems.map(entry => (
                                <tr key={entry.id} className="hover">
                                    <td className="font-medium">{entry.name}</td>
                                    <td>{entry.message}</td>
                                    <td className="hidden md:table-cell">{entry.comment || '-'}</td>
                                    <td>
                                        <button onClick={() => openGuestbookCommentModal(entry)} className="btn btn-ghost btn-sm" title="Tambah/Edit Komentar"><EditIcon/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls {...guestbookManager} onPageChange={guestbookManager.setCurrentPage} />
            </div>

            {/* Modals */}
            <Modal isOpen={isIndividualModalOpen} onClose={() => setIndividualModalOpen(false)} title={editingIndividual ? 'Edit Individu' : 'Tambah Individu Baru'}>
                <AdminIndividualForm onSave={handleSaveIndividual} onClose={() => setIndividualModalOpen(false)} initialData={editingIndividual} />
            </Modal>
            <Modal isOpen={isFamilyModalOpen} onClose={() => setFamilyModalOpen(false)} title={editingFamily ? 'Edit Keluarga' : 'Tambah Keluarga Baru'}>
                <AdminFamilyForm onSave={handleSaveFamily} onClose={() => setFamilyModalOpen(false)} initialData={editingFamily} individuals={individuals} />
            </Modal>
            <Modal isOpen={isGuestbookCommentModalOpen} onClose={() => setGuestbookCommentModalOpen(false)} title="Tambah/Edit Komentar Buku Tamu">
                <div className="p-4 space-y-4">
                    <p className="p-2 bg-base-300 rounded-md"><strong>Dari:</strong> {editingGuestbookEntry?.name}</p>
                    <p className="p-2 bg-base-300 rounded-md whitespace-pre-wrap"><strong>Pesan:</strong> {editingGuestbookEntry?.message}</p>
                    <textarea value={currentComment} onChange={(e) => setCurrentComment(e.target.value)} rows={4} className="textarea textarea-bordered w-full" placeholder="Tulis komentar..."></textarea>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setGuestbookCommentModalOpen(false)} className="btn">Batal</button>
                        <button onClick={handleSaveComment} className="btn btn-primary">Simpan</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};