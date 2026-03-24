import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchContract, signContract } from '../services/api';
import type { CateringContract } from '../types';
import { FileText, Check, PenTool } from 'lucide-react';

const ContractSign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<CateringContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!id) return;
    fetchContract(id)
      .then(c => {
        setContract(c);
        if (c.signed) setSigned(true);
      })
      .catch(() => setError('Contract not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Signature pad handlers
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!id) return;
    setSigning(true);
    try {
      const sigData = canvasRef.current?.toDataURL('image/png') || 'acknowledged';
      await signContract(id, sigData);
      setSigned(true);
    } catch {
      alert('Failed to sign. Please try again.');
    }
    setSigning(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading contract...</div>;
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>;
  if (!contract) return null;

  if (signed) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Contract Signed</h2>
        <p className="text-gray-400">
          Signed by {contract.customerName}
          {contract.signedAt && <> on {new Date(contract.signedAt).toLocaleDateString()}</>}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText size={24} className="text-bbq-gold" />
        <h1 className="text-2xl font-bold text-white">Service Agreement</h1>
      </div>
      <p className="text-sm text-gray-400">For: {contract.customerName} ({contract.customerEmail})</p>

      {/* Contract Terms */}
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 max-h-96 overflow-y-auto">
        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-gray-300 leading-relaxed">
          {contract.termsText}
        </div>
      </div>

      {/* Agreement Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-gray-700 bg-gray-800 text-bbq-red focus:ring-bbq-red" />
        <span className="text-sm text-gray-300">
          I have read and agree to the terms and conditions outlined above.
        </span>
      </label>

      {/* Signature Pad */}
      {agreed && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400 flex items-center gap-2"><PenTool size={14} /> Sign below</p>
            <button onClick={clearSignature} className="text-xs text-gray-500 hover:text-white">Clear</button>
          </div>
          <canvas
            ref={canvasRef}
            width={600} height={150}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            className="w-full h-32 bg-gray-800 rounded-xl border border-gray-700 cursor-crosshair touch-none"
          />
          <button
            onClick={handleSign} disabled={signing}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {signing ? 'Signing...' : 'Sign & Agree'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractSign;
