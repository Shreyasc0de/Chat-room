import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import { User } from '@supabase/supabase-js';
import { AlertCircle, Database } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Test Supabase connection
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase connection error:', error);
          setConnectionError(true);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        setConnectionError(false);
        setLoading(false);
      } catch (error) {
        console.error('Failed to connect to Supabase:', error);
        setConnectionError(true);
        setLoading(false);
      }
    };

    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <Database className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Database Connection Required
          </h2>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Setup Required
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  This chat application requires a Supabase database connection to function properly.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                🔧 Setup Instructions:
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                  Click the <strong>"Connect to Supabase"</strong> button in the top right corner
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                  Follow the setup wizard to create your database
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                  The app will automatically create chat rooms and demo data
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ✨ What You'll Get:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Real-time messaging across multiple chat rooms</li>
                <li>• User authentication and presence tracking</li>
                <li>• Typing indicators and live notifications</li>
                <li>• Message history and room management</li>
                <li>• Professional chat interface with dark/light themes</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Refresh After Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user ? <ChatInterface user={user} /> : <AuthForm />}
    </div>
  );
}

export default App;