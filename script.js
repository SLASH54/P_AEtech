// ==========================================================
// LÓGICA DE FIRMA DIGITAL (Canvas)
// ==========================================================

// Variable global para almacenar el ID de la tarjeta activa
let currentSignatureCardId = '';

// Variables para el Canvas de dibujo
//let canvas, ctx;
let ctx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Inicializa el canvas una vez que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // ... código de botones y previewImage anterior ...
    
    // Inicializar el canvas
    canvas = document.getElementById('signature-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        setupCanvas();
    }
});

// Configuración inicial del canvas
function setupCanvas() {
    ctx.strokeStyle = '#000000'; // Color de la línea (negro)
    ctx.lineCap = 'round';       // Borde de la línea
    ctx.lineWidth = 4;           // Grosor de la línea

    // Event listeners para ratón
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Event listeners para dispositivos táctiles
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    // Evita el scroll de la página al dibujar en el canvas en móvil
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
}

// ----------------------------------------------------
// FUNCIONES DE DIBUJO
// ----------------------------------------------------

// Obtiene coordenadas (funciona para ratón y táctil)
function getClientCoords(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function startDrawing(e) {
    isDrawing = true;
    const { x, y } = getClientCoords(e);
    
    // Calcular la posición relativa al canvas
    const rect = canvas.getBoundingClientRect();
    lastX = x - rect.left;
    lastY = y - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function draw(e) {
    if (!isDrawing) return;
    
    // Prevenir el scroll en móvil (repetido para seguridad)
    if (e.type === 'touchmove') {
        e.preventDefault();
    }
    
    const { x, y } = getClientCoords(e);
    const rect = canvas.getBoundingClientRect();
    const currentX = x - rect.left;
    const currentY = y - rect.top;
    
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    lastX = currentX;
    lastY = currentY;
}

function stopDrawing() {
    isDrawing = false;
}

// ----------------------------------------------------
// FUNCIONES DE INTERACCIÓN (Modal)
// ----------------------------------------------------

function openSignaturePad(cardId) {
    currentSignatureCardId = cardId;
    document.getElementById('signature-modal').style.display = 'block';
    // Limpiar el canvas al abrir por defecto
    clearSignature(); 
}

function closeSignaturePad() {
    document.getElementById('signature-modal').style.display = 'none';
    currentSignatureCardId = '';
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature() {
    // 1. Verifica si el canvas está vacío
    if (isCanvasEmpty()) {
        alert('Por favor, dibuje una firma antes de guardar.');
        return;
    }
    
    // 2. Obtiene la imagen de la firma como Data URL
    const signatureDataURL = canvas.toDataURL('img/png');
    
    // 3. Inserta la imagen en el placeholder de la tarjeta principal
    const placeholder = document.getElementById(signature-$,{currentSignatureCardId});
    if (placeholder) {
        // Limpiar contenido anterior (ícono/texto)
        placeholder.innerHTML = ''; 
        
        // Crear elemento de imagen y configurarlo
        const img = document.createElement('img');
        img.src = signatureDataURL;
        img.alt = 'Firma del cliente capturada';
        
        // Añadir la imagen al placeholder
        placeholder.appendChild(img);
        
        // 4. Actualizar el texto de Valor
        const valorP = document.getElementById(valor-$,{currentSignatureCardId});
        if(valorP) {
            valorP.innerHTML = 'Valor: <strong>FIRMADO</strong>';
        }
    }
    
    // 5. Cierra el modal
    closeSignaturePad();
}

// Función auxiliar para verificar si el canvas está vacío
function isCanvasEmpty() {
    // Compara la Data URL del canvas actual con la Data URL de un canvas vacío
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    return canvas.toDataURL() === tempCanvas.toDataURL();
}

// Cierra el modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('signature-modal');
    if (event.target == modal) {
        closeSignaturePad();
    }
}






























// Función para desplegar/ocultar el menú en móviles
function toggleMenu() {
    const menu = document.getElementById('main-menu');
    menu.classList.toggle('open');
}

// Opcional: Si quieres que el menú se oculte automáticamente al hacer clic en un botón:
// function mostrarContenido(contenidoId) {
//     // ... Tu lógica actual para cambiar el contenido de la página ...
//     
//     // Ocultar el menú después de la selección en móvil
//     const menu = document.getElementById('main-menu');
//     if (menu.classList.contains('open') && window.innerWidth <= 768) {
//         menu.classList.remove('open');
//     }
// }







// Código Frontend
const API_BASE_URL = 'https://p-aetech.onrender.com/api'; // Esto lo reemplazarás
// ...
//const response = await fetch(`${API_BASE_URL}/auth/login, { /* ... */ }`);



// script.js

/**
 * Verifica si hay un token de sesión guardado y lo valida si es necesario.
 */
const checkSession = async () => {
    const token = localStorage.getItem('userToken');
    const currentPage = window.location.pathname;

    // A) Si estamos en la página de login (index.html) y hay un token, redirigir al dashboard.
    if (token && (currentPage === '/index.html' || currentPage === '/')) {
        window.location.href = '/sistema.html'; // Redirige al dashboard
        return true;
    }

    // B) Si estamos en el dashboard (sistema.html) y NO hay token, redirigir al login.
    if (!token && (currentPage === '/sistema.html' || currentPage === '/sistema.html')) {
        alert('Sesión expirada. Por favor, inicia sesión.');
        window.location.href = '/index.html'; // Redirige al login
        return false;
    }
    
    // Si la sesión es válida (hay token) y estamos en sistema.html, devolvemos true.
    return !!token;
};

/**
 * Función para cerrar sesión.
 */
const logout = () => {
    localStorage.removeItem('userToken');
    alert('Sesión cerrada.');
    window.location.href = '/index.html'; // Redirige al login
};

/**
 * Carga el nombre y email del usuario en el contenedor de perfil existente en sistema.html.
 */
function loadUserInfo() {
    // 1. Obtener los datos del localStorage
    const name = localStorage.getItem('userName') || 'Usuario';
    const email = localStorage.getItem('userEmail') || 'No disponible';

    // 2. Localizar los elementos por sus clases o IDs
    // Debes cambiar cómo accedes a los elementos dentro de tu contenedor <div class="profile-info">
    
    // Asumiendo que el botón de logout estará fuera de este div, pero en la misma página.
    
    // Obtenemos el contenedor principal (opcional, si solo lo usas para agrupar)
    const profileContainer = document.getElementById('profile-info'); 
    
    // Obtenemos los elementos de texto (usa querySelector para clases si no tienen ID)
    const nameElement = profileContainer ? profileContainer.querySelector('.profile-name') : null;
    const emailElement = profileContainer ? profileContainer.querySelector('.profile-email') : null;
    
    
    if (nameElement && emailElement) {
        // 3. Insertar la información
        nameElement.textContent = name;
        emailElement.textContent = email;
    }
      
}

// Asegúrate de que esta función se llame al cargar la página:
document.addEventListener('DOMContentLoaded', function() {
    initEvidencias();
    // 1. Ejecuta la verificación de sesión
    checkSession(); 
    
    // 2. Carga los datos del usuario en el menú
    loadUserInfo();
});

// Función para manejar el inicio de sesión
const loginUser = async (e) => {
    e.preventDefault(); // Evita que el formulario se envíe de la forma tradicional (recarga de página)
    
    // 1. Obtener los valores del formulario de login
    // IDs de tu HTML: email_input y password_input
    const email = document.getElementById('email_input').value; 
    const password = document.getElementById('password_input').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            // Manejo de errores 401 (Unauthorized) o 403 (Forbidden)
            const errorData = await response.json();
            throw new Error(errorData.message || 'Credenciales incorrectas o error en el servidor.');
        }

        const data = await response.json();

         // 🔑 AGREGAMOS ESTA LÍNEA CLAVE 🔑
        console.log('Respuesta COMPLETA del Servidor al Login:', data);
        
        // 1. Guardar el Token
        localStorage.setItem('userToken', data.token);
        let rolDelUsuario = 'Usuario'; // Valor por defecto

    

        // 2. Intento de guardar el nombre y email
        // Dejaremos la versión más segura (asumiendo que viene en 'user')
        if (data.nombre && data.email) {
            localStorage.setItem('userName', data.nombre);
            localStorage.setItem('userEmail', data.email);
        }

        if  (data.rol) {
            localStorage.setItem('userRol', data.rol)
        }
        

     

        
        if (data.user && data.rol) {
            // Si el backend SI devuelve { user: { rol: '...' } }, usa ese valor
            rolDelUsuario = data.rol;
        } 
        
        // Si el backend NO devuelve el rol, solo muestra un mensaje de éxito
        alert(`✅ Login Exitoso! Bienvenido ${data.nombre || data.email}`);
        
        // 3. Redirigir o cambiar la vista
        //mostrarContenido('Tablero');
        window.location.href = "sistema.html";

        // Llamar al iniciar sesión (para registrar FCM)
setTimeout(() => {
  if (typeof solicitarPermisoNotificaciones === "function") {
    solicitarPermisoNotificaciones();
  } else {
    console.warn("⚠️ Firebase aún no se ha cargado, se intentará más tarde.");
  }
}, 4000);

        
    } catch (error) {
        console.error("Error de login:", error.message);
        alert('⚠ Error de inicio de sesión: ' + error.message);
    }

};



// Función para manejar el registro de nuevos usuarios
const registerUser = async (e) => {
    e.preventDefault(); // Evita la recarga de la página al enviar el formulario
    
    // 1. Obtener los datos del formulario de registro (#registroForm)
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rol = 'Practicante';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Enviamos todos los campos necesarios al backend
            body: JSON.stringify({ nombre, email, password, rol }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Esto captura errores como 'El email ya existe'
            throw new Error(errorData.message || 'Fallo el registro del usuario.');
        }

        // El backend devuelve el nuevo usuario (sin token, ya que es registro)
        const data = await response.json(); 

        let userEmail = data.user?.email || data.email || 'Desconocido';
        let userRol = data.user?.rol || data.rol || 'Desconocido';

        alert(`🎉 Registro Exitoso! Usuario ${userEmail} creado con rol ${userRol}.`);

        
        // Opcional: Después de registrar, puedes redirigir al login
        document.getElementById('registroForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        
    } catch (error) {
        console.error("Error de registro:", error.message);
        alert('⚠ Error en el registro: ' + error.message);
    }
};


/**
 * Función para manejar el registro de nuevos clientes.
 */
const registerClient = async (e) => {
    e.preventDefault(); 
    
    // 1. Obtener el Token JWT del usuario logeado
    const token = localStorage.getItem('userToken');
    
    // 🛑 SEGURIDAD: Si no hay token, no podemos registrar un cliente
    if (!token) {
        alert("⚠️ Necesitas iniciar sesión para registrar clientes.");
        // Redirigir al login si es necesario
        window.location.href = '/index.html'; 
        return;
    }

    // 2. Obtener los datos del formulario
    const nombre = document.getElementById('client-nombre').value;
    const email = document.getElementById('client-email').value;
    const direccion = document.getElementById('client-direccion').value;
    const telefono = document.getElementById('client-telefono').value; // ¡Usaremos 'client-telefono' para evitar conflictos!

    try {
        // 3. Petición al Backend con el Token
        const response = await fetch(`${API_BASE_URL}/clientes`, { // ⬅️ Cambia '/clientes' por tu ruta real
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 🔑 INCLUYE EL TOKEN JWT PARA AUTENTICAR LA PETICIÓN 🔑
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, email, direccion, telefono }),
        });

        if (response.status === 401 || response.status === 403) {
             throw new Error("No tienes permisos o la sesión ha expirado.");
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fallo el registro del cliente.');
        }

        const data = await response.json(); 
        
        alert(`🎉 Cliente ${nombre || email} registrado con éxito!`);
        
        // Limpiar el formulario después del éxito
        e.target.reset();
        
    } catch (error) {
        console.error("Error al registrar cliente:", error.message);
        alert('⚠️ Error en el registro del cliente: ' + error.message);
    }
};

const registroClienteForm = document.getElementById('registroClienteFrom');
    if(registroClienteForm) {
        registroClienteForm.addEventListener('submit', registerClient);
    }


/**
 * Muestra/Oculta la sección de Administración basada en el rol.
 */


// script.js

/**
 * Función genérica para obtener datos protegidos por JWT.
 */


// script.js (Tu función initAdminPanel debe verse así)
// script.js (Dentro de initAdminPanel)




        document.addEventListener('DOMContentLoaded', function () {
            const datagridUsuariosRoles = document.getElementById('datagridUsuariosRoles').querySelector('tbody');
            const datagridClientes = document.getElementById('datagridClientes').querySelector('tbody');


            // script.js

// script.js

// Función para generar las filas de la tabla de usuarios con roles


// Haz la misma revisión para generarFilasClientes (usando 'nombre', 'email', 'direccion', 'telefono')

// Función para generar las filas de la tabla de clientes


        

            // Función para agregar un nuevo usuario con rol
            function agregarUsuarioConRol(usuario) {
                const nuevaFila = `
                    <tr>
                        <td>${usuario.nombre}</td>
                        <td>${usuario.email}</td>
                        <td>${usuario.rol}</td>
                        <td>${usuario.contraseña}</td>
                    </tr>
                `;
                datagridUsuariosRoles.innerHTML += nuevaFila;
            }

            // Función para agregar un nuevo cliente
            function agregarCliente(cliente) {
                const nuevaFila = `
                    <tr>
                        <td>${cliente.nombre}</td>
                        <td>${cliente.email}</td>
                         <td>${cliente.contraseña}</td>
                    </tr>
                `;
                datagridClientes.innerHTML += nuevaFila;
            }

            // Ejemplo de cómo agregar un nuevo usuario
            // agregarUsuarioConRol({ nombre: "Nuevo Usuario", email: "nuevo@example.com", rol: "Ingeniero" });
            // agregarCliente({ nombre: "Nuevo Cliente", email: "cliente@example.com" });
        });









        // ===================================================
// script.js (ALCANCE GLOBAL)
// ===================================================

// Función restrictAdminSection - (OK, déjala global si necesitas usarla en DOMContentLoaded)
// 📄 script.js (Función para ocultar el ENLACE del menú y dar alerta)

function restrictAdminSection() {
  const userRole = localStorage.getItem('userRol');
  const adminLink = document.getElementById('Panel de Administracion');
  const adminSection = document.getElementById('Administracion');

  // 🔹 Control del enlace del menú
  if (adminLink) {
    if (userRole === 'Admin' || userRole === 'Administrador') {
      adminLink.style.display = 'block';
    } else {
      adminLink.style.display = 'none'; // lo ocultamos para roles no admin
    }
  }

  // 🔹 Control de la sección de administración
  if (adminSection) {
    if (userRole !== 'Admin' && userRole !== 'Administrador') {
      adminSection.classList.remove('show'); // solo la ocultamos
      console.log('Rol sin permisos de administrador: sección oculta.'); 
      // 🔸 eliminamos el alert para que no moleste
      // Opcional: puedes redirigir automáticamente al tablero
      // mostrarContenido('Tablero');
    } else {
      adminSection.classList.add('show');
    }
  }
}

// Función fetchData - (OK, déjala global)
async function fetchData(endpoint) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        alert("Sesión expirada. Inicie sesión.");
        window.location.href = '/index.html';
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn("⚠️ Acceso restringido al panel administrativo, pero usuario puede acceder al tablero.");
            return null; // no bloquear el resto del sistema
            //alert("No tiene permisos de administrador para ver estos datos.");
            //return null;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener datos.`);
        }

        return await response.json();

    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}


    // 2. OBTENER Y CARGAR DATOS (Tu lógica actual)
    const tbodyUsuarios = document.getElementById('datagridUsuariosRoles')?.querySelector('tbody');
    // ... tu lógica de carga de datos ...

// Función initAdminPanel - (OK, déjala global)
async function initAdminPanel() {
  const userRole = localStorage.getItem('userRol');
  const adminSection = document.getElementById('Administracion');

  // 🔹 Si NO es admin, solo ocultamos el panel de administración
  if (userRole !== 'Admin' && userRole !== 'Administrador') {
    if (adminSection) adminSection.classList.remove('show');
    console.log('Rol sin acceso al panel admin, pero puede usar el tablero.');
    return;
  }

  // 🔹 Si es admin, mostrar sección y cargar datos
  if (adminSection && !adminSection.classList.contains('show')) {
    adminSection.classList.add('show');
  }

  const tbodyUsuarios = document.getElementById('datagridUsuariosRoles')?.querySelector('tbody');
  const usuarios = await fetchData('/users');
  if (usuarios && Array.isArray(usuarios) && tbodyUsuarios) {
    generarFilasUsuariosRoles(usuarios, tbodyUsuarios);
  }

  const tbodyClientes = document.getElementById('datagridClientes')?.querySelector('tbody');
  const clientes = await fetchData('/clientes');
  if (clientes && Array.isArray(clientes) && tbodyClientes) {
    generarFilasClientes(clientes, tbodyClientes);
  }

  console.log('initAdminPanel cargado correctamente.');
}


// Función generarFilasUsuariosRoles - (DEBE SER GLOBAL)
function generarFilasUsuariosRoles(usuarios, tbodyElement) {

    // 🛑 Limpiar el contenido anterior 🛑
    tbodyElement.innerHTML = ''; 
    
    if (!usuarios || usuarios.length === 0) {
        tbodyElement.innerHTML = '<tr><td colspan="5">No se encontraron usuarios.</td></tr>';
        return;
    }

    let filas = '';
    usuarios.forEach(usuario => {
        filas += `
            <tr data-id="${usuario.id}"> 
                <td>${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.rol}</td>
                <td>***</td> 
                <td>
                    <button class="edit-btn" data-type="usuario" data-id="${usuario.id}">Editar</button>
                    <button class="delete-btn" data-type="usuario" data-id="${usuario.id}">Eliminar</button>
                </td>
            </tr>
        `;
    });
    
    // 🔑 Insertar todas las filas de golpe
    tbodyElement.innerHTML = filas;
    
    // Llamar a la función de escucha (si está definida)
    attachCrudListeners(); 

}

// Función generarFilasClientes - (DEBE SER GLOBAL)
function generarFilasClientes(clientes, tbodyElement) {
     // 🛑 AGREGAR ESTA LÍNEA DE LIMPIEZA 🛑
     tbodyElement.innerHTML = ''; 
    
    // Si no hay clientes o el array está vacío, muestra el mensaje
    if (!clientes || clientes.length === 0) {
        tbodyElement.innerHTML = '<tr><td colspan="5">No se encontraron clientes.</td></tr>';
        return;
    }
    
    let filas = '';
    clientes.forEach(cliente => {
        // 🔑 VERIFICA ESTOS NOMBRES: id, nombre, email, direccion, telefono
        filas += `
            <tr data-id="${cliente.id}">
                <td>${cliente.nombre}</td>
                <td>${cliente.email}</td>
                <td>${cliente.direccion}</td> 
                <td>${cliente.telefono}</td>
                <td>
                    <button class="edit-btn" data-type="cliente" data-id="${cliente.id}">Editar</button>
                    <button class="delete-btn" data-type="cliente" data-id="${cliente.id}">Eliminar</button>
                </td>
            </tr>
        `;
    });
    tbodyElement.innerHTML = filas;
    attachCrudListeners();
} 

// Función mostrarContenido (Asumiendo que la tienes)
function mostrarContenido(seccionId) {
    // 1. Obtener TODAS las secciones de contenido principal
    let secciones = document.querySelectorAll('.main-content');
    let navButtons = document.querySelectorAll('#main-menu li button'); // Usa el ID de tu UL

    // 2. OCULTAR TODAS LAS SECCIONES y desactivar botones
    secciones.forEach(s => s.classList.remove('show'));
    navButtons.forEach(btn => btn.parentElement.classList.remove('active'));

    // 3. Mostrar la sección de destino
    let seccionAMostrar = document.getElementById(seccionId);
    if (seccionAMostrar) {
        // 🔑 CLAVE: Añadir la clase 'show' para display: block
        seccionAMostrar.classList.add('show'); 
    } else {
        console.warn('La sección con ID ' + seccionId + ' no fue encontrada.');
        return; // Detener si la sección no existe
    }
    
    // 4. Activar el botón de menú correspondiente
    navButtons.forEach(btn => {
        // Comparamos el ID que se pasa (ej. 'Administracion') con el que el botón intenta mostrar
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`mostrarContenido('${seccionId}')`)) {
             btn.parentElement.classList.add('active');
        }
    });

    // 5. Lógica CRÍTICA: Cargar los datos SOLO si la sección es Administración
    if (seccionId === 'Administracion') {
       // La clase 'show' ya fue aplicada arriba, initAdminPanel se encarga de los datos.
       initAdminPanel();
    }

    // 🔑 CLAVE: Agregar la inicialización de Tareas
    if (seccionId === 'organizador-tareas') {
        initTareas();
    }

     // Ocultar el menú después de la selección en móvil
     const menu = document.getElementById('main-menu');
     if (menu.classList.contains('open') && window.innerWidth <= 910) {
         menu.classList.remove('open');
     }
}




        // script.js (Añadir al alcance global)

function handleDeleteClick(event) {
    // currentTarget es más seguro que target dentro de un bucle forEach o un listener
    const button = event.currentTarget;
    const type = button.getAttribute('data-type'); // 'usuario' o 'cliente'
    const id = button.getAttribute('data-id');     // El ID único del registro

    // Llamar a la función principal de eliminación
    deleteRecord(type, id);
}


// script.js (Añadir al alcance global)

function handleEditClick(event) {
    const button = event.currentTarget;
    const type = button.getAttribute('data-type');
    const id = button.getAttribute('data-id');
    
    // 1. Obtener los datos actuales del registro haciendo una petición GET específica.
    // Usaremos fetchData, pero el endpoint será distinto: /users/ID o /clientes/ID
    const endpoint = (type === 'usuario') ? `/users/${id}` : `/clientes/${id}`;

    fetchData(endpoint).then(data => {
        if (data) {
            openEditModal(data, type);
        } else {
            alert(`No se pudieron obtener los datos del ${type}.`);
        }
    });
}

function openEditModal(data, type) {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');
    
    // 1. Llenar campos ocultos
    document.getElementById('edit-id').value = data.id;
    document.getElementById('edit-type').value = type;
    document.getElementById('recordType').textContent = type.charAt(0).toUpperCase() + type.slice(1);
    
    // 2. Llenar campos comunes
    document.getElementById('edit-nombre').value = data.nombre || '';
    document.getElementById('edit-email').value = data.email || '';
    
    // 3. Mostrar/Ocultar campos específicos
    const userFields = document.getElementById('userFields');
    const clientFields = document.getElementById('clientFields');
    
   if (type === 'usuario') {
        userFields.style.display = 'block';
        clientFields.style.display = 'none';
        
        // 🔑 CAMBIO CRÍTICO: Asignar el valor del rol al SELECT
        const rolSelect = document.getElementById('edit-rol');
        if (rolSelect) {
             // El valor del select debe ser igual al rol que viene de la base de datos (data.rol)
             rolSelect.value = data.rol || '';
        }
    } else { // cliente
        userFields.style.display = 'none';
        clientFields.style.display = 'block';
        // 🔑 NOTA CRÍTICA: Asegúrate de que tu backend use 'direccion' y 'telefono'
        document.getElementById('edit-direccion').value = data.direccion || '';
        document.getElementById('edit-telefono').value = data.telefono || '';
    }
    
    modal.style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Opcional: Cerrar modal haciendo clic fuera de la ventana
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// script.js (Asegúrate de que esta función esté definida globalmente)

function attachCrudListeners() {
    
    // 🗑️ Conectar botones de Eliminar (.delete-btn)
    document.querySelectorAll('.delete-btn').forEach(button => {
        // Importante: Remover listeners anteriores para evitar duplicados al recargar el panel
        button.removeEventListener('click', handleDeleteClick); 
        button.addEventListener('click', handleDeleteClick);
    });
    
    // ✍️ Conectar botones de Editar (.edit-btn) - Lo haremos en el siguiente paso
    document.querySelectorAll('.edit-btn').forEach(button => {
         button.removeEventListener('click', handleEditClick);
         button.addEventListener('click', handleEditClick);
    });
}




// script.js (Añadir al alcance global)
//DELETE
async function deleteRecord(type, id) {
    if (!confirm(`¿Estás seguro de que quieres eliminar este ${type} con ID ${id}? Esta acción es irreversible.`)) {
        return; // Detiene la ejecución si el usuario cancela
    }

    const token = localStorage.getItem('userToken');
    // Define el endpoint basado en el tipo (ej: /users/1 o /clientes/5)
    const endpoint = (type === 'usuario') ? `/users/${id}` : `/clientes/${id}`;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} eliminado con éxito.`);
            // 🔑 Vuelve a cargar el panel para refrescar AMBAS tablas
            initAdminPanel(); 
        } else if (response.status === 404) {
            alert(`Error: ${type} no encontrado. Es posible que haya sido eliminado previamente.`);
        } else {
            // Manejo de otros errores (ej: error del servidor)
            const errorData = await response.json().catch(() => ({ message: response.statusText })); 
            alert(`Error al eliminar ${type}: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error(`Error de conexión al eliminar ${type}:`, error);
        alert('Hubo un error de conexión con el servidor al intentar eliminar el registro.');
    }
}
// ===================================================
// CONEXIÓN PRINCIPAL (DOMContentLoaded)
// ===================================================

document.addEventListener('DOMContentLoaded', function () {
    // 🛑 ELIMINAR ESTO: Ya no necesitas obtener las referencias aquí
    // const datagridUsuariosRoles = document.getElementById('datagridUsuariosRoles').querySelector('tbody');
    // const datagridClientes = document.getElementById('datagridClientes').querySelector('tbody');

    // 🔑 Aquí solo debe ir el código de inicialización:
    
    restrictAdminSection(); 
    // Y la lógica de conexión de botones de menú...
    //
    //
     // 🔑 Conectar el formulario de edición
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const id = document.getElementById('edit-id').value;
            const type = document.getElementById('edit-type').value;
            
            // Recolectar datos del formulario
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            // Limpiar datos específicos que no aplican
            if (type === 'usuario') {
                delete data.direccion;
                delete data.telefono;
            } else { // cliente
                delete data.rol;
            }
            
            const token = localStorage.getItem('userToken');
            const endpoint = (type === 'usuario') ? `/users/${id}` : `/clientes/${id}`;
            
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'PUT', // o 'PATCH', dependiendo de tu backend
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} actualizado con éxito.`);
                    closeModal('editModal');
                    initAdminPanel(); // Recargar las tablas
                } else {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    alert(`Error al actualizar: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Error al enviar el formulario de edición:', error);
                alert('Hubo un error de conexión al guardar los cambios.');
            }
        });
    }
    document.querySelectorAll('nav li button').forEach(button => {
        button.addEventListener('click', function() {
            // Ahora obtiene el ID del atributo data-target
            const sectionId = this.getAttribute('data-target'); 
            if (sectionId) {
                mostrarContenido(sectionId);
            }
        });
    });
});


  function tomarFoto(imgId, uploadId) {
    const input = document.getElementById(uploadId);
    input.click();

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById(imgId).src = event.target.result;
        }
        reader.readAsDataURL(file);
      }
    });
  }


// script.js (Añadir listener al alcance global, probablemente dentro de DOMContentLoaded)

// ... Asumiendo que tus funciones loginUser, checkAuth, logout, fetchData, mostrarContenido, initAdminPanel, y openEditModal (para el modal de admin) ya están aquí.

// =========================================================================
// GESTIÓN DE TAREAS (ID: organizador-tareas)
// =========================================================================

/**
 * Inicializa la sección de Tareas:
 * 1. Carga la lista de tareas desde la API.
 * 2. Carga la lista de usuarios para el selector de asignación.
 * 3. Configura el comportamiento del modal de creación/edición.
 */
/**
 * Inicializa la sección de Tareas:
 * 1. Carga la lista de tareas desde la API.
 * 2. Carga la lista de usuarios para el selector de asignación.
 * 3. Configura el comportamiento del modal de creación/edición.
 */
async function initTareas() {
  console.log('Iniciando sección de Tareas...');
  const tareasBody = document.getElementById('tareasBody');
  if (!tareasBody) return;

  tareasBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Cargando tareas...</td></tr>';

  // 🔹 Detectar rol del usuario logueado
  const rol = localStorage.getItem('userRol') || '';
  let endpoint = '/tareas'; // Por defecto (Admin, Ingeniero)

  // 🔸 Para residentes o practicantes usamos la ruta personalizada
  if (rol === 'Residente' || rol === 'Practicante' || rol === 'Técnico') {
    endpoint = '/tareas/mis-tareas';
  }

  // 🔹 Cargar Tareas según el rol
  const tareas = await fetchData(endpoint);

  if (tareas && tareas.length > 0) {
    renderTareasTable(tareas);
  } else {
    tareasBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No hay tareas asignadas.</td></tr>';
  }

  // 🔹 Configurar modal (solo si renderTareasTable no falló)
  setupTareaModal();

  // 🔹 Cargar recursos
  loadUsersForTareaSelect();
  loadClientesForTareaSelect();
  loadActividadesForTareaSelect();
}


/**
 * Carga usuarios y llena el SELECT del modal de tareas.
 */
async function loadUsersForTareaSelect() {
    const userSelect = document.getElementById('tareaAsignadoA');
    if (!userSelect) return;

    const users = await fetchData('/users'); 
    
    // Limpiar opciones previas, excepto el placeholder
    const placeholder = userSelect.querySelector('option[disabled]');
    userSelect.innerHTML = '';
    if (placeholder) {
        userSelect.appendChild(placeholder);
    } else {
        userSelect.innerHTML = '<option value="" disabled selected>-- Seleccione Usuario --</option>';
    }

    if (users && users.length > 0) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id; // Asume que el ID es la clave para asignar
            option.textContent = user.nombre; 
            userSelect.appendChild(option);
        });
    } else {
        console.warn('No se pudieron cargar usuarios para asignación.');
    }
}

/**
 * Carga clientes y llena el SELECT del modal de tareas.
 */
async function loadClientesForTareaSelect() {
    const clienteSelect = document.getElementById('tareaClienteId');
    if (!clienteSelect) return;

    clienteSelect.innerHTML = '<option value="" disabled selected>-- Cargando Clientes... --</option>';

    const clientes = await fetchData('/clientes'); 
    
    // Almacenamos los clientes globalmente para fácil acceso a la dirección
    window.clientesData = {};

    clienteSelect.innerHTML = '<option value="" disabled selected>-- Seleccione Cliente --</option>';

    if (clientes && Array.isArray(clientes) && clientes.length > 0) {
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente._id || cliente.id; // Usar el ID del cliente
            option.textContent = cliente.nombre; 
            clienteSelect.appendChild(option);
            
            window.clientesData[option.value] = cliente; 
        });
        
        // Listener para actualizar la dirección
        clienteSelect.addEventListener('change', updateClientAddress);
        
    } else {
        const errorMessage = (clientes === null) 
            ? 'No tienes permisos para ver clientes.' 
            : 'No se encontraron clientes.';
            
        clienteSelect.innerHTML = `<option value="" disabled selected>${errorMessage}</option>`;
    }
}

async function loadActividadesForTareaSelect() {
    const actividadSelect = document.getElementById('tareaActividadId');
    if (!actividadSelect) return;

    actividadSelect.innerHTML = '<option value="" disabled selected>-- Cargando Actividades... --</option>';

    const actividades = await fetchData('/actividades'); 
    
    actividadSelect.innerHTML = '<option value="" disabled selected>-- Seleccione Actividad --</option>';

    if (actividades && Array.isArray(actividades) && actividades.length > 0) {
        actividades.forEach(actividad => {
            const option = document.createElement('option');
            option.value = actividad._id || actividad.id; // Asume que el ID es la clave
            option.textContent = actividad.nombre; // O el campo que uses para el nombre de la actividad
            actividadSelect.appendChild(option);
        });
    } else {
        const errorMessage = (actividades === null) 
            ? 'No tienes permisos para ver actividades.' 
            : 'No se encontraron actividades.';
            
        actividadSelect.innerHTML = `<option value="" disabled selected>${errorMessage}</option>`;
    }
}

/**
 * Actualiza el campo de dirección basado en el cliente seleccionado.
 */
function updateClientAddress() {
    const clienteId = document.getElementById('tareaClienteId').value;
    const direccionInput = document.getElementById('tareaDireccionCliente');
    
    if (window.clientesData && window.clientesData[clienteId]) {
        direccionInput.value = window.clientesData[clienteId].direccion || 'Dirección no disponible';
    } else {
        direccionInput.value = '';
    }
}

/**
 * Renderiza la lista de tareas en la tabla.
 * @param {Array<Object>} tareas - La lista de tareas a mostrar.
 */

function renderTareasTable(tareas) {
    const tareasBody = document.getElementById('tareasBody');
    if (!tareasBody) return;

    tareasBody.innerHTML = ''; // Limpiar contenido previo
    window.tareasList = tareas; // Guardar globalmente (opcional)

    tareas.forEach(tarea => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-100 transition duration-150';

        // Estado visual
       function getStatusBadge(estado) {
            let color = 'bg-gray-200';
            if (estado === 'Completada') color = 'bg-green-100';
            else if (estado === 'En Progreso') color = 'bg-blue-100';
            else if (estado === 'Pendiente') color = 'bg-yellow-100';
            else if (estado === 'Bloqueada') color = 'bg-red-100';

            return `<span class="badge ${color}">${estado}</span>`;
        }


        // Datos relacionados
        const asignadoNombre = tarea.AsignadoA?.nombre || 'N/A';
        const clienteNombre = tarea.ClienteNegocio?.nombre || 'Sin cliente';
        const clienteDireccion = tarea.ClienteNegocio?.direccion || 'Sin dirección registrada';

        // Fila de la tabla
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${tarea.nombre}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${asignadoNombre}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clienteDireccion)}"
                    target="_blank"
                    class="text-blue-600 hover:underline">
                    ${clienteDireccion}📍
                </a>
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${clienteNombre}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${getStatusBadge(tarea.estado)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatearFechaLocal(tarea.fechaLimite)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openTareaModal('${tarea.id}', 'edit')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    Editar
                </button>
                <button onclick="deleteTarea('${tarea.id}')" class="text-red-600 hover:text-red-900">
                    Eliminar
                </button>
                <button onclick="agregarEvidencia('${tarea.id}')" class="text-green-600 hover:text-green-900">
                    Agregar Evidencias
                </button>
                <!-- Botón PDF (solo activo si la tarea está completada) -->
                ${tarea.estado === 'Completada'
                ? `<button onclick="descargarReportePDF(${tarea.id})" 
                        class="inline-block px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 ml-2">
                        📄 PDF
                    </button>`
                : `<button disabled title="Solo disponible cuando la tarea esté completada" 
                        class="inline-block px-3 py-1 text-sm rounded bg-gray-300 text-gray-600 cursor-not-allowed ml-2">
                        📄 PDF
                    </button>`}
                <button onclick="verEvidencias(${tarea.id})"
                    class="text-purple-600 hover:text-purple-900 ml-2">
                    👁 Ver Evidencias
                </button>


            </td>
        `;

        tareasBody.appendChild(row);
    });
}




function formatearFechaLocal(fecha) {
  if (!fecha) return '';
  const partes = fecha.split('-'); // [año, mes, día]
  const [year, month, day] = partes;
  return `${day}/${month}/${year}`;
}



/**
 * Configura los event listeners para el modal de tareas (abrir/cerrar/enviar).
 */
function setupTareaModal() {
    const modal = document.getElementById('tareaModal');
    const openBtn = document.getElementById('openAddTaskModal');
    const closeBtn = document.getElementById('closeTareaModal');
    const form = document.getElementById('tareaForm');

    // Abrir Modal
    // 🔑 CLAVE: La función openTareaModal se llama con un objeto vacío y modo 'create'.
    openBtn.onclick = () => openTareaModal({}, 'create');

    // Cerrar Modal
    // 🛑 CORREGIDO: Usar 'none' para ocultar el modal
    closeBtn.onclick = () => modal.style.display = 'none';
    
    // Enviar Formulario (Crear/Editar)
    form.onsubmit = async (e) => {
        e.preventDefault();
        const tareaId = document.getElementById('tareaId').value;
        const method = tareaId ? 'PUT' : 'POST';
        // 🔑 NOTA: saveOrUpdateData necesita el endpoint completo, lo construimos aquí.
        const endpoint = tareaId 
            ? `https://p-aetech.onrender.com/api/tareas/${tareaId}` 
            : 'https://p-aetech.onrender.com/api/tareas';
        
        // Recolección de Datos del Formulario con NOMBRES DE BACKEND
        const data = {
            nombre: document.getElementById('tareaTitulo').value, 
            usuarioAsignadoId: document.getElementById('tareaAsignadoA').value, 
            actividadId: document.getElementById('tareaActividadId').value, 
            clienteNegocioId: document.getElementById('tareaClienteId').value, 
            sucursalId: document.getElementById('tareaSucursalId')?.value || '1', 
            descripcion: document.getElementById('tareaDescripcion').value,
            fechaLimite: document.getElementById('tareaFechaLimite').value,
            estado: document.getElementById('tareaEstado').value,
            prioridad : 'Normal'
        };

        const result = await saveOrUpdateData(endpoint, method, data);
        if (result) {
            // Se recomienda usar un modal personalizado en lugar de alert
            alert('Tarea guardada exitosamente.'); 
            modal.style.display = 'none'; 
            initTareas(); // Recargar la lista de tareas
            await cargarNotificaciones();

        }
    };
    
    // Función para manejar el cierre al hacer clic fuera
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

/**
 * Abre y llena el modal para crear o editar una tarea.
 * @param {string|Object} tareaIdOrObject - ID de la tarea si es edición, o un objeto vacío ({}) si es creación.
 * @param {string} mode - 'create' o 'edit'.
 */
function openTareaModal(tareaIdOrObject, mode) {
    const modal = document.getElementById('tareaModal');
    const title = document.getElementById('tareaModalTitle');
    const form = document.getElementById('tareaForm');

    let tarea = {};
    if (mode === 'edit') {
        // 🛑 CORRECCIÓN CLAVE 4: Buscar la tarea completa si solo se pasó el ID
        // Esto depende de que window.tareasList se haya poblado en renderTareasTable
        if (typeof tareaIdOrObject === 'string') {
             tarea = window.tareasList?.find(t => t.id == tareaIdOrObject);
        } else {
             tarea = tareaIdOrObject;
        }

        if (!tarea || !tarea.id) {
            console.error('Error: Tarea no encontrada para edición o datos incompletos.');
            return; 
        }
    }

    if (mode === 'create') {
        title.textContent = 'Crear Nueva Tarea';
        form.reset();
        document.getElementById('tareaId').value = '';
        document.getElementById('tareaDireccionCliente').value = '';
    } else { // mode === 'edit'
        title.textContent = 'Editar Tarea';
        document.getElementById('tareaId').value = tarea.id;
        // 🔑 Rellenar campos con los nombres correctos
        document.getElementById('tareaTitulo').value = tarea.nombre || '';
        document.getElementById('tareaDescripcion').value = tarea.descripcion || '';
        
        if (tarea.fechaLimite) {
            document.getElementById('tareaFechaLimite').value = tarea.fechaLimite.split('T')[0];
        } else {
             document.getElementById('tareaFechaLimite').value = '';
        }
        
        document.getElementById('tareaEstado').value = tarea.estado || '';
        
        // 🔑 Rellenar SELECTS con los IDs
        document.getElementById('tareaAsignadoA').value = tarea.usuarioAsignadoId || '';
        document.getElementById('tareaActividadId').value = tarea.actividadId || '';
        document.getElementById('tareaClienteId').value = tarea.clienteNegocioId || '';
        
        // Disparar la función de dirección
        setTimeout(updateClientAddress, 10);
    }

    // 🛑 CORREGIDO: Usar 'flex' para mostrar el modal
    modal.style.display = 'flex';
}

/**
 * Envía una petición para eliminar una tarea.
 * @param {string} tareaId - El ID de la tarea a eliminar.
 */
async function deleteTarea(tareaId) {
    if (!window.confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        return; 
    }

    // 🔑 NOTA: deleteData necesita el endpoint completo, lo construimos aquí.
    const endpoint = `https://p-aetech.onrender.com/api/tareas/${tareaId}`;
    const response = await deleteData(endpoint);

    if (response) {
        alert('Tarea eliminada exitosamente.');
        initTareas(); // Recargar la tabla
    }
}

// ------------------------------------------------------------------------
// Funciones Auxiliares (Asegurando que usen el endpoint completo si es necesario)
// ------------------------------------------------------------------------

async function saveOrUpdateData(endpoint, method, data) {
    
    const token = localStorage.getItem('userToken');
    if (!token) {
        alert('Sesión expirada. Por favor, inicie sesión de nuevo.');
        return null;
    }
    
    try {
        const response = await fetch(endpoint, { // El endpoint ya viene completo aquí
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`Error al guardar: ${errorData.message || response.statusText}`);
            return null;
        }

        return await response.json();

    } catch (error) {
        console.error('Error en saveOrUpdateData:', error);
        alert('Ocurrió un error de red al intentar guardar los datos.');
        return null;
    }
}

async function deleteData(endpoint) {
    const token = localStorage.getItem('userToken');
    if (!token) {
        alert('Sesión expirada. Por favor, inicie sesión de nuevo.');
        return false;
    }

    try {
        const response = await fetch(endpoint, { // El endpoint ya viene completo aquí
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204 || response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            alert(`Error al eliminar: ${errorData.message || response.statusText}`);
            return false;
        }

    } catch (error) {
        console.error('Error en deleteData:', error);
        alert('Ocurrió un error de red al intentar eliminar.');
        return false;
    }
}




























































































// Variables globales para almacenar las evidencias antes del envío
window.evidenciaData = {
    fotoAntes: null,      // Base64 de la foto antes
    fotoDespues: null,    // Base64 de la foto después
    fotosAdicionales: [], // Array de Base64 de fotos adicionales
    firmas: [],           // Array de Base64 de firmas
    descripcion: ''
};

// Referencia global al contexto del Canvas de firma
let signaturePad = null;
let firmaCanvas = null;



// =========================================================================
// GESTIÓN DE LA SECCIÓN ACTIVIDADES Y EVIDENCIAS
// =========================================================================










// ------------------------------------------------------------------------
// Nota: Las funciones saveOrUpdateData, deleteData, y fetchData deben 
// estar definidas en otro lugar de tu script.js
// ------------------------------------------------------------------------





// ============================
// Subida múltiple de evidencias
// ============================
function initEvidencias(tareaId) {
  const container = document.getElementById('contenedor-evidencias');
  const addBtn = document.getElementById('btnAgregarFoto');
  const saveBtn = document.getElementById('btnGuardarEvidencias');
  const token = localStorage.getItem('userToken');

  if (!container) {
    console.error('No se encontró el contenedor de evidencias');
    return;
  }

  container.innerHTML = ''; // limpia el contenido anterior
  for (let i = 0; i < 2; i++) agregarCampo();

  addBtn.onclick = agregarCampo;

  function agregarCampo() {
    const div = document.createElement('div');
    div.className = 'card-evidencia';
    div.innerHTML = `
      <label>Título de la evidencia</label>
      <input type="text" name="titulo[]" class="titulo" placeholder="Ej: Foto antes de la instalación">
      <label class="label-file">
        <i class="fa-solid fa-camera"></i> Tomar Foto / Elegir Archivo
        <input type="file" name="archivos" class="archivo" accept="image/*" class="archivo">
      </label>
      <div class="preview-container">
        <img class="preview-img" src="" alt="Vista previa" style="display:none;">
      </div>
    `;
    container.appendChild(div);
  }



  // 🔹 Previsualización de imágenes
  document.addEventListener("change", (e) => {
  if (e.target.classList.contains("archivo") && e.target.files[0]) {
    const reader = new FileReader();
    const preview = e.target.closest(".card-evidencia").querySelector(".preview-img");
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});


  

  // 🔹 Guardar evidencias
  saveBtn.onclick = async (e) => {
    e.preventDefault();

    

// 🔹 Guardar evidencias pdf
 //   const pdfUrl = `${API_BASE_URL}/reportes/pdf/${tareaId}?token=${token}`;
// const responsePDF = await fetch(pdfUrl, { headers: { Authorization: `Bearer ${token}` } });
// const blob = await responsePDF.blob();
//const url = window.URL.createObjectURL(blob);
// const a = document.createElement('a');
//a.href = url;
//a.download = `Reporte_Tarea_${tareaId}.pdf`;
//document.body.appendChild(a);
//a.click();
// a.remove();
// window.URL.revokeObjectURL(url);



    const formData = new FormData();
    const titulos = [...document.querySelectorAll('.titulo')].map(i => i.value);
    const archivos = [...document.querySelectorAll('.archivo')];//Posiblemente no lleve "s"(.archivo)
    archivos.forEach(f => { if (f.files[0]) formData.append('archivos', f.files[0]); });
    formData.append('titulos', titulos.join(','));




    // === 🧱 Capturar materiales usados ===
const materiales = [];
document.querySelectorAll('#listaMateriales li').forEach(li => {
  materiales.push(li.textContent);
});

// Agregar al FormData (como texto JSON)
formData.append('materiales', JSON.stringify(materiales));





    console.log('🧾 Archivos a enviar:', archivos.map(f => f.files[0]?.name));


    // Firma del cliente
    const canvas = document.getElementById('signature-pad');
    if (canvas) {
      const firmaData = canvas.toDataURL('image/png');
      const blobBin = atob(firmaData.split(',')[1]);
      const array = [];
      for (let i = 0; i < blobBin.length; i++) array.push(blobBin.charCodeAt(i));
      const firmaFile = new Blob([new Uint8Array(array)], { type: 'image/png' });
      formData.append('firmaCliente', firmaFile, 'firma_cliente.png');
    }
    
    // Mostrar loader
    loader.style.display = 'flex';

    try {
      const res = await fetch(`${API_BASE_URL}/evidencias/upload-multiple/${tareaId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      
      
      if (res.ok) {
        alert('✅ Evidencias subidas correctamente');
        actualizarEstadoTarea(tareaId, 'Completada');
        await cargarNotificaciones();

        // 🔹 Limpiar inputs
  document.querySelectorAll('.titulo').forEach(i => i.value = '');
  document.querySelectorAll('.archivo').forEach(f => f.value = '');
  
  // 🔹 Limpiar firma
  const firmaCanvas = document.getElementById('signature-pad');
  if (firmaCanvas) {
    const ctx = firmaCanvas.getContext('2d');
    ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
  }

  // 🔹 Ocultar sección de evidencias
  const seccionEvidencias = document.getElementById('Actividades'); // cambia el ID si tu contenedor tiene otro nombre
  if (seccionEvidencias) {
    seccionEvidencias.style.opacity = '0';
    setTimeout(() => {
      seccionEvidencias.style.display = 'none';
      seccionEvidencias.style.opacity = '1';
    }, 400);
  }

if (typeof mostrarContenido === 'function') {
  mostrarContenido('Tablero'); // 🔹 Esto redirige directamente al Tablero
} else {
  const tablero = document.getElementById('Tablero');
  if (tablero) {
    tablero.style.display = 'block';
    tablero.scrollIntoView({ behavior: 'smooth' });
  }
}


      } else {
        console.error('Error del servidor:', data);
        alert(data.msg || 'Error al subir evidencias');
      }
    } catch (err) {
      console.error('❌ Error en fetch:', err);
      alert('Error de conexión con el servidor.');
    } finally {
    // Ocultar loader
    loader.style.display = 'none';
  }
  };
}


function actualizarEstadoTarea(tareaId, nuevoEstado) {
  const fila = document.querySelector(`[data-tarea-id="${tareaId}"]`);
  if (fila) fila.querySelector('.estado').textContent = nuevoEstado;
}

// ===============================
// ABRIR FORMULARIO DE EVIDENCIAS
// ===============================
function agregarEvidencia(tareaId) {
  console.log("Tarea seleccionada:", tareaId);

  // Guarda el id temporalmente (puedes usar localStorage o variable global)
  window.tareaActual = tareaId;

  // Muestra el formulario (si está oculto en otra sección)
  mostrarContenido('Actividades'); // si usas tu función ya existente para navegar entre secciones

  // Inicializa el formulario de evidencias dinámicas
  initEvidencias(tareaId);
}




// 🔹 PREVISUALIZACIÓN DE IMÁGENES
// 🔹 PREVISUALIZACIÓN GLOBAL (funciona también en recuadros nuevos)
//document.addEventListener('change', (e) => {
//  if (e.target.matches('input[type="file"][name="archivos[]"]') && e.target.files[0]) {
//    const reader = new FileReader();
//    const preview = e.target.closest('.card-evidencia').querySelector('.preview-img');
//    reader.onload = () => {
//      preview.src = reader.result;
//      preview.style.display = 'block';
//    };
//    reader.readAsDataURL(e.target.files[0]);
//  }
//});


// 🔹 FIRMA DEL CLIENTE
const canvas = document.getElementById('signature-pad');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  // 🔹 Configuración de estilo
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // 🔹 Eventos de ratón
  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });

  canvas.addEventListener('mouseup', () => (drawing = false));
  canvas.addEventListener('mouseleave', () => (drawing = false));

  // 🔹 Eventos táctiles
  const getTouchPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  };

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getTouchPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getTouchPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, { passive: false });

  canvas.addEventListener('touchend', () => (drawing = false));
  canvas.addEventListener('touchcancel', () => (drawing = false));

  // 🔹 Botones de control
  document.getElementById('btnLimpiarFirma').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById('btnGuardarFirma').addEventListener('click', () => {
    const firmaData = canvas.toDataURL('image/png');
    console.log('Firma capturada:', firmaData);
    alert('✅ Firma guardada temporalmente.');
  });
}






// ============================
// SECCIÓN DE MATERIAL OCUPADO (Debajo de la firma del cliente)
// ============================
const firmaContainer = canvas.parentElement; // el contenedor del canvas

const materialContainer = document.createElement("div");
materialContainer.className = "material-container";
materialContainer.style.marginTop = "30px";
materialContainer.style.textAlign = "center";
materialContainer.innerHTML = `
  <h3>🧱 Material Ocupado</h3>
  <div class="inputs">
    <input type="text" id="insumo" placeholder="Insumo">
    <input type="number" id="cantidad" placeholder="Cantidad" min="0">
    <select id="unidad">
      <option value="Kilogramos">Kilogramos</option>
      <option value="Metros">Metros</option>
      <option value="Metros">Unidades</option>
    </select>
    <button id="btnAgregarMaterial">➕ Agregar</button>
  </div>
  <ul id="listaMateriales"></ul>
`;
firmaContainer.insertAdjacentElement("afterend", materialContainer);

// --- lógica JS ---
const listaMateriales = materialContainer.querySelector("#listaMateriales");
const btnAgregarMaterial = materialContainer.querySelector("#btnAgregarMaterial");

btnAgregarMaterial.addEventListener("click", () => {
  const insumo = document.getElementById("insumo").value.trim();
  const cantidad = document.getElementById("cantidad").value.trim();
  const unidad = document.getElementById("unidad").value;

  if (!insumo || !cantidad) {
    alert("Por favor completa todos los campos del material.");
    return;
  }

  const li = document.createElement("li");
  li.textContent = `${insumo} - ${cantidad} ${unidad}`;
  listaMateriales.appendChild(li);





  // Limpiar campos
  document.getElementById("insumo").value = "";
  document.getElementById("cantidad").value = "";
  document.getElementById("unidad").value = "Kilogramos";
});





















// === 1) función que sube evidencias ===
async function subirEvidencias(tareaId) {
  const formData = new FormData();
  const titulos = [...document.querySelectorAll('.titulo')].map(i => i.value);
  const archivos = [...document.querySelectorAll('.archivo')];
  archivos.forEach(f => { if (f.files[0]) formData.append('archivos', f.files[0]); });
  formData.append('titulos', titulos.join(','));

  // Firma desde #signature-pad (si existe)
  const canvas = document.getElementById('signature-pad');
  if (canvas) {
    const firmaData = canvas.toDataURL('image/png');
    const bin = atob(firmaData.split(',')[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    formData.append('firmaCliente', new Blob([arr], { type: 'image/png' }), 'firma_cliente.png');
  }





  const token = localStorage.getItem('userToken');
const res = await fetch(`${API_BASE_URL}/evidencias/upload-multiple/${tareaId}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});

const data = await res.json();

if (res.ok) {
  alert('✅ Evidencias subidas correctamente');

  actualizarEstadoTarea(tareaId, 'Completada');
  await fetch(`${API_BASE_URL}/notificaciones/mark-read-by-tarea/${tareaId}`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}` }
});

// 🔹 Vuelve a cargar las notificaciones para reflejar cambios
cargarNotificaciones();


  // 🕓 Esperar un poco antes de generar el PDF
  setTimeout(async () => {
    try {
      const pdfUrl = `${API_BASE_URL}/reportes/pdf/${tareaId}`;
      const response = await fetch(pdfUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // 🔹 Abre el PDF en una nueva pestaña
      window.open(url, '_blank');
    } catch (err) {
      console.error('❌ Error al generar PDF:', err);
      alert('Las evidencias se guardaron, pero no se pudo generar el PDF automáticamente.');
    }
  }, 1500); // ⏱ Espera 1.5 segundos antes de generar el PDF

} else {
  alert(data.msg || 'Error al subir evidencias');
}}









// Función para cargar las actividades (simulación)
function cargarActividades() {
    const actividades = ["Reunión con Cliente A", "Elaboración de Propuesta", "Seguimiento de Contrato"];
    const listaActividades = document.getElementById("listaActividades");

    actividades.forEach(actividad => {
        const li = document.createElement("li");
        li.textContent = actividad;
        listaActividades.appendChild(li);
    });
}

// Función para cargar las evidencias (simulación)
function cargarEvidencias() {
    const evidencias = [
        { titulo: "Evidencia 1", imagenSrc: "https://via.placeholder.com/150" },
        { titulo: "Evidencia 2", imagenSrc: "https://via.placeholder.com/150" },
        { titulo: "Evidencia 3", imagenSrc: "https://via.placeholder.com/150" }
    ];
    const contenedorEvidencias = document.getElementById("contenedorEvidencias");

    evidencias.forEach(evidencia => {
        const img = document.createElement("img");
        img.src = evidencia.imagenSrc;
        img.alt = evidencia.titulo;
        contenedorEvidencias.appendChild(img);
    });
}


async function verEvidencias(tareaId) {
  const token = localStorage.getItem('userToken');
  const modal = document.getElementById('modalEvidencias');
  const contenedor = document.getElementById('contenedorEvidencias');
  contenedor.innerHTML = '<p>📸 Cargando evidencias...</p>';

// === Mostrar materiales usados si existen ===
if (evidencias[0]?.materiales && evidencias[0].materiales.length > 0) {
  const lista = evidencias[0].materiales;
  let materialesHTML = `
    <div class="materiales-card">
      <h4>🧱 Material Ocupado</h4>
      <ul style="list-style-type:disc; padding-left:25px;">
        ${lista.map(m => `<li>${m}</li>`).join('')}
      </ul>
    </div>
  `;
  contenedor.innerHTML += materialesHTML;
}


  modal.style.display = 'flex';

  try {
    const res = await fetch(`${API_BASE_URL}/evidencias/tarea/${tareaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar evidencias');
    let evidencias = await res.json();

    // Si el backend devuelve un solo objeto, lo convertimos en array
    if (!Array.isArray(evidencias)) evidencias = [evidencias];

    if (evidencias.length === 0) {
      contenedor.innerHTML = '<p>No hay evidencias disponibles para esta tarea.</p>';
      return;
    }

    document.getElementById('contenedorEvidencias').dataset.tareaId = tareaId;
    // 🟩 Renderizar las evidencias (sin incluir firma todavía)
    let html = evidencias.map(ev => `
      <div class="evidencia-card">
        <h4>${ev.titulo || 'Sin título'}</h4>
        ${ev.archivoUrl
          ? `<img src="${ev.archivoUrl}" alt="Evidencia" />`
          : '<p>📄 (Archivo no disponible)</p>'}
      </div>
    `).join('');

    // 🟦 Mostrar la firma del cliente una sola vez, si existe en cualquiera de las evidencias
    const evidenciaConFirma = evidencias.find(ev => ev.firmaClienteUrl);
    if (evidenciaConFirma?.firmaClienteUrl) {
      html += `
        <div class="firma-card">
          <h4>✍️ Firma del Cliente</h4>
          <img src="${evidenciaConFirma.firmaClienteUrl}" alt="Firma del cliente" />
        </div>
      `;
    }

    contenedor.innerHTML = html;

  } catch (err) {
    contenedor.innerHTML = `<p style="color:red;">❌ Error: ${err.message}</p>`;
  }
}

function cerrarModalEvidencias() {
  document.getElementById('modalEvidencias').style.display = 'none';
}


async function descargarEvidencias() {
  const contenedor = document.getElementById('contenedorEvidencias');
  const imagenes = contenedor.querySelectorAll('img');

  if (imagenes.length === 0) {
    alert('No hay evidencias para descargar.');
    return;
  }

  const zip = new JSZip();
  const carpeta = zip.folder('evidencias');

  // Obtener información adicional
  const tareaActual = window.tareasList?.find(t => contenedor.dataset.tareaId == t.id);
  const usuario = JSON.parse(localStorage.getItem('userData') || '{}');
  const nombreTarea = tareaActual?.nombre || 'Tarea sin nombre';
  const asignado = tareaActual?.AsignadoA?.nombre || 'Sin asignar';
  const cliente = tareaActual?.ClienteNegocio?.nombre || 'Sin cliente';
  const fecha = new Date().toLocaleString('es-MX');

  // 📝 Crear archivo info.txt
  const info = `
TAREA: ${nombreTarea}
ASIGNADO A: ${asignado}
CLIENTE: ${cliente}
FECHA DESCARGA: ${fecha}
USUARIO QUE DESCARGÓ: ${usuario?.nombre || 'Desconocido'}

Total de evidencias: ${imagenes.length}
`.trim();

  zip.file('info.txt', info);

  // Mostrar mensaje mientras se genera
  const boton = document.getElementById('btnDescargarEvidencias');
  boton.textContent = '📦 Preparando ZIP...';
  boton.disabled = true;

  // Descargar las imágenes y agregarlas al ZIP
  const promesas = Array.from(imagenes).map(async (img, i) => {
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      carpeta.file(`evidencia_${i + 1}.jpg`, blob);
    } catch (e) {
      console.error(`Error al descargar ${img.src}:`, e);
    }
  });

  await Promise.all(promesas);

  // Generar ZIP final
  const blobZip = await zip.generateAsync({ type: 'blob' });
  saveAs(blobZip, `Evidencias_${nombreTarea.replace(/\s+/g, '_')}.zip`);

  // Restaurar el botón
  boton.textContent = '⬇️ Descargar todas';
  boton.disabled = false;
}





// Cargar datos y asignar funcionalidad al botón al cargar la página
document.addEventListener("DOMContentLoaded", function() {
    cargarActividades();
    cargarEvidencias();

    const btnImprimirPDF = document.getElementById("btnImprimirPDF");
    btnImprimirPDF.addEventListener("click", imprimirPDF);
});







// 🔹 Otras funciones como abrirModalEvidencias(), renderTareasTable(), etc...

// ---------------------------------------------------------
// 📄 Función para descargar reporte PDF de una tarea
// ---------------------------------------------------------
async function descargarReportePDF(tareaId) {
  const token = localStorage.getItem('userToken');
  if (!token) {
    alert('No hay sesión activa.');
    return;
  }
  // Mostrar loader
  loader.style.display = 'flex';
  
  try {
    // Validar que la tarea esté completada antes de generar PDF
const tarea = (window.tareasList || []).find(t => Number(t.id) === Number(tareaId));
if (tarea && tarea.estado !== 'Completada') {
  alert('⚠️ No puedes generar un PDF hasta que la tarea esté completada.');
  return;
}


    const pdfUrl = `${API_BASE_URL}/reportes/pdf/${tareaId}`;
    const response = await fetch(pdfUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Error al generar PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Tarea_${tareaId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('❌ Error al descargar PDF:', err);
    alert('No se pudo generar el PDF. Asegúrate de que la tarea tenga evidencias.');
  } finally {
    // Ocultar loader
    loader.style.display = 'none';
  }
}

// Si tienes algo como initApp() o window.onload, deja esto después









// notificaciones xd ajajajajaja 

const token = localStorage.getItem('userToken');

async function cargarNotificaciones() {
  try {
    const jwt = localStorage.getItem('userToken');
    const res = await fetch(`${API_BASE_URL}/notificaciones`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    const data = await res.json();

    const num = document.getElementById('numNotificaciones');
    const lista = document.getElementById('listaNotificaciones');

    // Filtrar solo las notificaciones activas
    const activas = data.filter(n => !n.leida);
    num.textContent = activas.length;
    lista.innerHTML = '';

    activas.forEach(n => {
      const li = document.createElement('li');
      li.textContent = n.mensaje;
      li.style.fontWeight = 'bold';
      lista.appendChild(li);
    });

    // 🔄 Limpieza periódica (cada carga)
    await fetch(`${API_BASE_URL}/notificaciones/clean-orphans`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt}` }
    });

  } catch (err) {
    console.error('Error al cargar notificaciones:', err);
  }
}




// Mostrar/ocultar lista
document.getElementById('btnNotificaciones').addEventListener('click', () => {
  const lista = document.getElementById('listaNotificaciones');
  lista.style.display = lista.style.display === 'block' ? 'none' : 'block';
});

// Recargar automáticamente cada 30 segundos
setInterval(cargarNotificaciones, 30000);

// Cargar al iniciar
cargarNotificaciones();
//await cargarNotificaciones();














//NOTIFICACIONES VERSION POLLOS

// ======================================================
// 🔔 CONFIGURACIÓN DE NOTIFICACIONES PUSH (Firebase sin módulos)
// ======================================================

// Cargar los scripts de Firebase dinámicamente
const script1 = document.createElement("script");
script1.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
document.head.appendChild(script1);

const script2 = document.createElement("script");
script2.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js";
document.head.appendChild(script2);

script2.onload = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBa6KYyhwI4scIblnOY_VKb-1kSwwO9_Ts",
    authDomain: "aetech-notificaciones.firebaseapp.com",
    projectId: "aetech-notificaciones",
    storageBucket: "aetech-notificaciones.firebasestorage.app",
    messagingSenderId: "742322294289",
    appId: "1:742322294289:web:5bd9e894ad92dbef4dabb0",
    measurementId: "G-ZLZ2LWQ1XE"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Registrar el service worker antes de pedir permisos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(reg => {
      console.log('✅ Service Worker registrado correctamente:', reg);
    })
    .catch(err => {
      console.error('❌ Error registrando Service Worker:', err);
    });
}


  async function solicitarPermisoNotificaciones() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const tokenFCM = await messaging.getToken({
          vapidKey: "BOTEAlz-7hYedgFy9YSbo3txG_14XJaf0tt4qCCwS3ifs67umn8UDn5fLirfmTmSh17P5r_cUMhrL8uDnZsiWys"
        });
        console.log("✅ Token FCM generado:", tokenFCM);

        const jwt = localStorage.getItem("userToken");
        if (jwt && tokenFCM) {
          await fetch(`${API_BASE_URL}/users/me/fcm-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify({ fcmToken: tokenFCM }),
          });
          console.log("📩 Token FCM guardado en backend");
        }
      } else {
        console.warn("❌ Permiso denegado por el usuario");
      }
    } catch (err) {
      console.error("⚠️ Error al solicitar permiso de notificación:", err);
    }
  }

  messaging.onMessage((payload) => {
    console.log("🔔 Notificación recibida:", payload);
    const { title, body } = payload.notification;
    if (title || body) {
      new Notification(title, { body, icon: "/img/logoAEtech.png" });
    }
  });

  setTimeout(() => {
    if (localStorage.getItem("userToken")) {
      solicitarPermisoNotificaciones();
    }
  }, 3000);
};


































/* Animaciones y cosas para que se vea chida la pagina*/
// === TABLERO AEtech ===

// 1️⃣ Mostrar nombre del usuario logeado
const nombreUsuario = localStorage.getItem('userName') || 'Usuario';
document.getElementById('nombreUsuario').textContent = nombreUsuario;

// 2️⃣ Fecha y hora actual
function actualizarFechaHora() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const fecha = ahora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('horaActual').textContent = hora;
  document.getElementById('fechaActual').textContent =
    fecha.charAt(0).toUpperCase() + fecha.slice(1);
}
setInterval(actualizarFechaHora, 1000);
actualizarFechaHora();

// 3️⃣ Frase del día aleatoria
const frases = [
  "La innovación comienza con una idea.",
  "Crea, falla, aprende, mejora. Ese es el ciclo.",
  "Cada línea de código es un paso hacia el futuro.",
  "La tecnología es mejor cuando une a las personas.",
  "El límite no está en la máquina, está en la mente."
];
document.getElementById('fraseDia').textContent =
  frases[Math.floor(Math.random() * frases.length)];

// 4️⃣ Clima actual en Atlixco, Puebla (usando Open Meteo API)
async function obtenerClima() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=18.9&longitude=-98.43&current_weather=true'
    );
    const data = await res.json();
    const temp = data.current_weather.temperature;
    const codigo = data.current_weather.weathercode;

    let icono = "☀️";
    if (codigo >= 2 && codigo <= 3) icono = "⛅";
    else if (codigo >= 45 && codigo <= 48) icono = "🌫️";
    else if (codigo >= 51 && codigo <= 67) icono = "🌧️";
    else if (codigo >= 71 && codigo <= 77) icono = "❄️";
    else if (codigo >= 80) icono = "🌦️";

    document.getElementById('climaActual').textContent =
      `${icono} ${temp}°C en Atlixco, Puebla`;
  } catch {
    document.getElementById('climaActual').textContent =
      "No se pudo obtener el clima.";
  }
}
obtenerClima();

// 5️⃣ Saludo dinámico según la hora
function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "🌅 Buenos días";
  if (hora >= 12 && hora < 19) return "☀️ Buenas tardes";
  return "🌙 Buenas noches";
}

// 6️⃣ Mostrar saludo + nombre de usuario
function mostrarSaludoPersonalizado() {
  const nombre = localStorage.getItem('userName') || 'Usuario';
  document.getElementById('nombreUsuario').textContent = `${obtenerSaludo()}, ${nombre}`;
}

mostrarSaludoPersonalizado();
setInterval(mostrarSaludoPersonalizado, 60000); // se actualiza cada minuto


// === Cambiar fondo del tablero según la hora ===
function cambiarFondoSegunHora() {
  const tablero = document.getElementById('TableroAetech');
  if (!tablero) return;

  const hora = new Date().getHours();
  tablero.classList.remove('tablero-manana', 'tablero-tarde', 'tablero-noche');

  if (hora >= 6 && hora < 15) tablero.classList.add('tablero-manana');
  else if (hora >= 15 && hora < 19) tablero.classList.add('tablero-tarde');
  else tablero.classList.add('tablero-noche');
}

cambiarFondoSegunHora();
setInterval(cambiarFondoSegunHora, 3600000);





// estados y municpios xd 

const estado = document.getElementById('client-estado').value.trim();
const municipio = document.getElementById('client-municipio').value.trim();
const direccion = document.getElementById('client-direccion').value.trim();

const clientData = {
  nombre,
  telefono,
  email: email || null,
  direccion,
  estado,
  municipio
};

















