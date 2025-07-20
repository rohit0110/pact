import React from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase';
import { colors } from '../../styles/GlobalStyles';

const LoginScreen = () => {
    const handleLogin = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Anonymous sign-in failed:", error);
            alert("Login failed. Please try again.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-5"></div>
            <div className="mb-8 animate-bounce">
                <span className="text-7xl">🚀</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-4">
                PACT
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-xs">The only way to actually do the thing.</p>
            <button
                onClick={handleLogin}
                className="bg-white text-black font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105"
                style={{boxShadow: `0 0 20px ${colors.primary}50`}}
            >
                Let's Go
            </button>
        </div>
    );
};

export default LoginScreen;

