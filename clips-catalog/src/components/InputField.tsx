// InputField.tsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import "./InputField.css";

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  valid?: boolean; // checks validity of input
  type?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  valid = true,
  type = "text",
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleHidden = () => {
    setShowPassword((showPassword) => !showPassword);
  };

  return (
    <div className="auth-input-container">
      <input
        className={`input-field ${
          type === "password" && !showPassword ? "password-input" : ""
        } ${valid ? "" : "invalid-input"}`}
        id={id}
        placeholder=""
        required
        value={value}
        onChange={onChange}
        type={showPassword && type === "password" ? "text" : type}
      />
      <label
        className={`input-label ${valid ? "" : "invalid-label"}`}
        htmlFor={id}
      >
        {label}
      </label>
      {type === "password" && (
        <button
          type="button"
          className={`show-password-container ${valid ? "" : "invalid-button"}`}
          onClick={toggleHidden}
        >
          <FontAwesomeIcon
            className="show-password-icon"
            icon={showPassword ? faEyeSlash : faEye}
          />
        </button>
      )}
    </div>
  );
};
