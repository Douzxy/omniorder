import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const inputClass = "w-full py-2.5 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium";
const labelClass = "block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1";

interface BaseProps {
  label: string;
  error?: string;
}

export function FormInput({ label, error, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} {...props} />
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function FormSelect({ label, error, children, ...props }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select className={inputClass} {...props}>{children}</select>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function FormTextarea({ label, error, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea className={`${inputClass} resize-none`} {...props} />
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
