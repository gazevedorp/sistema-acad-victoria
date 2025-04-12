import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  background-color:rgb(34, 34, 34);
`;

export const Form = styled.form`
`;

export const LoginBox = styled.div`
  width: 400px;
  max-width: 90%;
  padding: 40px;
  background: #000;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  padding-bottom: 60px;
`;

export const Logo = styled.img`
  width: 100%;
  margin-bottom: 10px;
  border-radius: 5px;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  outline: none;
  transition: border 0.2s ease-in-out;
  margin-bottom: 16px;

  &:focus {
    border-color: #461b74;
  }
`;

export const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const EyeIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 40%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #777;
  font-size: 18px;

  &:hover {
    color: #333;
  }
`;

export const Button = styled.button`
  width: 100%;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  background: #0D88CB;

  &:hover {
    background: #0898e6;
  }
`;
