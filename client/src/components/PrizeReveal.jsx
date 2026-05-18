import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useStore } from '../store/gameStore';
import styles from './PrizeReveal.module.css';

export default function PrizeReveal({ result, onClaim }) {
  const claimed = useRef(false);

  useEffect(() => {
    if (!result) return;
    claimed.current = false;
    const isJackpot = result.prize.currency === 'jackpot' || result.prize.name === 'jackpot';
    confetti({
      particleCount: isJackpot ? 300 : 100,
      spread: isJackpot ? 120 : 80,
      origin: { y: 0.5 },
      colors: isJackpot
        ? ['#ffd700', '#ff6b6b', '#fff', '#a855f7']
        : ['#ffd700', '#c084fc', '#60a5fa']
    });
  }, [result]);

  if (!result) return null;

  const { prize } = result;
  const isJackpot = prize.name === 'jackpot';
  const currencyIcon = prize.currency === 'gems' ? '💎' : '🪙';

  function handleClaim() {
    if (claimed.current) return;
    claimed.current = true;
    onClaim();
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`${styles.card} ${isJackpot ? styles.jackpotCard : ''}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          <div className={styles.congrats}>CONGRATULATIONS!</div>
          <p className={styles.wonLabel}>★ YOU WON ★</p>

          <motion.div
            className={styles.giftBox}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          >
            {isJackpot ? '🏆' : '🎁'}
          </motion.div>

          <div className={styles.amount}>
            <span className={styles.amountIcon}>{currencyIcon}</span>
            <span className={styles.amountValue}>
              {prize.amount.toLocaleString()}
            </span>
            {isJackpot && <span className={styles.jackpotTag}>JACKPOT!</span>}
          </div>

          <motion.button
            className={styles.claimBtn}
            onClick={handleClaim}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            GET PRIZE 👆
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
