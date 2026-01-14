/**
 * Regular Lead Distribution Automation Script
 *
 * Single trigger function: scheduledRegularDistribute
 * Extracts from "Distribution" sheet → Distributes via Group IDs → Updates status
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const REGULAR_CONFIG = {
  // API
  API_BASE_URL: 'https://crm-api.shikho.com/api/v1',
  AUTH_TOKEN: 'YOUR_BEARER_TOKEN_HERE',

  // Sheets
  SOURCE_SHEET: 'Distribution',
  OUTPUT_SHEET: 'Bulk Distro Status',

  // Distribution Settings
  DATA_START_ROW: 2,
  DISTRIBUTION_TYPE_ID: 1,
  DISTRIBUTION_FIELD_KEY: 'owner_id'
};

// ============================================================================
// MAIN TRIGGER FUNCTION
// ============================================================================

/**
 * SCHEDULED TRIGGER: Extract & Distribute Regular Leads
 *
 * 1. Clears "Bulk Distro Status" sheet
 * 2. Extracts today's distribution data from "Distribution" sheet
 * 3. Fetches group IDs and filter IDs
 * 4. Runs distribution via API
 * 5. Updates status column
 */
function scheduledRegularDistribute() {
  logRegular('=== Starting Scheduled Regular Distribution ===');

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Step 1: Extract today's data (this clears and populates Bulk Distro Status)
  const extractCount = extractBulkDistribution();
  if (extractCount === 0) {
    logRegular('No distributions found for today');
    return;
  }
  logRegular('Extracted ' + extractCount + ' distributions');

  Utilities.sleep(1000);

  // Step 2: Run distribution
  logRegular('Running distribution...');
  const results = runRegularDistribution(ss);

  // Summary
  const summary = {
    totalProcessed: results.length,
    successCount: results.filter(r => r.status === 'SUCCESS').length,
    errorCount: results.filter(r => r.status === 'ERROR').length,
    skippedCount: results.filter(r => r.status === 'SKIPPED').length,
    distroType: 'regular'  // Used for email subject customization
  };

  logRegular('Done. Success: ' + summary.successCount + ', Errors: ' + summary.errorCount + ', Skipped: ' + summary.skippedCount);

  // Send email report (uses EmailNotification.js)
  if (typeof sendDistributionEmail === 'function') {
    sendDistributionEmail(summary, results);
  }
}

// ============================================================================
// EXTRACTION FUNCTION
// ============================================================================

/**
 * Extracts today's distribution data from "Distribution" sheet
 * (Named uniquely to avoid conflict with ExtractRegularLeads.gs)
 * @returns {number} Number of rows extracted
 */
function extractBulkDistribution() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(REGULAR_CONFIG.SOURCE_SHEET);

  if (!sourceSheet) {
    logRegular('Source sheet not found: ' + REGULAR_CONFIG.SOURCE_SHEET);
    return 0;
  }

  // Get or create output sheet
  let outputSheet = ss.getSheetByName(REGULAR_CONFIG.OUTPUT_SHEET);
  if (outputSheet) {
    outputSheet.clear();
  } else {
    outputSheet = ss.insertSheet(REGULAR_CONFIG.OUTPUT_SHEET);
  }

  // Set up output headers
  outputSheet.getRange(1, 1, 1, 5).setValues([['Date', 'User Group', 'Distribution List/Distribution Name', 'Per Agent', 'Status']]);
  outputSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
  outputSheet.setFrozenRows(1);

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
    const cellValue = data[2][col];
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

  logRegular('Found today columns: ' + todayColumns.join(', '));

  // Process each today's block
  for (const startCol of todayColumns) {
    let endCol = startCol;
    for (let col = startCol + 1; col < maxCols; col++) {
      if (data[2][col]) break;
      endCol = col;
    }

    logRegular('Processing block from column ' + startCol + ' to ' + endCol);

    // Search for all tables in this block
    for (let row = 3; row < maxRows; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellValue = data[row][col];
        if (cellValue && cellValue.toString().includes('Distribution List/Distribution Name')) {
          logRegular('Found table header at row ' + (row + 1) + ', col ' + (col + 1));

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

          // Find "User Group" by searching upward
          let userGroup = '';
          for (let searchRow = headerRow - 1; searchRow >= 0; searchRow--) {
            for (let c = startCol; c <= endCol; c++) {
              if (data[searchRow][c] && data[searchRow][c].toString().trim() === 'User Group') {
                if (c + 1 <= endCol && data[searchRow][c + 1]) {
                  userGroup = data[searchRow][c + 1];
                  break;
                }
                if (searchRow + 1 < maxRows && data[searchRow + 1][c]) {
                  userGroup = data[searchRow + 1][c];
                  break;
                }
              }
            }
            if (userGroup) break;
            if (headerRow - searchRow > 10) break;
          }

          logRegular('User Group: ' + userGroup + ', Per Agent column: ' + (perAgentColIdx + 1));

          // Extract data rows
          for (let dataRow = headerRow + 1; dataRow < maxRows; dataRow++) {
            const distValue = data[dataRow][distColIdx];

            if (!distValue || distValue.toString().trim() === '' || distValue.toString().includes('Total')) {
              break;
            }

            const perAgentValue = perAgentColIdx >= 0 ? data[dataRow][perAgentColIdx] : '';

            outputData.push([
              todayStr,
              userGroup.toString(),
              distValue.toString(),
              perAgentValue,
              '' // Status column - will be updated after distribution
            ]);
          }
        }
      }
    }
  }

  // Write output data
  if (outputData.length > 0) {
    outputSheet.getRange(2, 1, outputData.length, 5).setValues(outputData);
    outputSheet.autoResizeColumns(1, 5);
    logRegular('Extracted ' + outputData.length + ' rows');
  }

  return outputData.length;
}

// ============================================================================
// DISTRIBUTION FUNCTION
// ============================================================================

/**
 * Runs distribution for all rows in Bulk Distro Status sheet
 */
function runRegularDistribution(ss) {
  const sheet = ss.getSheetByName(REGULAR_CONFIG.OUTPUT_SHEET);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < REGULAR_CONFIG.DATA_START_ROW) return [];

  // Fetch all groups once
  const allGroups = fetchAllGroups();
  if (!allGroups || allGroups.length === 0) {
    logRegular('ERROR: Could not fetch groups from API');
    return [];
  }
  logRegular('Fetched ' + allGroups.length + ' groups from API');

  const data = sheet.getRange(REGULAR_CONFIG.DATA_START_ROW, 1, lastRow - REGULAR_CONFIG.DATA_START_ROW + 1, 4).getValues();
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = REGULAR_CONFIG.DATA_START_ROW + i;
    const userGroupStr = String(row[1]).trim();
    const filterName = String(row[2]).trim();
    const leadPerOwner = parseInt(row[3]) || 1;

    // Skip empty rows
    if (!filterName || !userGroupStr) {
      const reason = !filterName ? 'Empty filter name' : 'Empty user group';
      sheet.getRange(rowNum, 5).setValue('SKIPPED - ' + reason);
      results.push({
        distributionName: filterName || 'Empty',
        status: 'SKIPPED',
        reason: reason,
        agentGroup: userGroupStr || '',
        leadPerOwner: leadPerOwner,
        rowNumber: rowNum
      });
      continue;
    }

    // Parse group names (comma-separated)
    const groupNames = userGroupStr.split(',').map(s => s.trim()).filter(s => s);

    // Match group names to IDs
    const groupIds = matchGroupIds(groupNames, allGroups);
    if (groupIds.length === 0) {
      sheet.getRange(rowNum, 5).setValue('ERROR - Groups not found: ' + userGroupStr);
      results.push({
        distributionName: filterName,
        status: 'ERROR',
        reason: 'Groups not found: ' + userGroupStr,
        agentGroup: userGroupStr,
        leadPerOwner: leadPerOwner,
        rowNumber: rowNum
      });
      continue;
    }

    // Fetch filter ID
    const filterId = fetchRegularFilterId(filterName);
    if (!filterId) {
      sheet.getRange(rowNum, 5).setValue('ERROR - Filter not found');
      results.push({
        distributionName: filterName,
        status: 'ERROR',
        reason: 'Filter not found in CRM',
        agentGroup: userGroupStr,
        leadPerOwner: leadPerOwner,
        rowNumber: rowNum
      });
      continue;
    }

    // Distribute
    const result = distributeByGroup(filterId, filterName, groupIds, leadPerOwner);
    if (result.success) {
      sheet.getRange(rowNum, 5).setValue('SUCCESS - ' + new Date().toLocaleString());
      results.push({
        distributionName: filterName,
        status: 'SUCCESS',
        reason: '',
        agentGroup: userGroupStr,
        leadPerOwner: leadPerOwner,
        rowNumber: rowNum
      });
    } else {
      sheet.getRange(rowNum, 5).setValue('ERROR - ' + result.error);
      results.push({
        distributionName: filterName,
        status: 'ERROR',
        reason: result.error,
        agentGroup: userGroupStr,
        leadPerOwner: leadPerOwner,
        rowNumber: rowNum
      });
    }

    Utilities.sleep(500);
  }

  return results;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches all groups from CRM API
 */
function fetchAllGroups() {
  const url = REGULAR_CONFIG.API_BASE_URL + '/groups?join=or&page=1&orderBy=id&sortedBy=desc&limit=200';

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: getRegularHeaders(),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      logRegular('ERROR fetching groups: HTTP ' + response.getResponseCode());
      return [];
    }

    const json = JSON.parse(response.getContentText());
    return json.data || [];
  } catch (e) {
    logRegular('ERROR fetching groups: ' + e.message);
    return [];
  }
}

/**
 * Matches group names to group IDs
 * @param {Array} groupNames - Array of group names to match
 * @param {Array} allGroups - Array of all groups from API
 * @returns {Array} Array of matched group IDs
 */
function matchGroupIds(groupNames, allGroups) {
  const ids = [];

  for (const name of groupNames) {
    const match = allGroups.find(g => g.name === name) ||
                  allGroups.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (match) {
      ids.push(match.id);
    } else {
      logRegular('WARNING: Group not found: ' + name);
    }
  }

  return ids;
}

/**
 * Fetches filter ID by name
 */
function fetchRegularFilterId(filterName) {
  const url = REGULAR_CONFIG.API_BASE_URL + '/filters?' +
    'cols=' + encodeURIComponent('id;name;type_id;items') +
    '&search=' + encodeURIComponent('type_id:1;status_id:1') +
    '&conditions=' + encodeURIComponent('type_id:=;status_id:=') +
    '&join=and&page=all&orderBy=name&sortedBy=asc';

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: getRegularHeaders(),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) return null;

    const data = JSON.parse(response.getContentText()).data || [];
    const match = data.find(f => f.name === filterName) ||
                  data.find(f => f.name.toLowerCase() === filterName.toLowerCase());
    return match ? match.id : null;
  } catch (e) {
    logRegular('ERROR fetching filter: ' + e.message);
    return null;
  }
}

/**
 * Fetches filter details including items array
 */
function fetchFilterItems(filterId) {
  const url = REGULAR_CONFIG.API_BASE_URL + '/filters/' + filterId;

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: getRegularHeaders(),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      logRegular('ERROR fetching filter items: HTTP ' + response.getResponseCode());
      return null;
    }

    const json = JSON.parse(response.getContentText());
    return json.data ? json.data.items : (json.items || null);
  } catch (e) {
    logRegular('ERROR fetching filter items: ' + e.message);
    return null;
  }
}

/**
 * Builds query string from filter items
 * @param {Array} items - Filter items array
 * @returns {string} Query string like "search=...&conditions=...&join=AND"
 */
function buildQueryString(items) {
  if (!items || items.length === 0) return '';

  const searchParts = [];
  const conditionParts = [];

  for (const item of items) {
    const field = item.field;
    const value = Array.isArray(item.value) ? item.value.join(',') : item.value;
    const condition = item.condition;

    searchParts.push(field + ':' + value);
    conditionParts.push(field + ':' + condition);
  }

  const search = encodeURIComponent(searchParts.join(';'));
  const conditions = encodeURIComponent(conditionParts.join(';'));

  return 'search=' + search + '&conditions=' + conditions + '&join=AND';
}

/**
 * Distributes leads to groups (using OLD bulk-updates API)
 */
function distributeByGroup(filterId, filterName, groupIds, leadPerOwner) {
  // Step 1: Fetch filter items
  const items = fetchFilterItems(filterId);
  if (!items || items.length === 0) {
    return { success: false, error: 'Could not fetch filter items' };
  }
  logRegular('Fetched ' + items.length + ' filter items for filter ID: ' + filterId);

  // Step 2: Build query string from items
  const queryString = buildQueryString(items);
  if (!queryString) {
    return { success: false, error: 'Could not build query string from items' };
  }

  // Step 3: Call OLD API
  const url = REGULAR_CONFIG.API_BASE_URL + '/leads/bulk-updates?' + queryString;
  const payload = {
    groupIds: groupIds,
    leads_per_campaign: null,
    lead_per_owner: leadPerOwner,
    field_key: REGULAR_CONFIG.DISTRIBUTION_FIELD_KEY,
    name: filterName,
    filter_id: filterId,
    type_id: REGULAR_CONFIG.DISTRIBUTION_TYPE_ID,
    items: items
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: getRegularHeaders(),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return { success: true };
    }

    let error = 'HTTP ' + code;
    try {
      error = JSON.parse(response.getContentText()).message || error;
    } catch (e) {}
    return { success: false, error: error };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Returns API headers
 */
function getRegularHeaders() {
  return {
    'accept': 'application/json',
    'authorization': 'Bearer ' + REGULAR_CONFIG.AUTH_TOKEN,
    'content-type': 'application/json',
    'x-log-ref-id': 'gform-web-002-0000000000001'
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function logRegular(msg) {
  console.log('[REGULAR] [' + new Date().toISOString() + '] ' + msg);
}

// ============================================================================
// MANUAL TRIGGER (for testing)
// ============================================================================

/**
 * Manual trigger to test extraction only (run from menu/button only)
 */
function manualExtractRegular() {
  const count = extractBulkDistribution();
  SpreadsheetApp.getUi().alert('Extraction Complete', 'Extracted ' + count + ' distributions to "Bulk Distro Status" sheet.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Manual trigger to run full distribution
 */
function manualRegularDistribute() {
  scheduledRegularDistribute();
  SpreadsheetApp.getUi().alert('Distribution Complete', 'Regular lead distribution has been executed. Check the Status column for results.', SpreadsheetApp.getUi().ButtonSet.OK);
}
