import { useState } from 'react';
import apiService from '../services/api';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.login(email, password);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      
      // Redirigir automàticament a admin
      window.location.href = '/admin';
      
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Error a l'iniciar sessió");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">La Camereta</h1>
            <p className="login-subtitle">Panell d'Administració</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@lacamereta.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contrasenya
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? 'Iniciant sessió...' : 'Iniciar Sessió'}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="login-help">
            <p className="help-text">Credencials de prova:</p>
            <p className="help-text"><strong>Email:</strong> admin@lacamereta.com</p>
            <p className="help-text"><strong>Contrasenya:</strong> admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}