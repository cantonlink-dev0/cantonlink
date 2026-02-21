// src/components/RibbonBackground.tsx
// DNA double helix with lateral curl/twist animation
"use client";

import { useEffect, useRef } from "react";

function drawDNAHelix(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => { };

    let animationId: number;
    let time = 0;

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const helixRadius = Math.min(canvas.width, canvas.height) * 0.15;
    const ribbonWidth = 90;
    const segments = Math.ceil(canvas.width / 3);

    function draw() {
        ctx!.clearRect(0, 0, canvas.width, canvas.height);

        const centerY = canvas.height / 2;

        // Draw two DNA strands with 180° phase offset
        drawStrand(centerY, time, 0, [147, 51, 234], [168, 85, 247]); // Purple
        drawStrand(centerY, time, Math.PI, [250, 204, 21], [234, 179, 8]); // Gold

        time += 0.01;
        animationId = requestAnimationFrame(draw);
    }

    function drawStrand(
        centerY: number,
        phase: number,
        offset: number,
        color1: number[],
        color2: number[]
    ) {
        const points: Array<{ x: number; y: number; z: number }> = [];

        // Generate helix points
        for (let i = 0; i < segments; i++) {
            const x = (i / segments) * canvas.width;
            const angle = (x / canvas.width) * Math.PI * 4 + phase + offset;

            const y = centerY + Math.sin(angle) * helixRadius;
            const z = Math.cos(angle); // -1 (back) to 1 (front)

            points.push({ x, y, z });
        }

        // Draw ribbon segments
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            // Depth scaling
            const depth1 = 0.5 + p1.z * 0.5;
            const depth2 = 0.5 + p2.z * 0.5;

            const width1 = ribbonWidth * depth1;
            const width2 = ribbonWidth * depth2;

            // Direction vector
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const perpX = -dy / dist;
            const perpY = dx / dist;

            // Ribbon quad
            const x1a = p1.x + perpX * width1 / 2;
            const y1a = p1.y + perpY * width1 / 2;
            const x1b = p1.x - perpX * width1 / 2;
            const y1b = p1.y - perpY * width1 / 2;
            const x2a = p2.x + perpX * width2 / 2;
            const y2a = p2.y + perpY * width2 / 2;
            const x2b = p2.x - perpX * width2 / 2;
            const y2b = p2.y - perpY * width2 / 2;

            ctx!.beginPath();
            ctx!.moveTo(x1a, y1a);
            ctx!.lineTo(x2a, y2a);
            ctx!.lineTo(x2b, y2b);
            ctx!.lineTo(x1b, y1b);
            ctx!.closePath();

            // Color gradient along strand
            const colorPos = i / points.length;
            const mixedColor = [
                Math.round(color1[0] * (1 - colorPos) + color2[0] * colorPos),
                Math.round(color1[1] * (1 - colorPos) + color2[1] * colorPos),
                Math.round(color1[2] * (1 - colorPos) + color2[2] * colorPos),
            ];

            // Depth lighting
            const avgDepth = (depth1 + depth2) / 2;
            const brightness = 0.5 + avgDepth * 0.5;
            const alpha = 0.10 + avgDepth * 0.10;

            const litColor = mixedColor.map(c => Math.round(c * brightness));

            // Gradient across width
            const grad = ctx!.createLinearGradient(x1a, y1a, x1b, y1b);
            grad.addColorStop(0, `rgba(${litColor.join(",")}, ${alpha * 0.6})`);
            grad.addColorStop(0.5, `rgba(${litColor.join(",")}, ${alpha})`);
            grad.addColorStop(1, `rgba(${litColor.join(",")}, ${alpha * 0.6})`);

            ctx!.fillStyle = grad;
            ctx!.fill();

            // Front edge highlight
            if (avgDepth > 0.65) {
                ctx!.strokeStyle = `rgba(${mixedColor.join(",")}, ${alpha * 1.5})`;
                ctx!.lineWidth = 1.5;
                ctx!.stroke();
            }
        }
    }

    draw();

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener("resize", resize);
    };
}

export function RibbonBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const cleanup = drawDNAHelix(canvasRef.current);
        return cleanup;
    }, []);

    return (
        <>
            {/* CSS ambient layers */}
            <div className="ribbon-bg" aria-hidden="true">
                <div className="ribbon-1" />
                <div className="ribbon-2" />
                <div className="ribbon-glow" />
            </div>

            {/* DNA helix canvas */}
            <canvas
                ref={canvasRef}
                id="ribbon-canvas"
                aria-hidden="true"
            />
        </>
    );
}
