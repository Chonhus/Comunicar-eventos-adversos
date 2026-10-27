import { Route, Routes } from 'react-router-dom';
import InicioPage from './app/paginas/InicioPage';
import AccesoPage from './app/paginas/AccesoPage';
import ConsentimientoPage from './app/paginas/ConsentimientoPage';
import FormacionPage from './app/paginas/FormacionPage';
import BriefingPage from './app/paginas/BriefingPage';
import LlamadaPage from './app/paginas/LlamadaPage';
import FeedbackPage from './app/paginas/FeedbackPage';
import EvaluacionFinalPage from './app/paginas/EvaluacionFinalPage';
import DebugAvatarPage from './app/paginas/DebugAvatarPage';
import CreditosPage from './app/paginas/CreditosPage';
import DocenteLoginPage from './app/paginas/DocenteLoginPage';
import DocentePanelPage from './app/paginas/DocentePanelPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InicioPage />} />
      <Route path="/acceso" element={<AccesoPage />} />
      <Route path="/consentimiento" element={<ConsentimientoPage />} />
      <Route path="/formacion" element={<FormacionPage />} />
      <Route path="/briefing/:casoId" element={<BriefingPage />} />
      <Route path="/llamada/:casoId/:intento" element={<LlamadaPage />} />
      <Route path="/feedback/:intentoId" element={<FeedbackPage />} />
      <Route path="/evaluacion-final" element={<EvaluacionFinalPage />} />
      <Route path="/debug/avatar" element={<DebugAvatarPage />} />
      <Route path="/creditos" element={<CreditosPage />} />
      <Route path="/docente/login" element={<DocenteLoginPage />} />
      <Route path="/docente" element={<DocentePanelPage />} />
    </Routes>
  );
}
