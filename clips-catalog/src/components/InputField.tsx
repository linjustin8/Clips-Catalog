// InputField.tsx
import React from "react";

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
      <label htmlFor={id}>{label}</label>
      <input id={id} required />
    </div>
  );
};
