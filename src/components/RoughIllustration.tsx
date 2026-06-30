import { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface RoughIllustrationProps {
  className?: string;
}

export function RoughIllustration({ className }: RoughIllustrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background grid (blueprint look)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // DRAW LEFT FILE BOX (Source)
    rc.rectangle(40, 50, 100, 120, {
      stroke: '#000000',
      strokeWidth: 3,
      fill: '#FFE600', // Saturated Neo Yellow
      fillStyle: 'hachure',
      fillWeight: 1.5,
      hachureAngle: 60,
      hachureGap: 8,
    });

    // File folded corner
    rc.polygon([[110, 50], [140, 50], [140, 80]], {
      stroke: '#000000',
      strokeWidth: 3,
      fill: '#000000',
      fillStyle: 'solid',
    });

    // Draw lines inside Left File
    rc.line(60, 90, 120, 90, { stroke: '#000000', strokeWidth: 2 });
    rc.line(60, 110, 110, 110, { stroke: '#000000', strokeWidth: 2 });
    rc.line(60, 130, 95, 130, { stroke: '#000000', strokeWidth: 2 });

    // DRAW CENTRAL CONVERTING GEAR / ARROW
    // Central double arrow
    rc.line(165, 110, 235, 110, { stroke: '#000000', strokeWidth: 4 });
    rc.line(235, 110, 220, 95, { stroke: '#000000', strokeWidth: 4 });
    rc.line(235, 110, 220, 125, { stroke: '#000000', strokeWidth: 4 });

    // Central circular gear rotation indicator
    rc.circle(200, 110, 50, {
      stroke: '#FFA8E8', // Neon Pink
      strokeWidth: 2.5,
      fill: 'rgba(255, 168, 232, 0.2)',
      fillStyle: 'zigzag',
      hachureAngle: -30,
      hachureGap: 6,
    });

    // DRAW RIGHT FILE BOX (Target)
    rc.rectangle(260, 50, 100, 120, {
      stroke: '#000000',
      strokeWidth: 3,
      fill: '#86EFAC', // Neon Green
      fillStyle: 'cross-hatch',
      fillWeight: 1.2,
      hachureAngle: 45,
      hachureGap: 10,
    });

    // File folded corner
    rc.polygon([[330, 50], [360, 50], [360, 80]], {
      stroke: '#000000',
      strokeWidth: 3,
      fill: '#000000',
      fillStyle: 'solid',
    });

    // Checkmark inside right file
    rc.polygon([[290, 110], [305, 125], [335, 95]], {
      stroke: '#000000',
      strokeWidth: 4,
    });

    // DRAW LITTLE ACCENT DOTS & SCRIBBLINGS
    rc.circle(50, 200, 12, { stroke: '#A5F3FC', fill: '#A5F3FC', fillStyle: 'solid' });
    rc.circle(350, 210, 20, { stroke: '#000000', strokeWidth: 2, fill: '#FFE600', fillStyle: 'hachure', hachureAngle: 0 });

  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000000] p-4 ${className}`}>
      {/* Label badges */}
      <div className="absolute top-3 left-3 bg-[#FFE600] border-2 border-black px-2 py-0.5 text-xs font-black uppercase rotate-[-3deg] shadow-[2px_2px_0px_0px_#000000]">
        input file
      </div>
      <div className="absolute top-3 right-3 bg-[#86EFAC] border-2 border-black px-2 py-0.5 text-xs font-black uppercase rotate-[2deg] shadow-[2px_2px_0px_0px_#000000]">
        100% lokal
      </div>

      <canvas 
        ref={canvasRef} 
        width={400} 
        height={240} 
        className="max-w-full h-auto pointer-events-none"
      />

      <div className="mt-2 w-full text-center border-t-2 border-black pt-2 bg-[#F4F3EF] px-2 py-1 rounded-md">
        <span className="font-mono text-xs text-black font-extrabold uppercase tracking-wide">
          Status: Siap memproses file secara lokal &middot; Tanpa Upload
        </span>
      </div>
    </div>
  );
}
