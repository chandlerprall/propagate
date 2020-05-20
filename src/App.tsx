import React from 'react';
import ReactDOM from 'react-dom';
import chroma from 'chroma-js';
import {ActivEnvoyContext} from './active_envoy_context';
import {computed, createEnvoy, resolve} from './active_envoy';
import {useActiveEnvoy} from './useActiveEnvoy';

const div = document.createElement('div');
document.body.appendChild(div);

const primaries = ['#ff4b7d', '#9f78ff'];
const togglePrimary = () => {
  const nextPrimary = resolve(theme.primary) === primaries[0] ? primaries[1] : primaries[0];
  theme.primary = nextPrimary;
};

/* ## Configure Theme ## */
interface Theme {
  primary: string;
  secondary: string;
}
const theme = createEnvoy<Theme>();
window.theme = theme;

theme.primary = '#ff4b7d';
theme.secondary = computed([theme.primary], primary => chroma(primary).darken(2).hex());

const App = () => {
  /* ## Access Colors ## */
  const [primary, secondary] = useActiveEnvoy(theme.primary, theme.secondary);

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
  <ActivEnvoyContext.Provider value={theme}>
    <App/>
  </ActivEnvoyContext.Provider>,
  div
);
