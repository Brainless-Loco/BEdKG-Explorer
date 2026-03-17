/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import { BarChart as BarChartIcon, LineChart as LineChartIcon, Share2, PieChart as PieChartIcon } from 'lucide-react';
import * as d3 from 'd3';

interface VisualizationProps {
  data: any[];
  columns: string[];
}

export default function Visualization({ data, columns }: VisualizationProps) {
  const [view, setView] = React.useState<'bar' | 'line' | 'network' | 'pie'>('bar');
  const networkRef = useRef<SVGSVGElement>(null);

  // Auto-detect best view
  useEffect(() => {
    if (data.length > 0) {
      const numericCols = columns.filter(col => {
        const val = data[0][col];
        return !isNaN(parseFloat(val)) && isFinite(val);
      });
      
      const hasRelationships = columns.some(col => col.toLowerCase().includes('parent') || col.toLowerCase().includes('child') || col.toLowerCase().includes('related'));
      
      if (hasRelationships && data.length < 50) {
        setView('network');
      } else if (numericCols.length > 0) {
        setView('bar');
      }
    }
  }, [data, columns]);

  const chartData = useMemo(() => {
    return data.map(row => {
      const newRow = { ...row };
      columns.forEach(col => {
        const val = parseFloat(row[col]);
        if (!isNaN(val)) {
          newRow[col] = val;
        }
      });
      return newRow;
    });
  }, [data, columns]);

  const numericColumns = useMemo(() => {
    if (data.length === 0) return [];
    return columns.filter(col => {
      const val = data[0][col];
      return !isNaN(parseFloat(val)) && isFinite(val);
    });
  }, [data, columns]);

  const labelColumn = useMemo(() => {
    return columns.find(col => !numericColumns.includes(col)) || columns[0];
  }, [columns, numericColumns]);

  // D3 Network Graph
  useEffect(() => {
    if (view === 'network' && networkRef.current && data.length > 0) {
      const svg = d3.select(networkRef.current);
      svg.selectAll("*").remove();

      const width = 800;
      const height = 400;

      const nodes: any[] = [];
      const links: any[] = [];
      const nodeMap = new Map();

      data.forEach((row, i) => {
        columns.forEach(col => {
          const val = row[col];
          if (val && typeof val === 'string') {
            if (!nodeMap.has(val)) {
              const node = { id: val, group: col };
              nodeMap.set(val, node);
              nodes.push(node);
            }
          }
        });

        // Create links between columns in the same row
        for (let j = 0; j < columns.length - 1; j++) {
          for (let k = j + 1; k < columns.length; k++) {
            const source = row[columns[j]];
            const target = row[columns[k]];
            if (source && target && source !== target) {
              links.push({ source, target });
            }
          }
        }
      });

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line");

      const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", (d: any) => d3.schemeCategory10[nodes.indexOf(d) % 10])
        .call(d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }));

      node.append("title").text(d => d.id);

      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
      });
    }
  }, [view, data, columns]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Visual Insights</Typography>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="bar"><BarChartIcon size={16} /></ToggleButton>
          <ToggleButton value="line"><LineChartIcon size={16} /></ToggleButton>
          <ToggleButton value="pie"><PieChartIcon size={16} /></ToggleButton>
          <ToggleButton value="network"><Share2 size={16} /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, height: 400, bgcolor: '#fcfcfc' }}>
        {view === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={labelColumn} />
              <YAxis />
              <Tooltip />
              <Legend />
              {numericColumns.map((col, i) => (
                <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {view === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={labelColumn} />
              <YAxis />
              <Tooltip />
              <Legend />
              {numericColumns.map((col, i) => (
                <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {view === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey={numericColumns[0]}
                nameKey={labelColumn}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {view === 'network' && (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <svg ref={networkRef} width="100%" height="100%" viewBox="0 0 800 400" />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
