function extractTodayDistribution() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('Distribution');
  const outputSheetName = 'Bulk Distro Status';
  
  // Get or create output sheet
  let outputSheet = ss.getSheetByName(outputSheetName);
  if (outputSheet) {
    outputSheet.clear();
  } else {
    outputSheet = ss.insertSheet(outputSheetName);
  }
  
  // Set up output headers
  outputSheet.getRange(1, 1, 1, 4).setValues([['Date', 'User Group', 'Distribution List/Distribution Name', 'Per Agent']]);
  outputSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  
  // Get today's date formatted as in the sheet
  const today = new Date();
  const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  
  // Get all data from source sheet
  const data = sourceSheet.getDataRange().getValues();
  const maxRows = data.length;
  const maxCols = data[0].length;
  
  const outputData = [];
  
  // Find all columns with today's date in row 3 (index 2)
  const todayColumns = [];
  for (let col = 0; col < maxCols; col++) {
    const cellValue = data[2][col]; // row 3 = index 2
    if (cellValue) {
      let dateStr = '';
      if (cellValue instanceof Date) {
        dateStr = Utilities.formatDate(cellValue, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
      } else {
        dateStr = cellValue.toString();
      }
      if (dateStr === todayStr) {
        todayColumns.push(col);
      }
    }
  }
  
  Logger.log('Found today columns: ' + todayColumns);
  
  // Process each today's block
  for (const startCol of todayColumns) {
    // Determine block end (next block starts after 1 empty column)
    let endCol = startCol;
    for (let col = startCol + 1; col < maxCols; col++) {
      if (data[2][col]) { // Found another date, stop
        break;
      }
      endCol = col;
    }
    
    Logger.log(`Processing block from column ${startCol} to ${endCol}`);
    
    // Search for all tables in this block
    for (let row = 3; row < maxRows; row++) { // Start from row 4 (index 3)
      // Look for "Distribution List/Distribution Name" header
      for (let col = startCol; col <= endCol; col++) {
        const cellValue = data[row][col];
        if (cellValue && cellValue.toString().includes('Distribution List/Distribution Name')) {
          Logger.log(`Found table header at row ${row + 1}, col ${col + 1}`);
          
          // Found a table header row
          const headerRow = row;
          const distColIdx = col;
          
          // Find "Per Agent" column
          let perAgentColIdx = -1;
          for (let c = startCol; c <= endCol; c++) {
            if (data[headerRow][c] && data[headerRow][c].toString().includes('Per Agent')) {
              perAgentColIdx = c;
              break;
            }
          }
          
          // Find "User Group" by searching upward from table header
          // Look for "User Group" label above the current table
          let userGroup = '';
          for (let searchRow = headerRow - 1; searchRow >= 0; searchRow--) {
            for (let c = startCol; c <= endCol; c++) {
              if (data[searchRow][c] && data[searchRow][c].toString().trim() === 'User Group') {
                // Found "User Group" label, now get the value
                // Check same row, next column
                if (c + 1 <= endCol && data[searchRow][c + 1]) {
                  userGroup = data[searchRow][c + 1];
                  break;
                }
                // Or check row below
                if (searchRow + 1 < maxRows && data[searchRow + 1][c]) {
                  userGroup = data[searchRow + 1][c];
                  break;
                }
              }
            }
            if (userGroup) break;
            // Stop searching too far up
            if (headerRow - searchRow > 10) break;
          }
          
          Logger.log(`User Group: ${userGroup}, Per Agent column: ${perAgentColIdx + 1}`);
          
          // Extract data rows
          for (let dataRow = headerRow + 1; dataRow < maxRows; dataRow++) {
            const distValue = data[dataRow][distColIdx];
            
            // Stop at empty or "Total"
            if (!distValue || distValue.toString().trim() === '' || distValue.toString().includes('Total')) {
              break;
            }
            
            const perAgentValue = perAgentColIdx >= 0 ? data[dataRow][perAgentColIdx] : '';
            
            outputData.push([
              todayStr,
              userGroup.toString(),
              distValue.toString(),
              perAgentValue
            ]);
          }
        }
      }
    }
  }
  
  // Write output data
  if (outputData.length > 0) {
    outputSheet.getRange(2, 1, outputData.length, 4).setValues(outputData);
    SpreadsheetApp.getUi().alert(`Extraction complete! ${outputData.length} rows extracted.`);
  } else {
    SpreadsheetApp.getUi().alert('No data found for today\'s date: ' + todayStr);
  }
}