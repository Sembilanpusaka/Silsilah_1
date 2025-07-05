// src/components/FamilyFlowVisualization.tsx
import React, { useMemo } from 'react';
import { ReactFlowProvider, Position, Handle, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Tables } from '../types/supabase';
import { ElkjsLayout } from './layout/ElkjsLayout';

type Individual = Tables<'individuals'>['Row'];

interface FamilyFlowVisualizationProps {
    rootIndividualId: string;
    individuals: Map<string, Individual>;
    families: Map<string, Tables<'families'>['Row']>;
    viewType: 'descendants' | 'ancestors';
}

// Node Kustom dengan Handle untuk titik koneksi
const IndividualNode = ({ data }: { data: { label: string, gender: string | null, photo_url: string | null } }) => (
    <>
        <Handle type="target" position={Position.Top} className="!bg-gray-500" />
        <div 
          className="p-3 rounded-lg shadow-lg w-52 bg-base-300"
          style={{ 
            border: `2px solid ${data.gender === 'male' ? '#3b82f6' : (data.gender === 'female' ? '#ec4899' : '#6b7280')}`
          }}
        >
            <div className="flex items-center space-x-3">
                <img 
                    src={data.photo_url || 'https://picsum.photos/seed/person/50/50'} 
                    alt={data.label}
                    className="w-12 h-12 rounded-full object-cover"
                />
                <span className="text-white font-bold text-base">{data.label}</span>
            </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
    </>
);

const nodeTypes = {
    individualNode: IndividualNode,
};

const FlowGenerator: React.FC<FamilyFlowVisualizationProps> = (props) => {
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const processedIds = new Set<string>();

        if (!props.rootIndividualId || !props.individuals.size) {
            return { initialNodes: [], initialEdges: [] };
        }

        const buildGraph = (personId: string) => {
            if (!personId || processedIds.has(personId) || !props.individuals.has(personId)) return;
            
            processedIds.add(personId);
            const individual = props.individuals.get(personId)!;

            nodes.push({
                id: individual.id,
                type: 'individualNode',
                position: { x: 0, y: 0 },
                data: { label: individual.name, gender: individual.gender, photo_url: individual.photo_url },
            });

            if (props.viewType === 'descendants') {
                const spouseFamilies = Array.from(props.families.values()).filter(f => f.spouse1_id === personId || f.spouse2_id === personId);
                spouseFamilies.forEach(family => {
                    const familyNodeId = `family-${family.id}`;
                    if (processedIds.has(familyNodeId)) return;
                    processedIds.add(familyNodeId);

                    nodes.push({ id: familyNodeId, position: { x: 0, y: 0 }, style: { visibility: 'hidden' } });
                    edges.push({ id: `e-${personId}-${familyNodeId}`, source: personId, target: familyNodeId, type: 'step' });
                    
                    const spouseId = family.spouse1_id === personId ? family.spouse2_id : family.spouse1_id;
                    if (spouseId) {
                        edges.push({ id: `e-${spouseId}-${familyNodeId}`, source: spouseId, target: familyNodeId, type: 'step' });
                        buildGraph(spouseId);
                    }
                    
                    (family.children_ids || []).forEach(childId => {
                        edges.push({ id: `e-${familyNodeId}-${childId}`, source: familyNodeId, target: childId, type: 'step' });
                        buildGraph(childId);
                    });
                });
            } else { // Ancestors
                const parentFamily = individual.child_in_family_id ? props.families.get(individual.child_in_family_id) : undefined;
                if (parentFamily) {
                    const familyNodeId = `family-${parentFamily.id}`;
                    if (!processedIds.has(familyNodeId)) {
                        processedIds.add(familyNodeId);
                        nodes.push({ id: familyNodeId, position: { x: 0, y: 0 }, style: { visibility: 'hidden' } });
                    }
                    edges.push({ id: `e-${familyNodeId}-${personId}`, source: familyNodeId, target: personId, type: 'step' });

                    if (parentFamily.spouse1_id) {
                        edges.push({ id: `e-${parentFamily.spouse1_id}-${familyNodeId}`, source: parentFamily.spouse1_id, target: familyNodeId, type: 'step' });
                        buildGraph(parentFamily.spouse1_id);
                    }
                    if (parentFamily.spouse2_id) {
                        edges.push({ id: `e-${parentFamily.spouse2_id}-${familyNodeId}`, source: parentFamily.spouse2_id, target: familyNodeId, type: 'step' });
                        buildGraph(parentFamily.spouse2_id);
                    }
                }
            }
        };

        buildGraph(props.rootIndividualId);
        return { initialNodes: nodes, initialEdges: edges };
    }, [props.rootIndividualId, props.individuals, props.families, props.viewType]);

    return (
        <ElkjsLayout
            nodes={initialNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            viewType={props.viewType}
        />
    );
};

export const FamilyFlowVisualization: React.FC<FamilyFlowVisualizationProps> = (props) => (
    <ReactFlowProvider>
        <FlowGenerator {...props} />
    </ReactFlowProvider>
);