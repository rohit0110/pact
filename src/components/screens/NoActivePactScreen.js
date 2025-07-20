import React, { useContext } from 'react';
import { AppContext } from '../../AppContext';

const NoActivePactScreen = () => {
    const { setPage, setInviteCode } = useContext(AppContext);
    return (
        <div className="text-center py-16">
            <span className="text-6xl mb-6 block">👀</span>
            <h2 className="text-3xl font-bold text-white mb-4">No active pacts</h2>
            <p className="text-gray-400 mb-10 max-w-md mx-auto">Create a pact and invite your friends, or join one with a code.</p>
            <button onClick={() => { setInviteCode(''); setPage('join'); }} className="bg-gray-800 text-white font-bold py-3 px-6 rounded-full text-lg transition-transform transform hover:scale-105">
                Join with Code
            </button>
        </div>
    );
};

export default NoActivePactScreen;
