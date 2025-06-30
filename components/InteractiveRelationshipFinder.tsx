// components/InteractiveRelationshipFinder.tsx
import React, { useState, useMemo } from 'react';
import { useFamily } from '../hooks/useFamilyData';
import { Link } from 'react-router-dom';
import { Individual, Family } from '../src/types'; // Path diperbaiki
import { SearchIcon } from './Icons';

type PathNode = {
    id: string;
    relationship: string;
};

export const InteractiveRelationshipFinder: React.FC = () => {
    // Destructuring diperbaiki
    const { individuals, families, loading, error } = useFamily(); 
    const [person1Id, setPerson1Id] = useState<string>('');
    const [person2Id, setPerson2Id] = useState<string>('');

    const allIndividualsSorted = useMemo(() => {
        return Array.from(individuals.values()).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    }, [individuals]); // Dependensi diperbaiki

    const path = useMemo<PathNode[] | null>(() => {
        if (!person1Id || !person2Id || person1Id === person2Id || individuals.size === 0) return null; // Tambahkan cek individu kosong

        const queue: { id: string; path: PathNode[] }[] = [{ id: person1Id, path: [{ id: person1Id, relationship: 'Start' }] }];
        const visited = new Set<string>([person1Id]);

        while (queue.length > 0) {
            const { id, path: currentPath } = queue.shift()!;
            
            if (id === person2Id) {
                return currentPath;
            }

            const currentPerson = individuals.get(id); 
            if (!currentPerson) continue; // Lewati jika individu tidak ditemukan

            // Parents (Cari keluarga di mana currentPerson adalah anak)
            const parentFamily = currentPerson.child_in_family_id ? families.get(currentPerson.child_in_family_id) : undefined; // Perbaiki nama properti
            if (parentFamily) {
                if(parentFamily.spouse1_id && !visited.has(parentFamily.spouse1_id)) { 
                    visited.add(parentFamily.spouse1_id);
                    queue.push({ id: parentFamily.spouse1_id, path: [...currentPath, { id: parentFamily.spouse1_id, relationship: 'Ayah' }] }); 
                }
                if(parentFamily.spouse2_id && !visited.has(parentFamily.spouse2_id)) { 
                    visited.add(parentFamily.spouse2_id);
                    queue.push({ id: parentFamily.spouse2_id, path: [...currentPath, { id: parentFamily.spouse2_id, relationship: 'Ibu' }] }); 
                }
            }

            // Spouses and Children (Cari keluarga di mana currentPerson adalah pasangan)
            const spouseFamilies = Array.from(families.values()).filter(f => f.spouse1_id === id || f.spouse2_id === id); // Perbaiki nama properti
            for(const family of spouseFamilies) {
                const spouseId = family.spouse1_id === id ? family.spouse2_id : family.spouse1_id; 
                if(spouseId && !visited.has(spouseId)) {
                    visited.add(spouseId);
                    queue.push({ id: spouseId, path: [...currentPath, { id: spouseId, relationship: 'Pasangan' }] });
                }
                if (family.children_ids && Array.isArray(family.children_ids)) { // Perbaiki nama properti dan pastikan array
                    for(const childId of family.children_ids) {
                        if(!visited.has(childId)) {
                            visited.add(childId);
                            queue.push({ id: childId, path: [...currentPath, { id: childId, relationship: 'Anak' }] });
                        }
                    }
                }
            }
        }
        return null;
    }, [person1Id, person2Id, individuals, families]); // Dependensi diperbaiki

    const renderPath = () => {
        if (!path) {
            return person1Id && person2Id && <p className="text-center text-warning mt-8">Tidak ditemukan jalur hubungan langsung.</p>;
        }

        return (
            <div className="mt-8">
                <h3 className="text-xl font-bold text-white text-center mb-6">Jalur Hubungan</h3>
                <div className="flex flex-wrap justify-center items-center gap-2">
                    {path.map((node, index) => {
                        const person = individuals.get(node.id); 
                        if (!person) return null; // Guard jika individu tidak ditemukan
                        return (
                           <React.Fragment key={node.id}>
                                {index > 0 && <div className="text-gray-400 font-bold text-2xl mx-2">&rarr;</div>}
                                <Link to={`/individual/${person.id}`} className="flex flex-col items-center p-3 bg-base-300 rounded-lg text-center hover:bg-primary transition-colors">
                                    <img src={person.photo_url || `https://picsum.photos/seed/${person.id}/80/80`} className="w-20 h-20 rounded-full object-cover mb-2" alt={person.name || 'Unknown'} />
                                    <p className="font-semibold text-white">{person.name}</p>
                                    {index > 0 && <p className="text-sm text-accent">{node.relationship}</p>}
                                </Link>
                           </React.Fragment>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="text-white text-center p-8">Memuat data silsilah untuk pencarian hubungan...</div>;
    }

    if (error) {
        return <div className="text-error text-center p-8">Error: {error}</div>;
    }

    if (individuals.size === 0) {
        return <div className="text-white text-center p-8">Tidak ada data individu untuk mencari hubungan. Silakan tambahkan individu dari Admin Page.</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-base-200 p-8 rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-white mb-2">Pencari Hubungan Interaktif</h1>
                <p className="text-gray-400 mb-6">Pilih dua individu untuk melihat bagaimana mereka terhubung.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="person1" className="block text-sm font-medium text-gray-300 mb-1">Individu 1</label>
                        <select id="person1" value={person1Id} onChange={e => setPerson1Id(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white focus:ring-primary focus:border-primary">
                            <option value="">Pilih individu...</option>
                            {allIndividualsSorted.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="person2" className="block text-sm font-medium text-gray-300 mb-1">Individu 2</label>
                        <select id="person2" value={person2Id} onChange={e => setPerson2Id(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-md p-2 text-white focus:ring-primary focus:border-primary">
                            <option value="">Pilih individu...</option>
                            {allIndividualsSorted.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
                {renderPath()}
            </div>
        </div>
    );
};