import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EditorLayout } from './layouts/EditorLayout';
import { EditorPage } from './pages/EditorPage';
import { ProjectListPage } from './pages/ProjectListPage';
import { SettingsPage } from './pages/SettingsPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/editor/:pageId?" element={<EditorLayout />}>
          <Route index element={<EditorPage />} />
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
