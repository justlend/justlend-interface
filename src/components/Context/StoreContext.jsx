import React from 'react';
import store from '../../stores';

// Create a Context object
export const StoreContext = React.createContext({
  ...store
});
