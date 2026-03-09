import React from 'react';

interface GeminiIconProps {
    size?: number;
    isSelected?: boolean;
}

const GeminiIcon: React.FC<GeminiIconProps> = ({ size = 24, isSelected = false }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="gemini-icon"
            style={{
                filter: isSelected ? 'drop-shadow(0 0 2px rgba(155, 114, 203, 0.3))' : 'none',
                transition: 'all 0.4s ease'
            }}
        >
            <defs>
                <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="40%" stopColor="#9B72CB" />
                    <stop offset="70%" stopColor="#D96570" />
                    <stop offset="100%" stopColor="#F48120" />
                </linearGradient>
            </defs>
            {/* Large Sparkle */}
            <path
                d="M12 3C12 3 12.5 8 15 10.5C17.5 13 22.5 13.5 22.5 13.5C22.5 13.5 17.5 14 15 16.5C12.5 19 12 24 12 24C12 24 11.5 19 9 16.5C6.5 14 1.5 13.5 1.5 13.5C1.5 13.5 6.5 13 9 10.5C11.5 8 12 3 12 3Z"
                fill={isSelected ? "url(#gemini-gradient)" : "transparent"}
                stroke={isSelected ? "none" : "currentColor"}
                strokeWidth={isSelected ? 0 : 1.5}
                opacity={isSelected ? 1 : 0.6}
                style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    scale: isSelected ? '1' : '0.85',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            />
            {/* Small Sparkle */}
            <path
                d="M6.5 4C6.5 4 6.75 6 7.75 7C8.75 8 10.75 8.25 10.75 8.25C10.75 8.25 8.75 8.5 7.75 9.5C6.75 10.5 6.5 12.5 6.5 12.5C6.5 12.5 6.25 10.5 5.25 9.5C4.25 8.5 2.25 8.25 2.25 8.25C2.25 8.25 4.25 8 5.25 7C6.25 6 6.5 4 6.5 4Z"
                fill={isSelected ? "url(#gemini-gradient)" : "transparent"}
                stroke={isSelected ? "none" : "currentColor"}
                strokeWidth={isSelected ? 0 : 1.2}
                opacity={isSelected ? 0.8 : 0.4}
                style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    scale: isSelected ? '1' : '0.75',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transitionDelay: isSelected ? '0.1s' : '0s'
                }}
            />
        </svg>
    );
};

export default GeminiIcon;
