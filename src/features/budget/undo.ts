import { toast } from 'sonner'
import { deleteCategory, deleteEntry, restoreCategory, restoreEntry } from '@/features/budget/repo'

// Deletes are soft, so undo just clears deletedAt again.

export async function deleteEntryWithUndo(id: string): Promise<void> {
  await deleteEntry(id)
  toast('Entry deleted', { action: { label: 'Undo', onClick: () => void restoreEntry(id) } })
}

export async function deleteCategoryWithUndo(id: string, name: string): Promise<void> {
  await deleteCategory(id)
  toast(`${name} deleted`, {
    description: 'Past entries keep this category.',
    action: { label: 'Undo', onClick: () => void restoreCategory(id) },
  })
}
