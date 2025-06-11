import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  /* Add more styles as needed */
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
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.2s;
    display: flex; /* Align icon center */
    align-items: center; /* Align icon center */
    justify-content: center; /* Align icon center */

    &:hover {
      background-color: #f0f0f0; /* Light hover effect */
    }

    svg {
      font-size: 16px; /* Adjust icon size */
      color: #333; /* Icon color */
    }
  }
`;
