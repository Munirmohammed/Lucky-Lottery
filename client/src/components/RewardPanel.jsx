import styles from './RewardPanel.module.css';

const ICONS = {
  coins: '🪙',
  gems: '💎',
  jackpot: '🏆'
};

export default function RewardPanel({ prizes }) {
  if (!prizes?.length) return null;

  return (
    <div className={styles.panel}>
      <span className={styles.label}>POSSIBLE REWARDS</span>
      <div className={styles.items}>
        {prizes.map(prize => (
          <div key={prize.id} className={`${styles.item} ${prize.currency === 'jackpot' ? styles.jackpotItem : ''}`}>
            <span className={styles.icon}>{ICONS[prize.currency] || '🎁'}</span>
            <span className={styles.amount}>
              {prize.currency === 'jackpot' ? 'JACKPOT' : prize.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
