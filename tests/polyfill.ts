// Polyfills for running React Native / Expo modules under Node.js CLI testing
(global as any).__DEV__ = false;

(global as any).ErrorUtils = {
  getGlobalHandler: () => () => {},
  setGlobalHandler: () => {},
};

class MockEventEmitter {
  addListener() {
    return { remove: () => {} };
  }
  removeSubscription() {}
  emit() {}
}

const mockNativeModule = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (prop === 'addListener') return () => ({ remove: () => {} });
      if (prop === 'removeListeners') return () => {};
      return () => Promise.resolve({});
    },
  }
);

(globalThis as any).expo = {
  EventEmitter: MockEventEmitter,
  modules: new Proxy(
    {},
    {
      get: (_target, _prop) => mockNativeModule,
    }
  ),
};

// Redirect 'react-native' resolution to 'react-native-web' to avoid Flow syntax errors in node_modules
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === 'react-native') {
    return require.resolve('react-native-web');
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const memoryStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => memoryStore[key] ?? null,
  setItem: (key: string, value: string) => {
    memoryStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    for (const k of Object.keys(memoryStore)) {
      delete memoryStore[k];
    }
  },
  key: (index: number) => Object.keys(memoryStore)[index] ?? null,
  get length() {
    return Object.keys(memoryStore).length;
  },
};

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {
    localStorage: mockLocalStorage,
  };
} else if (!(global as any).window.localStorage) {
  (global as any).window.localStorage = mockLocalStorage;
}

if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = mockLocalStorage;
}
