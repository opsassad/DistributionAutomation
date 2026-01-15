function extractDistributionSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getActiveSheet();
  
  Logger.log("=== STARTING EXTRACTION ===");
  Logger.log("Active Sheet: " + activeSheet.getName());
  
  // Get or create Special Distro Status sheet
  let summarySheet = ss.getSheetByName("Special Distro Status");
  if (!summarySheet) {
    Logger.log("Creating new Special Distro Status sheet");
    summarySheet = ss.insertSheet("Special Distro Status");
    // Add headers
    summarySheet.getRange("A1:D1").setValues([["Date", "Distribution Name", "Per Agent", "Agent IDs"]]);
    summarySheet.getRange("A1:D1").setFontWeight("bold").setBackground("#4a86e8").setFontColor("white");
    summarySheet.setFrozenRows(1);
    
    // Format columns as text to prevent auto-conversion
    summarySheet.getRange("A:A").setNumberFormat("@"); // Date column as text
    summarySheet.getRange("D:D").setNumberFormat("@"); // Agent IDs column as text
  } else {
    Logger.log("Special Distro Status sheet already exists");
    // Ensure columns are formatted as text
    summarySheet.getRange("A:A").setNumberFormat("@");
    summarySheet.getRange("D:D").setNumberFormat("@");
  }
  
  // Get the date from sheet name (e.g., "Special Leads - 12-Jan-2026")
  const sheetName = activeSheet.getName();
  const dateMatch = sheetName.match(/(\d{1,2})[- ]?(\w{3})[- ]?(\d{4})?/i);
  let dateStr = "";
  
  if (dateMatch) {
    // Extract date parts
    const day = dateMatch[1];
    const month = dateMatch[2];
    const year = dateMatch[3] || "2026"; // Default to 2026 if not found
    dateStr = day + "-" + month + "-" + year; // Format: 12-Jan-2026
  } else {
    dateStr = new Date().toLocaleDateString();
  }
  
  Logger.log("Extracted date from sheet name: " + dateStr);
  
  // Get all data from the sheet
  const lastRow = activeSheet.getLastRow();
  const lastCol = activeSheet.getLastColumn();
  Logger.log("Sheet dimensions - Rows: " + lastRow + ", Columns: " + lastCol);
  
  const allData = activeSheet.getRange(1, 1, lastRow, lastCol).getValues();
  
  const results = [];
  
  // Start from Column B (index 1) and jump by 4 columns each time
  Logger.log("\n=== SCANNING FOR DISTRIBUTION BLOCKS ===");
  for (let col = 1; col < lastCol; col += 4) {
    Logger.log("\n--- Checking column index: " + col + " (Column " + String.fromCharCode(65 + col) + ") ---");
    
    let distributionName = "";
    let perAgent = "";
    let agentIDs = "";
    let foundDistribution = false;
    
    // Scan through rows looking for "Distribution Name" in Column B
    for (let row = 0; row < allData.length; row++) {
      const cellValue = allData[row][col]; // Column B
      
      // Check if this is the "Distribution Name" label
      if (cellValue && cellValue.toString().trim() === "Distribution Name") {
        Logger.log("Found 'Distribution Name' label at Row " + (row + 1) + ", Col " + (col + 1));
        foundDistribution = true;
        
        // Get the actual distribution name from Column C (same row)
        if (col + 1 < lastCol) {
          const nameValue = allData[row][col + 1];
          if (nameValue && nameValue.toString().trim() !== "") {
            distributionName = nameValue.toString().trim();
            Logger.log("✓ Distribution Name: " + distributionName);
          }
        }
        
        // Now look for "Per Agent" and "Combined ID for CRM" in the rows below
        for (let searchRow = row + 1; searchRow < Math.min(row + 50, allData.length); searchRow++) {
          const attrLabel = allData[searchRow][col];
          
          // Found "Per Agent"
          if (attrLabel && attrLabel.toString().trim() === "Per Agent") {
            const perAgentValue = allData[searchRow][col + 1];
            if (perAgentValue !== null && perAgentValue !== undefined && perAgentValue !== "") {
              perAgent = perAgentValue.toString(); // Convert to string
              Logger.log("✓ Per Agent: " + perAgent);
            }
          }
          
          // Found "Combined ID for CRM"
          if (attrLabel && attrLabel.toString().includes("Combined ID for CRM")) {
            Logger.log("Found 'Combined ID for CRM' at Row " + (searchRow + 1));
            // Agent IDs are in the next row, same column B
            if (searchRow + 1 < allData.length) {
              const idsValue = allData[searchRow + 1][col];
              if (idsValue && idsValue.toString().trim() !== "") {
                // Force it to be a string by adding a single quote prefix
                agentIDs = "'" + idsValue.toString().trim();
                Logger.log("✓ Agent IDs: " + agentIDs);
              }
            }
            break; // Found IDs, stop searching this block
          }
        }
        
        break; // Found distribution block, move to next column
      }
    }
    
    // Add to results if we found valid data
    if (foundDistribution && distributionName && perAgent !== "") {
      Logger.log("\n★ Adding to results:");
      Logger.log("  Date: " + dateStr);
      Logger.log("  Distribution Name: " + distributionName);
      Logger.log("  Per Agent: " + perAgent);
      Logger.log("  Agent IDs: " + agentIDs);
      results.push([dateStr, distributionName, perAgent, agentIDs]);
    }
  }
  
  Logger.log("\n=== WRITING RESULTS ===");
  Logger.log("Total distributions found: " + results.length);
  
  // Write results to summary sheet
  if (results.length > 0) {
    const nextRow = summarySheet.getLastRow() + 1;
    Logger.log("Writing to row " + nextRow + " in Special Distro Status");
    
    // Write the data
    summarySheet.getRange(nextRow, 1, results.length, 4).setValues(results);
    
    // Re-apply text formatting to the newly added rows
    summarySheet.getRange(nextRow, 1, results.length, 1).setNumberFormat("@"); // Date column
    summarySheet.getRange(nextRow, 4, results.length, 1).setNumberFormat("@"); // Agent IDs column
    
    // Auto-resize columns
    summarySheet.autoResizeColumns(1, 4);
    
    Logger.log("✓ Successfully wrote data");
    
    // Show success message
    SpreadsheetApp.getUi().alert(
      'Success!',
      `Extracted ${results.length} distribution(s) to "Special Distro Status" sheet.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    Logger.log("⚠ No data found to write");
    SpreadsheetApp.getUi().alert(
      'No Data Found',
      'Could not find any distribution blocks in the current sheet.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
  
  Logger.log("\n=== EXTRACTION COMPLETE ===");
}

// Optional: Create a custom menu to run the script
// function onOpen() {
//   const ui = SpreadsheetApp.getUi();
//   ui.createMenu('Distribution Tools')
//     .addItem('Extract Summary', 'extractDistributionSummary')
//     .addToUi();
// }