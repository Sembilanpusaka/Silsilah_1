// Silsilah_1/src/components/D3FamilyTreeVisualization.tsx
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tables } from '../types/supabase';
import * as d3 from 'd3';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];
type Gender = Tables<'public'>['Enums']['gender_enum'];

// Definisikan tipe untuk node di hirarki D3 yang akan kita buat
interface HierarchyNodeData {
    id: string;
    name: string;
    gender?: Gender;
    photo_url?: string | null;
    birth_date?: string | null;
    death_date?: string | null;
    isSpouseNode?: boolean; // Menandai jika ini adalah node pasangan virtual
    isMarriageNode?: boolean; // Menandai jika ini adalah node pernikahan virtual
    ahnentafel?: number; // Nomor Ahnentafel
    children?: HierarchyNodeData[]; // Untuk keturunan atau orang tua
}

export const D3FamilyTreeVisualization: React.FC<D3FamilyTreeVisualizationProps> = ({
    rootIndividualId,
    individuals,
    families,
    viewType,
    width = 1200,
    height = 600
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const navigate = useNavigate();

    // Fungsi untuk membangun pohon keturunan
    const buildDescendantTree = useCallback((personId: string, visited = new Set<string>()): HierarchyNodeData | null => {
        if (visited.has(personId)) return null;
        visited.add(personId);

        const person = individuals.get(personId);
        if (!person) return null;

        const nodeData: HierarchyNodeData = { ...person, children: [] };

        const familiesWherePersonIsSpouse = Array.from(families.values()).filter(
            f => f.spouse1_id === personId || f.spouse2_id === personId
        );

        for (const family of familiesWherePersonIsSpouse) {
            const otherSpouseId = family.spouse1_id === personId ? family.spouse2_id : family.spouse1_id;
            const otherSpouse = otherSpouseId ? individuals.get(otherSpouseId) : null;

            // Membuat Node Pernikahan Virtual jika ada pasangan
            let marriageNode: HierarchyNodeData | null = null;
            if (otherSpouse) {
                if (!visited.has(`marriage-${family.id}`)) { // Hindari duplikasi node pernikahan
                    marriageNode = {
                        id: `marriage-${family.id}`,
                        name: family.marriage_date ? `Menikah (${family.marriage_date})` : 'Keluarga',
                        isMarriageNode: true,
                        children: [], // Anak-anak akan digantungkan di sini
                    };
                    // Tambahkan pasangan ke node pernikahan (sebagai anak virtual)
                    if (!visited.has(person.id)) { // Jika belum dikunjungi, tambahkan diri sendiri
                        marriageNode.children!.push({ ...person });
                        visited.add(person.id);
                    }
                    if (!visited.has(otherSpouse.id)) { // Tambahkan pasangan
                        marriageNode.children!.push({ ...otherSpouse, isSpouseNode: true });
                        visited.add(otherSpouse.id);
                    }
                }
            } else {
                 // Jika tidak ada pasangan, anak-anak digantungkan langsung ke individu
                 marriageNode = { ...person, children: [] };
            }

            if (marriageNode && !visited.has(marriageNode.id)) {
                // Tambahkan anak-anak ke node pernikahan (atau langsung ke individu jika tidak ada pasangan)
                if (Array.isArray(family.children_ids)) {
                    for (const childId of family.children_ids) {
                        const childNode = buildDescendantTree(childId, new Set(visited));
                        if (childNode) {
                            marriageNode.children!.push(childNode);
                        }
                    }
                }
                nodeData.children!.push(marriageNode); // Node pernikahan/individu ini jadi anak
                visited.add(marriageNode.id); // Tandai node pernikahan sudah dikunjungi
            }
        }
        return nodeData;
    }, [individuals, families]);


    // Fungsi untuk membangun pohon leluhur
    const buildAncestorTree = useCallback((personId: string, visited = new Set<string>(), ahnentafelNum = 1): HierarchyNodeData | null => {
        if (visited.has(personId)) return null;
        visited.add(personId);

        const person = individuals.get(personId);
        if (!person) return null;

        const nodeData: HierarchyNodeData = { ...person, children: [], ahnentafel: ahnentafelNum };

        if (person.child_in_family_id) {
            const parentFamily = families.get(person.child_in_family_id);
            if (parentFamily) {
                // Cek apakah ini pernikahan yang valid
                const father = parentFamily.spouse1_id ? individuals.get(parentFamily.spouse1_id) : null;
                const mother = parentFamily.spouse2_id ? individuals.get(parentFamily.spouse2_id) : null;

                // Buat node pernikahan virtual untuk orang tua
                const marriageNodeId = `marriage-${parentFamily.id}`;
                const hasBothParents = father && mother;

                if (!visited.has(marriageNodeId)) {
                    const parentMarriageNode: HierarchyNodeData = {
                        id: marriageNodeId,
                        name: father?.name && mother?.name ? `Keluarga ${father.name} & ${mother.name}` : (father?.name || mother?.name || 'Keluarga Orang Tua'),
                        isMarriageNode: true,
                        children: []
                    };
                    
                    if (father) {
                        const fatherNode = buildAncestorTree(father.id, new Set(visited), ahnentafelNum * 2);
                        if (fatherNode) parentMarriageNode.children!.push(fatherNode);
                    }
                    if (mother) {
                        const motherNode = buildAncestorTree(mother.id, new Set(visited), ahnentafelNum * 2 + 1);
                        if (motherNode) parentMarriageNode.children!.push(motherNode);
                    }
                    nodeData.children!.push(parentMarriageNode); // Node pernikahan ini adalah "anak" dari individu
                    visited.add(marriageNodeId);
                }
            }
        }
        return nodeData;
    }, [individuals, families]);


    useEffect(() => {
        if (!rootIndividualId || individuals.size === 0 || !svgRef.current) {
            d3.select(svgRef.current).html("");
            return;
        }

        const rootIndividual = individuals.get(rootIndividualId);
        if (!rootIndividual) {
            d3.select(svgRef.current).html("");
            return;
        }

        let hierarchyRoot: d3.HierarchyNode<HierarchyNodeData> | null = null;

        if (viewType === 'descendants') {
            hierarchyRoot = d3.hierarchy(buildDescendantTree(rootIndividual.id) as HierarchyNodeData);
        } else { // ancestors
            hierarchyRoot = d3.hierarchy(buildAncestorTree(rootIndividual.id) as HierarchyNodeData);
        }

        if (!hierarchyRoot) {
            d3.select(svgRef.current).html("");
            return;
        }

        const nodeWidth = 220;
        const nodeHeight = 100;
        const nodePadding = 40;

        const treeLayout = d3.tree<HierarchyNodeData>()
            .nodeSize([nodeHeight + nodePadding, nodeWidth + nodePadding]);

        const root = treeLayout(hierarchyRoot);

        let minX = Infinity, maxX = -Infinity;
        root.each(d => {
            if (d.x !== undefined && d.x < minX) minX = d.x;
            if (d.x !== undefined && d.x > maxX) maxX = d.x;
        });
        const treeHeight = maxX - minX;

        const effectiveWidth = width || window.innerWidth * 0.9;
        const effectiveHeight = height || window.innerHeight * 0.7;

        const initialTranslateY = effectiveHeight / 2 - treeHeight / 2 - minX;


        const svg = d3.select(svgRef.current)
            .attr("viewBox", `0 0 ${effectiveWidth} ${effectiveHeight}`)
            .html("");

        const g = svg.append("g")
            .attr("transform", `translate(${nodeWidth / 2}, ${initialTranslateY})`);


        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);


        // Links (Horizontal)
        g.append("g")
            .attr("fill", "none")
            .attr("stroke", "#4b5563")
            .attr("stroke-width", 1.5)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkHorizontal<any, d3.HierarchyPointNode<HierarchyNodeData>>()
                .x(d => d.y)
                .y(d => d.x)
            );

        // Nodes
        const node = g.append("g")
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
            .on("click", (event: any, d: any) => {
                if (!d.data.isMarriageNode) { // Jangan navigasi jika node pernikahan
                    navigate(`/individual/${d.data.id}`);
                }
            })
            .style("cursor", (d: any) => d.data.isMarriageNode ? "default" : "pointer"); // Kursor berbeda


        // Rect for background/card
        node.append("rect")
            .attr("width", d => d.data.isMarriageNode ? nodeWidth * 0.7 : nodeWidth) // Lebih kecil untuk node pernikahan
            .attr("height", d => d.data.isMarriageNode ? nodeHeight * 0.5 : nodeHeight) // Lebih kecil untuk node pernikahan
            .attr("x", d => d.data.isMarriageNode ? -nodeWidth * 0.7 / 2 : -nodeWidth / 2)
            .attr("y", d => d.data.isMarriageNode ? -nodeHeight * 0.5 / 2 : -nodeHeight / 2)
            .attr("rx", 8)
            .attr("fill", (d: d3.HierarchyNode<HierarchyNodeData>) => d.data.isMarriageNode ? "#374151" : (d.data.gender === 'male' ? "#1e3a8a" : (d.data.gender === 'female' ? "#9d174d" : "#4b5563")))
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2);

        // Image (Profile Picture) - Hanya untuk individu, bukan node pernikahan
        node.filter(d => !d.data.isMarriageNode)
            .append("image")
            .attr("xlink:href", (d: d3.HierarchyNode<HierarchyNodeData>) => d.data.photo_url || 'https://picsum.photos/seed/person/50/50')
            .attr("x", -nodeWidth / 2 + 10)
            .attr("y", -nodeHeight / 2 + 15)
            .attr("width", 50)
            .attr("height", 50)
            .attr("clip-path", "circle(25px at center)")
            .attr("preserveAspectRatio", "xMidYMid slice");


        // Text (Name)
        node.append("text")
            .attr("x", (d: d3.HierarchyNode<HierarchyNodeData>) => d.data.isMarriageNode ? 0 : (-nodeWidth / 2 + 70)) // Tengahkan jika node pernikahan
            .attr("y", (d: d3.HierarchyNode<HierarchyNodeData>) => d.data.isMarriageNode ? -nodeHeight / 2 + 25 : -nodeHeight / 2 + 30) // Sesuaikan Y
            .attr("dy", "0.31em")
            .attr("fill", "white")
            .style("font-size", (d: d3.HierarchyNode<HierarchyNodeData>) => d.data.isMarriageNode ? "12px" : "14px")
            .style("font-weight", "bold")
            .attr("text-anchor", (d: d3.HierarchyNode<HierarchyNodeData>) => d.data.isMarriageNode ? "middle" : "start") // Tengahkan jika node pernikahan
            .text((d: d3.HierarchyNode<HierarchyNodeData>) => d.data.name);

        // Text (Ahnentafel Number) - Hanya untuk leluhur, jika bukan node pernikahan
        node.filter(d => !d.data.isMarriageNode && d.data.ahnentafel !== undefined)
            .append("text")
            .attr("x", -nodeWidth / 2 + 5) // Posisikan di pojok kiri atas
            .attr("y", -nodeHeight / 2 + 5)
            .attr("dy", "0.31em")
            .attr("fill", "gold")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text((d: d3.HierarchyNode<HierarchyNodeData>) => `(${d.data.ahnentafel})`);


        // Text (Birth/Death Dates) - Hanya untuk individu, bukan node pernikahan
        node.filter(d => !d.data.isMarriageNode)
            .append("text")
            .attr("x", -nodeWidth / 2 + 70)
            .attr("y", -nodeHeight / 2 + 60)
            .attr("dy", "0.31em")
            .attr("fill", "lightgray")
            .style("font-size", "12px")
            .text((d: d3.HierarchyNode<HierarchyNodeData>) => `${d.data.birth_date || ''} - ${d.data.death_date || ''}`);

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