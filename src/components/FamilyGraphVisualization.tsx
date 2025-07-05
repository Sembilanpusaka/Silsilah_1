// Silsilah_1/src/components/FamilyGraphVisualization.tsx
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Tables } from '../types/supabase';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { Graph, layout } from 'dagre';

// Perluas tipe Individual untuk menyimpan nomor d'Aboville jika perlu
// PERBAIKAN DI SINI: Mengganti 'interface' dengan 'type' untuk menghindari masalah parsing
type IndividualWithDAboville = Tables<'individuals'>['Row'] & {
    dAbovilleNumber?: string;
};

// Tipe untuk node dalam graph
interface GraphNodeData {
    id: string;
    type: 'individual' | 'family';
    individual?: IndividualWithDAboville; // Data individu jika type='individual'
    family?: Tables<'families'>['Row']; // Data keluarga jika type='family'
    label?: string; // Label untuk node di dagre
    width?: number; // Akan diisi oleh dagre
    height?: number; // Akan diisi oleh dagre
}

// Tipe untuk link dalam graph
interface GraphEdgeData {
    id: string;
    source: string;
    target: string;
    type: 'parent_to_family' | 'spouse_to_family' | 'family_to_child' | 'marriage_line';
}

interface FamilyGraphVisualizationProps {
    rootIndividualId: string | null;
    individuals: Map<string, Tables<'individuals'>['Row']>;
    families: Map<string, Tables<'families'>['Row']>;
    dAbovilleProgenitorId: string;
    viewType: 'descendants' | 'ancestors';
    width: number;
    height: number;
}

// Helper function to calculate d'Aboville number for descendants
const calculateDAbovilleNumber = (
    targetIndividualId: string,
    progenitorId: string,
    individualsMap: Map<string, Tables<'individuals'>['Row']>,
    familiesMap: Map<string, Tables<'families'>['Row']>
): string | null => {
    if (!progenitorId || !individualsMap.has(progenitorId)) {
        return null;
    }
    if (targetIndividualId === progenitorId) {
        return "1";
    }

    let dAbovilleNum: string | null = null;
    let foundPath = false;

    const findNumberRecursive = (
        currentPersonId: string,
        currentNum: string,
        visited: Set<string>
    ): void => {
        if (foundPath || visited.has(currentPersonId)) return;
        visited.add(currentPersonId);

        if (currentPersonId === targetIndividualId) {
            dAbovilleNum = currentNum;
            foundPath = true;
            return;
        }

        const person = individualsMap.get(currentPersonId);
        if (!person) return;

        const familiesAsSpouse = Array.from(familiesMap.values()).filter(
            f => f.spouse1_id === currentPersonId || f.spouse2_id === currentPersonId
        );

        const allChildrenIds: string[] = [];
        for (const family of familiesAsSpouse) {
            if (Array.isArray(family.children_ids)) {
                allChildrenIds.push(...family.children_ids);
            }
        }

        const uniqueChildren = Array.from(new Set(allChildrenIds))
                                    .map(childId => individualsMap.get(childId))
                                    .filter((child): child is Tables<'individuals'>['Row'] => child !== undefined);

        uniqueChildren.sort((a, b) => {
            const dateA = a.birth_date ? new Date(a.birth_date).getTime() : 0;
            const dateB = b.birth_date ? new Date(b.birth_date).getTime() : 0;
            if (dateA && dateB) return dateA - dateB;
            return a.id.localeCompare(b.id);
        });

        let childIndex = 1;
        for (const child of uniqueChildren) {
            findNumberRecursive(child.id, `${currentNum}.${childIndex}`, new Set(visited));
            if (foundPath) return;
            childIndex++;
        }
    };

    findNumberRecursive(progenitorId, "1", new Set<string>());
    return dAbovilleNum;
};


export const FamilyGraphVisualization: React.FC<FamilyGraphVisualizationProps> = ({
    rootIndividualId,
    individuals,
    families,
    dAbovilleProgenitorId,
    viewType,
    width,
    height
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const navigate = useNavigate();

    // Node dimensions for Dagre layout
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 80;
    const FAMILY_NODE_WIDTH = 10; // Invisible node for family
    const FAMILY_NODE_HEIGHT = 10; // Invisible node for family

    // 1. Convert data to Dagre Graph format (nodes and edges)
    const graphData = useMemo(() => {
        const nodes: GraphNodeData[] = [];
        const edges: GraphEdgeData[] = [];
        const processedFamilyNodes = new Set<string>(); // Untuk memastikan node keluarga unik

        if (!rootIndividualId || !individuals.size) return { nodes: [], edges: [] };

        const rootIndividual = individuals.get(rootIndividualId);
        if (!rootIndividual) return { nodes: [], edges: [] };

        const queue: { id: string; }[] = [{ id: rootIndividualId }];
        const processedForGraph = new Set<string>(); // Use a set to prevent infinite loops in graph traversal

        while (queue.length > 0) {
            const currentItem = queue.shift();
            if (!currentItem || processedForGraph.has(currentItem.id)) continue;
            processedForGraph.add(currentItem.id);

            const individual = individuals.get(currentItem.id);
            if (!individual) continue;

            const individualNode: IndividualWithDAboville = { ...individual };
            if (viewType === 'descendants') {
                individualNode.dAbovilleNumber = calculateDAbovilleNumber(
                    individual.id,
                    dAbovilleProgenitorId,
                    individuals,
                    families
                );
            }
            nodes.push({ id: individual.id, type: 'individual', individual: individualNode, label: individual.name, width: NODE_WIDTH, height: NODE_HEIGHT });

            if (viewType === 'descendants') {
                // Find families where this individual is a spouse
                const spouseFamilies = Array.from(families.values()).filter(
                    f => f.spouse1_id === individual.id || f.spouse2_id === individual.id
                );

                spouseFamilies.forEach(family => {
                    const familyNodeId = `family-${family.id}`;
                    if (!processedFamilyNodes.has(familyNodeId)) {
                        nodes.push({ id: familyNodeId, type: 'family', family: family, label: '', width: FAMILY_NODE_WIDTH, height: FAMILY_NODE_HEIGHT });
                        processedFamilyNodes.add(familyNodeId);

                        // Connect spouses to family node
                        if (family.spouse1_id && individuals.has(family.spouse1_id)) {
                            edges.push({ id: `${family.spouse1_id}-${familyNodeId}`, source: family.spouse1_id, target: familyNodeId, type: 'spouse_to_family' });
                        }
                        if (family.spouse2_id && individuals.has(family.spouse2_id)) {
                            edges.push({ id: `${family.spouse2_id}-${familyNodeId}`, source: family.spouse2_id, target: familyNodeId, type: 'spouse_to_family' });
                        }
                    }

                    // Connect family node to children
                    (family.children_ids || []).forEach(childId => {
                        if (individuals.has(childId)) {
                            edges.push({ id: `${familyNodeId}-${childId}`, source: familyNodeId, target: childId, type: 'family_to_child' });
                            if (!processedForGraph.has(childId)) { // Add children to queue if not processed
                                queue.push({ id: childId });
                            }
                        }
                    });
                });
            } else { // ancestors
                // Find family where this individual is a child
                if (individual.child_in_family_id) {
                    const parentFamily = families.get(individual.child_in_family_id);
                    if (parentFamily) {
                        const familyNodeId = `family-${parentFamily.id}`;
                        if (!processedFamilyNodes.has(familyNodeId)) {
                            nodes.push({ id: familyNodeId, type: 'family', family: parentFamily, label: '', width: FAMILY_NODE_WIDTH, height: FAMILY_NODE_HEIGHT });
                            processedFamilyNodes.add(familyNodeId);

                            // Connect parents to family node (reversed for ancestors)
                            if (parentFamily.spouse1_id && individuals.has(parentFamily.spouse1_id)) {
                                edges.push({ id: `${parentFamily.spouse1_id}-${familyNodeId}`, source: parentFamily.spouse1_id, target: familyNodeId, type: 'spouse_to_family' });
                                if (!processedForGraph.has(parentFamily.spouse1_id)) {
                                    queue.push({ id: parentFamily.spouse1_id });
                                }
                            }
                            if (parentFamily.spouse2_id && individuals.has(parentFamily.spouse2_id)) {
                                edges.push({ id: `${parentFamily.spouse2_id}-${familyNodeId}`, source: parentFamily.spouse2_id, target: familyNodeId, type: 'spouse_to_family' });
                                if (!processedForGraph.has(parentFamily.spouse2_id)) {
                                    queue.push({ id: parentFamily.spouse2_id });
                                }
                            }
                        }
                        // Connect child to family node (reversed for ancestors)
                        edges.push({ id: `${individual.id}-${familyNodeId}`, source: individual.id, target: familyNodeId, type: 'family_to_child' });
                    }
                }
            }
        }
        
        console.log("Graph Data Nodes:", nodes);
        console.log("Graph Data Edges:", edges);
        return { nodes, edges };
    }, [rootIndividualId, individuals, families, dAbovilleProgenitorId, viewType]);

    useEffect(() => {
        if (!svgRef.current) return;

        // PERBAIKAN DI SINI: Pastikan Graph adalah konstruktor yang benar
        // Ini adalah import yang paling sering berhasil untuk Dagre's Graph di ES Module
        // Jika masih error, masalahnya mungkin dengan versi dagre atau Vite itu sendiri
        if (typeof Graph !== 'function') { // Pengecekan runtime tambahan
            console.error("TypeError: Graph is not a constructor. 'dagre' module might be incorrectly imported or loaded.");
            return;
        }

        const g = new Graph({ directed: true, compound: true })
            .setGraph({})
            .setDefaultNodeLabel(function() { return {}; })
            .setDefaultEdgeLabel(function() { return {}; });

        // Set Dagre graph direction based on viewType
        g.graph().rankdir = (viewType === 'descendants' ? 'TB' : 'BT'); // TB for top-bottom (descendants), BT for bottom-top (ancestors)
        g.graph().nodesep = 50; // Jarak antar node
        g.graph().edgesep = 10; // Jarak antar edge
        g.graph().ranksep = 70; // Jarak antar rank (generasi)

        // Add nodes
        graphData.nodes.forEach(node => {
            g.setNode(node.id, { label: node.label, width: node.width, height: node.height, type: node.type, data: node.individual || node.family });
        });

        // Add edges
        graphData.edges.forEach(edge => {
            g.setEdge(edge.source, edge.target, { type: edge.type });
        });

        try {
            layout(g); // Run Dagre layout
        } catch (layoutError) {
            console.error("Dagre layout failed:", layoutError);
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous drawing

        const renderGroup = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                renderGroup.attr("transform", event.transform);
            });
        svg.call(zoom as any);

        // Render Edges (Links)
        g.edges().forEach(edgeId => {
            const edge = g.edge(edgeId);
            // Draw path based on edge.points
            if (edge.points && edge.points.length > 0) {
                renderGroup.append("path")
                    .attr("d", d3.line<any>().x(d => d.x).y(d => d.y)(edge.points))
                    .attr("fill", "none")
                    .attr("stroke", "#4b5563")
                    .attr("stroke-width", 2)
                    .attr("marker-end", "url(#arrow)"); // Tambahkan panah
            }
        });

        // Define arrowhead marker
        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10) // Posisikan panah di ujung garis
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#4b5563");


        // Render Nodes
        g.nodes().forEach(nodeId => {
            const node = g.node(nodeId);
            const nodeData = (node.data as GraphNodeData); // Cast to GraphNodeData

            if (!nodeData) { // PERBAIKAN: Tambahkan pengecekan ini
                console.warn("Skipping node rendering for undefined nodeData:", nodeId);
                return;
            }

            if (nodeData.type === 'individual' && nodeData.individual) {
                const individual = nodeData.individual;
                const nodeGroup = renderGroup.append("g")
                    .attr("transform", `translate(${node.x},${node.y})`)
                    .style("cursor", "pointer")
                    .on("click", () => navigate(`/individual/${individual.id}`));

                // Card background
                nodeGroup.append("rect")
                    .attr("width", NODE_WIDTH)
                    .attr("height", NODE_HEIGHT)
                    .attr("x", -NODE_WIDTH / 2)
                    .attr("y", -NODE_HEIGHT / 2)
                    .attr("rx", 8)
                    .attr("fill", individual.gender === 'male' ? "#1e3a8a" : (individual.gender === 'female' ? "#9d174d" : "#4b5563"))
                    .attr("stroke", "#3b82f6")
                    .attr("stroke-width", 2);

                // Image (Profile Picture)
                nodeGroup.append("image")
                    .attr("xlink:href", individual.photo_url || 'https://picsum.photos/seed/person/50/50')
                    .attr("x", -NODE_WIDTH / 2 + 10)
                    .attr("y", -NODE_HEIGHT / 2 + 15)
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("clip-path", "circle(25px at center)")
                    .attr("preserveAspectRatio", "xMidYMid slice");

                // Text (Name)
                nodeGroup.append("text")
                    .attr("x", 15) // Posisi X relatif (di samping gambar)
                    .attr("y", -NODE_HEIGHT / 2 + 30) // Posisi Y untuk nama
                    .attr("dy", "0.31em")
                    .attr("fill", "white")
                    .style("font-size", "14px")
                    .style("font-weight", "bold")
                    .attr("text-anchor", "start")
                    .text(individual.name);

                // Text (Birth/Death Dates)
                nodeGroup.append("text")
                    .attr("x", 15)
                    .attr("y", -NODE_HEIGHT / 2 + 50)
                    .attr("dy", "0.31em")
                    .attr("fill", "lightgray")
                    .style("font-size", "12px")
                    .attr("text-anchor", "start")
                    .text(`${individual.birth_date || ''} - ${individual.death_date || ''}`);

                // d'Aboville Number (only for descendants view)
                if (viewType === 'descendants' && individual.dAbovilleNumber) {
                    nodeGroup.append("text")
                        .attr("x", 15)
                        .attr("y", -NODE_HEIGHT / 2 + 70)
                        .attr("dy", "0.31em")
                        .attr("fill", "#ffdd00")
                        .style("font-size", "14px")
                        .style("font-weight", "bold")
                        .attr("text-anchor", "start")
                        .text(`No. ${individual.dAbovilleNumber}`);
                }
            } else if (nodeData.type === 'family') {
                // Render invisible family node (just a small circle for connection point)
                renderGroup.append("circle")
                    .attr("cx", node.x)
                    .attr("cy", node.y)
                    .attr("r", 3) // Radius kecil
                    .attr("fill", "#555") // Warna gelap agar terlihat untuk debug
                    .attr("stroke", "none");
            }
        });

        // Fit to content and center (initial zoom)
        const bbox = renderGroup.node()?.getBBox();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
            const scale = Math.min(width / (bbox.width + 100), height / (bbox.height + 100)); // Add some padding
            const translateX = width / 2 - bbox.x * scale - bbox.width * scale / 2;
            const translateY = height / 2 - bbox.y * scale - bbox.height * scale / 2;

            svg.call(zoom.transform as any, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
        }


    }, [graphData, navigate, width, height, viewType]);

    if (!rootIndividualId || (!individuals.size && !families.size)) {
        return <div className="text-center p-8 text-xl text-gray-400">Pilih individu atau tambahkan data silsilah.</div>;
    }
    if (!individuals.has(rootIndividualId)) {
        return <div className="text-center p-8 text-xl text-error">Individu utama tidak ditemukan.</div>;
    }

    return (
        <svg ref={svgRef} width={width} height={height} style={{ border: '1px solid green' }}></svg>
    );
};