import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useStore } from '../store/gameStore';
import HUD from '../components/HUD';
import GlobeCanvas from '../components/GlobeCanvas';
import RewardPanel from '../components/RewardPanel';
import styles from './GamePage.module.css';

const SPIN_DURATION = 3500;

export default function GamePage() {
  const { user, prizes, spinCost, spinning, loadPrizes, spinAPI, claimBalance, logout } = useStore();
  const [phase, setPhase] = useState('idle');   // idle | animating | reveal
  const [result, setResult] = useState(null);
  const [selectedBall, setSelectedBall] = useState(null);
  const [error, setError] = useState('');
  const globeRef = useRef(null);

  useEffect(() => { loadPrizes(); }, []);

  async function handleSpin() {
    if (phase !== 'idle') return;
    setError('');
    setSelectedBall(null);
    setPhase('animating');
    try {
      const [spinData] = await Promise.all([
        spinAPI(),
        new Promise(r => setTimeout(r, SPIN_DURATION))
      ]);
      // Pick a random ball number (1-9) as the visual "chosen" ball
      const chosenBall = Math.floor(Math.random() * 9) + 1;
      setSelectedBall(chosenBall);
      setResult(spinData);
      setPhase('reveal');
      if (spinData.won) {
        const isJackpot = spinData.prize.name === 'jackpot';
        confetti({
          particleCount: isJackpot ? 300 : 120,
          spread: isJackpot ? 120 : 80,
          origin: { y: 0.5, x: 0.75 },
          colors: isJackpot
            ? ['#ffd700', '#ff6b6b', '#fff', '#a855f7']
            : ['#ffd700', '#c084fc', '#60a5fa']
        });
      }
    } catch (err) {
      setPhase('idle');
      setError(err.response?.data?.error || 'Spin failed');
    }
  }

  function handleClose() {
    // Apply balance update NOW — when user acknowledges the result
    if (result?.balance) claimBalance(result.balance);
    setResult(null);
    setSelectedBall(null);
    setPhase('idle');
  }

  const isAnimating = phase === 'animating';
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
            <Step icon="🎱" text="Click SPIN button" />
            <Step icon="⚽" text="Balls start bouncing" />
            <Step icon="🎁" text="Click GET PRIZE" />
            <Step icon="🏆" text="Win exciting rewards!" />
          </div>
        </div>

        {/* CENTER column */}
        <div className={styles.centerCol}>
          <GlobeCanvas ref={globeRef} animating={isAnimating} selectedBallNum={selectedBall} />

          <AnimatePresence>
            {error && (
              <motion.p className={styles.error}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
              boxShadow: [
                '0 6px 30px rgba(39,201,63,0.5)',
                '0 6px 55px rgba(39,201,63,0.95)',
                '0 6px 30px rgba(39,201,63,0.5)'
              ]
            } : {}}
            transition={isAnimating ? { repeat: Infinity, duration: 0.65 } : {}}
          >
            {isAnimating ? 'SPINNING...' : 'SPIN'}
          </motion.button>

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

            {phase === 'reveal' && result?.won && (
              <motion.div key="win" className={styles.winPanel}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200 }}>

                <div className={styles.congratsBanner}>CONGRATULATIONS!</div>
                <p className={styles.wonLabel}>★ YOU WON ★</p>

                {selectedBall && (
                  <div className={styles.selectedBallTag}>
                    🎱 Ball #{selectedBall}
                  </div>
                )}

                <motion.div className={styles.giftIcon}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}>
                  {result.prize.name === 'jackpot' ? '🏆' : '🎁'}
                </motion.div>

                <div className={styles.prizeAmount}>
                  <span>{result.prize.currency === 'gems' ? '💎' : '🪙'}</span>
                  <span className={styles.prizeNum}>{result.prize.amount.toLocaleString()}</span>
                </div>

                {result.prize.name === 'jackpot' && (
                  <span className={styles.jackpotTag}>JACKPOT!</span>
                )}

                <motion.button className={styles.getPrizeBtn}
                  onClick={handleClose}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}>
                  GET PRIZE 👆
                </motion.button>
              </motion.div>
            )}

            {phase === 'reveal' && !result?.won && (
              <motion.div key="tryagain" className={styles.tryAgainPanel}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 180 }}>

                {selectedBall && (
                  <div className={styles.selectedBallTagDim}>
                    🎱 Ball #{selectedBall}
                  </div>
                )}

                <motion.span className={styles.sadEmoji}
                  animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                  transition={{ duration: 0.5, delay: 0.15 }}>
                  😔
                </motion.span>
                <p className={styles.tryTitle}>Not This Time!</p>
                <p className={styles.trySub}>Better luck on your next spin...</p>

                <motion.button className={styles.tryBtn}
                  onClick={handleClose}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}>
                  TRY AGAIN 🔄
                </motion.button>
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
