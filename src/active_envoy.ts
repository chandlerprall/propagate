interface ProxyTarget<Model extends {}> {
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

  get(target, property: string) {
    const value = Reflect.get(target.model, property);

    if (typeof value === 'object' && value !== null) {
      return createEnvoy(
        value,
        [...target.selectors, property]
      );
    }

    return value;
  },

  set(target, property, value) {
    return Reflect.set(target.model, property, value);
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

export function createEnvoy<T>(model: T = ({} as any), selectors: string[] = []): T {
  return new Proxy(
    {
      selectors,
      model
    },
    proxyHandler
  ) as any as T;
}