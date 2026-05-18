import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/gameStore';
import styles from './ShopModal.module.css';

const ETB_PACKAGES = [
  { id: 'etb_3',  gems: 30,  price: '3 ETB',  tag: null },
  { id: 'etb_5',  gems: 50,  price: '5 ETB',  tag: 'POPULAR' },
  { id: 'etb_10', gems: 100, price: '10 ETB', tag: 'BEST VALUE' },
];

const COIN_PACKAGE = { id: 'coins_50k', gems: 50, coins: 50000 };

export default function ShopModal({ onClose }) {
  const { user, buyGems } = useStore();
  const [loading, setLoading] = useState(null);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  async function purchase(packageId) {
    setLoading(packageId);
    setError('');
    try {
      const result = await buyGems(packageId);
      setFlash(`+${result.gems} 💎 added!`);
      setTimeout(() => setFlash(''), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 220 }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>💎 Buy Gems</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p className={styles.sub}>Your balance: <span className={styles.gemBal}>💎 {(user?.gems || 0).toLocaleString()}</span></p>

        <AnimatePresence>
          {flash && (
            <motion.div className={styles.flash} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {flash}
            </motion.div>
          )}
          {error && (
            <motion.div className={styles.errorMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>PAY WITH ETB</p>
          <div className={styles.packages}>
            {ETB_PACKAGES.map(pkg => (
              <div key={pkg.id} className={styles.pkgCard}>
                {pkg.tag && <span className={styles.pkgTag}>{pkg.tag}</span>}
                <span className={styles.pkgGems}>💎 {pkg.gems}</span>
                <span className={styles.pkgGemLabel}>gems</span>
                <span className={styles.pkgPrice}>{pkg.price}</span>
                <motion.button
                  className={styles.buyBtn}
                  onClick={() => purchase(pkg.id)}
                  disabled={!!loading}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading === pkg.id ? '...' : 'BUY'}
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.divider}><span>OR</span></div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>EXCHANGE COINS</p>
          <div className={styles.coinExchange}>
            <div className={styles.exchangeInfo}>
              <span className={styles.coinCost}>🪙 50,000 coins</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.gemReward}>💎 50 gems</span>
            </div>
            <p className={styles.coinBal}>Your coins: 🪙 {(user?.coins || 0).toLocaleString()}</p>
            <motion.button
              className={`${styles.buyBtn} ${styles.coinBtn}`}
              onClick={() => purchase(COIN_PACKAGE.id)}
              disabled={!!loading || (user?.coins || 0) < 50000}
              whileTap={{ scale: 0.95 }}
            >
              {loading === COIN_PACKAGE.id ? '...' : 'EXCHANGE'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
