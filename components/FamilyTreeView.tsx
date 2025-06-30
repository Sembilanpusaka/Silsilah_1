// components/FamilyTreeView.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../hooks/useFamilyData';
import { Individual, Family, Gender } from '../src/types'; // Path diperbaiki
import * as d3 from 'd3'; // Import D3.js

// Deklarasi global D3.js (jika Anda tidak menginstal @types/d3)
// Jika Anda sudah menginstal @types/d3, ini bisa dihapus.
// Saya menyarankan menginstal @types/d3 untuk typing yang lebih baik.
// npm install -D @types/d3
declare var d3: {
    hierarchy: <T>(data: T) => d3.HierarchyNode<T>;
    tree: () => any;
    linkVertical: () => any;
    zoom: () => any;
    select: (selector: SVGSVGElement | null) => any;
};

declare namespace d3 {
    interface HierarchyNode<Datum> {
        data: Datum;
        depth: number;
        height: number;
        parent: HierarchyNode<Datum> | null;
        children?: HierarchyNode<Datum>[];
        x?: number;
        y?: number;
        
        links(): { source: HierarchyNode<Datum>, target: HierarchyNode<Datum> }[];
        descendants(): HierarchyNode<Datum>[];
        each(callback: (node: HierarchyNode<Datum>) => void): void;
    }
}

// Tidak lagi perlu interface TreeNode karena HierarchyNode dari D3 cukup
// interface TreeNode extends d3.HierarchyNode<Individual> {
//   x: number;
//   y: number;
//   children?: TreeNode[];
//   parent: TreeNode | null;
// }

const buildHierarchy = (individualId: string, individuals: Map<string, Individual>, families: Map<string, Family>): Individual | null => {
    const rootInd = individuals.get(individualId);
    if (!rootInd) return null;

    // Pastikan properti objek sesuai dengan skema database Anda (snake_case)
    const hierarchyRoot: any = { 
        ...rootInd, 
        name: rootInd.name, // Pastikan nama ada
        id: rootInd.id,     // Pastikan ID ada
        children: [] 
    };
    const processedFamilies = new Set<string>();

    const findChildren = (personNode: any) => { // Menggunakan personNode untuk menghindari konflik nama
        const spouseFamilies = Array.from(families.values()).filter(f => f.spouse1_id === personNode.id || f.spouse2_id === personNode.id); // Perbaiki nama properti
        for (const family of spouseFamilies) {
            if (processedFamilies.has(family.id)) continue;
            processedFamilies.add(family.id);

            // Perbaiki properti children_ids
            if (family.children_ids && Array.isArray(family.children_ids)) {
                for (const childId of family.children_ids) {
                    const child = individuals.get(childId);
                    if (child) {
                        const childNode: any = { ...child, children: [] };
                        personNode.children.push(childNode);
                        findChildren(childNode);
                    }
                }
            }
        }
    };
    findChildren(hierarchyRoot);
    return hierarchyRoot;
};

export const FamilyTreeView: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    // Destructuring diperbaiki
    const { individuals, families, loading, error } = useFamily(); 
    const navigate = useNavigate();
    const [viewType, setViewType] = useState<'descendants' | 'ancestors'>('descendants');
    
    // Inisialisasi rootId secara hati-hati, hanya jika ada individu
    const [rootId, setRootId] = useState<string>('');

    // Update rootId ketika individuals dimuat atau berubah
    useEffect(() => {
        if (!loading && individuals.size > 0 && !rootId) {
            // Set rootId ke individu pertama atau individu default dari initialData
            // Pastikan 'i1' ada di data Anda atau pilih yang pertama
            const defaultRoot = individuals.has('i1') ? 'i1' : individuals.keys().next().value;
            if (defaultRoot) {
                setRootId(defaultRoot);
            }
        }
    }, [loading, individuals, rootId]); // Tambahkan rootId sebagai dependensi

    const individualList = Array.from(individuals.values()); // Menggunakan individuals langsung

    useEffect(() => {
        if (!svgRef.current || loading || individuals.size === 0 || !rootId) {
            // Tambahkan !rootId sebagai kondisi untuk mencegah render sebelum rootId ditetapkan
            console.log("FamilyTreeView: Skipping renderTree. Loading:", loading, "Individuals size:", individuals.size, "Root ID:", rootId);
            return;
        }

        let hierarchyData: Individual | null = null; // Tipe data hierarki

        // Pastikan rootId adalah string yang valid
        if (rootId) {
            if (viewType === 'descendants') {
                hierarchyData = buildHierarchy(rootId, individuals, families);
            } else {
                // Ancestor logic
                const buildAncestorTree = (personId: string): Individual | null => { // Tipe pengembalian disesuaikan
                    const person = individuals.get(personId); // Menggunakan individuals langsung
                    if (!person) return null;
                    // Pastikan properti objek sesuai dengan skema database Anda (snake_case)
                    const node: any = { ...person, name: person.name, id: person.id, children: [] }; 
                    const parentFamily = person.child_in_family_id ? families.get(person.child_in_family_id) : undefined; // Perbaiki nama properti
                    if (parentFamily) {
                        if (parentFamily.spouse1_id) { // Perbaiki nama properti
                            const father = buildAncestorTree(parentFamily.spouse1_id); // Perbaiki nama properti
                            if(father) node.children.push(father);
                        }
                        if (parentFamily.spouse2_id) { // Perbaiki nama properti
                            const mother = buildAncestorTree(parentFamily.spouse2_id); // Perbaiki nama properti
                            if(mother) node.children.push(mother);
                        }
                    }
                    return node;
                };
                hierarchyData = buildAncestorTree(rootId);
            }
        }

        if (!hierarchyData) {
            console.log("FamilyTreeView: Failed to build hierarchy data for root ID:", rootId);
            return;
        }

        const width = 1200;
        const nodeWidth = 220, nodeHeight = 100, nodeSeparation = 40;

        const root = d3.hierarchy(hierarchyData);
        const treeLayout = d3.tree().nodeSize([nodeWidth + nodeSeparation, nodeHeight * 2]);
        treeLayout(root);
        
        let minX = Infinity, maxX = -Infinity;
        root.each((d: d3.HierarchyNode<Individual>) => {
            if(d.x !== undefined && d.x < minX) minX = d.x;
            if(d.x !== undefined && d.x > maxX) maxX = d.x;
        });

        const height = maxX - minX + nodeHeight * 2;
        
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-width/2, minX - nodeHeight, width, height])
            .html(""); // Clear previous render

        const g = svg.append("g");

        // Links
        g.append("g")
            .attr("fill", "none")
            .attr("stroke", "#4b5563") // base-300
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkVertical()
                .x((d: any) => d.x)
                .y((d: any) => d.y)
            );

        // Nodes
        const node = g.append("g")
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
            .on("click", (event: any, d: any) => navigate(`/individual/${d.data.id}`))
            .style("cursor", "pointer");

        node.append("rect")
            .attr("width", nodeWidth)
            .attr("height", nodeHeight)
            .attr("x", -nodeWidth / 2)
            .attr("y", -nodeHeight / 2)
            .attr("rx", 8)
            .attr("fill", (d: d3.HierarchyNode<Individual>) => d.data.gender === Gender.Male ? "#1e3a8a" : (d.data.gender === Gender.Female ? "#9d174d" : "#4b5563")) // blue, pink, gray
            .attr("stroke", "#3b82f6") // accent
            .attr("stroke-width", 2);

        node.append("image")
            .attr("xlink:href", (d: d3.HierarchyNode<Individual>) => d.data.photo_url || 'https://picsum.photos/seed/person/50/50') // Perbaiki photoUrl ke photo_url
            .attr("x", -nodeWidth/2 + 10)
            .attr("y", -nodeHeight/2 + 15)
            .attr("width", 50)
            .attr("height", 50)
            .attr("clip-path", "circle(25px at center)");
        
        node.append("text")
            .attr("x", 0)
            .attr("y", -nodeHeight/2 + 30)
            .attr("dy", "0.31em")
            .attr("fill", "white")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text((d: d3.HierarchyNode<Individual>) => d.data.name || ''); // Tambahkan || ''

        node.append("text")
            .attr("x", 0)
            .attr("y", -nodeHeight/2 + 50)
            .attr("dy", "0.31em")
            .attr("fill", "lightgray")
            .style("font-size", "12px")
            .text((d: d3.HierarchyNode<Individual>) => `${d.data.birth_date || ''} - ${d.data.death_date || ''}`); // Perbaiki birth?.date ke birth_date

        // Zoom/Pan
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on("zoom", (event: any) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom as any); // Type assertion for d3.zoom

    }, [individuals, families, rootId, viewType, navigate]); // Dependensi diperbaiki

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-base-100 flex flex-col">
            <div className="p-4 bg-base-200 shadow-md z-10 flex items-center space-x-4">
                 <select value={rootId} onChange={e => setRootId(e.target.value)} className="bg-base-300 border border-gray-600 rounded-md p-2 text-white">
                    {individualList.length > 0 ? (
                        individualList.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)
                    ) : (
                        <option value="">No individuals available</option>
                    )}
                 </select>
                 <select value={viewType} onChange={e => setViewType(e.target.value as 'descendants' | 'ancestors')} className="bg-base-300 border border-gray-600 rounded-md p-2 text-white">
                    <option value="descendants">Keturunan</option>
                    <option value="ancestors">Leluhur</option>
                </select>
                <span className="text-gray-400 text-sm hidden md:block">Gunakan mouse untuk zoom dan geser.</span>
            </div>
            <div className="flex-grow w-full h-full overflow-hidden">
                <svg ref={svgRef}></svg>
            </div>
        </div>
    );
};