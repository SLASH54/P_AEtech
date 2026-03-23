const API_BASE_URL = 'https://p-aetech.onrender.com/api';
let editandoId = null; // Variable global para saber si estamos editando
let levMaterialesList = []; 
let proximoNumeroNota = "";
let tempFotoEdit = null;     // Para guardar la foto que subas EN EL MOMENTO de editar 


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
    const modal = document.getElementById("modalNuevaCuenta");
    editandoId = null; 
    levMaterialesList = [];
    
    // 1. Limpiamos la lista visual de materiales
    document.getElementById("levListaMateriales").innerHTML = "";

    // 2. 🟢 REINICIAMOS LOS TOTALES (Esto es lo que faltaba para que sea como Editar)
    if (document.getElementById("levSubtotal")) document.getElementById("levSubtotal").value = "0.00";
    if (document.getElementById("levTotal")) document.getElementById("levTotal").value = "0.00";
    if (document.getElementById("levAnticipo")) document.getElementById("levAnticipo").value = "0.00";
    if (document.getElementById("levPorLiquidar")) document.getElementById("levPorLiquidar").value = "0.00";
    
    // 3. Reiniciamos los inputs de carga de material
    if (document.getElementById("levProdCosto")) document.getElementById("levProdCosto").value = "";
    if (document.getElementById("levProdCant")) document.getElementById("levProdCant").value = "1";

    cargarClientesSelect(); 
    setFechaHoraActual();

    // 💡 Lógica del número de nota correlativo
    const celdas = document.querySelectorAll(".tabla tbody tr td:first-child");
    let max = 0;
    celdas.forEach(td => {
        const num = parseInt(td.innerText.replace(/[^0-9]/g, '')) || 0;
        if (num > max) max = num;
    });

    const siguiente = max + 1;
    document.getElementById('labelNumeroNota').innerText = `Nota #${siguiente}`;
    
    modal.style.display = "flex";
}

//CERRAR MODAL NUEVA CUENTA//
function cerrarNuevaCuentaModal() {
    document.getElementById("modalNuevaCuenta").style.display = "none";
    document.body.style.overflow = "auto";
    
    // RESET TOTAL de variables de control
    editandoId = null;
    levMaterialesList = [];
    tempFotoEdit = null;
    
    // Limpiar visualmente
    document.getElementById("levListaMateriales").innerHTML = "";
    //document.getElementById("formNuevaCuenta").reset();
    
    // Resetear el título del modal y botones por si se quedaron en modo "Editar"
    document.querySelector("#modalNuevaCuenta h2").innerText = "Nueva Cuenta";
    document.querySelector(".btn-add-ios").innerText = "+ Agregar Insumo";
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
document.getElementById("levInputFoto")?.addEventListener("change", async function(e) {
    const file = e.target.files[0];
    if (file) {
        // Mostramos el loader porque comprimir puede tardar un poco
        document.getElementById("loader").style.display = "flex";
        try {
            // Usamos la función de compresión que ya tienes abajo para obtener el Base64 real
            fotoTemporal = await comprimirImagen(file); 
            
            // Mostrar miniatura
            const preview = document.getElementById('previsualizacionFoto');
            if(preview) preview.innerHTML = `<img src="${fotoTemporal}" style="width:50px; border-radius:5px;">`;
        } catch (err) {
            console.error("Error procesando imagen", err);
        }
        document.getElementById("loader").style.display = "none";
    }
});

// Variable global para la lista de materiales (ya la tenías, asegúrate de que esté arriba)


// 1. FUNCIÓN PARA AGREGAR MATERIAL (Corregida)
document.getElementById("levBtnAgregarMaterial")?.addEventListener("click", () => {
    const selectInsumo = document.getElementById("levInsumo");
    const inputExtra = document.getElementById("levInsumoExtra");
    const inputCosto = document.getElementById("levProdCosto"); // 👈 Revisa que este ID sea el de tu HTML
    const inputCant = document.getElementById("levProdCant");   // 👈 ESTO ES LO QUE FALTABA
    
    let nombreProducto = selectInsumo.value;
    if (nombreProducto === "Otro" || nombreProducto === "Fuente de poder centralizada") {
        nombreProducto = inputExtra.value || nombreProducto;
    }

    const costo = parseFloat(inputCosto.value) || 0;
    const cantidad = parseFloat(inputCant.value) || 1; // 🟢 Capturamos la cantidad

    if (costo <= 0) {
        alert("Coloca un costo válido.");
        return;
    }

    const nuevoMaterial = {
        id: Date.now(),
        nombre: nombreProducto,
        costo: costo,
        cantidad: cantidad, // 🟢 GUARDAMOS LA CANTIDAD
        foto: fotoTemporal 
    };

    levMaterialesList.push(nuevoMaterial);
    renderizarListaYTotales();

    // Limpiar campos
    inputCosto.value = "";
    inputCant.value = "1"; // Reset a 1
    inputExtra.value = "";
    selectInsumo.selectedIndex = 0;
    fotoTemporal = null;
});



// 2. FUNCIÓN PARA RENDERIZAR Y SUMAR (Corregida)
function renderizarListaYTotales() {
    const listaUI = document.getElementById("levListaMateriales");
    const inputTotal = document.getElementById("levTotal");
    const inputSubtotal = document.getElementById("levSubtotal");
    
    listaUI.innerHTML = "";
    let sumaTotalNota = 0;

    levMaterialesList.forEach((mat) => {
        // 🟢 MULTIPLICAMOS AQUÍ
        const subtotalFila = mat.costo * mat.cantidad;
        sumaTotalNota += subtotalFila;

        const li = document.createElement("li");
        li.className = "ios-list-item";
        li.style = "display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee; color: black;";
        
        const imgHTML = mat.foto 
            ? `<img src="${mat.foto}" class="img-miniatura" style="width:40px;height:40px;border-radius:5px;">` 
            : `<div style="width:40px;height:40px;background:#eee;display:flex;align-items:center;justify-content:center;border-radius:5px;">📦</div>`;

        li.innerHTML = `
            <div style="flex: 1; margin-left: 10px;">
                <strong>${mat.cantidad}x ${mat.nombre}</strong>
                <br><small style="color: #666;">$${mat.costo.toFixed(2)} c/u</small>
            </div>
            <div style="font-weight: bold; color: #00938f; margin-right: 10px;">
                $${subtotalFila.toFixed(2)}
            </div>
            <button class="btn-eliminar" onclick="eliminarMaterial(${mat.id})" style="background:none;border:none;color:red;cursor:pointer;">❌</button>
        `;
        listaUI.appendChild(li);
    });

    if (inputSubtotal) inputSubtotal.value = sumaTotalNota.toFixed(2);
    if (inputTotal) inputTotal.value = sumaTotalNota.toFixed(2);
    
    if (typeof calcularSaldo === "function") calcularSaldo();
}

// 3. FUNCIÓN PARA ELIMINAR MATERIALES
window.eliminarMaterial = function(id) {
    levMaterialesList = levMaterialesList.filter(m => m.id !== id);
    renderizarListaYTotales();
};

// FECHA Y HORA AUTOMATICA
function setFechaHoraActual() {
    const input = document.getElementById("lev-fechaHora");
    if (!input) return;

    const ahora = new Date();
    
    // Formateamos manualmente: YYYY-MM-DDTHH:mm
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const min = String(ahora.getMinutes()).padStart(2, '0');

    const fechaHoraLocal = `${anio}-${mes}-${dia}T${hora}:${min}`;
    input.value = fechaHoraLocal;
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



// ➕ AGREGAR MATERIAL (MODAL NUEVA CUENTA)
document.getElementById("levBtnAgregarMaterial")?.addEventListener("click", () => {
    const insumoBase = document.getElementById("levInsumo").value;
    const extra = document.getElementById("levInsumoExtra").value.trim();
    
    // 🟢 CAPTURAMOS LOS INPUTS (Esto es lo que faltaba)
    const precioInput = document.getElementById("levProdCosto"); 
    const cantInput = document.getElementById("levProdCant");   
    
    const costo = parseFloat(precioInput.value) || 0;
    const cantidad = parseFloat(cantInput.value) || 1;

    if (!insumoBase || costo <= 0) {
        alert("Selecciona un material y ponle un precio.");
        return;
    }

    const insumoFinal = extra ? `${insumoBase} (${extra})` : insumoBase;
    const categoria = levCategoriaPorInsumo[insumoBase] || "Otros";

    // Detectar duplicado
    const existente = levMaterialesList.find(m => m.insumo === insumoFinal);

    if (existente) {
        existente.cantidad += cantidad;
    } else {
        // 🟢 GUARDAMOS COSTO Y CANTIDAD EN EL OBJETO
        levMaterialesList.push({
            insumo: insumoFinal,
            categoria,
            cantidad: cantidad,
            costo: costo, 
            unidad: (insumoBase === "Otro") ? document.getElementById("levUnidadOtro").value : (levUnidadesPorInsumo[insumoBase] || "Unidades")
        });
    }

    levRenderMateriales();
    
    // Limpiamos los campos
    precioInput.value = "";
    cantInput.value = "1";
    if (typeof levLimpiarInputs === "function") levLimpiarInputs();
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
    if(!ul) return;
    ul.innerHTML = "";

    levMaterialesList.forEach((mat, index) => {
        // 🟢 MULTIPLICACIÓN PARA LA VISTA
        const totalFila = (mat.cantidad * mat.costo).toFixed(2);

        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.padding = "10px";
        li.style.borderBottom = "1px solid #eee";
        li.style.color = "black";

        li.innerHTML = `
            <div style="flex: 1;">
                <b style="color:#007aff;">${mat.cantidad}x</b> ${mat.insumo}
                <br><small style="color: #666;">$${mat.costo.toFixed(2)} c/u</small>
            </div>
            <div style="text-align: right;">
                <span style="color: #00938f; font-weight: bold; font-size: 1.1em;">$${totalFila}</span>
                <button class="levBtnEliminarMat" style="background:none; border:none; color:red; cursor:pointer; margin-left:15px; font-size:1.2em;">❌</button>
            </div>
        `;

        li.querySelector(".levBtnEliminarMat").onclick = () => {
            levMaterialesList.splice(index, 1);
            levRenderMateriales();
        };
        ul.appendChild(li);
    });
    
    // 🟢 ACTUALIZAR LOS TOTALES GENERALES DE LA NOTA
    actualizarTotalesNuevaNota();
}


//total nota actualizado
function actualizarTotalesNuevaNota() {
    let subtotal = 0;
    levMaterialesList.forEach(m => {
        subtotal += (m.cantidad * m.costo);
    });

    const sub = document.getElementById("levSubtotal");
    const tot = document.getElementById("levTotal");
    
    if(sub) sub.value = subtotal.toFixed(2);
    if(tot) tot.value = subtotal.toFixed(2); 
    
    // Llamamos a tu función de saldo
    if (typeof calcularSaldo === "function") calcularSaldo();
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
    const inputSubtotal = document.getElementById('levSubtotal');
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
    inputSubtotal.value = subtotal.toFixed(2);
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
    const btnGuardar = document.getElementById("btnGuardarCuenta");
    const selectCliente = document.getElementById('lev-clienteSelect');
    
    if (!selectCliente.value) return alert("Selecciona un cliente primero.");
    if (btnGuardar.disabled) return; 

    btnGuardar.disabled = true;
    btnGuardar.style.opacity = "0.5";
    btnGuardar.innerText = "Guardando...";

    // 🔥 CAPTURA DIRECTA DEL MODAL (Esto asegura que no vaya vacío)
    const textoNota = document.getElementById('labelNumeroNota').innerText;

    const datos = {
        numeroNota: textoNota, // <--- Aquí ya va "Nota #5" por ejemplo
        clienteNombre: selectCliente.options[selectCliente.selectedIndex].text,
        subtotal: parseFloat(document.getElementById('levSubtotal').value) || 0,
        total: parseFloat(document.getElementById('levTotal').value) || 0,
        anticipo: parseFloat(document.getElementById('levAnticipo').value) || 0,
        fecha_anticipo: document.getElementById("levFechaAnticipo").value,
        iva: document.getElementById('chkIva').checked,
        ivaPorcentaje: parseInt(document.getElementById('levIvaPorcentaje').value) || 16,
        factura: document.getElementById('chkFactura').checked,
        folioFactura: document.getElementById('levFolioFactura').value,
        materiales: levMaterialesList 
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

        if (response.ok) {
            alert("✅ Nota guardada: " + textoNota);
            location.reload(); 
        } else {
            const res = await response.json();
            alert("❌ Error: " + res.message);
            btnGuardar.disabled = false;
            btnGuardar.style.opacity = "1";
        }
    } catch (error) {
        console.error("Error:", error);
        btnGuardar.disabled = false;
        btnGuardar.style.opacity = "1";
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}

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



// scriptCuentas.js

async function addMaterial() {
    const nombre = document.getElementById('lev-material-nombre').value;
    const cantidad = document.getElementById('lev-material-cantidad').value;
    const costo = document.getElementById('lev-material-costo').value;
    const unidad = document.getElementById('lev-material-unidad').value;
    const fotoInput = document.getElementById('lev-material-foto');

    if (!nombre || !costo) {
        alert("Amiko, el nombre y el costo son obligatorios.");
        return;
    }

    let fotoBase64 = null;

    // 🚀 IGUAL QUE EN LEVANTAMIENTOS: Convertimos a Base64
    if (fotoInput.files && fotoInput.files[0]) {
        fotoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result); // Aquí se crea el data:image/...
            reader.readAsDataURL(fotoInput.files[0]);
        });
    }

    const nuevoMaterial = {
        nombre,
        cantidad: parseInt(cantidad) || 1,
        costo: parseFloat(costo),
        unidad: unidad || 'Pza',
        foto: fotoBase64 // 👈 Ahora mandamos el "código" real de la imagen, no el link de netlify
    };

    levMaterialesList.push(nuevoMaterial);
    
    // Actualizamos la tabla visual
    actualizarTablaMateriales();
    
    // Limpiar campos para el siguiente material
    document.getElementById('lev-material-nombre').value = '';
    document.getElementById('lev-material-cantidad').value = '1';
    document.getElementById('lev-material-costo').value = '';
    fotoInput.value = '';
}

async function cargarCuentasTabla() {
    const tbody = document.querySelector(".tabla tbody");
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Cuentas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const cuentas = await response.json();
        
        // Ordenamos las cuentas por ID de la más reciente a la más antigua
        // (Esto asegura que el index 0 sea la última nota creada)
        cuentas.sort((a, b) => b.id - a.id);
        
        const totalCuentas = cuentas.length;
        tbody.innerHTML = ""; 

        cuentas.forEach((c, index) => {
            const fecha = new Date(c.createdAt).toLocaleDateString();
            const tr = document.createElement("tr");
            
            // Numeración descendente: la de arriba tiene el número más alto
            const numeroConsecutivo = totalCuentas - index;

            // Lógica de estatus
            const esPagado = (parseFloat(c.saldo) <= 0 || c.estatus === 'Pagado');
            const statusClass = esPagado ? "status-pagado" : "status-pendiente";
            const statusText = esPagado ? "Pagado" : "Pendiente";

            tr.innerHTML = `
                <td style="text-align: center; font-weight: bold; color: #007aff;">${numeroConsecutivo}</td>
                <td>${c.clienteNombre}</td>
                <td><span class="badge-status-tabla ${statusClass}">${statusText}</span></td>
                <td style="font-weight: bold;">$${parseFloat(c.total).toFixed(2)}</td>
                <td>${fecha}</td>
                <td>
                    <div class="acciones-container">
                        <button onclick="verDetalleCuenta(${c.id})" class="btn-tabla-ios btn-ver-ios" title="Ver">👁️</button>
                        <button onclick="prepararEdicion(${c.id})" class="btn-tabla-ios btn-edit-ios" title="Editar">✏️</button>
                        <button onclick="descargarPDFCuenta(${c.id})" class="btn-tabla-ios btn-pdf-ios" title="Descargar PDF">PDF</button>
                        <button onclick="eliminarCuenta(${c.id})" class="btn-tabla-ios btn-eliminar-ios" title="Eliminar">🗑️</button>
                        
                        <button onclick="compartirNota(${c.id})" class="btn-tabla-ios" style="background: rgba(50, 215, 255, 0.15); color: #00bcd4;" title="Compartir Link">🔗</button>
                        
                        ${!esPagado ? 
                            `<button onclick="abrirModalAbono(${c.id})" class="btn-tabla-ios" style="background: rgba(58, 205, 0, 0.39); color: #000;" title="Liquidar Nota">💰</button>` : 
                            '<span style="font-size: 1.2rem; margin-left: 5px;" title="Pagado">✅</span>'
                        }
                    </div>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error cargando cuentas:", error);
    }
}
//

// Llamar a la función al cargar la página
document.addEventListener("DOMContentLoaded", cargarCuentasTabla);

async function liquidarCuenta(id) {
    if (!confirm("¿Estás seguro de marcar esta cuenta como PAGADA? El saldo pasará a $0.")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/cuentas/liquidar/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            alert("✅ ¡Cuenta pagada!");
            location.reload(); // Recargamos para ver los cambios
        } else {
            alert("❌ Error al liquidar");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

//ver cuenta
async function verDetalleCuenta(id) {
    try {
        document.getElementById("loader").style.display = "flex";

        const response = await fetch(`${API_BASE_URL}/cuentas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const cuentas = await response.json();
        const cuenta = cuentas.find(c => c.id === id);

        if (!cuenta) {
            alert("No se encontró la información.");
            return;
        }

        // --- ENCABEZADO ---
        document.getElementById('detNumeroNota').innerText = cuenta.numeroNota || `Nota #${cuenta.id}`;
        document.getElementById('detCliente').innerText = `Cliente: ${cuenta.clienteNombre}`;

        // --- LÓGICA DE BADGES (ESTATUS) ---
        const badgesContainer = document.getElementById('detBadges');
        badgesContainer.innerHTML = "";
        const fechaPagoCont = document.getElementById('detFechaPagoCont');
        const fechaAnticipoCont = document.getElementById('detFechaAnticipoCont')
        const divDetIVA = document.getElementById('divDetIVA');
        const detIVA = document.getElementById('detIVA');
        
        // Badge de Estatus (Pendiente/Pagado)
        const estatusActual = (cuenta.estatus || 'Pendiente').toUpperCase();
        const colorEstatus = estatusActual === 'PAGADO' ? '#2e7d32' : '#f39c12';
        const bgEstatus = estatusActual === 'PAGADO' ? '#e8f5e9' : '#fff3e0';

        badgesContainer.innerHTML += `
            <span style="background: ${bgEstatus}; color: ${colorEstatus}; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; border: 1px solid ${colorEstatus}44;">
                ${estatusActual}
            </span>
        `;

        // Mostrar fecha de liquidación si está pagado
        if (estatusActual === 'PAGADO' && cuenta.fechaLiquidacion) {
            fechaPagoCont.style.display = "block";
            const fLiq = new Date(cuenta.fechaLiquidacion).toLocaleString('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            document.getElementById('detFechaPagoTexto').innerHTML = `<b>Pagado el:</b> ${fLiq}`;
        } else {
            fechaPagoCont.style.display = "none";
        }

        //FECHA DE ANTICIPO
        if (cuenta.fecha_anticipo) {
            fechaAnticipoCont.style.display = "block";
            const fAnt = new Date(cuenta.fecha_anticipo).toLocaleString('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            document.getElementById('detFechaAnticipoTexto').innerHTML = `<b>Anticipo dado el:</b> ${fAnt}`;
        } else {
            fechaAnticipoCont.style.display = "none";
        }

        // Badges de IVA/Factura
        if (cuenta.iva) badgesContainer.innerHTML += `<span class="badge badge-iva">CON IVA</span>`;
        if (cuenta.factura) badgesContainer.innerHTML += `<span class="badge badge-factura">FACTURADO</span>`;

        // --- TABLA DE PRODUCTOS ---
        const tbody = document.getElementById('detListaProductos');
        tbody.innerHTML = "";
        cuenta.materiales.forEach(mat => {
            const imgSource = mat.fotoUrl || 'img/logoAEtech.png'; 
            tbody.innerHTML += `
                <tr style="color: black; border-bottom: 0.5px solid #eee;">
                    <td style="padding: 10px 0;">
                        <div class="contenedor-img-detalle">
                            <img src="${imgSource}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover; cursor: pointer;" onclick="window.open('${imgSource}', '_blank')">
                        </div>
                    </td>
                    <td style="font-weight: 500;">${mat.nombre}</td>
                    <td style="text-align: center;">${mat.cantidad}</td>
                    <td style="text-align: right;">$${parseFloat(mat.costo).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                </tr>
            `;
        });

        // --- INFO EXTRA E IVA ---
        const infoFactura = document.getElementById('infoFacturaExtra');
        if (cuenta.iva || cuenta.factura) {
            infoFactura.style.display = "block";
            const porcentaje = cuenta.ivaPorcentaje || 16;
            const montoIva = (parseFloat(cuenta.subtotal) * porcentaje) / 100;
            infoFactura.innerHTML = `
                <p style="margin: 5px 0;"><strong>Folio Factura:</strong> ${cuenta.folioFactura || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>Monto IVA (${porcentaje}%):</strong> $${montoIva.toLocaleString('es-MX', {minimumDigits:2})}</p>
            `;
        } else {
            infoFactura.style.display = "none" ;
        }

        // --- TOTALES ---
        document.getElementById('detSubtotal').value = parseFloat(cuenta.subtotal).toFixed(2);
        if (cuenta.iva) {
            const porcentaje = cuenta.ivaPorcentaje || 16;
            const montoIva = (parseFloat(cuenta.subtotal) * porcentaje) / 100;
            //detIVA.value = parseFloat(cuenta.subtotal).toFixed(2);
            detIVA.value = `${montoIva.toLocaleString('es-MX', {minimumDigits:2})}`
        } else {
            divDetIVA.style.display = "none";
        }
        document.getElementById('detTotal').value = parseFloat(cuenta.total).toFixed(2);
        document.getElementById('detAnticipo').value = parseFloat(cuenta.anticipo || 0).toFixed(2);
        
        const inputSaldo = document.getElementById('detSaldo');
        inputSaldo.value = parseFloat(cuenta.saldo).toFixed(2);
        inputSaldo.style.color = (cuenta.saldo > 0) ? "#d32f2f" : "#2e7d32";

        // Abrir Modal
        document.getElementById('modalDetalleCuenta').style.display = 'flex';
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar detalles.");
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}


// Función auxiliar para cerrar
function cerrarDetalleModal() {
    document.getElementById('modalDetalleCuenta').style.display = 'none';
    document.body.style.overflow = 'auto';
}




//pdf
async function descargarPDFCuenta(id) {
    try {
        document.getElementById("loader").style.display = "flex";
        
        const response = await fetch(`${API_BASE_URL}/cuentas/${id}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Nota_Cuenta_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert("Error al generar el PDF");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Fallo al conectar con el servidor");
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}


async function eliminarCuenta(id) {
    // Confirmación de seguridad
    const confirmar = confirm("⚠️ ¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.");
    
    if (!confirmar) return;

    try {
        document.getElementById("loader").style.display = "flex";

        const response = await fetch(`${API_BASE_URL}/cuentas/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
            }
        });

        if (response.ok) {
            alert("🗑️ Nota eliminada con éxito");
            cargarCuentasTabla(); // Recargamos la tabla para que desaparezca la fila
        } else {
            const error = await response.json();
            alert("❌ Error: " + error.message);
        }
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}


let materialesEditList = []; // Array exclusivo para edición



/* ==========================================
   SISTEMA DE EDICIÓN UNIFICADO (AEtech)
   ========================================== */

// 1. CARGAR DATOS EN EL MODAL (Incluye IVA, Factura y Clientes)
async function prepararEdicion(id) {
    try {
        document.getElementById("loader").style.display = "flex";
        editandoId = id;

        const response = await fetch(`${API_BASE_URL}/cuentas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const cuentas = await response.json();
        const cuenta = cuentas.find(c => c.id === id);

        if (!cuenta) {
            alert("No se encontró la nota");
            return;
        }

        // 1. Mostrar el modal primero que nada
        document.getElementById("modalEditarCuenta").style.display = "flex";
        
        await cargarClientesSelectEdit(cuenta.clienteNombre);

        // 2. Lógica de limpieza segura para el número de nota
        let valorNota = cuenta.numeroNota ? cuenta.numeroNota.toString() : "S/N";
        
        // Limpiamos solo si contiene "Nota" o "#", si no, lo dejamos igual
        let numeroSolo = valorNota.replace(/Nota /g, "").replace(/#/g, "").trim();
        
        document.getElementById("labelNumeroNotaEdit").innerText = `Nota #${numeroSolo}`;
        
        // 3. Estatus
        const badgeEdit = document.getElementById('editEstatusBadge');
        const esPagado = (parseFloat(cuenta.saldo) <= 0 || cuenta.estatus === 'Pagado');
        
        if (badgeEdit) {
            badgeEdit.innerText = esPagado ? "PAGADO" : "PENDIENTE";
            badgeEdit.className = `badge-status-tabla ${esPagado ? 'status-pagado' : 'status-pendiente'}`;
        }

        // 4. Llenar campos numéricos
        document.getElementById("levAnticipoEdit").value = cuenta.anticipo || 0;
        document.getElementById("chkIvaEdit").checked = cuenta.iva || false;
        document.getElementById("levIvaPorcentajeEdit").value = cuenta.ivaPorcentaje || 16;
        document.getElementById("chkFacturaEdit").checked = cuenta.factura || false;
        document.getElementById("levFolioFacturaEdit").value = cuenta.folioFactura || "";
        
        toggleFacturaEdit(); 

        // 5. Cargar materiales
        materialesEditList = (cuenta.materiales || []).map(m => ({
            nombre: m.nombre,
            cantidad: m.cantidad,
            costo: parseFloat(m.costo) || 0,
            fotoUrl: m.fotoUrl,
            foto: null 
        }));

        renderMaterialesEdit();

    } catch (e) { 
        console.error("Error al abrir edición:", e);
        alert("Hubo un error al cargar los datos del modal.");
    } finally { 
        document.getElementById("loader").style.display = "none"; 
    }
}


// 2. FUNCIÓN PARA CARGAR CLIENTES DESDE LA API (La que faltaba)
async function cargarClientesSelectEdit(clienteActual) {
    const select = document.getElementById("edit-clienteSelect");
    try {
        const res = await fetch(`${API_BASE_URL}/clientes`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const clientes = await res.json();
        select.innerHTML = ""; // Limpiar
        clientes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.nombre;
            opt.text = c.nombre;
            if(c.nombre === clienteActual) opt.selected = true;
            select.appendChild(opt);
        });
    } catch(e) { 
        console.error("Error cargando clientes en edición:", e); 
    }
}

// 3. AGREGAR MATERIAL (Con lógica de Select de Insumos)
function agregarMaterialEdit() {
    const select = document.getElementById("edit-levInsumo");
    const campoExtra = document.getElementById("edit-levInsumoExtra");
    const costoInput = document.getElementById("edit-prodCosto");
    const cantInput = document.getElementById("edit-prodCant");

    let nombre = (select.value === "Otro") ? campoExtra.value : select.value;
    
    // 🟢 FORZAMOS NÚMEROS AQUÍ
    const costo = parseFloat(costoInput.value) || 0;
    const cant = parseInt(cantInput.value) || 1; 

    if (!nombre || costo <= 0) {
        return alert("Selecciona un producto y ponle precio.");
    }

    // 🟢 IMPORTANTE: Usamos la lista de edición
    materialesEditList.push({
        nombre: nombre,
        costo: costo,
        cantidad: cant, // <--- Aquí ya va como número
        foto: tempFotoEdit,
        fotoUrl: null
    });

    // Limpiar campos
    select.value = "";
    campoExtra.value = "";
    campoExtra.style.display = "none";
    costoInput.value = "";
    cantInput.value = "1";
    document.getElementById("previewFotoEdit").style.display = "none";
    tempFotoEdit = null;

    renderMaterialesEdit();
}



// 4. RENDERIZAR TABLA Y CALCULAR
function renderMaterialesEdit() {
    const tbody = document.querySelector("#tablaMaterialesEdit tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    materialesEditList.forEach((item, index) => {
        const img = item.foto || item.fotoUrl || 'img/logoAEtech.png';
        
        // 🟢 CÁLCULO MATEMÁTICO REAL
        const cantidad = Number(item.cantidad) || 0;
        const costoUnitario = Number(item.costo) || 0;
        const totalRenglon = (cantidad * costoUnitario).toFixed(2);

        tbody.innerHTML += `
            <tr style="background: white;">
                <td style="text-align:center;">
                    <img src="${img}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;">
                </td>
                <td style="color:black;">${item.nombre}</td>
                <td style="color:black; text-align:center;">${cantidad}</td>
                <td style="color:black; text-align:right;">$${costoUnitario.toFixed(2)}</td>
                <td style="color:#00938f; text-align:right; font-weight:bold;">$${totalRenglon}</td>
                <td style="text-align:center;">
                    <button type="button" onclick="materialesEditList.splice(${index},1); renderMaterialesEdit();" 
                        style="background:none; border:none; color:red; cursor:pointer; font-size:1.2rem;">✕</button>
                </td>
            </tr>
        `;
    });
    calcularSaldoEdit();
}


// 5. CÁLCULOS DE IVA Y SALDO (Actualizado para el orden: Total, Anticipo, Saldo)
function calcularSaldoEdit() {
    let totalMateriales = 0;
    
    // 🟢 Sumamos multiplicando cantidad por costo
    materialesEditList.forEach(item => {
        totalMateriales += (item.cantidad * item.costo);
    });

    const chkIva = document.getElementById("chkIvaEdit");
    const ivaPorcentajeInput = document.getElementById("levIvaPorcentajeEdit");
    
    const llevaIva = chkIva ? chkIva.checked : false;
    const porcentajeIva = ivaPorcentajeInput ? (parseFloat(ivaPorcentajeInput.value) || 0) : 0;
    
    let montoIva = llevaIva ? (totalMateriales * (porcentajeIva / 100)) : 0;
    let totalFinal = totalMateriales + montoIva;

    const anticipo = parseFloat(document.getElementById("levAnticipoEdit").value) || 0;
    const saldo = totalFinal - anticipo;

    // Actualizar Inputs en pantalla
    document.getElementById("levSubtotalEdit").value = totalMateriales.toFixed(2);
    document.getElementById("levIVAEdit").value = montoIva.toFixed(2);
    document.getElementById("levTotalEdit").value = totalFinal.toFixed(2);
    
    const inputSaldo = document.getElementById("levSaldoEdit");
    if (inputSaldo) {
        inputSaldo.value = saldo.toFixed(2);
        
        // Colores del saldo
        const badgeEdit = document.getElementById('editEstatusBadge');
        if (saldo <= 0) {
            inputSaldo.style.color = "#28a745"; // Verde
            if(badgeEdit) {
                badgeEdit.innerText = "PAGADO";
                badgeEdit.className = "badge-status-tabla status-pagado";
            }
        } else {
            inputSaldo.style.color = "#ff3b30"; // Rojo
            if(badgeEdit) {
                badgeEdit.innerText = "PENDIENTE";
                badgeEdit.className = "badge-status-tabla status-pendiente";
            }
        }
    }
}

// 6. GUARDAR CAMBIOS (PUT)
async function actualizarCuentaFinal() {
    if (materialesEditList.length === 0) return alert("La nota no puede estar vacía");

    // Leemos el número que está puesto en el label para reenviarlo
    const numeroActual = document.getElementById("labelNumeroNotaEdit").innerText;

    const datos = {
        numeroNota: numeroActual, // 👈 Aseguramos que se mantenga el nombre correcto
        clienteNombre: document.getElementById("edit-clienteSelect").value,
        anticipo: parseFloat(document.getElementById("levAnticipoEdit").value) || 0,
        fecha_anticipo: document.getElementById("levFechaAnticipoEdit").value,
        subtotal: parseFloat(document.getElementById("levSubtotalEdit").value) || 0,
        total: parseFloat(document.getElementById("levTotalEdit").value) || 0,
        iva: document.getElementById("chkIvaEdit").checked,
        ivaPorcentaje: parseFloat(document.getElementById("levIvaPorcentajeEdit").value) || 0,
        factura: document.getElementById("chkFacturaEdit").checked,
        folioFactura: document.getElementById("levFolioFacturaEdit").value,
        materiales: materialesEditList
    };

    try {
        document.getElementById("loader").style.display = "flex";
        const res = await fetch(`${API_BASE_URL}/cuentas/${editandoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert("✅ ¡Listo! Nota actualizada.");
            cerrarModalEditar();
            cargarCuentasTabla();
        } else {
            alert("No se pudo actualizar");
        }
    } catch (e) { 
        //alert("Error de conexión"); 
    } finally { 
        document.getElementById("loader").style.display = "none"; 
    }
}

// FUNCIONES DE APOYO
function levMostrarCampoExtraEdit() {
    const select = document.getElementById('edit-levInsumo');
    const campoExtra = document.getElementById('edit-levInsumoExtra');
    if(select && campoExtra) {
        campoExtra.style.display = (select.value === 'Otro') ? 'block' : 'none';
    }
}

function toggleFacturaEdit() {
    const chk = document.getElementById("chkFacturaEdit");
    const inputFolio = document.getElementById("levFolioFacturaEdit");
    if(chk && inputFolio) {
        inputFolio.style.display = chk.checked ? "inline-block" : "none";
    }
}

function cerrarModalEditar() {
    document.getElementById("modalEditarCuenta").style.display = "none";
    document.getElementById("levFormEditarCuenta").reset();
    materialesEditList = [];
    tempFotoEdit = null;
}



// 1. LLENAR EL FILTRO DE CLIENTES AL CARGAR LA PÁGINA
async function cargarFiltroClientes() {
    const selectFiltro = document.getElementById("filtroCliente");
    try {
        const res = await fetch(`${API_BASE_URL}/clientes`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const clientes = await res.json();
        
        // Mantener la opción de "Todos" y agregar el resto
        selectFiltro.innerHTML = '<option value="">👤 Todos los Clientes</option>';
        clientes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.nombre;
            opt.text = c.nombre;
            selectFiltro.appendChild(opt);
        });
    } catch(e) { console.error("Error al cargar filtro:", e); }
}

// 2. LA FUNCIÓN QUE FILTRA LA TABLA EN TIEMPO REAL
function filtrarNotasPorCliente() {
    const valorFiltro = document.getElementById("filtroCliente").value.toLowerCase();
    const filas = document.querySelectorAll(".tabla tbody tr");

    filas.forEach(fila => {
        // Buscamos el nombre del cliente en la segunda columna (td:nth-child(2))
        const nombreCliente = fila.querySelector("td:nth-child(2)").innerText.toLowerCase();
        
        if (valorFiltro === "" || nombreCliente.includes(valorFiltro)) {
            fila.style.display = ""; // Mostrar
        } else {
            fila.style.display = "none"; // Ocultar
        }
    });
}


function compartirNota(id) {
    // Generamos la URL base (ajusta el nombre del archivo si es necesario)
    const url = `${window.location.origin}/gestion_cuentas/nota_publica.html?id=${id}`;
    
    // Intentamos copiar al portapapeles
    navigator.clipboard.writeText(url).then(() => {
        alert("✅ ¡Link copiado! Ya puedes pegarlo en WhatsApp para el cliente.");
    }).catch(err => {
        // Por si el navegador bloquea el copiado automático
        prompt("Copia este link para el cliente:", url);
    });
}

// 3. Ejecutar al cargar la página (agrega esto al final de tu archivo o donde cargues las cuentas)
document.addEventListener("DOMContentLoaded", cargarFiltroClientes);

function limpiarFiltroCliente() {
    const select = document.getElementById("filtroCliente");
    select.value = ""; // Regresa a "Todos los Clientes"
    filtrarNotasPorCliente(); // Ejecuta el filtro (que ahora mostrará todo)
    
    // Opcional: un pequeño efecto visual de que se limpió
    select.style.boxShadow = "0 0 10px rgba(52, 199, 89, 0.5)";
    setTimeout(() => select.style.boxShadow = "none", 500);
}


let cuentaSeleccionadaId = null;
let saldoActualPendiente = 0;

function abrirModalAbono(id, saldo) {
    cuentaSeleccionadaId = id;
    saldoActualPendiente = parseFloat(saldo);
    
    document.getElementById("infoSaldoPendiente").innerText = `Saldo pendiente: $${saldoActualPendiente.toFixed(2)}`;
    document.getElementById("inputMontoAbono").value = "";
    document.getElementById("modalAbono").style.display = "flex";
}

function cerrarModalAbono() {
    document.getElementById("modalAbono").style.display = "none";
}

async function procesarAbono() {
    const abono = parseFloat(document.getElementById("inputMontoAbono").value);
    
    if (!abono || abono <= 0) return alert("Ingresa un monto válido karnal.");
    if (abono > saldoActualPendiente) return alert("El abono no puede ser mayor al saldo pendiente.");

    try {
        const response = await fetch(`${API_BASE_URL}/Cuentas/abonar/${cuentaSeleccionadaId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify({ montoAbono: abono })
        });

        if (response.ok) {
            alert("¡Abono registrado!");
            location.reload();
        }
    } catch (error) {
        console.error(error);
    }
}

// Opción para liquidar todo de un jalón
function liquidarTotalDirecto() {
    document.getElementById("inputMontoAbono").value = saldoActualPendiente;
    procesarAbono();
}