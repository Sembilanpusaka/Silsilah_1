// Silsilah_1/src/components/D3FamilyTreeVisualization.tsx
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tables } from '../types/supabase'; // Pastikan path ini benar
import * as d3 from 'd3'; // Import d3 secara keseluruhan

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type Gender = Tables<'public'>['Enums']['gender_enum'];

interface D3FamilyTreeVisualizationProps {
    rootIndividualId: string | null;
    individuals: Map<string, Individual>;
    families: Map<string, Family>;
    viewType: 'descendants' | 'ancestors';
    width?: number; // Lebar SVG, default 1200
    height?: number; // Tinggi SVG, akan dihitung dinamis jika tidak diberikan
}

export const D3FamilyTreeVisualization: React.FC<D3FamilyTreeVisualizationProps> = ({
    rootIndividualId,
    individuals,
    families,
    viewType,
    width = 1200,
    height // Jika tidak diberikan, akan dihitung
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const navigate = useNavigate();

    // Fungsi untuk membangun pohon keturunan
    const buildDescendantTree = useCallback((personId: string, visited = new Set<string>()): d3.HierarchyNode<Individual> | null => {
        if (visited.has(personId)) return null;
        visited.add(personId);

        const person = individuals.get(personId);
        if (!person) return null;

        const nodeData = { ...person, children: [] };

        const familiesAsSpouse = Array.from(families.values()).filter(
            f => f.spouse1_id === personId || f.spouse2_id === personId
        );

        for (const family of familiesAsSpouse) {
            if (Array.isArray(family.children_ids)) {
                for (const childId of family.children_ids) {
                    const childNode = buildDescendantTree(childId, new Set(visited));
                    if (childNode) {
                        nodeData.children.push(childNode.data); // Ambil data asli dari node D3
                    }
                }
            }
        }
        return d3.hierarchy(nodeData); // Bungkus data node dengan d3.hierarchy
    }, [individuals, families]);

    // Fungsi untuk membangun pohon leluhur
    const buildAncestorTree = useCallback((personId: string, visited = new Set<string>()): d3.HierarchyNode<Individual> | null => {
        if (visited.has(personId)) return null;
        visited.add(personId);

        const person = individuals.get(personId);
        if (!person) return null;

        const nodeData: any = { ...person, children: [] }; // Children akan berisi orang tua

        if (person.child_in_family_id) {
            const parentFamily = families.get(person.child_in_family_id);
            if (parentFamily) {
                if (parentFamily.spouse1_id && !visited.has(parentFamily.spouse1_id)) {
                    const fatherNode = buildAncestorTree(parentFamily.spouse1_id, new Set(visited));
                    if (fatherNode) nodeData.children.push(fatherNode.data);
                }
                if (parentFamily.spouse2_id && !visited.has(parentFamily.spouse2_id)) {
                    const motherNode = buildAncestorTree(parentFamily.spouse2_id, new Set(visited));
                    if (motherNode) nodeData.children.push(motherNode.data);
                }
            }
        }
        return d3.hierarchy(nodeData);
    }, [individuals, families]);

    useEffect(() => {
        if (!rootIndividualId || !individuals.size || !svgRef.current) return;

        const rootIndividual = individuals.get(rootIndividualId);
        if (!rootIndividual) return;

        let hierarchyRoot: d3.HierarchyNode<Individual> | null = null;

        if (viewType === 'descendants') {
            hierarchyRoot = buildDescendantTree(rootIndividual.id);
        } else { // ancestors
            hierarchyRoot = buildAncestorTree(rootIndividual.id);
        }

        if (!hierarchyRoot) {
            d3.select(svgRef.current).html(""); // Clear SVG if no tree can be built
            return;
        }

        const nodeWidth = 220; // Lebar kartu individu
        const nodeHeight = 100; // Tinggi kartu individu
        const nodePadding = 20; // Jarak antar node

        const treeLayout = d3.tree()
            .nodeSize([nodeHeight + nodePadding, nodeWidth + nodePadding]); // Untuk horizontal, nodeSize [height, width]

        const root = treeLayout(hierarchyRoot);

        // Menyesuaikan posisi X untuk root agar pohon dimulai dari kiri
        root.x0 = width / 2; // Inisialisasi posisi X (untuk transisi)
        root.y0 = 0;          // Inisialisasi posisi Y (untuk transisi)

        // Hitung tinggi total pohon untuk viewBox
        let maxY = 0;
        root.each(d => {
            if (d.y !== undefined && d.y > maxY) maxY = d.y;
        });
        const dynamicHeight = height || (root.x - root.x0)*2 + nodeHeight * 2; // Perkiraan tinggi

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-nodeWidth / 2, -nodeHeight / 2, width, dynamicHeight]) // Mengatur viewBox
            .html(""); // Bersihkan render sebelumnya

        const g = svg.append("g");

        // Pan and Zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom as any); // Type assertion for d3.zoom

        // Links (Horizontal)
        g.append("g")
            .attr("fill", "none")
            .attr("stroke", "#4b5563") // base-300
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkHorizontal<any, d3.HierarchyPointNode<Individual>>() // Gunakan linkHorizontal
                .x(d => d.y) // X dari data node adalah Y dari layout
                .y(d => d.x) // Y dari data node adalah X dari layout
            );

        // Nodes
        const node = g.append("g")
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", (d: any) => `translate(${d.y},${d.x})`) // Translate berdasarkan y dan x dari layout
            .on("click", (event: any, d: any) => navigate(`/individual/${d.data.id}`))
            .style("cursor", "pointer");

        // Rect for background/card
        node.append("rect")
            .attr("width", nodeWidth)
            .attr("height", nodeHeight)
            .attr("x", -nodeWidth / 2)
            .attr("y", -nodeHeight / 2)
            .attr("rx", 8)
            .attr("fill", (d: d3.HierarchyNode<Individual>) => d.data.gender === 'male' ? "#1e3a8a" : (d.data.gender === 'female' ? "#9d174d" : "#4b5563"))
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);

        // Image (Profile Picture)
        node.append("image")
            // PERBAIKAN: Gunakan photo_url (snake_case)
            .attr("xlink:href", (d: d3.HierarchyNode<Individual>) => d.data.photo_url || 'https://picsum.photos/seed/person/50/50')
            .attr("x", -nodeWidth / 2 + 10)
            .attr("y", -nodeHeight / 2 + 15)
            .attr("width", 50)
            .attr("height", 50)
            .attr("clip-path", "circle(25px at center)")
            .attr("preserveAspectRatio", "xMidYMid slice"); // Penting untuk gambar profil


        // Text (Name)
        node.append("text")
            .attr("x", 0) // Tengahkan teks
            .attr("y", -nodeHeight / 2 + 30) // Posisi Y untuk nama
            .attr("dy", "0.31em")
            .attr("fill", "white")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .attr("text-anchor", "middle") // Tengahkan teks secara horizontal
            .text((d: d3.HierarchyNode<Individual>) => d.data.name);

        // Text (Birth/Death Dates)
        node.append("text")
            .attr("x", 0) // Tengahkan teks
            .attr("y", -nodeHeight / 2 + 50) // Posisi Y untuk tanggal
            .attr("dy", "0.31em")
            .attr("fill", "lightgray")
            .style("font-size", "12px")
            .attr("text-anchor", "middle") // Tengahkan teks secara horizontal
            // PERBAIKAN: Gunakan birth_date dan death_date (snake_case)
            .text((d: d3.HierarchyNode<Individual>) => `${d.data.birth_date || ''} - ${d.data.death_date || ''}`);

        // Initial zoom to fit
        svg.call(zoom.transform as any, d3.zoomIdentity); // Reset zoom
    }, [rootIndividualId, individuals, families, viewType, buildDescendantTree, buildAncestorTree, navigate, width, height]);

    if (!rootIndividualId || (!individuals.size && !families.size)) {
        return <div className="text-center p-8 text-xl text-gray-400">Pilih individu atau tambahkan data silsilah.</div>;
    }
    if (!individuals.has(rootIndividualId)) {
        return <div className="text-center p-8 text-xl text-error">Individu utama tidak ditemukan.</div>;
    }

    return (
        <svg ref={svgRef} className="w-full h-full"></svg>
    );
};