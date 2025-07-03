// Silsilah_1/src/components/AdminFamilyForm.tsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../hooks/useFamilyData';
import { Tables } from '../types/supabase'; // <--- PASTIKAN IMPOR INI BENAR

// Definisikan tipe FormFamily yang sesuai dengan struktur form Anda
interface FormFamily {
  id?: string;
  spouse1Id: string | null;
  spouse2Id: string | null;
  childrenIds: string[] | null; // Ini adalah struktur di form (camelCase)
  marriage: { date: string | null; place: string | null; };
  divorce: { date: string | null; place: string | null; };
}

// Gunakan tipe Supabase yang digenerate untuk memastikan nama kolom sesuai
type SupabaseFamilyInsert = Tables<'families'>['Insert'];
type SupabaseFamilyUpdate = Tables<'families'>['Update'];

interface AdminFamilyFormProps {
  onSave: (family: SupabaseFamilyInsert | SupabaseFamilyUpdate) => void; // Perbaiki tipe onSave
  onClose: () => void;
  initialData?: Tables<'families'>['Row'] | null; // initialData datang dari Supabase (snake_case)
}

const emptyFamilyForm: FormFamily = {
  spouse1Id: null, spouse2Id: null, childrenIds: [],
  marriage: { date: null, place: null}, divorce: { date: null, place: null}
};

// Helper: Mengonversi data dari format Supabase (snake_case, datar) ke format Form (camelCase, bersarang)
const convertSupabaseFamilyToForm = (supabaseData: Tables<'families'>['Row']): FormFamily => {
  return {
    id: supabaseData.id,
    spouse1Id: supabaseData.spouse1_id, // snake_case ke camelCase
    spouse2Id: supabaseData.spouse2_id, // snake_case ke camelCase
    childrenIds: supabaseData.children_ids, // snake_case ke camelCase
    marriage: {
      date: supabaseData.marriage_date,
      place: supabaseData.marriage_place
    },
    divorce: {
      date: supabaseData.divorce_date,
      place: supabaseData.divorce_place
    }
  };
};

// Helper: Mengonversi data dari format Form (camelCase, bersarang) ke format Supabase (snake_case, datar)
const convertFormFamilyToSupabase = (formData: FormFamily): SupabaseFamilyInsert | SupabaseFamilyUpdate => {
  const supabaseData: SupabaseFamilyInsert | SupabaseFamilyUpdate = {
    spouse1_id: formData.spouse1Id === '' ? null : formData.spouse1Id,
    spouse2_id: formData.spouse2Id === '' ? null : formData.spouse2Id,
    children_ids: formData.childrenIds && formData.childrenIds.length > 0 ? formData.childrenIds : null,
    marriage_date: formData.marriage?.date === '' ? null : formData.marriage?.date,
    marriage_place: formData.marriage?.place === '' ? null : formData.marriage?.place,
    divorce_date: formData.divorce?.date === '' ? null : formData.divorce?.date,
    divorce_place: formData.divorce?.place === '' ? null : formData.divorce?.place,
  };

  if ('id' in formData && formData.id) {
    (supabaseData as SupabaseFamilyUpdate).id = formData.id;
  }
  return supabaseData;
};


export const AdminFamilyForm: React.FC<AdminFamilyFormProps> = ({ onSave, onClose, initialData }) => { // <--- PASTIKAN EKSPOR INI BENAR
  const [formData, setFormData] = useState<FormFamily>(
    initialData ? convertSupabaseFamilyToForm(initialData) : emptyFamilyForm
  );
  const { data: familyData } = useFamily();
  const individuals = Array.from(familyData.individuals.values());

  useEffect(() => {
    setFormData(initialData ? convertSupabaseFamilyToForm(initialData) : emptyFamilyForm);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleChildrenChange = (childId: string) => {
      setFormData(prev => {
          const currentChildren = prev.childrenIds || [];
          const newChildren = currentChildren.includes(childId)
            ? currentChildren.filter(id => id !== childId)
            : [...currentChildren, childId];
          return { ...prev, childrenIds: newChildren };
      });
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement>, eventType: 'marriage' | 'divorce', field: 'date' | 'place') => {
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
    console.log("[DEBUG: AdminFamilyForm] Data form sebelum konversi:", formData);
    const supabaseFormattedData = convertFormFamilyToSupabase(formData);
    console.log("[DEBUG: AdminFamilyForm] Data form setelah konversi (siap ke Supabase):", supabaseFormattedData);
    onSave(supabaseFormattedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 1</label>
                <select name="spouse1Id" value={formData.spouse1Id || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
                    <option value="">Pilih Individu</option>
                    {individuals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 2</label>
                <select name="spouse2Id" value={formData.spouse2Id || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
                    <option value="">Pilih Individu</option>
                    {individuals.filter(p => p.id !== formData.spouse1Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
        </div>

        <fieldset className="border border-base-300 p-4 rounded-md">
            <legend className="px-2 font-semibold text-gray-300">Pernikahan</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Tanggal" value={formData.marriage?.date || ''} onChange={e => handleEventChange(e, 'marriage', 'date')} className="w-full bg-base-100 p-2 rounded-md" />
                <input type="text" placeholder="Tempat" value={formData.marriage?.place || ''} onChange={e => handleEventChange(e, 'marriage', 'place')} className="w-full bg-base-100 p-2 rounded-md" />
            </div>
        </fieldset>

        <fieldset className="border border-base-300 p-4 rounded-md">
            <legend className="px-2 font-semibold text-gray-300">Perceraian</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Tanggal" value={formData.divorce?.date || ''} onChange={e => handleEventChange(e, 'divorce', 'date')} className="w-full bg-base-100 p-2 rounded-md" />
                <input type="text" placeholder="Tempat" value={formData.divorce?.place || ''} onChange={e => handleEventChange(e, 'divorce', 'place')} className="w-full bg-base-100 p-2 rounded-md" />
            </div>
        </fieldset>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Anak-anak</label>
            <div className="max-h-60 overflow-y-auto bg-base-300 p-4 rounded-md grid grid-cols-2 md:grid-cols-3 gap-2">
                {individuals
                    .filter(p => p.id !== formData.spouse1Id && p.id !== formData.spouse2Id)
                    .map(p => (
                    <label key={p.id} className="flex items-center space-x-2 p-1 rounded hover:bg-base-100">
                        <input
                            type="checkbox"
                            checked={formData.childrenIds?.includes(p.id) || false}
                            onChange={() => handleChildrenChange(p.id)}
                            className="form-checkbox h-4 w-4 text-primary bg-gray-700 border-gray-600 rounded"
                        />
                        <span>{p.name}</span>
                    </label>
                ))}
            </div>
        </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="bg-base-300 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Batal</button>
        <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">Simpan</button>
      </div>
    </form>
  );
};