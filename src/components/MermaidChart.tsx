// Silsilah_1/src/components/MermaidChart.tsx
import React, { useRef, useEffect, useState } from 'react';
import mermaid from 'mermaid'; // Impor library mermaid

interface MermaidChartProps {
  chartDefinition: string; // String sintaks Mermaid.js
  chartId: string;        // ID unik untuk chart SVG
  className?: string;     // Kelas CSS opsional untuk div pembungkus
}

export const MermaidChart: React.FC<MermaidChartProps> = ({ chartDefinition, chartId, className }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chartRef.current && chartDefinition) {
      // Inisialisasi Mermaid (opsional, bisa juga dilakukan sekali di App.tsx)
      mermaid.initialize({
        startOnLoad: false, // Kita akan render secara manual
        theme: 'base',      // Gunakan tema 'base' atau 'forest' atau 'neutral' yang cocok dengan dark mode
        // Atau buat custom tema di CSS Anda
        // themeVariables: {
        //   '--mermaid-font-family': 'Inter, sans-serif',
        //   '--mermaid-node-bg': '#0f172a', // base-100
        //   '--mermaid-node-border': '#3b82f6', // accent
        //   '--mermaid-cluster-fill': '#1f2937', // neutral
        //   '--mermaid-text-color': '#e2e8f0', // gray-200
        //   '--mermaid-main-color': '#4b5563', // base-300
        //   '--mermaid-line-color': '#6b7280', // gray-500
        // },
        securityLevel: 'loose', // Untuk beberapa fitur yang mungkin perlu izin lebih
      });

      // Render chart secara asynchronous
      mermaid.render(chartId, chartDefinition)
        .then(({ svg }) => {
          setSvgContent(svg);
          setError(null);
        })
        .catch(err => {
          console.error("Mermaid rendering error:", err);
          setError("Gagal merender diagram silsilah. Pastikan data tidak kosong atau sintaks valid.");
          setSvgContent('');
        });
    }
  }, [chartDefinition, chartId]);

  if (error) {
    return <div className="text-error text-center p-4">{error}</div>;
  }

  return (
    <div className={`overflow-auto w-full h-full flex justify-center items-center ${className || ''}`}>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
};