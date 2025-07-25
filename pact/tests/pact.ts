import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { Pact } from "../target/types/pact";

describe("pact", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pact as Program<Pact>;

  // Generate keypairs for all accounts
  const app_vault = anchor.web3.Keypair.generate();
  const player1 = anchor.web3.Keypair.generate();
  const player2 = anchor.web3.Keypair.generate();

  const pactName = "End-to-End Challenge";
  const stake = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);

  // Define all the PDAs that will be used in the test
  let challengePactPDA: anchor.web3.PublicKey;
  let pactVaultPDA: anchor.web3.PublicKey;
  let player1ProfilePDA: anchor.web3.PublicKey;
  let player2ProfilePDA: anchor.web3.PublicKey;
  let player1GoalPDA: anchor.web3.PublicKey;
  let player2GoalPDA: anchor.web3.PublicKey;

  before(async () => {
    // Airdrop SOL to all accounts that will be paying for transactions
    await Promise.all([
        provider.connection.requestAirdrop(app_vault.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(player1.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(player2.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL),
    ].map(async (signaturePromise) => {
        const signature = await signaturePromise;
        await provider.connection.confirmTransaction(signature, "confirmed");
    }));

    // Calculate PDAs
    [challengePactPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("challenge_pact"),
        Buffer.from(pactName),
        player1.publicKey.toBuffer(),
      ],
      program.programId
    );

    [pactVaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pact_vault"), challengePactPDA.toBuffer()],
      program.programId
    );

    [player1ProfilePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player_profile"), player1.publicKey.toBuffer()],
      program.programId
    );

    [player2ProfilePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player_profile"), player2.publicKey.toBuffer()],
      program.programId
    );

    [player1GoalPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("player_pact_profile"),
        player1.publicKey.toBuffer(),
        challengePactPDA.toBuffer(),
      ],
      program.programId
    );

    [player2GoalPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("player_pact_profile"),
        player2.publicKey.toBuffer(),
        challengePactPDA.toBuffer(),
      ],
      program.programId
    );
  });

  it("Initializes player profiles", async () => {
    // Initialize Player 1's Profile
    await program.methods
      .initializePlayerProfile("Player 1")
      .accounts({
        playerProfile: player1ProfilePDA,
        player: player1.publicKey,
        appVault: app_vault.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player1, app_vault])
      .rpc();

    const player1Profile = await program.account.playerProfile.fetch(player1ProfilePDA);
    assert.equal(player1Profile.name, "Player 1");
    assert.isTrue(player1Profile.owner.equals(player1.publicKey));

    // Initialize Player 2's Profile
    await program.methods
      .initializePlayerProfile("Player 2")
      .accounts({
        playerProfile: player2ProfilePDA,
        player: player2.publicKey,
        appVault: app_vault.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player2 ,app_vault])
      .rpc();

    const player2Profile = await program.account.playerProfile.fetch(player2ProfilePDA);
    assert.equal(player2Profile.name, "Player 2");
    assert.isTrue(player2Profile.owner.equals(player2.publicKey));
  });

  it("Initializes a challenge pact", async () => {
    await program.methods
      .initializeChallengePact(
        pactName,
        "A test challenge",
        { dailySteps: {} },
        new anchor.BN(10000),
        { screenTime: {} },
        { greaterThanOrEqual: {} },
        stake
      )
      .accounts({
        challengePact: challengePactPDA,
        player: player1.publicKey,
        playerProfile: player1ProfilePDA,
        appVault: app_vault.publicKey,
        pactVault: pactVaultPDA,
        playerGoal: player1GoalPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([app_vault, player1])
      .rpc();

    const pact = await program.account.challengePact.fetch(challengePactPDA);
    assert.equal(pact.name, pactName);
    assert.isTrue(pact.creator.equals(player1.publicKey));
    assert.equal(pact.participants.length, 1);
  });

  it("Allows a second player to join the pact", async () => {
    await program.methods
      .joinChallengePact()
      .accounts({
        challengePact: challengePactPDA,
        player: player2.publicKey,
        playerProfile: player2ProfilePDA,
        appVault: app_vault.publicKey,
        playerGoal: player2GoalPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([app_vault, player2])
      .rpc();

    const pact = await program.account.challengePact.fetch(challengePactPDA);
    assert.equal(pact.participants.length, 2);
    assert.isTrue(pact.participants[1].equals(player2.publicKey));
  });

  it("Allows both players to stake", async () => {

    //Log the current balances of the players and the app vault
    const player1InitialBalance = await provider.connection.getBalance(player1.publicKey);
    const player2InitialBalance = await provider.connection.getBalance(player2.publicKey);
    const pactVaultInitialBalance = await provider.connection.getBalance(pactVaultPDA);
    console.log("Initial Balances:");
    console.log(`Player 1: ${player1InitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Player 2: ${player2InitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Pact Vault: ${pactVaultInitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Player 1 stakes
    await program.methods
      .stakeAmountForChallengePact(stake)
      .accounts({
        challengePact: challengePactPDA,
        player: player1.publicKey,
        pactVault: pactVaultPDA,
        playerGoal: player1GoalPDA,
        appVault: app_vault.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player1, app_vault])
      .rpc();

    let player1Goal = await program.account.playerGoalForChallengePact.fetch(player1GoalPDA);
    assert.isTrue(player1Goal.hasStaked);

    // Player 2 stakes
    await program.methods
      .stakeAmountForChallengePact(stake)
      .accounts({
        challengePact: challengePactPDA,
        player: player2.publicKey,
        pactVault: pactVaultPDA,
        playerGoal: player2GoalPDA,
        appVault: app_vault.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player2, app_vault])
      .rpc();

    let player2Goal = await program.account.playerGoalForChallengePact.fetch(player2GoalPDA);
    assert.isTrue(player2Goal.hasStaked);

    const pact = await program.account.challengePact.fetch(challengePactPDA);
    assert.isTrue(pact.prizePool.eq(stake.muln(2)));

    // check balances after staking of each player
    const player1FinalBalance = await provider.connection.getBalance(player1.publicKey);
    const player2FinalBalance = await provider.connection.getBalance(player2.publicKey);
    const pactVaultFinalBalance = await provider.connection.getBalance(pactVaultPDA);
    console.log("Final Balances after staking:");
    console.log(`Player 1: ${player1FinalBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Player 2: ${player2FinalBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Pact Vault: ${pactVaultFinalBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

  });

  it("Starts the challenge pact", async () => {
    await program.methods
      .startChallengePact()
      .accounts({
        challengePact: challengePactPDA,
        player: player1.publicKey,
        appVault: app_vault.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: player1GoalPDA, isSigner: false, isWritable: false },
        { pubkey: player2GoalPDA, isSigner: false, isWritable: false },
      ])
      .signers([player1, app_vault])
      .rpc();

    const pact = await program.account.challengePact.fetch(challengePactPDA);
    assert.equal(pact.status.hasOwnProperty("active"), true);
  });

  it("Ends the challenge and distributes funds to the winner", async () => {
    // Log player balances before ending the pact
    const player1InitialBalance = await provider.connection.getBalance(player1.publicKey);
    const player2InitialBalance = await provider.connection.getBalance(player2.publicKey);
    const appVaultInitialBalance = await provider.connection.getBalance(app_vault.publicKey);
    const pactVaultInitialBalance = await provider.connection.getBalance(pactVaultPDA);
    console.log("Balances before ending the pact:");
    console.log(`Player 1: ${player1InitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Player 2: ${player2InitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`App Vault: ${appVaultInitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Pact Vault: ${pactVaultInitialBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    // First, update player 2 to be eliminated
    await program.methods
      .updatePlayerGoal(true, new anchor.BN(new Date().getTime() / 1000))
      .accounts({
          playerGoal: player2GoalPDA,
          challengePact: challengePactPDA,
          player: player2.publicKey,
          appVault: app_vault.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([app_vault])
      .rpc();
      
    const player2Goal = await program.account.playerGoalForChallengePact.fetch(player2GoalPDA);
    assert.isTrue(player2Goal.isEliminated);

    const winnerInitialBalance = await provider.connection.getBalance(player1.publicKey);

    // End the pact, declaring player1 as the winner
    await program.methods
      .endChallengePact()
      .accounts({
        challengePact: challengePactPDA,
        pactVault: pactVaultPDA,
        winner: player1.publicKey,
        appVault: app_vault.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([app_vault])
      .rpc();

    const pact = await program.account.challengePact.fetch(challengePactPDA);
    assert.equal(pact.status.hasOwnProperty("completed"), true);

    const prizePool = pact.prizePool;
    const appCut = prizePool.divn(100);
    const winnerCut = prizePool.sub(appCut);

    const winnerFinalBalance = await provider.connection.getBalance(player1.publicKey);
    const appVaultFinalBalance = await provider.connection.getBalance(app_vault.publicKey);

    // Log final balances
    console.log("Final Balances after ending the pact:");
    console.log(`Winner (Player 1): ${winnerFinalBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`App Vault: ${appVaultFinalBalance / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    // Check winner's balance (it should be initial + winner_cut)
    assert.equal(winnerFinalBalance, winnerInitialBalance + winnerCut.toNumber());
    
    // Check app_vault's balance (it should be initial + app_cut)
    assert.equal(appVaultFinalBalance, appVaultInitialBalance + appCut.toNumber());
  });
});