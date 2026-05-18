import { create } from 'zustand';
import api from '../api/client';
import { io } from 'socket.io-client';

let socket = null;

export const useStore = create((set, get) => ({
  user: null,
  jackpot: 25000,
  prizes: [],
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
    set({ user: null });
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

  buyGems: async (packageId) => {
    const { data } = await api.post('/shop/buy', { packageId });
    set({ user: { ...get().user, ...data.balance } });
    return data;
  },

  // Returns result data — GamePage controls when to reveal it
  spinAPI: async () => {
    set({ spinning: true });
    try {
      const { data } = await api.post('/game/spin');
      set({ user: { ...get().user, ...data.balance }, spinning: false });
      return data;
    } catch (err) {
      set({ spinning: false });
      throw err;
    }
  },
}));
