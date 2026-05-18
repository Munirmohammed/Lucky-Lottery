import { motion } from 'framer-motion';
import styles from './TryAgainScreen.module.css';

export default function TryAgainScreen({ onClose }) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.card}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 180 }}
      >
        <motion.div
          className={styles.emoji}
          animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          😔
        </motion.div>

        <h2 className={styles.title}>Not This Time!</h2>
        <p className={styles.sub}>Better luck on your next spin...</p>

        <motion.button
          className={styles.btn}
          onClick={onClose}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          TRY AGAIN 🔄
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
