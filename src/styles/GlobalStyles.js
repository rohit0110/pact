import React from 'react';

export const colors = {
    background: '#111111',
    primary: '#FF8C00', // Vibrant Orange
    text: '#FFFFFF',
    textSecondary: '#a1a1aa',
    surface: 'rgba(39, 39, 42, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
};

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700;900&display=swap');
        body, .font-lexend {
            font-family: 'Lexend', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .bg-grid-pattern {
            background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 3rem 3rem;
        }
        .glass-card {
            background-color: ${colors.surface};
            border: 1px solid ${colors.border};
            border-radius: 1.5rem;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        .glass-card-modal {
             background-color: rgba(30, 30, 32, 0.7);
             border: 1px solid rgba(255, 255, 255, 0.15);
             border-radius: 1.5rem;
             backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
    `}</style>
);

export default GlobalStyles;
