// InputField.tsx
import React from "react";
import "./InputField.css"

interface InputFieldProps {
  id: string;
  label: string;
  className: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  className,
}: InputFieldProps) => {
  return (
    <div className={className}>
      <input className="input-field" id={id} placeholder=" " required />
      <label className="input-label" htmlFor={id}>{label}</label>
    </div>
  );
};


