#!/usr/bin/env node

/**
 * Script de verificación de configuración
 * Verifica que todas las dependencias y archivos necesarios estén presentes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de TimeFlow...\n');

const checks = [
  {
    name: 'Archivo .env',
    path: '.env',
    required: true
  },
  {
    name: 'Variables de entorno en .env',
    check: () => {
      if (!fs.existsSync('.env')) return false;
      const env = fs.readFileSync('.env', 'utf8');
      return env.includes('VITE_MICROSOFT_CLIENT_ID') && 
             env.includes('VITE_MICROSOFT_TENANT_ID') &&
             env.includes('VITE_API_URL');
    },
    required: true
  },
  {
    name: 'authConfig.js',
    path: 'src/config/authConfig.js',
    required: true
  },
  {
    name: 'authService.js',
    path: 'src/services/authService.js',
    required: true
  },
  {
    name: 'calendarService.js',
    path: 'src/services/calendarService.js',
    required: true
  },
  {
    name: 'CalendarEvents componente',
    path: 'src/components/calendar/CalendarEvents.jsx',
    required: true
  },
  {
    name: 'Calendar página',
    path: 'src/pages/Calendar.jsx',
    required: true
  },
  {
    name: 'AuthContext actualizado',
    check: () => {
      const path = 'src/contexts/AuthContext.jsx';
      if (!fs.existsSync(path)) return false;
      const content = fs.readFileSync(path, 'utf8');
      return content.includes('loginMicrosoft');
    },
    required: true
  },
  {
    name: 'Dependencia @azure/msal-browser',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.dependencies && packageJson.dependencies['@azure/msal-browser'];
    },
    required: true
  },
  {
    name: 'Dependencia @azure/msal-react',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.dependencies && packageJson.dependencies['@azure/msal-react'];
    },
    required: true
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  let result = false;
  
  if (check.path) {
    result = fs.existsSync(check.path);
  } else if (check.check) {
    result = check.check();
  }
  
  if (result) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else {
    console.log(`❌ ${check.name}${check.required ? ' (REQUERIDO)' : ''}`);
    failed++;
  }
});

console.log(`\n📊 Resultados:`);
console.log(`   ✅ Pasadas: ${passed}`);
console.log(`   ❌ Fallidas: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 ¡Configuración completa! Puedes ejecutar la aplicación.');
  process.exit(0);
} else {
  console.log('\n⚠️  Hay elementos faltantes. Revisa la configuración.');
  process.exit(1);
}
