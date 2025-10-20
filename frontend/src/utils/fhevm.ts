// Use global SDK from ESM CDN
declare global {
  interface Window {
    ZamaSDK: any;
  }
}

let fhevmInstance: any = null;

// Helper function to convert Uint8Array to hex string
function toHexString(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Wait for ZamaSDK to load from CDN
async function waitForSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (window.ZamaSDK) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.ZamaSDK) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error('❌ Timeout waiting for ZamaSDK to load');
      }, 10000);
    }
  });
}

export async function getFhevmInstance(): Promise<any> {
  if (!fhevmInstance) {
    try {
      // Wait for CDN to load
      await waitForSDK();
      console.log('✅ ZamaSDK loaded from CDN');

      // Initialize SDK first (loads WASM)
      await window.ZamaSDK.initSDK();
      console.log('✅ SDK initialized');

      // Get SepoliaConfig and merge with network provider
      const config = window.ZamaSDK.SepoliaConfig;
      console.log('📋 SepoliaConfig:', config);
      
      // Create instance using SepoliaConfig
      fhevmInstance = await window.ZamaSDK.createInstance(config);
      console.log('✅ FHEVM instance created successfully!', fhevmInstance);
    } catch (error) {
      console.error('❌ Failed to create FHEVM instance:', error);
      throw error;
    }
  }

  return fhevmInstance;
}

export async function encryptVote(
  vote: 0 | 1,
  contractAddress: string,
  userAddress: string
): Promise<{ encryptedData: string; inputProof: string }> {
  try {
    console.log('🔐 Starting vote encryption...', { vote, contractAddress, userAddress });
    
    const instance = await getFhevmInstance();
    console.log('✅ Got FHEVM instance');

    const input = instance.createEncryptedInput(contractAddress, userAddress);
    console.log('✅ Created encrypted input');
    
    input.add32(vote);
    console.log('✅ Added vote value');

    const encryptedInput = await input.encrypt();
    console.log('✅ Encrypted successfully', encryptedInput);

    return {
      encryptedData: toHexString(encryptedInput.handles[0]),
      inputProof: toHexString(encryptedInput.inputProof),
    };
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw error;
  }
}

export async function decryptVotes(
  yesVoteHandle: bigint,
  noVoteHandle: bigint,
  contractAddress: string,
  userAddress: string,
  signer: any
): Promise<{ yesVotes: number; noVotes: number }> {
  // Validate inputs
  if (!userAddress || typeof userAddress !== 'string' || !userAddress.startsWith('0x') || userAddress.length !== 42) {
    throw new Error(`Invalid user address format: ${userAddress} (length: ${userAddress?.length})`);
  }
  
  if (!contractAddress || typeof contractAddress !== 'string' || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    throw new Error(`Invalid contract address format: ${contractAddress} (length: ${contractAddress?.length})`);
  }
  
  try {
    console.log('🔓 Starting vote decryption...');
    console.log('  User Address:', userAddress);
    console.log('  Contract Address:', contractAddress);
    console.log('  Yes Handle:', yesVoteHandle.toString());
    console.log('  No Handle:', noVoteHandle.toString());
    
    const instance = await getFhevmInstance();
    console.log('✅ Got FHEVM instance for decryption');
    
    // Generate keypair for user decryption
    const keypair = instance.generateKeypair();
    console.log('✅ Generated keypair');
    
    // Convert bigint handles to proper hex format (no 0x prefix for SDK)
    // The SDK expects 64-character hex strings WITHOUT the 0x prefix
    const yesHandleStr = yesVoteHandle.toString(16).padStart(64, '0');
    const noHandleStr = noVoteHandle.toString(16).padStart(64, '0');
    
    console.log('📝 Handle formats:', { 
      yesHandleStr, 
      noHandleStr,
      yesLength: yesHandleStr.length,
      noLength: noHandleStr.length
    });
    
    const handleContractPairs = [
      { handle: yesHandleStr, contractAddress },
      { handle: noHandleStr, contractAddress }
    ];
    
    // Create timestamp and duration for EIP712
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '1'; // 1 day validity (24 hours - much faster than 10 days)
    const contractAddresses = [contractAddress];
    
    console.log('✅ Prepared decryption parameters');
    
    // Create EIP-712 with correct parameters (publicKey, addresses, timestamp, duration)
    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );
    console.log('✅ Created EIP712 payload');
    
    // Sign the EIP-712 message using the official format from Zama docs
    console.log('📝 Signing EIP-712 message...');
    console.log('  Signer address:', userAddress);
    console.log('  Address length:', userAddress.length);
    
    // Use ethers signer.signTypedData() instead of window.ethereum as per official docs
    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );
    
    if (!signature || typeof signature !== 'string') {
      throw new Error(`Invalid signature received: ${signature}`);
    }
    
    console.log('✅ Got signature:', signature.substring(0, 10) + '...' + signature.substring(signature.length - 8));

    // Perform user decryption using the official format from Zama docs
    console.log('🔐 Calling userDecrypt with parameters:');
    console.log('  HandleContractPairs:', handleContractPairs.length, 'pairs');
    console.log('  User Address:', userAddress);
    console.log('  Signature length:', signature.length);
    
    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''), // Remove 0x prefix from signature
      contractAddresses,
      userAddress, // Use address as-is from wallet
      startTimeStamp,
      durationDays
    );
    console.log('✅ Decryption result:', result);

    // Extract decrypted values from result (try both with and without 0x prefix)
    const yesVotes = Number(result[yesHandleStr] || result['0x' + yesHandleStr] || 0);
    const noVotes = Number(result[noHandleStr] || result['0x' + noHandleStr] || 0);
    
    console.log('✅ Decrypted votes - Yes:', yesVotes, 'No:', noVotes);

    return { yesVotes, noVotes };
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw error;
  }
}
