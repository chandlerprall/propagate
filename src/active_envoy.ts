import {SubscriptionTreeNode} from './subscription_tree';

export const proxyAccessSymbol = Symbol('ActiveEnvoy Proxy Target');

interface ProxyTarget<Model extends {}> {
  subscriptionTree?: SubscriptionTreeNode;
  root: ProxyTarget<any>;
  selectors: string[];
  model: Model;
}

const proxyHandler: ProxyHandler<ProxyTarget<any>> = {
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target.model);
  },

  setPrototypeOf(target, prototype) {
    return Reflect.setPrototypeOf(target.model, prototype);
  },

  isExtensible(target) {
    return Reflect.isExtensible(target);
  },

  preventExtensions(target) {
    return Reflect.preventExtensions(target.model);
  },

  getOwnPropertyDescriptor(target, key) {
    return Reflect.getOwnPropertyDescriptor(target.model, key);
  },

  defineProperty(target, property, attributes) {
    return Reflect.defineProperty(target.model, property, attributes)
  },

  has(target, property) {
    return Reflect.has(target.model, property);
  },

  get(target, property: string | typeof proxyAccessSymbol) {
    if (property === proxyAccessSymbol) {
      return target;
    }

    const value = Reflect.get(target.model, property);

    if (typeof value === 'object' && value !== null) {
      return createEnvoy(
        value,
        // @ts-ignore
        target,
        [...target.selectors, property]
      );
    }

    return value;
  },

  set(target, property: string, value) {
    const result = Reflect.set(target.model, property, value);

    if (result === true) {
      target.root.subscriptionTree!.getNode([...target.selectors, property]).notify();
    }

    return result;
  },

  deleteProperty(target, property) {
    return Reflect.deleteProperty(target.model, property);
  },

  ownKeys(target) {
    return Reflect.ownKeys(target.model);
  },

  apply(target, thisArg, argumentList) {
    return Reflect.apply(target.model, thisArg, argumentList);
  },

  construct(target, argumentsList, newTarget) {
    return Reflect.construct(target.model, argumentsList, newTarget);
  }
};

export function createEnvoy<T>(model: T = ({} as any), root = undefined, selectors: string[] = []): T {
  const envoy: ProxyTarget<any> = {
    // @ts-ignore
    root,
    selectors,
    model,
  };

  const proxy = new Proxy(
    envoy,
    // @ts-ignore
    proxyHandler
  ) as any as T;

  // @ts-ignore
  if (root === undefined) {
    // @ts-ignore
    envoy.root = envoy;

    const getValueAt = (_path: string[], path = [..._path]) => {
      let node = proxy;
      while (path.length) {
        const nodeName = path.shift()!;
        // @ts-ignore
        if (node.hasOwnProperty(nodeName)) {
          // @ts-ignore
          node = node[nodeName];
        } else {
          return undefined;
        }
      }
      return node;
    };
    envoy.subscriptionTree = new SubscriptionTreeNode(getValueAt);
  }

  return proxy;
}

export function subscribe<ProxiedObject extends {}>(envoyProxy: ProxiedObject, key: keyof ProxiedObject, listener: Function) {
  // @ts-ignore
  const targetProxy = envoyProxy[proxyAccessSymbol];
  const targetSelector = [...targetProxy.selectors, key];

  const subscriptionTree = targetProxy.root.subscriptionTree as SubscriptionTreeNode;
  const targetNode = subscriptionTree.getNode(targetSelector);

  return targetNode.subscribe(listener);
}

const selectorProxyHandler: ProxyHandler<string[]> = {
  getPrototypeOf() {
    return null;
  },

  setPrototypeOf() {
    return false;
  },

  isExtensible() {
    return false;
  },

  preventExtensions() {
    return false;
  },

  getOwnPropertyDescriptor() {
    return undefined;
  },

  defineProperty() {
    return false;
  },

  has() {
    return false;
  },

  get(target, property: string | typeof proxyAccessSymbol) {
    if (property === proxyAccessSymbol) {
      return target;
    }
    return new Proxy([...target, property], selectorProxyHandler);
  },

  set() {
    return false;
  },

  deleteProperty() {
    return false;
  },

  ownKeys() {
    return [];
  },

  apply() {
    return undefined;
  },

  construct() {
    return [];
  }
};

export function createSelectors<T extends {}>(): T {
  return new Proxy([], selectorProxyHandler) as unknown as T;
}