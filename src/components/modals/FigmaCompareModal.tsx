import React, { useState } from 'react';
import { X, ExternalLink, Eye, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const FigmaCompareModal: React.FC = () => {
  const { figmaOverlayAsset, setFigmaOverlayAsset } = useERP();
  const [opacity, setOpacity] = useState<number>(100);
  const [zoom, setZoom] = useState<number>(100);

  if (!figmaOverlayAsset) return null;

  const fileName = figmaOverlayAsset.split('/').pop() || 'Design Spec';

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '95vw', 
          width: '1350px', 
          height: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: '#0A0B0D',
          border: '1px solid #22262E'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #22262E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#16181C'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #0052FF 0%, #7000FF 100%)',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.04em'
            }}>
              FIGMA SPEC INSPECTOR
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '14px' }}>
              {fileName}
            </span>
          </div>

          {/* Controls: Opacity, Zoom, Open Direct, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8A8F98', fontSize: '12px' }}>
              <button 
                onClick={() => setZoom(prev => Math.max(50, prev - 15))}
                style={{ background: '#22262E', border: 'none', color: '#FFF', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span>{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(200, prev + 15))}
                style={{ background: '#22262E', border: 'none', color: '#FFF', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button 
                onClick={() => setZoom(100)}
                style={{ background: '#22262E', border: 'none', color: '#FFF', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Direct Link */}
            <a 
              href={figmaOverlayAsset} 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#3880FF',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontWeight: '500'
              }}
            >
              <ExternalLink size={14} />
              <span>Open Raw SVG</span>
            </a>

            {/* Close Button */}
            <button
              onClick={() => setFigmaOverlayAsset(null)}
              style={{
                background: '#22262E',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Canvas Body */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#050608',
          position: 'relative'
        }}>
          <div style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            maxWidth: '100%'
          }}>
            <img 
              src={figmaOverlayAsset} 
              alt={fileName}
              style={{ 
                display: 'block', 
                maxWidth: '100%', 
                height: 'auto',
                opacity: opacity / 100 
              }} 
            />
          </div>
        </div>

        {/* Modal Footer Specs */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #22262E',
          backgroundColor: '#16181C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#8A8F98'
        }}>
          <div>
            Figma Artboard: <strong style={{ color: '#FFF' }}>1440 × 900 px</strong> | Primary Tone: <strong style={{ color: '#0052FF' }}>#0052FF</strong> | Neutral Canvas: <strong style={{ color: '#FFF' }}>#0A0B0D / #F8F9FA</strong>
          </div>
          <div>
            Tip: Press <kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px', color: '#FFF' }}>ESC</kbd> or click the close icon to return to the interactive app.
          </div>
        </div>
      </div>
    </div>
  );
};
