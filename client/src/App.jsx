import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import EventDetailPage from './pages/EventDetailPage';
import DiocesePage from './pages/DiocesePage';
import ParishPage from './pages/ParishPage';
import SubmitEventPage from './pages/SubmitEventPage';
import SponsorPage from './pages/SponsorPage';
import AdminPage from './pages/admin/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/dioceses/:id" element={<DiocesePage />} />
        <Route path="/parishes/:id" element={<ParishPage />} />
        <Route path="/submit" element={<SubmitEventPage />} />
        <Route path="/sponsor" element={<SponsorPage />} />
        <Route path="/sponsor/success" element={<SponsorPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
