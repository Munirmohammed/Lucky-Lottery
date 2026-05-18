import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/gameStore';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const { login, register } = useStore();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="bg-stars" />
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.logo}>
          <span className="gold-text">🎱 Lucky</span>
          <span> Lottery</span>
        </div>

        <div className={styles.tabs}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${mode === t ? styles.activeTab : ''}`}
              onClick={() => { setMode(t); setError(''); }}
            >
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required minLength={3}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required minLength={6}
          />
          {error && <p className={styles.error}>{error}</p>}
          <motion.button
            className={styles.btn}
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? '...' : mode === 'login' ? 'Login' : 'Create Account'}
          </motion.button>
        </form>

        <p className={styles.hint}>New users get 100 gems + 500 coins free!</p>
      </motion.div>
    </div>
  );
}
