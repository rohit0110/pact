import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Pact } from "../target/types/pact";
import { assert } from "chai";

describe("pact", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Pact as Program<Pact>;
  const app_vault = anchor.web3.Keypair.generate();
  const player = anchor.web3.Keypair.generate();

  before(async () => {
    // Airdrop SOL to the app_vault and player accounts
    await program.provider.connection.requestAirdrop(
      app_vault.publicKey,
      100 * anchor.web3.LAMPORTS_PER_SOL
    );
    await program.provider.connection.requestAirdrop(
      player.publicKey,
      100 * anchor.web3.LAMPORTS_PER_SOL
    );
  });

  it("Initializes a challenge pact and creates a vault", async () => {
    const name = "Test Challenge";
    const description = "A test challenge";
    const goalType = { dailySteps: {} };
    const goalValue = new anchor.BN(10000);
    const verificationType = { screenTime: {} };
    const comparisonOperator = { greaterThanOrEqual: {} };
    const stake = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    const prizePool = new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL);

    const [challengePactPDA, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("challenge_pact"),
        Buffer.from(name),
        player.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [pactVaultPDA, __] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pact_vault"), challengePactPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeChallengePact(
        name,
        description,
        goalType,
        goalValue,
        verificationType,
        comparisonOperator,
        stake,
        prizePool
      )
      .accounts({
        challengePact: challengePactPDA,
        player: player.publicKey,
        appVault: app_vault.publicKey,
        pactVault: pactVaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([app_vault, player])
      .rpc();

    // Fetch the created accounts
    const challengePactAccount = await program.account.challengePact.fetch(
      challengePactPDA
    );
    const pactVaultAccount = await program.provider.connection.getAccountInfo(
      pactVaultPDA
    );

    // Assertions
    assert.ok(
      challengePactAccount.creator.equals(player.publicKey),
      "Creator is not the player"
    );
    assert.equal(
      challengePactAccount.name,
      name,
      "Challenge name does not match"
    );
    assert.ok(
      pactVaultAccount.owner.equals(anchor.web3.SystemProgram.programId),
      "Vault owner is not the system program"
    );

    const rent = await program.provider.connection.getMinimumBalanceForRentExemption(0);
    assert.equal(pactVaultAccount.lamports, rent, "Vault does not have rent-exempt balance");
  });
});