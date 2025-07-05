// Silsilah_1/src/components/DTreeFamilyTree.tsx
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Tables } from '../types/supabase';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';

declare global {
    interface Window {
        dTree?: any;
    }
}

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

interface DTreeFamilyTreeProps {
    rootIndividualId: string | null;
    individuals: Map<string, Individual>;
    families: Map<string, Family>;
    dAbovilleProgenitorId: string;
    viewType: 'descendants' | 'ancestors';
    width: number;
    height: number;
}

export const DTreeFamilyTree: React.FC<DTreeFamilyTreeProps> = ({
    rootIndividualId,
    individuals,
    families,
    dAbovilleProgenitorId,
    viewType,
    width,
    height
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const DTREE_CONTAINER_ID = "dtree-visualization-container"; // ID statis

    // --- FUNGSI convertDataToDTreeFormat DENGAN DATA MINIMAL UNTUK PENGUJIAN ---
    // Logika kompleks sebelumnya DIKOMENTARI untuk tujuan debugging.
    // Ini akan menguji apakah dTree merender dengan data paling dasar.
    const convertDataToDTreeFormat = useCallback(() => {
        const minimalData = [
            {
                id: 'bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b', // Qomaruddin
                name: 'Qomaruddin (Root)',
                marriages: [
                    {
                        spouse: 'd2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a', // Hafshoh
                        children: ['e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b'] // Harun
                    }
                ],
                extra: { gender: 'male', birth_date: '1700 M' }
            },
            {
                id: 'd2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a', // Hafshoh
                name: 'Hafshoh (Istri Qomaruddin)',
                marriages: [], // Pernikahan akan diwakili di node pasangan
                extra: { gender: 'female', birth_date: '1705 M' }
            },
            {
                id: 'e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b', // Harun
                name: 'Harun (Anak Qomaruddin)',
                marriages: [],
                extra: { gender: 'male', birth_date: '1725 M' }
            }
        ];

        console.log("[DTreeFamilyTree] Menggunakan data minimal untuk pengujian:", minimalData);
        return minimalData;
    }, []); // Dependensi dikosongkan karena data di-hardcode

    useEffect(() => {
        console.log("[DTreeFamilyTree] rendering...");
        console.log("[DTreeFamilyTree] rootIndividualId:", rootIndividualId);
        console.log("[DTreeFamilyTree] dAbovilleProgenitorId:", dAbovilleProgenitorId);
        console.log("[DTreeFamilyTree] viewType:", viewType);
        console.log("[DTreeFamilyTree] individuals map size:", individuals.size);
        console.log("[DTreeFamilyTree] families map size:", families.size);
        console.log("[DTreeFamilyTree] Is rootIndividualId in individuals?", individuals.has(rootIndividualId || ''));

        if (!containerRef.current) {
            console.warn("[DTreeFamilyTree] Container ref is null, cannot render.");
            return;
        }

        const dTreeInstance = window.dTree;
        if (!dTreeInstance) {
            console.error("[DTreeFamilyTree] Kesalahan: Pustaka DTree tidak ditemukan di objek window. Pastikan dtree.min.js dimuat di index.html.");
            containerRef.current.innerHTML = "<div class='text-center p-8 text-xl text-error'>Kesalahan: Pustaka DTree tidak ditemukan. Pastikan dtree.min.js dimuat di index.html.</div>";
            return;
        }

        containerRef.current.innerHTML = '';
        const dtreeTargetDiv = document.createElement('div');
        dtreeTargetDiv.id = DTREE_CONTAINER_ID;
        dtreeTargetDiv.style.width = `${width}px`;
        dtreeTargetDiv.style.height = `${height}px`;
        dtreeTargetDiv.style.position = 'relative';
        containerRef.current.appendChild(dtreeTargetDiv);


        if (!rootIndividualId || !individuals.has(rootIndividualId)) {
            dtreeTargetDiv.innerHTML = "<div class='text-center p-8 text-xl text-gray-400'>Individu utama tampilan tidak ditemukan.</div>";
            return;
        }

        if (viewType === 'descendants' && (!dAbovilleProgenitorId || !individuals.has(dAbovilleProgenitorId))) {
            dtreeTargetDiv.innerHTML = "<div class='text-center p-8 text-xl text-error'>Progenitor D'Aboville (No. 1) tidak ditemukan atau tidak valid untuk penomoran keturunan.</div>";
            return;
        }

        const dtreeData = convertDataToDTreeFormat(); // Ini akan memanggil fungsi data minimal

        if (dtreeData.length === 0) {
             console.warn("[DTreeFamilyTree] dtreeData kosong setelah konversi, tidak ada yang bisa dirender.");
             dtreeTargetDiv.innerHTML = "<div class='text-center p-8 text-xl text-error'>Tidak ada data untuk dirender oleh dTree. Pastikan individu dan keluarga terisi.</div>";
             return;
        }

        // Perbarui rootNodeForDtree agar sesuai dengan data minimal
        const rootNodeForDtree = dtreeData.find(node => node.id === rootIndividualId);
        if (!rootNodeForDtree) {
            console.warn("[DTreeFamilyTree] rootNodeForDtree tidak ditemukan dalam dtreeData minimal.");
            // Coba fallback ke node pertama di minimalData jika rootIndividualId tidak cocok
            const fallbackRootNode = dtreeData[0];
            if(fallbackRootNode) {
                console.warn("[DTreeFamilyTree] Menggunakan node pertama sebagai fallback root.");
                options.root = fallbackRootNode.id;
            } else {
                dtreeTargetDiv.innerHTML = "<div class='text-center p-8 text-xl text-error'>Individu utama tampilan tidak ditemukan dalam data dTree (minimal).</div>";
                return;
            }
        }


        const options: any = {
            target: DTREE_CONTAINER_ID,
            debug: true,
            width: width,
            height: height,
            callbacks: {
                nodeClick: function(name: string, extra: any) {
                    if (extra && extra.id) {
                        navigate(`/individual/${extra.id}`);
                    }
                },
                nodeRightClick: function(name: string, extra: any) {
                    // console.log("Right click on node: ", name, extra);
                },
                // --- nodeRender BAWAAN dTree (Kustomisasi Dikomentari) ---
                // Jika dengan ini graf muncul, berarti masalahnya ada di nodeRender kustom kita.
                // nodeRender: function(node: any, selector: any) {
                //     console.log("[DTreeFamilyTree] nodeRender called for:", node.data.name, node.data.id);
                //     const data = node.data;
                //     const individual = individuals.get(data.id);

                //     selector.selectAll("*").remove();

                //     selector.append("rect")
                //         .attr("width", 200)
                //         .attr("height", 80)
                //         .attr("x", -100)
                //         .attr("y", -40)
                //         .attr("rx", 8)
                //         .attr("fill", individual?.gender === 'male' ? "#1e3a8a" : (individual?.gender === 'female' ? "#9d174d" : "#4b5563"))
                //         .attr("stroke", "#3b82f6")
                //         .attr("stroke-width", 2);

                //     selector.append("image")
                //         .attr("xlink:href", individual?.photo_url || 'https://picsum.photos/seed/person/50/50')
                //         .attr("x", -90)
                //         .attr("y", -30)
                //         .attr("width", 50)
                //         .attr("height", 50)
                //         .attr("clip-path", "circle(25px at center)")
                //         .attr("preserveAspectRatio", "xMidYMid slice");

                //     selector.append("text")
                //         .attr("x", 15)
                //         .attr("y", -20)
                //         .attr("dy", "0.31em")
                //         .attr("fill", "white")
                //         .style("font-size", "14px")
                //         .style("font-weight", "bold")
                //         .attr("text-anchor", "start")
                //         .text(individual?.name || 'N/A');

                //     selector.append("text")
                //         .attr("x", 15)
                //         .attr("y", 0)
                //         .attr("dy", "0.31em")
                //         .attr("fill", "lightgray")
                //         .style("font-size", "12px")
                //         .attr("text-anchor", "start")
                //         .text(`${individual?.birth_date || ''} - ${individual?.death_date || ''}`);

                //     if (viewType === 'descendants' && data.d_aboville_number) {
                //         selector.append("text")
                //             .attr("x", 15)
                //             .attr("y", 20)
                //             .attr("dy", "0.31em")
                //             .attr("fill", "#ffdd00")
                //             .style("font-size", "14px")
                //             .style("font-weight", "bold")
                //             .attr("text-anchor", "start")
                //             .text(`No. ${data.d_aboville_number}`);
                //     }
                // },
                finished: function() {
                    console.log("[DTreeFamilyTree] dTree rendering finished callback fired.");
                    const svg = d3.select(`#${DTREE_CONTAINER_ID} svg`);
                    if (svg.node()) {
                        try {
                            const bbox = svg.node()?.getBBox();
                            if (bbox && bbox.width > 0 && bbox.height > 0) {
                                console.log("[DTreeFamilyTree] SVG BBox (from finished callback):", bbox);
                                const margin = 50;
                                const initialX = bbox.x - margin;
                                const initialY = bbox.y - margin;
                                const initialWidth = bbox.width + 2 * margin;
                                const initialHeight = bbox.height + 2 * margin;
                                svg.attr("viewBox", `${initialX} ${initialY} ${initialWidth} ${initialHeight}`);

                                const zoom = d3.zoom()
                                    .scaleExtent([0.1, 3])
                                    .on("zoom", (event) => {
                                        svg.select("g").attr("transform", event.transform);
                                    });
                                svg.call(zoom as any);
                                console.log("[DTreeFamilyTree] ViewBox and zoom applied (from finished callback).");
                            } else {
                                console.warn("[DTreeFamilyTree] SVG BBox is invalid or zero-sized in finished callback, skipping viewBox adjustment. This might be normal for very small trees or if rendering happens very fast.", bbox);
                                svg.attr("viewBox", `0 0 ${width} ${height}`);
                                const zoom = d3.zoom()
                                    .scaleExtent([0.1, 3])
                                    .on("zoom", (event) => {
                                        svg.select("g").attr("transform", event.transform);
                                    });
                                svg.call(zoom as any);
                                console.log("[DTreeFamilyTree] Applied default viewBox and zoom as fallback.");
                            }
                        } catch (bboxError) {
                            console.error("[DTreeFamilyTree] Error getting SVG BBox in finished callback:", bboxError);
                        }
                    } else {
                        console.warn("[DTreeFamilyTree] SVG element not found in finished callback. This means dTree might not have rendered an SVG, or the ID target is incorrect.");
                    }
                }
            },
            nodeWidth: 200,
            nodeHeight: 80,
            padding: 20,
            root: rootIndividualId,
        };

        if (viewType === 'descendants') {
            options.numbering = true;
            options.rootId = dAbovilleProgenitorId;
            options.numberingType = 'descendants';
            options.rootOrientation = 'north';
        } else { // viewType === 'ancestors'
            options.numbering = false;
            options.rootOrientation = 'south';
        }

        try {
            console.log("[DTreeFamilyTree] Initializing dTree with data and options...", { dtreeData, options });
            dTreeInstance.init(dtreeData, options);
            console.log("[DTreeFamilyTree] dTree initialization complete.");
        } catch (initError) {
            console.error("[DTreeFamilyTree] Error during dTree initialization:", initError);
            dtreeTargetDiv.innerHTML = `<div class='text-center p-8 text-xl text-error'>Kesalahan rendering silsilah: ${initError instanceof Error ? initError.message : String(initError)}.</div>`;
        }


    }, [rootIndividualId, individuals, families, dAbovilleProgenitorId, viewType, width, height, convertDataToDTreeFormat, navigate]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden flex justify-center items-center" style={{ border: '1px solid red' }}>
            {/* dTree akan merender SVG ke dalam div dengan ID DTREE_CONTAINER_ID yang dibuat di useEffect */}
        </div>
    );
};