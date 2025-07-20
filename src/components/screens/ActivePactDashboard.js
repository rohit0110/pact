import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { AppContext } from '../../AppContext';
import { db, appId } from '../../firebase';
import LoadingScreen from '../ui/LoadingScreen';
import ResultCardModal from '../ui/ResultCardModal';
import ParticipantRow from '../ui/ParticipantRow';
import { XCircle } from 'lucide-react';
import { colors } from '../../styles/GlobalStyles';

const ActivePactDashboard = ({ pact }) => {
    const { user, setPage } = useContext(AppContext);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResultCard, setShowResultCard] = useState(false);

    const currentUserParticipant = participants.find(p => p.uid === user.uid);
    const today = new Date().toISOString().split('T')[0];
    const hasCheckedInToday = currentUserParticipant?.checkins?.[today];
    const isEliminated = currentUserParticipant?.status === 'eliminated';
    
    const daysLeft = pact.endDate ? Math.ceil((pact.endDate.toDate() - new Date()) / (1000 * 60 * 60 * 24)) : pact.durationDays;
    const isCompleted = pact.status === 'completed' || daysLeft <= 0;

    useEffect(() => {
        const participantsRef = collection(db, "artifacts", appId, "pacts", pact.id, "participants");
        const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
            setParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => { console.error("Error fetching participants:", error); setLoading(false); });
        return () => unsubscribe();
    }, [pact.id]);
    
    const handleCheckIn = async () => {
        if (!currentUserParticipant) return;
        try {
            const participantRef = doc(db, "artifacts", appId, "pacts", pact.id, "participants", currentUserParticipant.id);
            await updateDoc(participantRef, { [`checkins.${today}`]: true });
        } catch (error) { console.error("Error checking in:", error); alert("Failed to check in."); }
    };
    
    if (loading) return <LoadingScreen message="Loading your pact..." />;
    if (isCompleted && !showResultCard) setShowResultCard(true);
    
    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            {showResultCard && <ResultCardModal pact={pact} participants={participants} onClose={() => setShowResultCard(false)} />}
            
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{pact.name}</h1>
                    <p style={{ color: colors.primary }}>{isCompleted ? "Pact Complete!" : `${daysLeft} days left`}</p>
                </div>
                <button onClick={() => setPage('home')} className="text-gray-400 hover:text-white text-sm">&larr; Home</button>
            </header>

            <div className="glass-card mb-6 p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-200">Your Goal</h2>
                <div className="flex items-center justify-between">
                    <p className="text-lg text-white">{currentUserParticipant?.goalDescription}</p>
                    {!isEliminated && !isCompleted && (
                        <button onClick={handleCheckIn} disabled={hasCheckedInToday} className={`font-bold py-3 px-6 rounded-full transition-all text-black ${hasCheckedInToday ? 'bg-green-400 cursor-not-allowed' : 'bg-white hover:scale-105'}`}>
                            {hasCheckedInToday ? 'Done' : 'Did it ✅'}
                        </button>
                    )}
                </div>
                 {currentUserParticipant?.strikes > 0 && !isEliminated && (
                    <div className="mt-4 text-yellow-400 flex items-center text-sm"><XCircle className="w-5 h-5 mr-2" />You have {currentUserParticipant.strikes} strike. One more and you're out!</div>
                )}
            </div>

            <div className="glass-card mb-6 p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-200">Group Status</h2>
                <div className="space-y-3">
                    {participants.map(p => <ParticipantRow key={p.id} participant={p} />)}
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="glass-card p-4"><p className="text-gray-400 text-sm">Total Pot</p><p className="text-3xl font-bold text-white">${pact.stakeAmount * pact.participantIds.length}</p></div>
                <div className="glass-card p-4"><p className="text-gray-400 text-sm">Survivors</p><p className="text-3xl font-bold text-white">{participants.filter(p => p.status === 'active').length}/{pact.participantIds.length}</p></div>
                <div className="glass-card p-4"><p className="text-gray-400 text-sm">Stakes</p><p className="text-3xl font-bold text-white">${pact.stakeAmount}</p></div>
            </div>
        </div>
    );
};

export default ActivePactDashboard;
