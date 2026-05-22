import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl w-full ${maxWidth} p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-neutral-850">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-xl cursor-pointer">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
