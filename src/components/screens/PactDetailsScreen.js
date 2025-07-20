import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { AppContext } from '../../AppContext';
import { db, appId } from '../../firebase';
import LoadingScreen from '../ui/LoadingScreen';
import NoActivePactScreen from './NoActivePactScreen';
import PendingPactScreen from './PendingPactScreen';
import ActivePactDashboard from './ActivePactDashboard';

const PactDetailsScreen = () => {
    const { activePactId, setPage } = useContext(AppContext);
    const [pact, setPact] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activePactId) { 
            setPage('home'); 
            return; 
        }
        const pactRef = doc(db, "artifacts", appId, "pacts", activePactId);
        const unsubscribe = onSnapshot(pactRef, (docSnap) => {
            if (docSnap.exists()) {
                setPact({ id: docSnap.id, ...docSnap.data() });
            } else {
                setPage('home');
            }
            setLoading(false);
        }, (error) => { 
            console.error("Error fetching pact details:", error); 
            setLoading(false); 
        });
        return () => unsubscribe();
    }, [activePactId, setPage]);

    if (loading) return <LoadingScreen message="Loading your pact..." />;
    if (!pact) return <NoActivePactScreen />;
    
    if (pact.status === 'pending') {
        return <PendingPactScreen pact={pact} />
    }
    
    return <ActivePactDashboard pact={pact} />;
};

export default PactDetailsScreen;
