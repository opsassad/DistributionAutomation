/**
 * Lead Distribution Automation Script
 *
 * This script reads distribution configuration from a Google Sheet,
 * fetches filter IDs from the CRM API, and distributes leads to agents.
 *
 * Setup:
 * 1. Copy this script to your Google Sheet (Extensions > Apps Script)
 * 2. Configure the settings below
 * 3. Run 'runDistribution' function or set up a trigger
 */

// ============================================================================
// CONFIGURATION - Modify these values as needed
// ============================================================================

const CONFIG = {
  // API Configuration
  API_BASE_URL: 'https://crm-api.shikho.com/api/v1',
  AUTH_TOKEN: 'YOUR_BEARER_TOKEN_HERE', // Replace with your actual token

  // Sheet Configuration
  SHEET_NAME: 'Distribution Summary',  // Name of the tab containing distribution data

  // Column Configuration (1-indexed)
  COLUMNS: {
    DATE: 1,              // Column A - Date (ignored)
    FILTER_NAME: 2,       // Column B - Distribution Name / Filter Name
    LEAD_PER_OWNER: 3,    // Column C - Per Agent
    AGENT_IDS: 4,         // Column D - Agent IDs (comma-separated)
    STATUS: 5             // Column E - Status (will be added/updated by script)
  },

  // Data Configuration
  DATA_START_ROW: 2,      // First row containing data (skip header)
  SKIP_VALUES: ['Add List First', ''],  // Skip rows with these values in Agent IDs

  // API Configuration
  FILTER_TYPE_ID: 1,      // type_id for filter search
  FILTER_STATUS_ID: 1,    // status_id for filter search
  DISTRIBUTION_TYPE_ID: 1,
  DISTRIBUTION_FIELD_KEY: 'owner_id',

  // Logging
  ENABLE_LOGGING: true,
  LOG_SHEET_NAME: 'Distribution Logs'  // Optional: create a log sheet
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Main function to run the distribution process
 * Run this function manually or via trigger
 */
function runDistribution() {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  if (!sheet) {
    logError('Sheet not found: ' + CONFIG.SHEET_NAME);
    return;
  }

  const data = getSheetData(sheet);
  if (data.length === 0) {
    log('No data found to process');
    return;
  }

  log('Starting distribution process for ' + data.length + ' rows');

  // Collect results for email notification
  const distributionResults = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = CONFIG.DATA_START_ROW + i;
    const agentIdArray = parseAgentIds(row.agentIds);

    // Skip rows with invalid agent IDs
    if (shouldSkipRow(row.agentIds)) {
      log('Row ' + rowNumber + ': Skipped - No valid agent IDs');
      updateStatus(sheet, rowNumber, 'SKIPPED - No agents');

      distributionResults.push(createDistributionResult({
        rowNumber: rowNumber,
        distributionName: row.filterName,
        status: 'SKIPPED',
        reason: 'No valid agent IDs',
        agentCount: 0,
        leadPerOwner: row.leadPerOwner
      }));
      continue;
    }

    // Skip rows with empty filter name
    if (!row.filterName || row.filterName.trim() === '') {
      log('Row ' + rowNumber + ': Skipped - Empty filter name');
      updateStatus(sheet, rowNumber, 'SKIPPED - No filter name');

      distributionResults.push(createDistributionResult({
        rowNumber: rowNumber,
        distributionName: '',
        status: 'SKIPPED',
        reason: 'Empty filter name',
        agentCount: agentIdArray.length,
        leadPerOwner: row.leadPerOwner
      }));
      continue;
    }

    try {
      // Step 1: Fetch filter ID
      log('Row ' + rowNumber + ': Fetching filter ID for "' + row.filterName + '"');
      const filterId = fetchFilterId(row.filterName);

      if (!filterId) {
        logError('Row ' + rowNumber + ': Filter not found: ' + row.filterName);
        updateStatus(sheet, rowNumber, 'ERROR - Filter not found');

        distributionResults.push(createDistributionResult({
          rowNumber: rowNumber,
          distributionName: row.filterName,
          status: 'ERROR',
          reason: 'Filter not found in CRM system',
          agentCount: agentIdArray.length,
          leadPerOwner: row.leadPerOwner
        }));
        continue;
      }

      log('Row ' + rowNumber + ': Found filter ID: ' + filterId);

      // Step 2: Distribute leads
      log('Row ' + rowNumber + ': Distributing to ' + agentIdArray.length + ' agents');

      const result = distributeLeads({
        filterId: filterId,
        filterName: row.filterName,
        agentIds: agentIdArray,
        leadPerOwner: row.leadPerOwner
      });

      if (result.success) {
        log('Row ' + rowNumber + ': Distribution successful');
        updateStatus(sheet, rowNumber, 'SUCCESS - ' + new Date().toLocaleString());

        distributionResults.push(createDistributionResult({
          rowNumber: rowNumber,
          distributionName: row.filterName,
          status: 'SUCCESS',
          reason: '',
          agentCount: agentIdArray.length,
          leadPerOwner: row.leadPerOwner,
          filterId: filterId
        }));
      } else {
        logError('Row ' + rowNumber + ': Distribution failed - ' + result.error);
        updateStatus(sheet, rowNumber, 'ERROR - ' + result.error);

        distributionResults.push(createDistributionResult({
          rowNumber: rowNumber,
          distributionName: row.filterName,
          status: 'ERROR',
          reason: result.error,
          agentCount: agentIdArray.length,
          leadPerOwner: row.leadPerOwner,
          filterId: filterId
        }));
      }

    } catch (error) {
      logError('Row ' + rowNumber + ': Exception - ' + error.message);
      updateStatus(sheet, rowNumber, 'ERROR - ' + error.message);

      distributionResults.push(createDistributionResult({
        rowNumber: rowNumber,
        distributionName: row.filterName,
        status: 'ERROR',
        reason: error.message,
        agentCount: agentIdArray.length,
        leadPerOwner: row.leadPerOwner
      }));
    }

    // Small delay to avoid rate limiting
    Utilities.sleep(500);
  }

  // Create summary and send email notification
  const summary = createDistributionSummary(distributionResults);
  const summaryText = 'Distribution complete. Success: ' + summary.successCount +
                      ', Errors: ' + summary.errorCount + ', Skipped: ' + summary.skippedCount;
  log(summaryText);

  // Send email notification
  sendDistributionEmail(summary, distributionResults);

  // Show alert to user
  SpreadsheetApp.getUi().alert('Distribution Complete', summaryText, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Test function to verify API connection
 */
function testApiConnection() {
  try {
    const response = fetchFilters();
    if (response && response.data) {
      SpreadsheetApp.getUi().alert('API Connection',
        'Connection successful! Found ' + response.data.length + ' filters.',
        SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert('API Connection',
        'Connection failed. Check your token and API URL.',
        SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('API Connection Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Creates a custom menu when the spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Distribution Tools')
    .addItem('Run Distribution', 'runDistribution')
    .addItem('Test API Connection', 'testApiConnection')
    .addSeparator()
    .addItem('Test Email Notification', 'testEmailNotification')
    .addSeparator()
    .addItem('Clear Status Column', 'clearStatusColumn')
    .addToUi();
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches all filters from the API
 */
function fetchFilters() {
  const url = CONFIG.API_BASE_URL + '/filters?' +
    'cols=' + encodeURIComponent('id;name;type_id;items') +
    '&search=' + encodeURIComponent('type_id:' + CONFIG.FILTER_TYPE_ID + ';status_id:' + CONFIG.FILTER_STATUS_ID) +
    '&conditions=' + encodeURIComponent('type_id:=;status_id:=') +
    '&join=and&page=all&orderBy=name&sortedBy=asc';

  const options = {
    method: 'GET',
    headers: getHeaders(),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error('Filter API returned status ' + responseCode);
  }

  return JSON.parse(response.getContentText());
}

/**
 * Fetches filter ID by filter name
 * @param {string} filterName - The name of the filter to search for
 * @returns {number|null} - The filter ID or null if not found
 */
function fetchFilterId(filterName) {
  const response = fetchFilters();

  if (!response || !response.data) {
    return null;
  }

  // Find exact match first
  const exactMatch = response.data.find(filter => filter.name === filterName);
  if (exactMatch) {
    return exactMatch.id;
  }

  // If no exact match, try case-insensitive match
  const caseInsensitiveMatch = response.data.find(
    filter => filter.name.toLowerCase() === filterName.toLowerCase()
  );
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch.id;
  }

  // If still no match, try partial match (filter name contains search term)
  const partialMatch = response.data.find(
    filter => filter.name.toLowerCase().includes(filterName.toLowerCase())
  );
  if (partialMatch) {
    log('Warning: Using partial match for "' + filterName + '" -> "' + partialMatch.name + '"');
    return partialMatch.id;
  }

  return null;
}

/**
 * Distributes leads to agents
 * @param {Object} params - Distribution parameters
 * @returns {Object} - Result with success status and error message if any
 */
function distributeLeads(params) {
  const url = CONFIG.API_BASE_URL + '/leads/bulk-distributes';

  const payload = {
    data: [{
      type_id: CONFIG.DISTRIBUTION_TYPE_ID,
      field_key: CONFIG.DISTRIBUTION_FIELD_KEY,
      agentIds: params.agentIds,
      lead_per_owner: params.leadPerOwner,
      filter_id: params.filterId,
      name: params.filterName
    }]
  };

  const options = {
    method: 'PUT',
    headers: getHeaders(),
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      return { success: true, response: JSON.parse(responseText) };
    } else {
      let errorMsg = 'HTTP ' + responseCode;
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {
        // Use default error message
      }
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets the headers for API requests
 */
function getHeaders() {
  return {
    'accept': 'application/json',
    'authorization': 'Bearer ' + CONFIG.AUTH_TOKEN,
    'content-type': 'application/json',
    'x-log-ref-id': 'google-apps-script-' + new Date().getTime()
  };
}

// ============================================================================
// SHEET HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the specified sheet
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName);
}

/**
 * Gets distribution data from the sheet
 */
function getSheetData(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) {
    return [];
  }

  const numRows = lastRow - CONFIG.DATA_START_ROW + 1;
  const range = sheet.getRange(CONFIG.DATA_START_ROW, 1, numRows, 4);
  const values = range.getValues();

  return values.map(row => ({
    date: row[CONFIG.COLUMNS.DATE - 1],
    filterName: String(row[CONFIG.COLUMNS.FILTER_NAME - 1]).trim(),
    leadPerOwner: parseInt(row[CONFIG.COLUMNS.LEAD_PER_OWNER - 1]) || 1,
    agentIds: String(row[CONFIG.COLUMNS.AGENT_IDS - 1]).trim()
  }));
}

/**
 * Parses comma-separated agent IDs into an array of strings
 */
function parseAgentIds(agentIdsString) {
  if (!agentIdsString || typeof agentIdsString !== 'string') {
    return [];
  }

  return agentIdsString
    .split(',')
    .map(id => id.trim())
    .filter(id => id !== '' && !isNaN(id));
}

/**
 * Checks if a row should be skipped based on agent IDs value
 */
function shouldSkipRow(agentIds) {
  if (!agentIds) return true;

  const trimmedValue = String(agentIds).trim();

  for (const skipValue of CONFIG.SKIP_VALUES) {
    if (trimmedValue === skipValue || trimmedValue.toLowerCase() === skipValue.toLowerCase()) {
      return true;
    }
  }

  // Also skip if no valid numeric IDs
  const parsedIds = parseAgentIds(trimmedValue);
  return parsedIds.length === 0;
}

/**
 * Updates the status column for a specific row
 */
function updateStatus(sheet, rowNumber, status) {
  sheet.getRange(rowNumber, CONFIG.COLUMNS.STATUS).setValue(status);
}

/**
 * Clears all status values
 */
function clearStatusColumn() {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow >= CONFIG.DATA_START_ROW) {
    const range = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLUMNS.STATUS, lastRow - CONFIG.DATA_START_ROW + 1, 1);
    range.clearContent();
  }

  SpreadsheetApp.getUi().alert('Status column cleared');
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Logs a message
 */
function log(message) {
  if (CONFIG.ENABLE_LOGGING) {
    console.log('[' + new Date().toISOString() + '] ' + message);
    appendToLogSheet('INFO', message);
  }
}

/**
 * Logs an error message
 */
function logError(message) {
  console.error('[' + new Date().toISOString() + '] ERROR: ' + message);
  appendToLogSheet('ERROR', message);
}

/**
 * Appends a log entry to the log sheet (optional)
 */
function appendToLogSheet(level, message) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = spreadsheet.getSheetByName(CONFIG.LOG_SHEET_NAME);

    if (!logSheet) {
      // Create log sheet if it doesn't exist
      logSheet = spreadsheet.insertSheet(CONFIG.LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Level', 'Message']);
      logSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    }

    logSheet.appendRow([new Date(), level, message]);

    // Keep only last 1000 rows to prevent sheet from getting too large
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001);
    }
  } catch (e) {
    // Silently fail if log sheet operations fail
    console.error('Failed to write to log sheet: ' + e.message);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Runs distribution for a single row (useful for testing)
 * @param {number} rowNumber - The row number to process
 */
function runSingleRow(rowNumber) {
  const sheet = getSheet(CONFIG.SHEET_NAME);
  if (!sheet) {
    logError('Sheet not found: ' + CONFIG.SHEET_NAME);
    return;
  }

  const row = sheet.getRange(rowNumber, 1, 1, 4).getValues()[0];
  const data = {
    filterName: String(row[CONFIG.COLUMNS.FILTER_NAME - 1]).trim(),
    leadPerOwner: parseInt(row[CONFIG.COLUMNS.LEAD_PER_OWNER - 1]) || 1,
    agentIds: String(row[CONFIG.COLUMNS.AGENT_IDS - 1]).trim()
  };

  if (shouldSkipRow(data.agentIds)) {
    log('Row ' + rowNumber + ': Skipped - No valid agent IDs');
    return;
  }

  try {
    const filterId = fetchFilterId(data.filterName);
    if (!filterId) {
      logError('Filter not found: ' + data.filterName);
      return;
    }

    const result = distributeLeads({
      filterId: filterId,
      filterName: data.filterName,
      agentIds: parseAgentIds(data.agentIds),
      leadPerOwner: data.leadPerOwner
    });

    if (result.success) {
      log('Distribution successful for row ' + rowNumber);
      updateStatus(sheet, rowNumber, 'SUCCESS - ' + new Date().toLocaleString());
    } else {
      logError('Distribution failed: ' + result.error);
      updateStatus(sheet, rowNumber, 'ERROR - ' + result.error);
    }
  } catch (error) {
    logError('Exception: ' + error.message);
    updateStatus(sheet, rowNumber, 'ERROR - ' + error.message);
  }
}

/**
 * Gets a list of all available filters (useful for debugging)
 */
function listAllFilters() {
  const response = fetchFilters();
  if (response && response.data) {
    const filterList = response.data.map(f => f.id + ': ' + f.name).join('\n');
    console.log('Available filters:\n' + filterList);
    return response.data;
  }
  return [];
}
