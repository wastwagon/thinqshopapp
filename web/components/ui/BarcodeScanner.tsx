'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Type, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (value: string) => void;
}

function submitValue(value: string, onScan: (v: string) => void, onClose: () => void) {
    const trimmed = value.trim();
    if (!trimmed) return;
    onScan(trimmed);
    onClose();
    toast.success('Tracking number added');
}

export default function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [decodingImage, setDecodingImage] = useState(false);
    const controlsRef = useRef<{ stop: () => void } | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setManualInput('');
        setDecodingImage(false);

        const startScan = async () => {
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
                const msg = e?.message || '';
                if (/permission|denied|not allowed|NotAllowedError/i.test(msg)) {
                    setError('Camera not available in this app. Use one of the options below.');
                } else {
                    setError('Camera unavailable. Use one of the options below.');
                }
            } finally {
                setScanning(false);
            }
        };

        startScan();

        return () => {
            controlsRef.current?.stop?.();
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

    const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        setDecodingImage(true);
        const url = URL.createObjectURL(file);
        try {
            const text = await decodeBarcodeFromImageUrl(url);
            if (text?.trim()) {
                onScan(text.trim());
                onClose();
                toast.success('Tracking number read from image');
            } else {
                toast.error('No barcode found in image');
            }
        } catch (err) {
            console.error('Decode image error', err);
            toast.error('Could not read barcode from image. Try entering the number manually.');
        } finally {
            URL.revokeObjectURL(url);
            setDecodingImage(false);
        }
    };

    if (!open) return null;

    const showFallback = !!error;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Scan or enter tracking barcode"
        >
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                    <h3 className="text-sm font-bold text-gray-900">Scan or enter tracking number</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {!showFallback ? (
                    <>
                        <div className="aspect-square bg-black relative shrink-0">
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
                        <div className="p-4 bg-gray-50 shrink-0">
                            <p className="text-xs text-gray-500">Point your camera at the barcode on your package</p>
                        </div>
                    </>
                ) : (
                    <div className="p-4 bg-gray-50 space-y-4 overflow-y-auto">
                        <p className="text-sm text-amber-700">{error}</p>

                        <div>
                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                                <Type className="h-3.5 w-3.5" /> Enter tracking number
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && submitValue(manualInput, onScan, onClose)}
                                    placeholder="e.g. SHP-123..."
                                    className="flex-1 min-h-[44px] px-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => submitValue(manualInput, onScan, onClose)}
                                    disabled={!manualInput.trim()}
                                    className="min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    Use
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                                <ImageIcon className="h-3.5 w-3.5" /> Or use a photo of the barcode
                            </label>
                            <label className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleImageFile}
                                    disabled={decodingImage}
                                />
                                {decodingImage ? 'Reading...' : 'Choose image'}
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

async function decodeBarcodeFromImageUrl(imageUrl: string): Promise<string | null> {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const codeReader = new BrowserMultiFormatReader();
    const reader = codeReader as any;
    if (typeof reader.decodeFromImageUrl === 'function') {
        const result = await reader.decodeFromImageUrl(imageUrl);
        return result?.getText?.() ?? null;
    }
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => {
            (reader.decodeFromImageElement?.(img) ?? Promise.reject(new Error('No image decode')))
                .then((r: any) => resolve(r?.getText?.() ?? null))
                .catch(reject);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = imageUrl;
    });
}
