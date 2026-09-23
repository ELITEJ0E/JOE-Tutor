/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useInsertStore, useUI } from '../../lib/state';
import FunctionPlotter from '../demo/keynote-companion/FunctionPlotter';
import { Sparkles, Eye, Download, Image as ImageIcon, LineChart, MapPin } from 'lucide-react';

export default function VisualsGallery() {
  const { documentContent } = useUI();
  const { inserts } = useInsertStore();

  // Extract all graph tags from document content
  const graphs = useMemo(() => {
    const list: Array<{ id: string; raw: string; title: string; functions: string[]; labels: string[]; colors: string[]; xDomain: [number, number]; yDomain: [number, number]; xLabel: string; yLabel: string; width: string }> = [];
    const tagRegex = /\[graph\s([^\]]+)\]/g;
    let match;

    while ((match = tagRegex.exec(documentContent)) !== null) {
      const tagContent = match[1];
      const getAttr = (attr: string) => {
        const regex = new RegExp(`${attr}\\s*=\\s*(["'])((?:\\\\\\1|.)*?)\\1`);
        const m = tagContent.match(regex);
        return m ? m[2] : null;
      };

      const parseArray = (str: string | null): string[] => {
        if (!str) return [];
        try {
          const trimmed = str.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.substring(1, trimmed.length - 1);
            return inner.split(/,(?=\s*')/).map(p => p.trim().replace(/^'|'$/g, ''));
          }
        } catch {
          // ignore
        }
        return [];
      };

      const evaluateDomain = (str: string | null): [number, number] => {
        if (!str) return [-10, 10];
        try {
          const trimmed = str.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.substring(1, trimmed.length - 1);
            const parts = inner.split(',');
            if (parts.length === 2) {
              const parsePart = (p: string) => {
                const js = p.trim().toLowerCase().replace(/pi/g, 'Math.PI').replace(/e/g, 'Math.E');
                try {
                  return new Function(`return (${js});`)();
                } catch {
                  return parseFloat(p);
                }
              };
              return [parsePart(parts[0]), parsePart(parts[1])];
            }
          }
        } catch {
          // ignore
        }
        return [-10, 10];
      };

      list.push({
        id: getAttr('id') || `graph_${list.length}`,
        raw: match[0],
        title: getAttr('title') || 'Plotted Curves',
        functions: parseArray(getAttr('functions')),
        labels: parseArray(getAttr('labels')),
        colors: parseArray(getAttr('colors')),
        xDomain: evaluateDomain(getAttr('xDomain')),
        yDomain: evaluateDomain(getAttr('yDomain')),
        xLabel: getAttr('xLabel') || 'x',
        yLabel: getAttr('yLabel') || 'y',
        width: getAttr('width') || '100%',
      });
    }

    return list;
  }, [documentContent]);

  // Extract all illustrations from inserts store and document
  const illustrations = useMemo(() => {
    return inserts.filter(ins => ins.type === 'image');
  }, [inserts]);

  const hasAnyVisuals = graphs.length > 0 || illustrations.length > 0;

  return (
    <div className="visuals-gallery-container">
      {/* Header */}
      <div className="visuals-gallery-header">
        <div className="visuals-title-wrap">
          <div className="visuals-icon-badge">
            <LineChart size={20} className="text-cherry-500" />
          </div>
          <div>
            <h2 className="visuals-title">Visuals & Mathematical Plots Lab</h2>
            <p className="visuals-subtitle">
              Interactive mathematical curves and AI-generated concept illustrations from your session.
            </p>
          </div>
        </div>
      </div>

      {!hasAnyVisuals ? (
        <div className="visuals-empty-state">
          <div className="empty-icon-circle">
            <Sparkles size={32} className="text-cherry-500" />
          </div>
          <h3 className="empty-title">No visuals generated yet</h3>
          <p className="empty-desc">
            Ask JOE to:
          </p>
          <div className="empty-suggestions-grid">
            <div className="empty-suggestion-pill">
              <strong>"Plot a sine and cosine wave"</strong>
              <span>Visualizes mathematical functions with interactive graphs</span>
            </div>
            <div className="empty-suggestion-pill">
              <strong>"Draw an organic chemistry reaction mechanism diagram"</strong>
              <span>Generates technical diagrams and illustrations</span>
            </div>
            <div className="empty-suggestion-pill">
              <strong>"Graph the derivative of x^3 - 3x"</strong>
              <span>Plots multiple curves side by side</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="visuals-content-grid">
          {/* Section: Function Plots */}
          {graphs.length > 0 && (
            <div className="visuals-section">
              <div className="section-title-wrap">
                <LineChart size={18} className="text-cherry-500" />
                <h3 className="section-title">Plotted Mathematical Curves ({graphs.length})</h3>
              </div>
              <div className="graphs-grid">
                {graphs.map(g => (
                  <div key={g.id} className="graph-card-wrapper">
                    <div className="graph-card-header">
                      <span className="graph-card-title">{g.title}</span>
                      <div className="graph-tags-list">
                        {g.functions.map((fn, idx) => (
                          <span
                            key={idx}
                            className="function-badge"
                            style={{
                              borderColor: g.colors[idx] || '#D90429',
                              color: g.colors[idx] || '#D90429',
                            }}
                          >
                            f{idx + 1}(x) = {fn}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="graph-embed-surface">
                      <FunctionPlotter
                        id={g.id}
                        data={{
                          title: g.title,
                          functions: g.functions,
                          labels: g.labels,
                          xDomain: g.xDomain,
                          yDomain: g.yDomain,
                          xLabel: g.xLabel,
                          yLabel: g.yLabel,
                          colors: g.colors,
                        }}
                        initialWidth="100%"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: AI Illustrations */}
          {illustrations.length > 0 && (
            <div className="visuals-section">
              <div className="section-title-wrap">
                <ImageIcon size={18} className="text-cherry-500" />
                <h3 className="section-title">Diagrams & Concept Illustrations ({illustrations.length})</h3>
              </div>
              <div className="illustrations-grid">
                {illustrations.map(ins => (
                  <div key={ins.id} className="illustration-card">
                    <div className="illustration-image-wrap">
                      {ins.status === 'done' && ins.data ? (
                        <img
                          src={`data:image/png;base64,${ins.data}`}
                          alt={ins.prompt}
                          className="gallery-image"
                        />
                      ) : ins.status === 'loading' ? (
                        <div className="illustration-loading-gallery">
                          <div className="spinner"></div>
                          <span>Generating diagram with Imagen...</span>
                        </div>
                      ) : (
                        <div className="illustration-error-gallery">
                          <span>Error generating diagram: {ins.error}</span>
                        </div>
                      )}
                    </div>
                    <div className="illustration-card-info">
                      <p className="illustration-prompt-text">{ins.prompt}</p>
                      {ins.status === 'done' && ins.data && (
                        <a
                          href={`data:image/png;base64,${ins.data}`}
                          download={`joe-tutor-diagram-${ins.id}.png`}
                          className="download-image-btn"
                          title="Download Image"
                        >
                          <Download size={14} />
                          <span>Save High-Res</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
