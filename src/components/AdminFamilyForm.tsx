// Silsilah_1/src/components/AdminFamilyForm.tsx
import React, { useState, useEffect } from 'react';
import { Tables } from '../types/supabase';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type SupabaseFamily = Tables<'families'>['Insert'] | Tables<'families'>['Update'];

interface AdminFamilyFormProps {
  onSave: (family: SupabaseFamily) => void;
  onClose: () => void;
  initialData?: Family | null;
  individuals: Individual[];
}

export const AdminFamilyForm: React.FC<AdminFamilyFormProps> = ({ onSave, onClose, initialData, individuals }) => {
  const [spouse1, setSpouse1] = useState<string | null>(null);
  const [spouse2, setSpouse2] = useState<string | null>(null);
  const [marriageDate, setMarriageDate] = useState<string | null>(null);
  const [marriagePlace, setMarriagePlace] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSpouse1(initialData.spouse1_id);
      setSpouse2(initialData.spouse2_id);
      setMarriageDate(initialData.marriage_date);
      setMarriagePlace(initialData.marriage_place);
    } else {
      // Reset form
      setSpouse1(null);
      setSpouse2(null);
      setMarriageDate(null);
      setMarriagePlace(null);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi dasar
    if (!spouse1 && !spouse2) {
        alert("Setidaknya satu pasangan harus dipilih.");
        return;
    }

    const familyData: SupabaseFamily = {
        spouse1_id: spouse1 || null,
        spouse2_id: spouse2 || null,
        marriage_date: marriageDate || null,
        marriage_place: marriagePlace || null,
    };

    if (initialData?.id) {
        (familyData as Tables<'families'>['Update']).id = initialData.id;
    }
    
    onSave(familyData);
  };
  
  // Filter individu yang belum menjadi pasangan di form ini
  const availableForSpouse2 = individuals.filter(ind => ind.id !== spouse1);
  const availableForSpouse1 = individuals.filter(ind => ind.id !== spouse2);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 1</label>
          <select 
            value={spouse1 || ''} 
            onChange={(e) => setSpouse1(e.target.value || null)} 
            className="w-full bg-base-300 p-2 rounded-md"
          >
            <option value="">Pilih Individu</option>
            {availableForSpouse1.map(ind => (
              <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 2</label>
          <select 
            value={spouse2 || ''} 
            onChange={(e) => setSpouse2(e.target.value || null)} 
            className="w-full bg-base-300 p-2 rounded-md"
          >
            <option value="">Pilih Individu</option>
            {availableForSpouse2.map(ind => (
              <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="border border-base-300 p-4 rounded-md">
        <legend className="px-2 font-semibold text-gray-300">Detail Pernikahan</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tanggal Pernikahan</label>
            <input 
              type="text" 
              placeholder="e.g., 10 Jan 1980"
              value={marriageDate || ''} 
              onChange={(e) => setMarriageDate(e.target.value)} 
              className="w-full bg-base-100 p-2 rounded-md" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tempat Pernikahan</label>
            <input 
              type="text" 
              placeholder="e.g., Surabaya"
              value={marriagePlace || ''} 
              onChange={(e) => setMarriagePlace(e.target.value)} 
              className="w-full bg-base-100 p-2 rounded-md" 
            />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="bg-base-300 hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Batal</button>
        <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-md">Simpan Keluarga</button>
      </div>
    </form>
  );
};