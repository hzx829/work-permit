import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ value, onChange, disabled = false, className = "" }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';

        // Load existing signature if available
        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
                setHasSignature(true);
            };
            img.src = value;
        }
    }, []); // Run once on mount to setup canvas size

    // We might need to resize canvas on window resize, but keeping it simple for now.

    const startDrawing = (e) => {
        if (disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        if (!isDrawing || disabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        e.preventDefault(); // Prevent scrolling on touch devices

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (disabled) return;
        if (isDrawing) {
            setIsDrawing(false);
            saveSignature();
        }
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (canvas && onChange) {
            onChange(canvas.toDataURL());
        }
    };

    const clearSignature = (e) => {
        e.stopPropagation(); // Prevent triggering other clicks
        if (disabled) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height); // Clear scaled rect
        
        setHasSignature(false);
        if (onChange) onChange('');
    };

    return (
        <div className={`relative border border-gray-200 rounded bg-white ${disabled ? 'bg-gray-50' : ''} ${className}`}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            {!disabled && (
                <div className="absolute top-1 right-1 flex gap-2">
                     <button 
                        type="button"
                        onClick={clearSignature}
                        className="px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                    >
                        清除
                    </button>
                </div>
            )}
            {!hasSignature && !isDrawing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300">
                    {disabled ? (value ? '' : '未签名') : '请在此区域签名'}
                </div>
            )}
        </div>
    );
};

export default SignaturePad;
