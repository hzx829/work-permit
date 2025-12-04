import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/WorkPermit/index';
import DigitalCockpit from './pages/DigitalCockpit';
import List from './pages/WorkPermit/List';
import Create from './pages/WorkPermit/Create';
import Detail from './pages/WorkPermit/Detail';
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
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/work-permit" element={<Dashboard />} />
            <Route path="/work-permit/list" element={<List />} />
            <Route path="/work-permit/create" element={<Create />} />
            <Route path="/work-permit/detail/:id" element={<Detail />} />
            <Route path="/comprehensive" element={<Comprehensive />} />
            <Route path="/risk" element={<Risk />} />
            <Route path="/hazard" element={<Hazard />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/training" element={<Training />} />
            <Route path="/regulation" element={<Regulation />} />
            <Route path="/video" element={<Video />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
