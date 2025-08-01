import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

export const Header = styled.div`
  margin-bottom: 30px;
`;

export const Title = styled.h1`
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

export const Subtitle = styled.p`
  color: #666;
  font-size: 1rem;
  margin: 0;
`;

export const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const EditorSection = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  padding: 20px;
`;

export const PreviewPanel = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  padding: 20px;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
`;

export const TemplateSelector = styled.div`
  margin-bottom: 30px;
`;

export const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

export const TemplateCard = styled.div<{ $isActive?: boolean }>`
  border: 2px solid ${props => props.$isActive ? '#007bff' : '#dee2e6'};
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$isActive ? '#f8f9fa' : 'white'};

  &:hover {
    border-color: #007bff;
    background: #f8f9fa;
  }

  h4 {
    margin: 0 0 8px 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
  }
`;

export const FieldGroup = styled.div`
  margin-bottom: 25px;
`;

export const FieldGroupTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
`;

export const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
`;

export const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
`;

export const CheckboxLabel = styled.label`
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 30px;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #6c757d;
          color: white;
          &:hover { background: #5a6268; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Preview Styles
export const PreviewDocument = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 30px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  max-height: 600px;
  overflow-y: auto;
`;

export const PreviewHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #ddd;
`;

export const PreviewTitle = styled.h1`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 10px 0;
`;

export const PreviewSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 15px 0;
`;

export const PreviewSection = styled.div`
  margin-bottom: 25px;
`;

export const PreviewSectionTitle = styled.h2`
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
`;

// Components for the old template structure (compatibility)
export const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ConfigPanel = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  padding: 20px;
`;

export const Section = styled.div`
  margin-bottom: 25px;
  
  h3 {
    color: #333;
    font-size: 1.1rem;
    margin: 0 0 15px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #dee2e6;
  }
`;

export const PreviewMovimentacao = styled.div`
  margin: 5px 0;
  padding: 8px;
  background: white;
  border-radius: 3px;
  font-size: 11px;
  border-left: 3px solid #0898e6;
  
  span {
    margin-right: 5px;
  }
`;
