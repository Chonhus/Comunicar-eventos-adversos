import { Route, Routes } from 'react-router-dom';
import InicioPage from './app/paginas/InicioPage';
import ConsentimientoPage from './app/paginas/ConsentimientoPage';
import FormacionPage from './app/paginas/FormacionPage';
import BriefingPage from './app/paginas/BriefingPage';
import LlamadaPage from './app/paginas/LlamadaPage';
import FeedbackPage from './app/paginas/FeedbackPage';
import EvaluacionFinalPage from './app/paginas/EvaluacionFinalPage';
import DebugAvatarPage from './app/paginas/DebugAvatarPage';
import CreditosPage from './app/paginas/CreditosPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InicioPage />} />
      <Route path="/consentimiento" element={<ConsentimientoPage />} />
      <Route path="/formacion" element={<FormacionPage />} />
      <Route path="/briefing/:casoId" element={<BriefingPage />} />
      <Route path="/llamada/:casoId/:intento" element={<LlamadaPage />} />
      <Route path="/feedback/:intentoId" element={<FeedbackPage />} />
      <Route path="/evaluacion-final" element={<EvaluacionFinalPage />} />
      <Route path="/debug/avatar" element={<DebugAvatarPage />} />
      <Route path="/creditos" element={<CreditosPage />} />
    </Routes>
  );
}
