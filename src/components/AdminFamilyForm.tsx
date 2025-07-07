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
  const [childrenIds, setChildrenIds] = useState<string[]>([]); // <-- PERBAIKAN: State baru untuk anak

  useEffect(() => {
    if (initialData) {
      setSpouse1(initialData.spouse1_id);
      setSpouse2(initialData.spouse2_id);
      setMarriageDate(initialData.marriage_date);
      setMarriagePlace(initialData.marriage_place);
      setChildrenIds(initialData.children_ids || []); // <-- PERBAIKAN: Isi data anak jika sedang edit
    } else {
      // Reset form
      setSpouse1(null);
      setSpouse2(null);
      setMarriageDate(null);
      setMarriagePlace(null);
      setChildrenIds([]); // <-- PERBAIKAN: Kosongkan data anak
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spouse1 && !spouse2) {
        alert("Setidaknya satu pasangan harus dipilih.");
        return;
    }

    const familyData: SupabaseFamily = {
        spouse1_id: spouse1 || null,
        spouse2_id: spouse2 || null,
        marriage_date: marriageDate || null,
        marriage_place: marriagePlace || null,
        children_ids: childrenIds, // <-- PERBAIKAN: Sertakan ID anak saat menyimpan
    };

    if (initialData?.id) {
        (familyData as Tables<'families'>['Update']).id = initialData.id;
    }
    
    onSave(familyData);
  };
  
  // <-- PERBAIKAN: Handler untuk multiple select anak -->
  const handleChildrenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    setChildrenIds(selectedIds);
  };

  // Filter individu agar tidak bisa menjadi pasangannya sendiri
  const availableForSpouse2 = individuals.filter(ind => ind.id !== spouse1);
  const availableForSpouse1 = individuals.filter(ind => ind.id !== spouse2);
  // Filter individu agar tidak bisa menjadi anaknya sendiri
  const availableChildren = individuals.filter(ind => ind.id !== spouse1 && ind.id !== spouse2);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 1</label>
          <select 
            value={spouse1 || ''} 
            onChange={(e) => setSpouse1(e.target.value || null)} 
            className="select select-bordered w-full"
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
            className="select select-bordered w-full"
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
              className="input input-bordered w-full" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tempat Pernikahan</label>
            <input 
              type="text" 
              placeholder="e.g., Surabaya"
              value={marriagePlace || ''} 
              onChange={(e) => setMarriagePlace(e.target.value)} 
              className="input input-bordered w-full" 
            />
          </div>
        </div>
      </fieldset>

      {/* <-- PERBAIKAN: Field baru untuk memilih anak --> */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Anak-anak</label>
        <p className="text-xs text-gray-500 mb-2">Tahan Ctrl (atau Cmd di Mac) untuk memilih lebih dari satu.</p>
        <select
            multiple={true}
            value={childrenIds}
            onChange={handleChildrenChange}
            className="select select-bordered w-full h-48"
        >
            {availableChildren.map(ind => (
                <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
        </select>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button type="button" onClick={onClose} className="btn">Batal</button>
        <button type="submit" className="btn btn-primary">Simpan Keluarga</button>
      </div>
    </form>
  );
};