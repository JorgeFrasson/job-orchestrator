import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import JobList from './pages/JobList';
import { JobDetail } from './pages/JobDetail';
import JobEdit from './pages/JobEdit';
import About from './pages/About';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<JobList />} />
            <Route path="/jobs/:topic" element={<JobDetail />} />
            <Route path="/jobs/:topic/edit" element={<JobEdit />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
