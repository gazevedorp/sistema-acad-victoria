import { 
  formatDateVarchar, 
  formatTimeVarchar, 
  formatDateTimeVarchar,
  convertDateForInput,
  convertTimeForInput
} from '../src/utils/formatter';

// Testes dos formatadores VARCHAR
console.log('=== Testes de Formatação de Datas e Horas VARCHAR ===\n');

console.log('--- Testes formatDateVarchar ---');
console.log('DD/MM/YYYY:', formatDateVarchar('15/03/2024')); // Deve manter: 15/03/2024
console.log('YYYY-MM-DD:', formatDateVarchar('2024-03-15')); // Deve converter: 15/03/2024
console.log('YYYYMMDD:', formatDateVarchar('20240315'));     // Deve converter: 15/03/2024
console.log('ISO:', formatDateVarchar('2024-03-15T10:30:00Z')); // Deve converter: 15/03/2024
console.log('Vazio:', formatDateVarchar(''));               // Deve retornar: -
console.log('Null:', formatDateVarchar(null));              // Deve retornar: -

console.log('\n--- Testes formatTimeVarchar ---');
console.log('HH:MM:', formatTimeVarchar('14:30'));          // Deve manter: 14:30
console.log('HH:MM:SS:', formatTimeVarchar('14:30:45'));    // Deve converter: 14:30
console.log('HHMM:', formatTimeVarchar('1430'));            // Deve converter: 14:30
console.log('HMM:', formatTimeVarchar('830'));              // Deve converter: 08:30
console.log('HHMMSS:', formatTimeVarchar('143045'));        // Deve converter: 14:30:45
console.log('Vazio:', formatTimeVarchar(''));               // Deve retornar: -

console.log('\n--- Testes formatDateTimeVarchar ---');
console.log('ISO completo:', formatDateTimeVarchar('2024-03-15T14:30:00Z')); // Deve converter: 15/03/2024 14:30
console.log('Espaçado:', formatDateTimeVarchar('2024-03-15 14:30')); // Deve converter: 15/03/2024 14:30
console.log('Vazio:', formatDateTimeVarchar(''));           // Deve retornar: -

console.log('\n--- Testes de conversão para inputs ---');
console.log('convertDateForInput DD/MM/YYYY:', convertDateForInput('15/03/2024')); // Deve converter: 2024-03-15
console.log('convertDateForInput YYYY-MM-DD:', convertDateForInput('2024-03-15')); // Deve manter: 2024-03-15
console.log('convertTimeForInput HHMM:', convertTimeForInput('1430'));            // Deve converter: 14:30
console.log('convertTimeForInput HH:MM:', convertTimeForInput('14:30'));          // Deve manter: 14:30

console.log('\n=== Fim dos Testes ===');