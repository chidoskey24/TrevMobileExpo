# Environment Setup Guide

## Supabase Configuration

To use the full offline-first functionality with server sync, you need to set up Supabase credentials.

### Option 1: Create a .env file (Recommended)

Create a `.env` file in your project root with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Option 2: Set Environment Variables

You can also set these as environment variables in your system or CI/CD pipeline.

### Option 3: Offline-Only Mode (Current)

If you don't have Supabase credentials yet, the app will work in **offline-only mode**:
- All transactions are saved locally in SQLite
- No server synchronization occurs
- Perfect for testing offline functionality
- You can add Supabase credentials later

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon/public key
5. Add them to your `.env` file

## Database Schema

If you want to use Supabase sync, create this table in your Supabase project:

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

## Testing

The app will work perfectly without Supabase credentials for testing offline functionality. You can:

1. Test offline transaction creation
2. Test local SQLite storage
3. Test sync status indicators
4. Use the built-in test functions in Settings

When you're ready to add server sync, just add your Supabase credentials and the app will automatically start syncing!
