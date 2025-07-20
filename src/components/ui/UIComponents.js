import React from 'react';
import { XCircle } from 'lucide-react';
import { colors } from '../../styles/GlobalStyles';

export const LoadingScreen = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{borderColor: colors.primary}}></div>
        <p className="text-white mt-4">{message}</p>
    </div>
);

export const ParticipantRow = ({ participant }) => {
    const statusStyles = {
        active: { icon: '🏃', color: colors.success },
        striked: { icon: '🤔', color: colors.warning },
        eliminated: { icon: '💀', color: colors.danger },
    };
    const { icon, color } = statusStyles[participant.status] || { icon: '?', color: 'gray' };
    return (
        <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
            <div className="flex items-center">
                <span className="text-2xl mr-3">{icon}</span>
                <div>
                    <p className="text-white font-medium">{participant.email.split('@')[0]}</p>
                    <p className="text-sm text-gray-400">{participant.goalDescription}</p>
                </div>
            </div>
            <p className="text-sm font-semibold capitalize" style={{color}}>{participant.status}</p>
        </div>
    );
};

export const ResultCardModal = ({ pact, participants, onClose }) => {
    const winners = participants.filter(p => p.status === 'active' || p.status === 'winner');
    const losers = participants.filter(p => p.status === 'eliminated');
    const totalPot = pact.stakeAmount * pact.participantIds.length;
    const winningsPerWinner = winners.length > 0 ? totalPot / winners.length : 0;
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card-modal max-w-2xl w-full relative p-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XCircle className="w-8 h-8"/></button>
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-white">Pact Complete</h1>
                    <p className="text-lg" style={{color: colors.primary}}>{pact.name}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h2 className="text-2xl font-bold text-center mb-4"><span className="mr-2">👑</span> Winners</h2>
                        {winners.length > 0 ? winners.map(w => (<div key={w.id} className="text-center mb-2 p-3 bg-green-500/10 rounded-md"><p className="font-semibold text-white">{w.email.split('@')[0]}</p><p className="text-green-400 font-bold text-lg">+${winningsPerWinner.toFixed(2)}</p></div>)) : (<p className="text-center text-gray-400">No survivors.</p>)}
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg">
                        <h2 className="text-2xl font-bold text-center mb-4"><span className="mr-2">💀</span> Eliminated</h2>
                         {losers.map(l => (<div key={l.id} className="text-center mb-2 p-3 bg-red-500/10 rounded-md"><p className="font-semibold text-white">{l.email.split('@')[0]}</p><p className="text-red-400 font-bold text-lg">-${pact.stakeAmount}</p></div>))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InputField = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-gray-800 border border-gray-700 rounded-full p-4 focus:ring-2 focus:outline-none" style={{borderColor: colors.border, '--tw-ring-color': colors.primary}}/>
    </div>
);

export const OptionSelector = ({ label, options, selected, onSelect, format }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <div className="grid grid-cols-3 gap-2 bg-gray-800 p-1 rounded-full">
            {options.map(opt => (
                <button key={opt} type="button" onClick={() => onSelect(opt)} className={`p-3 rounded-full font-bold text-md transition-colors ${selected === opt ? 'bg-white text-black' : 'text-white hover:bg-gray-700'}`}>
                    {format(opt)}
                </button>
            ))}
        </div>
    </div>
);
