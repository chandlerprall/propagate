import React from 'react';
import ReactDOM from 'react-dom';
import chroma from 'chroma-js';
import Propagate from './propagate';
import usePropagate from './use_propagate';
import PropagateContext from './propagate_context';

const div = document.createElement('div');
document.body.appendChild(div);

const primaries = ['#ff4b7d', '#9f78ff'];
const togglePrimary = () => {
  const nextPrimary = theme.get('primary') === primaries[0] ? primaries[1] : primaries[0];
  theme.set('primary', nextPrimary);
};

/* ## Configure Theme ## */
const theme = new Propagate();
theme.set('primary', '#ff4b7d');
theme.set('secondary', ['primary'], primary => chroma(primary).darken(2).hex());

const App = () => {
  /* ## Access Colors ## */
  const [primary, secondary] = usePropagate(['primary', 'secondary']);

  return (
    <button
      onClick={togglePrimary}
      style={{
        color: secondary,
        background: primary,
      }}
    >
      Toggle Colors!
    </button>
  );
};

ReactDOM.render(
  <PropagateContext.Provider value={theme}>
    <App/>
  </PropagateContext.Provider>,
  div
);
