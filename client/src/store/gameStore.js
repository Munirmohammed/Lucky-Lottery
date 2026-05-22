import { create } from 'zustand';
import api from '../api/client';
import { io } from 'socket.io-client';

let socket = null;

export const useStore = create((set, get) => ({
  user: null,
  authLoading: true,
  jackpot: 25000,
  prizes: [],
  spinning: false,
  spinCost: 10,

  loadUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { set({ authLoading: false }); return; }
    try {
      const { data } = await api.get('/user/me');
      set({ user: data, authLoading: false });
      get().connectSocket();
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ authLoading: false });
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

  // Returns result — does NOT update balance (claimBalance does that on claim click)
  spinAPI: async () => {
    set({ spinning: true });
    try {
      const { data } = await api.post('/game/spin');
      // Only deduct the gem cost immediately so UI shows correct gem count
      set({
        spinning: false,
        user: { ...get().user, gems: data.balance.gems }
      });
      return data;
    } catch (err) {
      set({ spinning: false });
      throw err;
    }
  },

  // Called when user clicks GET PRIZE or TRY AGAIN — applies full balance
  claimBalance: (balance) => {
    set({ user: { ...get().user, ...balance } });
  },
}));
