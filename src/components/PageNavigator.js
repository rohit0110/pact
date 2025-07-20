import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CreatePactScreen from './screens/CreatePactScreen';
import JoinPactScreen from './screens/JoinPactScreen';
import PactDetailsScreen from './screens/PactDetailsScreen';
import LoadingScreen from './ui/LoadingScreen';

const PageNavigator = () => {
    const { page, loading } = useContext(AppContext);

    if (loading) {
        return <LoadingScreen message="Initializing Pact..." />;
    }

    const pages = {
        login: <LoginScreen />,
        home: <HomeScreen />,
        create: <CreatePactScreen />,
        join: <JoinPactScreen />,
        pact: <PactDetailsScreen />,
    };

    return (
        <div key={page} className="animate-fade-in">
            {pages[page] || <LoginScreen />}
        </div>
    );
};

export default PageNavigator;
