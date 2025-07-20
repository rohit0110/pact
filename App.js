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
