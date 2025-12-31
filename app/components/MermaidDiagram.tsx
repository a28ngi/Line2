'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
});

interface MermaidDiagramProps {
    chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [svgInfo, setSvgInfo] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chart) return;

        const renderChart = async () => {
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvgInfo(svg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Failed to render diagram');
                // Mermaid might leave an error syntax in the DOM, so we clean up if possible
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return <div className="text-red-500 text-xs p-2 bg-red-50 rounded">{error}</div>;
    }

    return (
        <div
            ref={ref}
            className="w-full overflow-x-auto flex justify-center p-4 bg-white rounded-lg"
            dangerouslySetInnerHTML={{ __html: svgInfo }}
        />
    );
}
