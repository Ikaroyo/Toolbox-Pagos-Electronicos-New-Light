window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "block";

  var request = new XMLHttpRequest();
  request.open("GET", "./claves.json");
  request.send();
  request.onload = function () {
    if (request.status == 200) {
      var data = JSON.parse(request.responseText);
    } else {
      alert("Error al cargar el archivo JSON");
    }
    if (data) {
      for (const item of data.data) {
        const tr = document.createElement("tr");
        // add Class hidden
        tr.classList.add("hidden");
        const tdCuenta = document.createElement("td");
        tdCuenta.textContent = item[0];
        const tdUsuario = document.createElement("td");
        if (item[4] === "") {
          tr.classList.add("red");
        }
        tdUsuario.textContent = item[1];
        const tdDireccion = document.createElement("td");
        tdDireccion.textContent = item[2];
        const tdRecibo = document.createElement("td");
        tdRecibo.textContent = item[3];
        const tdClave = document.createElement("td");
        tdClave.textContent = item[4];
        const tdArchivo = document.createElement("td");
        tdArchivo.textContent = item[5];
        const tdPagina = document.createElement("td");
        tdPagina.textContent = item[6];
        const tdTipo = document.createElement("td");
        tdTipo.textContent = item[7];

        tr.appendChild(tdCuenta);
        tr.appendChild(tdUsuario);
        tr.appendChild(tdDireccion);
        tr.appendChild(tdRecibo);
        tr.appendChild(tdClave);
        tr.appendChild(tdArchivo);
        tr.appendChild(tdPagina);
        tr.appendChild(tdTipo);

        const tablaEmision = document.getElementById("tablaEmision");
        tablaEmision.appendChild(tr);
      }
      document.getElementById("loader").style.display = "none";
    } else {
      console.log("error al cargar el archivo JSON");
    }
  };
});

// Controlador de eventos para el campo de búsqueda
const campoBusqueda = document.getElementById("busqueda");
campoBusqueda.addEventListener("keyup", async function (event) {
  if (event.key === "Enter") {
    const busqueda = event.target.value.toLowerCase();
    if (busqueda === "") {
      alert("Ingresa un valor a buscar");
    } else {
      await showLoader();

      const filas = tablaEmision.getElementsByTagName("tr");

      // Iterar sobre cada fila de la tabla y ocultar las que no coinciden con la búsqueda
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const celdaCuenta = fila.getElementsByTagName("td")[0];
        const cuenta = celdaCuenta.textContent.toLowerCase();

        if (cuenta.includes(busqueda)) {
          fila.classList.remove("hidden");
        } else {
          fila.classList.add("hidden");
        }
      }
    }
  }
  await hideLoader();
});

async function showLoader() {
  document.getElementById("loader").style.display = "block";
  await new Promise((resolve) => setTimeout(resolve, 1000));
  document.getElementById("loader").style.display = "none";
}

async function hideLoader() {
  document.getElementById("loader").style.display = "none";
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/*
// Controlador de eventos para el campo de búsqueda
const campoBusqueda = document.getElementById("busqueda");
campoBusqueda.addEventListener("keyup", function (event) {
  const busqueda = event.target.value.toLowerCase();
  const filas = tablaEmision.getElementsByTagName("tr");

  // Iterar sobre cada fila de la tabla y ocultar las que no coinciden con la búsqueda
  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const celdaCuenta = fila.getElementsByTagName("td")[0];
    const cuenta = celdaCuenta.textContent.toLowerCase();

    if (cuenta.includes(busqueda)) {
      fila.classList.remove("hidden");
    } else {
      fila.classList.add("hidden");
    }
  }
});
*/

/*
function cargarJSON() {
  fetch("./claves.json")
    .then((response) => response.json())
    .then((data) => {
      const tablaEmision = document.getElementById("tablaEmision");

      for (const item of data.data) {
        const tr = document.createElement("tr");
        const tdCuenta = document.createElement("td");
        tdCuenta.textContent = item[0];
        const tdUsuario = document.createElement("td");
        tdUsuario.textContent = item[1];
        const tdDireccion = document.createElement("td");
        tdDireccion.textContent = item[2];
        const tdRecibo = document.createElement("td");
        tdRecibo.textContent = item[3];
        const tdClave = document.createElement("td");
        tdClave.textContent = item[4];
        const tdArchivo = document.createElement("td");
        tdArchivo.textContent = item[5];
        const tdPagina = document.createElement("td");
        tdPagina.textContent = item[6];
        const tdTipo = document.createElement("td");
        tdTipo.textContent = item[7];

        tr.appendChild(tdCuenta);
        tr.appendChild(tdUsuario);
        tr.appendChild(tdDireccion);
        tr.appendChild(tdRecibo);
        tr.appendChild(tdClave);
        tr.appendChild(tdArchivo);
        tr.appendChild(tdPagina);
        tr.appendChild(tdTipo);
        tablaEmision.appendChild(tr);
      }
    });
}
*/
