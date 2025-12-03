





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

    const token = localStorage.getItem('userToken');
    if (!token) {
        alert("Necesitas iniciar sesión para registrar clientes.");
        window.location.href = '/index.html';
        return;
    }

    // Datos generales
    const nombre = document.getElementById('client-nombre').value;
    const email = document.getElementById('client-email').value || null;
    const telefono = document.getElementById('client-telefono').value;

    // Los formularios de registro usan 1 estado y 1 municipio para todas las direcciones
    const estado = document.getElementById('client-estado').value;
    const municipio = document.getElementById('client-municipio').value;

    // Múltiples direcciones dinámicas
    // Filtrar inputs vacíos reales (que no contienen texto ni link)
const inputs = [...document.querySelectorAll('input[name="direccion[]"]')];

const direccionesValidas = inputs.filter(input => input.value.trim() !== "");

// Si después de filtrar no queda ninguna → error
if (direccionesValidas.length === 0) {
    alert("Debes ingresar al menos una dirección o un link de Google Maps.");
    return;
}
  const direcciones = [];
const maps = [];

for (let input of direccionesValidas) {
    const procesada = await procesarDireccion(input.value);
    direcciones.push(procesada.direccion);
    maps.push(procesada.maps);
}


//    const maps = [...document.querySelectorAll('input[name="maps[]"]')].map(i => i.value || null);

    // Generamos arrays para el backend
    const estados = direcciones.map(() => estado);
    const municipios = direcciones.map(() => municipio);

    for (let i = 0; i < direcciones.length; i++) {
    if (!direcciones[i] && !maps[i]) {
        alert("Cada dirección debe tener texto o un link de Google Maps.");
        return;
    }
}


    const payload = {
        nombre,
        email,
        telefono,
        estado: estados,
        municipio: municipios,
        direccion: direcciones,
        maps
    };

    try {
        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Error al registrar cliente");
        }

        alert(`Cliente ${nombre} registrado con éxito`);
        e.target.reset();

        // limpiar direcciones dinámicas excepto la primera
        document.getElementById("direccionesContainer").innerHTML = `
            <div class="direccion-item">
                <input type="text" name="direccion[]" placeholder="Ej. Calle 10 Sur #123 o link Google Maps" required>
                <input type="url" name="maps[]" placeholder="Link de Google Maps (opcional)">
                <button type="button" class="btn-remove-dir" onclick="this.parentElement.remove()">Eliminar</button>
            </div>
        `;

    } catch (err) {
        console.error(err);
        alert("Error al registrar cliente: " + err.message);
    }
};


const registroClienteForm = document.getElementById('registroClienteFrom');
    if(registroClienteForm) {
        registroClienteForm.addEventListener('submit', registerClient);
    }


document.getElementById("btnAgregarDireccion").addEventListener("click", () => {
    const cont = document.getElementById("direccionesContainer");

    const div = document.createElement("div");
    div.classList.add("direccion-item");

    div.innerHTML = `
        <input type="text" name="direccion[]" placeholder="Ej. Calle, número o link Maps" required>

        <input type="url" name="maps[]" placeholder="Link Google Maps (opcional)">

        <button type="button" class="btn-remove-dir" onclick="this.parentElement.remove()">
            Eliminar
        </button>
    `;

    cont.appendChild(div);
});


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
    tbodyElement.innerHTML = ''; 
    
    if (!clientes || clientes.length === 0) {
        tbodyElement.innerHTML = '<tr><td colspan="5">No se encontraron clientes.</td></tr>';
        return;
    }
    
    let filas = '';
    clientes.forEach(cliente => {

        // Construir direcciones desde ClienteDireccion
        const direccionesHTML = cliente.direcciones && cliente.direcciones.length > 0
            ? cliente.direcciones
                .map(d => `
                    ${d.direccion}
                    ${d.maps ? `<br><a href="${d.maps}" target="_blank">Ver mapa</a>` : ''}
                `)
                .join("<hr>")
            : "Sin direcciones";

        filas += `
            <tr data-id="${cliente.id}">
                <td>${cliente.nombre}</td>
                <td>${cliente.email || "Sin email"}</td>
                <td>${direccionesHTML}</td> 
                <td>${cliente.telefono || "N/A"}</td>
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

    document.getElementById('edit-id').value = data.id;
    document.getElementById('edit-type').value = type;
    document.getElementById('recordType').textContent =
        type.charAt(0).toUpperCase() + type.slice(1);

    const userFields = document.getElementById('userFields');
    const clientFields = document.getElementById('clientFields');
    const rolSelect = document.getElementById('edit-rol');

    // Campos comunes
    document.getElementById('edit-nombre').value = data.nombre || '';
    document.getElementById('edit-email').value = data.email || '';

    if (type === 'usuario') {
        userFields.style.display = 'block';
        clientFields.style.display = 'none';

        rolSelect.required = true;
        rolSelect.value = data.rol || '';

    } else { // CLIENTE
        userFields.style.display = 'none';
        clientFields.style.display = 'block';

        rolSelect.required = false;
        rolSelect.value = "";

        document.getElementById('edit-telefono').value = data.telefono || '';

        const cont = document.getElementById("direccionesContainer");
        cont.innerHTML = "";

        if (data.direcciones && data.direcciones.length > 0) {
            data.direcciones.forEach(dir => {
                agregarDireccion(dir.direccion || "");
            });
        } else {
            agregarDireccion("");
        }
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


let indexDir = 0;

function agregarDireccion(valor = "") {
    const cont = document.getElementById("direccionesContainer");

    const div = document.createElement("div");
    div.classList.add("direccion-item");

    div.innerHTML = `
        <input type="text" name="direccion[]" 
            placeholder="Dirección o link Google Maps" 
            value="${valor}">
        
        <button type="button" class="btn-remove-dir" onclick="this.parentElement.remove()">
            Eliminar
        </button>
    `;

    cont.appendChild(div);
}



function eliminarDireccion(btn) {
    btn.parentElement.remove();
}


async function procesarDireccion(valor) {
    if (!valor || valor.trim() === "") {
        return { direccion: "", maps: null };
    }

    const esLink = valor.includes("maps.app") || valor.includes("google.com/maps");

    if (!esLink) {
        return { direccion: valor.trim(), maps: null };
    }

    try {
        const resp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(valor)}`);
        const data = await resp.json();
        const html = data.contents;
        const match = html.match(/"title":"([^"]+)"/);
        const direccion = match ? match[1] : valor;

        return { direccion, maps: valor };

    } catch (e) {
        return { direccion: valor, maps: valor };
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
   editForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const id = document.getElementById('edit-id').value;
    const type = document.getElementById('edit-type').value;
    const token = localStorage.getItem('userToken');

    let data;

    if (type === 'usuario') {
        const nombre = document.getElementById('edit-nombre').value;
        const email = document.getElementById('edit-email').value;
        const rol = document.getElementById('edit-rol').value;

        if (!rol) {
            alert("Selecciona un rol.");
            return;
        }

        data = { nombre, email, rol };

    } else { // CLIENTE
        const nombre = document.getElementById('edit-nombre').value;
        const email = document.getElementById('edit-email').value || null;
        const telefono = document.getElementById('edit-telefono').value;

        const inputs = [...document.querySelectorAll('#direccionesContainer input[name="direccion[]"]')];

        const direcciones = [];
        const maps = [];

        for (const input of inputs) {
            const valor = input.value.trim();
            if (!valor) continue;

            const p = await procesarDireccion(valor);
            direcciones.push(p.direccion);
            maps.push(p.maps);
        }

        if (direcciones.length === 0) {
            alert("Ingresa al menos una dirección o un link de Google Maps.");
            return;
        }

        const estados = direcciones.map(() => "");
        const municipios = direcciones.map(() => "");

        data = {
            nombre,
            email,
            telefono,
            direccion: direcciones,
            maps,
            estado: estados,
            municipio: municipios
        };
    }

    const endpoint = (type === 'usuario') ? `/users/${id}` : `/clientes/${id}`;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || `Error HTTP ${response.status}`);
        }

        alert(`${type === 'usuario' ? 'Usuario' : 'Cliente'} actualizado con éxito.`);
        closeModal('editModal');
        initAdminPanel();

    } catch (error) {
        console.error('Error al enviar el formulario de edición:', error);
        alert('Hubo un error al guardar los cambios: ' + error.message);
    }
});



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
    window.tareasOriginales = tareas;   // guardar la lista completa
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
  llenarSelectUsuarios(tareas);
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
            option.value = cliente._id || cliente.id; 
            option.textContent = cliente.nombre; 
            clienteSelect.appendChild(option);
            
            window.clientesData[option.value] = cliente; 
        });
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

let clienteDireccion = 'Sin dirección registrada';
let clienteMaps = null;

if (tarea.ClienteNegocio?.direcciones?.length) {
    const dir = tarea.ClienteNegocio.direcciones[0]; // primera dirección
    clienteDireccion = dir.direccion || 'Sin dirección registrada';
    clienteMaps = dir.maps || null;
}

const clienteMapsLink = clienteMaps
    ? clienteMaps
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clienteDireccion)}`;

        // Fila de la tabla
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <div>${tarea.nombre}</div>

              <!-- BOTÓN PARA VER DESCRIPCIÓN -->
              <button onclick="toggleDescripcion(${tarea.id})"
                  class="text-blue-600 hover:text-blue-800 text-xs mt-1 underline">
                  Ver descripción
              </button>

              <!-- CONTENEDOR OCULTO -->
              <div id="desc-${tarea.id}" 
                  style="display:none; margin-top:6px; font-size:12px; color:#555;">
                  ${tarea.descripcion || "Sin descripción"}
              </div>
          </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${asignadoNombre}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
               <a href="${clienteMapsLink}" target="_blank" class="text-blue-600 hover:underline">
                  ${clienteDireccion} 📍
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
    prioridad : 'Normal',
    direccionCliente: document.getElementById('tareaDireccionCliente').value
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


        
        // lo dio el amigo segun para seguir con el codigo a funcionar para las direcciones
      document.getElementById('tareaClienteId').value = tarea.clienteNegocioId || '';

// Cargar direcciones del cliente al editar
if (tarea.clienteNegocioId) {
    cargarDireccionesCliente(tarea.clienteNegocioId);
}





      // Si está editando una tarea, cargamos sus direcciones
if (tarea.clienteNegocioId) {
    cargarDireccionesCliente(tarea.clienteNegocioId);

    setTimeout(() => {
        document.getElementById('tareaDireccionCliente').value =
            tarea.direccionCliente || "";
    }, 300);
}

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

function llenarSelectUsuarios(tareas) {
    const selectUsuarios = document.getElementById('filterUsuario');
    selectUsuarios.innerHTML = '<option value="">Todos los usuarios</option>';

    const usuarios = new Set();

    tareas.forEach(t => {
        const usuario = t.AsignadoA?.nombre;
        if (usuario) usuarios.add(usuario);
    });

    [...usuarios].forEach(usuario => {
        const opt = document.createElement('option');
        opt.value = usuario;
        opt.textContent = usuario;
        selectUsuarios.appendChild(opt);
    });
}




document.getElementById('filterEstado').addEventListener('change', filtrarTareas);
document.getElementById('filterUsuario').addEventListener('change', filtrarTareas);

function filtrarTareas() {
    const estado = document.getElementById('filterEstado').value;
    const usuario = document.getElementById('filterUsuario').value;

    const tareasFiltradas = window.tareasOriginales.filter(t => {
        const condEstado = estado === "" || t.estado === estado;
        const condUsuario = usuario === "" || t.AsignadoA?.nombre === usuario;
        return condEstado && condUsuario;
    });

    renderTareasTable(tareasFiltradas);
}

document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
    // Reset selects
    document.getElementById('filterEstado').value = "";
    document.getElementById('filterUsuario').value = "";

    // Renderizar TODAS las tareas nuevamente
    renderTareasTable(window.tareasOriginales);
});


























































































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
//const materiales = [];
//document.querySelectorAll('#listaMateriales li').forEach(li => {
//  materiales.push(li.textContent);
//});

// Agregar al FormData (como texto JSON)
//formData.append('materiales', JSON.stringify(materiales));

  formData.append("materiales", JSON.stringify(materialesList));




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
    <select id="insumo" onchange="mostrarCampoExtra()">
      <option value="" disabled selected>Seleccione un insumo</option>

      <optgroup label="Cable">
        <option value="Cable">Cable</option>
      </optgroup>

      <optgroup label="Transceptor">
        <option value="Transceptor">Transceptor</option>
      </optgroup>

      <optgroup label="Conectores">
        <option value="Conector de corriente">Conector de corriente</option>
      </optgroup>

      <optgroup label="Fuente de poder 12V">
        <option value="12vdc 1A">12vdc 1A</option>
        <option value="12vdc 1.5A">12vdc 1.5A</option>
        <option value="12vdc 2A">12vdc 2A</option>
        <option value="12vdc 4.1A">12vdc 4.1A</option>
        <option value="12vdc 5A">12vdc 5A</option>
      </optgroup>

      <optgroup label="Fuente centralizada">
        <option value="Fuente de poder centralizada">Fuente de poder centralizada</option>
      </optgroup>

      <optgroup label="Cajas">
        <option value="Caja estanca">Caja estanca</option>
        <option value="Caja plástica 180x125x57">Caja plástica 180x125x57</option>
        <option value="Caja plástica 190x290x140">Caja plástica 190x290x140</option>
      </optgroup>

      <optgroup label="Otro">
        <option value="Otro">Otro (especificar)</option>
      </optgroup>
    </select>

<!-- Campo extra dinámico -->
<input type="text" id="insumoExtra" placeholder="Especificar modelo..." 
       style="display:none; margin-top:10px; width:200px;">

    <input type="number" id="cantidad" placeholder="Cantidad" min="0">
    <select id="unidadOtro" style="display:none;">
      <option value="Metros">Metros</option>
      <option value="Unidades">Unidades</option>
    </select>
    <button id="btnAgregarMaterial">➕ Agregar</button>
  </div>
  <ul id="listaMateriales"></ul>
`;
firmaContainer.insertAdjacentElement("afterend", materialContainer);

// --- lógica JS ---
const listaMateriales = materialContainer.querySelector("#listaMateriales");
const btnAgregarMaterial = materialContainer.querySelector("#btnAgregarMaterial");
let materialesList = [];

const categoriaPorInsumo = {
  "Transceptor": "Transceptor",

  "Conector de corriente": "Conectores",

  "12vdc 1A": "Fuentes de poder",
  "12vdc 1.5A": "Fuentes de poder",
  "12vdc 2A": "Fuentes de poder",
  "12vdc 4.1A": "Fuentes de poder",
  "12vdc 5A": "Fuentes de poder",
  "Fuente de poder centralizada": "Fuentes de poder",

  "Cable": "Cableado",

  "Caja estanca": "Cajas",
  "Caja plástica 180x125x57": "Cajas",
  "Caja plástica 190x290x140": "Cajas",

  "Otro": "Otros"
};

const unidadesPorInsumo = {
  "Transceptor": "Unidades",
  "Conector de corriente": "Unidades",

  "12vdc 1A": "Unidades",
  "12vdc 1.5A": "Unidades",
  "12vdc 2A": "Unidades",
  "12vdc 4.1A": "Unidades",
  "12vdc 5A": "Unidades",

  "Fuente de poder centralizada": "Unidades",

  "Caja estanca": "Unidades",
  "Caja plástica 180x125x57": "Unidades",
  "Caja plástica 190x290x140": "Unidades",

  "Cable": "Metros", // si lo agregas como insumo principal
  "Otro": "Unidades" // editable, pero definimos algo por defecto
};


btnAgregarMaterial.addEventListener("click", () => {

  let insumoOriginal = document.getElementById("insumo").value;
  const extra = document.getElementById("insumoExtra").value.trim();
  const cantidad = document.getElementById("cantidad").value.trim();

  if (!insumoOriginal || !cantidad) {
    alert("Por favor completa todos los campos.");
    return;
  }

  if (insumoOriginal === "Fuente de poder centralizada" && extra === "") {
    alert("Debes especificar el modelo de la fuente centralizada.");
    return;
  }

  if (insumoOriginal === "Otro" && extra === "") {
    alert("Especifica el insumo para 'Otro'.");
    return;
  }

  // Unidad
  let unidad;
  if (insumoOriginal === "Otro") {
    const unidadOtro = document.getElementById("unidadOtro").value;
    if (!unidadOtro) {
      alert("Selecciona la unidad para el insumo 'Otro'.");
      return;
    }
    unidad = unidadOtro;
  } else {
    unidad = unidadesPorInsumo[insumoOriginal] || "Unidades";
  }

  // Armar insumo final
  let insumo = extra ? `${insumoOriginal} (${extra})` : insumoOriginal;
  const categoria = categoriaPorInsumo[insumoOriginal] || "Otros";

  // ❗ Detectar duplicado y sumar cantidades
  const existente = materialesList.find(
    m => m.insumo === insumo && m.unidad === unidad
  );

  if (existente) {
    existente.cantidad += parseFloat(cantidad);
    renderMateriales();
    limpiarInputs();
    return;
  }

  // Agregar a la lista interna
  materialesList.push({
    insumo,
    categoria,
    cantidad: parseFloat(cantidad),
    unidad
  });

  // Renderizar todo
  renderMateriales();
  limpiarInputs();
});

function limpiarInputs() {
  document.getElementById("insumo").selectedIndex = 0;
  document.getElementById("cantidad").value = "";
  document.getElementById("insumoExtra").value = "";
  document.getElementById("insumoExtra").style.display = "none";
  document.getElementById("unidadOtro").value = "";
  document.getElementById("unidadOtro").style.display = "none";
}


function renderMateriales() {
  // Vaciar la UL
  listaMateriales.innerHTML = "";

  // Agrupar por categoría
  const grupos = {};

  materialesList.forEach(mat => {
    if (!grupos[mat.categoria]) grupos[mat.categoria] = [];
    grupos[mat.categoria].push(mat);
  });

  // Ordenar categorías alfabéticamente
  const categoriasOrdenadas = Object.keys(grupos).sort();

  categoriasOrdenadas.forEach(cat => {

    // 🔵 Encabezado de categoría
    const header = document.createElement("li");
    header.innerHTML = `<strong>${cat}</strong>`;
    header.style.marginTop = "15px";
    header.style.listStyle = "none";
    header.style.color = "#003366";
    listaMateriales.appendChild(header);

    // Ordenar materiales dentro de categoría
    grupos[cat].sort((a, b) => a.insumo.localeCompare(b.insumo));

    // 🔹 Materiales
    grupos[cat].forEach(mat => {
      const li = document.createElement("li");

      li.innerHTML = `
        ${mat.insumo} - ${mat.cantidad} ${mat.unidad}
        <button class="btnEliminarMaterial" 
          style="margin-left:10px; background:#ff4444; color:white; border:none; padding:2px 6px; border-radius:5px; cursor:pointer;">
          ❌
        </button>
      `;

      // Botón eliminar
      li.querySelector(".btnEliminarMaterial").onclick = () => {
        materialesList = materialesList.filter(m => !(m.insumo === mat.insumo && m.unidad === mat.unidad));
        renderMateriales();
      };

      listaMateriales.appendChild(li);
    });
  });
}




function mostrarCampoExtra() {
  const insumo = document.getElementById("insumo").value;
  const extra = document.getElementById("insumoExtra");
  const unidadOtro = document.getElementById("unidadOtro");

  // Mostrar campo extra para "centralizada" u "Otro"
  if (insumo === "Fuente de poder centralizada" || insumo === "Otro") {
    extra.style.display = "inline-block";
  } else {
    extra.style.display = "none";
    extra.value = "";
  }

  // Mostrar select de unidad SOLO si insumo = "Otro"
  if (insumo === "Otro") {
    unidadOtro.style.display = "inline-block";
  } else {
    unidadOtro.style.display = "none";
    unidadOtro.value = "";
  }
}


















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

  modal.style.display = 'flex';

  try {
    const res = await fetch(`${API_BASE_URL}/evidencias/tarea/${tareaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al cargar evidencias');

    let evidencias = await res.json();
    if (!Array.isArray(evidencias)) evidencias = [evidencias];

    if (evidencias.length === 0) {
      contenedor.innerHTML = '<p>No hay evidencias disponibles para esta tarea.</p>';
      return;
    }

    // ====== FORMATEAR MATERIALES ======
    const materialesRaw = evidencias[0]?.materiales
      ? (Array.isArray(evidencias[0].materiales)
          ? evidencias[0].materiales
          : JSON.parse(evidencias[0].materiales || '[]'))
      : [];

    // Si el backend guarda objetos, todo ok
    // Si guarda solo strings, conviértelos en objetos básicos
    const materiales = materialesRaw.map(m => {
      if (typeof m === "string") {
        // ejemplo: "Cable - 5 Metros"
        const [insumoPart, cantidadPart] = m.split(" - ");
        const [cantidad, unidad] = cantidadPart.split(" ");
        return {
          insumo: insumoPart,
          cantidad,
          unidad,
          categoria: "Otros" // fallback
        };
      }
      return m;
    });

    // AGRUPAR POR CATEGORÍA
    const grupos = {};
    materiales.forEach(m => {
      if (!grupos[m.categoria]) grupos[m.categoria] = [];
      grupos[m.categoria].push(m);
    });

    // ORDENAR CATEGORÍAS A-Z
    const categoriasOrdenadas = Object.keys(grupos).sort();

    let html = `
  <div style="text-align:center; margin-bottom:25px;">
    <h2 style="color:#003366; font-size:26px; margin:0;">📸 Evidencias</h2>
  </div>
`;

// ========== Evidencias (fotos) ==========
html += evidencias
  .map(ev => `
    <div style="
      background:#fff;
      padding:18px;
      margin:15px auto;
      border-radius:12px;
      box-shadow:0 3px 10px rgba(0,0,0,0.12);
      max-width:90%;
      text-align:center;
    ">
      <h3 style="color:#003366; margin:0 0 12px;">
        ${ev.titulo || 'Sin título'}
      </h3>

      ${
        ev.archivoUrl
          ? `<img src="${ev.archivoUrl}" 
                style="max-width:95%; border-radius:12px;
                box-shadow:0 3px 10px rgba(0,0,0,0.2);" />`
          : '<p style="color:#777;">📄 Imagen no disponible</p>'
      }
    </div>
  `)
  .join('');


// ========== Firma del cliente ==========
const evidenciaConFirma = evidencias.find(ev => ev.firmaClienteUrl);
if (evidenciaConFirma?.firmaClienteUrl) {
  html += `
    <div style="
      background:#fff;
      padding:18px;
      margin:15px auto;
      border-radius:12px;
      box-shadow:0 3px 10px rgba(0,0,0,0.12);
      max-width:90%;
      text-align:center;
    ">
      <h3 style="color:#003366; margin-bottom:10px;">
        ✍️ Firma del Cliente
      </h3>

      <img src="${evidenciaConFirma.firmaClienteUrl}"
           style="max-width:80%; border-radius:8px;
           box-shadow:0 2px 6px rgba(0,0,0,0.15);" />
    </div>
  `;
}


// ========== MATERIAL OCUPADO AGRUPADO ==========
if (materiales.length > 0) {
  html += `
    <div style="
      background:#fff;
      padding:22px;
      margin:18px auto 30px;
      border-radius:12px;
      box-shadow:0 3px 10px rgba(0,0,0,0.12);
      max-width:90%;
    ">
      <h3 style="color:#003366; margin-bottom:15px;">
        🧱 Material Ocupado
      </h3>
      <ul style="list-style:none; padding-left:0; margin:0;">
  `;

  categoriasOrdenadas.forEach(cat => {
    html += `
      <li style="margin-top:15px;">
        <strong style="color:#444; font-size:16px;">• ${cat}</strong>
        <ul style="list-style:disc; margin-left:35px; margin-top:8px;">
    `;

    grupos[cat]
      .sort((a, b) => a.insumo.localeCompare(b.insumo))
      .forEach(m => {
        html += `
          <li style="margin:5px 0; font-size:15px;">
            ${m.insumo} — ${m.cantidad} ${m.unidad}
          </li>
        `;
      });

    html += `
        </ul>
      </li>
    `;
  });

  html += `
      </ul>
    </div>
  `;
}

contenedor.innerHTML = html;


  } catch (err) {
    console.error('❌ Error al cargar evidencias:', err);
    contenedor.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
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



// ver desripcion xd 

function toggleDescripcion(id) {
    const contenedor = document.getElementById(`desc-${id}`);

    if (!contenedor) return;

    if (contenedor.style.display === "none") {
        contenedor.style.display = "block";
    } else {
        contenedor.style.display = "none";
    }
}






// ================= LEVANTAMIENTOS =================




// Cargar clientes para la sección de Levantamientos
async function loadClientesForLevantamientos() {
    const clienteSelect = document.getElementById('clienteSelect');
    if (!clienteSelect) return;

    // mensaje temporal mientras carga
    clienteSelect.innerHTML = '<option value="" disabled selected>-- Cargando Clientes... --</option>';

    // 👇 MUY IMPORTANTE: usar fetchData, igual que en tareas
    const clientes = await fetchData('/clientes'); 

    clienteSelect.innerHTML = '<option value="" disabled selected>-- Selecciona Cliente --</option>';

    if (clientes && Array.isArray(clientes) && clientes.length > 0) {
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente._id || cliente.id;   // igualito que en tareas
            option.textContent = cliente.nombre;        // nombre del cliente
            clienteSelect.appendChild(option);
        });
    } else {
        const errorMessage = (clientes === null)
            ? 'No tienes permisos para ver clientes.'
            : 'No se encontraron clientes.';
        
        clienteSelect.innerHTML = `<option value="" disabled selected>${errorMessage}</option>`;
    }
}





function agregarNecesidadUI() {
    const cont = document.getElementById("necesidadesContainer");
    if (!cont) return;

    const id = Date.now();
    const div = document.createElement("div");
    div.className = "necesidad-item";
    div.dataset.id = id;

    div.innerHTML =
     `
        <label>Descripción</label>
        <textarea class="desc lev-input" placeholder="Describe la necesidad..."></textarea>

        <label>Foto(s)</label>
        <input type="file" accept="image/*" capture="camera"
               class="foto" data-id="${id}" multiple>

        <div id="preview-${id}" class="preview"></div>

        <button type="button" class="lev-btn-sec eliminar-necesidad">
            Eliminar necesidad
        </button>
    `;

    cont.appendChild(div);
}

async function guardarLevantamiento() {
    const clienteId = document.getElementById("clienteSelect").value;
    const fechaHora = document.getElementById("fechaHora").value;

    if (!clienteId || !fechaHora) {
        alert("Selecciona un cliente y una fecha/hora.");
        return;
    }

    const materiales = [...document.querySelectorAll("#materialesLista li")]
        .map(li => li.textContent);

    const necesidades = [];
    const fd = new FormData();
    fd.append("clienteId", clienteId);
    fd.append("fechaHora", fechaHora);
    fd.append("materiales", JSON.stringify(materiales));

    let index = 0;
    document.querySelectorAll(".necesidad-item").forEach(div => {
        const desc = div.querySelector(".desc").value;
        const inputFotos = div.querySelector(".foto");
        const files = inputFotos?.files || [];

        necesidades.push({
            descripcion: desc,
            fotosQty: files.length,
            idx: index
        });

        for (let i = 0; i < files.length; i++) {
            fd.append(`foto_${index}_${i}`, files[i]);
        }

        index++;
    });

    fd.append("necesidades", JSON.stringify(necesidades));

    try {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API_BASE_URL}/levantamientos`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd
        });

        if (!res.ok) throw new Error("Error al guardar levantamiento");

        alert("Levantamiento guardado correctamente");
    } catch (err) {
        console.error(err);
        alert("Ocurrió un error al guardar el levantamiento");
    }
}

function initLevantamientos() {
    const clienteSelect = document.getElementById("clienteSelect");
    if (!clienteSelect) return;

    loadClientesForLevantamientos();

    const btnNecesidad = document.getElementById("agregarNecesidadBtn");
    if (btnNecesidad) {
        btnNecesidad.addEventListener("click", agregarNecesidadUI);
    }

    document.addEventListener("change", function (e) {
        if (!e.target.classList.contains("foto")) return;
        const id = e.target.dataset.id;
        const preview = document.getElementById(`preview-${id}`);
        preview.innerHTML = "";
        [...e.target.files].forEach(file => {
            preview.innerHTML += `<img src="${URL.createObjectURL(file)}" class="thumb">`;
        });
    });

    const btnMaterial = document.getElementById("agregarMaterialBtn");
    const inputMaterial = document.getElementById("materialInput");
    const listaMateriales = document.getElementById("materialesLista");

    if (btnMaterial) {
        btnMaterial.addEventListener("click", () => {
            if (!inputMaterial.value.trim()) return;
            const li = document.createElement("li");
            li.textContent = inputMaterial.value.trim();
            listaMateriales.appendChild(li);
            inputMaterial.value = "";
        });
    }

    const btnGuardar = document.getElementById("guardarLevantamientoBtn");
    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarLevantamiento);
    }
}
window.addEventListener("DOMContentLoaded", initLevantamientos);




// direcciones muchas xd 

const clienteSelectTarea = document.getElementById("tareaClienteId");

if (clienteSelectTarea) {
    clienteSelectTarea.addEventListener("change", function () {
        const clienteId = this.value;
        cargarDireccionesCliente(clienteId);
    });
}
function cargarDireccionesCliente(clienteId) {
    console.log("Ejecutando cargarDireccionesCliente para cliente:", clienteId);

    const selectDireccion = document.getElementById("tareaDireccionCliente");
    if (!selectDireccion) {
        console.error("❌ No se encontró el select tareaDireccionCliente");
        return;
    }

    // Siempre empezamos limpiando el select
    selectDireccion.innerHTML = `<option value="">-- Seleccione Dirección --</option>`;

    if (!clienteId) {
        return;
    }

    // Usamos los datos que ya cargaste en loadClientesForTareaSelect
    const cliente = window.clientesData ? window.clientesData[clienteId] : null;
    console.log("Cliente encontrado en window.clientesData:", cliente);

    const direcciones = (cliente && Array.isArray(cliente.direcciones))
        ? cliente.direcciones
        : [];

    if (!direcciones.length) {
        selectDireccion.innerHTML = `<option value="">Sin direcciones registradas</option>`;
        return;
    }

    direcciones.forEach(dir => {
        const option = document.createElement("option");
        option.value = dir.direccion;        // valor que se guarda en la tarea
        option.textContent = dir.direccion;  // texto visible
        option.dataset.maps = dir.maps || ""; // por si luego quieres usar el link
        selectDireccion.appendChild(option);
    });
}
  