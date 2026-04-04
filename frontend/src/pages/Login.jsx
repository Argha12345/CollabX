import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Branding Pane */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary-600 flex-col justify-center items-center text-white p-12 relative overflow-hidden shadow-2xl z-10 clip-path-slant">
        {/* Decorative background overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_right,_white_10%,_transparent_100%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        
        <div className="z-10 text-center flex flex-col items-center">
          <h1 className="text-3xl font-light mb-8 antialiased">Welcome back to</h1>
          <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="CollabX Logo" className="h-32 w-32 object-contain drop-shadow-md" />
          </div>
          <h2 className="text-5xl font-extrabold mb-6 tracking-tight text-white drop-shadow-sm">CollabX</h2>
          <p className="max-w-md text-primary-100 text-lg leading-relaxed opacity-90">
            Your unified workspace for real-time creativity and structured collaboration. Pick up seamlessly where your team left off.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-32 bg-gray-50/50">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.png" alt="CollabX Logo" className="h-20 object-contain drop-shadow-md" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Access your workspaces and continue collaborating.
          </p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md shadow-sm flex items-center"><span className="mr-2">⚠️</span>{error}</div>}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail Address</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow sm:text-sm bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your mail"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow sm:text-sm bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-primary-600 hover:text-primary-800 transition">
                  Forgot password?
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!agreed}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-800 transition">
                Create new for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
