import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Matter from 'matter-js';
import styles from './GlobeCanvas.module.css';

const BALL_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#1abc9c','#e91e63','#ff5722'];
const BALL_COUNT = 9;
const GLOBE_RADIUS = 155;

const GlobeCanvas = forwardRef(function GlobeCanvas({ animating, selectedBallNum }, ref) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const ballsRef = useRef([]);
  const animFrameRef = useRef(null);
  const selectedBallNumRef = useRef(null);

  useImperativeHandle(ref, () => ({
    highlightBall: (index) => {
      const ball = ballsRef.current[index];
      if (ball) ball._highlight = true;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;

    const { Engine, Render, Runner, Bodies, Body, World, Events } = Matter;

    const engine = Engine.create({ gravity: { y: 0.6 } });
    engineRef.current = engine;

    const render = Render.create({
      canvas,
      engine,
      options: {
        width: W,
        height: H,
        wireframes: false,
        background: 'transparent'
      }
    });
    renderRef.current = render;

    // Globe boundary — ring of static segments
    const segments = 48;
    const walls = [];
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = cx + GLOBE_RADIUS * Math.cos(a1);
      const y1 = cy + GLOBE_RADIUS * Math.sin(a1);
      const x2 = cx + GLOBE_RADIUS * Math.cos(a2);
      const y2 = cy + GLOBE_RADIUS * Math.sin(a2);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
      walls.push(Bodies.rectangle(mx, my, len + 2, 8, {
        isStatic: true, angle,
        render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 },
        friction: 0.1, restitution: 0.85
      }));
    }
    World.add(engine.world, walls);

    // Balls
    const ballRadius = 22;
    ballsRef.current = Array.from({ length: BALL_COUNT }, (_, i) => {
      const angle = (i / BALL_COUNT) * Math.PI * 2;
      const r = GLOBE_RADIUS * 0.45;
      const ball = Bodies.circle(
        cx + r * Math.cos(angle),
        cy + r * Math.sin(angle),
        ballRadius,
        {
          restitution: 0.75,
          friction: 0.02,
          frictionAir: 0.008,
          label: `ball_${i}`,
          render: { fillStyle: BALL_COLORS[i], strokeStyle: 'rgba(255,255,255,0.3)', lineWidth: 2 }
        }
      );
      ball._number = i + 1;
      ball._color = BALL_COLORS[i];
      ball._highlight = false;
      Body.setVelocity(ball, {
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 6
      });
      return ball;
    });
    World.add(engine.world, ballsRef.current);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Custom draw: numbers on each ball, glow on selected
    Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      // selectedBallNum is read live from the ref so it stays current
      const selected = selectedBallNumRef.current;
      const hasSelection = selected !== null && selected !== undefined;

      ballsRef.current.forEach((ball) => {
        const { x, y } = ball.position;
        const isSelected = ball._number === selected;
        ctx.save();

        // Fade non-selected balls when a selection is active
        if (hasSelection && !isSelected) {
          ctx.globalAlpha = 0.3;
        }

        if (isSelected) {
          // Outer glow pulse ring
          ctx.shadowBlur = 40;
          ctx.shadowColor = '#ffd700';
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
          ctx.fill();
          ctx.shadowBlur = 0;

          // White ring border
          ctx.beginPath();
          ctx.arc(x, y, 26, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Ball number
        ctx.font = `bold ${isSelected ? 16 : 14}px Nunito, sans-serif`;
        ctx.fillStyle = isSelected ? '#ffd700' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = isSelected ? 10 : 0;
        ctx.shadowColor = '#ffd700';
        ctx.fillText(ball._number, x, y);
        ctx.restore();
      });
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      World.clear(engine.world);
    };
  }, []);

  // Keep ref in sync so the afterRender callback always reads the latest value
  useEffect(() => {
    selectedBallNumRef.current = selectedBallNum;
  }, [selectedBallNum]);

  // Kick balls when animating starts so they bounce chaotically
  useEffect(() => {
    if (!animating) return;

    // Initial strong burst
    ballsRef.current.forEach(ball => {
      Matter.Body.setVelocity(ball, {
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 18
      });
    });

    // Keep applying random impulses throughout the animation
    const interval = setInterval(() => {
      ballsRef.current.forEach(ball => {
        Matter.Body.applyForce(ball, ball.position, {
          x: (Math.random() - 0.5) * 0.06,
          y: (Math.random() - 0.5) * 0.06
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [animating]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.globeRing} />
      <canvas ref={canvasRef} className={styles.canvas} width={340} height={340} />
    </div>
  );
});

export default GlobeCanvas;
