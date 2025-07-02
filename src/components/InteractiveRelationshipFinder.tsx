// Silsilah_1/src/components/InteractiveRelationshipFinder.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useFamily } from '../hooks/useFamilyData';
import { Tables } from '../types/supabase';
import { Link } from 'react-router-dom';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

interface PathNode {
    id: string;
    name: string;
    relationship: string;
}

export const InteractiveRelationshipFinder: React.FC = () => {
    const { data: familyData, loading, error } = useFamily();
    const [startPersonId, setStartPersonId] = useState<string | null>(null);
    const [endPersonId, setEndPersonId] = useState<string | null>(null);
    const [path, setPath] = useState<PathNode[] | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const individuals = useMemo(() => Array.from(familyData.individuals.values()).sort((a,b) => a.name.localeCompare(b.name)), [familyData.individuals]);

    const findRelationshipPath = useCallback((startId: string, endId: string): PathNode[] | null => {
        if (!startId || !endId || startId === endId) {
            console.log("[DEBUG: findRelationshipPath] Invalid start/end IDs or same ID.");
            return null;
        }

        const queue: { id: string; path: PathNode[] }[] = [];
        const visited = new Set<string>();

        const startPerson = familyData.individuals.get(startId);
        const endPerson = familyData.individuals.get(endId);

        if (!startPerson || !endPerson) {
            console.log("[DEBUG: findRelationshipPath] Start or end person not found in data.");
            return null;
        }

        queue.push({ id: startId, path: [{ id: startId, name: startPerson.name, relationship: 'Diri Sendiri' }] });
        visited.add(startId);
        console.log(`[DEBUG: findRelationshipPath] Memulai pencarian dari: ${startPerson.name} (${startId}) ke ${endPerson.name} (${endId})`);


        while (queue.length > 0) {
            const { id: currentId, path: currentPath } = queue.shift()!;
            const currentPerson = familyData.individuals.get(currentId);

            console.log(`[DEBUG: findRelationshipPath] Mengunjungi: ${currentPerson?.name} (${currentId})`);

            if (currentId === endId) {
                console.log(`[DEBUG: findRelationshipPath] Jalur ditemukan hingga: ${currentPerson?.name}`);
                return currentPath;
            }

            if (!currentPerson) continue;

            // --- Menjelajahi hubungan ---

            // 1. Ke Anak-anak (turun)
            const familiesAsSpouse = Array.from(familyData.families.values()).filter(
                f => f.spouse1_id === currentId || f.spouse2_id === currentId
            );
            console.log(`[DEBUG: findRelationshipPath] Keluarga sebagai pasangan untuk ${currentPerson.name}:`, familiesAsSpouse.length);
            for (const family of familiesAsSpouse) {
                if (Array.isArray(family.children_ids)) {
                    for (const childId of family.children_ids) {
                        if (!visited.has(childId)) {
                            const child = familyData.individuals.get(childId);
                            if (child) {
                                console.log(`[DEBUG: findRelationshipPath] Menambahkan anak: ${child.name}`);
                                visited.add(childId);
                                queue.push({
                                    id: childId,
                                    path: [...currentPath, { id: childId, name: child.name, relationship: 'Anak' }]
                                });
                            }
                        }
                    }
                }
            }

            // 2. Ke Orang Tua (naik)
            if (currentPerson.child_in_family_id) {
                const parentFamily = familyData.families.get(currentPerson.child_in_family_id);
                if (parentFamily) {
                    console.log(`[DEBUG: findRelationshipPath] Keluarga orang tua ditemukan: ${parentFamily.id}`);
                    if (parentFamily.spouse1_id && !visited.has(parentFamily.spouse1_id)) {
                        const father = familyData.individuals.get(parentFamily.spouse1_id);
                        if (father) {
                            console.log(`[DEBUG: findRelationshipPath] Menambahkan ayah: ${father.name}`);
                            visited.add(father.id);
                            queue.push({
                                id: father.id,
                                path: [...currentPath, { id: father.id, name: father.name, relationship: 'Ayah' }]
                            });
                        }
                    }
                    if (parentFamily.spouse2_id && !visited.has(parentFamily.spouse2_id)) {
                        const mother = familyData.individuals.get(parentFamily.spouse2_id);
                        if (mother) {
                            console.log(`[DEBUG: findRelationshipPath] Menambahkan ibu: ${mother.name}`);
                            visited.add(mother.id);
                            queue.push({
                                id: mother.id,
                                path: [...currentPath, { id: mother.id, name: mother.name, relationship: 'Ibu' }]
                            });
                        }
                    }
                } else {
                    console.log(`[DEBUG: findRelationshipPath] Keluarga orang tua ${currentPerson.child_in_family_id} tidak ditemukan.`);
                }
            } else {
                console.log(`[DEBUG: findRelationshipPath] ${currentPerson.name} tidak punya child_in_family_id.`);
            }

            // 3. Ke Pasangan (samping)
            const familiesWhereCurrentIsSpouse = Array.from(familyData.families.values()).filter(
                f => (f.spouse1_id === currentId || f.spouse2_id === currentId)
            );
            console.log(`[DEBUG: findRelationshipPath] Keluarga dengan ${currentPerson.name} sebagai pasangan:`, familiesWhereCurrentIsSpouse.length);
            for (const family of familiesWhereCurrentIsSpouse) {
                const spouseId = family.spouse1_id === currentId ? family.spouse2_id : family.spouse1_id;
                if (spouseId && !visited.has(spouseId)) {
                    const spouse = familyData.individuals.get(spouseId);
                    if (spouse) {
                        console.log(`[DEBUG: findRelationshipPath] Menambahkan pasangan: ${spouse.name}`);
                        visited.add(spouseId);
                        queue.push({
                            id: spouseId,
                            path: [...currentPath, { id: spouseId, name: spouse.name, relationship: 'Pasangan' }]
                        });
                    }
                }
            }
        }
        console.log("[DEBUG: findRelationshipPath] Tidak ada jalur ditemukan.");
        return null;
    }, [familyData.individuals, familyData.families]);


    const handleFindPath = () => {
        setSearchPerformed(true);
        if (startPersonId && endPersonId) {
            const resultPath = findRelationshipPath(startPersonId, endPersonId);
            setPath(resultPath);
        } else {
            setPath(null);
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Memuat data silsilah...</div>;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 bg-base-200 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-white mb-6">Pencarian Hubungan Interaktif</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Mulai dari</label>
                    <select
                        value={startPersonId || ''}
                        onChange={(e) => setStartPersonId(e.target.value)}
                        className="w-full bg-base-300 p-2 rounded-md"
                    >
                        <option value="">Pilih Individu</option>
                        {individuals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Menuju</label>
                    <select
                        value={endPersonId || ''}
                        onChange={(e) => setEndPersonId(e.target.value)}
                        className="w-full bg-base-300 p-2 rounded-md"
                    >
                        <option value="">Pilih Individu</option>
                        {individuals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleFindPath}
                        className="w-full bg-accent hover:bg-secondary text-white font-bold py-2 px-4 rounded-md"
                        disabled={!startPersonId || !endPersonId}
                    >
                        Cari Hubungan
                    </button>
                </div>
            </div>

            {searchPerformed && (
                <div className="bg-base-100 p-6 rounded-lg min-h-[150px] flex flex-col items-center justify-center">
                    {path && path.length > 0 ? (
                        <div className="w-full">
                            <h2 className="text-xl font-semibold text-white mb-4">Jalur Hubungan Ditemukan:</h2>
                            <div className="flex flex-wrap items-center justify-center space-x-2 md:space-x-4">
                                {path.map((node, index) => (
                                    <React.Fragment key={node.id}>
                                        <div className="text-center">
                                            <Link to={`/individual/${node.id}`} className="block text-accent hover:underline font-semibold">
                                                {node.name}
                                            </Link>
                                            <span className="text-sm text-gray-400">({node.relationship})</span>
                                        </div>
                                        {index < path.length - 1 && (
                                            <span className="text-white text-2xl">→</span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400">Tidak ditemukan jalur hubungan langsung antara individu yang dipilih.</p>
                    )}
                </div>
            )}
        </div>
    );
};