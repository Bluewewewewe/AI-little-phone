import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 连接配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcenabrbftpqeeuufbdr.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

if (!process.env.SUPABASE_SECRET_KEY) {
  console.warn('⚠️  Warning: SUPABASE_SECRET_KEY is not set. Database operations may fail.');
  console.warn('Please set SUPABASE_SECRET_KEY environment variable in your deployment platform.');
}

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!SUPABASE_SECRET_KEY) {
      console.warn('⚠️  SUPABASE_SECRET_KEY not set, returning in-memory fallback client');
      supabase = createInMemoryClient();
    } else {
      try {
        supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log('✅ Supabase client initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        supabase = createInMemoryClient();
      }
    }
  }
  return supabase;
}

function createInMemoryClient(): SupabaseClient {
  const emptyResponse = { data: [], error: null };
  const emptySingleResponse = { data: null, error: null };

  const createPromise = (value: unknown) => Promise.resolve(value);

  const chainable = {
    select: () => createQueryBuilder(),
    eq: () => createQueryBuilder(),
    in: () => createQueryBuilder(),
    order: () => createPromise(emptyResponse),
    insert: () => createPromise(emptySingleResponse),
    update: () => createQueryBuilder(),
    delete: () => createQueryBuilder(),
    single: () => createPromise(emptySingleResponse),
    maybeSingle: () => createPromise(emptySingleResponse),
    then: (resolve: (value: unknown) => unknown) => resolve(emptyResponse),
  };

  function createQueryBuilder() {
    return chainable;
  }

  return {
    from: () => chainable,
    auth: {
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: { deleteUser: () => Promise.resolve({ data: { user: null }, error: null }) },
    },
  } as unknown as SupabaseClient;
}

export default getSupabaseClient;
