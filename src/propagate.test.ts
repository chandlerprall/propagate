import Propagate from './propagate';

describe('Propagate', () => {
  describe('value storage & looking', () => {
    it('stores a single value for lookup', () => {
      const propagate = new Propagate();
      propagate.set('mykey', 'myvalue');
      expect(propagate.get('mykey')).toBe('myvalue');
    });

    it('stores multiple values for lookup', () => {
      const propagate = new Propagate();
      propagate.set('mykey', 'myvalue');
      propagate.set('otherkey', 'othervalue');
      expect(propagate.get('mykey')).toBe('myvalue');
      expect(propagate.get('otherkey')).toBe('othervalue');
    });
  });

  describe('subscriptions', () => {
    it('allows subscribing to a single value', () => {
      const propagate = new Propagate();

      const subscriber = jest.fn();
      propagate.subscribe('key', subscriber);

      expect(subscriber).toHaveBeenCalledTimes(0);

      propagate.set('key', 'value');

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).lastCalledWith('value');
    });

    it('allows unsubscribing', () => {
      const propagate = new Propagate();

      const subscriber = jest.fn();
      const unsubscribe = propagate.subscribe('key', subscriber);

      expect(subscriber).toHaveBeenCalledTimes(0);

      propagate.set('key', 'value');
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).lastCalledWith('value');

      unsubscribe();

      propagate.set('key', 'value2');
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).lastCalledWith('value');
    });
  });

  describe('computations', () => {
    it('computes a single field on creation', () => {
      const propagate = new Propagate();
      propagate.set('key', [], () => 5);
      expect(propagate.get('key')).toBe(5);
    });

    it('allows references to static values', () => {
      const propagate = new Propagate();
      propagate.set('four', 4);
      propagate.set('six', 6);
      propagate.set('ten', ['four', 'six'], (...args) => args.reduce((acc, val) => acc + val, 0));
      expect(propagate.get('ten')).toBe(10);
    });

    it('allows computations to depend on other computations', () => {
      const propagate = new Propagate();
      propagate.set('chars', [], () => ['A', 'B', 'C']);
      propagate.set('charsLower', ['chars'], chars => chars.map(char => char.toLowerCase()));
      expect(propagate.get('charsLower')).toEqual(['a', 'b', 'c']);
    });

    it('re-computes a value when a static dependency updates', () => {
      const propagate = new Propagate();
      propagate.set('root', 4);
      propagate.set('square', ['root'], root => root**2);
      expect(propagate.get('square')).toBe(16);

      propagate.set('root', 3);
      expect(propagate.get('square')).toBe(9);
    });

    describe('circular dependencies', () => {
      it('errors when one field depends on itself', () => {
        const propagate = new Propagate();
        expect(() => {
          propagate.set('first', ['first'], () => null);
        }).toThrow();
      });

      it('errors when two fields depend on each other', () => {
        const propagate = new Propagate();
        propagate.set('first', ['second'], () => null);
        expect(() => {
          propagate.set('second', ['first'], () => null);
        }).toThrow();
      });

      it('errors when two fields depend on each other through separation', () => {
        const propagate = new Propagate();
        propagate.set('first', ['second'], () => null);
        propagate.set('second', ['third'], () => null);
        expect(() => {
          propagate.set('third', ['third'], () => null);
        }).toThrow();
      });

      it('does not error when a potential circular dependency is first resolved', () => {
        const propagate = new Propagate();
        propagate.set('first', ['second'], () => null);
        propagate.set('first', 1);
        propagate.set('second', ['first'], x => x + 1);
        expect(propagate.get('second')).toBe(2);
      });
    });

    describe('computation subscriptions', () => {
      it('calls a subscription to a computed value on update', () => {
        const propagate = new Propagate();
        propagate.set('root', 3);
        propagate.set('square', ['root'], root => root**2);

        const subscriber = jest.fn();
        propagate.subscribe('square', subscriber);

        expect(subscriber).toHaveBeenCalledTimes(0);

        propagate.set('root', 4);

        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenLastCalledWith(16);
      });
    });
  });
});
