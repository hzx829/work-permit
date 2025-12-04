import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DigitalCockpit from './pages/DigitalCockpit';
import List from './pages/List';
import Create from './pages/Create';
import Detail from './pages/Detail';
import Comprehensive from './pages/Comprehensive';
import Risk from './pages/Risk';
import Hazard from './pages/Hazard';
import Equipment from './pages/Equipment';
import Training from './pages/Training';
import Regulation from './pages/Regulation';
import Video from './pages/Video';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DigitalCockpit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/work-permit"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="list" element={<List />} />
            <Route path="create" element={<Create />} />
            <Route path="detail/:id" element={<Detail />} />
          </Route>
          <Route
            path="/comprehensive"
            element={
              <ProtectedRoute>
                <Comprehensive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk"
            element={
              <ProtectedRoute>
                <Risk />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hazard"
            element={
              <ProtectedRoute>
                <Hazard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <Equipment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training"
            element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            }
          />
          <Route
            path="/regulation"
            element={
              <ProtectedRoute>
                <Regulation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video"
            element={
              <ProtectedRoute>
                <Video />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
