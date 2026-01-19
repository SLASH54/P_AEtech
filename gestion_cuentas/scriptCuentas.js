const API_BASE_URL = 'https://p-aetech.onrender.com/api';


// scriptCuentas.js - AL PRINCIPIO DE TODO
(function verificarPermisos() {
    const rol = localStorage.getItem('userRol');
    const email = localStorage.getItem('userEmail');
    const usuarioEspecial = "denisse.espinoza@aetech.com.mx";

    if (!(rol === 'Admin' || email === usuarioEspecial)) {
        alert("¡Alto ahí! No tienes permiso para estar aquí.");
        window.location.href = '../sistema.html'; // Lo mandamos al panel principal o login
    }
})();


//ABRIR MODAL NUEVA CUENTA//
function openNuevaCuenta() {
    //const LevClienteSelect = document.getElementById('lev-clienteSelect');
    const modal = document.getElementById("modalNuevaCuenta");
    cargarClientesSelect(); 
    setFechaHoraActual();
    //modal.classList.add("active");
    modal.style.display = "flex";
    document.body.style.overflow = 'hidden';

}

//CERRAR MODAL NUEVA CUENTA//

function cerrarNuevaCuentaModal() {
    document.getElementById('modalNuevaCuenta').style.display = 'none';
    document.body.style.overflow = 'auto';
}



//productos 
//CALCULAR CAMPO POR LIQUIDAR//
// Agrega esto al final de tu scriptCuentas.js
function calcularSaldo() {
    const total = parseFloat(document.getElementById('levTotal').value) || 0;
    const anticipo = parseFloat(document.getElementById('levAnticipo').value) || 0;
    const saldo = total - anticipo;
    
    document.getElementById('levPorLiquidar').value = saldo.toFixed(2);
}

// Escuchadores para el cálculo en tiempo real
document.getElementById('levTotal')?.addEventListener('input', calcularSaldo);
document.getElementById('levAnticipo')?.addEventListener('input', calcularSaldo);



/* ================= LISTA DE PRODUCTOS ================= */
// Variable global para guardar la foto temporal
let fotoTemporal = null;

// Capturar la foto cuando el usuario la selecciona
document.getElementById("levInputFoto")?.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        fotoTemporal = URL.createObjectURL(file);
        // Opcional: mostrar un check verde en el icono de cámara
    }
});

// Variable global para la lista de materiales (ya la tenías, asegúrate de que esté arriba)
let levMaterialesList = []; 

// 1. FUNCIÓN PARA AGREGAR MATERIAL (Actualizada)
document.getElementById("levBtnAgregarMaterial")?.addEventListener("click", () => {
    const selectInsumo = document.getElementById("levInsumo");
    const inputExtra = document.getElementById("levInsumoExtra");
    const inputCosto = document.getElementById("levCosto");
    
    // Determinar el nombre del producto
    let nombreProducto = selectInsumo.value;
    if (nombreProducto === "Otro" || nombreProducto === "Fuente de poder centralizada") {
        nombreProducto = inputExtra.value || nombreProducto;
    }

    const costo = parseFloat(inputCosto.value) || 0;

    if (costo <= 0) {
        alert("Coloca el nombre y un costo válido.");
        return;
    }

    // Crear objeto del material
    const nuevoMaterial = {
        id: Date.now(), // ID único para borrarlo fácil
        insumo: nombreProducto,
        costo: costo,
        foto: fotoTemporal // Usamos la variable de la cámara que definimos antes
    };

    levMaterialesList.push(nuevoMaterial);
    renderizarListaYTotales();

    // Limpiar campos
    inputCosto.value = "";
    inputExtra.value = "";
    selectInsumo.selectedIndex = 0;
    levMostrarCampoExtra(); // Oculta el campo extra si es necesario
    fotoTemporal = null; // Limpiar foto
});

// 2. FUNCIÓN PARA RENDERIZAR Y SUMAR TOTALES
function renderizarListaYTotales() {
    const listaUI = document.getElementById("levListaMateriales");
    const inputTotal = document.getElementById("levTotal");
    listaUI.innerHTML = "";
    let sumaTotal = 0;

    levMaterialesList.forEach((mat) => {
        sumaTotal += mat.costo;

        const li = document.createElement("li");
        li.className = "ios-list-item";
        
        const imgHTML = mat.foto 
            ? `<img src="${mat.foto}" class="img-miniatura">` 
            : `<div class="img-miniatura" style="display:flex;align-items:center;justify-content:center;background:#eee;">📦</div>`;

        li.innerHTML = `
            ${imgHTML}
            <div class="item-info"><strong>${mat.insumo}</strong></div>
            <div class="item-costo">$${mat.costo.toFixed(2)}</div>
            <button class="btn-eliminar" onclick="eliminarMaterial(${mat.id})">❌</button>
        `;
        listaUI.appendChild(li);
    });

    // Actualizar el input de Total automáticamente
    inputTotal.value = sumaTotal.toFixed(2);
    
    // Si tienes la función de calcular saldo (Total - Anticipo), llámala aquí
    if (typeof calcularSaldo === "function") calcularSaldo();
}

// 3. FUNCIÓN PARA ELIMINAR
window.eliminarMaterial = function(id) {
    levMaterialesList = levMaterialesList.filter(m => m.id !== id);
    renderizarListaYTotales();
};

// FECHA Y HORA AUTOMATICA
function setFechaHoraActual() {
    const input = document.getElementById("lev-fechaHora");
    if (!input) return;

    const now = new Date();

    // Formato YYYY-MM-DDTHH:MM
    const fechaHora =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + "T" +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0");

    input.value = fechaHora;
}

//LLENAR SELECT CLIENTES

async function cargarClientesSelect() {
  const select = document.getElementById("lev-clienteSelect");
  if (!select) return;
  select.innerHTML = `<option value="">Seleccione cliente</option>`;

  try {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_BASE_URL}/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientes = await res.json();

    // 🚨 ESTA ES LA LÍNEA CLAVE: Guardar los datos para las direcciones
    window.clientesData = {}; 

    clientes.forEach(c => {
      window.clientesData[c.id] = c; // Guardamos el objeto cliente con sus direcciones
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      select.appendChild(opt);
    });
    return true; 
  } catch (e) { console.error(e); return false; }
}



/* ================= MATERIALES LEVANTAMIENTOS ================= */

let levListaMateriales = [];

const levCategoriaPorInsumo = {
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

const levUnidadesPorInsumo = {
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

    "Cable": "Metros",
    "Otro": "Unidades"
};

// ➕ AGREGAR MATERIAL
document.getElementById("levBtnAgregarMaterial")
    ?.addEventListener("click", () => {

        const insumoBase = document.getElementById("levInsumo").value;
        const extra = document.getElementById("levInsumoExtra").value.trim();

        if (!insumoBase || !cantidad) {
            alert("Completa los campos de material");
            return;
        }

        if ((insumoBase === "Fuente de poder centralizada" || insumoBase === "Otro") && !extra) {
            alert("Especifica el modelo");
            return;
        }

        let unidad;
        if (insumoBase === "Otro") {
            unidad = document.getElementById("levUnidadOtro").value;
            if (!unidad) {
                alert("Selecciona unidad");
                return;
            }
        } else {
            unidad = levUnidadesPorInsumo[insumoBase] || "Unidades";
        }

        const insumoFinal = extra ? `${insumoBase} (${extra})` : insumoBase;
        const categoria = levCategoriaPorInsumo[insumoBase] || "Otros";

        // 🔁 detectar duplicado
        const existente = levMaterialesList.find(
            m => m.insumo === insumoFinal && m.unidad === unidad
        );

        if (existente) {
            existente.cantidad += parseFloat(cantidad);
            levRenderMateriales();
            levLimpiarInputs();
            return;
        }

        levMaterialesList.push({
            insumo: insumoFinal,
            categoria,
            cantidad: parseFloat(cantidad),
            unidad
        });

        levRenderMateriales();
        levLimpiarInputs();
    });

// 🧹 LIMPIAR INPUTS
function levLimpiarInputs() {
    document.getElementById("levInsumo").selectedIndex = 0;
    document.getElementById("levCantidad").value = "";
    document.getElementById("levInsumoExtra").value = "";
    document.getElementById("levInsumoExtra").style.display = "none";
    document.getElementById("levUnidadOtro").value = "";
    document.getElementById("levUnidadOtro").style.display = "none";
}

// 🖨️ RENDER MATERIALES
function levRenderMateriales() {
    const ul = document.getElementById("levListaMateriales");
    ul.innerHTML = "";

    const grupos = {};

    levMaterialesList.forEach(mat => {
        if (!grupos[mat.categoria]) grupos[mat.categoria] = [];
        grupos[mat.categoria].push(mat);
    });

    Object.keys(grupos).sort().forEach(cat => {

        const header = document.createElement("li");
        header.innerHTML = `<strong>${cat}</strong>`;
        header.style.marginTop = "10px";
        ul.appendChild(header);

        grupos[cat].forEach(mat => {
            const li = document.createElement("li");
            li.innerHTML = `
                ${mat.insumo} – ${mat.cantidad} ${mat.unidad}
                <button class="levBtnEliminarMat">❌</button>
            `;

            li.querySelector(".levBtnEliminarMat").onclick = () => {
                levMaterialesList = levMaterialesList.filter(
                    m => !(m.insumo === mat.insumo && m.unidad === mat.unidad)
                );
                levRenderMateriales();
            };

            ul.appendChild(li);
        });
    });
}

// 👁️ MOSTRAR CAMPOS EXTRA
function levMostrarCampoExtra() {
    const insumo = document.getElementById("levInsumo").value;
    const extra = document.getElementById("levInsumoExtra");
    const unidadOtro = document.getElementById("levUnidadOtro");

    if (insumo === "Fuente de poder centralizada" || insumo === "Otro") {
        extra.style.display = "block";
    } else {
        extra.style.display = "none";
        extra.value = "";
    }

    if (insumo === "Otro") {
        unidadOtro.style.display = "block";
    } else {
        unidadOtro.style.display = "none";
        unidadOtro.value = "";
    }
}

    //materiales 
function addMaterial() {
    const input = document.getElementById("lev-materialInput");
    const list = document.getElementById("lev-materialesLista");

    if (!input.value.trim()) return;

    const li = document.createElement("li");
    li.innerHTML = `
        ${input.value}
        <button id="levBtnAgregarMaterial" class="btn btn-success btn-sm">
    `;
    list.appendChild(li);
    input.value = "";
}



// 1. Mostrar/Ocultar el cuadrito del %
function toggleIva() {
    const chk = document.getElementById('chkIva');
    const container = document.getElementById('ivaInputContainer');
    container.style.display = chk.checked ? 'flex' : 'none';
    calcularSaldo(); // Recalcular al activar/desactivar
}

// 2. Cálculo Maestro
function calcularSaldo() {
    // Calculamos la suma de todos los materiales (Subtotal)
    const subtotal = levMaterialesList.reduce((sum, mat) => sum + mat.costo, 0);
    
    const chkIva = document.getElementById('chkIva');
    const inputPorcentaje = document.getElementById('levIvaPorcentaje');
    const inputTotal = document.getElementById('levTotal');
    const inputAnticipo = document.getElementById('levAnticipo');
    const inputLiquidar = document.getElementById('levPorLiquidar');

    let montoConIva = subtotal;

    // Si el IVA está marcado, sumamos el %
    if (chkIva && chkIva.checked) {
        const porcentaje = parseFloat(inputPorcentaje.value) || 0;
        montoConIva = subtotal * (1 + (porcentaje / 100));
    }

    // Ponemos los valores en los cuadros
    inputTotal.value = montoConIva.toFixed(2);
    
    const anticipo = parseFloat(inputAnticipo.value) || 0;
    const saldoFinal = montoConIva - anticipo;
    
    inputLiquidar.value = saldoFinal.toFixed(2);
}


// 1. Función para el switch de Factura
function toggleFactura() {
    const chk = document.getElementById('chkFactura');
    const container = document.getElementById('facturaInputContainer');
    
    // Si está marcado, mostramos el campo para anotar el folio (opcional)
    container.style.display = chk.checked ? 'block' : 'none';
}

// 2. Modifica tu función de guardar (donde recolectas los datos)
// Asegúrate de incluir estos nuevos campos en el objeto que envías al servidor:
function prepararDatosCuenta() {
    const datos = {
        // ... otros campos (cliente, fecha, materiales) ...
        total: parseFloat(document.getElementById('levTotal').value),
        anticipo: parseFloat(document.getElementById('levAnticipo').value),
        iva: document.getElementById('chkIva').checked,
        ivaPorcentaje: parseFloat(document.getElementById('levIvaPorcentaje').value),
        factura: document.getElementById('chkFactura').checked,
        folioFactura: document.getElementById('levFolioFactura').value,
        // ...
    };
    return datos;
}


async function guardarCuentaFinal() {
    // Validar que haya un cliente seleccionado
    const cliente = document.getElementById('lev-clienteSelect').value;
    if (!cliente) return alert("Amiko, selecciona un cliente primero.");

    const datos = {
        clienteNombre: cliente,
        total: parseFloat(document.getElementById('levTotal').value) || 0,
        anticipo: parseFloat(document.getElementById('levAnticipo').value) || 0,
        iva: document.getElementById('chkIva').checked,
        ivaPorcentaje: parseInt(document.getElementById('levIvaPorcentaje').value) || 16,
        factura: document.getElementById('chkFactura').checked,
        folioFactura: document.getElementById('levFolioFactura').value,
        materiales: levMaterialesList // El array que vas llenando con el botón "+ Agregar"
    };

    try {
        document.getElementById("loader").style.display = "flex";

        const response = await fetch(`${API_BASE_URL}/cuentas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (response.ok) {
            alert("✅ Cuenta guardada correctamente");
            location.reload(); // Para limpiar todo y ver la tabla nueva
        } else {
            alert("❌ Error: " + resultado.message);
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un fallo en la conexión.");
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}

// Vincula esta función al botón de tu modal
document.getElementById("btnGuardarCuenta").addEventListener("click", guardarCuentaFinal);


// Variable para guardar la foto del material que se está agregando actualmente
let fotoMaterialTemporal = null;

// Función para comprimir (añádela al final de tu script)
function comprimirImagen(file, calidad = 0.6) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const width = 800; 
                const scaleFactor = width / img.width;
                canvas.width = width;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', calidad));
            };
        };
    });
}

// Evento cuando seleccionas foto en el modal
document.getElementById('levInputFoto')?.addEventListener('change', async function(e) {
    if (e.target.files[0]) {
        document.getElementById("loader").style.display = "flex";
        fotoMaterialTemporal = await comprimirImagen(e.target.files[0]);
        // Mostrar miniatura en el modal
        const preview = document.getElementById('previsualizacionFoto');
        if(preview) preview.innerHTML = `<img src="${fotoMaterialTemporal}" style="width:50px; border-radius:5px;">`;
        document.getElementById("loader").style.display = "none";
    }
});

async function addMaterial() {
    const nombre = document.getElementById('levInsumo').value;
    const costo = parseFloat(document.getElementById('levCosto').value) || 0;
    const cantidad = parseInt(document.getElementById('levCantidad').value) || 1;

    if (!nombre || costo <= 0) {
        return alert("Amiko, llena el nombre y el costo del producto.");
    }

    // Creamos el objeto del material
    const nuevoMaterial = {
        nombre: nombre,
        costo: costo,
        cantidad: cantidad,
        fotoUrl: fotoMaterialTemporal // Este es el Base64 que subirá Cloudinary
    };

    // Lo metemos al array global
    levMaterialesList.push(nuevoMaterial);

    // Actualizamos la vista y el total
    renderMaterialesList();
    calcularTotal();

    // Limpiamos los campos para el siguiente
    document.getElementById('levInsumo').value = "";
    document.getElementById('levCosto').value = "";
    document.getElementById('levCantidad').value = "1";
    fotoMaterialTemporal = null;
    document.getElementById('previsualizacionFoto').innerHTML = "";
}


async function cargarCuentasTabla() {
    const tbody = document.querySelector(".tabla tbody");
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Cuentas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const cuentas = await response.json();

        tbody.innerHTML = ""; // Limpiar tabla

        cuentas.forEach(c => {
            const fecha = new Date(c.createdAt).toLocaleDateString();
            const tr = document.createElement("tr");
            
            // Si el saldo es 0, ponemos un badge de "Pagado"
            const statusClass = c.saldo <= 0 ? "status-pagado" : "status-pendiente";
            const statusText = c.saldo <= 0 ? "Pagado" : "Pendiente";

            tr.innerHTML = `
                <td>${c.clienteNombre}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>$${parseFloat(c.total).toFixed(2)}</td>
                <td>${fecha}</td>
                <td>
                    <button onclick="verDetalleCuenta(${c.id})" class="btn-ver">👁️</button>
                    <button onclick="descargarPDFCuenta(${c.id})" class="btn-pdf">PDF</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error cargando cuentas:", error);
    }
}

// Llamar a la función al cargar la página
document.addEventListener("DOMContentLoaded", cargarCuentasTabla);