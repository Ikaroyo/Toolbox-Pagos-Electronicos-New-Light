// Variables globales
const carpeta = "./emision/"; // ruta relativa a la carpeta emision
const tablaEmision = document.getElementById("tablaEmision");

// Controlador de eventos para el evento "drop"
document.addEventListener("drop", function (event) {
  event.preventDefault();
  clearTable();
  const archivos = event.dataTransfer.files;

  procesarArchivos(archivos);
});

// Controlador de eventos para el evento "dragover"
document.addEventListener("dragover", function (event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "link";
});

function clearTable() {
  tablaEmision.innerHTML = "";
}
// Función para procesar los archivos que se han soltado en la página
function procesarArchivos(archivos) {
  // llamar un loader mientras procesa los archivos
  const loader = document.getElementById("loader");
  loader.style.display = "block";
  // Iterar sobre cada archivo y página
  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    const nombreArchivo = archivo.name;

    // Verificar que el archivo es un archivo PDF
    if (nombreArchivo.toLowerCase().endsWith(".pdf")) {
      // Leer el contenido del archivo PDF
      const fileReader = new FileReader();
      fileReader.onload = function () {
        const arrayBuffer = this.result;
        const pdfData = new Uint8Array(arrayBuffer);
        pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
          const numPaginas = pdf.numPages;
          console.log(
            `Archivo ${nombreArchivo} cargado. Número de páginas: ${numPaginas}`
          );

          for (let j = 1; j <= numPaginas; j++) {
            pdf.getPage(j).then(function (page) {
              page.getTextContent().then(function (textContent) {
                // Buscar los valores que necesitas en el contenido de la página
                const cuenta = textContent.items.find((item) =>
                  item.str.match(/^\d{7}\/\d{3}$/)
                );
                const recibo = textContent.items.find((item) =>
                  item.str.match(/^\d{4}-\d{8}$/)
                );
                const clavePago = textContent.items.find((item) => {
                  const regex = /^CLAVE LINK (\d+)$/;
                  const match = item.str.match(regex);
                  return match && match[1] ? true : false;
                });

                // agregar un const para la direccion se encuentra entre la palabra "JGIMENEZ" y la palabra "Piso:", por ejemplo JGIMENEZ  LOPEZ DE VEGA 690 Piso: , seria LOPEZ DE VEGA 690

                const inicioDireccion = "JGIMENEZ";
                const finDireccion = "Piso:";
                const textDireccion = textContent.items
                  .map((item) => item.str)
                  .join(" ");
                const startDireccion =
                  textDireccion.indexOf(inicioDireccion) +
                  inicioDireccion.length;
                const endDireccion = textDireccion.indexOf(finDireccion);
                const direccion = textDireccion
                  .slice(startDireccion, endDireccion)
                  .trim();

                // Encontrar al titular basado en el número de recibo
                const numeroRecibo = recibo ? recibo.str : "";
                const numeroCuenta = cuenta ? cuenta.str : "";

                let nombreTitular = "";
                if (numeroRecibo) {
                  const indexRecibo = textDireccion.indexOf(numeroRecibo);
                  if (indexRecibo !== -1) {
                    const indexNombreTitularStart = textDireccion.indexOf(
                      " ",
                      indexRecibo + numeroRecibo.length + 1
                    );
                    if (indexNombreTitularStart !== -1) {
                      let indexNombreTitularEnd = textDireccion.indexOf(
                        " ",
                        indexNombreTitularStart + 1
                      );
                      const nombreTitularWords = [];

                      // Agregar la primera palabra después del número de recibo al array nombreTitularWords
                      if (indexNombreTitularEnd !== -1) {
                        const nextWord = textDireccion
                          .slice(
                            indexNombreTitularStart + 1,
                            indexNombreTitularEnd
                          )
                          .trim();

                        // Verificar si la siguiente palabra es igual al número de cuenta
                        if (nextWord !== numeroCuenta) {
                          nombreTitularWords.push(nextWord);
                        }
                      }

                      // Buscar el resto de palabras hasta que se repita la primera palabra
                      while (indexNombreTitularEnd !== -1) {
                        const indexNextWordEnd = textDireccion.indexOf(
                          " ",
                          indexNombreTitularEnd + 1
                        );
                        const nextWord = textDireccion
                          .slice(
                            indexNombreTitularEnd + 1,
                            indexNextWordEnd !== -1
                              ? indexNextWordEnd
                              : undefined
                          )
                          .trim();

                        // Si la palabra actual no es igual a la primera palabra y no es igual al número de cuenta, agregarla al array
                        if (
                          nextWord !== nombreTitularWords[0] &&
                          nextWord !== numeroCuenta
                        ) {
                          nombreTitularWords.push(nextWord);
                        } else {
                          break; // Si se repite la primera palabra o es igual al número de cuenta, terminar el bucle
                        }

                        indexNombreTitularEnd = indexNextWordEnd;
                      }

                      // Si nombreTitular es igual al número de cuenta, colocar "Sin Clave Banelco"
                      if (nombreTitularWords.join(" ") === numeroCuenta) {
                        nombreTitular = "Sin Clave Banelco";
                      } else {
                        // Eliminar el primer item del array si es una sola letra
                        if (
                          nombreTitularWords.length > 1 &&
                          nombreTitularWords[0].length === 1
                        ) {
                          nombreTitularWords.shift();
                        }
                        nombreTitular = nombreTitularWords.join(" ");
                      }
                    }
                  }
                }

                // Comprobar si nombreTitular está vacío y numeroClaveB está vacío
                const numeroClaveB = clavePago
                  ? clavePago.str.match(/\d+/)[0]
                  : "";
                if (numeroClaveB == "") {
                  nombreTitular = "Sin clave Pago Electronico";
                }

                // Agregar una fila a la tabla con los valores encontrados
                const fila = document.createElement("tr");
                const celdaCuenta = document.createElement("td");

                const celdaNombreTitular = document.createElement("td");
                if (nombreTitular === "Sin clave Pago Electronico") {
                  celdaNombreTitular.classList.add("red");
                }
                const celdaDireccion = document.createElement("td");

                const celdaRecibo = document.createElement("td");
                const celdaClavePago = document.createElement("td");
                const celdaArchivo = document.createElement("td");
                const celdaPagina = document.createElement("td");
                const celdaDescripcion = document.createElement("td"); // Nueva celda para la descripción del recibo

                celdaCuenta.textContent = cuenta ? cuenta.str : "";
                celdaRecibo.textContent = recibo ? recibo.str : "";
                celdaClavePago.textContent = clavePago
                  ? clavePago.str.match(/\d+/)[0]
                  : "";
                celdaArchivo.textContent = nombreArchivo;

                celdaNombreTitular.textContent = nombreTitular;
                celdaDireccion.textContent = direccion;

                // Crear un botón que tenga el número de página como texto
                const botonPagina = document.createElement("button");
                botonPagina.textContent = j;

                // Envolver el botón en un enlace que abra el archivo PDF en la página correspondiente
                const enlace = document.createElement("a");
                enlace.href = `${carpeta}${nombreArchivo}#page=${j}`;
                enlace.target = "_blank";
                enlace.appendChild(botonPagina);

                celdaPagina.appendChild(enlace);

                // Obtener la descripción del tipo de recibo
                const descripcion = getDescripcion(nombreArchivo);

                celdaDescripcion.textContent = descripcion;

                fila.appendChild(celdaCuenta);
                fila.appendChild(celdaNombreTitular);
                fila.appendChild(celdaDireccion);
                fila.appendChild(celdaRecibo);
                fila.appendChild(celdaClavePago);
                fila.appendChild(celdaArchivo);
                fila.appendChild(celdaPagina);
                fila.appendChild(celdaDescripcion); // Agregar la nueva celda a la fila

                tablaEmision.appendChild(fila);
              });

              // Mostrar una alerta cuando se hayan procesado todos los archivos y páginas
              if (i === archivos.length - 1 && j === numPaginas) {
                //alert("Se han cargado todos los datos.");
                // ocultar el loader
                const loader = document.getElementById("loader");
                loader.style.display = "none";
              }
            });
          }
        });
      };
      fileReader.readAsArrayBuffer(archivo);
    } else {
      console.log(`El archivo ${nombreArchivo} no es un archivo PDF.`);
    }
  }
}

function getDescripcion(archivo) {
  if (archivo.startsWith("PPG_0")) {
    return "Plan de pago";
  } else if (archivo.startsWith("PPG_MAIL")) {
    return "Plan de pago (Email)";
  } else if (archivo.startsWith("SC_0")) {
    return "Servicios comerciales";
  } else if (archivo.startsWith("SC_MAIL")) {
    return "Servicios comerciales (Email)";
  } else if (archivo.startsWith("SS_0")) {
    return "Servicios Sanitarios";
  } else if (archivo.startsWith("SS_MAIL")) {
    return "Servicios sanitarios (Email)";
  } else if (archivo.startsWith("SS_NO_EMITE")) {
    return "No se emite";
  } else {
    return "Sin descripción";
  }
}

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
      fila.style.display = "";
    } else {
      fila.style.display = "none";
    }
  }
});

// Controlador de eventos para el botón de generar xls

const botonGenerar = document.getElementById("generar");
botonGenerar.addEventListener("click", function () {
  const tablaEmision = document.getElementById("tablaEmision");

  // Crear un nuevo libro de trabajo
  const libro = XLSX.utils.book_new();

  // Crear una hoja de cálculo
  const hoja = XLSX.utils.aoa_to_sheet([]);

  // Agregar los encabezados manualmente
  const encabezados = [
    "Cuenta",
    "Titular",
    "Dirección",
    "Recibo",
    "Clave Pago Electrónico",
    "Archivo",
    "Página",
    "Tipo",
  ];
  XLSX.utils.sheet_add_aoa(hoja, [encabezados]);

  // Obtener los datos de la tabla y agregarlos a la hoja de cálculo
  const filasTabla = tablaEmision.querySelectorAll("tbody tr");
  const datos = Array.from(filasTabla).map((fila) => {
    const celdas = Array.from(fila.querySelectorAll("td")).map(
      (td) => td.textContent
    );
    return celdas;
  });
  XLSX.utils.sheet_add_aoa(hoja, datos, { origin: -1 });

  // Ajustar el formato de la columna 3 para que muestre números enteros sin decimales
  hoja["!cols"] = [
    { width: 13 },
    { width: 14 },
    { width: 19 },
    { width: 34 },
    { width: 7 },
    { width: 25 },
  ];
  hoja["!cols"][2].z = "0";

  // Agregar la hoja de cálculo al libro de trabajo
  XLSX.utils.book_append_sheet(libro, hoja, "Datos");

  // Generar el archivo xlsx
  const nombreArchivo = "Claves-Pago Electronico.xlsx";
  XLSX.writeFile(libro, nombreArchivo);
});

// Controlador de eventos para el botón de generar JSON

const botonGenerarJson = document.getElementById("generarJson");
botonGenerarJson.addEventListener("click", function () {
  const tablaEmision = document.getElementById("tablaEmision");

  // Obtener los datos de la tabla
  const filasTabla = tablaEmision.querySelectorAll("tbody tr");
  const datos = Array.from(filasTabla).map((fila) => {
    const celdas = Array.from(fila.querySelectorAll("td")).map(
      (td) => td.textContent
    );
    return celdas;
  });

  // Crear un objeto JSON a partir de los datos
  const json = JSON.stringify({ data: datos }, null, 2);

  // Crear un elemento <a> para descargar el archivo JSON
  const link = document.createElement("a");
  link.href = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
  link.download = "claves-pago-electronico.json";
  link.click();

  // Mostrar un mensaje de confirmación
  alert("Se ha descargado el archivo JSON con éxito.");
});

const botonOrdenar = document.getElementById("ordenar-lista");

botonOrdenar.addEventListener("click", function () {
  const tablaEmision = document.getElementById("tablaEmision");
  const filas = tablaEmision.getElementsByTagName("tr");
  const datos = [];
  for (let i = 0; i < filas.length; i++) {
    const celdas = filas[i].getElementsByTagName("td");
    const cuenta = celdas[0].textContent;
    const usuario = celdas[1].textContent;
    const direccion = celdas[2].textContent;
    const recibo = celdas[3].textContent;
    const clave = celdas[4].textContent;
    const archivo = celdas[5].textContent;
    const pagina = celdas[6].textContent;
    const tipo = celdas[7].textContent;
    datos.push({
      cuenta,
      usuario,
      direccion,
      recibo,
      clave,
      archivo,
      pagina,
      tipo,
    });
  }

  datos.sort((a, b) => {
    if (a.cuenta < b.cuenta) {
      return -1;
    }
    if (a.cuenta > b.cuenta) {
      return 1;
    }
    return 0;
  });
  const tbody = document.getElementById("tablaEmision");
  tbody.innerHTML = "";
  for (const dato of datos) {
    const tr = document.createElement("tr");
    const tdCuenta = document.createElement("td");
    tdCuenta.textContent = dato.cuenta;
    const tdUsuario = document.createElement("td");
    tdUsuario.textContent = dato.usuario;
    const tdDireccion = document.createElement("td");
    tdDireccion.textContent = dato.direccion;
    const tdRecibo = document.createElement("td");
    tdRecibo.textContent = dato.recibo;
    const tdClave = document.createElement("td");
    tdClave.textContent = dato.clave;
    const tdArchivo = document.createElement("td");
    tdArchivo.textContent = dato.archivo;
    const tdPagina = document.createElement("td");
    tdPagina.textContent = dato.pagina;
    const tdTipo = document.createElement("td");
    tdTipo.textContent = dato.tipo;
    tr.appendChild(tdCuenta);
    tr.appendChild(tdUsuario);
    tr.appendChild(tdDireccion);
    tr.appendChild(tdRecibo);
    tr.appendChild(tdClave);
    tr.appendChild(tdArchivo);
    tr.appendChild(tdPagina);
    tr.appendChild(tdTipo);
    tbody.appendChild(tr);
  }
});

const botonLimpiar = document.getElementById("limpiar");
botonLimpiar.addEventListener("click", function () {
  clearTable();
});
