import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.tsx';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router';
import { queryClient } from './apis/query-client.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import './index.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="dark">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
);
