import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EditorLayout } from './layouts/EditorLayout';
import { EditorPage } from './pages/EditorPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { authService } from './services/auth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectListPage />
            </ProtectedRoute>
          }
        />
        <Route path="/editor/:pageId?" element={<EditorLayout />}>
          <Route index element={<EditorPage />} />
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
