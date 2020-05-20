import {computed, createEnvoy, createSelectors, subscribe} from './active_envoy';

describe('ActiveEnvoy', () => {
  describe('setting and getting', () => {
    it('get a value from the default model', () => {
      const æ = createEnvoy({ key: 'value' });
      expect(æ.key).toBe('value');
    });

    it('get undefined when a value is not present', () => {
      const æ = createEnvoy<{ key?: string }>({});
      expect(æ.key).toBeUndefined();
    });

    it('can set and get a top-level value', () => {
      const model = { key: 'value' };
      const æ = createEnvoy(model);
      æ.key = 'new value';
      expect(æ.key).toBe('new value');
    });

    it('can set and get multiple top-level values', () => {
      const æ = createEnvoy<Record<string, number>>();
      æ.one = 1;
      æ.two = 2;
      expect(æ.one).toBe(1);
      expect(æ.two).toBe(2);
      expect(æ.three).toBeUndefined();
    });

    it('can get a nested value', () => {
      const æ = createEnvoy({ parent: { child: { nested: 10 } } });

      expect(æ.parent.child.nested).toBe(10);
      expect(æ.parent.child).toEqual({
        nested: 10
      });
    });

    it('can set a nested value', () => {
      const æ = createEnvoy({ parent: { nested: 10 } });
      æ.parent.nested = 20;
      expect(æ.parent.nested).toBe(20);
    });

    it('can set a deeply nested value', () => {
      const æ = createEnvoy({ parent: { child: { nested: 10 } } });
      æ.parent.child = { nested: 20 };
      expect(æ.parent.child.nested).toBe(20);
    });

    describe('referential mutation', () => {
      it('mutations are maintained between shared accesses', () => {
        const æ = createEnvoy({ parent: { child: { nested: 10 } } });
        const originalParent = æ.parent;
        æ.parent.child = { nested: 20 };
        expect(originalParent.child.nested).toBe(20);
      });

      it('mutates do nt propagate between different accesses', () => {
        const æ = createEnvoy({ parent: { child: { nested: 10 } } });
        const originalParent = æ.parent;

        æ.parent = { child: { nested: 20 } };

        expect(æ.parent).toEqual({ child: { nested: 20 } });
        expect(originalParent).toEqual({ child: { nested: 10 } });
      });

      it('mutations affect the original model object', () => {
        const model = { parent: { child: { nested: 10 } } };
        const æ = createEnvoy(model);

        const parent = æ.parent;
        parent.child = { nested: 20 };
        expect(model.parent.child.nested).toBe(20);

        model.parent.child.nested = 30;
        expect(parent.child.nested).toBe(30);
      });
    });
  });

  describe('subscriptions', () => {
    it('alerts listeners to changes', () => {
      const æ = createEnvoy({ nested: { value: 5 } });

      const nestedListener = jest.fn();
      subscribe(æ, 'nested', nestedListener);

      const valueListener = jest.fn();
      subscribe(æ.nested, 'value', valueListener);

      æ.nested.value = 6;

      expect(nestedListener).toHaveBeenCalledTimes(1);
      expect(nestedListener).toHaveBeenLastCalledWith({
        value: 6
      });

      expect(valueListener).toHaveBeenCalledTimes(1);
      expect(valueListener).toHaveBeenLastCalledWith(6);
    });
  });

  describe('computed', () => {
    it('allows computed values', () => {
      interface Model { value: number, square: number }
      const æ = createEnvoy<Model>({ value: 4 });
      const æs = createSelectors<Model>(æ);
      æ.square = computed(
        [æs.value],
        value => {
          // @ts-ignore
          return value * value;
        }
      );

      expect(æ.value).toBe(4);
      expect(æ.square).toBe(16);

      æ.value = 6;
      expect(æ.value).toBe(6);
      expect(æ.square).toBe(36);
    });
  });
});
