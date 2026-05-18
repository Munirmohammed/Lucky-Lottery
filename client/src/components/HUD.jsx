import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/gameStore';
import styles from './HUD.module.css';

export default function HUD() {
  const { user, jackpot } = useStore();

  return (
    <div className={styles.hud}>
      <div className={styles.left}>
        <span className={styles.logo}>🎱 Lucky Lottery</span>
      </div>

      <div className={styles.balances}>
        <div className={styles.balance}>
          <span className={styles.icon}>🪙</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={user?.coins}
              className={styles.amount}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
            >
              {(user?.coins || 0).toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className={styles.balance}>
          <span className={styles.icon}>💎</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={user?.gems}
              className={`${styles.amount} ${styles.gem}`}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
            >
              {(user?.gems || 0).toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.jackpotBadge}>
        <span className={styles.jackpotLabel}>JACKPOT</span>
        <motion.span
          key={jackpot}
          className={styles.jackpotAmount}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.4 }}
        >
          🪙 {jackpot.toLocaleString()}
        </motion.span>
      </div>
    </div>
  );
}
