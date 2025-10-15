// ==========================================================
// LÓGICA DE FIRMA DIGITAL (Canvas)
// ==========================================================

// Variable global para almacenar el ID de la tarjeta activa
let currentSignatureCardId = '';

// Variables para el Canvas de dibujo
//let canvas, ctx;
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
    // 🔑 USAMOS EL ID DEL ENLACE DEL MENÚ
    const adminLink = document.getElementById('Panel de Administracion'); 
    
    // Si el enlace existe:
    if (adminLink) {
        if (userRole === 'Admin' || userRole === 'Administrador') {
            // ✅ ROL VÁLIDO: Mostrar el enlace
            adminLink.style.display = 'block'; // O el display original del menú
        } else {
            // ❌ ROL INVÁLIDO: Oculta el enlace
            adminLink.style.display = 'none';
        }
    }
    
    // Si el usuario llega a la sección de administración directamente (Admin ya oculta el enlace)
    // Asumimos que esta función se llama al inicio. Si el rol no es Admin, el usuario
    // solo debería ver la sección activa por defecto (ej: Tablero).
    
    const currentSection = document.getElementById('Administracion');
    if (currentSection && userRole !== 'Admin' && userRole !== 'Administrador') {
        // Si el no-admin está en una página donde se carga la sección de Admin, la ocultamos y alertamos.
        // Esto solo es necesario si las URLs no redirigen.
        currentSection.classList.remove('show');
        alert("Acceso denegado: No tienes permisos de administrador.");
        // Opcional: Redirigir al tablero si está usando navegación basada en URL
        // mostrarContenido('Tablero'); 
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
            alert("No tiene permisos de administrador para ver estos datos.");
            return null;
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
    const adminSection = document.getElementById('Administracion'); // Obtenemos la referencia
    
    // 1. VERIFICACIÓN DE ROL
    if (userRole !== 'Admin' && userRole !== 'Administrador') {
        // Para el no-Admin, solo devolvemos, el enlace ya está oculto.
        alert("No tiene permisos de administrador para ver estos datos.");
        return; 
    }
    // 🔑 CLAVE: Si el rol es válido, aseguramos que la sección sea visible.
    // Esto es una medida de seguridad, ya que `mostrarContenido` ya lo hace, 
    // pero garantiza que si la llamada a initAdminPanel falla el CSS de `mostrarContenido` funciona.
    if (adminSection && !adminSection.classList.contains('show')) {
        adminSection.classList.add('show');
    }
    
    // 2. Carga de Usuarios
    const tbodyUsuarios = document.getElementById('datagridUsuariosRoles')?.querySelector('tbody');
    const usuarios = await fetchData('/users'); 
    if (usuarios && Array.isArray(usuarios) && tbodyUsuarios) { 
        generarFilasUsuariosRoles(usuarios, tbodyUsuarios); 
    }
    
    // 3. Carga de Clientes
    const tbodyClientes = document.getElementById('datagridClientes')?.querySelector('tbody');
    const clientes = await fetchData('/clientes'); 
    if (clientes && Array.isArray(clientes) && tbodyClientes) {
        generarFilasClientes(clientes, tbodyClientes);
    }
    console.log('initAdminPanel finalizado y la sección debería ser visible.');
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
    // Obtener todas las secciones de contenido principal
    let secciones = document.querySelectorAll('.main-content');
    
    // 1. OCULTAR TODAS LAS SECCIONES
    secciones.forEach(s => s.classList.remove('show'));
    
    
    // 2. Mostrar la sección de destino
    let seccionAMostrar = document.getElementById(seccionId);
    if (seccionAMostrar) {
        seccionAMostrar.classList.add('show'); // AÑADE LA CLASE 'show'
    } else {
        console.warn('La sección con ID ' + seccionId + ' no fue encontrada.');
    }
    
    // 3. Lógica CRÍTICA: Cargar los datos SOLO si la sección es Administración
    if (seccionId === 'Administracion') {
       initAdminPanel(); // Llama a la carga y garantiza la visibilidad
    }

    // 3. Lógica de Activación de Menú (OK)
    let navButtons = document.querySelectorAll('nav li button');
    navButtons.forEach(btn => btn.parentElement.classList.remove('active'));
    // ... (Tu lógica para añadir 'active' al botón seleccionado) ...
     // Encuentra el botón correspondiente y añade la clase 'active' a su padre (li)
            navButtons.forEach(btn => {
                if (btn.textContent === seccionId || (seccionId === 'Tablero' && btn.textContent === 'Tablero') || (seccionId === 'Administracion' && btn.textContent === 'Administracion')) {
                    btn.parentElement.classList.add('active');
                }
            });
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
        document.getElementById('edit-rol').value = data.rol || '';
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

  const canvas = document.getElementById('firmaCanvas');
  const ctx = canvas.getContext('2d');
  const limpiarBtn = document.getElementById('limpiarBtn');
  const guardarBtn = document.getElementById('guardarBtn');
  const imagenFirma = document.getElementById('imagenFirma');

  let dibujando = false;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  canvas.addEventListener('mousedown', (e) => {
    dibujando = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!dibujando) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }); 

  canvas.addEventListener('mouseup', () => dibujando = false);
  canvas.addEventListener('mouseleave', () => dibujando = false);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dibujando = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!dibujando) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  });

  canvas.addEventListener('touchend', () => dibujando = false);

  limpiarBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  guardarBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL("image/png");
    const img = document.createElement("img");
    img.src = dataURL;
    img.alt = "Firma del cliente";
    img.classList.add("imagen-firma-guardada");
    imagenFirma.innerHTML = "";
    imagenFirma.appendChild(img);
  });

  function agregarActividad() {
    const fotoAntesSrc = document.getElementById('foto-antes').src;
    const fotoDespuesSrc = document.getElementById('foto-despues').src;
    const firma = document.getElementById('imagenFirma').querySelector('img')?.src || '';
    const descripcion = document.getElementById('descripcion').value;

    const actividadDiv = document.createElement('div');
    actividadDiv.innerHTML = `
      <img src="${fotoAntesSrc}" alt="Foto Antes">
      <img src="${fotoDespuesSrc}" alt="Foto Después">
      ${firma ? `<img src="${firma}" alt="Firma">` : ''}
      <p>Descripción: ${descripcion}</p>
      <hr>
    `;
    document.getElementById('actividades-realizadas').appendChild(actividadDiv);

    document.getElementById('foto-antes').src = '';
    document.getElementById('foto-despues').src = '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    imagenFirma.innerHTML = '';
    document.getElementById('descripcion').value = '';
  }


// script.js (Añadir listener al alcance global, probablemente dentro de DOMContentLoaded)

