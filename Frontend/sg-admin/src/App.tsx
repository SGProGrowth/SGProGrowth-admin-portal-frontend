import type { JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { getUser, hasValidToken } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { AiAssistant } from './pages/AiAssistant';
import { Dashboard } from './pages/Dashboard';
import { DigitalTwin } from './pages/DigitalTwin';
import { EntityPage } from './pages/EntityPage';
import { Login } from './pages/Login';
import { Activity, Calendar, Messages, Payments, Profile, Reports, Settings } from './pages/Simple';
import { StoreProvider } from './store';

function RequireAuth({ children }: { children: JSX.Element }) {
  // Admin authorization requires both a session user and a valid (unexpired) JWT.
  return getUser() && hasValidToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/digital-twin" element={<DigitalTwin />} />
              <Route path="/assistant" element={<AiAssistant />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/:entity" element={<EntityPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </ToastProvider>
  );
}
