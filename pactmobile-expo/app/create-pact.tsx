import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    View, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    ScrollView, 
    Alert,
    Text,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { createPact } from '../services/api/pactService'; // Assuming this path is correct
import { PublicKey } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons'; // A popular icon library for Expo

// --- Gen Z Design System ---
const DesignSystem = {
  colors: {
    background: ['#1a1125', '#3c1842'], // Deep Purple Gradient
    primary: '#ff7e5f', // Electric Orange
    text: '#ffffff',
    textSecondary: '#a9a3b5',
    placeholder: '#a9a3b5',
    inputBackground: 'rgba(255, 255, 255, 0.1)',
    disabled: '#555',
    disabledText: '#888',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  borderRadius: {
    lg: 24,
  },
  typography: {
    // Make sure 'Lexend-Regular', 'Lexend-Bold', 'Lexend-Black' are loaded in your project
    fontFamily: Platform.OS === 'ios' ? 'Lexend' : 'Lexend-Regular', 
    fontWeightBold: '700',
    fontWeightBlack: '900',
  },
};

// --- Data ---
const goals = [
  { label: '🏃 Daily Steps', value: 'dailySteps', tracking: 'Apple Health', emoji: '🏃', permissions: 'Read-only access to your daily step count.' },
  { label: '👟 Daily Run (km)', value: 'dailyRunKm', tracking: 'Strava', emoji: '👟', permissions: 'Read-only access to your recent run activities.' },
  { label: '🔥 Daily Calories Burned', value: 'dailyCaloriesBurned', tracking: 'Apple Health', emoji: '🔥', permissions: 'Read-only access to your daily active energy.' },
  { label: '📱 Daily Screen Time (max)', value: 'dailyScreenTimeMax', tracking: 'Screen Time', emoji: '📱', permissions: 'Read-only access to your daily screen time data.' },
  { label: '🤳 Daily Phone Pickups (max)', value: 'dailyPhonePickupsMax', tracking: 'Screen Time', emoji: '🤳', permissions: 'Read-only access to your daily phone pickup count.' },
  { label: '💻 Daily Github Contribution', value: 'dailyGithubContribution', tracking: 'Github', emoji: '💻', permissions: 'Read-only access to your public commit history.' },
  { label: '🧠 Daily LeetCode Problems', value: 'dailyLeetCodeProblems', tracking: 'LeetCode', emoji: '🧠', permissions: 'Access to scrape your public LeetCode profile.' },
];

const trackingIcons = {
    'Apple Health': 'heart',
    'Strava': 'activity',
    'Screen Time': 'smartphone',
    'Github': 'github',
    'LeetCode': 'code',
};


export default function CreatePactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallets } = useEmbeddedSolanaWallet();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [stake, setStake] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoalSelect = (goal: any) => {
    setSelectedGoal(goal);
  };

  const navigateTo = (step: number) => {
    setCurrentStep(step);
  };
  
  const handleFinalizePact = () => {
      Alert.alert(
          "Pact Created! 🎉",
          "Your invite link is ready. Share it with your friends to start the pact!",
          [{ text: "Awesome!", onPress: () => router.back() }]
      );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>First, choose your goal</Text>
        <View style={{width: '100%'}}>
            {goals.map((goal) => (
                <TouchableOpacity 
                    key={goal.value} 
                    style={[styles.goalCard, selectedGoal?.value === goal.value && styles.goalCardSelected]}
                    onPress={() => handleGoalSelect(goal)}
                >
                    <Text style={styles.goalCardText}>{goal.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
        <TouchableOpacity
            style={[styles.button, !selectedGoal && styles.buttonDisabled]}
            onPress={() => navigateTo(2)}
            disabled={!selectedGoal}
        >
            <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
      <View style={styles.stepContainer}>
          <Text style={styles.emoji}>{selectedGoal?.emoji}</Text>
          <Text style={styles.stepTitle}>{selectedGoal?.label.substring(selectedGoal.label.indexOf(' ') + 1)}</Text>
          <Text style={styles.stepSubtitle}>How much are you staking? 💰</Text>
          <TextInput
            style={styles.stakeInput}
            placeholder="0.5 SOL"
            placeholderTextColor={DesignSystem.colors.placeholder}
            keyboardType="numeric"
            value={stake}
            onChangeText={setStake}
          />
          <TouchableOpacity
            style={[styles.button, !stake && styles.buttonDisabled]}
            onPress={() => navigateTo(3)}
            disabled={!stake}
        >
            <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
  );

  const renderStep3 = () => (
      <View style={styles.stepContainer}>
          <View style={styles.trackingIconContainer}>
              <Feather name={trackingIcons[selectedGoal?.tracking] || 'help-circle'} size={32} color={DesignSystem.colors.primary} />
          </View>
          <Text style={styles.stepTitle}>Connect to Track</Text>
          <Text style={styles.stepDescription}>
              To automatically track your progress for <Text style={{fontWeight: 'bold'}}>{selectedGoal?.label.substring(selectedGoal.label.indexOf(' ') + 1)}</Text>, we need to connect to <Text style={{fontWeight: 'bold'}}>{selectedGoal?.tracking}</Text>.
          </Text>
          <View style={styles.permissionsBox}>
              <Text style={styles.permissionsTitle}>Permissions we'll ask for:</Text>
              <Text style={styles.permissionsText}>{selectedGoal?.permissions}</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigateTo(4)}
          >
            <Feather name={trackingIcons[selectedGoal?.tracking] || 'help-circle'} size={20} color={DesignSystem.colors.text} style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Connect {selectedGoal?.tracking}</Text>
        </TouchableOpacity>
      </View>
  );
  
  const renderStep4 = () => (
      <View style={styles.stepContainer}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.stepTitle}>You're all set!</Text>
          <Text style={styles.stepDescription}>
              Now, invite your friends to the pact. It goes live after the first person joins.
          </Text>
          <View style={styles.inviteLinkContainer}>
              <Text style={styles.inviteLinkText} numberOfLines={1}>pact.app/invite/aB1c2D3e</Text>
              <TouchableOpacity>
                  <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleFinalizePact}
          >
            <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
  );

  return (
    <LinearGradient colors={DesignSystem.colors.background} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, {paddingTop: insets.top + 20}]}>
        <View style={styles.header}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={() => navigateTo(currentStep - 1)} style={styles.backButton}>
              <Feather name="chevron-left" size={28} color={DesignSystem.colors.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>New Pact 🤙</Text>
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.lg,
    position: 'relative',
    height: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontSize: 24,
    color: DesignSystem.colors.text,
    fontFamily: DesignSystem.typography.fontFamily,
    fontWeight: DesignSystem.typography.fontWeightBold,
  },
  stepContainer: {
    alignItems: 'center',
    padding: DesignSystem.spacing.sm,
  },
  stepTitle: {
    fontSize: 22,
    color: DesignSystem.colors.text,
    fontFamily: DesignSystem.typography.fontFamily,
    fontWeight: DesignSystem.typography.fontWeightBold,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  stepSubtitle: {
    fontSize: 18,
    color: DesignSystem.colors.text,
    fontFamily: DesignSystem.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
   stepDescription: {
    fontSize: 16,
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 24,
  },
  goalCard: {
    width: '100%',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.inputBackground,
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: DesignSystem.colors.primary,
    transform: [{scale: 1.02}],
  },
  goalCardText: {
    color: DesignSystem.colors.text,
    fontSize: 18,
    fontFamily: DesignSystem.typography.fontFamily,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DesignSystem.spacing.lg,
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: DesignSystem.colors.disabled,
  },
  buttonText: {
    color: DesignSystem.colors.text,
    fontSize: 18,
    fontFamily: DesignSystem.typography.fontFamily,
    fontWeight: DesignSystem.typography.fontWeightBold,
  },
  emoji: {
      fontSize: 60,
      marginBottom: DesignSystem.spacing.md,
  },
  stakeInput: {
      width: '80%',
      padding: DesignSystem.spacing.md,
      backgroundColor: DesignSystem.colors.inputBackground,
      borderRadius: DesignSystem.borderRadius.lg,
      color: DesignSystem.colors.text,
      fontSize: 24,
      fontFamily: DesignSystem.typography.fontFamily,
      fontWeight: DesignSystem.typography.fontWeightBold,
      textAlign: 'center',
  },
  trackingIconContainer: {
      width: 80,
      height: 80,
      backgroundColor: DesignSystem.colors.inputBackground,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: DesignSystem.spacing.md,
  },
  permissionsBox: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      padding: DesignSystem.spacing.md,
      borderRadius: DesignSystem.borderRadius.lg,
      marginBottom: DesignSystem.spacing.lg,
  },
  permissionsTitle: {
      color: DesignSystem.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  permissionsText: {
      color: DesignSystem.colors.textSecondary,
      fontSize: 12,
  },
  inviteLinkContainer: {
      width: '100%',
      padding: DesignSystem.spacing.md,
      backgroundColor: DesignSystem.colors.inputBackground,
      borderRadius: DesignSystem.borderRadius.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',git p
      alignItems: 'center',
  },
  inviteLinkText: {
      color: DesignSystem.colors.textSecondary,
      flex: 1,
  },
  copyText: {
      color: DesignSystem.colors.primary,
      fontWeight: 'bold',
  }
});
