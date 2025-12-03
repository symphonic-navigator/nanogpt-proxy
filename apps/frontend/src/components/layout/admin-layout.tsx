import { Outlet } from 'react-router';
import { AppShell, Container } from '@mantine/core';
import TopHeader from '../elements/headers/top-header.tsx';

function AdminLayout() {
  return (
    <AppShell padding="md" header={{ height: 60 }}>
      <AppShell.Header>
        <TopHeader />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default AdminLayout;
