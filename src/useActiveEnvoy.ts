import {useContext, useEffect, useState} from 'react';
import { proxyAccessSymbol } from './active_envoy';
import { ActivEnvoyContext } from './active_envoy_context';
import {SubscriptionTreeNode} from './subscription_tree';

export const useActiveEnvoy = (..._selectors: any[]) => {
  const envoy = useContext(ActivEnvoyContext);

  const selectors: Array<{ [proxyAccessSymbol]: {envoy: any, selector: string[]} }> = _selectors;

  // @ts-ignore
  const subscriptionTree: SubscriptionTreeNode = envoy[proxyAccessSymbol].root.subscriptionTree;
  const getValueAt = subscriptionTree.getValueAt;

  const [values, setValues] = useState(() => {
    return selectors.map(selector => {
      const path = selector[proxyAccessSymbol].selector;
      return getValueAt(path);
    });
  });

  useEffect(() => {
    const unsubs = selectors.map((selector, index) => {
      const path = selector[proxyAccessSymbol].selector;
      return subscriptionTree.getNode(path).subscribe((nextValue: any) => {

        setValues(prevValues => {
          if (prevValues[index] === nextValue) return prevValues;

          const nextValues = [...prevValues];
          nextValues[index] = nextValue;
          return nextValues;
        });
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    }
  }, [values]);

  return values;
};
