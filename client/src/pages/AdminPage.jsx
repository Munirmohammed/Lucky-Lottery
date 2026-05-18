import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [prizes, setPrizes] = useState([]);
  const [jackpot, setJackpot] = useState(null);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState(null);
  const [giveForm, setGiveForm] = useState({ username: '', amount: '' });
  const [saved, setSaved] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/prizes'),
      api.get('/admin/jackpot'),
      api.get('/admin/settings'),
      api.get('/admin/stats')
    ]).then(([p, j, s, st]) => {
      setPrizes(p.data);
      setJackpot(j.data);
      setSettings(s.data);
      setStats(st.data);
    });
  }, []);

  const totalWeight = prizes.reduce((s, p) => s + (p.enabled ? p.weight : 0), 0);

  async function savePrize(id, field, value) {
    const res = await api.patch(`/admin/prizes/${id}`, { [field]: value });
    setPrizes(prev => prev.map(p => p.id === id ? res.data : p));
    flash('Saved!');
  }

  async function saveJackpot(field, value) {
    const res = await api.patch('/admin/jackpot', { [field]: value });
    setJackpot(res.data);
    flash('Saved!');
  }

  async function saveSetting(key, value) {
    await api.patch('/admin/settings', { [key]: value });
    setSettings(prev => ({ ...prev, [key]: String(value) }));
    flash('Saved!');
  }

  async function giveGems(e) {
    e.preventDefault();
    await api.post('/admin/give-gems', { username: giveForm.username, amount: parseInt(giveForm.amount) });
    setGiveForm({ username: '', amount: '' });
    flash('Gems sent!');
  }

  function flash(msg) {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2000);
  }

  return (
    <div className={styles.page}>
      <div className="bg-stars" />
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>⚙ Admin Panel</h1>
          {saved && <motion.span className={styles.saved} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{saved}</motion.span>}
          <a href="/" className={styles.back}>← Back to Game</a>
        </div>

        {/* Stats row */}
        {stats && (
          <div className={styles.statsRow}>
            <div className={styles.statBox}><span className={styles.statN}>{stats.totalSpins.toLocaleString()}</span><span>Total Spins</span></div>
            <div className={styles.statBox}><span className={styles.statN}>{stats.totalUsers.toLocaleString()}</span><span>Users</span></div>
          </div>
        )}

        <div className={styles.grid}>
          {/* Prize weights */}
          <div className={`${styles.card} glass`}>
            <h2 className={styles.cardTitle}>Prize Weights</h2>
            <p className={styles.hint}>Total weight: {totalWeight} — each prize's chance = weight ÷ total</p>
            {prizes.map(prize => (
              <div key={prize.id} className={styles.prizeRow}>
                <div className={styles.prizeLeft}>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={prize.enabled}
                      onChange={e => savePrize(prize.id, 'enabled', e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                  <span className={styles.prizeName}>{prize.label} {prize.currency !== 'jackpot' && prize.currency}</span>
                  <span className={styles.prizeChance}>
                    {prize.enabled ? `${((prize.weight / totalWeight) * 100).toFixed(1)}%` : 'OFF'}
                  </span>
                </div>
                <div className={styles.prizeRight}>
                  <input
                    type="range" min={0} max={100} value={prize.weight}
                    className={styles.slider2}
                    onChange={e => setPrizes(prev => prev.map(p => p.id === prize.id ? { ...p, weight: +e.target.value } : p))}
                    onMouseUp={e => savePrize(prize.id, 'weight', +e.target.value)}
                    onTouchEnd={e => savePrize(prize.id, 'weight', +e.target.value)}
                  />
                  <span className={styles.weightNum}>{prize.weight}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Jackpot config */}
          {jackpot && (
            <div className={`${styles.card} glass`}>
              <h2 className={styles.cardTitle}>Jackpot Settings</h2>
              <div className={styles.field}>
                <label>Current Amount</label>
                <strong className="gold-text">🪙 {jackpot.amount.toLocaleString()}</strong>
              </div>
              <div className={styles.field}>
                <label>Seed (reset amount after win)</label>
                <div className={styles.inputRow}>
                  <input
                    type="number" className={styles.input} defaultValue={jackpot.seed} min={0}
                    onBlur={e => saveJackpot('seed', +e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Contribution per spin (%)</label>
                <div className={styles.inputRow}>
                  <input
                    type="number" className={styles.input} defaultValue={jackpot.contribution} min={0} max={100}
                    onBlur={e => saveJackpot('contribution', +e.target.value)}
                  />
                </div>
              </div>
              {jackpot.lastWonAt && (
                <p className={styles.hint}>Last won: {new Date(jackpot.lastWonAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {/* Spin cost */}
          <div className={`${styles.card} glass`}>
            <h2 className={styles.cardTitle}>Game Settings</h2>
            <div className={styles.field}>
              <label>Spin Cost (gems 💎)</label>
              <input
                type="number" className={styles.input}
                defaultValue={settings.spin_cost_gems || 10} min={1}
                onBlur={e => saveSetting('spin_cost_gems', +e.target.value)}
              />
            </div>
          </div>

          {/* Give gems */}
          <div className={`${styles.card} glass`}>
            <h2 className={styles.cardTitle}>Give Gems to User</h2>
            <form onSubmit={giveGems} className={styles.giveForm}>
              <input
                className={styles.input} placeholder="Username"
                value={giveForm.username}
                onChange={e => setGiveForm(f => ({ ...f, username: e.target.value }))}
                required
              />
              <input
                className={styles.input} type="number" placeholder="Amount"
                value={giveForm.amount}
                onChange={e => setGiveForm(f => ({ ...f, amount: e.target.value }))}
                required min={1}
              />
              <button type="submit" className={styles.btn}>Send Gems 💎</button>
            </form>
          </div>

          {/* Breakdown */}
          {stats?.breakdown?.length > 0 && (
            <div className={`${styles.card} glass`} style={{ gridColumn: '1 / -1' }}>
              <h2 className={styles.cardTitle}>Prize Breakdown</h2>
              <table className={styles.table}>
                <thead><tr><th>Prize</th><th>Spins</th><th>Total Won</th></tr></thead>
                <tbody>
                  {stats.breakdown.map((row, i) => (
                    <tr key={i}>
                      <td>{row.prize} {row.currency}</td>
                      <td>{row.spins.toLocaleString()}</td>
                      <td>{row.totalWon?.toLocaleString() || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
