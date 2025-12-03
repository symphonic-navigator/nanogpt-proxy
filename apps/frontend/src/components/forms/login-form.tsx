import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import classes from './login-form.module.scss';
import { useLogin } from '../../hooks/useLogin.ts';
import { useForm } from '@mantine/form';
import type { LoginRequestDto } from '../../dtos/login-request.dto.ts';
import { IconAlertCircle } from '@tabler/icons-react';
import { setAuthCookies } from '../../utilities/cookies.utilities.ts';
import { useNavigate } from 'react-router';

function LoginForm() {
  const navigate = useNavigate();

  const {
    mutate: login,
    isPending,
    error,
  } = useLogin({
    onSuccess: (data) => {
      setAuthCookies({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      navigate('/admin', { replace: true });
    },
    onError: (err) => {
      console.error('Login failed', err);
    },
  });

  const form = useForm<LoginRequestDto>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value) ? null : 'Please enter a valid email address',
      password: (value) =>
        value.trim().length >= 6 ? null : 'Password must be at least 6 characters',
    },
  });

  const handleSubmit = (values: LoginRequestDto) => {
    login({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        Welcome back!
      </Title>

      <Text className={classes.subtitle}>NanoGPT Proxy version 0.0.1</Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            withAsterisk
            label="Email"
            data-test-id="input-email"
            data-cy="input-email"
            placeholder="email@domain.com"
            radius="md"
            mt="xs"
            {...form.getInputProps('email')}
          />

          <PasswordInput
            withAsterisk
            label="Password"
            data-test-id="input-password"
            data-cy="input-password"
            placeholder="Password"
            radius="md"
            mt="md"
            {...form.getInputProps('password')}
          />

          {!!error && (
            <Alert mt="md" color="red" variant="light" icon={<IconAlertCircle size={16} />}>
              {error?.message}
            </Alert>
          )}

          <Button fullWidth mt="xl" radius="md" type="submit" loading={isPending}>
            Sign in
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginForm;
