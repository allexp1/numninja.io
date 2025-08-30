'use client';

import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    log('🚀 Starting authentication diagnostics...');
    
    // Check if Supabase is available
    try {
      const { supabase } = await import('@/lib/supabase-client');
      setSupabaseLoaded(true);
      log('✅ Supabase client loaded');
      
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        log(`❌ Error getting session: ${error.message}`);
      } else if (session) {
        log(`✅ Active session found!`);
        log(`  - User: ${session.user.email}`);
        log(`  - ID: ${session.user.id}`);
        log(`  - Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      } else {
        log('⚠️ No active session');
      }
      
      // Check localStorage
      log('📦 Checking localStorage...');
      const localStorageKeys = Object.keys(localStorage);
      const authKeys = localStorageKeys.filter(key => 
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('user') || 
        key.includes('session')
      );
      
      if (authKeys.length > 0) {
        log(`⚠️ Found ${authKeys.length} auth-related keys in localStorage:`);
        authKeys.forEach(key => {
          log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
        });
      } else {
        log('✅ No auth keys in localStorage');
      }
      
      // Check cookies
      log('🍪 Checking cookies...');
      const cookies = document.cookie.split(';');
      const supabaseCookies = cookies.filter(c => c.includes('sb-'));
      
      if (supabaseCookies.length > 0) {
        log(`✅ Found ${supabaseCookies.length} Supabase cookies`);
        supabaseCookies.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          log(`  - ${name}`);
        });
      } else {
        log('⚠️ No Supabase cookies found');
      }
      
      // Check Supabase URL and keys
      log('🔐 Checking environment...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl) {
        log(`✅ SUPABASE_URL: ${supabaseUrl}`);
      } else {
        log('❌ SUPABASE_URL not set!');
      }
      
      if (supabaseAnonKey) {
        log(`✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`);
      } else {
        log('❌ SUPABASE_ANON_KEY not set!');
      }
      
    } catch (error: any) {
      log(`❌ Failed to load Supabase: ${error.message}`);
    }
  };

  const clearAllAuth = () => {
    log('🧹 Clearing all authentication data...');
    
    // Clear localStorage
    const keysToRemove = Object.keys(localStorage);
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    log(`  - Cleared ${keysToRemove.length} localStorage items`);
    
    // Clear sessionStorage
    sessionStorage.clear();
    log('  - Cleared sessionStorage');
    
    // Note: Can't clear httpOnly cookies from JavaScript
    log('⚠️ Note: Server-side cookies cannot be cleared from client');
    log('✅ Client-side auth data cleared');
  };

  const testSignIn = async () => {
    log('🔐 Attempting sign in...');
    
    try {
      const { supabase } = await import('@/lib/supabase-client');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'Test123456'
      });
      
      if (error) {
        log(`❌ Sign in failed: ${error.message}`);
      } else if (data.session) {
        log('✅ Sign in successful!');
        log(`  - User: ${data.session.user.email}`);
        log(`  - Session expires: ${new Date(data.session.expires_at! * 1000).toLocaleString()}`);
        
        // Check if session persists
        setTimeout(async () => {
          log('⏱️ Checking session after 3 seconds...');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            log('✅ Session still active');
          } else {
            log('❌ Session lost!');
          }
        }, 3000);
      }
    } catch (error: any) {
      log(`❌ Exception: ${error.message}`);
    }
  };

  const testSignOut = async () => {
    log('🚪 Signing out...');
    
    try {
      const { supabase } = await import('@/lib/supabase-client');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        log(`❌ Sign out failed: ${error.message}`);
      } else {
        log('✅ Sign out successful');
      }
    } catch (error: any) {
      log(`❌ Exception: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Simple Auth Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Run Tests
            </button>
            <button
              onClick={clearAllAuth}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              🧹 Clear All Auth
            </button>
            <button
              onClick={testSignIn}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🔐 Sign In
            </button>
            <button
              onClick={testSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
        
        <div className="bg-black rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Console Output</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="bg-gray-900 rounded p-4 h-96 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`
                  ${log.includes('✅') ? 'text-green-400' : ''}
                  ${log.includes('❌') ? 'text-red-400' : ''}
                  ${log.includes('⚠️') ? 'text-yellow-400' : ''}
                  ${log.includes('🔐') || log.includes('🚀') || log.includes('📦') || log.includes('🍪') ? 'text-blue-400' : ''}
                  ${!log.includes('✅') && !log.includes('❌') && !log.includes('⚠️') && !log.includes('🔐') && !log.includes('🚀') && !log.includes('📦') && !log.includes('🍪') ? 'text-gray-300' : ''}
                `}
              >
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">Waiting for tests to run...</div>
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Click "Run Tests" to check current state</li>
            <li>Click "Clear All Auth" to remove localStorage</li>
            <li>Click "Sign In" to authenticate</li>
            <li>Wait 3 seconds to see if session persists</li>
            <li>Try navigating to other pages</li>
          </ol>
        </div>
      </div>
    </div>
  );
}