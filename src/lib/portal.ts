import { createContext, useContext } from 'react';

/**
 * Where floating UI (menus, dialogs, sheets) portals to. Defaults to <body>;
 * the dev component sheet overrides it so each theme panel keeps its own tokens.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export const usePortalContainer = () => useContext(PortalContainerContext) ?? undefined;
