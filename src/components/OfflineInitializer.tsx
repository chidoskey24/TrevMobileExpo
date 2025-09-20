// src/components/OfflineInitializer.tsx
import React, { useEffect } from 'react';
import { useTxStore } from '../store/txStore';

export default function OfflineInitializer() {
  const initialize = useTxStore(state => state.initialize);

  useEffect(() => {
    // Initialize the offline transaction store when the app starts
    initialize().catch(error => {
      console.error('Failed to initialize offline store:', error);
    });
  }, [initialize]);

  return null; // This component doesn't render anything
}
