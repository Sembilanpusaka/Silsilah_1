// Silsilah_1/src/components/FamilyTreeView.tsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; // <--- PASTIKAN 'Link' ADA DI SINI
import { useFamily } from '../hooks/useFamilyData';
import { Tables } from '../types/supabase';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

interface TreeNode {
    id: string;
    name: string;
    children?: TreeNode[];
}

interface AncestorNode {
    id: string;
    name: string;
    parents?: {
        father?: AncestorNode;
        mother?: AncestorNode;
    };
}

const FamilyMemberLink: React.FC<{ individual?: Individual | null, relationship?: string }> = ({ individual, relationship }) => {
    if (!individual) return null;
    return (
        <Link to={`/individual/${individual.id}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-base-300 transition-colors">
            <img src={individual.photo_url || 'https://picsum.photos/seed/person/50/50'} alt={individual.name || 'Unknown'} className="w-10 h-10 rounded-full object-cover" />
            <div>
                <p className="font-semibold text-white">{individual.name}</p>
                {relationship && <p className="text-sm text-gray-400">{relationship}</p>}
            </div>
        </Link>
    );
};

const DescendantTreeDisplay: React.FC<{ node: TreeNode }> = ({ node }) => (
    <ul className="pl-6 border-l border-base-300 space-y-2">
        <li>
            <FamilyMemberLink individual={useMemo(() => ({
                id: node.id, name: node.name, photo_url: '', gender: 'unknown', birth_date: null, birth_place: null, death_date: null, death_place: null, description: null, profession: null, notes: null, child_in_family_id: null, education: null, works: null, sources: null, related_references: null, life_events_facts: null
            }), [node.id, node.name])} />
            {node.children && node.children.length > 0 && (
                <div className="mt-2">
                    {node.children.map(child => (
                        <DescendantTreeDisplay key={child.id} node={child} />
                    ))}
                </div>
            )}
        </li>
    </ul>
);

const AncestorTreeDisplay: React.FC<{ node: AncestorNode }> = ({ node }) => (
    <div className="flex items-center space-x-4">
        <FamilyMemberLink individual={useMemo(() => ({
            id: node.id, name: node.name, photo_url: '', gender: 'unknown', birth_date: null, birth_place: null, death_date: null, death_place: null, description: null, profession: null, notes: null, child_in_family_id: null, education: null, works: null, sources: null, related_references: null, life_events_facts: null
        }), [node.id, node.name])} />
        {node.parents && (node.parents.father || node.parents.mother) && (
            <div className="flex flex-col space-y-2 ml-8 border-l border-base-300 pl-4">
                {node.parents.father && (
                    <div className="flex items-center">
                        <span className="text-gray-400 text-sm mr-2">Ayah:</span>
                        <AncestorTreeDisplay node={node.parents.father} />
                    </div>
                )}
                {node.parents.mother && (
                    <div className="flex items-center">
                        <span className="text-gray-400 text-sm mr-2">Ibu:</span>
                        <AncestorTreeDisplay node={node.parents.mother} />
                    </div>
                )}
            </div>
        )}
    </div>
);


export const FamilyTreeView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: familyData, loading, error } = useFamily();
    const navigate = useNavigate();
    const [viewType, setViewType] = useState<'descendants' | 'ancestors'>('descendants');
    const [rootId, setRootId] = useState<string | null>(id || (familyData.individuals.size > 0 ? Array.from(familyData.individuals.keys())[0] : null));

    const individualList = useMemo(() => Array.from(familyData.individuals.values()), [familyData.individuals]);

    useEffect(() => {
        if (id && familyData.individuals.has(id)) {
            if (rootId !== id) setRootId(id);
        } else if (familyData.individuals.size > 0 && !rootId) {
            setRootId(Array.from(familyData.individuals.keys())[0]);
        } else if (!id && familyData.individuals.size === 0 && rootId) {
            setRootId(null);
        }
    }, [id, familyData.individuals, rootId]);


    const individual = useMemo(() => rootId ? familyData.individuals.get(rootId) : undefined, [rootId, familyData.individuals]);

    const buildDescendantTree = useCallback((personId: string, visited = new Set<string>()): TreeNode | null => {
        console.log(`[DEBUG: DescendantTree] Membangun dari: ${personId}`);
        if (visited.has(personId)) {
            console.log(`[DEBUG: DescendantTree] Sudah dikunjungi: ${personId}`);
            return null;
        }
        visited.add(personId);

        const person = familyData.individuals.get(personId);
        if (!person) {
            console.log(`[DEBUG: DescendantTree] Individu tidak ditemukan: ${personId}`);
            return null;
        }

        const node: TreeNode = {
            id: person.id,
            name: person.name,
            children: []
        };

        const familiesAsSpouse = Array.from(familyData.families.values()).filter(
            f => f.spouse1_id === personId || f.spouse2_id === personId
        );
        console.log(`[DEBUG: DescendantTree] Keluarga sebagai pasangan untuk ${person.name}:`, familiesAsSpouse.length);

        for (const family of familiesAsSpouse) {
            console.log(`[DEBUG: DescendantTree] Memeriksa anak-anak keluarga: ${family.id}, children_ids:`, family.children_ids, `(typeof: ${typeof family.children_ids})`);
            if (Array.isArray(family.children_ids)) {
                for (const childId of family.children_ids) {
                    console.log(`[DEBUG: DescendantTree] Mencoba membangun anak: ${childId}`);
                    const childNode = buildDescendantTree(childId, new Set(visited));
                    if (childNode) {
                        node.children!.push(childNode);
                    }
                }
            } else if (family.children_ids) {
                 console.warn(`[WARN: DescendantTree] children_ids bukan array untuk family ${family.id}:`, family.children_ids);
            }
        }
        return node;
    }, [familyData.individuals, familyData.families]);

    const buildAncestorTree = useCallback((personId: string, visited = new Set<string>()): AncestorNode | null => {
        console.log(`[DEBUG: AncestorTree] Membangun dari: ${personId}`);
        if (visited.has(personId)) {
            console.log(`[DEBUG: AncestorTree] Sudah dikunjungi: ${personId}`);
            return null;
        }
        visited.add(personId);

        const person = familyData.individuals.get(personId);
        if (!person) {
            console.log(`[DEBUG: AncestorTree] Individu tidak ditemukan: ${personId}`);
            return null;
        }

        const node: AncestorNode = {
            id: person.id,
            name: person.name,
        };

        console.log(`[DEBUG: AncestorTree] Memeriksa child_in_family_id untuk ${person.name}:`, person.child_in_family_id);
        if (person.child_in_family_id) {
            const parentFamily = familyData.families.get(person.child_in_family_id);
            if (parentFamily) {
                console.log(`[DEBUG: AncestorTree] Keluarga orang tua ditemukan: ${parentFamily.id}`);
                if (parentFamily.spouse1_id && !visited.has(parentFamily.spouse1_id)) {
                    console.log(`[DEBUG: AncestorTree] Mencoba membangun Ayah: ${parentFamily.spouse1_id}`);
                    const father = buildAncestorTree(parentFamily.spouse1_id, new Set(visited));
                    if (father) node.parents = { ...node.parents, father };
                }
                if (parentFamily.spouse2_id && !visited.has(parentFamily.spouse2_id)) {
                    console.log(`[DEBUG: AncestorTree] Mencoba membangun Ibu: ${parentFamily.spouse2_id}`);
                    const mother = buildAncestorTree(parentFamily.spouse2_id, new Set(visited));
                    if (mother) node.parents = { ...node.parents, mother };
                }
            } else {
                 console.log(`[DEBUG: AncestorTree] Keluarga orang tua ${person.child_in_family_id} tidak ditemukan.`);
            }
        } else {
             console.log(`[DEBUG: AncestorTree] ${person.name} tidak punya child_in_family_id.`);
        }
        return node;
    }, [familyData.individuals, familyData.families]);


    const descendantTree = useMemo(() => {
        if (individual && viewType === 'descendants') {
            return buildDescendantTree(individual.id);
        }
        return null;
    }, [individual, viewType, buildDescendantTree]);

    const ancestorTree = useMemo(() => {
        if (individual && viewType === 'ancestors') {
            return buildAncestorTree(individual.id);
        }
        return null;
    }, [individual, viewType, buildAncestorTree]);


    if (loading) return <div className="text-center p-8 text-white">Memuat data silsilah...</div>;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;
    if (!individual && individualList.length === 0) return <div className="text-center p-8 text-xl text-gray-400">Tidak ada individu yang tercatat.</div>;
    if (!individual && individualList.length > 0) return <div className="text-center p-8 text-xl text-gray-400">Pilih individu dari daftar di atas.</div>;


    return (
        <div className="container mx-auto p-4 md:p-8 bg-base-200 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold text-white mb-6">Pohon Keluarga: {individual?.name}</h1>

            <div className="mb-6 flex justify-center space-x-4">
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
            </div>

            <div className="bg-base-100 p-6 rounded-lg min-h-[300px] flex flex-col items-center justify-center">
                {viewType === 'descendants' && (
                    descendantTree && descendantTree.children && descendantTree.children.length > 0 ? (
                        <div className="w-full">
                            <h2 className="text-xl font-semibold text-white mb-4">Pohon Keturunan</h2>
                            <DescendantTreeDisplay node={descendantTree} />
                        </div>
                    ) : (
                        <p className="text-gray-400">Tidak ada keturunan yang tercatat untuk {individual?.name}.</p>
                    )
                )}

                {viewType === 'ancestors' && (
                    ancestorTree && (ancestorTree.parents?.father || ancestorTree.parents?.mother) ? (
                        <div className="w-full">
                            <h2 className="text-xl font-semibold text-white mb-4">Pohon Leluhur</h2>
                            <AncestorTreeDisplay node={ancestorTree} />
                        </div>
                    ) : (
                        <p className="text-gray-400">Tidak ada leluhur yang tercatat untuk {individual?.name}.</p>
                    )
                )}
            </div>
        </div>
    );
};