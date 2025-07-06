// Silsilah_1/src/components/AdminIndividualForm.tsx
import React, { useState, useEffect } from 'react';
import { Tables } from '../types/supabase';

// =============================================================
// PERUBAHAN: Perbarui Tipe FormIndividual dan LifeFactEntry
// =============================================================
interface DetailEntry {
  id: string;
  title: string;
  description: string;
  period: string;
}

interface LifeFactEntry {
    id: string;
    type: string;
    date: string | null;
    place: string | null;
    description: string | null;
    source_link: string | null;
    source_text: string | null;
}

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
  references: DetailEntry[] | null;
  lifeFacts: LifeFactEntry[] | null;
  // =============================================================
  // PERUBAHAN: Tambahkan Properti Validasi
  // =============================================================
  validatedByAdmin: boolean;
  validatedByValidator: boolean;
  adminName: string | null;
  validatorName: string | null;
  validationDate: string | null;
}

type SupabaseIndividualInsert = Tables<'individuals'>['Insert'] & {
    validated_by_admin?: boolean;
    validated_by_validator?: boolean;
    admin_name?: string;
    validator_name?: string;
    validation_date?: string;
};
type SupabaseIndividualUpdate = Tables<'individuals'>['Update'] & {
    validated_by_admin?: boolean;
    validated_by_validator?: boolean;
    admin_name?: string;
    validator_name?: string;
    validation_date?: string;
};

enum Gender {
  Male = 'male',
  Female = 'female',
  Unknown = 'unknown',
}

import { useFamily } from '../hooks/useFamilyData';
import { DeleteIcon, PlusIcon } from './Icons';
import { Modal } from './Modal';

interface AdminIndividualFormProps {
  onSave: (individual: SupabaseIndividualInsert | SupabaseIndividualUpdate) => void;
  onClose: () => void;
  initialData?: Tables<'individuals'>['Row'] | null;
}

const emptyIndividualForm: FormIndividual = {
  name: '', gender: Gender.Unknown, photoUrl: null,
  birth: { date: null, place: null }, death: { date: null, place: null },
  description: null, profession: null, notes: null, childInFamilyId: null,
  education: [], works: [], sources: [], references: [],
  lifeFacts: [],
  // =============================================================
  // PERUBAHAN: Inisialisasi Properti Validasi
  // =============================================================
  validatedByAdmin: false,
  validatedByValidator: false,
  adminName: null,
  validatorName: null,
  validationDate: null,
};

const convertSupabaseToForm = (supabaseData: Tables<'individuals'>['Row']): FormIndividual => {
    // =============================================================
    // PERUBAHAN: Penyesuaian Tipe untuk 'initialData'
    // =============================================================
    const dataWithValidation = supabaseData as Individual & {
        validated_by_admin?: boolean | null;
        validated_by_validator?: boolean | null;
        admin_name?: string | null;
        validator_name?: string | null;
        validation_date?: string | null;
    };

    return {
        id: dataWithValidation.id,
        name: dataWithValidation.name,
        gender: dataWithValidation.gender,
        photoUrl: dataWithValidation.photo_url,
        birth: {
            date: dataWithValidation.birth_date,
            place: dataWithValidation.birth_place
        },
        death: {
            date: dataWithValidation.death_date,
            place: dataWithValidation.death_place
        },
        description: dataWithValidation.description,
        profession: dataWithValidation.profession,
        notes: dataWithValidation.notes,
        childInFamilyId: dataWithValidation.child_in_family_id,
        education: dataWithValidation.education ? (dataWithValidation.education as DetailEntry[]) : [],
        works: dataWithValidation.works ? (dataWithValidation.works as DetailEntry[]) : [],
        sources: dataWithValidation.sources ? (dataWithValidation.sources as DetailEntry[]) : [],
        references: dataWithValidation.related_references ? (dataWithValidation.related_references as DetailEntry[]) : [],
        lifeFacts: dataWithValidation.life_events_facts ? (dataWithValidation.life_events_facts as LifeFactEntry[]) : [],
        // =============================================================
        // PERUBAHAN: Konversi Properti Validasi dari Supabase ke Form
        // =============================================================
        validatedByAdmin: dataWithValidation.validated_by_admin || false,
        validatedByValidator: dataWithValidation.validated_by_validator || false,
        adminName: dataWithValidation.admin_name || null,
        validatorName: dataWithValidation.validator_name || null,
        validationDate: dataWithValidation.validation_date || null,
    };
};

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
    life_events_facts: formData.lifeFacts && formData.lifeFacts.length > 0 ? formData.lifeFacts as any : null,
    // =============================================================
    // PERUBAHAN: Konversi Properti Validasi dari Form ke Supabase
    // =============================================================
    validated_by_admin: formData.validatedByAdmin,
    validated_by_validator: formData.validatedByValidator,
    admin_name: formData.adminName === '' ? null : formData.adminName,
    validator_name: formData.validatorName === '' ? null : formData.validatorName,
    validation_date: formData.validationDate === '' ? null : formData.validationDate,
  };

  if ('id' in formData && formData.id) {
    (supabaseData as SupabaseIndividualUpdate).id = formData.id;
  }
  return supabaseData;
};

// ... (DetailEntrySection dan LifeFactSection tetap sama) ...
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
    // =============================================================
    // PERUBAHAN: Set Tanggal Validasi Otomatis Saat "initialData" Kosong (mode Add New)
    // =============================================================
    const initialForm = initialData ? convertSupabaseToForm(initialData) : {
        ...emptyIndividualForm,
        // Set validation date only if it's a new entry (no initialData ID)
        validationDate: !initialData?.id ? new Date().toISOString().split('T')[0] : null // YYYY-MM-DD
    };
    setFormData(initialForm);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement; // Cast for checkbox handling
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));
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
    return `Family of ${spouse1} & ${spouse2} (ID: ${family.id?.substring(0,8)})`;
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

      <LifeFactSection title="Fakta & Peristiwa Kehidupan" entries={formData.lifeFacts || []} updateEntries={(e) => setFormData(prev => ({...prev, lifeFacts: e}))} />

      {/* ============================================================= */}
      {/* PERUBAHAN: Tambahkan Bagian Validasi di AdminIndividualForm */}
      {/* ============================================================= */}
      <fieldset className="border border-base-300 p-4 rounded-md space-y-4">
        <legend className="px-2 font-semibold text-gray-300">Status Validasi Data</legend>
        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                name="validatedByAdmin"
                checked={formData.validatedByAdmin}
                onChange={handleChange}
                className="checkbox checkbox-primary"
            />
            <label className="text-gray-300">Divalidasi oleh Admin</label>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nama Admin</label>
            <input type="text" name="adminName" value={formData.adminName || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
        </div>

        <div className="flex items-center space-x-2">
            <input
                type="checkbox"
                name="validatedByValidator"
                checked={formData.validatedByValidator}
                onChange={handleChange}
                className="checkbox checkbox-primary"
            />
            <label className="text-gray-300">Divalidasi oleh Validator</label>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nama Validator</label>
            <input type="text" name="validatorName" value={formData.validatorName || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tanggal Validasi</label>
            <input type="date" name="validationDate" value={formData.validationDate || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md" />
            <p className="text-xs text-gray-500 mt-1">Tanggal ini akan otomatis terisi saat data baru dibuat, tetapi bisa diubah manual.</p>
        </div>
      </fieldset>


      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="bg-base-300 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Batal</button>
        <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">Simpan</button>
      </div>
    </form>
  );
};