import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Hapus", isLoading }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-neutral-600">{message}</p>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all cursor-pointer"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? "Menghapus..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
