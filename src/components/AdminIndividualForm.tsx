import React, { useState, useEffect } from 'react';
// Pastikan impor Tables dari supabase.ts
import { Tables } from '../types/supabase';

// Definisikan tipe FormIndividual yang sesuai dengan struktur form Anda
interface FormIndividual {
  id?: string;
  name: string;
  gender: 'male' | 'female' | 'unknown';
  photoUrl: string | null;
  birth: { date: string | null; place: string | null; };
  death: { date: string | null; place: string | null; };
  description: string | null;
  profession: string | null;
  notes: string | null;
  childInFamilyId: string | null;
  education: DetailEntry[] | null;
  works: DetailEntry[] | null;
  sources: DetailEntry[] | null;
  references: DetailEntry[] | null; // references di form akan di-map ke related_references di Supabase
  lifeFacts: LifeFactEntry[] | null; // <--- TAMBAHKAN INI
}

interface DetailEntry { // Untuk Pendidikan, Karya, Sumber, Referensi (link & text)
  id: string;
  title: string;
  description: string;
  period: string;
}

interface LifeFactEntry { // <--- DEFINISI BARU: Untuk Fakta & Peristiwa (link & text)
    id: string; // ID unik untuk React key
    type: string; // Misalnya: "Lahir", "Sekolah", "Menikah", "Haji"
    date: string | null;
    place: string | null;
    description: string | null;
    source_link: string | null;
    source_text: string | null;
}

// Gunakan tipe Supabase yang digenerate untuk memastikan nama kolom sesuai
type SupabaseIndividualInsert = Tables<'individuals'>['Insert'];
type SupabaseIndividualUpdate = Tables<'individuals'>['Update'];

enum Gender { // Enum Gender dari supabase.ts Anda
  Male = 'male',
  Female = 'female',
  Unknown = 'unknown',
}

import { useFamily } from '../hooks/useFamilyData';
import { DeleteIcon, PlusIcon } from './Icons';
import { Modal } from './Modal';

interface AdminIndividualFormProps {
  onSave: (individual: SupabaseIndividualInsert | SupabaseIndividualUpdate) => void; // Perbaiki tipe onSave
  onClose: () => void;
  initialData?: Tables<'individuals'>['Row'] | null; // initialData datang dari Supabase (snake_case)
}

const emptyIndividualForm: FormIndividual = {
  name: '', gender: Gender.Unknown, photoUrl: null,
  birth: { date: null, place: null }, death: { date: null, place: null },
  description: null, profession: null, notes: null, childInFamilyId: null,
  education: [], works: [], sources: [], references: [],
  lifeFacts: [], // <--- INISIALISASI
};

// Helper: Mengonversi data dari format Supabase (snake_case, datar) ke format Form (camelCase, bersarang)
const convertSupabaseToForm = (supabaseData: Tables<'individuals'>['Row']): FormIndividual => {
  return {
    id: supabaseData.id,
    name: supabaseData.name,
    gender: supabaseData.gender,
    photoUrl: supabaseData.photo_url,
    birth: {
      date: supabaseData.birth_date,
      place: supabaseData.birth_place
    },
    death: {
      date: supabaseData.death_date,
      place: supabaseData.death_place
    },
    description: supabaseData.description,
    profession: supabaseData.profession,
    notes: supabaseData.notes,
    childInFamilyId: supabaseData.child_in_family_id,
    education: supabaseData.education ? (supabaseData.education as DetailEntry[]) : [],
    works: supabaseData.works ? (supabaseData.works as DetailEntry[]) : [],
    sources: supabaseData.sources ? (supabaseData.sources as DetailEntry[]) : [],
    references: supabaseData.related_references ? (supabaseData.related_references as DetailEntry[]) : [],
    lifeFacts: supabaseData.life_events_facts ? (supabaseData.life_events_facts as LifeFactEntry[]) : [], // <--- TAMBAHKAN INI
  };
};

// Helper: Mengonversi data dari format Form (camelCase, bersarang) ke format Supabase (snake_case, datar)
const convertFormToSupabase = (formData: FormIndividual): SupabaseIndividualInsert | SupabaseIndividualUpdate => {
  const supabaseData: SupabaseIndividualInsert | SupabaseIndividualUpdate = {
    name: formData.name,
    gender: formData.gender,
    photo_url: formData.photoUrl === '' ? null : formData.photoUrl,
    birth_date: formData.birth?.date === '' ? null : formData.birth?.date,
    birth_place: formData.birth?.place === '' ? null : formData.birth?.place,
    death_date: formData.death?.date === '' ? null : formData.death?.date,
    death_place: formData.death?.place === '' ? null : formData.death?.place,
    description: formData.description === '' ? null : formData.description,
    profession: formData.profession === '' ? null : formData.profession,
    notes: formData.notes === '' ? null : formData.notes,
    child_in_family_id: formData.childInFamilyId === '' ? null : formData.childInFamilyId,
    education: formData.education && formData.education.length > 0 ? formData.education as any : null,
    works: formData.works && formData.works.length > 0 ? formData.works as any : null,
    sources: formData.sources && formData.sources.length > 0 ? formData.sources as any : null,
    related_references: formData.references && formData.references.length > 0 ? formData.references as any : null,
    life_events_facts: formData.lifeFacts && formData.lifeFacts.length > 0 ? formData.lifeFacts as any : null, // <--- TAMBAHKAN INI
  };

  if ('id' in formData && formData.id) {
    (supabaseData as SupabaseIndividualUpdate).id = formData.id;
  }
  return supabaseData;
};


const DetailEntrySection: React.FC<{
  title: string;
  entries: DetailEntry[];
  updateEntries: (entries: DetailEntry[]) => void;
}> = ({ title, entries, updateEntries }) => {

  const addEntry = () => {
    const newEntry: DetailEntry = { id: `detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, title: '', description: '', period: '' };
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


// --- Komponen BARU untuk Fakta dan Peristiwa Kehidupan ---
const LifeFactSection: React.FC<{
  title: string;
  entries: LifeFactEntry[];
  updateEntries: (entries: LifeFactEntry[]) => void;
}> = ({ title, entries, updateEntries }) => {

  const addEntry = () => {
    const newEntry: LifeFactEntry = {
        id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: '', date: null, place: null, description: null, source_link: null, source_text: null
    };
    updateEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    updateEntries(entries.filter(entry => entry.id !== id));
  };

  const handleEntryChange = (id: string, field: keyof LifeFactEntry, value: string | null) => {
      const updatedEntries = entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value === '' ? null : value } : entry
      );
      updateEntries(updatedEntries);
  };

  return (
    <fieldset className="border border-base-300 p-4 rounded-md space-y-4">
      <legend className="px-2 font-semibold text-gray-300">{title}</legend>
      {entries.map((entry, index) => (
        <div key={entry.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-base-100/50 rounded">
            <div>
                <input type="text" placeholder="Jenis Fakta (e.g., Sekolah, Haji)" value={entry.type || ''} onChange={e => handleEntryChange(entry.id, 'type', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            </div>
            <div>
                <input type="text" placeholder="Tanggal (e.g., 2005)" value={entry.date || ''} onChange={e => handleEntryChange(entry.id, 'date', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            </div>
            <div>
                <input type="text" placeholder="Tempat (opsional)" value={entry.place || ''} onChange={e => handleEntryChange(entry.id, 'place', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            </div>
            <div>
                <input type="text" placeholder="Deskripsi/Detail" value={entry.description || ''} onChange={e => handleEntryChange(entry.id, 'description', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            </div>
            <div>
                <input type="text" placeholder="Link Sumber (URL)" value={entry.source_link || ''} onChange={e => handleEntryChange(entry.id, 'source_link', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
                <input type="text" placeholder="Teks Sumber" value={entry.source_text || ''} onChange={e => handleEntryChange(entry.id, 'source_text', e.target.value)} className="w-full bg-base-300 p-2 rounded-md" />
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
  const [formData, setFormData] = useState<FormIndividual>(
    initialData ? convertSupabaseToForm(initialData) : emptyIndividualForm
  );
  const { data: familyData } = useFamily();

  useEffect(() => {
    setFormData(initialData ? convertSupabaseToForm(initialData) : emptyIndividualForm);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement>, eventType: 'birth' | 'death', field: 'date' | 'place') => {
      const { value } = e.target;
      setFormData(prev => ({
          ...prev,
          [eventType]: {
              ...(prev[eventType] || {}),
              [field]: value === '' ? null : value
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG: AdminIndividualForm] Data form sebelum konversi:", formData); // DEBUG
    const supabaseFormattedData = convertFormToSupabase(formData);
    console.log("[DEBUG: AdminIndividualForm] Data form setelah konversi (siap ke Supabase):", supabaseFormattedData); // DEBUG
    onSave(supabaseFormattedData);
  };

  const renderFamilyOption = (family: Tables<'families'>['Row']) => {
    const spouse1 = family.spouse1_id ? familyData.individuals.get(family.spouse1_id)?.name : 'N/A';
    const spouse2 = family.spouse2_id ? familyData.individuals.get(family.spouse2_id)?.name : 'N/A';
    return `Family of ${spouse1} & ${spouse2} (ID: ${family.id})`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nama</label>
          <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Jenis Kelamin</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
            {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">URL Foto</label>
          <input type="text" name="photoUrl" value={formData.photoUrl || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Profesi</label>
          <input type="text" name="profession" value={formData.profession || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
        </div>
      </div>

      <fieldset className="border border-base-300 p-4 rounded-md">
        <legend className="px-2 font-semibold text-gray-300">Kelahiran</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Tanggal (e.g., 21 Apr 1926)" value={formData.birth?.date || ''} onChange={e => handleEventChange(e, 'birth', 'date')} className="w-full bg-base-100 p-2 rounded-md" />
            <input type="text" placeholder="Tempat" value={formData.birth?.place || ''} onChange={e => handleEventChange(e, 'birth', 'place')} className="w-full bg-base-100 p-2 rounded-md" />
        </div>
      </fieldset>

      <fieldset className="border border-base-300 p-4 rounded-md">
        <legend className="px-2 font-semibold text-gray-300">Kematian</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Tanggal" value={formData.death?.date || ''} onChange={e => handleEventChange(e, 'death', 'date')} className="w-full bg-base-100 p-2 rounded-md" />
            <input type="text" placeholder="Tempat" value={formData.death?.place || ''} onChange={e => handleEventChange(e, 'death', 'place')} className="w-full bg-base-100 p-2 rounded-md" />
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Anak dari Keluarga</label>
        <select name="childInFamilyId" value={formData.childInFamilyId || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
            <option value="">Tidak ada</option>
            {Array.from(familyData.families.values()).map(f => (
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
      <DetailEntrySection title="Referensi" entries={formData.references || []} updateEntries={(e) => setFormData(prev => ({...prev, references: e}))} />

      {/* <--- TAMBAHKAN BAGIAN INI UNTUK FAKTA DAN PERISTIWA KEHIDUPAN --- */}
      <LifeFactSection title="Fakta & Peristiwa Kehidupan" entries={formData.lifeFacts || []} updateEntries={(e) => setFormData(prev => ({...prev, lifeFacts: e}))} />


      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="bg-base-300 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Batal</button>
        <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">Simpan</button>
      </div>
    </form>
  );
};