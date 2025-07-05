// src/components/FamilyTreeView.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useFamily } from '../hooks/useFamilyData';
import { FamilyFlowVisualization } from './FamilyFlowVisualization'; // <-- PERBAIKAN: Impor dengan benar
import { Tables } from '../types/supabase';

export const FamilyTreeView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: familyData, loading, error } = useFamily();
    const [viewType, setViewType] = useState<'descendants' | 'ancestors'>('descendants');

    const hardcodedProgenitorId = "bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b"; // Ganti dengan ID Qomaruddin
    const [dAbovilleProgenitorId, setDAbovilleProgenitorId] = useState<string | null>(hardcodedProgenitorId);

    const individualList = useMemo(() => Array.from(familyData.individuals.values()), [familyData.individuals]);

    const [rootId, setRootId] = useState<string | null>(null);

    useEffect(() => {
        // Logika untuk menentukan rootId default
        if (id && familyData.individuals.has(id)) {
            setRootId(id);
        } else if (!id && hardcodedProgenitorId && familyData.individuals.has(hardcodedProgenitorId)) {
            setRootId(hardcodedProgenitorId);
        } else if (!id && individualList.length > 0) {
            setRootId(individualList[0].id);
        }
    }, [id, familyData.individuals, individualList, hardcodedProgenitorId]);

    if (loading) return <div className="text-center p-8 text-white">Memuat data silsilah...</div>;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;
    
    return (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-base-100">
            {/* Header dengan kontrol */}
            <div className="p-4 bg-base-200 shadow-md z-10 flex items-center space-x-4 flex-wrap">
                 <select 
                    value={rootId || ''} 
                    onChange={e => setRootId(e.target.value)} 
                    className="select select-bordered w-full max-w-xs"
                 >
                    <option value="" disabled>Pilih Individu Utama</option>
                    {individualList.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                 </select>
                
                {dAbovilleProgenitorId && familyData.individuals.has(dAbovilleProgenitorId) && (
                    <div className="text-sm text-gray-300">
                        Progenitor: <span className='font-bold'>{familyData.individuals.get(dAbovilleProgenitorId)?.name}</span>
                    </div>
                )}

                <div className="btn-group">
                    <button
                        onClick={() => setViewType('descendants')}
                        className={`btn ${viewType === 'descendants' ? 'btn-accent' : ''}`}
                    >
                        Keturunan
                    </button>
                    <button
                        onClick={() => setViewType('ancestors')}
                        className={`btn ${viewType === 'ancestors' ? 'btn-accent' : ''}`}
                    >
                        Leluhur
                    </button>
                </div>
                <span className="text-gray-400 text-sm hidden md:block">Gunakan mouse untuk zoom dan geser.</span>
            </div>
            
            {/* Area untuk Visualisasi Graf */}
            <div className="flex-grow w-full h-full overflow-hidden">
                {(rootId && dAbovilleProgenitorId && familyData.individuals.size > 0) ? (
                    <FamilyFlowVisualization
                        rootIndividualId={rootId}
                        individuals={familyData.individuals}
                        families={familyData.families}
                        dAbovilleProgenitorId={dAbovilleProgenitorId}
                        viewType={viewType}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center p-8 text-xl text-gray-400">
                        {individualList.length === 0 ? "Tidak ada data individu untuk ditampilkan." : "Pilih individu utama untuk memulai visualisasi."}
                    </div>
                )}
            </div>
        </div>
    );
};