// Silsilah_1/src/components/FamilyTreeView.tsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFamily } from '../hooks/useFamilyData';
import { D3FamilyTreeVisualization } from './D3FamilyTreeVisualization'; // <--- Impor komponen baru
import { Tables } from '../types/supabase';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

export const FamilyTreeView: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // ID dari URL jika diakses dari IndividualProfile
    const { data: familyData, loading, error } = useFamily();
    const navigate = useNavigate();
    const [viewType, setViewType] = useState<'descendants' | 'ancestors'>('descendants');
    // Set rootId awal dari URL, atau individu pertama jika ada, atau null
    const [rootId, setRootId] = useState<string | null>(id || (familyData.individuals.size > 0 ? Array.from(familyData.individuals.keys())[0] : null));

    const individualList = useMemo(() => Array.from(familyData.individuals.values()), [familyData.individuals]);

    // Sinkronkan rootId dengan ID dari URL jika berubah atau set default
    useEffect(() => {
        if (id && familyData.individuals.has(id)) {
            if (rootId !== id) setRootId(id);
        } else if (familyData.individuals.size > 0 && !rootId) {
            setRootId(Array.from(familyData.individuals.keys())[0]);
        } else if (!id && familyData.individuals.size === 0 && rootId) {
            // Reset rootId jika tidak ada individu
            setRootId(null);
        }
    }, [id, familyData.individuals, rootId]);


    const rootIndividual = useMemo(() => rootId ? familyData.individuals.get(rootId) : undefined, [rootId, familyData.individuals]);


    if (loading) return <div className="text-center p-8 text-white">Memuat data silsilah...</div>;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;
    if (!rootIndividual && individualList.length === 0) return <div className="text-center p-8 text-xl text-gray-400">Tidak ada individu yang tercatat.</div>;
    if (!rootIndividual && individualList.length > 0 && !rootId) return <div className="text-center p-8 text-xl text-gray-400">Pilih individu dari daftar di atas.</div>;


    return (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col">
            <div className="p-4 bg-base-200 shadow-md z-10 flex items-center space-x-4">
                 <select value={rootId || ''} onChange={e => setRootId(e.target.value)} className="bg-base-300 border border-gray-600 rounded-md p-2 text-white">
                    <option value="">Pilih Individu Utama</option>
                    {individualList.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                 </select>
                <button
                    onClick={() => setViewType('descendants')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${viewType === 'descendants' ? 'bg-accent text-white' : 'bg-base-300 text-gray-300 hover:bg-base-100'}`}
                >
                    Keturunan
                </button>
                <button
                    onClick={() => setViewType('ancestors')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${viewType === 'ancestors' ? 'bg-accent text-white' : 'bg-base-300 text-gray-300 hover:bg-base-100'}`}
                >
                    Leluhur
                </button>
                <span className="text-gray-400 text-sm hidden md:block">Gunakan mouse untuk zoom dan geser.</span>
            </div>
            <div className="flex-grow w-full h-full overflow-hidden">
                {rootId && ( // Render hanya jika rootId valid
                    <D3FamilyTreeVisualization
                        rootIndividualId={rootId}
                        individuals={familyData.individuals}
                        families={familyData.families}
                        viewType={viewType}
                        width={window.innerWidth * 0.9} // Lebar sesuai viewport
                        height={window.innerHeight * 0.7} // Tinggi sesuai viewport
                    />
                )}
            </div>
        </div>
    );
};