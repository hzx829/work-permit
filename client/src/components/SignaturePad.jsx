import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ value, onChange, onCommit, disabled = false, className = "" }) => {
    const canvasRef = useRef(null);
    const commitTimerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Reset transform then scale (avoid cumulative scaling)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';

        return { ctx, rect };
    };

    useEffect(() => {
        const setup = setupCanvas();
        if (!setup) return;

        const { ctx, rect } = setup;
        ctx.clearRect(0, 0, rect.width, rect.height);

        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, rect.width, rect.height);
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = value;
        }
    }, [value]);

    const scheduleCommit = (signature) => {
        if (!onCommit) return;
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = setTimeout(() => onCommit(signature), 700);
    };

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
            // 使用较低质量的 PNG 以减少数据大小
            // 签名一般是黑白线条，PNG 压缩效果好
            const signature = canvas.toDataURL('image/png', 0.8);
            onChange(signature);
            scheduleCommit(signature);
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
        
        if (onChange) onChange('');
        scheduleCommit('');
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
        </div>
    );
};

export default SignaturePad;
