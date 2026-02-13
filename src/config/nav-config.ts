import { NavItem } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navItems: NavItem[] = [
  {
    title: 'Översikt',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Studenter',
    url: '/dashboard/product',
    icon: 'profile',
    isActive: false,
    shortcut: ['s', 's'],
    items: []
  },
  {
    title: 'Företag',
    url: '/dashboard/companies',
    icon: 'workspace',
    isActive: false,
    shortcut: ['f', 'f'],
    items: []
  },
  {
    title: 'Skolor',
    url: '/dashboard/schools',
    icon: 'teams',
    isActive: false,
    shortcut: ['k', 'k'],
    items: []
  },
  {
    title: 'Matchningar',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['m', 'm'],
    isActive: false,
    items: []
  },
  {
    title: 'Konto',
    url: '#',
    icon: 'account',
    isActive: true,
    items: [
      {
        title: 'Profil',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['p', 'p']
      },
      {
        title: 'Fakturering',
        url: '/dashboard/billing',
        icon: 'billing',
        shortcut: ['b', 'b'],
        access: { requireOrg: true }
      },
      {
        title: 'Logga ut',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  }
];
