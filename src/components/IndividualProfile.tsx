// src/components/IndividualProfile.tsx
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFamily } from '../hooks/useFamilyData';
import { FamilyFlowVisualization } from './FamilyFlowVisualization';
import { Tables } from '../types/supabase';
import { MaleIcon, FemaleIcon } from './Icons';

// Perbarui Tipe Individual untuk mencakup semua kolom, termasuk validasi
type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type DetailEntry = { id: string; title: string; description: string; period: string; };
type LifeFactEntry = { id: string; type: string; date: string | null; place: string | null; description: string | null; source_link?: string | null; source_text?: string | null; };

// --- Komponen-komponen Helper untuk tampilan ---
const EventCard: React.FC<{ title: string; date?: string | null; place?: string | null; detail?: string; type: 'birth' | 'death' | 'marriage' | 'education' | 'work' | 'lifeFact' }> = ({ title, date, place, detail, type }) => {
    if (!date && !place && !detail && type !== 'birth' && type !== 'death') return null;

    let iconColor = 'bg-accent';
    if (type === 'birth') iconColor = 'bg-blue-500';
    else if (type === 'death') iconColor = 'bg-red-500';
    else if (type === 'marriage') iconColor = 'bg-green-500';
    else if (type === 'education') iconColor = 'bg-purple-500';
    else if (type === 'work') iconColor = 'bg-orange-500';
    else if (type === 'lifeFact') iconColor = 'bg-yellow-500';

    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-24 text-right">
                <p className="text-sm font-semibold text-gray-400">{title}</p>
                <p className="text-sm text-gray-500">{date || (type === 'birth' || type === 'death' ? 'Tidak diketahui' : '')}</p>
            </div>
            <div className="relative flex-shrink-0">
                <div className="h-full w-0.5 bg-base-300"></div>
                <div className={`absolute top-1/2 left-1/2 w-3 h-3 ${iconColor} rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-base-100`}></div>
            </div>
            <div className="flex-grow pb-8">
                <p className="font-medium text-gray-300">{detail || place || ''}</p>
            </div>
        </div>
    );
};

const FamilyMemberLink: React.FC<{ individual?: Individual | null, relationship?: string }> = ({ individual, relationship }) => {
    if (!individual) return <div className="p-2 text-gray-500">{relationship || 'Anggota keluarga'} tidak ditemukan.</div>;
    return (
        <Link to={`/individual/${individual.id}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-base-300 transition-colors">
            <img src={individual.photo_url || 'https://i.pravatar.cc/50'} alt={individual.name || 'Unknown'} className="w-10 h-10 rounded-full object-cover" />
            <div>
                <p className="font-semibold text-white">{individual.name}</p>
                {relationship && <p className="text-sm text-gray-400">{relationship}</p>}
            </div>
        </Link>
    );
};

const DetailSection: React.FC<{title: string, items?: any[] | null}> = ({ title, items}) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-base-300 pb-2">{title}</h3>
            <ul className="space-y-4">
                {items.map((item, index) => (
                    <li key={item.id || `item-${index}`} className="bg-base-100/50 p-4 rounded-lg">
                        <p className="font-semibold text-accent">{item.title} {item.period && <span className="text-gray-400 font-normal text-sm">({item.period})</span>}</p>
                        <p className="text-gray-300 whitespace-pre-wrap">{item.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// --- Komponen Utama ---
export const IndividualProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data, loading, error } = useFamily();
    const [activeTab, setActiveTab] = useState('overview');

    const memoizedData = useMemo(() => {
        if (!id || !data.individuals.has(id)) return null;

        const individual = data.individuals.get(id)!;
        const parentFamily = individual.child_in_family_id ? data.families.get(individual.child_in_family_id) : undefined;
        const father = parentFamily?.spouse1_id ? data.individuals.get(parentFamily.spouse1_id) : undefined;
        const mother = parentFamily?.spouse2_id ? data.individuals.get(parentFamily.spouse2_id) : undefined;

        const spouseFamilies = Array.from(data.families.values())
            .filter(f => f.spouse1_id === id || f.spouse2_id === id)
            .map(family => ({
                ...family,
                spouse: data.individuals.get(family.spouse1_id === id ? family.spouse2_id! : family.spouse1_id!),
                children: (family.children_ids || []).map(cid => data.individuals.get(cid)).filter((c): c is Individual => !!c)
            }));

        return { individual, parents: { father, mother }, spouseFamilies };
    }, [id, data]);

    const dAbovilleProgenitorId = "bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b"; // Ganti dengan ID Progenitor Anda

    if (loading) return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="text-center p-8 text-xl text-error">Error: {error}</div>;
    if (!memoizedData) return <div className="text-center p-8 text-xl text-error">Individu dengan ID '{id}' tidak ditemukan.</div>;

    const { individual, parents, spouseFamilies } = memoizedData;

    const timelineEvents = useMemo(() => {
        const events: any[] = [];
        if (individual.birth_date || individual.birth_place) events.push({ title: 'Lahir', date: individual.birth_date, place: individual.birth_place, type: 'birth' });
        spouseFamilies.forEach(family => events.push({ title: 'Menikah', date: family.marriage_date, place: family.marriage_place, detail: `dengan ${family.spouse?.name || 'Tidak Dikenal'}`, type: 'marriage' }));
        (individual.education as DetailEntry[] | null)?.forEach(edu => events.push({ title: edu.title || 'Pendidikan', date: edu.period, detail: edu.description, type: 'education' }));
        (individual.works as DetailEntry[] | null)?.forEach(work => events.push({ title: work.title || 'Karya', date: work.period, detail: work.description, type: 'work' }));
        (individual.life_events_facts as LifeFactEntry[] | null)?.forEach(fact => events.push({ title: fact.type || 'Peristiwa Penting', date: fact.date, place: fact.place, detail: fact.description, type: 'lifeFact' }));
        if (individual.death_date || individual.death_place) events.push({ title: 'Meninggal', date: individual.death_date, place: individual.death_place, type: 'death' });
        
        return events.filter(e => e.date || e.place || e.detail).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }, [individual, spouseFamilies]);

    const TabButton: React.FC<{tabName: string; label: string}> = ({tabName, label}) => (
        <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tabName ? 'text-accent border-accent' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}>{label}</button>
    );

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-base-200 shadow-xl rounded-lg overflow-hidden">
                <div className="md:flex bg-base-300/30 p-8">
                    <div className="md:flex-shrink-0 text-center">
                        <img className="h-48 w-48 rounded-full object-cover mx-auto ring-4 ring-primary" src={individual.photo_url || `https://i.pravatar.cc/200?u=${individual.id}`} alt={individual.name || ''} />
                        <div className="flex items-center justify-center mt-4 space-x-2 text-gray-400">
                             {individual.gender === 'male' ? <MaleIcon className="w-6 h-6 text-blue-400" /> : <FemaleIcon className="w-6 h-6 text-pink-400" />}
                            <span>{individual.gender}</span>
                        </div>
                    </div>
                    <div className="p-8 w-full">
                        <div className="uppercase tracking-wide text-sm text-accent font-semibold">{individual.profession || 'Informasi Pribadi'}</div>
                        <h1 className="block mt-1 text-4xl leading-tight font-bold text-white">{individual.name}</h1>
                        <p className="text-sm text-gray-400 mt-1">Kode Individu: {individual.id.substring(0, 8).toUpperCase()}</p>
                        <p className="mt-4 text-gray-300">{individual.description || 'Tidak ada deskripsi yang tersedia.'}</p>

                        <div className="mt-4 text-sm text-gray-400">
                            {individual.validated_by_admin || individual.validated_by_validator ? (
                                <>
                                    <p className="font-semibold text-success">✓ Data Tervalidasi</p>
                                    {individual.admin_name && <p>Oleh Admin: <span className="text-white">{individual.admin_name}</span></p>}
                                    {individual.validator_name && <p>Oleh Validator: <span className="text-white">{individual.validator_name}</span></p>}
                                    {individual.validation_date && <p>Tanggal Validasi: <span className="text-white">{individual.validation_date}</span></p>}
                                </>
                            ) : (
                                <p className="text-warning">Data ini belum divalidasi.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="border-b border-base-300 px-8"><nav className="-mb-px flex space-x-6"><TabButton tabName="overview" label="Gambaran" /><TabButton tabName="family" label="Keluarga" /><TabButton tabName="descendants" label="Keturunan" /><TabButton tabName="details" label="Detail" /></nav></div>
                <div className="p-8">
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Linimasa</h2>
                            <div className="relative border-l-2 border-base-300 ml-12">
                                {timelineEvents.length > 0 ? (
                                    timelineEvents.map((event, index) => <EventCard key={index} {...event} />)
                                ) : (
                                    <p className="text-gray-400 ml-8">Tidak ada peristiwa penting dalam linimasa.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'family' && (
                         <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Hubungan Keluarga</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-gray-400 mb-2 border-b border-base-300 pb-2">Orang Tua</h3>
                                    <div className="space-y-2 mt-4"><FamilyMemberLink individual={parents.father} relationship="Ayah" /><FamilyMemberLink individual={parents.mother} relationship="Ibu" /></div>
                                </div>
                                <div>
                                    {spouseFamilies.map((family, index) => (
                                        <div key={family.id} className="mb-6">
                                            <h3 className="font-semibold text-gray-400 mb-2 border-b border-base-300 pb-2">Pasangan {spouseFamilies.length > 1 ? index + 1 : ''}</h3>
                                            <div className="space-y-2 mt-4"><FamilyMemberLink individual={family.spouse} relationship="Pasangan" /></div>
                                            {family.children.length > 0 && (<>
                                                <h4 className="font-semibold text-gray-500 mt-4 mb-2">Anak-anak</h4>
                                                <div className="space-y-2 pl-4">{family.children.map(child => (<FamilyMemberLink key={child.id} individual={child} />))}</div>
                                            </>)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'descendants' && (
                        <div>
                             <h2 className="text-2xl font-bold text-white mb-6">Pohon Keturunan</h2>
                             {dAbovilleProgenitorId ? (<div className="w-full h-[600px] bg-base-100 rounded-lg overflow-hidden"><FamilyFlowVisualization rootIndividualId={individual.id} individuals={data.individuals} families={data.families} viewType="descendants" dAbovilleProgenitorId={dAbovilleProgenitorId} /></div>) : (<p className="text-gray-400">Progenitor utama tidak ditemukan.</p>)}
                        </div>
                    )}
                    {activeTab === 'details' && (
                        <div>
                            <DetailSection title="Pendidikan" items={individual.education as any[] | null} />
                            <DetailSection title="Karya" items={individual.works as any[] | null} />
                            <DetailSection title="Sumber Data" items={individual.sources as any[] | null} />
                            <DetailSection title="Referensi" items={individual.related_references as any[] | null} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};