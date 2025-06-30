// components/AdminIndividualForm.tsx
import React, { useState, useEffect } from 'react';
import { Individual, Gender, Family, DetailEntry, LifeEvent } from '../src/types'; // <-- PASTIKAN PATH INI BENAR
import { useFamily } from '../hooks/useFamilyData';
import { DeleteIcon, PlusIcon } from './Icons';

interface AdminIndividualFormProps {
  onSave: (individual: Individual) => void; 
  onClose: () => void;
  initialData?: Individual | null;
}

const emptyIndividual: Omit<Individual, 'id'> = {
  name: '',
  gender: Gender.Male,
  photo_url: null, 
  birth_date: null, 
  birth_place: null, 
  death_date: null, 
  death_place: null, 
  description: null, 
  profession: null, 
  notes: null, 
  child_in_family_id: null, 
  education: [], 
  works: [], 
  sources: [], 
  references: [], 
};

const DetailEntrySection: React.FC<{
  title: string;
  entries: DetailEntry[];
  updateEntries: (entries: DetailEntry[]) => void;
}> = ({ title, entries, updateEntries }) => {

  const addEntry = () => {
    const newEntry: DetailEntry = { id: `detail-${Date.now()}`, title: '', description: '', period: '' };
    updateEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    updateEntries(entries.filter(entry => entry.id !== id));
  };
  
  const handleEntryChange = (id: string, field: keyof DetailEntry, value: string) => {
      const updatedEntries = entries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      );
      updateEntries(updatedEntries);
  };

  return (
    <fieldset className="border border-base-300 p-4 rounded-md space-y-4">
      <legend className="px-2 font-semibold text-gray-300">{title}</legend>
      {entries.map((entry, index) => (
        <div key={entry.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-base-100/50 rounded">
            <input type="text" placeholder="Judul/Institusi" value={entry.title || ''} onChange={e => handleEntryChange(entry.id, 'title', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            <input type="text" placeholder="Deskripsi/URL" value={entry.description || ''} onChange={e => handleEntryChange(entry.id, 'description', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            <div className="flex items-center gap-2">
                <input type="text" placeholder="Periode" value={entry.period || ''} onChange={e => handleEntryChange(entry.id, 'period', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
                <button type="button" onClick={() => removeEntry(entry.id)} className="p-2 text-error hover:text-red-400">
                    <DeleteIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
      ))}
      <button type="button" onClick={addEntry} className="flex items-center text-sm bg-accent/20 hover:bg-accent/40 text-accent font-semibold py-1 px-3 rounded-md">
        <PlusIcon className="w-4 h-4 mr-1"/> Tambah {title}
      </button>
    </fieldset>
  );
};


export const AdminIndividualForm: React.FC<AdminIndividualFormProps> = ({ onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState<Omit<Individual, 'id'> | Individual>(initialData ? JSON.parse(JSON.stringify(initialData)) : emptyIndividual);
  const { individuals: allIndividuals, families, loading, error } = useFamily(); 

  useEffect(() => {
    setFormData(initialData ? JSON.parse(JSON.stringify(initialData)) : emptyIndividual);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement>, eventType: 'birth' | 'death', field: 'date' | 'place') => {
      const { value } = e.target;
      setFormData(prev => ({
          ...prev,
          [`${eventType}_${field}`]: value === '' ? null : value 
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Individual);
  };

  const renderFamilyOption = (family: Family) => {
    const spouse1 = family.spouse1_id ? allIndividuals.get(family.spouse1_id)?.name : 'N/A'; 
    const spouse2 = family.spouse2_id ? allIndividuals.get(family.spouse2_id)?.name : 'N/A'; 
    return `Family of ${spouse1} & ${spouse2} (ID: ${family.id})`;
  }

  if (loading) return <div className="text-white text-center p-4">Memuat data untuk form individu...</div>;
  if (error) return <div className="text-error text-center p-4">Error memuat data: {error}</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nama</label>
          <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Jenis Kelamin</label>
          <select name="gender" value={formData.gender || Gender.Unknown} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
            {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">URL Foto</label>
          <input type="text" name="photo_url" value={formData.photo_url || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Profesi</label>
          <input type="text" name="profession" value={formData.profession || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
        </div>
      </div>

      <fieldset className="border border-base-300 p-4 rounded-md">
        <legend className="px-2 font-semibold text-gray-300">Kelahiran</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="date" placeholder="Tanggal (e.g., 21 Apr 1926)" name="birth_date" value={formData.birth_date || ''} onChange={e => handleEventChange(e, 'birth', 'date')} className="w-full bg-base-100 p-2 rounded-md" />
            <input type="text" placeholder="Tempat" name="birth_place" value={formData.birth_place || ''} onChange={e => handleEventChange(e, 'birth', 'place')} className="w-full bg-base-100 p-2 rounded-md" />
        </div>
      </fieldset>
      
      <fieldset className="border border-base-300 p-4 rounded-md">
        <legend className="px-2 font-semibold text-gray-300">Kematian</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="date" placeholder="Tanggal" name="death_date" value={formData.death_date || ''} onChange={e => handleEventChange(e, 'death', 'date')} className="w-full bg-base-100 p-2 rounded-md" />
            <input type="text" placeholder="Tempat" name="death_place" value={formData.death_place || ''} onChange={e => handleEventChange(e, 'death', 'place')} className="w-full bg-base-100 p-2 rounded-md" />
        </div>
      </fieldset>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Anak dari Keluarga</label>
        <select name="child_in_family_id" value={formData.child_in_family_id || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
            <option value="">Tidak ada</option>
            {Array.from(families.values()).map(f => (
                <option key={f.id} value={f.id}>{renderFamilyOption(f)}</option>
            ))}
        </select>
      </div>

      <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi</label>
          <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full bg-base-300 p-2 rounded-md" />
      </div>
       <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Catatan</label>
          <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="w-full bg-base-300 p-2 rounded-md" />
      </div>
      
      <DetailEntrySection title="Pendidikan" entries={formData.education || []} updateEntries={(e) => setFormData(prev => ({...prev, education: e}))} />
      <DetailEntrySection title="Karya" entries={formData.works || []} updateEntries={(e) => setFormData(prev => ({...prev, works: e}))} />
      <DetailEntrySection title="Sumber" entries={formData.sources || []} updateEntries={(e) => setFormData(prev => ({...prev, sources: e}))} />
      <DetailEntrySection title="Referensi" entries={formData.related_references || []} updateEntries={(e) => setFormData(prev => ({...prev, references: e}))} />


      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="bg-base-300 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Batal</button>
        <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">Simpan</button>
      </div>
    </form>
  );
};