import React, { useMemo } from 'react';

const COLORS = ['#818cf8', '#a78bfa', '#34d399', '#f59e0b', '#ec4899'];

interface Particle {
  id: number;
  style: React.CSSProperties;
}

// Injeta os keyframes de animação na cabeça do documento uma única vez
// para que possam ser usados pelo componente.
const keyframes = `
  @keyframes confetti-fall {
    0% { transform: translateY(-20vh) rotateZ(0deg); opacity: 1; }
    100% { transform: translateY(120vh) rotateZ(720deg); opacity: 0; }
  }
`;

if (!document.getElementById('confetti-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'confetti-styles';
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);
}


const Confetti: React.FC<{ particleCount: number }> = ({ particleCount }) => {
  const particles = useMemo(() => {
    if (particleCount === 0) return [];
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const left = Math.random() * 100;
      const animDuration = Math.random() * 3 + 2; // Duração entre 2s e 5s
      const animDelay = Math.random() * 4; // Atraso de até 4s
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = Math.random() * 0.5 + 0.3; // Tamanho entre 0.3rem e 0.8rem
      
      newParticles.push({
        id: i,
        style: {
          position: 'fixed',
          top: '-20vh', // Começa acima da tela
          left: `${left}vw`,
          width: `${size}rem`,
          height: `${size}rem`,
          backgroundColor: color,
          borderRadius: '50%',
          opacity: 0,
          animationName: 'confetti-fall',
          animationTimingFunction: 'linear',
          animationIterationCount: '1',
          animationFillMode: 'forwards',
          animationDuration: `${animDuration}s`,
          animationDelay: `${animDelay}s`,
          transform: `rotateZ(${Math.random() * 360}deg)`
        }
      });
    }
    return newParticles;
  }, [particleCount]);

  if (particleCount === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <div key={p.id} style={p.style} />
      ))}
    </div>
  );
};

export default Confetti;