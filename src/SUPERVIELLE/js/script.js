window.addEventListener("DOMContentLoaded", (event) => {
  const dropArea = document.getElementById("dropArea");
  const dataTable = document.getElementById("dataTable");
  /* when click on button call the buttonAlert function */

  // Prevenir comportamientos de arrastrar por defecto
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  // Resaltar área de soltar cuando se arrastra un elemento sobre ella
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  // Eliminar resaltado cuando se arrastra un elemento fuera del área de soltar
  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  // Manejar archivos soltados
  dropArea.addEventListener("drop", handleDrop, false);

  // Manejar boton imprimir
  const btnPrint = document.getElementById("btnPrint");

  btnPrint.addEventListener("click", () => {
    const table = document.getElementById("dataTable");
    const printWindow = window.open("", "", "height=400,width=600");
    printWindow.document.write("Link");
    printWindow.document.write(table.outerHTML);
    // call real print windows
  });

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
    clearTable();
    handleFiles(files);
  }

  function handleFiles(files) {
    [...files].forEach(uploadFile);
  }

  function uploadFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const result = e.target.result;
      if (file.name.includes("736list2")) {
        extractDataFromFile(result);
      }
    };

    reader.readAsText(file); // Use readAsText to read the file as a text string
  }

  function extractDataFromFile(fileData) {
    // Dividir el archivo en secciones utilizando la palabra clave "****** FIN DE REPORTE ******"
    const sections = fileData.split("****** FIN DE REPORTE ******");
    const data = [];

    sections.forEach((section) => {
      // Verificar si la sección no está vacía
      if (section.trim().length > 0) {
        // Extraer las fechas y totales dentro de cada sección
        const matchFecha = section.match(/FECHA:\s*(\d{2}\/\d{2}\/\d{4})/);
        const matchFechaPago = section.match(
          /FECHA DE PAGO:\s*(\d{2}\/\d{2}\/\d{4})/
        );
        const matchTotales = section.match(
          /TOTALES\s*:\s*(\d+)\s*([\d.,]+)\s*([\d.,]+)/
        );

        if (matchFecha && matchFechaPago && matchTotales) {
          const fecha = matchFecha[1].trim();
          const fechaPago = matchFechaPago[1].trim();
          const cantCupones = matchTotales[1].trim();
          const importePesos = matchTotales[2].replace(".", "");

          data.push({ fecha, fechaPago, cantCupones, importePesos });
        } else {
          console.error("Required data not found in the section.");
        }
      }
    });

    if (data.length > 0) {
      console.log(data);
      processData(data);
      return data;
    }

    return null;
  }

  function processData(data) {
    data.forEach((item) => {
      const fechaRecaudacion = item.fechaPago;
      const importe = item.importePesos;
      const cupones = item.cantCupones;
      const fechaAfectacion = item.fecha;

      // Agregar los datos a la tabla
      const row = dataTable.insertRow();
      const fechaRecaudacionCell = row.insertCell();
      const importeCell = row.insertCell();
      const cuponesCell = row.insertCell();
      const fechaAfectacionCell = row.insertCell();

      fechaRecaudacionCell.textContent = fechaRecaudacion;
      importeCell.textContent = importe;
      cuponesCell.textContent = cupones || "";
      fechaAfectacionCell.textContent = fechaAfectacion;
    });

    sortTableByDate();
  }

  function sortTableByDate() {
    const tableRows = [...dataTable.rows];

    tableRows.sort((a, b) => {
      const dateA = parseDate(a.cells[0].textContent);
      const dateB = parseDate(b.cells[0].textContent);

      return dateA - dateB;
    });

    tableRows.forEach((row) => {
      dataTable.appendChild(row);
    });

    btnPrint.classList.remove("hidden");
  }

  function parseDate(dateString) {
    const [day, month, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day); // month is 0-based in Date constructor
  }

  function clearTable() {
    while (dataTable.rows.length > 1) {
      dataTable.deleteRow(1);
    }
  }
});

// on click search button open dialog file

document.getElementById("btn-search").addEventListener("click", function () {
  document.getElementById("file-input").click();
});

document
  .getElementById("file-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const fileContent = e.target.result;
        console.log(fileContent);
        // Aquí puedes llamar a tu función extractDataFromFile(fileContent)
      };
      reader.readAsText(file);
    }
  });
