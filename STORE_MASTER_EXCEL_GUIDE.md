# Store Master Excel-to-JSON Conversion

This system allows you to regenerate the `stores_master.json` file from Excel data with a single command.

## Quick Start

1. **Place your Excel file** at `data/List of Stores.xlsx`
2. **Run the conversion**: `npm run build:stores:from:xlsx`
3. **Deploy the changes**: `npm run stores:pathB`

## Excel File Format

Your Excel file should contain columns with any of these names (case-insensitive):

### Required Columns
- **Store Code**: `store_code`, `code`, `store id`, `storeid`, `store code`, `store#`
- **Store Name**: `store_name`, `name`, `store`, `storename`, `store name`

### Optional Columns
- **Banner**: `banner`, `brand` (defaults to "TWL")
- **Region**: `region`, `region_name`, `region name`
- **Region Code**: `region_code`, `region code`, `region id`, `regionid` (auto-generated from region if missing)
- **Manager Email**: `manager_email`, `email`, `manager email`, `store_email`, `store email` (auto-generated if missing)
- **Active Status**: `active`, `is_active`, `status` (defaults to true)

## Example Excel Structure

| Store Code | Store Name | Banner | Region | Region Code | Manager Email | Active |
|------------|------------|--------|--------|-------------|---------------|--------|
| 362 | Albany | TWL | Auckland | AKL | albany.manager@twgroup.co.nz | TRUE |
| 383 | Manukau | TWL | Auckland | AKL | manukau.manager@twgroup.co.nz | TRUE |

## Generated JSON Format

```json
[
  {
    "store_code": "362",
    "store_name": "Albany",
    "banner": "TWL",
    "region": "Auckland",
    "region_code": "AKL",
    "manager_email": "albany.manager@twgroup.co.nz",
    "active": true
  }
]
```

## Commands

- **Convert Excel to JSON**: `npm run build:stores:from:xlsx`
- **Load JSON to staging**: `npm run stores:load`
- **Run full migration**: `npm run stores:pathB`

## Features

- **Smart column detection**: Automatically maps various column name formats
- **Email inference**: Generates manager emails from store names if not provided
- **Region code generation**: Creates region codes from region names if missing
- **Data validation**: Filters out rows without required store code and name
- **Summary reporting**: Shows conversion statistics and data quality metrics

## Troubleshooting

### "Excel file not found"
- Ensure your Excel file is placed at `data/List of Stores.xlsx`
- Check the file name matches exactly (case-sensitive)

### "No data found in Excel file"
- Verify your Excel file has data in the first sheet
- Check that the sheet contains the expected columns

### "Column mappings not found"
- Review the column names in your Excel file
- The script looks for common variations, but you may need to adjust column names

## Customization

To modify column name mappings, edit `scripts/xlsx-to-stores-json.mjs` and update the `map` object:

```javascript
const map = {
  code: ['store_code', 'code', 'store id', 'storeid', 'store code', 'store#'],
  name: ['store_name', 'name', 'store', 'storename'],
  // ... add your custom column names here
};
```
