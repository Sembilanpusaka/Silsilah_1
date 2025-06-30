// components/AdminFamilyForm.tsx
import React, { useState, useEffect } from 'react';
import { Family, Individual, LifeEvent } from '../src/types'; // Path diperbaiki
import { useFamily } from '../hooks/useFamilyData';

interface AdminFamilyFormProps {
  onSave: (family: Family) => void; // Perbaiki tipe ke Family
  onClose: () => void;
  initialData?: Family | null;
}

const emptyFamily: Omit<Family, 'id'> = {
  spouse1_id: null, // Asumsi spouseId bisa null di DB
  spouse2_id: null, // Asumsi spouseId bisa null di DB
  children_ids: [], // Asumsi childrenIds adalah array di DB
  marriage_date: null, // Asumsi ini bisa null
  marriage_place: null, // Asumsi ini bisa null
  divorce_date: null, // Asumsi ini bisa null
  divorce_place: null, // Asumsi ini bisa null
};

export const AdminFamilyForm: React.FC<AdminFamilyFormProps> = ({ onSave, onClose, initialData }) => {
  const { individuals, loading, error } = useFamily(); // Destructuring diperbaiki
  const [formData, setFormData] = useState<Omit<Family, 'id'> | Family>(initialData || emptyFamily);

  useEffect(() => {
    // Inisialisasi form dengan data keluarga yang ada atau kosong
    setFormData(initialData || emptyFamily);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    // Mengubah string kosong menjadi null jika kolom di DB nullable (UUID)
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleChildrenChange = (childId: string) => {
      setFormData(prev => {
          const currentChildren = prev.children_ids || []; // Perbaiki nama properti
          const newChildren = currentChildren.includes(childId)
            ? currentChildren.filter(id => id !== childId)
            : [...currentChildren, childId];
          return { ...prev, children_ids: newChildren }; // Perbaiki nama properti
      });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Family); // formData adalah Family atau Omit<Family, 'id'>
  };

  if (loading) return <div className="text-white text-center p-4">Memuat individu untuk form...</div>;
  if (error) return <div className="text-error text-center p-4">Error memuat individu: {error}</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 1</label>
                <select name="spouse1_id" value={formData.spouse1_id || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
                    <option value="">Pilih Individu</option>
                    {Array.from(individuals.values()).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pasangan 2</label>
                <select name="spouse2_id" value={formData.spouse2_id || ''} onChange={handleChange} className="w-full bg-base-300 p-2 rounded-md">
                    <option value="">Pilih Individu</option>
                    {Array.from(individuals.values())
                        .filter(p => p.id !== formData.spouse1_id) // Filter untuk mencegah pasangan sama
                        .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
        </div>
      
        <fieldset className="border border-base-300 p-4 rounded-md">
            <legend className="px-2 font-semibold text-gray-300">Pernikahan</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="date" placeholder="Tanggal" name="marriage_date" value={formData.marriage_date || ''} onChange={handleChange} className="w-full bg-base-100 p-2 rounded-md" />
                <input type="text" placeholder="Tempat" name="marriage_place" value={formData.marriage_place || ''} onChange={handleChange} className="w-full bg-base-100 p-2 rounded-md" />
            </div>
        </fieldset>
      
        <fieldset className="border border-base-300 p-4 rounded-md">
            <legend className="px-2 font-semibold text-gray-300">Perceraian</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="date" placeholder="Tanggal" name="divorce_date" value={formData.divorce_date || ''} onChange={handleChange} className="w-full bg-base-100 p-2 rounded-md" />
                <input type="text" placeholder="Tempat" name="divorce_place" value={formData.divorce_place || ''} onChange={handleChange} className="w-full bg-base-100 p-2 rounded-md" />
            </div>
        </fieldset>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Anak-anak</label>
            <div className="max-h-60 overflow-y-auto bg-base-300 p-4 rounded-md grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from(individuals.values())
                    .filter(p => p.id !== formData.spouse1_id && p.id !== formData.spouse2_id)
                    .map(p => (
                    <label key={p.id} className="flex items-center space-x-2 p-1 rounded hover:bg-base-100">
                        <input
                            type="checkbox"
                            checked={formData.children_ids?.includes(p.id)}
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