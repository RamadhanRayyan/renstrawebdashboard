import fs from 'fs';

const contentPath = 'C:\\Users\\THINKPAD\\.gemini\\antigravity\\brain\\a052f0ba-8824-4825-9543-f449b56a8d73\\.system_generated\\steps\\72\\content.md';
let content = fs.readFileSync(contentPath, 'utf8');

// Strip out the first 5 lines
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.startsWith('No,Misi,BAGIAN'));
if (startIdx === -1) throw new Error("Header not found");

const csvData = lines.slice(startIdx + 1).join('\n'); // skip header

// Simple CSV parser supporting quotes
function parseCSV(text) {
  const result = [];
  let row = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++; // skip \n
        }
        row.push(current);
        result.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current !== '' || row.length > 0) {
    row.push(current);
    result.push(row);
  }
  return result;
}

const records = parseCSV(csvData);

let currentMisi = null;
let currentMisiId = null;

let programs = [];

let programIdCounter = 1;
let sasaranIdCounter = 1;
let indikatorIdCounter = 1;

for (const row of records) {
  if (row.length < 17) continue;
  
  let misiText = row[1]?.trim();
  if (misiText && misiText !== '') {
    currentMisi = misiText;
  }
  
  if (!currentMisi) continue;
  
  let program = programs.find(p => p.nama === currentMisi);
  if (!program) {
    program = { id: `P${programIdCounter++}`, nama: currentMisi, sasaran: [] };
    programs.push(program);
  }
  
  let sasaranText = row[3]?.trim();
  if (!sasaranText) sasaranText = "Sasaran Umum";
  
  let sasaran = program.sasaran.find(s => s.nama === sasaranText);
  if (!sasaran) {
    sasaran = { id: `S${sasaranIdCounter++}`, nama: sasaranText, indikator: [] };
    program.sasaran.push(sasaran);
  }
  
  let indikatorNama = row[6]?.trim();
  if (!indikatorNama) continue;
  
  let target2026 = parseFloat(row[9]) || 0;
  let target2027 = parseFloat(row[10]) || 0;
  let target2028 = parseFloat(row[11]) || 0;
  let target2029 = parseFloat(row[12]) || 0;
  let target2030 = parseFloat(row[13]) || 0;
  
  sasaran.indikator.push({
    id: `I${indikatorIdCounter++}`,
    bagian: row[2]?.trim(),
    borang_aipt: row[4]?.trim() || sasaranText,
    kode: row[5]?.trim(),
    nama: indikatorNama,
    iku_ikt: row[7]?.trim(),
    baseline: parseFloat(row[8]) || 0,
    satuan: row[14]?.trim(),
    penjelasan: row[15]?.trim(),
    pic: row[16]?.trim(),
    targets: {
      2026: target2026,
      2027: target2027,
      2028: target2028,
      2029: target2029,
      2030: target2030
    }
  });
}

// Generate SQL
let sql = `
-- Clear existing data
DELETE FROM renstra_yearly_values;
DELETE FROM renstra_indikator;
DELETE FROM renstra_sasaran;
DELETE FROM renstra_programs;

`;

let pUrutan = 1;
for (const p of programs) {
  sql += `INSERT INTO renstra_programs (id, nama, urutan) VALUES ('${p.id}', '${p.nama.replace(/'/g, "''")}', ${pUrutan++});\n`;
  
  let sUrutan = 1;
  for (const s of p.sasaran) {
    sql += `INSERT INTO renstra_sasaran (id, program_id, nama, urutan) VALUES ('${s.id}', '${p.id}', '${s.nama.replace(/'/g, "''")}', ${sUrutan++});\n`;
    
    let iUrutan = 1;
    for (const i of s.indikator) {
      sql += `INSERT INTO renstra_indikator (id, sasaran_id, nama, satuan, bagian, borang_aipt, kode, iku_ikt, baseline, penjelasan, pic, urutan) VALUES (
        '${i.id}', '${s.id}', '${i.nama.replace(/'/g, "''")}', '${i.satuan.replace(/'/g, "''")}', '${(i.bagian||'').replace(/'/g, "''")}', '${(i.borang_aipt||'').replace(/'/g, "''")}', '${(i.kode||'').replace(/'/g, "''")}', '${(i.iku_ikt||'').replace(/'/g, "''")}', ${i.baseline}, '${(i.penjelasan||'').replace(/'/g, "''")}', '${(i.pic||'').replace(/'/g, "''")}', ${iUrutan++}
      );\n`;
      
      for (const year of [2026, 2027, 2028, 2029, 2030]) {
        sql += `INSERT INTO renstra_yearly_values (indikator_id, tahun, bulan, target, actual, budget) VALUES ('${i.id}', ${year}, 0, ${i.targets[year]}, 0, 0);\n`;
      }
    }
  }
}

fs.writeFileSync('import_renstra.sql', sql);
console.log('import_renstra.sql generated successfully with ' + programs.length + ' programs.');
