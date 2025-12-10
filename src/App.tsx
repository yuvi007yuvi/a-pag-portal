import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Sidebar } from './components/Sidebar';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { SFIReportsPage } from './pages/SFIReportsPage';
import { SupervisorReportPage } from './pages/SupervisorReportPage';
import { DepartmentReportsPage } from './pages/DepartmentReportsPage';
import { OfficerMappingPage } from './pages/OfficerMappingPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { OfficerReportPage } from './pages/OfficerReportPage';
import { ComplainantTrendsPage } from './pages/ComplainantTrendsPage';
import { SubtypeTrendsPage } from './pages/SubtypeTrendsPage';

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <div className="min-h-screen bg-slate-50 font-sans">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-10">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="A-Pag Logo" className="h-12 w-auto" />
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="ml-64 mt-16 p-8">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sfi-reports" element={<SFIReportsPage />} />
              <Route path="/department-reports" element={<DepartmentReportsPage />} />
              <Route path="/supervisor-reports" element={<SupervisorReportPage />} />
              <Route path="/officer-mapping" element={<OfficerMappingPage />} />
              <Route path="/officer-reports" element={<OfficerReportPage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/complainant-trends" element={<ComplainantTrendsPage />} />
              <Route path="/subtype-trends" element={<SubtypeTrendsPage />} />
            </Routes>
          </main>
        </div>
      </DataProvider>
    </BrowserRouter>
  );
}

export default App;
