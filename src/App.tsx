import React from 'react';
import ReactDOM from 'react-dom';
import chroma from 'chroma-js';
import {ActivEnvoyContext} from './active_envoy_context';
import {createEnvoy, createSelectors} from './active_envoy';
import {useActiveEnvoy} from './useActiveEnvoy';

const div = document.createElement('div');
document.body.appendChild(div);

const primaries = ['#ff4b7d', '#9f78ff'];
const togglePrimary = () => {
  const nextPrimary = themeEnvoy.primary === primaries[0] ? primaries[1] : primaries[0];
  themeEnvoy.primary = nextPrimary;
  themeEnvoy.secondary = chroma(nextPrimary).darken(2).hex();
};

/* ## Configure Theme ## */
interface Theme {
  primary: string;
  secondary: string;
}
const themeEnvoy = createEnvoy<Theme>();
window.themeEnvoy = themeEnvoy;
themeEnvoy.primary = '#ff4b7d';
themeEnvoy.secondary = '#aa3253';
// theme.secondary = new Computed([theme.primary], primary => chroma(primary).darken(2).hex());

const theme = createSelectors<Theme>();

const App = () => {
  /* ## Access Colors ## */
  //const [primary, secondary] = usePropagate('primary', 'secondary');
  // const [primary, secondary] = usePropagate(theme.primary, theme.secondary);
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
  <ActivEnvoyContext.Provider value={themeEnvoy}>
    <App/>
  </ActivEnvoyContext.Provider>,
  div
);
