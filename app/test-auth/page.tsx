'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getCurrentSession, getCurrentUser } from '@/lib/supabase-auth';

export default function TestAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  }, []);

  const checkAuthState = useCallback(async () => {
    addLog('Starting auth check...');
    
    try {
      // Check Supabase session
      const currentSession = await getCurrentSession();
      if (currentSession) {
        addLog(`✅ Session found: ${currentSession.user.email}`);
        addLog(`Session expires: ${new Date(currentSession.expires_at! * 1000).toISOString()}`);
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        addLog('❌ No session found');
      }

      // Check localStorage (old system)
      const localAuthToken = localStorage.getItem('numninja_auth_token');
      const localUser = localStorage.getItem('numninja_user');
      const authToken = localStorage.getItem('auth_token');
      const userItem = localStorage.getItem('user');
      
      if (localAuthToken || authToken) {
        addLog('⚠️ Found OLD auth token in localStorage - this should be removed!');
        addLog(`  - numninja_auth_token: ${localAuthToken ? 'exists' : 'none'}`);
        addLog(`  - auth_token: ${authToken ? 'exists' : 'none'}`);
      }
      if (localUser || userItem) {
        addLog('⚠️ Found OLD user in localStorage - this should be removed!');
        addLog(`  - numninja_user: ${localUser ? 'exists' : 'none'}`);
        addLog(`  - user: ${userItem ? 'exists' : 'none'}`);
      }

      // Check cookies
      const cookies = document.cookie.split(';');
      const supabaseCookies = cookies.filter(c => c.includes('sb-'));
      if (supabaseCookies.length > 0) {
        addLog(`✅ Found ${supabaseCookies.length} Supabase cookies`);
        supabaseCookies.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          addLog(`  - ${name}`);
        });
      } else {
        addLog('⚠️ No Supabase cookies found!');
      }

    } catch (error: any) {
      addLog(`❌ Error checking auth: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    // Initial auth check
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`🔄 Auth state changed: ${event}`);
      if (session) {
        addLog(`✅ Session active: ${session.user.email}`);
        setSession(session);
        setUser(session.user);
      } else {
        addLog('❌ Session cleared');
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthState, addLog]);

  const testSignIn = async () => {
    addLog('🔐 Testing sign in...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'Test123456'
      });

      if (error) {
        addLog(`❌ Sign in error: ${error.message}`);
        return;
      }

      if (data.session) {
        addLog(`✅ Sign in successful: ${data.session.user.email}`);
        addLog(`Token type: ${data.session.token_type}`);
        addLog(`Expires at: ${new Date(data.session.expires_at! * 1000).toISOString()}`);
        
        // Wait a moment and check if session persists
        setTimeout(async () => {
          addLog('⏱️ Checking if session persists after 2 seconds...');
          const checkSession = await getCurrentSession();
          if (checkSession) {
            addLog('✅ Session still valid');
          } else {
            addLog('❌ Session lost!');
          }
        }, 2000);
      }
    } catch (error: any) {
      addLog(`❌ Exception during sign in: ${error.message}`);
    }
  };

  const testSignOut = async () => {
    addLog('🚪 Testing sign out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        addLog(`❌ Sign out error: ${error.message}`);
      } else {
        addLog('✅ Sign out successful');
        
        // Clear any old localStorage
        localStorage.clear();
        addLog('🧹 Cleared localStorage');
      }
    } catch (error: any) {
      addLog(`❌ Exception during sign out: ${error.message}`);
    }
  };

  const clearOldAuth = () => {
    addLog('🧹 Clearing old auth system...');
    
    // Remove all localStorage items
    const keysToRemove = [
      'numninja_auth_token',
      'numninja_refresh_token',
      'numninja_user',
      'numninja_session',
      'auth_token',
      'user',
      'refresh_token',
      'session'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        addLog(`  - Removed localStorage: ${key}`);
      }
    });
    
    addLog('✅ Old auth cleared');
  };

  const testNavigation = () => {
    addLog('🧭 Testing navigation to dashboard...');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  const testAPICall = async () => {
    addLog('📡 Testing authenticated API call...');
    
    try {
      const { authenticatedFetch } = await import('@/lib/supabase-auth');
      const response = await authenticatedFetch('/api/provisioning/status', {
        method: 'POST'
      });
      
      if (response.ok) {
        addLog('✅ API call successful');
        const data = await response.json();
        addLog(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        addLog(`❌ API call failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      addLog(`❌ API call exception: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Authentication Diagnostics</h1>
        
        {/* Current State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Session:</span>
              {loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : session ? (
                <span className="text-green-600">✅ Active ({session.user.email})</span>
              ) : (
                <span className="text-red-600">❌ No session</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">User ID:</span>
              <span className="font-mono text-sm">{user?.id || 'None'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span>{user?.email || 'Not signed in'}</span>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={checkAuthState}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Refresh Auth Check
            </button>
            <button
              onClick={clearOldAuth}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              🧹 Clear Old Auth
            </button>
            <button
              onClick={testSignIn}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🔐 Test Sign In
            </button>
            <button
              onClick={testSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🚪 Test Sign Out
            </button>
            <button
              onClick={testAPICall}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              📡 Test API Call
            </button>
            <button
              onClick={testNavigation}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              🧭 Go to Dashboard
            </button>
          </div>
        </div>

        {/* Debug Log */}
        <div className="bg-black rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Debug Log</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-gray-900 rounded p-4 h-96 overflow-y-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
              {logs.length === 0 ? 'No logs yet. Click "Refresh Auth Check" to start...' : logs.join('\n')}
            </pre>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">🔧 Testing Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "🔄 Refresh Auth Check" to see current state</li>
            <li>Click "🧹 Clear Old Auth" to remove any conflicting localStorage</li>
            <li>Click "🔐 Test Sign In" to authenticate as admin@test.com</li>
            <li>Wait 2 seconds and check if session persists</li>
            <li>Click "📡 Test API Call" to test authenticated API access</li>
            <li>Click "🧭 Go to Dashboard" to test navigation</li>
            <li>If you get kicked out, come back here and check the logs</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <p className="text-sm font-medium text-yellow-800">⚠️ Known Issue:</p>
            <p className="text-sm text-yellow-700 mt-1">
              If you're getting kicked out after sign-in, it means there's a conflict between 
              the old localStorage auth and the new Supabase cookie auth. Always click 
              "Clear Old Auth" first before testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}