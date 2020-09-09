import {useContext, useEffect, useState} from 'react';
import {proxyAccessSymbol, ProxyTarget} from './active_envoy';
import { ActivEnvoyContext } from './active_envoy_context';
import {SubscriptionTreeNode} from './subscription_tree';

export const useActiveEnvoy = (..._selectors: any[]) => {
  const envoy = useContext(ActivEnvoyContext);

  const selectors: Array<ProxyTarget<any>> = _selectors;

  // @ts-ignore
  const subscriptionTree: SubscriptionTreeNode = envoy[proxyAccessSymbol].root.subscriptionTree;
  const getValueAt = subscriptionTree.getValueAt;

  const [values, setValues] = useState(() => {
    return selectors.map(selector => {
      // @ts-ignore
      const path = selector[proxyAccessSymbol].selectors;
      return getValueAt(path);
    });
  });

  useEffect(() => {
    const unsubs = selectors.map((selector, index) => {
      // @ts-ignore
      const path = selector[proxyAccessSymbol].selectors;
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
