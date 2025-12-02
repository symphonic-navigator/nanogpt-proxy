import { Route, Routes } from 'react-router';
import LoginLayout from './components/layout/login-layout.tsx';
import LoginForm from './components/forms/login-form.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginLayout />}>
        <Route index element={<LoginForm />} />
      </Route>
      <Route path="*" element={<>Not Found</>} />
    </Routes>
  );
}

export default App;
