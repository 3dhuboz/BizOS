import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const PlatformLogin: React.FC = () => {
  const { login } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(UserRole.ADMIN, username, password);
      navigate(username === 'dev' ? '/platform' : '/admin');
    } catch (err: any) {
      toast(err.message || 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600 shadow-lg shadow-purple-900/40">
            <Shield size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">BizOS</h1>
            <p className="text-sm text-purple-400 font-medium uppercase tracking-widest mt-1">Platform Access</p>
          </div>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition placeholder-gray-500"
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-500" size={16} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-purple-700 transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
              <>Sign In <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-600">
          Platform administration portal. Authorized access only.
        </p>
      </div>
    </div>
  );
};

export default PlatformLogin;
