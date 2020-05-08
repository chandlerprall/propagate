type Subscriber = (value: string) => void;
type Computation = (...args: any[]) => any;
type ComputationDef = [string[], Computation];

export class Computed {
  constructor(public references: string[], public compute: Function) {}
}

export default class Propagate {
  values = new Map<string, any>();
  subscriptions = new Map<string, Set<Subscriber>>();
  computations = new Map<string, [string[], Computation]>();

  dependencies = new Map<string, string[]>();
  dependants = new Map<string, Set<string>>();

  constructor() {
    return new Proxy(this, {
      set: (obj, property, value) => {
        if (value instanceof Computed) {
          this.set(property, value.references, value.compute);
        } else {
          this.set(property, value);
        }
        return true;
      },

      get: (obj, property) => {
        if (obj[property]) return obj[property];
        return property;
      }
    });
  }

  set(key: string, references: string[], computation: Computation)
  set(key: string, value: any)
  set(key: string, valueOrReferences: any | string[], computation?: Computation) {
    if (typeof computation !== 'undefined') {
      const references = valueOrReferences as string[];
      const computationDefinition: ComputationDef = [references, computation];

      // update dependants lists for the referenced values
      this.checkForCircularDependencies(key, references);

      // remove old dependencies first, then refresh with the new list
      const oldDependencies = this.dependencies.get(key) || [];
      for (let i = 0; i < oldDependencies.length; i++) {
        const referencedKey = oldDependencies[i];
        const referencedDependants = this.dependants.get(referencedKey);
        if (referencedDependants) {
          referencedDependants.delete(key);
          this.dependants.set(referencedKey, referencedDependants);
        }
      }
      for (let i = 0; i < references.length; i++) {
        const referencedKey = references[i];
        const referencedDependants = this.dependants.get(referencedKey) || new Set();
        referencedDependants.add(key);
        this.dependants.set(referencedKey, referencedDependants);
      }

      this.dependencies.set(key, references);
      this.computations.set(key, computationDefinition);

      this.computeValue(key);
    } else {
      // this value no longer has any references, if they ever existed
      this.dependencies.set(key, []);

      this.values.set(key, valueOrReferences);
    }

    // update dependants
    const dependants = this.dependants.get(key);
    if (dependants) {
      dependants.forEach(dependantKey => {
        this.computeValue(dependantKey);
      });
    }

    // call subscriptions
    const subscriptions = this.subscriptions.get(key) || new Set();
    const value = this.values.get(key);
    subscriptions.forEach(subscription => subscription(value));
  }

  get(key: string) {
    return this.values.get(key);
  }

  subscribe(key: string, subscriber: Subscriber) {
    const subscriptions = this.subscriptions.get(key) || new Set();
    subscriptions.add(subscriber);
    this.subscriptions.set(key, subscriptions);

    return () => {
      const subscriptions = this.subscriptions.get(key) || new Set();
      subscriptions.delete(subscriber);
      this.subscriptions.set(key, subscriptions);
    };
  }

  computeValue(key: string) {
    const computationDef = this.computations.get(key);

    if (computationDef === undefined) return undefined;

    const [references, computation] = computationDef;
    const dependentValues = references.map(key => this.get(key));
    const value = computation(...dependentValues);

    this.values.set(key, value);

    // call subscriptions
    const subscriptions = this.subscriptions.get(key) || new Set();
    subscriptions.forEach(subscription => subscription(value));
  }

  checkForCircularDependencies(key: string, nextReferences: string[]) {
    interface Check {
      path: Set<string>;
      dependencies: string[];
    }
    const remainingChecks: Check[] = [{ path: new Set([key]), dependencies: nextReferences }];

    while (remainingChecks.length) {
      const check = remainingChecks.shift();
      const { path, dependencies } = check;

      for (let i = 0; i < dependencies.length; i++) {
        const dependencyKey = dependencies[i];
        if (path.has(dependencyKey)) {
          throw new Error(`Circular dependency: ${Array.from(path).join('->')}`);
        }
        const subDependencies = this.dependencies.get(dependencyKey);
        if (subDependencies) {
          const subPath = new Set(path).add(dependencyKey);
          remainingChecks.push({
            path: subPath,
            dependencies: subDependencies
          });
        }
      }
    }
  }
}
