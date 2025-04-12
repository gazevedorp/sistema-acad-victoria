import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import * as Styles from "./Login.styles";
import { toast, ToastContainer } from "react-toastify";

interface LoginFormInputs {
  email: string;
  password: string;
}

const schema = yup.object().shape({
  email: yup
    .string()
    .email("E-mail inválido")
    .required("E-mail é obrigatório"),
  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(5, "Senha deve ter pelo menos 5 caracteres"),
});

const Login: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      console.error("Erro ao fazer login:", error.message);
      toast.error("Credenciais inválidas!");
    }
  };

  const onError: SubmitErrorHandler<LoginFormInputs> = (formErrors) => {
    Object.values(formErrors).forEach((err) => {
      if (err?.message) {
        toast.error(err.message);
      }
    });
  };

  return (
    <Styles.Container>
      <Styles.LoginBox>
        <Styles.Logo src="/logo.png" alt="Logo" />

        <Styles.Form onSubmit={handleSubmit(onSubmit, onError)}>
          <Styles.Input
            type="email"
            placeholder="E-mail"
            required
            {...register("email")}
          />

          <Styles.PasswordWrapper>
            <Styles.Input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              required
              {...register("password")}
            />
            <Styles.EyeIcon onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </Styles.EyeIcon>
          </Styles.PasswordWrapper>

          <Styles.Button type="submit">Entrar</Styles.Button>
        </Styles.Form>
      </Styles.LoginBox>
      <ToastContainer />
    </Styles.Container>
  );
};

export default Login;
