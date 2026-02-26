'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (value: string) => void;
}

export default function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const controlsRef = useRef<{ stop: () => void } | null>(null);

    useEffect(() => {
        if (!open) return;

        const startScan = async () => {
            setError(null);
            setScanning(true);
            try {
                const { BrowserMultiFormatReader } = await import('@zxing/browser');
                const codeReader = new BrowserMultiFormatReader();
                const video = videoRef.current;
                if (!video) {
                    setError('Video element not ready');
                    setScanning(false);
                    return;
                }

                controlsRef.current = await codeReader.decodeFromVideoDevice(
                    undefined,
                    video,
                    (result, err) => {
                        if (result) {
                            const text = result.getText();
                            if (text?.trim()) {
                                controlsRef.current?.stop();
                                onScan(text.trim());
                                onClose();
                                toast.success('Tracking number scanned');
                            }
                        }
                    }
                );
            } catch (e: any) {
                console.error('Barcode scan error', e);
                setError(e?.message || 'Camera access denied. Enter tracking ID manually.');
            } finally {
                setScanning(false);
            }
        };

        startScan();

        return () => {
            controlsRef.current?.stop();
            controlsRef.current = null;
        };
    }, [open, onScan, onClose]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Scan barcode"
        >
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">Scan tracking barcode</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="aspect-square bg-black relative">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                    />
                    {scanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-32 border-2 border-white/50 rounded-lg" />
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50">
                    {error ? (
                        <p className="text-sm text-amber-600">{error}</p>
                    ) : (
                        <p className="text-xs text-gray-500">Point your camera at the barcode on your package</p>
                    )}
                </div>
            </div>
        </div>
    );
}
