# use-ether-provider
Inject `ethers.js` provider into react component by using react's new hooks api, no more HOC.

[![npm version](https://badge.fury.io/js/use-ether-provider.svg)](https://badge.fury.io/js/use-ether-provider)

# Prepare
```
yarn add ethers react react-dom use-ether-provider
```

# Example
```javascript
import * as ethers from 'ethers';
import {EtherProvider, useEtherProvider, useAccount} from 'use-ether-provider';

// USDT for example
const USDT = {
  abi: [
    'function transfer(address to, uint value) public',
    'function balanceOf(address who) public view returns (uint)'
  ],
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7'
};

async function handleTransfer(erc20, to, amount) {
  const res = await erc20.transfer(to, amount);
  return res;
}

const MyApp = () => {
  const etherProvider = useEtherProvider();
  const myAddress = useAccount(etherProvider);

  const [usdtContract, setUsdtContract] = useState(null);
  const [myBalance, setMyBalance] = useState('0.0');

  useEffect(() => {
    if (etherProvider) {
      const contract = new ethers.Contract(USDT.address, USDT.abi, etherProvider);
      setUsdtContract(contract);

      if (myAddress) {
        contract.balanceOf(myAddress).then(balance => setMyBalance(balance));
      }
    }
  }, [myAddress, etherProvider]);

  const oneUSD = '1000000';
  const to = '0x123ddd...';

  return (
    <div>
      <div>{myBalance}</div>
      <button onClick={e => handleTransfer(usdtContract, to, oneUSD)}></button>
    </div>
  );
};

const polling = 10000; // 10s polling interval
let App = () => {
  return (
    <EtherProvider networks={[1, 3, 5]} backupJsonRpcUrl={'http://localhost:8485'} ms={polling}>
      <MyApp />
    </EtherProvider>
  );
};
```
