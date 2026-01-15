
// scriptCuentas.js - AL PRINCIPIO DE TODO
(function verificarPermisos() {
    const rol = localStorage.getItem('rol');
    const email = localStorage.getItem('email');
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
    setFechaHoraActual();
    //modal.classList.add("active");
    modal.style.display = "flex";

}

//CERRAR MODAL NUEVA CUENTA//

function cerrarNuevaCuentaModal() {
    document.getElementById('modalNuevaCuenta').style.display = 'none';
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

    if (!nombreProducto || costo <= 0) {
        alert("Amiko, pon el nombre y un costo válido.");
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
        const cantidad = document.getElementById("levCantidad").value.trim();

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

