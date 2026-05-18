import { create } from 'zustand';
import api from '../api/client';
import { io } from 'socket.io-client';

let socket = null;

export const useStore = create((set, get) => ({
  user: null,
  jackpot: 25000,
  prizes: [],
  spinResult: null,
  spinning: false,
  spinCost: 10,

  loadUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const { data } = await api.get('/user/me');
      set({ user: data });
      get().connectSocket();
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    set({ user: data.user });
    get().connectSocket();
  },

  register: async (username, password) => {
    const { data } = await api.post('/auth/register', { username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    set({ user: data.user });
    get().connectSocket();
  },

  logout: () => {
    localStorage.clear();
    if (socket) socket.disconnect();
    socket = null;
    set({ user: null, spinResult: null });
  },

  connectSocket: () => {
    if (socket) return;
    socket = io();
    socket.on('jackpot_update', (amount) => set({ jackpot: amount }));
  },

  loadPrizes: async () => {
    const { data } = await api.get('/game/prizes');
    set({ prizes: data });
    const { data: costData } = await api.get('/game/spin-cost');
    set({ spinCost: costData.cost });
  },

  spin: async () => {
    if (get().spinning) return;
    set({ spinning: true, spinResult: null });
    try {
      const { data } = await api.post('/game/spin');
      set({ spinResult: data, user: { ...get().user, ...data.balance } });
    } catch (err) {
      throw err;
    } finally {
      set({ spinning: false });
    }
  },

  clearResult: () => set({ spinResult: null }),
}));
