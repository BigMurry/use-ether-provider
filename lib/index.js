"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryEnableWeb3 = tryEnableWeb3;
exports.useEtherProvider = useEtherProvider;
exports.useAccount = useAccount;
exports.EtherProvider = void 0;

var _react = _interopRequireWildcard(require("react"));

var ethers = _interopRequireWildcard(require("ethers"));

var _get2 = _interopRequireDefault(require("lodash/get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const globalStore = {
  rawWeb3: null,
  web3: null,
  jsonRpcUrl: null,
  jsonRpc: null
};

function denyMetamask() {
  const expire = window.localStorage.getItem('metamask-deny');
  return new Date(expire) > new Date();
}

function setDenyMetamask() {
  let d = new Date();
  d.setHours(d.getHours() - 12);
  window.localStorage.setItem('metamask-deny', d);
} // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md
// https://github.com/MetaMask/metamask-extension/issues/5715


let enabled = false;

async function tryEnableWeb3(forceEnable) {
  try {
    if (window && window.ethereum && (forceEnable || !enabled && !denyMetamask())) {
      if (window.ethereum.enable) {
        await window.ethereum.enable();
        enabled = true;
      } else if (window.ethereum.sendAsync) {
        const accounts = await window.ethereum.sendAsync('eth_requestAccounts');

        if (accounts && accounts.length > 0) {
          enabled = true;
        }
      } else {
        const accounts = await window.ethereum.send('eth_requestAccounts');

        if (accounts && accounts.length > 0) {
          enabled = true;
        }
      }
    }
  } catch (e) {
    console.log(e);
    setDenyMetamask();
    enabled = false;
  }

  return enabled;
}

function setProvider(jsonRpcUrl) {
  if (typeof window === 'undefined') {
    return null;
  }

  const current = (0, _get2.default)(window, ['ethereum'], (0, _get2.default)(window, ['web3', 'currentProvider'], null)); // create browser web3 provider

  if (!globalStore.web3 && current && current !== globalStore.rawWeb3) {
    globalStore.web3 = new ethers.providers.Web3Provider(current);
  } // set web3 raw provider


  globalStore.rawWeb3 = current; // create JsonRpc web3 provider

  if (!globalStore.jsonRpc && jsonRpcUrl && jsonRpcUrl !== globalStore.jsonRpcUrl) {
    globalStore.jsonRpc = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  }

  globalStore.jsonRpcUrl = jsonRpcUrl;
}

function getProvider() {
  return globalStore.web3 || globalStore.jsonRpc;
}

async function activeProvider(networks = [1, 3, 4, 5], backupJsonRpcUrl) {
  setProvider(backupJsonRpcUrl);
  const provd = getProvider();
  let ok = false;

  if (provd) {
    ok = true;
    const network = parseInt((await provd.getNetwork()), 10);

    if (~networks.indexOf(network)) {
      ok = await tryEnableWeb3();
    }
  }

  return ok;
}

function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve('schedule'), ms);
  });
}

function retry(fn, times, delay) {
  return async (...args) => {
    let tried = 0;
    let ok = false;
    let err;

    while (tried <= times) {
      try {
        ok = await fn(...args);

        if (ok) {
          break;
        }
      } catch (e) {
        ok = false;
        err = e;
      }

      ++tried;
      await sleep(delay);
    }

    return {
      ok,
      err
    };
  };
}

const EtherContext = _react.default.createContext();

const retryActiveProvider = retry(activeProvider, 5, 1000);

const EtherProvider = function ({
  networks,
  backupJsonRpcUrl,
  ms,
  children
}) {
  const [provider, setProvider] = (0, _react.useState)(null);

  const updateProvider = async () => {
    await retryActiveProvider(networks, backupJsonRpcUrl);
    const currentProvider = getProvider();

    if (currentProvider && currentProvider !== provider) {
      setProvider(currentProvider);
    }
  };

  (0, _react.useEffect)(() => {
    let interval;
    updateProvider().then(() => {
      let running = false;
      interval = setInterval(() => {
        if (!running) {
          running = true;
          updateProvider().then(() => {
            running = false;
          }).catch(e => {
            running = false;
          });
        }
      }, ms);
    });
    return () => {
      clearInterval(interval);
    };
  }, [networks, backupJsonRpcUrl]);
  return _react.default.createElement(EtherContext.Provider, {
    value: provider
  }, children);
};

exports.EtherProvider = EtherProvider;

function useEtherProvider() {
  return _react.default.useContext(EtherContext);
}

function useAccount(provider) {
  const [account, setAccount] = (0, _react.useState)('');
  (0, _react.useEffect)(() => {
    if (provider && provider.getSigner) {
      const signer = provider.getSigner();
      signer.getAddress().then(add => {
        if (add && add !== '0x0000000000000000000000000000000000000000') {
          setAccount(add);
        }
      }).catch(e => {});
    }
  }, [provider]);
  return account;
}