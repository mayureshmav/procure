/**
 * Maps URL path prefixes to AccessMatrix module keys.
 * Used by AppShell (route guard) and AccessGuard to check view permission
 * before rendering a page.
 */
import type { AccessMatrix } from '@/types';

export type ModuleKey = keyof AccessMatrix;

// /admin/* routes are gated by role (SYSTEM_ADMIN) inside each page, not by accessMatrix module.
// They are intentionally omitted here so AppShell doesn't block them via module check.

export const ROUTE_MODULE_MAP: { path: string; module: ModuleKey }[] = [
  { path: '/vendors',          module: 'vendors'        },
  { path: '/catalog',          module: 'catalog'        },
  { path: '/order-guides',     module: 'orderGuides'    },
  { path: '/requisitions',     module: 'requisitions'   },
  { path: '/purchase-orders',  module: 'purchaseOrders' },
  { path: '/inventory',        module: 'inventory'      },
  { path: '/integration',      module: 'integration'    },
  { path: '/logs',             module: 'logs'           },
  { path: '/settings',         module: 'settings'       },
  { path: '/org',              module: 'orgStructure'   },
  { path: '/persons',          module: 'persons'        },
  { path: '/positions',        module: 'positions'      },
  { path: '/vendor-inbox',     module: 'vendorInbox'    },
];

/**
 * Returns the module key for the given pathname, or null if it's a
 * public/unguarded route (dashboard, login, unauthorized).
 */
export function moduleForPath(pathname: string): ModuleKey | null {
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/unauthorized')) return null;
  const match = ROUTE_MODULE_MAP.find(({ path }) => pathname === path || pathname.startsWith(path + '/') || pathname.startsWith(path + '?'));
  return match?.module ?? null;
}
