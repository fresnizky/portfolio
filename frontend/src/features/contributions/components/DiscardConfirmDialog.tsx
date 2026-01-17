import { Modal } from '@/components/common/Modal'

interface DiscardConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  pendingCount: number
}

export function DiscardConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  pendingCount,
}: DiscardConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Descartar Aporte Pendiente">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Tienes {pendingCount} transacciones pendientes de registrar.
          ¿Estás seguro de que querés descartar este aporte?
        </p>
        <p className="text-sm text-gray-500">
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Descartar
          </button>
        </div>
      </div>
    </Modal>
  )
}
