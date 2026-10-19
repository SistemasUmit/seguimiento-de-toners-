const { spawn } = require('node:child_process');
const { watch } = require('node:fs');

const root = process.cwd();
const ignoredDirectories = new Set(['.firebase', '.venv', '.vscode', 'node_modules']);
let debounceTimer;
let deploymentRunning = false;
let deploymentQueued = false;

function isIgnored(filename) {
  if (!filename) return true;

  const relativePath = filename.toString().replaceAll('\\', '/');
  const pathSegments = relativePath.split('/');
  return pathSegments.some(segment => segment.startsWith('.') || ignoredDirectories.has(segment)) ||
    /^firebase-debug.*\.log$/i.test(relativePath);
}

function deploy() {
  if (deploymentRunning) {
    deploymentQueued = true;
    return;
  }

  deploymentRunning = true;
  console.log('\nPublicando cambios en Firebase Hosting...');

  const processHandle = spawn('firebase', ['deploy', '--only', 'hosting'], {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });

  processHandle.on('error', error => {
    console.error(`No se pudo iniciar Firebase CLI: ${error.message}`);
  });

  processHandle.on('close', exitCode => {
    deploymentRunning = false;
    console.log(exitCode === 0
      ? 'Publicación completada.'
      : `La publicación terminó con código ${exitCode}. Revisa el acceso a Firebase.`);

    if (deploymentQueued) {
      deploymentQueued = false;
      debounceTimer = setTimeout(deploy, 2000);
    }
  });
}

console.log('Observando cambios para publicar en Firebase Hosting.');
console.log('Deja esta tarea activa mientras trabajas; Ctrl+C la detiene.');

const watcher = watch(root, { recursive: true }, (_eventType, filename) => {
  if (isIgnored(filename)) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (deploymentRunning) {
      deploymentQueued = true;
      return;
    }
    deploy();
  }, 2000);
});

watcher.on('error', error => {
  console.error(`No se pudo observar la carpeta: ${error.message}`);
});

process.on('SIGINT', () => {
  clearTimeout(debounceTimer);
  watcher.close();
  process.exit(0);
});