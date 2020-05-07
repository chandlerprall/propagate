import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {act} from 'react-dom/test-utils';
import Propagate from './propagate';
import PropagateContext from './propagate_context';
import usePropagate from './use_propagate';

const container = document.createElement('div');
describe('usePropagation', () => {
  it('starts with the references values', () => {
    const propagate = new Propagate();
    propagate.set('one', 1);
    propagate.set('two', ['one'], one => one + 1);

    const Component = () => {
      const values = usePropagate(['one', 'two']);
      return <span>{values.join(',')}</span>;
    };

    ReactDOM.render(
      <PropagateContext.Provider value={propagate}>
        <Component />
      </PropagateContext.Provider>,
      container
    );

    expect(container.innerHTML).toBe('<span>1,2</span>');

    ReactDOM.unmountComponentAtNode(container);
  });

  it('re-renders when referenced values update', async () => {
    const propagate = new Propagate();
    propagate.set('root', 4);
    propagate.set('square', ['root'], root => root**2);

    const Component = () => {
      const values = usePropagate(['root', 'square']);
      return <span>{values.join(',')}</span>;
    };

    ReactDOM.render(
      <PropagateContext.Provider value={propagate}>
        <Component />
      </PropagateContext.Provider>,
      container
    );

    expect(container.innerHTML).toBe('<span>4,16</span>');

    await new Promise(resolve => setTimeout(resolve, 100));
    act(() => propagate.set('root', 3));
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.innerHTML).toBe('<span>3,9</span>');

    ReactDOM.unmountComponentAtNode(container);
  });
});