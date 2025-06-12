import styled from 'styled-components';
import { COLORS } from '../Home/Home.styles';

export const Container = styled.div`
  width: 100%;
  padding: 24px;
  background-color: ${COLORS.white};
  min-height: 100vh;
  h1{
  font-size: 1.75rem;
  margin: 0 0 8px 0;
  }
  p{
  font-size: 14px;
  color: #888;
  margin: 0;
  }
`;

export const ControlsContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap; // Allow wrapping on smaller screens

  input[type="text"], input[type="date"], select {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px; // Consistent font size
  }

  input[type="date"] {
    min-width: 120px; // Ensure date inputs have enough space
  }
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center; /* Or left, depending on preference */

  button {
   display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
  background-color: #0898e6; // Example primary color
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #0b7ac1; // Darker shade for hover
  }

  svg {
    margin-right: 8px;
  }
  }
`;
