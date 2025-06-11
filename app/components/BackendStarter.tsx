'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function BackendStarter() {
  const { isSignedIn } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [pid, setPid] = useState<number | null>(null);

  useEffect(() => {
    const startBackend = async () => {
      if (isSignedIn && status === 'idle') {
        setStatus('loading');
        try {
          const response = await fetch('/api/start-backend', {
            method: 'POST',
          });
          
          const data = await response.json();
          
          if (response.ok) {
            setStatus('success');
            setMessage(data.message);
            setPid(data.pid);
          } else {
            setStatus('error');
            setMessage(data.error || 'Failed to start backend');
          }
        } catch (error) {
          setStatus('error');
          setMessage('Failed to start backend');
        }
      }
    };

    const stopBackend = async () => {
      if (pid) {
        try {
          const response = await fetch('/api/start-backend', {
            method: 'DELETE',
          });
          
          if (response.ok) {
            setStatus('idle');
            setMessage('');
            setPid(null);
          }
        } catch (error) {
          console.error('Failed to stop backend:', error);
        }
      }
    };

    startBackend();

    // Cleanup function to stop the backend when component unmounts or user signs out
    return () => {
      stopBackend();
    };
  }, [isSignedIn, status, pid]);

  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800">
      {status === 'loading' && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Starting backend...</span>
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center space-x-2">
          <div className="text-green-600">
            ✓ {message}
          </div>
          {pid && (
            <span className="text-sm text-gray-500">
              (PID: {pid})
            </span>
          )}
        </div>
      )}
      {status === 'error' && (
        <div className="text-red-600">
          ✕ {message}
        </div>
      )}
    </div>
  );
} 