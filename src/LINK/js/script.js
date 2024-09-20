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
      if (file.name.includes(".li2")) {
        extractDataFromFile(result);
      }
    };

    reader.readAsText(file); // Use readAsText to read the file as a text string
  }

  function extractDataFromFile(fileData) {
    const matchFecha = fileData.match(/Fecha de Proceso:\s*(.*)/);
    const matchCantTotal = fileData.match(/CANT\.TOTAL DE COBRANZAS\s*(.*)/);
    const matchImporteTotal = fileData.match(/IMPORTE TOTAL COBRADO\s*(.*)/);

    if (matchFecha && matchCantTotal && matchImporteTotal) {
      const fecha = matchFecha[1].trim();
      const cantTotal = matchCantTotal[1].trim();
      const importeTotal = matchImporteTotal[1].trim();

      const data = { fecha, cantTotal, importeTotal };
      processData([data]);

      return data;
    } else {
      console.error("Required data not found in the file.");
    }

    return null;
  }

  function processData(data) {
    data.forEach((item) => {
      // console.log(item);
      const fechaRecaudacion = item.fecha;
      const importe = item.importeTotal;
      const cupones = item.cantTotal;
      const fechaAfectacion = fechaRecaudacion;

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
