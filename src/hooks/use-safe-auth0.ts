'use client';

import { useAuth0 } from "@auth0/auth0-react";

// Default values to return when Auth0 context is not available
const defaultAuth0Values = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  loginWithRedirect: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  getAccessTokenSilently: () => Promise.resolve(''),
  getAccessTokenWithPopup: () => Promise.resolve(''),
  getIdTokenClaims: () => Promise.resolve({}),
  buildAuthorizeUrl: () => Promise.resolve(''),
  buildLogoutUrl: () => Promise.resolve(''),
  handleRedirectCallback: () => Promise.resolve({ appState: {} }),
};

export function useSafeAuth0() {
  try {
    // Try to use the Auth0 hook
    return useAuth0();
  } catch (error) {
    // If something goes wrong, return default values
    console.warn('Auth0 context not available:', error);
    return defaultAuth0Values;
  }
} 