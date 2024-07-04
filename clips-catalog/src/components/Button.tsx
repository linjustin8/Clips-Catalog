// Button.tsx
import React from "react";
import "./Button.css";

interface IButtonProps {
  text: string;
  onClick: () => void;
}

const Button: React.FC<IButtonProps> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>;
};

export default Button;
