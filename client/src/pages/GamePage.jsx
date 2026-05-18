import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/gameStore';
import HUD from '../components/HUD';
import GlobeCanvas from '../components/GlobeCanvas';
import PrizeReveal from '../components/PrizeReveal';
import TryAgainScreen from '../components/TryAgainScreen';
import RewardPanel from '../components/RewardPanel';
import styles from './GamePage.module.css';

const SPIN_DURATION = 3500; // ms balls bounce before result is shown

export default function GamePage() {
  const { user, prizes, spinCost, spinning, loadPrizes, spinAPI, logout } = useStore();

  // 'idle' → 'animating' → 'reveal'
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const globeRef = useRef(null);

  useEffect(() => { loadPrizes(); }, []);

  async function handleSpin() {
    if (phase !== 'idle') return;
    setError('');
    setPhase('animating');

    try {
      // Run API call and minimum animation timer in parallel
      const [spinData] = await Promise.all([
        spinAPI(),
        new Promise(res => setTimeout(res, SPIN_DURATION))
      ]);
      setResult(spinData);
      setPhase('reveal');
    } catch (err) {
      setPhase('idle');
      setError(err.response?.data?.error || 'Spin failed, try again');
    }
  }

  function handleClose() {
    setResult(null);
    setPhase('idle');
  }

  const isAnimating = phase === 'animating';
  const canSpin = phase === 'idle' && !spinning && (user?.gems || 0) >= spinCost;

  return (
    <div className={styles.page}>
      <div className="bg-stars" />
      <HUD />

      <main className={styles.main}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div className={styles.howToPlay}>
            <h3 className={styles.howTitle}>HOW TO PLAY</h3>
            <div className={styles.step}><span>🎱</span> Click SPIN button</div>
            <div className={styles.step}><span>⚽</span> Balls start bouncing</div>
            <div className={styles.step}><span>🎁</span> Click GET PRIZE</div>
            <div className={styles.step}><span>🏆</span> Win exciting rewards!</div>
          </div>
        </div>

        {/* Center — globe */}
        <div className={styles.center}>
          <GlobeCanvas ref={globeRef} animating={isAnimating} />

          <AnimatePresence>
            {error && (
              <motion.p
                className={styles.error}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            className={`${styles.spinBtn} ${!canSpin ? styles.spinDisabled : ''}`}
            onClick={handleSpin}
            disabled={!canSpin}
            whileTap={canSpin ? { scale: 0.95 } : {}}
            animate={isAnimating ? {
              boxShadow: ['0 6px 30px rgba(39,201,63,0.5)', '0 6px 50px rgba(39,201,63,0.9)', '0 6px 30px rgba(39,201,63,0.5)']
            } : {}}
            transition={isAnimating ? { repeat: Infinity, duration: 0.7 } : {}}
          >
            {isAnimating ? 'SPINNING...' : 'SPIN'}
          </motion.button>

          <p className={styles.spinCost}>1 SPIN = 💎 {spinCost}</p>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <RewardPanel prizes={prizes} />
          {user?.isAdmin && (
            <a href="/admin" className={styles.adminLink}>⚙ Admin Panel</a>
          )}
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {phase === 'reveal' && result?.won && (
          <PrizeReveal result={result} onClaim={handleClose} />
        )}
        {phase === 'reveal' && !result?.won && (
          <TryAgainScreen onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
