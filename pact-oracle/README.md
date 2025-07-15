# Pact Oracle Service

This service is a trusted, off-chain oracle responsible for monitoring the status of participants in active challenge pacts. It periodically checks external data sources to verify if participants are meeting their goals and updates their on-chain status accordingly.

---

## Setup and Installation

1.  **Install Dependencies:**
    Navigate to the `pact-oracle` directory and install the required Node.js packages.
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    This project uses a `.env` file to manage sensitive information. Create a `.env` file in the root of the `pact-oracle` directory by copying the example:
    ```bash
    cp .env.example .env
    ```
    You will need to fill out the following variables:

    *   `SOLANA_CLUSTER_URL`: The RPC endpoint for the Solana cluster you want to connect to (e.g., `http://127.0.0.1:8899` for a local validator).
    *   `ORACLE_PRIVATE_KEY`: The private key of the oracle's wallet, formatted as a byte array (e.g., `[1,2,3,...,64]`).

3.  **Generate an Oracle Keypair:**
    The oracle needs its own Solana wallet to sign transactions (like updating a player's status). You can generate a new keypair by running:
    ```bash
    solana-keygen new --outfile ./oracle-keypair.json
    ```
    This will create an `oracle-keypair.json` file. To get the private key for your `.env` file
    Copy the byte array from the "Private Key" field and paste it into the `ORACLE_PRIVATE_KEY` variable in your `.env` file.

---

## Running the Service

Once the setup is complete, you can start the oracle service.

*   **Development Mode:**
    To run the server with hot-reloading (which automatically restarts when you change a file), use:
    ```bash
    npm run start
    ```

*   **Production Mode:**
    For a production environment, you should first build the TypeScript code into JavaScript and then run the compiled output.
    ```bash
    # 1. Build the project
    npm run build

    # 2. Run the compiled server
    npm run serve
    ```

When the server is running, it will log a message to the console every minute as the cron job executes its check. You can view the server's status by visiting `http://localhost:3000` in your browser.
