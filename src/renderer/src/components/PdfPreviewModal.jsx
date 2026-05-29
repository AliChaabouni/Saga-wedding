import React, { useEffect, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';

export default function PdfPreviewModal({ isOpen, onClose, doc, filename }) {
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    if (isOpen && doc) {
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e) {
        console.error("Error generating PDF preview", e);
      }
    }
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, doc]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (doc && filename) {
      doc.save(filename);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content card" style={{ maxWidth: '1000px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Printer size={20} /> Prévisualisation du Document
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Télécharger PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, backgroundColor: '#525659', position: 'relative' }}>
          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Preview"
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white' }}>
              Génération de l'aperçu en cours...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
