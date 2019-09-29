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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var globalStore = {
  rawWeb3: null,
  web3: null,
  jsonRpcUrl: null,
  jsonRpc: null
};

function denyMetamask() {
  var expire = window.localStorage.getItem('metamask-deny');
  return new Date(expire) > new Date();
}

function setDenyMetamask() {
  var d = new Date();
  d.setHours(d.getHours() - 12);
  window.localStorage.setItem('metamask-deny', d);
} // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1102.md
// https://github.com/MetaMask/metamask-extension/issues/5715


var enabled = false;

function tryEnableWeb3(_x) {
  return _tryEnableWeb.apply(this, arguments);
}

function _tryEnableWeb() {
  _tryEnableWeb = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(forceEnable) {
    var accounts, _accounts;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            if (!(window && window.ethereum && (forceEnable || !enabled && !denyMetamask()))) {
              _context3.next = 19;
              break;
            }

            if (!window.ethereum.enable) {
              _context3.next = 8;
              break;
            }

            _context3.next = 5;
            return window.ethereum.enable();

          case 5:
            enabled = true;
            _context3.next = 19;
            break;

          case 8:
            if (!window.ethereum.sendAsync) {
              _context3.next = 15;
              break;
            }

            _context3.next = 11;
            return window.ethereum.sendAsync('eth_requestAccounts');

          case 11:
            accounts = _context3.sent;

            if (accounts && accounts.length > 0) {
              enabled = true;
            }

            _context3.next = 19;
            break;

          case 15:
            _context3.next = 17;
            return window.ethereum.send('eth_requestAccounts');

          case 17:
            _accounts = _context3.sent;

            if (_accounts && _accounts.length > 0) {
              enabled = true;
            }

          case 19:
            _context3.next = 26;
            break;

          case 21:
            _context3.prev = 21;
            _context3.t0 = _context3["catch"](0);
            console.log(_context3.t0);
            setDenyMetamask();
            enabled = false;

          case 26:
            return _context3.abrupt("return", enabled);

          case 27:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 21]]);
  }));
  return _tryEnableWeb.apply(this, arguments);
}

function setProvider(jsonRpcUrl) {
  if (typeof window === 'undefined') {
    return null;
  }

  var current = (0, _get2["default"])(window, ['ethereum'], (0, _get2["default"])(window, ['web3', 'currentProvider'], null)); // create browser web3 provider

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

function activeProvider() {
  return _activeProvider.apply(this, arguments);
}

function _activeProvider() {
  _activeProvider = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var networks,
        backupJsonRpcUrl,
        provd,
        ok,
        network,
        _args4 = arguments;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            networks = _args4.length > 0 && _args4[0] !== undefined ? _args4[0] : [1, 3, 4, 5];
            backupJsonRpcUrl = _args4.length > 1 ? _args4[1] : undefined;
            setProvider(backupJsonRpcUrl);
            provd = getProvider();
            ok = false;

            if (!provd) {
              _context4.next = 16;
              break;
            }

            ok = true;
            _context4.t0 = parseInt;
            _context4.next = 10;
            return provd.getNetwork();

          case 10:
            _context4.t1 = _context4.sent;
            network = (0, _context4.t0)(_context4.t1, 10);

            if (!~networks.indexOf(network)) {
              _context4.next = 16;
              break;
            }

            _context4.next = 15;
            return tryEnableWeb3();

          case 15:
            ok = _context4.sent;

          case 16:
            return _context4.abrupt("return", ok);

          case 17:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _activeProvider.apply(this, arguments);
}

function sleep(ms) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      return resolve('schedule');
    }, ms);
  });
}

function retry(fn, times, delay) {
  return (
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var tried,
          ok,
          err,
          _args = arguments;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              tried = 0;
              ok = false;

            case 2:
              if (!(tried <= times)) {
                _context.next = 20;
                break;
              }

              _context.prev = 3;
              _context.next = 6;
              return fn.apply(void 0, _args);

            case 6:
              ok = _context.sent;

              if (!ok) {
                _context.next = 9;
                break;
              }

              return _context.abrupt("break", 20);

            case 9:
              _context.next = 15;
              break;

            case 11:
              _context.prev = 11;
              _context.t0 = _context["catch"](3);
              ok = false;
              err = _context.t0;

            case 15:
              ++tried;
              _context.next = 18;
              return sleep(delay);

            case 18:
              _context.next = 2;
              break;

            case 20:
              return _context.abrupt("return", {
                ok: ok,
                err: err
              });

            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[3, 11]]);
    }))
  );
}

var EtherContext = _react["default"].createContext();

var retryActiveProvider = retry(activeProvider, 5, 1000);

var EtherProvider = function EtherProvider(_ref2) {
  var networks = _ref2.networks,
      backupJsonRpcUrl = _ref2.backupJsonRpcUrl,
      ms = _ref2.ms,
      children = _ref2.children;

  var _useState = (0, _react.useState)(null),
      _useState2 = _slicedToArray(_useState, 2),
      provider = _useState2[0],
      setProvider = _useState2[1];

  var updateProvider =
  /*#__PURE__*/
  function () {
    var _ref3 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var currentProvider;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return retryActiveProvider(networks, backupJsonRpcUrl);

            case 2:
              currentProvider = getProvider();

              if (currentProvider && currentProvider !== provider) {
                setProvider(currentProvider);
              }

            case 4:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function updateProvider() {
      return _ref3.apply(this, arguments);
    };
  }();

  (0, _react.useEffect)(function () {
    var interval;
    updateProvider().then(function () {
      var running = false;
      interval = setInterval(function () {
        if (!running) {
          running = true;
          updateProvider().then(function () {
            running = false;
          })["catch"](function (e) {
            running = false;
          });
        }
      }, ms);
    });
    return function () {
      clearInterval(interval);
    };
  }, [networks, backupJsonRpcUrl]);
  return _react["default"].createElement(EtherContext.Provider, {
    value: provider
  }, children);
};

exports.EtherProvider = EtherProvider;

function useEtherProvider() {
  return _react["default"].useContext(EtherContext);
}

function useAccount(provider) {
  var _useState3 = (0, _react.useState)(''),
      _useState4 = _slicedToArray(_useState3, 2),
      account = _useState4[0],
      setAccount = _useState4[1];

  (0, _react.useEffect)(function () {
    if (provider && provider.getSigner) {
      var signer = provider.getSigner();
      signer.getAddress().then(function (add) {
        if (add && add !== '0x0000000000000000000000000000000000000000') {
          setAccount(add);
        }
      })["catch"](function (e) {});
    }
  }, [provider]);
  return account;
}