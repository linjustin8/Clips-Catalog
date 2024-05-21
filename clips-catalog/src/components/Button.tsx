// Button.tsx
import React from 'react'

interface IButtonProps {
    text: string
    onClick: () => void
}

const Button: React.FC<IButtonProps> = ({ text, onClick }) => {
    return (
        <button onClick={onClick}>
            {text}
        </button>
    )
}

export default Button