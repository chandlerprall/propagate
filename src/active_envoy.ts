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
    const propertyPath = [...target.selectors, property];

    if (value instanceof Computed) {
      const computed = value;
      value = computed.getValue();

      const updater = () => {
        Reflect.set(target.model, property, computed.getValue());
        target.root.subscriptionTree!.getNode(propertyPath).notify();
      };

      computed.dependencies.forEach(dependency => {
        // @ts-ignore
        target.root.subscriptionTree!.getNode(dependency[proxyAccessSymbol].selector).subscribe(updater);
      });
    }

    const result = Reflect.set(target.model, property, value);

    if (result === true) {
      target.root.subscriptionTree!.getNode(propertyPath).notify();
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

export function createEnvoy<T>(model: Partial<T> = ({} as any), root = undefined, selectors: string[] = []): T {
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

const selectorProxyHandler: ProxyHandler<{envoy: any, selector: string[]}> = {
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target);
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

  getOwnPropertyDescriptor(target, propertyKey) {
    return Reflect.getOwnPropertyDescriptor(target, propertyKey);
  },

  defineProperty() {
    return false;
  },

  has(target, propertyKey) {
    return Reflect.has(target, propertyKey);
  },

  get(target, property: string | typeof proxyAccessSymbol) {
    if (property === proxyAccessSymbol) {
      return target;
    }
    const {envoy, selector} = target;
    return new Proxy({
      envoy,
      selector: [...selector, property],
    }, selectorProxyHandler);
  },

  set() {
    return false;
  },

  deleteProperty() {
    return false;
  },

  ownKeys(target) {
    return Reflect.ownKeys(target);
  },

  apply() {
    return undefined;
  },

  construct() {
    return [];
  }
};

export function createSelectors<T extends {}>(envoy: any): T {
  return new Proxy({ envoy, selector: [] }, selectorProxyHandler) as unknown as T;
}

export class Computed<T> {
  public envoy: any;
  constructor(public dependencies: any[], public computer: (...values: any[]) => T) {
    this.envoy = dependencies[0][proxyAccessSymbol].envoy[proxyAccessSymbol];
  }

  getValue() {
    return this.computer(
      ...this.dependencies.map(dependency =>
        this.envoy.subscriptionTree.getValueAt(dependency[proxyAccessSymbol].selector)
      )
    );
  }
}

export function computed<T>(
  dependencies: any[],
  computer: (values: any[]) => T
): T {
  return new Computed(dependencies, computer) as unknown as T;
}