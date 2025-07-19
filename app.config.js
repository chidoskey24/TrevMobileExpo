import 'dotenv/config';

export default ({ config }) => ({
    ...config,
    extra: {
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
});