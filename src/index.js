import React, {useState, useEffect} from 'react';
import * as ethers from 'ethers';
import _get from 'lodash/get';
import PropTypes from 'prop-types';

const globalStore = {
  injectProvider: {
    provider: null,
    network: 0,
    raw: null
  },
  backupProvider: {
    provider: null,
    network: 0,
    url: null
  }
};

function denyMetamask() {
  const expire = window.localStorage.getItem('metamask-deny');
  return new Date(expire) > new Date();
}

function setDenyMetamask() {
  let d = new Date();
  d.setHours(d.getHours() - 12);
  window.localStorage.setItem('metamask-deny', d);
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md
// https://github.com/MetaMask/metamask-extension/issues/5715
let enabled = false;
export async function tryEnableWeb3(forceEnable) {
  try {
    if (
      window &&
      window.ethereum &&
      (forceEnable || (!enabled && !denyMetamask()))
    ) {
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

async function loadProvider(jsonRpcUrl) {
  if (typeof window === 'undefined') {
    return null;
  }
  const current = _get(window, ['ethereum'], _get(window, ['web3', 'currentProvider'], null));
  const {injectProvider, backupProvider} = globalStore;

  // create browser web3 provider
  if (!injectProvider.provider && current) {
    injectProvider.provider = new ethers.providers.Web3Provider(current);
    const {chainId: network} = await injectProvider.provider.getNetwork();
    injectProvider.network = network;

    if (current !== injectProvider.raw) {
      current.on('networkChanged', () => { // https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.on(eventname%2C-callback)-2
        // console.log('network changed');
        injectProvider.provider = null;
        loadProvider(jsonRpcUrl);
      });

      current.on('accountsChanged', () => {
        // console.log('accounts changed');
        injectProvider.provider = null;
        loadProvider(jsonRpcUrl);
      });
    }
  }

  // set web3 raw provider
  injectProvider.raw = current;

  // create JsonRpc web3 provider
  if (!backupProvider.provider && jsonRpcUrl && jsonRpcUrl !== backupProvider.url) {
    backupProvider.provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
    const {chainId: network} = await backupProvider.provider.getNetwork();
    backupProvider.network = network;
  }

  backupProvider.url = jsonRpcUrl;
}

function getProvider() {
  return globalStore.injectProvider.provider
    ? globalStore.injectProvider
    : globalStore.backupProvider;
}

async function activeProvider(networks = [1, 3, 4, 5], backupJsonRpcUrl) {
  await loadProvider(backupJsonRpcUrl);
  const {provider: provd, network} = getProvider();
  let ok = false;
  if (provd) {
    ok = true;
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
    return {ok, err};
  };
}

const EtherContext = React.createContext();
const retryActiveProvider = retry(activeProvider, 5, 1000);

export const EtherProvider = function({networks, backupJsonRpcUrl, ms, children}) {
  const [provider, setProvider] = useState(null);
  const updateProvider = async () => {
    await retryActiveProvider(networks, backupJsonRpcUrl);
    const {provider: currentProvider, network} = getProvider();
    if (currentProvider && currentProvider !== provider && ~networks.indexOf(network)) {
      setProvider(currentProvider);
    } else {
      setProvider(null);
    }
  };

  useEffect(() => {
    let interval;
    updateProvider().then(() => {
      let running = false;
      interval = setInterval(() => {
        if (!running) {
          running = true;
          updateProvider().then(() => {
            running = false;
          }).catch(e => { running = false; });
        }
      }, ms);
    });
    return () => {
      clearInterval(interval);
    };
  }, [networks, backupJsonRpcUrl]);

  return (
    <EtherContext.Provider value={provider}>
      {children}
    </EtherContext.Provider>
  );
};

EtherProvider.propTypes = {
  networks: PropTypes.arrayOf(PropTypes.number),
  backupJsonRpcUrl: PropTypes.string,
  ms: PropTypes.number,
  children: PropTypes.node.isRequired
};

export function useEtherProvider() {
  return React.useContext(EtherContext);
}

export function useAccount(provider) {
  const [account, setAccount] = useState('');
  useEffect(() => {
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
