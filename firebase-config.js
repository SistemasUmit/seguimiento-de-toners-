// 1. Ve a https://console.firebase.google.com y crea un proyecto (gratis).
// 2. Dentro del proyecto: Compilación > Firestore Database > Crear base de datos (modo producción).
// 3. En la página principal del proyecto haz clic en el ícono </> ("Agregar app web") y
//    regístrala con cualquier nombre. Firebase te mostrará un objeto como el de abajo.
// 4. Reemplaza estos valores de ejemplo por los tuyos y guarda el archivo.

// Este archivo solo exporta la configuración; script.js carga el SDK de Firebase
// desde CDN para permitir ejecutar la aplicación directamente con Live Server.
const firebaseConfig = {
  apiKey: "AIzaSyCLjM2qi4N0YPEiCEG9fuGfMo9-61T7b7E",
  authDomain: "seguimiento-de-toners.firebaseapp.com",
  projectId: "seguimiento-de-toners",
  storageBucket: "seguimiento-de-toners.firebasestorage.app",
  messagingSenderId: "227928606331",
  appId: "1:227928606331:web:4c75ccbd00222a5c5dc4de", 
  measurementId: "G-13547TE5L3"
};

export { firebaseConfig };