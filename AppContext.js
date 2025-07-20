import React, { useState, useEffect, createContext } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId } from './firebase';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState('login');
    const [activePactId, setActivePactId] = useState(null);
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const userRef = doc(db, "artifacts", appId, "users", firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || `anon-${firebaseUser.uid.substring(0, 6)}`,
                            createdAt: serverTimestamp(),
                            twitterHandle: null,
                            publicAddress: `solana-addr-${firebaseUser.uid}`
                        });
                    }
                    const userData = (await getDoc(userRef)).data();
                    setUser({ ...firebaseUser, ...userData });
                    setPage('home');
                } else {
                    setUser(null);
                    setPage('login');
                }
            } catch (error) {
                console.error("Error during auth state change:", error);
            } finally {
                setLoading(false);
            }
        });

        const initialAuth = async () => {
             if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                try {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } catch (error) {
                    console.error("Error signing in with custom token, falling back to anonymous:", error);
                    await signInAnonymously(auth);
                }
            } else {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            }
        };
        initialAuth();

        return () => unsubscribe();
    }, []);

    const value = { user, loading, page, setPage, activePactId, setActivePactId, inviteCode, setInviteCode };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

3. src/App.js
This is the main entry point of your application.

import React from 'react';
import { AppProvider } from './AppContext';
import PageNavigator from './components/PageNavigator';
import GlobalStyles, { colors } from './styles/GlobalStyles';

function App() {
    return (
        <AppProvider>
            <GlobalStyles />
            <div className="min-h-screen font-lexend" style={{ backgroundColor: colors.background, color: colors.text }}>
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-20"></div>
                <div className="relative z-10">
                    <PageNavigator />
                </div>
            </div>
        </AppProvider>
    );
}

export default App;
