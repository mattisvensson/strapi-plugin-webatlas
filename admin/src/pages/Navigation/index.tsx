import { Routes, Route } from 'react-router-dom';

import Navigation from './Page';
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigation />} />
      <Route path="/:navigationId" element={<Navigation />} />
    </Routes>
  );
};

export default App;