/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { AnErrorOccurred } from '@strapi/helper-plugin';
import pluginId from '../../../../utils/pluginId';
import Routes from '../Routes';
import Navigation from '../Navigation';

const App = () => {
  return (
    <div>
      <Switch>
        <Route path={`/plugins/${pluginId}/routes`} component={Routes} exact />
        <Route path={`/plugins/${pluginId}/navigation`} component={Navigation} exact />
        <Route component={AnErrorOccurred} />
      </Switch>
    </div>
  );
};

export default App;
