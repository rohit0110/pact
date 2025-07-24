# Pact Protocol

Welcome to the Pact Protocol monorepo. This project contains the smart contracts, oracle service, and mobile application for a decentralized platform where users can create and participate in challenges with crypto-backed incentives.

## Project Structure

This repository is organized into three main components:

-   **`pact/`**: The core Solana smart contract, written in Rust using the Anchor framework. This handles all on-chain logic for creating, joining, and managing pacts.
-   **`pact-oracle/`**: A Node.js service that acts as an off-chain oracle. It is responsible for monitoring real-world data, evaluating pact conditions, and instructing the smart contract on outcomes.
-   **`pactmobile-expo/`**: The user-facing mobile application built with React Native and Expo. It provides the interface for users to interact with the Pact Protocol.

---

## Getting Started

Follow these instructions to get the entire Pact ecosystem running locally for development.

### Prerequisites

Before you begin, ensure you have the following tools installed and configured:

-   **Node.js** (v18 or higher recommended)
-   **Yarn** or **npm**
-   **Rust** & **Cargo**
-   **Solana CLI** (latest version)
-   **Anchor CLI** (`avm install 0.29.0` and `avm use 0.29.0`)
-   **Expo CLI** (`npm install -g expo-cli`)

### Development Setup

It is recommended to work on a dedicated feature branch. From the `master` branch, run:

```bash
git checkout -b your-feature-name
```

To run the full stack, you will need four terminal windows.

**Terminal 1: Solana Validator**
This terminal runs the local Solana blockchain.

```bash
solana-test-validator
```

**Terminal 2: Smart Contract Deployment**
This terminal is for building and deploying the on-chain program.

1.  Navigate to the contract directory:
    ```bash
    cd pact
    ```
2.  Build the Anchor program:
    ```bash
    anchor build
    ```
3.  Deploy the program to your local validator:
    ```bash
    anchor deploy
    ```
    *(Note: Ensure you are using Anchor version 0.29.0, as specified in the original setup)*

**Terminal 3: Oracle Service**
This terminal runs the off-chain oracle.

1.  Navigate to the oracle directory:
    ```bash
    cd pact-oracle
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the oracle service:
    ```bash
    npm run start
    ```

**Terminal 4: Mobile Application**
This terminal runs the Expo development server for the mobile app.

1.  Navigate to the mobile app directory:
    ```bash
    cd pactmobile-expo
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Expo development server:
    ```bash
    npx expo start
    ```
This will open the Expo developer tools, allowing you to launch the app in an iOS Simulator, Android Emulator, or on a physical device using the Expo Go app.