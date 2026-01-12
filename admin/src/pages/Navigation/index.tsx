import { Routes, Route } from 'react-router-dom';

import Navigation from './Page';
import { Page } from '@strapi/strapi/admin';
import pluginPermissions from '../../permissions';

const App = () => {
  return (
    <Page.Protect permissions={pluginPermissions['page.navigation']}>
      <Routes>
        <Route path="/" element={<Navigation />} />
        <Route path="/:navigationId" element={<Navigation />} />
      </Routes>
    </Page.Protect>
  );
};

export default App;