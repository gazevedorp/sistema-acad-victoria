import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

interface SpinnerProps {
  color?: string;
}

const Spinner = styled.div<SpinnerProps>`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid ${(props) => props.color || "#fff"};
  border-left-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

interface LoaderProps {
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({ color = "#fff" }) => {
  return <Spinner color={color} />;
};

export default Loader;
