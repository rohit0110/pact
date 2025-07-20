import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AppContext } from '../../AppContext';
import { db, appId } from '../../firebase';
import LoadingScreen from '../ui/LoadingScreen';
import NoActivePactScreen from './NoActivePactScreen';
import { Users } from 'lucide-react';
import { colors } from '../../styles/GlobalStyles';

const HomeScreen = () => {
    const { user, setPage, setActivePactId } = useContext(AppContext);
    const [activePacts, setActivePacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const pactsRef = collection(db, "artifacts", appId, "pacts");
        const q = query(pactsRef, where("participantIds", "array-contains", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const pactsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivePacts(pactsData);
            setLoading(false);
        }, (error) => { console.error("Error fetching pacts:", error); setLoading(false); });
        
        return () => unsubscribe();
    }, [user]);

    if (loading) return <LoadingScreen message="Finding your pacts..." />;
    
    const pactsInProgress = activePacts.filter(p => p.status === 'active');
    const pendingPacts = activePacts.filter(p => p.status === 'pending');

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Your Pacts</h1>
                 <button onClick={() => setPage('create')} className="bg-white text-black font-bold py-2 px-5 rounded-full text-md transition-transform transform hover:scale-105">
                    + New Pact
                </button>
            </header>

            {activePacts.length === 0 ? (
                <NoActivePactScreen />
            ) : (
                <>
                    {pactsInProgress.length > 0 && <PactList title="In Progress 🔥" pacts={pactsInProgress} />}
                    {pendingPacts.length > 0 && <PactList title="Waiting for friends... ⏳" pacts={pendingPacts} />}
                </>
            )}
        </div>
    );
};

const PactList = ({ title, pacts }) => {
    const { setPage, setActivePactId } = useContext(AppContext);

    const handlePactClick = (pactId) => {
        setActivePactId(pactId);
        setPage('pact');
    };
    
    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pacts.map(pact => (
                    <div key={pact.id} onClick={() => handlePactClick(pact.id)} className="glass-card p-4 cursor-pointer hover:border-orange-500 transition-colors">
                        <h3 className="font-bold text-xl truncate">{pact.name}</h3>
                        <p className="text-sm" style={{color: colors.primary}}>${pact.stakeAmount} stake</p>
                        <div className="flex items-center text-sm text-gray-400 mt-2">
                            <Users className="w-4 h-4 mr-2" />
                            <span>{pact.participantIds.length} / 4 members</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default HomeScreen;
