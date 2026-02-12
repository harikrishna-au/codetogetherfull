import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ViewQuestions from './pages/ViewQuestions';
import AddQuestion from './pages/AddQuestion';
import ClearQueues from './pages/ClearQueues';
import { useNextQuestionId } from './hooks/useNextQuestionId';

type Page = 'dashboard' | 'view-questions' | 'add-question' | 'clear-queues';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const nextId = useNextQuestionId();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'view-questions':
        return <ViewQuestions />;
      case 'add-question':
        return <AddQuestion nextId={nextId} />;
      case 'clear-queues':
        return <ClearQueues />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
