// Silsilah_1/src/components/InteractiveRelationshipFinder.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFamily } from '../hooks/useFamilyData';
import { Tables } from '../types/supabase';
import { Link } from 'react-router-dom';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

// Define PathNode to store minimal information during BFS
interface PathNode {
    id: string;
    name: string;
    // Stores the type of relationship of THIS node to the *previous* node in the path
    relationshipToPrevious: 'Diri Sendiri' | 'Anak' | 'Ayah' | 'Ibu' | 'Pasangan';
    // This will be filled later for display
    javaneseRelationship?: string;
}

// Helper function to get Javanese kinship terms for direct up/down lineage
const getJavaneseLineageTerm = (type: 'up' | 'down', level: number): string => {
    // Max level to define, beyond this might be generic or "unknown"
    const maxLineageLevel = 13; // Corresponds to Giyeng

    const downTerms = [
        'Diri Sendiri', 'Anak', 'Putu', 'Buyut', 'Canggah', 'Wareng',
        'Udheg-udheg', 'Gantung siwur', 'Gropak senthe', 'Debog bosok',
        'Galih asem', 'Gropak waton', 'Cendheng', 'Giyeng'
    ];

    const upTerms = [
        'Diri Sendiri', 'Bapak/Ibu', 'Simbah/Eyang', 'Buyut', 'Canggah', 'Wareng',
        'Udheg-udheg', 'Gantung siwur', 'Gropak senthe', 'Debog bosok',
        'Galih asem', 'Gropak waton', 'Cendheng', 'Giyeng'
    ];

    if (level < 0) return 'Tidak Diketahui';
    if (level > maxLineageLevel) return `Generasi ke-${level} (Jawa: ${type === 'down' ? 'turunan mudhun' : 'turunan munggah'})`;

    if (type === 'down') {
        return downTerms[level];
    } else { // type === 'up'
        return upTerms[level];
    }
};

export const InteractiveRelationshipFinder: React.FC = () => {
    const { data: familyData, loading, error } = useFamily();
    const [startPersonId, setStartPersonId] = useState<string | null>(null);
    const [endPersonId, setEndPersonId] = useState<string | null>(null);
    const [path, setPath] = useState<PathNode[] | null>(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // State for "Lihat Hubungan Lain"
    const [selectedPersonForOtherRelations, setSelectedPersonForOtherRelations] = useState<string | null>(null);
    const [otherRelations, setOtherRelations] = useState<{ type: string, individuals: Individual[] }[]>([]);

    const individuals = useMemo(() => Array.from(familyData.individuals.values()).sort((a, b) => a.name.localeCompare(b.name)), [familyData.individuals]);

    // Function to calculate all direct relationships for a given person
    const calculateOtherRelationships = useCallback((personId: string) => {
        const person = familyData.individuals.get(personId);
        if (!person) return [];

        const relations: { type: string, individuals: Individual[] }[] = [];

        // 1. Children
        const children: Individual[] = [];
        Array.from(familyData.families.values()).forEach(family => {
            if ((family.spouse1_id === personId || family.spouse2_id === personId) && Array.isArray(family.children_ids)) {
                family.children_ids.forEach(childId => {
                    const child = familyData.individuals.get(childId);
                    if (child) children.push(child);
                });
            }
        });
        if (children.length > 0) {
            relations.push({ type: 'Anak', individuals: children.sort((a,b) => a.name.localeCompare(b.name)) });
        }

        // 2. Spouses
        const spouses: Individual[] = [];
        Array.from(familyData.families.values()).forEach(family => {
            if (family.spouse1_id === personId && family.spouse2_id) {
                const spouse = familyData.individuals.get(family.spouse2_id);
                if (spouse) spouses.push(spouse);
            } else if (family.spouse2_id === personId && family.spouse1_id) {
                const spouse = familyData.individuals.get(family.spouse1_id);
                if (spouse) spouses.push(spouse);
            }
        });
        if (spouses.length > 0) {
            relations.push({ type: 'Pasangan', individuals: spouses.sort((a,b) => a.name.localeCompare(b.name)) });
        }

        // 3. Parents
        const parents: Individual[] = [];
        if (person.child_in_family_id) {
            const parentFamily = familyData.families.get(person.child_in_family_id);
            if (parentFamily) {
                if (parentFamily.spouse1_id) {
                    const father = familyData.individuals.get(parentFamily.spouse1_id);
                    if (father) parents.push(father);
                }
                if (parentFamily.spouse2_id) {
                    const mother = familyData.individuals.get(parentFamily.spouse2_id);
                    if (mother) parents.push(mother);
                }
            }
        }
        if (parents.length > 0) {
            relations.push({ type: 'Orang Tua', individuals: parents.sort((a,b) => a.name.localeCompare(b.name)) });
        }

        // 4. Siblings (find common parents)
        const siblings: Individual[] = [];
        if (person.child_in_family_id) {
            const parentFamily = familyData.families.get(person.child_in_family_id);
            if (parentFamily && Array.isArray(parentFamily.children_ids)) {
                parentFamily.children_ids.forEach(siblingId => {
                    if (siblingId !== personId) { // Exclude self
                        const sibling = familyData.individuals.get(siblingId);
                        if (sibling) siblings.push(sibling);
                    }
                });
            }
        }
        if (siblings.length > 0) {
            relations.push({ type: 'Saudara Kandung', individuals: siblings.sort((a,b) => a.name.localeCompare(b.name)) });
        }

        return relations;
    }, [familyData.individuals, familyData.families]);

    useEffect(() => {
        if (selectedPersonForOtherRelations) {
            setOtherRelations(calculateOtherRelationships(selectedPersonForOtherRelations));
        } else {
            setOtherRelations([]);
        }
    }, [selectedPersonForOtherRelations, calculateOtherRelationships]);

    // Use a Map for faster lookup of visited nodes with their paths
    const findRelationshipPath = useCallback((startId: string, endId: string): PathNode[] | null => {
        if (!startId || !endId || startId === endId) {
            console.log("[DEBUG: findRelationshipPath] Invalid start/end IDs or same ID.");
            return null;
        }

        const queue: { id: string; path: PathNode[] }[] = [];
        const visited = new Set<string>(); // Tracks visited individual IDs to prevent cycles

        const startPerson = familyData.individuals.get(startId);
        const endPerson = familyData.individuals.get(endId);

        if (!startPerson || !endPerson) {
            console.log("[DEBUG: findRelationshipPath] Start or end person not found in data.");
            return null;
        }

        // Initialize with the start person
        queue.push({ id: startId, path: [{ id: startId, name: startPerson.name, relationshipToPrevious: 'Diri Sendiri' }] });
        visited.add(startId);

        console.log(`[DEBUG: findRelationshipPath] Memulai pencarian dari: ${startPerson.name} (${startId}) ke ${endPerson.name} (${endId})`);

        while (queue.length > 0) {
            const { id: currentId, path: currentPath } = queue.shift()!;
            const currentPerson = familyData.individuals.get(currentId);

            console.log(`[DEBUG: findRelationshipPath] Mengunjungi: ${currentPerson?.name} (${currentId})`);

            if (currentId === endId) {
                console.log(`[DEBUG: findRelationshipPath] Jalur ditemukan hingga: ${currentPerson?.name}`);
                // Process the found path to assign Javanese relationships
                const processedPath: PathNode[] = [];
                let currentJavaneseLevel = 0;
                let currentJavaneseDirection: 'up' | 'down' | 'same' = 'same'; // 'same' for start person, then changes

                // The first node is always 'Diri Sendiri'
                processedPath.push({ ...currentPath[0], javaneseRelationship: 'Diri Sendiri' });

                // Iterate from the second node to process relationships
                for (let i = 1; i < currentPath.length; i++) {
                    const node = currentPath[i];
                    const relationshipType = node.relationshipToPrevious;
                    let javaneseRelationshipTerm = '';

                    // Determine the primary direction of the path segment *from startPerson*
                    // This logic is simplified: if the path has gone up, it's 'up', if down, it's 'down'
                    // A transition (up then down) will still be based on the last type of movement.
                    // This means for X->Ayah->Anak, the 'Anak' will be relative to 'Ayah', not start X.
                    // For full relative terms (e.g., sepupu), a more complex graph algorithm (LCA) is needed.

                    if (relationshipType === 'Pasangan') {
                        javaneseRelationshipTerm = 'Pasangan';
                        // Level doesn't change for spouse in the context of lineage depth for Javanese terms
                        // Direction stays as it was before this spouse hop
                    } else if (relationshipType === 'Anak') {
                        if (currentJavaneseDirection === 'up' && currentJavaneseLevel > 0) {
                            // Complex case: going down after going up.
                            // We simplify here: the term is 'Anak' relative to the immediate parent.
                            // For specific Javanese terms like 'anak buyut', you'd need to calculate common ancestor and then distance.
                            javaneseRelationshipTerm = 'Anak';
                            // This path is now potentially changing direction or moving "sideways" from the main lineage.
                            // Resetting level or making it 'same' or 'unknown' might be more appropriate depending on desired complexity.
                            // For now, let's keep it simple: if it moves "Anak", the level increases relative to *where it currently is*.
                            currentJavaneseLevel++; // Continue increasing level for depth
                            currentJavaneseDirection = 'down'; // Solidify direction
                        } else {
                            currentJavaneseDirection = 'down';
                            currentJavaneseLevel++;
                            javaneseRelationshipTerm = getJavaneseLineageTerm('down', currentJavaneseLevel);
                        }
                    } else if (relationshipType === 'Ayah' || relationshipType === 'Ibu') {
                         if (currentJavaneseDirection === 'down' && currentJavaneseLevel > 0) {
                            // Complex case: going up after going down.
                            javaneseRelationshipTerm = relationshipType; // Fallback to basic
                            currentJavaneseLevel++;
                            currentJavaneseDirection = 'up'; // Solidify direction
                        } else {
                            currentJavaneseDirection = 'up';
                            currentJavaneseLevel++;
                            javaneseRelationshipTerm = getJavaneseLineageTerm('up', currentJavaneseLevel);
                        }
                    }
                    processedPath.push({ ...node, javaneseRelationship: javaneseRelationshipTerm });
                }
                return processedPath;
            }

            if (!currentPerson) continue;

            // 1. Ke Anak-anak (turun)
            const familiesAsSpouse = Array.from(familyData.families.values()).filter(
                f => f.spouse1_id === currentId || f.spouse2_id === currentId
            );
            for (const family of familiesAsSpouse) {
                if (Array.isArray(family.children_ids)) {
                    for (const childId of family.children_ids) {
                        if (childId && !visited.has(childId)) {
                            const child = familyData.individuals.get(childId);
                            if (child) {
                                visited.add(childId);
                                queue.push({
                                    id: childId,
                                    path: [...currentPath, {
                                        id: childId,
                                        name: child.name,
                                        relationshipToPrevious: 'Anak'
                                    }]
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
                    if (parentFamily.spouse1_id && !visited.has(parentFamily.spouse1_id)) {
                        const father = familyData.individuals.get(parentFamily.spouse1_id);
                        if (father) {
                            visited.add(father.id);
                            queue.push({
                                id: father.id,
                                path: [...currentPath, {
                                    id: father.id,
                                    name: father.name,
                                    relationshipToPrevious: 'Ayah'
                                }]
                            });
                        }
                    }
                    if (parentFamily.spouse2_id && !visited.has(parentFamily.spouse2_id)) {
                        const mother = familyData.individuals.get(parentFamily.spouse2_id);
                        if (mother) {
                            visited.add(mother.id);
                            queue.push({
                                id: mother.id,
                                path: [...currentPath, {
                                    id: mother.id,
                                    name: mother.name,
                                    relationshipToPrevious: 'Ibu'
                                }]
                            });
                        }
                    }
                }
            }

            // 3. Ke Pasangan (samping)
            const familiesWhereCurrentIsSpouse = Array.from(familyData.families.values()).filter(
                f => (f.spouse1_id === currentId || f.spouse2_id === currentId)
            );
            for (const family of familiesWhereCurrentIsSpouse) {
                const spouseId = family.spouse1_id === currentId ? family.spouse2_id : family.spouse1_id;
                if (spouseId && !visited.has(spouseId)) {
                    const spouse = familyData.individuals.get(spouseId);
                    if (spouse) {
                        visited.add(spouseId);
                        queue.push({
                            id: spouseId,
                            path: [...currentPath, {
                                id: spouseId,
                                name: spouse.name,
                                relationshipToPrevious: 'Pasangan'
                            }]
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
        setSelectedPersonForOtherRelations(null); // Reset other relations when new path is searched
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
                <div className="bg-base-100 p-6 rounded-lg min-h-[150px] flex flex-col items-center justify-center mb-6">
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
                                            <span className="text-sm text-gray-400">({node.javaneseRelationship || node.relationshipToPrevious})</span>
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

            <div className="bg-base-100 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Lihat Hubungan Lain dari Individu</h2>
                <div className="mb-4">
                    <select
                        value={selectedPersonForOtherRelations || ''}
                        onChange={(e) => setSelectedPersonForOtherRelations(e.target.value)}
                        className="w-full bg-base-300 p-2 rounded-md"
                    >
                        <option value="">Pilih Individu untuk Hubungan Lain</option>
                        {individuals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {selectedPersonForOtherRelations && otherRelations.length > 0 && (
                    <div className="mt-4">
                        {otherRelations.map((relationType, index) => (
                            <div key={index} className="mb-4 border-b border-gray-700 pb-3 last:border-b-0">
                                <h3 className="text-lg font-medium text-white mb-2">{relationType.type}:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {relationType.individuals.map(person => (
                                        <Link
                                            key={person.id}
                                            to={`/individual/${person.id}`}
                                            className="bg-primary-focus text-white px-3 py-1 rounded-full text-sm hover:bg-primary transition-colors"
                                        >
                                            {person.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {selectedPersonForOtherRelations && otherRelations.length === 0 && (
                    <p className="text-gray-400">Tidak ditemukan hubungan langsung lainnya untuk individu ini.</p>
                )}
                {!selectedPersonForOtherRelations && (
                    <p className="text-gray-400">Pilih individu dari daftar di atas untuk melihat hubungan langsungnya (Anak, Pasangan, Orang Tua, Saudara Kandung).</p>
                )}
            </div>
        </div>
    );
};