import { useContext, useEffect, useState } from 'react';
import PropagateContext from './propagate_context';

export default function usePropagate(references: string[]) {
  const propagate = useContext(PropagateContext);
  const [values, setValues] = useState(references.map(reference => propagate.get(reference)));

  useEffect(
    () => {
      const unsubscribes = [];

      for (let i = 0; i < references.length; i++) {
        const reference = references[i];
        const index = i;
        const unsubscribe = propagate.subscribe(
          reference,
          value => {
            setValues(values => {
              const nextValues = [...values];
              nextValues[index] = value;
              return nextValues;
            });
          }
        );
        unsubscribes.push(unsubscribe);
      }

      return () => {
        for (let i = 0; i < unsubscribes.length; i++) {
          unsubscribes[i]();
        }
      }
    },
    [propagate, references, setValues]
  );

  return values;
}