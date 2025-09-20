# Offline-First Transaction System

This implementation provides a robust offline-first approach for handling transactions in the TrevMobile Expo app, utilizing SQLite for local caching and automatic synchronization when connectivity is restored.

## Features

- **Offline-First Architecture**: Transactions are saved locally first, then synced to the server
- **SQLite Database**: Persistent local storage for transaction data
- **Automatic Sync**: Transactions sync automatically when network connectivity is restored
- **Network Detection**: Real-time monitoring of network status using `@react-native-community/netinfo`
- **Manual Sync**: Users can manually trigger sync operations
- **Sync Status**: Visual indicators showing sync status and pending transactions
- **Error Handling**: Robust error handling for failed sync operations

## Architecture

### Core Components

1. **Database Layer** (`src/lib/database.ts`)
   - SQLite database initialization and schema
   - CRUD operations for transactions
   - Sync status tracking

2. **Offline Store** (`src/store/offlineTxStore.ts`)
   - Zustand store managing offline transaction state
   - Network connectivity monitoring
   - Automatic sync triggers

3. **Sync Service** (`src/lib/syncService.ts`)
   - Handles synchronization with Supabase backend
   - Batch sync operations
   - Connection testing

4. **Transaction Store** (`src/store/txStore.ts`)
   - Updated to use offline-first approach
   - Maintains backward compatibility

5. **UI Components**
   - `OfflineInitializer`: Initializes the offline system on app startup
   - `SyncStatus`: Shows sync status and allows manual sync

## Database Schema

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT '₦',
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

## Usage

### Initialization

The offline system is automatically initialized when the app starts via the `OfflineInitializer` component.

### Adding Transactions

```typescript
import { useTxStore } from '../store/txStore';

const addTx = useTxStore(state => state.addTx);

// Add a transaction (works offline)
await addTx({
  id: 'tx_hash_or_uuid',
  type: 'deposit',
  title: 'Deposit',
  subtitle: '0.10 POL',
  amount: 1000,
  currency: '₦'
});
```

### Monitoring Sync Status

```typescript
import { useOfflineTxStore } from '../store/offlineTxStore';

const { isOnline, unsyncedCount, syncPendingTransactions } = useOfflineTxStore();

// Check if online
if (isOnline) {
  // Trigger manual sync
  await syncPendingTransactions();
}
```

### Manual Sync

```typescript
import { syncService } from '../lib/syncService';

// Test connection
const isConnected = await syncService.testConnection();

// Get unsynced transactions and sync them
const unsyncedTransactions = await database.getUnsyncedTransactions();
const result = await syncService.syncTransactions(unsyncedTransactions);
```

## Sync Behavior

1. **Automatic Sync**: When the app comes online and there are unsynced transactions
2. **Manual Sync**: User can trigger sync via the SyncStatus component
3. **Batch Processing**: Multiple transactions are synced in batches
4. **Error Recovery**: Failed syncs are retried on next connectivity

## Network States

- **Online**: App can sync transactions to server
- **Offline**: Transactions are saved locally only
- **Reconnecting**: Automatic sync triggers when connectivity is restored

## Error Handling

- Database errors are logged and don't crash the app
- Sync failures are tracked and retried
- Network errors are handled gracefully
- User feedback via SyncStatus component

## Configuration

### Supabase Setup

Ensure your Supabase project has a `transactions` table with the following columns:

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT '₦',
  timestamp INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Environment Variables

Make sure your `app.config.js` includes Supabase credentials:

```javascript
export default ({ config }) => ({
  ...config,
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  },
});
```

## Testing

To test the offline functionality:

1. **Offline Mode**: Turn off network connectivity and create transactions
2. **Online Mode**: Restore connectivity and verify automatic sync
3. **Manual Sync**: Use the sync button in the SyncStatus component
4. **Error Scenarios**: Test with invalid Supabase credentials

## Performance Considerations

- SQLite operations are optimized with proper indexing
- Batch sync operations reduce network overhead
- Local state updates are immediate for better UX
- Sync operations run in background to avoid blocking UI

## Future Enhancements

- Conflict resolution for concurrent edits
- Partial sync for large datasets
- Compression for sync payloads
- Background sync scheduling
- Sync progress indicators
