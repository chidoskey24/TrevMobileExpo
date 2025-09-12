import 'dotenv/config';

export default ({ config }) => ({
    ...config,
    plugins: [...(config.plugins || []), 'expo-font'],
    extra: {
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
});