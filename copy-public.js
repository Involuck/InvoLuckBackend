import fs from 'fs-extra';

try {
  await fs.copy('public', 'dist');
  console.log('Archivos copiados exitosamente');
} catch (err) {
  console.error('Error copiando archivos:', err);
  process.exit(1);
}
