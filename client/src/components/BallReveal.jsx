import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import styles from './BallReveal.module.css';

const BALL_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#1abc9c','#e91e63','#ff5722'];

// stage: 'entering' → 'splitting' → 'revealed'
export default function BallReveal({ ballNum, result, onClaim }) {
  const [stage, setStage] = useState('entering');
  const color = BALL_COLORS[(ballNum - 1) % BALL_COLORS.length];
  const won = result?.won;

  useEffect(() => {
    const t1 = setTimeout(() => setStage('splitting'), 900);
    const t2 = setTimeout(() => {
      setStage('revealed');
      if (won) {
        const isJackpot = result?.prize?.name === 'jackpot';
        confetti({
          particleCount: isJackpot ? 350 : 150,
          spread: isJackpot ? 130 : 90,
          startVelocity: isJackpot ? 55 : 45,
          origin: { x: 0.5, y: 0.45 },
          colors: isJackpot
            ? ['#ffd700', '#ff6b6b', '#fff', '#a855f7', '#60a5fa']
            : ['#ffd700', '#c084fc', '#60a5fa', '#fff']
        });
      }
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const isOpen = stage === 'splitting' || stage === 'revealed';

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Radial glow bg matching ball color */}
      <div
        className={styles.colorBg}
        style={{ background: `radial-gradient(ellipse at center, ${color}22 0%, transparent 70%)` }}
      />

      <div className={styles.scene}>

        {/* ── Ball halves ── */}
        <motion.div
          className={styles.ballWrapper}
          initial={{ scale: 0.05, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', damping: 13, stiffness: 140 }}
        >
          {/* Outer glow ring */}
          <motion.div
            className={styles.glowRing}
            style={{ boxShadow: `0 0 0 6px ${color}55, 0 0 60px ${color}88, 0 0 120px ${color}44` }}
            animate={isOpen ? { scale: 2.5, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Top half wrapper */}
          <motion.div
            className={styles.halfWrap}
            style={{ top: 0, borderRadius: '90px 90px 0 0', overflow: 'hidden' }}
            animate={isOpen ? { y: -115 } : { y: 0 }}
            transition={{ duration: 0.55, type: 'spring', damping: 14, stiffness: 160 }}
          >
            <div
              className={styles.halfBall}
              style={{ background: `radial-gradient(circle at 38% 32%, ${lighten(color)}, ${color})` }}
            />
          </motion.div>

          {/* Bottom half wrapper */}
          <motion.div
            className={styles.halfWrap}
            style={{ bottom: 0, borderRadius: '0 0 90px 90px', overflow: 'hidden' }}
            animate={isOpen ? { y: 115 } : { y: 0 }}
            transition={{ duration: 0.55, type: 'spring', damping: 14, stiffness: 160 }}
          >
            <div
              className={styles.halfBallBottom}
              style={{ background: `radial-gradient(circle at 38% 68%, ${color}, ${darken(color)})` }}
            />
          </motion.div>

          {/* Ball number — fades when splitting */}
          <motion.div
            className={styles.ballNumber}
            animate={isOpen ? { opacity: 0, scale: 0.3 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {ballNum}
          </motion.div>

          {/* Inner light burst */}
          <motion.div
            className={styles.innerBurst}
            animate={stage === 'splitting'
              ? { opacity: 1, scale: 3 }
              : stage === 'revealed'
              ? { opacity: 0, scale: 4 }
              : { opacity: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>

        {/* ── Prize / Loss content ── */}
        <AnimatePresence>
          {stage === 'revealed' && (
            <motion.div
              className={styles.prizeContent}
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
            >
              {won ? <WinContent result={result} onClaim={onClaim} /> : <LoseContent onClaim={onClaim} />}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}

function WinContent({ result, onClaim }) {
  const isJackpot = result?.prize?.name === 'jackpot';
  const currency = result?.prize?.currency;
  const amount = result?.prize?.amount;

  return (
    <>
      <motion.div
        className={styles.wonBanner}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {isJackpot ? '🏆 JACKPOT!' : '🎉 YOU WON!'}
      </motion.div>

      <motion.div
        className={styles.prizeRow}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', damping: 12 }}
      >
        <span className={styles.currencyIcon}>{currency === 'gems' ? '💎' : '🪙'}</span>
        <span className={styles.prizeNum}>{amount?.toLocaleString()}</span>
      </motion.div>

      {isJackpot && (
        <motion.div
          className={styles.jackpotLabel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          ✨ JACKPOT PRIZE ✨
        </motion.div>
      )}

      <motion.button
        className={styles.claimBtn}
        onClick={onClaim}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        GET PRIZE 👆
      </motion.button>
    </>
  );
}

function LoseContent({ onClaim }) {
  return (
    <>
      <motion.span
        className={styles.sadEmoji}
        animate={{ rotate: [0, -14, 14, -8, 8, 0] }}
        transition={{ duration: 0.55, delay: 0.1 }}
      >
        😔
      </motion.span>
      <p className={styles.loseTitle}>Not This Time!</p>
      <p className={styles.loseSub}>Luck is just around the corner...</p>
      <motion.button
        className={styles.tryBtn}
        onClick={onClaim}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        TRY AGAIN 🔄
      </motion.button>
    </>
  );
}

// Simple color helpers for the ball gradient
function lighten(hex) {
  return hex + 'cc';
}
function darken(hex) {
  // Returns a slightly darker shade by blending with black
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0xff) - 40);
  const b = Math.max(0, (num & 0xff) - 40);
  return `rgb(${r},${g},${b})`;
}
