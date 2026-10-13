import { create } from 'zustand'
import { monthKey, type MonthKey } from '@/lib/dates'

type EntryDialog = { open: boolean; entryId?: string }

type UiState = {
  month: MonthKey
  entryDialog: EntryDialog
  setMonth: (month: MonthKey) => void
  openNewEntry: () => void
  openEditEntry: (entryId: string) => void
  closeEntryDialog: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  month: monthKey(),
  entryDialog: { open: false },
  setMonth: (month) => set({ month }),
  openNewEntry: () => set({ entryDialog: { open: true } }),
  openEditEntry: (entryId) => set({ entryDialog: { open: true, entryId } }),
  // Keep entryId so the dialog's content doesn't change while it animates closed.
  closeEntryDialog: () => set((state) => ({ entryDialog: { ...state.entryDialog, open: false } })),
}))
