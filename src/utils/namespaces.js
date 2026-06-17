import { DEFAULT_TRON_METHODS, DEFAULT_TRON_EVENTS } from './WCconstant';

export const getNamespacesFromChains = chains => {
  const supportedNamespaces = [];
  chains.forEach(chainId => {
    const [namespace] = chainId.split(':');
    if (!supportedNamespaces.includes(namespace)) {
      supportedNamespaces.push(namespace);
    }
  });

  return supportedNamespaces;
};

export const getSupportedMethodsByNamespace = namespace => {
  switch (namespace) {
    case 'tron':
      return Object.values(DEFAULT_TRON_METHODS);
    default:
      throw new Error(`No default methods for namespace: ${namespace}`);
  }
};

export const getSupportedEventsByNamespace = namespace => {
  switch (namespace) {
    case 'tron':
      return Object.values(DEFAULT_TRON_EVENTS);
    default:
      throw new Error(`No default events for namespace: ${namespace}`);
  }
};

export const getRequiredNamespaces = chains => {
  const selectedNamespaces = getNamespacesFromChains(chains);

  return selectedNamespaces.reduce((acc, namespace) => {
    acc[namespace] = {
      methods: getSupportedMethodsByNamespace(namespace),
      chains: chains.filter(chain => chain.startsWith(namespace)),
      events: getSupportedEventsByNamespace(namespace)
    };
    return acc;
  }, {});
};
