/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreeNode, Player } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TreeVisualizationProps {
  data: TreeNode | null;
  isThinking: boolean;
  bestMove: { row: number; col: number } | null;
}

const MiniBoard = ({ grid }: { grid: Player[][] }) => {
  return (
    <div className="grid gap-1 p-1 bg-white rounded border border-black/10 w-24 h-24" style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}>
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            className={cn(
              "w-full h-full rounded-sm border border-black/5",
              cell === 'BLUE' ? "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.3)]" : 
              cell === 'GOLD' ? "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]" : 
              "bg-black/[0.02]"
            )}
          />
        ))
      )}
    </div>
  );
};

export const TreeVisualization: React.FC<TreeVisualizationProps> = ({ data, isThinking, bestMove }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    if (!data) {
      svg.selectAll('*').remove();
      return;
    }

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const treeLayout = d3.tree<TreeNode>().nodeSize([100, 150]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    // Color Coded Zones (Background)
    const depths = Array.from(new Set(root.descendants().map(d => d.depth)));
    const zoneHeight = 150;
    
    g.selectAll('.zone')
      .data(depths)
      .enter()
      .insert('rect', ':first-child')
      .attr('class', 'zone')
      .attr('x', -10000) // Even larger to cover extreme pans
      .attr('y', d => d * zoneHeight - zoneHeight / 2)
      .attr('width', 20000)
      .attr('height', zoneHeight)
      .attr('fill', d => d % 2 === 0 ? '#ffffff' : '#e5e7eb') // White for MAX, Gray-200 for MIN
      .attr('opacity', 0.6);

    // Level Labels (MAX/MIN)
    const levels = Array.from(new Set(root.descendants().map(d => d.depth)));
    const levelLabels = g.selectAll('.level-label')
      .data(levels)
      .enter()
      .append('text')
      .attr('x', -350)
      .attr('y', d => d * 150)
      .attr('dy', '0.35em')
      .attr('class', 'font-mono font-bold text-[14px]')
      .attr('fill', d => d % 2 === 0 ? '#000000' : '#1f2937')
      .text(d => d % 2 === 0 ? "MAX" : "MIN");

      // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y)
      )
      .attr('fill', 'none')
      .attr('stroke', '#000000')
      .attr('stroke-width', d => (d.target.data.isActive || d.source.data.isActive) ? 2 : 1.5)
      .attr('stroke-dasharray', d => d.target.data.isPruned ? '5,5' : 'none')
      .attr('opacity', d => d.target.data.isPruned ? 0.4 : 1);

    // Nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .on('mouseover', (event, d) => {
        setHoveredNode(d.data);
        setTooltipPos({ x: event.clientX, y: event.clientY });
      })
      .on('mousemove', (event) => {
        setTooltipPos({ x: event.clientX, y: event.clientY });
      })
      .on('mouseout', () => {
        setHoveredNode(null);
      });

    nodes.each(function(d) {
      const nodeG = d3.select(this);
      const isLeaf = !d.children || d.children.length === 0;
      const isBestMoveNode = bestMove && d.data.move && 
                             d.data.move.row === bestMove.row && 
                             d.data.move.col === bestMove.col && 
                             d.depth === 1;

      // Best move highlight (Green Ring)
      if (isBestMoveNode) {
        nodeG.append('circle')
          .attr('r', 35)
          .attr('fill', 'none')
          .attr('stroke', '#22c55e')
          .attr('stroke-width', 6)
          .attr('opacity', 0.8);
      }

      // Active node glow
      if (d.data.isActive) {
        nodeG.append('circle')
          .attr('r', 35)
          .attr('fill', 'none')
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 4)
          .attr('opacity', 0.6)
          .attr('class', 'animate-pulse');
      }

      if (isLeaf && !d.data.isPruned) {
        // Square leaf nodes
        nodeG.append('rect')
          .attr('x', -25)
          .attr('y', -25)
          .attr('width', 50)
          .attr('height', 50)
          .attr('rx', 8)
          .style('fill', isBestMoveNode ? '#22c55e' : '#fbbf24')
          .attr('stroke', isBestMoveNode ? '#15803d' : '#b45309')
          .attr('stroke-width', 2);

        nodeG.append('text')
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('class', 'font-mono font-bold text-[14px]')
          .text(d.data.score !== undefined ? d.data.score : '?');
      } else {
        // Circular internal nodes
        nodeG.append('circle')
          .attr('r', 25)
          .attr('fill', isBestMoveNode ? '#22c55e' : 'white')
          .attr('stroke', isBestMoveNode ? '#15803d' : (d.data.isPruned ? '#ddd' : '#000000'))
          .attr('stroke-width', isBestMoveNode ? 4 : 2);

        nodeG.append('text')
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', isBestMoveNode ? 'white' : (d.data.isPruned ? '#ddd' : '#fbbf24'))
          .attr('class', 'font-mono font-bold text-[12px]')
          .text(d.data.isPruned ? 'X' : (d.data.move ? `${d.data.move.row},${d.data.move.col}` : 'ROOT'));
      }
    });

    // Auto-zoom
    if (bestMove) {
      const bestNode = root.descendants().find(d => 
        d.depth === 1 && 
        d.data.move && 
        d.data.move.row === bestMove.row && 
        d.data.move.col === bestMove.col
      );
      
      if (bestNode) {
        const transform = d3.zoomIdentity
          .translate(width / 2 - bestNode.x * 1.5, height / 2 - bestNode.y * 1.5)
          .scale(1.5);
        
        svg.transition().duration(800).ease(d3.easeCubicInOut).call(zoom.transform, transform);
      }
    } else if (isThinking) {
      const activeNodes = root.descendants().filter(d => d.data.isActive);
      const targetNode = activeNodes.length > 0 ? activeNodes[activeNodes.length - 1] : null;
      
      if (targetNode) {
        const transform = d3.zoomIdentity
          .translate(width / 2 - targetNode.x * 1.2, height / 2 - targetNode.y * 1.2)
          .scale(1.2);
        
        svg.transition().duration(300).call(zoom.transform, transform);
      }
    } else {
      const initialTransform = d3.zoomIdentity.translate(width / 2 + 100, 80).scale(0.6);
      svg.call(zoom.transform, initialTransform);
    }

  }, [data, isThinking, bestMove]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#ffffff] overflow-hidden border-l border-black/20">
      {/* Heading */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-b border-black/10 z-10 flex justify-between items-center">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/80">Minimax Tree</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-black bg-white" />
            <span className="text-[9px] font-mono text-black/60 uppercase">Internal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-[#fbbf24] border border-amber-600" />
            <span className="text-[9px] font-mono text-black/60 uppercase">Leaf (Value)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-[9px] font-mono text-black/60 uppercase">Optimal Move</span>
          </div>
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {isThinking && (
        <div className="absolute top-16 left-4 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-black/10 rounded-full shadow-lg">
            <div className={cn("w-2 h-2 rounded-full", bestMove ? "bg-green-500" : "bg-amber-500 animate-pulse")} />
            <span className={cn("text-[10px] font-mono uppercase tracking-widest font-bold leading-none", bestMove ? "text-green-600" : "text-amber-600")}>
              {bestMove ? "Optimal Move Found" : "Running Algorithm..."}
            </span>
          </div>
          {!bestMove && (
            <div className="px-3 py-1 bg-black/5 backdrop-blur-sm border border-black/5 rounded-full self-start flex items-center justify-center">
              <span className="text-[9px] font-mono text-black/40 uppercase tracking-tighter leading-none">
                Analyzing Tree...
              </span>
            </div>
          )}
        </div>
      )}

      {hoveredNode && (
        <div 
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="bg-white border border-black/20 p-3 rounded-lg shadow-2xl">
            <div className="flex justify-between items-center mb-2 gap-4">
              <span className="text-[10px] font-mono text-black/40 uppercase tracking-tighter">
                Depth: {hoveredNode.depth}
              </span>
              <span className={cn(
                "text-[10px] font-mono font-bold",
                hoveredNode.score !== undefined ? (hoveredNode.score > 0 ? "text-amber-500" : hoveredNode.score < 0 ? "text-blue-600" : "text-black/60") : "text-black/20"
              )}>
                Score: {hoveredNode.score ?? 'N/A'}
              </span>
            </div>
            <MiniBoard grid={hoveredNode.grid} />
            {hoveredNode.isPruned && (
              <div className="mt-2 text-[9px] font-mono text-amber-500 uppercase text-center border-t border-black/10 pt-1">
                Pruned
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-black/30 uppercase tracking-[0.3em] select-none">
        Minimax Tree
      </div>
    </div>
  );
};
