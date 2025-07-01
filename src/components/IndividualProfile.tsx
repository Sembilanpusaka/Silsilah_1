// Silsilah_1/src/components/IndividualProfile.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFamily } from '../hooks/useFamilyData';
// Pastikan tipe yang diimpor dari supabase.ts
import { Tables } from '../types/supabase';
// Anda mungkin masih perlu tipe DetailEntry jika didefinisikan di '../types'
interface DetailEntry {
    id: string; // ID lokal untuk React key
    title: string;
    description: string;
    period: string;
}
type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type Gender = Tables<'public'>['Enums']['gender_enum']; // Menggunakan enum dari supabase.ts

import { MaleIcon, FemaleIcon } from './Icons';

// --- Helper Functions and Components ---

const EventCard: React.FC<{ title: string; date?: string | null; place?: string | null; detail?: string }> = ({ title, date, place, detail }) => {
    if (!date && !place && !detail) return null;
    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-24 text-right">
                <p className="text-sm font-semibold text-gray-400">{title}</p>
                <p className="text-sm text-gray-500">{date || 'Unknown date'}</p>
            </div>
            <div className="relative flex-shrink-0">
                <div className="h-full w-0.5 bg-base-300"></div>
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-100"></div>
            </div>
            <div className="flex-grow pb-8">
                <p className="font-medium text-gray-300">{detail || place || 'Unknown location'}</p>
            </div>
        </div>
    );
};

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

// Pastikan tipe descendants sesuai dengan Individual atau struktur yang Anda inginkan
const DescendantTree: React.FC<{ descendants: (Individual & { children?: any[] })[] }> = ({ descendants }) => {
    if (descendants.length === 0) return null;
    return (
        <ul className="pl-6 border-l border-base-300 space-y-2">
            {descendants.map(desc => (
                <li key={desc.id}>
                    <FamilyMemberLink individual={desc} relationship="Keturunan" />
                    {desc.children && <DescendantTree descendants={desc.children} />}
                </li>
            ))}
        </ul>
    );
};

const DetailSection: React.FC<{title: string, items?: DetailEntry[] | null}> = ({ title, items}) => {
    if (!items || items.length === 0) return null; // Pastikan items adalah array dan tidak kosong

    // Karena items dari DB adalah Json, perlu di-parse jika belum
    const parsedItems = items as DetailEntry[]; // Asumsi sudah diconvert di useFamilyData atau di tempat lain

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-base-300 pb-2">{title}</h3>
            <ul className="space-y-4">
                {parsedItems.map((item, index) => ( // Tambahkan index sebagai key cadangan jika id tidak selalu unik
                    <li key={item.id || `item-${index}`} className="bg-base-100/50 p-4 rounded-lg">
                        <p className="font-semibold text-accent">{item.title} {item.period && <span className="text-gray-400 font-normal text-sm">({item.period})</span>}</p>
                        <p className="text-gray-300 whitespace-pre-wrap">{item.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// --- Komponen Utama IndividualProfile ---

export const IndividualProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data } = useFamily();
    const [activeTab, setActiveTab] = useState('overview');

    if (!id || !data.individuals.has(id)) {
        return <div className="text-center p-8 text-xl text-error">Individu tidak ditemukan.</div>;
    }

    const individual = data.individuals.get(id)!;

    // Perbaikan: Gunakan properti snake_case dari Supabase
    const parentFamily = individual.child_in_family_id ? data.families.get(individual.child_in_family_id) : undefined;
    const parents = {
        father: parentFamily?.spouse1_id ? data.individuals.get(parentFamily.spouse1_id) : undefined,
        mother: parentFamily?.spouse2_id ? data.individuals.get(parentFamily.spouse2_id) : undefined,
    };

    const spouseFamilies = Array.from(data.families.values()).filter(f => f.spouse1_id === id || f.spouse2_id === id);

    const getDescendants = (personId: string): (Individual & { children?: any[] })[] => {
        const descendantsList: (Individual & { children?: any[] })[] = [];
        const familiesAsSpouse = Array.from(data.families.values()).filter(f => f.spouse1_id === personId || f.spouse2_id === personId);

        for (const family of familiesAsSpouse) {
            // Perbaikan: Gunakan family.children_ids dan tambahkan null check
            for (const childId of family.children_ids || []) {
                const child = data.individuals.get(childId);
                if (child) {
                    descendantsList.push({
                        ...child,
                        children: getDescendants(child.id)
                    });
                }
            }
        }
        return descendantsList;
    };

    const descendants = getDescendants(individual.id);

    const TabButton: React.FC<{tabName: string; label: string}> = ({tabName, label}) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tabName ? 'text-accent border-accent' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
        >
            {label}
        </button>
    )

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-base-200 shadow-xl rounded-lg overflow-hidden">
                <div className="md:flex bg-base-300/30 p-8">
                    <div className="md:flex-shrink-0">
                        {/* Perbaikan: Gunakan photo_url */}
                        <img className="h-48 w-48 rounded-full object-cover mx-auto ring-4 ring-primary" src={individual.photo_url || 'https://picsum.photos/seed/person/200/200'} alt={individual.name || 'Unknown'} />
                        <div className="flex items-center justify-center mt-4 space-x-2 text-gray-400">
                             {/* Perbaikan: Gender sudah string, langsung pakai */}
                             {individual.gender === 'male' ? <MaleIcon className="w-6 h-6 text-blue-400" /> : <FemaleIcon className="w-6 h-6 text-pink-400" />}
                            <span>{individual.gender}</span>
                        </div>
                    </div>
                    <div className="p-8 w-full">
                        {/* Perbaikan: profession adalah field datar */}
                        <div className="uppercase tracking-wide text-sm text-accent font-semibold">{individual.profession || 'Informasi Pribadi'}</div>
                        <h1 className="block mt-1 text-4xl leading-tight font-bold text-white">{individual.name}</h1>
                        <p className="mt-4 text-gray-300">{individual.description || 'Tidak ada deskripsi yang tersedia.'}</p>
                    </div>
                </div>

                <div className="border-b border-base-300 px-8">
                    <nav className="-mb-px flex space-x-6">
                        <TabButton tabName="overview" label="Gambaran" />
                        <TabButton tabName="family" label="Keluarga" />
                        <TabButton tabName="descendants" label="Keturunan" />
                        <TabButton tabName="details" label="Detail & Sumber" />
                    </nav>
                </div>

                <div className="p-8">
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Fakta dan Peristiwa</h2>
                            <div className="relative">
                                {/* Perbaikan: Gunakan birth_date dan birth_place */}
                                <EventCard title="Lahir" date={individual.birth_date} place={individual.birth_place} />
                                {spouseFamilies.map(family => {
                                    // Perbaikan: Gunakan spouse1_id dan spouse2_id
                                    const spouse = data.individuals.get(family.spouse1_id === id ? family.spouse2_id! : family.spouse1_id!);
                                    // Perbaikan: Gunakan marriage_date dan marriage_place
                                    return family.marriage_date && <EventCard key={`m-${family.id}`} title="Menikah" date={family.marriage_date} place={family.marriage_place} detail={`dengan ${spouse?.name || 'Tidak Dikenal'}`} />
                                })}
                                {/* Perbaikan: Gunakan death_date dan death_place */}
                                <EventCard title="Meninggal" date={individual.death_date} place={individual.death_place} />
                            </div>
                             {individual.notes && (
                                <div className="mt-8">
                                    <h2 className="text-2xl font-bold text-white mb-4">Catatan Pribadi</h2>
                                    <p className="text-gray-300 whitespace-pre-wrap bg-base-100/50 p-4 rounded-lg">{individual.notes}</p>
                                </div>
                             )}
                        </div>
                    )}
                    {activeTab === 'family' && (
                         <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Keluarga</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-gray-400 mb-2 border-b border-base-300 pb-2">Orang Tua</h3>
                                    <div className="space-y-2 mt-4">
                                        <FamilyMemberLink individual={parents.father} relationship="Ayah" />
                                        <FamilyMemberLink individual={parents.mother} relationship="Ibu" />
                                    </div>
                                </div>
                                <div>
                                    {spouseFamilies.map((family, index) => {
                                        // Perbaikan: Gunakan spouse1_id dan spouse2_id
                                        const spouse = data.individuals.get(family.spouse1_id === id ? family.spouse2_id! : family.spouse1_id!)
                                        // Perbaikan: Gunakan family.children_ids dan pastikan tidak null sebelum map
                                        const children = (family.children_ids || []).map(cid => data.individuals.get(cid));
                                        return (
                                            <div key={family.id} className="mb-6">
                                                <h3 className="font-semibold text-gray-400 mb-2 border-b border-base-300 pb-2">
                                                    Pasangan {spouseFamilies.length > 1 ? index + 1 : ''}
                                                </h3>
                                                <div className="space-y-2 mt-4">
                                                   <FamilyMemberLink individual={spouse} relationship="Pasangan" />
                                                </div>

                                                {children.length > 0 && (
                                                    <>
                                                        <h4 className="font-semibold text-gray-500 mt-4 mb-2">Anak-anak</h4>
                                                        <div className="space-y-2 pl-4">
                                                            {/* Filter out undefined children if any mapping failed */}
                                                            {children.filter(Boolean).map(child => (
                                                                <FamilyMemberLink key={child!.id} individual={child} />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'descendants' && (
                        <div>
                             <h2 className="text-2xl font-bold text-white mb-6">Pohon Keturunan</h2>
                             {descendants.length > 0 ? (
                                <DescendantTree descendants={descendants}/>
                             ) : (
                                <p className="text-gray-400">Tidak ada keturunan yang tercatat.</p>
                             )}
                        </div>
                    )}
                     {activeTab === 'details' && (
                        <div>
                            {/* Perbaikan: Gunakan nama kolom Supabase untuk JSONB columns */}
                            <DetailSection title="Pendidikan" items={individual.education as DetailEntry[] | null} />
                            <DetailSection title="Karya" items={individual.works as DetailEntry[] | null} />
                            <DetailSection title="Sumber Data" items={individual.sources as DetailEntry[] | null} />
                            <DetailSection title="Referensi" items={individual.related_references as DetailEntry[] | null} /> {/* Perhatikan 'related_references' */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};