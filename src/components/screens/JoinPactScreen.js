import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { AppContext } from '../../AppContext';
import { db, appId } from '../../firebase';
import LoadingScreen from '../ui/LoadingScreen';
import InputField from '../ui/InputField';
import { Users, Calendar, DollarSign } from 'lucide-react';
import { colors } from '../../styles/GlobalStyles';

const JoinPactScreen = () => {
    const { user, setPage, inviteCode, setInviteCode, setActivePactId } = useContext(AppContext);
    const [pactData, setPactData] = useState(null);
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const codeFromUrl = new URLSearchParams(window.location.search).get('join');
        if (codeFromUrl && !inviteCode) setInviteCode(codeFromUrl);
    }, [inviteCode, setInviteCode]);

    const handleFindPact = async () => {
        if (!inviteCode) { setError("Please enter an invite code."); return; }
        setIsLoading(true); setError('');
        try {
            const pactRef = doc(db, "artifacts", appId, "pacts", inviteCode);
            const pactSnap = await getDoc(pactRef);
            if (pactSnap.exists()) setPactData({ id: pactSnap.id, ...pactSnap.data() });
            else setError("Pact not found. Check the code.");
        } catch (e) { setError("Error finding pact."); console.error(e); } 
        finally { setIsLoading(false); }
    };

    const handleJoin = async () => {
        if (!goal) { alert("Please define your goal."); return; }
        setIsLoading(true);
        try {
            await handleJoinPactLogic(pactData.id, user, goal);
            setActivePactId(pactData.id);
            setPage('pact');
        } catch (error) { alert(`Failed to join pact: ${error.message}`); console.error(error); } 
        finally { setIsLoading(false); }
    };
    
    const handleJoinPactLogic = async (pactId, user, goal) => {
        const pactRef = doc(db, "artifacts", appId, "pacts", pactId);
        const pactSnap = await getDoc(pactRef);
        if (!pactSnap.exists()) throw new Error("Pact does not exist.");
        const pactData = pactSnap.data();
        if (pactData.participantIds.includes(user.uid)) { console.log("User already in this pact."); return; }
        if (pactData.participantIds.length >= 4) throw new Error("This pact is already full.");
    
        const batch = writeBatch(db);
        const participantRef = doc(db, "artifacts", appId, "pacts", pactId, "participants", user.uid);
        batch.set(participantRef, { uid: user.uid, email: user.email, goalDescription: goal, status: 'active', strikes: 0, checkins: {} });
    
        const updatedParticipantIds = [...pactData.participantIds, user.uid];
        const updatePayload = { participantIds: updatedParticipantIds };
        
        if (updatedParticipantIds.length === 2 && pactData.status === 'pending') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + pactData.durationDays);
            updatePayload.status = 'active';
            updatePayload.startDate = startDate;
            updatePayload.endDate = endDate;
        }
        batch.update(pactRef, updatePayload);
        await batch.commit();
    };

    if (isLoading) return <LoadingScreen message="Joining pact..." />;

    if (pactData) {
        return (
            <div className="p-6 max-w-lg mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">Joining "{pactData.name}"</h1>
                <div className="glass-card p-4 mb-6 text-center space-y-2">
                    <p><DollarSign className="inline w-4 h-4 mr-2"/>Stakes: ${pactData.stakeAmount}</p>
                    <p><Calendar className="inline w-4 h-4 mr-2"/>Duration: {pactData.durationDays} days</p>
                    <p><Users className="inline w-4 h-4 mr-2"/>Members: {pactData.participantIds.length} / 4</p>
                </div>
                <InputField label="Your Daily Goal" value={goal} onChange={setGoal} placeholder="e.g., Read 20 pages" />
                <button onClick={handleJoin} style={{backgroundColor: colors.primary}} className="w-full mt-6 text-black font-bold py-4 px-6 rounded-full text-xl transition-transform transform hover:scale-105">Join & Stake ${pactData.stakeAmount} ✨</button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-lg mx-auto">
            <button onClick={() => setPage('home')} className="text-gray-400 hover:text-white mb-6">&larr; Back</button>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-8">Join a Pact</h1>
            <div className="space-y-4">
                <InputField label="Invite Code" value={inviteCode} onChange={setInviteCode} placeholder="Paste code here" />
                {error && <p className="text-red-400">{error}</p>}
                <button onClick={handleFindPact} className="w-full bg-white text-black font-bold py-3 px-6 rounded-full text-lg">Find Pact</button>
            </div>
        </div>
    );
};

export default JoinPactScreen;
