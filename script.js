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
const API_BASE_URL = 'https://p-aetech.onrender.com'; // Esto lo reemplazarás
// ...
//const response = await fetch(`${API_BASE_URL}/auth/login, { /* ... */ }`);

