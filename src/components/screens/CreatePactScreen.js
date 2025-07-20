import React, { useState, useContext } from 'react';
import { collection, doc, addDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AppContext } from '../../AppContext';
import { db, appId } from '../../firebase';
import LoadingScreen from '../ui/LoadingScreen';
import InputField from '../ui/InputField';
import OptionSelector from '../ui/OptionSelector';
import { colors } from '../../styles/GlobalStyles';

const CreatePactScreen = () => {
    const { user, setPage, setActivePactId } = useContext(AppContext);
    const [pactName, setPactName] = useState('');
    const [stake, setStake] = useState(25);
    const [duration, setDuration] = useState(7);
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreatePact = async (e) => {
        e.preventDefault();
        if (!pactName || !goal) { alert("Please fill in all fields."); return; }
        setIsLoading(true);
        try {
            const pactsCollectionRef = collection(db, "artifacts", appId, "pacts");
            const pactRef = await addDoc(pactsCollectionRef, { 
                name: pactName, 
                stakeAmount: stake, 
                durationDays: duration, 
                status: 'pending',
                createdBy: user.uid, 
                participantIds: [],
                onChainAddress: `solana-pact-addr-${Math.random().toString(36).substring(2, 12)}`, 
                createdAt: serverTimestamp() 
            });

            const participantRef = doc(db, "artifacts", appId, "pacts", pactRef.id, "participants", user.uid);
            await setDoc(participantRef, {
                uid: user.uid,
                email: user.email,
                goalDescription: goal,
                status: 'active',
                strikes: 0,
                checkins: {}
            });

            await updateDoc(pactRef, {
                participantIds: [user.uid]
            });

            setActivePactId(pactRef.id);
            setPage('pact');
        } catch (error) {
            console.error("Error creating pact:", error);
            alert("Failed to create pact.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen message="Creating your pact..." />;

    return (
        <div className="p-6 max-w-lg mx-auto">
            <button onClick={() => setPage('home')} className="text-gray-400 hover:text-white mb-6">&larr; Back</button>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-8">New Pact</h1>
            <form onSubmit={handleCreatePact} className="space-y-6">
                <InputField label="Pact Name" value={pactName} onChange={setPactName} placeholder="e.g., Gym Rats" />
                <InputField label="Your Daily Goal" value={goal} onChange={setGoal} placeholder="e.g., Go to the gym" />
                <OptionSelector label="Stakes" options={[25, 50, 100]} selected={stake} onSelect={setStake} format={val => `$${val}`} />
                <OptionSelector label="Duration" options={[7, 14]} selected={duration} onSelect={setDuration} format={val => `${val} Days`} />
                <button type="submit" style={{backgroundColor: colors.primary}} className="w-full text-black font-bold py-4 px-6 rounded-full text-xl transition-transform transform hover:scale-105">Create & Stake ${stake} 🚀</button>
            </form>
        </div>
    );
};

export default CreatePactScreen;
