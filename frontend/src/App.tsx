import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import RecommendationPage from './pages/RecommendationPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AftercarePage from './pages/AftercarePage';
import LookupPage from './pages/LookupPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/recommend" element={<RecommendationPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/booking/:reference" element={<ConfirmationPage />} />
        <Route path="/aftercare" element={<AftercarePage />} />
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/dashboard" element={<AdminPage />} />
    </Routes>
  );
}
