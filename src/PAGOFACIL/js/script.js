function sortTableByDate(dataTable) {
  const tableRows = [...dataTable.rows];

  tableRows.sort((a, b) => {
    const dateAString = a.cells[0].textContent;
    const dateBString = b.cells[0].textContent;

    console.log("Fecha A antes de formatear:", dateAString);
    console.log("Fecha B antes de formatear:", dateBString);

    const dateA = new Date(formatDateForComparison(dateAString));
    const dateB = new Date(formatDateForComparison(dateBString));

    console.log("Fecha A después de formatear:", dateA);
    console.log("Fecha B después de formatear:", dateB);

    return dateA - dateB;
  });

  tableRows.forEach((row) => {
    dataTable.appendChild(row);
  });
}

function formatDateForComparison(dateString) {
  // Si el formato de la fecha es dd/mm/yyyy, lo convertimos a yyyy/mm/dd
  const parts = dateString.split("/");
  return `20${parts[2]}/${parts[1]}/${parts[0]}`;
}

function orderTable() {
  // dataTable-OP and dataTable-pA ids
  const dataTablepA = document.getElementById("dataTable-pA");
  const dataTableOP = document.getElementById("dataTable-OP");

  sortTableByDate(dataTablepA);
  sortTableByDate(dataTableOP);
}

function reorderTable(table, rows) {
  // Elimina todas las filas de la tabla
  while (table.rows.length > 1) {
    table.deleteRow(1); // Elimina la fila 1 repetidamente (dejando intacta la fila de encabezados)
  }

  // Inserta las filas ordenadas en la tabla
  rows.forEach((row) => {
    table.appendChild(row);
  });
}

window.addEventListener("DOMContentLoaded", (event) => {
  const dropArea = document.getElementById("dropArea");
  const dataTablepA = document.getElementById("dataTable-pA");
  const dataTableOP = document.getElementById("dataTable-OP");
  const button = document.getElementById("btn-tabla-pA");

  button.addEventListener("click", processTable);

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  dropArea.addEventListener("drop", handleDrop, false);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropArea.classList.add("highlight");
  }

  function unhighlight() {
    dropArea.classList.remove("highlight");
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    handleFiles(files);
  }

  function handleFiles(files) {
    const pAFiles = [];
    const OPFiles = [];

    [...files].forEach((file) => {
      if (file.name.startsWith("pA")) {
        pAFiles.push(file);
      } else if (file.name.startsWith("OPAGO")) {
        OPFiles.push(file);
      }
    });

    pAFiles.forEach(uploadFilepA);
    // Llamada a uploadFileOP comentada para ser llamada después
    OPFiles.forEach(uploadFileOP);
  }

  function uploadFilepA(file) {
    const reader = new FileReader();

    clearTable();
    reader.onload = function (e) {
      const result = e.target.result;
      console.log("Archivo pA leído:", file.name);
      extractDataFromFilepA(result);
    };

    reader.readAsText(file);
  }

  function uploadFileOP(file) {
    const reader = new FileReader();

    clearTable();
    reader.onload = function (e) {
      const result = e.target.result;
      console.log("Archivo OP leído:", file.name);

      extractDataFromFileOP(result, file.name);
    };

    reader.onerror = function (e) {
      console.error("Error al leer el archivo:", e);
    };

    reader.readAsText(file);
  }

  function extractDataFromFilepA(fileData) {
    // Divide el texto en líneas
    const lines = fileData.split("\n");

    // Declarar variables para almacenar los datos extraídos
    let fechaRecaudacion, totalRegistros, totalRecaudado;

    // Iterar sobre cada línea del archivo
    lines.forEach((line) => {
      // Buscar la línea que contiene la fecha con guiones
      if (line.includes("Buenos Aires")) {
        // Extraer la fecha con guiones
        const matches = line.match(/\d{4}-\d{2}-\d{2}/);
        fechaRecaudacion = matches ? matches[0] : null;
      }

      // Buscar la línea que contiene "Total Registros"
      if (line.includes("Total Registros")) {
        // Extraer el total de registros (cupones)
        const value = line.split(":")[1].trim();
        totalRegistros = parseFloat(value);
      }

      // Buscar la línea que contiene "Total Recaudado"
      if (line.includes("Total Recaudado")) {
        // Extraer el total recaudado
        const value = line.split(":")[1].trim().replace(/,/g, "");
        const lastIndex = value.lastIndexOf(".");
        if (lastIndex !== -1) {
          totalRecaudado = parseFloat(
            value.substring(0, lastIndex).replace(".", ",") +
              value.substring(lastIndex)
          );
        } else {
          totalRecaudado = parseFloat(value.replace(".", ","));
        }
      }
    });

    // Verificar que todos los datos hayan sido extraídos correctamente antes de insertar en la tabla
    if (
      fechaRecaudacion !== null &&
      totalRegistros !== null &&
      totalRecaudado !== null
    ) {
      // Insertar los datos en la tabla dataTablepA
      const row = dataTablepA.insertRow();
      const fechaRecaudacionCell = row.insertCell();
      const totalRecaudadoCell = row.insertCell();
      const totalRegistrosCell = row.insertCell();

      fechaRecaudacionCell.textContent = formatDatepA(fechaRecaudacion);
      // Insertar el total de registros y total recaudado
      totalRegistrosCell.textContent = totalRegistros;
      totalRecaudadoCell.textContent = totalRecaudado;
    }
  }

  function extractDataFromFileOP(fileData, fileName) {
    // Divide el texto en líneas
    const lines = fileData.split("\n");

    // Declarar variables para almacenar los datos extraídos
    let fechaPago,
      totalTx = 0,
      totalBruto = 0;

    // Iterar sobre cada línea del archivo
    lines.forEach((line) => {
      // Buscar la línea que contiene "Fecha pago"
      if (line.includes("Fecha pago")) {
        // Extraer la fecha de pago
        const matches = line.match(/\d{2}\/\d{2}\/\d{2}/);
        fechaPago = matches ? matches[0] : null;
      }

      // Eliminar los espacios en blanco y dividir la línea en un array
      const elements = line.trim().split(/\s+/);

      if (elements[0] === "PX") {
        // Verificar si hay suficientes elementos en la línea
        if (elements.length >= 8) {
          // Sumar los valores de las posiciones length-1 y length
          const cupones = parseFloat(elements[elements.length - 2]);
          const totalRecaudado = parseFloat(
            elements[elements.length - 1].replace(/\./g, "").replace(",", ".")
          );

          // Redondear el total recaudado a dos decimales
          const totalRecaudadoRedondeado =
            Math.round(totalRecaudado * 100) / 100;

          // Sumar los valores extraídos
          totalTx += cupones;
          totalBruto += totalRecaudadoRedondeado;
        }
      }
    });

    // Verificar que todos los datos hayan sido extraídos correctamente antes de insertar en la tabla
    if (fechaPago !== null && totalTx !== null && totalBruto !== null) {
      // Insertar los datos en la tabla dataTableOP
      const row = dataTableOP.insertRow();
      const fechaPagoCell = row.insertCell();
      const totalTxCell = row.insertCell();
      const totalBrutoCell = row.insertCell();
      const fileNameCell = row.insertCell();
      fileNameCell.hidden = true;

      // Insertar los valores extraídos
      fechaPagoCell.textContent = formatDateOP(fechaPago);
      totalTxCell.textContent = totalTx;
      totalBrutoCell.textContent = totalBruto.toFixed(2); // Redondear el total bruto a dos decimales
      fileNameCell.textContent = fileName;
    }

    // order table
    orderTable();
  }

  // Función para formatear la fecha al formato dd/mm/yyyy
  function formatDateOP(dateString) {
    const parts = dateString.split("/");
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];

    return `${day}/${month}/${year}`;
  }

  function formatDatepA(dateString) {
    /* date is yyyy-mm-dd and should be dd/mm/yyyy */
    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
  }

  function processTable() {
    orderTable();
  }

  function clearTable() {
    for (let i = dataTablepA.rows.length - 1; i > 0; i--) {
      dataTablepA.deleteRow(i);
    }

    for (let i = dataTableOP.rows.length - 1; i > 0; i--) {
      dataTableOP.deleteRow(i);
    }
  }
});
