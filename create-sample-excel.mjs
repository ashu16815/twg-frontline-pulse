import fs from 'fs/promises';
import xlsx from 'xlsx';

// Create a sample Excel file for testing
const sampleData = [
  {
    'Store Code': '362',
    'Store Name': 'Albany',
    'Banner': 'TWL',
    'Region': 'Auckland',
    'Region Code': 'AKL',
    'Manager Email': 'albany.manager@twgroup.co.nz',
    'Active': 'TRUE'
  },
  {
    'Store Code': '383',
    'Store Name': 'Manukau',
    'Banner': 'TWL',
    'Region': 'Auckland',
    'Region Code': 'AKL',
    'Manager Email': 'manukau.manager@twgroup.co.nz',
    'Active': 'TRUE'
  },
  {
    'Store Code': '305',
    'Store Name': 'East Tamaki',
    'Banner': 'TWL',
    'Region': 'Auckland',
    'Region Code': 'AKL',
    'Manager Email': 'easttamaki.manager@twgroup.co.nz',
    'Active': 'TRUE'
  }
];

const ws = xlsx.utils.json_to_sheet(sampleData);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Stores');

const buf = xlsx.write(wb, { type: 'buffer' });
await fs.writeFile('data/List of Stores.xlsx', buf);

console.log('✅ Sample Excel file created: data/List of Stores.xlsx');
