import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthConfirm() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('[AuthConfirm] Starting email verification...');

        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[AuthConfirm] Session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          emailConfirmed: session?.user?.email_confirmed_at,
          error: error?.message,
        });

        if (error) {
          console.error('[AuthConfirm] Session error:', error.message);
          setStatus('error');
          setMessage('Error verifying email. Please try again.');
          setTimeout(() => navigate('/signin?message=verification-failed'), 3000);
          return;
        }

        if (session?.user && session.user.email_confirmed_at) {
          console.log('[AuthConfirm] ✅ Email confirmed successfully!');

          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to sign in...');

          setTimeout(() => {
            navigate('/signin?verified=true');
          }, 2000);
        } else {
          console.warn('[AuthConfirm] ❌ No session or email not confirmed');
          setStatus('error');
          setMessage('Please confirm your email to continue.');
          setTimeout(() => navigate('/signin?message=please-confirm'), 3000);
        }
      } catch (err) {
        console.error('[AuthConfirm] Unexpected error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred.');
        setTimeout(() => navigate('/signin'), 3000);
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-red-500 animate-spin" />
              <h1 className="text-2xl font-bold text-white">{message}</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 animate-scale-in" />
              <h1 className="text-2xl font-bold text-white animate-slide-up">{message}</h1>
              <p className="text-gray-400">جاري تحويلك إلى لوحة التحكم...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 animate-shake" />
              <h1 className="text-2xl font-bold text-white">{message}</h1>
              <p className="text-gray-400">جاري تحويلك إلى صفحة تسجيل الدخول...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
