// InputField.tsx
import React from "react";
import "./InputField.css";

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  type = "text",
}: InputFieldProps) => {
  return (
    <div className="auth-input-container">
      {type != "password" ? (
        <input
        className="input-field"
        id={id}
        placeholder=" "
        required
        value = {value}
        onChange={onChange}
        type={type}
      />
      ) : (
        <div className="password-input">
          <input
            className="input-field"
            id={id}
            placeholder=" "
            required
            value = {value}
            onChange={onChange}
            type={type}
          />
          <button className="show-password"></button>
        </div>
      )}
      
      <label className="input-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
};
