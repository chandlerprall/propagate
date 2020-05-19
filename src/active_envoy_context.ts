import { createContext } from 'react';
import { createEnvoy } from './active_envoy';

export const ActivEnvoyContext = createContext(createEnvoy({}));