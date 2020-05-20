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
  const nextPrimary = resolve(theme.colors.primary) === primaries[0] ? primaries[1] : primaries[0];
  theme.colors.primary = nextPrimary;
};

/* ## Configure Theme ## */
interface Theme {
  colors: {
    primary: string;
    secondary: string;
  }
}
const theme = createEnvoy<Theme>();
window.theme = theme;

theme.colors.primary = '#ff4b7d';
theme.colors.secondary = computed([theme.colors.primary], primary => {
  try {
    return chroma(primary).darken(2).hex();
  } catch (e) {
    return resolve(theme.colors.secondary);
  }
});

const App = () => {
  const [fulltheme] = useActiveEnvoy(theme);
  const [primary, secondary] = useActiveEnvoy(theme.colors.primary, theme.colors.secondary);

  return (
    <div>
      <button
        onClick={togglePrimary}
        style={{
          color: secondary,
          background: primary,
        }}
      >
        Toggle Colors!
      </button>

      <br/><br/>

      <input type="text" value={primary} onChange={e => theme.colors.primary = e.target.value}/>

      <br/><br/>

      <pre><code>{JSON.stringify(fulltheme, null, 2)}</code></pre>
    </div>
  );
};

ReactDOM.render(
  <ActivEnvoyContext.Provider value={theme}>
    <App/>
  </ActivEnvoyContext.Provider>,
  div
);
