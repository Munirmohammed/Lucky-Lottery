import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/gameStore';
import HUD from '../components/HUD';
import GlobeCanvas from '../components/GlobeCanvas';
import RewardPanel from '../components/RewardPanel';
import BallReveal from '../components/BallReveal';
import styles from './GamePage.module.css';

const SPIN_DURATION = 3500;

// phases: idle | animating | selecting | revealed
export default function GamePage() {
  const { user, prizes, spinCost, spinning, loadPrizes, spinAPI, claimBalance, logout } = useStore();
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [selectedBall, setSelectedBall] = useState(null);
  const [error, setError] = useState('');
  const spinDataRef = useRef(null);
  const globeRef = useRef(null);

  useEffect(() => { loadPrizes(); }, []);

  async function handleSpin() {
    if (phase !== 'idle') return;
    setError('');
    setSelectedBall(null);
    spinDataRef.current = null;
    setPhase('animating');
    try {
      const [spinData] = await Promise.all([
        spinAPI(),
        new Promise(r => setTimeout(r, SPIN_DURATION))
      ]);
      spinDataRef.current = spinData;
      setPhase('selecting');
    } catch (err) {
      setPhase('idle');
      setError(err.response?.data?.error || 'Spin failed');
    }
  }

  function handleBallSelect(ballNum) {
    if (phase !== 'selecting') return;
    setSelectedBall(ballNum);
    setResult(spinDataRef.current);
    setPhase('revealed');
  }

  function handleClaim() {
    if (result?.balance) claimBalance(result.balance);
    setResult(null);
    setSelectedBall(null);
    spinDataRef.current = null;
    setPhase('idle');
  }

  const isAnimating = phase === 'animating';
  const isSelecting = phase === 'selecting';
  const canSpin = phase === 'idle' && !spinning && (user?.gems || 0) >= spinCost;

  return (
    <div className={styles.page}>
      <div className="bg-stars" />
      <HUD />

      <div className={styles.body}>
        {/* LEFT column */}
        <div className={styles.leftCol}>
          <div className={styles.jackpotBox}>
            <p className={styles.jackpotLabel}>JACKPOT</p>
            <JackpotAmount />
          </div>
          <div className={styles.howBox}>
            <p className={styles.howTitle}>HOW TO PLAY</p>
            <Step icon="🎱" text="Click SPIN" />
            <Step icon="⚽" text="Balls bounce" />
            <Step icon="👆" text="Pick a ball" />
            <Step icon="🎁" text="Reveal your prize!" />
          </div>
        </div>

        {/* CENTER column */}
        <div className={styles.centerCol}>
          <GlobeCanvas
            ref={globeRef}
            animating={isAnimating}
            selectedBallNum={selectedBall}
            canSelect={isSelecting}
            onBallClick={handleBallSelect}
          />

          <AnimatePresence>
            {error && (
              <motion.p className={styles.error}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isSelecting ? (
              <motion.div
                key="pick"
                className={styles.pickInstruction}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                >
                  👆
                </motion.span>
                {' '}PICK A BALL
              </motion.div>
            ) : (
              <motion.button
                key="spin"
                className={`${styles.spinBtn} ${!canSpin ? styles.spinDisabled : ''}`}
                onClick={handleSpin}
                disabled={!canSpin}
                whileTap={canSpin ? { scale: 0.95 } : {}}
                animate={isAnimating ? {
                  boxShadow: [
                    '0 6px 30px rgba(39,201,63,0.5)',
                    '0 6px 55px rgba(39,201,63,0.95)',
                    '0 6px 30px rgba(39,201,63,0.5)'
                  ]
                } : {}}
                transition={isAnimating ? { repeat: Infinity, duration: 0.65 } : {}}
                initial={{ opacity: 0 }}
                exit={{ opacity: 0 }}
              >
                {isAnimating ? 'SPINNING...' : 'SPIN'}
              </motion.button>
            )}
          </AnimatePresence>

          <p className={styles.spinCost}>1 SPIN = 💎 {spinCost}</p>
        </div>

        {/* RIGHT column */}
        <div className={styles.rightCol}>
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div key="idle" className={styles.idlePanel}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className={styles.idleTitle}>🎰 Spin to Win!</p>
                <p className={styles.idleSub}>Tap SPIN and see if luck is on your side today.</p>
              </motion.div>
            )}

            {phase === 'animating' && (
              <motion.div key="spinning" className={styles.spinningPanel}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className={styles.spinDots}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1 }}>
                  🎱 🎱 🎱
                </motion.div>
                <p className={styles.spinningText}>Good luck...</p>
              </motion.div>
            )}

            {(phase === 'selecting' || phase === 'revealed') && (
              <motion.div key="selecting" className={styles.selectingPanel}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  className={styles.selectArrow}
                  animate={{ x: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  ←
                </motion.div>
                <p className={styles.selectTitle}>Choose your ball!</p>
                <p className={styles.selectSub}>Click any ball in the globe to reveal your prize.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.rewardStrip}>
            <RewardPanel prizes={prizes} />
          </div>

          {user?.isAdmin && (
            <a href="/admin" className={styles.adminLink}>⚙ Admin Panel</a>
          )}
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Full-screen ball reveal overlay */}
      <AnimatePresence>
        {phase === 'revealed' && result && selectedBall && (
          <BallReveal
            key="reveal"
            ballNum={selectedBall}
            result={result}
            onClaim={handleClaim}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JackpotAmount() {
  const { jackpot } = useStore();
  return (
    <motion.div className={styles.jackpotAmount}
      key={jackpot}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 0.35 }}>
      🪙 {jackpot.toLocaleString()}
    </motion.div>
  );
}

function Step({ icon, text }) {
  return (
    <div className={styles.step}>
      <span className={styles.stepIcon}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
