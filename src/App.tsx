import React from 'react';
import { GlobalStyles } from './styles/GlobalStyles';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <AppRoutes />
    </>
  );
};

export default App;
