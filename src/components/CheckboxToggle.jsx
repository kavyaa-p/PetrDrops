import React, { useState } from "react";

const CheckboxToggle = ({ checked, onChange }) => {
    const [isChecked, setIsChecked] = useState(checked || false);

    const handleToggle = () => {
        const newValue = !isChecked;
        setIsChecked(newValue);
        if (onChange) {
            onChange(newValue); // Notify parent component of the new state
        }
    };

    return (
        <div
            onClick={handleToggle}
            style={{ cursor: "pointer", display: "inline-block" }}
            aria-label="Checkbox Toggle"
            role="checkbox"
            aria-checked={isChecked}
        >
            {isChecked ? (
                // Solid checkbox SVG
                <svg
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    color="#000000"
                    strokeWidth="1.5"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.6 2.25C2.85442 2.25 2.25 2.85441 2.25 3.6V20.4C2.25 21.1456 2.85441 21.75 3.6 21.75H20.4C21.1456 21.75 21.75 21.1456 21.75 20.4V3.6C21.75 2.85442 21.1456 2.25 20.4 2.25H3.6ZM17.5303 9.03033C17.8232 8.73744 17.8232 8.26256 17.5303 7.96967C17.2374 7.67678 16.7626 7.67678 16.4697 7.96967L10 14.4393L7.53033 11.9697C7.23744 11.6768 6.76256 11.6768 6.46967 11.9697C6.17678 12.2626 6.17678 12.7374 6.46967 13.0303L9.46967 16.0303C9.76256 16.3232 10.2374 16.3232 10.5303 16.0303L17.5303 9.03033Z"
                        fill="#000000"
                    ></path>
                </svg>
            ) : (
                // Empty checkbox SVG
                <svg
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    color="#000000"
                >
                    <path
                        d="M3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z"
                        stroke="#000000"
                        strokeWidth="1.5"
                    ></path>
                    <path
                        d="M7 12.5L10 15.5L17 8.5"
                        stroke="#000000"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    ></path>
                </svg>
            )}
        </div>
    );
};

export default CheckboxToggle;