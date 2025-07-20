import React, { useState, useContext } from 'react';
import { AppContext } from '../../AppContext';
import { PartyPopper, CheckCircle, Copy, ArrowRight } from 'lucide-react';
import { colors } from '../../styles/GlobalStyles';

const PendingPactScreen = ({ pact }) => {
    const { setPage } = useContext(AppContext);
    const inviteLink = `${window.location.origin}?join=${pact.id}`;
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => { 
        navigator.clipboard.writeText(inviteLink); 
        setCopied(true); 
        setTimeout(() => setCopied(false), 2000); 
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <PartyPopper className="w-20 h-20 mb-6" style={{color: colors.primary}}/>
            <h1 className="text-4xl font-bold text-white mb-4">Pact Created!</h1>
            <p className="text-gray-400 mb-2 max-w-md">Your pact <span className="font-bold text-white">"{pact.name}"</span> is waiting for at least one more person to join.</p>
            <p className="text-gray-400 mb-8 max-w-md">The challenge starts when the second person joins. ⏳</p>
            
            <div className="w-full max-w-md glass-card p-2 flex items-center justify-between mb-8">
                <p className="text-gray-300 truncate ml-2">{inviteLink}</p>
                <button onClick={handleCopy} className="p-2 bg-white/10 rounded-md hover:bg-white/20">
                    {copied ? <CheckCircle className="w-5 h-5" style={{color: colors.primary}}/> : <Copy className="w-5 h-5 text-white"/>}
                </button>
            </div>
            <button onClick={() => setPage('home')} className="bg-white text-black font-bold py-3 px-8 rounded-full text-lg flex items-center">Back to Home <ArrowRight className="w-5 h-5 ml-2" /></button>
        </div>
    );
};

export default PendingPactScreen
