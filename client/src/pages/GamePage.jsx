import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/gameStore';
import HUD from '../components/HUD';
import GlobeCanvas from '../components/GlobeCanvas';
import PrizeReveal from '../components/PrizeReveal';
import RewardPanel from '../components/RewardPanel';
import styles from './GamePage.module.css';

export default function GamePage() {
  const { user, prizes, spinCost, spinning, spinResult, loadPrizes, spin, clearResult, logout } = useStore();
  const [error, setError] = useState('');
  const globeRef = useRef(null);

  useEffect(() => { loadPrizes(); }, []);

  async function handleSpin() {
    if (spinning || spinResult) return;
    setError('');
    try {
      await spin();
    } catch (err) {
      setError(err.response?.data?.error || 'Spin failed');
    }
  }

  function handleClaim() {
    clearResult();
  }

  const canSpin = !spinning && !spinResult && (user?.gems || 0) >= spinCost;

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
          <GlobeCanvas ref={globeRef} spinning={spinning} />

          {error && (
            <motion.p
              className={styles.error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            className={`${styles.spinBtn} ${!canSpin ? styles.spinDisabled : ''}`}
            onClick={handleSpin}
            disabled={!canSpin}
            whileTap={canSpin ? { scale: 0.95 } : {}}
            animate={spinning ? { boxShadow: ['0 0 20px #27c93f', '0 0 50px #27c93f', '0 0 20px #27c93f'] } : {}}
            transition={spinning ? { repeat: Infinity, duration: 0.8 } : {}}
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
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

      {spinResult && (
        <PrizeReveal result={spinResult} onClaim={handleClaim} />
      )}
    </div>
  );
}
