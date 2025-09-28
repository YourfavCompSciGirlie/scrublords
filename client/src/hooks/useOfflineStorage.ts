import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  id: string;
  type: 'patient' | 'opportunity' | 'message';
  data: any;
  timestamp: number;
  synced: boolean;
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending data from localStorage
    loadPendingData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingData = useCallback(() => {
    try {
      const stored = localStorage.getItem('pendingSync');
      if (stored) {
        setPendingSync(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending sync data:', error);
    }
  }, []);

  const savePendingData = useCallback((data: OfflineData[]) => {
    try {
      localStorage.setItem('pendingSync', JSON.stringify(data));
      setPendingSync(data);
    } catch (error) {
      console.error('Error saving pending sync data:', error);
    }
  }, []);

  const storeOfflineData = useCallback((type: OfflineData['type'], data: any) => {
    const offlineItem: OfflineData = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    const currentPending = [...pendingSync, offlineItem];
    savePendingData(currentPending);

    return offlineItem.id;
  }, [pendingSync, savePendingData]);

  const syncData = useCallback(async () => {
    if (!isOnline || pendingSync.length === 0) return;

    const unsynced = pendingSync.filter(item => !item.synced);
    const syncPromises = unsynced.map(async (item) => {
      try {
        let endpoint = '';
        switch (item.type) {
          case 'patient':
            endpoint = '/api/patients';
            break;
          case 'opportunity':
            endpoint = '/api/opportunities';
            break;
          case 'message':
            endpoint = '/api/messages';
            break;
        }

        // Clean data before sending - remove null/empty values that cause validation errors
        const cleanData = { ...item.data };
        if (item.type === 'patient') {
          // Remove null or invalid dateOfBirth to prevent validation errors
          if (!cleanData.dateOfBirth || cleanData.dateOfBirth === null) {
            delete cleanData.dateOfBirth;
          }
          // Remove other null/empty fields that might cause issues
          Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === null || cleanData[key] === '') {
              delete cleanData[key];
            }
          });
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(cleanData),
        });

        if (response.ok) {
          return { ...item, synced: true };
        } else {
          // Log sync error details for debugging
          const errorText = await response.text();
          console.error(`Sync failed for ${item.type}:`, response.status, errorText);
          
          // Don't retry on validation errors (400) - mark as failed
          if (response.status === 400) {
            console.warn(`Removing invalid ${item.type} from sync queue due to validation error`);
            return { ...item, synced: true, error: errorText }; // Remove from queue
          }
          
          return item; // Keep in queue for retry on other errors
        }
      } catch (error) {
        console.error('Sync error for item:', item.id, error);
        return item;
      }
    });

    const syncedItems = await Promise.all(syncPromises);
    const updatedPending = pendingSync.map(item => {
      const synced = syncedItems.find(s => s.id === item.id);
      return synced || item;
    });

    savePendingData(updatedPending);
  }, [isOnline, pendingSync, savePendingData]);

  const clearSyncedData = useCallback(() => {
    const unsyncedOnly = pendingSync.filter(item => !item.synced);
    savePendingData(unsyncedOnly);
  }, [pendingSync, savePendingData]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncData();
    }
  }, [isOnline, syncData]);

  return {
    isOnline,
    pendingSync: pendingSync.filter(item => !item.synced),
    storeOfflineData,
    syncData,
    clearSyncedData,
    hasPendingData: pendingSync.some(item => !item.synced),
  };
}
