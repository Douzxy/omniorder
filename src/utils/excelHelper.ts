import * as XLSX from "xlsx";

/**
 * Generates and downloads the XLSX template for product import.
 */
export function downloadXLSXTemplate() {
  const headers = [
    "Product Name",
    "Price",
    "Category",
    "Description",
    "Image URL"
  ];
  
  const sampleData = [
    [
      "Nasi Goreng Spesial",
      "25000",
      "Makanan Utama",
      "Nasi goreng dengan telur mata sapi dan kerupuk udang",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300"
    ],
    [
      "Es Teh Manis",
      "5000",
      "Minuman",
      "Es teh manis segar khas outlet",
      ""
    ],
    [
      "Ayam Geprek Level 5",
      "18000",
      "Makanan Utama",
      "Ayam geprek krispi dengan sambal bawang super pedas",
      ""
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Produk");
  
  XLSX.writeFile(wb, "template_import_produk.xlsx");
}

/**
 * Parses an Excel (.xlsx) or CSV (.csv) file into JSON rows.
 */
export function parseExcelOrCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return reject(new Error("Berkas kosong"));
        
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array of objects
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
