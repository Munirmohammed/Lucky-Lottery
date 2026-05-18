import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/gameStore';
import ShopModal from './ShopModal';
import styles from './HUD.module.css';

export default function HUD() {
  const { user, jackpot } = useStore();
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <>
      <div className={styles.hud}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎱</span>
          <div className={styles.logoText}>
            <span className={styles.lucky}>LUCKY</span>
            <span className={styles.lottery}>LOTTERY</span>
          </div>
        </div>

        {/* Balances */}
        <div className={styles.balances}>
          <div className={styles.balance}>
            <span className={styles.icon}>🪙</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={user?.coins}
                className={styles.amount}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
              >
                {(user?.coins || 0).toLocaleString()}
              </motion.span>
            </AnimatePresence>
            <motion.button
              className={styles.plusBtn}
              onClick={() => setShopOpen(true)}
              whileTap={{ scale: 0.9 }}
              title="Buy gems"
            >
              +
            </motion.button>
          </div>

          <div className={styles.balance}>
            <span className={styles.icon}>💎</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={user?.gems}
                className={`${styles.amount} ${styles.gemAmount}`}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
              >
                {(user?.gems || 0).toLocaleString()}
              </motion.span>
            </AnimatePresence>
            <motion.button
              className={`${styles.plusBtn} ${styles.plusGem}`}
              onClick={() => setShopOpen(true)}
              whileTap={{ scale: 0.9 }}
              title="Buy gems"
            >
              +
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {shopOpen && <ShopModal onClose={() => setShopOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
