window.addEventListener("DOMContentLoaded", (event) => {
  const dropArea = document.getElementById("dropArea");
  const dataTable = document.getElementById("dataTable");
  const button = document.querySelector("button");
  /* when click on button call the buttonAlert function */

  // Manejar boton imprimir
  const btnPrint = document.getElementById("btnPrint");

  btnPrint.addEventListener("click", () => {
    const table = document.getElementById("dataTable");
    const printWindow = window.open("", "", "height=400,width=600");
    printWindow.document.write("Cobro Express");
    printWindow.document.write(table.outerHTML);
    // call real print windows
  });
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
    [...files].forEach(uploadFile);
  }

  function uploadFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const result = e.target.result;
      console.log("Archivo leído:", file.name);
      // if file start with "Resumen"

      if (file.name.startsWith("Resumen")) {
        extractDataFromPDF(result);
      } else {
      }
    };

    reader.readAsArrayBuffer(file);
  }

  function extractDataFromPDF(fileData) {
    clearTable();
    // Configurar la ruta del archivo de trabajo de pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.js";

    // Cargar el archivo PDF utilizando pdf.js
    pdfjsLib.getDocument(fileData).promise.then(function (pdf) {
      // Extraer datos del PDF de todas las páginas
      const targetPages = [];
      for (let i = 0; i < pdf.numPages; i++) {
        targetPages.push(i + 1);
      }
      const extractedTexts = []; // Cambiado a let

      function extractTextFromPage(pageNumber) {
        return new Promise((resolve, reject) => {
          pdf.getPage(pageNumber).then(function (page) {
            page.getTextContent().then(function (textContent) {
              const extractedText = textContent.items
                .map(function (item) {
                  return item.str;
                })
                .join(" ");

              resolve(extractedText);
            });
          });
        });
      }

      const extractPromises = targetPages.map((pageNumber) =>
        extractTextFromPage(pageNumber)
      );
      Promise.all(extractPromises)
        .then((texts) => {
          console.log("Datos extraídos:", texts);
          extractedTexts.push(...texts);
          processData(extractedTexts);
          sortTableByDate();
        })
        .catch((error) => {
          console.error("Error al extraer datos:", error);
        });
    });
  }

  function processData(data) {
    data.forEach((text) => {
      // Split the text by spaces
      const parts = text.split(/\s+/);

      // Find the index of "Totales:"
      const indexTotales = parts.indexOf("Totales:");
      const indexFecha = parts.indexOf("Cobro:");
      const boletas = parts.indexOf("Depósito:");

      if (indexTotales !== -1) {
        // Extract the required values using the specified indices
        const fechaRecaudacion = parts[indexFecha + 1];
        let importe = parts[indexTotales + 3];
        const fechaAfectacion = parts[indexTotales + 2];
        const cupones = parts[boletas - 2];

        // numbers are like 4,766.42 and must be converted to 4766,42
        importe = importe.replace(",", "");
        importe = importe.replace(".", ",");

        // Add the data to the table
        const row = dataTable.insertRow();
        const fechaRecaudacionCell = row.insertCell();
        const importeCell = row.insertCell();
        const cuponesCell = row.insertCell();
        const fechaAfectacionCell = row.insertCell();

        fechaRecaudacionCell.textContent = fechaRecaudacion;
        importeCell.textContent = importe;
        cuponesCell.textContent = cupones;
        fechaAfectacionCell.textContent = fechaAfectacion;
      }
    });
    sortTableByDate();
  }

  function parseDate(dateString) {
    const [day, month, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day); // En JavaScript, los meses son 0-indexed
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

  function clearTable() {
    while (dataTable.rows.length > 1) {
      dataTable.deleteRow(1);
    }
  }
});
