import { create } from 'zustand'
import { adminApi } from '../api/adminApi'
import { countPendingPayments } from '../../services/paymentService'

// Small shared state for the shell: nav badges + store settings
export const useAdminMeta = create((set) => ({
  settings: null,
  pendingOrders: 0,
  unreadMessages: 0,
  pendingPayments: 0,
  async refresh() {
    try {
      const [settings, orders, messages, pendingPayments] = await Promise.all([
        adminApi.settings.get(), adminApi.orders.list(), adminApi.messages.list(), countPendingPayments(),
      ])
      set({
        settings,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        unreadMessages: messages.filter((m) => !m.read).length,
        pendingPayments,
      })
    } catch { /* badges are non-critical */ }
  },
}))
