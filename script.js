// ==========================================================
// LÓGICA DE FIRMA DIGITAL (Canvas)
// ==========================================================

// Variable global para almacenar el ID de la tarjeta activa
let currentSignatureCardId = '';

// Variables para el Canvas de dibujo
let canvas, ctx;
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

    // A) Si estamos en la página de login (index1.html) y hay un token, redirigir al dashboard.
    if (token && (currentPage === '/index.html' || currentPage === '/')) {
        // Redirige al dashboard/contenido principal si ya está logeado.
        window.location.href = '/sistema.html'; // Cambia a tu nuevo dashboard.html
        return true;
    }

    // B) Si estamos en el dashboard (index.html) y NO hay token, redirigir al login.
    if (!token && (currentPage === '/sistema.html' || currentPage === '/sistema.html')) {
        alert('Sesión expirada. Por favor, inicia sesión.');
        window.location.href = '/index.html'; // Redirige al login
        return false;
    }
    
    // Opcional: Validación extra con el backend (ruta /auth/me o similar)
    // Para simplificar, solo verificaremos la existencia del token.
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
function restrictAdminSection() {
    const userRole = localStorage.getItem('userRol');
    const adminSection = document.getElementById('Administracion');

    if (adminSection) {
        // Asumiendo que 'Admin' es el rol que da acceso total
        if (userRole === 'Admin' || userRole === 'Administrador') { 
            adminSection.style.display = 'block'; // Mostrar
        } else {
            adminSection.style.display = 'none'; // Ocultar
            // Opcional: mostrar un mensaje de error o redirigir
        }
    }
}

// script.js

/**
 * Función genérica para obtener datos protegidos por JWT.
 */
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

// script.js (Tu función initAdminPanel debe verse así)

async function initAdminPanel() {
    const userRole = localStorage.getItem('userRol');
    const adminSection = document.getElementById('Administracion');
    
    // 1. VERIFICACIÓN DE ROL (SEGURIDAD FRONTAL)
    if (userRole !== 'Admin' && userRole !== 'Administrador') {
        // Si no es administrador, oculta la sección de nuevo (prevención de errores)
        if (adminSection) {
            adminSection.classList.remove('show');
        }
        alert("Acceso denegado: No tienes permisos de administrador.");
        // Opcional: redirigir a otra sección, ej: mostrarContenido('Tablero');
        return; 
    }
    
    // 2. CARGA DE DATOS (Solo para Admin)
    const tbodyUsuarios = document.getElementById('datagridUsuariosRoles')?.querySelector('tbody');
    const tbodyClientes = document.getElementById('datagridClientes')?.querySelector('tbody');

    // Cargar Usuarios
    const usuarios = await fetchData('/api/usuarios'); 
    if (usuarios && tbodyUsuarios) {
        // Asegúrate de que esta función está definida en script.js
        generarFilasUsuariosRoles(usuarios, tbodyUsuarios); 
    } else if (tbodyUsuarios) {
        tbodyUsuarios.innerHTML = '<tr><td colspan="5">No se pudieron cargar los usuarios.</td></tr>';
    }

    // Cargar Clientes
    const clientes = await fetchData('/api/clientes'); 
    if (clientes && tbodyClientes) {
        // Asegúrate de que esta función está definida en script.js
        generarFilasClientes(clientes, tbodyClientes);
    } else if (tbodyClientes) {
        tbodyClientes.innerHTML = '<tr><td colspan="5">No se pudieron cargar los clientes.</td></tr>';
    }
}