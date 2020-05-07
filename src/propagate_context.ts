import { createContext } from 'react';
import Propagate from './propagate';

export default createContext<Propagate>(new Propagate);
