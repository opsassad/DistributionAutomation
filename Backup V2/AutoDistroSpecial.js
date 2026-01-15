/**
 * Lead Distribution Automation Script
 *
 * Single trigger function: scheduledExtractAndDistribute
 * Extracts from today's sheet → Distributes → Sends email report
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // API
  API_BASE_URL: 'https://crm-api.shikho.com/api/v1',
  AUTH_TOKEN: 'YOUR_BEARER_TOKEN_HERE',

  // Sheets
  SUMMARY_SHEET: 'Special Distro Status',
  SOURCE_SHEET_PREFIX: 'Special Leads - ',  // e.g., "Special Leads - 12-Jan-2026"

  // Distribution Settings
  DATA_START_ROW: 2,
  FILTER_TYPE_ID: 1,
  FILTER_STATUS_ID: 1,
  DISTRIBUTION_TYPE_ID: 1,
  DISTRIBUTION_FIELD_KEY: 'owner_id',
  SKIP_VALUES: ['Add List First', '']
};

// ============================================================================
// MAIN TRIGGER FUNCTION
// ============================================================================

/**
 * SCHEDULED TRIGGER: Extract & Distribute
 *
 * 1. Clears Special Distro Status
 * 2. Finds today's sheet (e.g., "Special Leads - 12-Jan-2026")
 * 3. Extracts distribution data
 * 4. Runs distribution via API
 * 5. Sends email report
 */
function scheduledExtractAndDistribute() {
  log('=== Starting Scheduled Extract & Distribute ===');

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clear summary sheet
  clearSummarySheet(ss);

  // Find today's sheet
  const todaySheetName = getTodaySheetName();
  log('Looking for: ' + todaySheetName);

  const sourceSheet = ss.getSheetByName(todaySheetName);
  if (!sourceSheet) {
    log('No sheet for today: ' + todaySheetName);
    sendNoPlanEmail(todaySheetName);
    return;
  }

  // Extract
  log('Extracting from: ' + todaySheetName);
  const extractCount = extractToSummary(ss, sourceSheet);
  if (extractCount === 0) {
    log('No distributions found to extract');
    sendErrorEmail('No distributions found in: ' + todaySheetName);
    return;
  }
  log('Extracted ' + extractCount + ' distributions');

  Utilities.sleep(1000);

  // Distribute
  log('Running distribution...');
  const results = runDistribution(ss);

  // Send report
  const summary = {
    totalProcessed: results.length,
    successCount: results.filter(r => r.status === 'SUCCESS').length,
    errorCount: results.filter(r => r.status === 'ERROR').length,
    skippedCount: results.filter(r => r.status === 'SKIPPED').length
  };

  log('Done. Success: ' + summary.successCount + ', Errors: ' + summary.errorCount + ', Skipped: ' + summary.skippedCount);
  sendDistributionEmail(summary, results);
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

function getTodaySheetName() {
  const today = new Date();
  const day = today.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return CONFIG.SOURCE_SHEET_PREFIX + day + '-' + months[today.getMonth()] + '-' + today.getFullYear();
}

function clearSummarySheet(ss) {
  const sheet = ss.getSheetByName(CONFIG.SUMMARY_SHEET);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
    log('Cleared summary sheet');
  }
}

function extractToSummary(ss, sourceSheet) {
  // Get or create summary sheet
  let summarySheet = ss.getSheetByName(CONFIG.SUMMARY_SHEET);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(CONFIG.SUMMARY_SHEET);
    summarySheet.getRange('A1:D1').setValues([['Date', 'Distribution Name', 'Per Agent', 'Agent IDs']]);
    summarySheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
    summarySheet.setFrozenRows(1);
  }
  summarySheet.getRange('A:A').setNumberFormat('@');
  summarySheet.getRange('D:D').setNumberFormat('@');

  // Get date from sheet name
  const sheetName = sourceSheet.getName();
  const dateMatch = sheetName.match(/(\d{1,2})[- ]?(\w{3})[- ]?(\d{4})?/i);
  const dateStr = dateMatch
    ? dateMatch[1] + '-' + dateMatch[2] + '-' + (dateMatch[3] || '2026')
    : new Date().toLocaleDateString();

  // Extract data
  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();
  const allData = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();
  const results = [];

  for (let col = 1; col < lastCol; col += 4) {
    let distributionName = '', perAgent = '', agentIDs = '', found = false;

    for (let row = 0; row < allData.length; row++) {
      if (allData[row][col] && allData[row][col].toString().trim() === 'Distribution Name') {
        found = true;
        if (col + 1 < lastCol && allData[row][col + 1]) {
          distributionName = allData[row][col + 1].toString().trim();
        }

        for (let sr = row + 1; sr < Math.min(row + 50, allData.length); sr++) {
          const label = allData[sr][col] ? allData[sr][col].toString().trim() : '';

          if (label === 'Per Agent' && allData[sr][col + 1]) {
            perAgent = allData[sr][col + 1].toString();
          }
          if (label.includes('Combined ID for CRM') && sr + 1 < allData.length && allData[sr + 1][col]) {
            agentIDs = "'" + allData[sr + 1][col].toString().trim();
            break;
          }
        }
        break;
      }
    }

    if (found && distributionName && perAgent) {
      results.push([dateStr, distributionName, perAgent, agentIDs]);
    }
  }

  if (results.length > 0) {
    const nextRow = summarySheet.getLastRow() + 1;
    summarySheet.getRange(nextRow, 1, results.length, 4).setValues(results);
    summarySheet.autoResizeColumns(1, 4);
  }

  return results.length;
}

function runDistribution(ss) {
  const sheet = ss.getSheetByName(CONFIG.SUMMARY_SHEET);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return [];

  const data = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, 4).getValues();
  const results = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = CONFIG.DATA_START_ROW + i;
    const filterName = String(row[1]).trim();
    const leadPerOwner = parseInt(row[2]) || 1;
    const agentIdsRaw = String(row[3]).trim();
    const agentIds = parseAgentIds(agentIdsRaw);

    // Skip invalid rows
    if (shouldSkip(agentIdsRaw) || !filterName) {
      const reason = !filterName ? 'Empty filter name' : 'No valid agent IDs';
      sheet.getRange(rowNum, 5).setValue('SKIPPED - ' + reason);
      results.push({ distributionName: filterName || 'Empty', status: 'SKIPPED', reason: reason, agentCount: 0, leadPerOwner: leadPerOwner, rowNumber: rowNum });
      continue;
    }

    // Fetch filter ID
    const filterId = fetchFilterId(filterName);
    if (!filterId) {
      sheet.getRange(rowNum, 5).setValue('ERROR - Filter not found');
      results.push({ distributionName: filterName, status: 'ERROR', reason: 'Filter not found in CRM', agentCount: agentIds.length, leadPerOwner: leadPerOwner, rowNumber: rowNum });
      continue;
    }

    // Distribute
    const result = distribute(filterId, filterName, agentIds, leadPerOwner);
    if (result.success) {
      sheet.getRange(rowNum, 5).setValue('SUCCESS - ' + new Date().toLocaleString());
      results.push({ distributionName: filterName, status: 'SUCCESS', reason: '', agentCount: agentIds.length, leadPerOwner: leadPerOwner, rowNumber: rowNum });
    } else {
      sheet.getRange(rowNum, 5).setValue('ERROR - ' + result.error);
      results.push({ distributionName: filterName, status: 'ERROR', reason: result.error, agentCount: agentIds.length, leadPerOwner: leadPerOwner, rowNumber: rowNum });
    }

    Utilities.sleep(500);
  }

  return results;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

function fetchFilterId(filterName) {
  const url = CONFIG.API_BASE_URL + '/filters?' +
    'cols=' + encodeURIComponent('id;name;type_id;items') +
    '&search=' + encodeURIComponent('type_id:' + CONFIG.FILTER_TYPE_ID + ';status_id:' + CONFIG.FILTER_STATUS_ID) +
    '&conditions=' + encodeURIComponent('type_id:=;status_id:=') +
    '&join=and&page=all&orderBy=name&sortedBy=asc';

  const response = UrlFetchApp.fetch(url, { method: 'GET', headers: getHeaders(), muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return null;

  const data = JSON.parse(response.getContentText()).data || [];
  const match = data.find(f => f.name === filterName) ||
    data.find(f => f.name.toLowerCase() === filterName.toLowerCase());
  return match ? match.id : null;
}

function distribute(filterId, filterName, agentIds, leadPerOwner) {
  const url = CONFIG.API_BASE_URL + '/leads/bulk-distributes';
  const payload = {
    data: [{
      type_id: CONFIG.DISTRIBUTION_TYPE_ID,
      field_key: CONFIG.DISTRIBUTION_FIELD_KEY,
      agentIds: agentIds,
      lead_per_owner: leadPerOwner,
      filter_id: filterId,
      name: filterName
    }]
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return { success: true };
    }

    let error = 'HTTP ' + code;
    try { error = JSON.parse(response.getContentText()).message || error; } catch (e) { }
    return { success: false, error: error };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getHeaders() {
  return {
    'accept': 'application/json',
    'authorization': 'Bearer ' + CONFIG.AUTH_TOKEN,
    'content-type': 'application/json',
    'x-log-ref-id': 'gform-web-001-0000000000001'
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function parseAgentIds(str) {
  if (!str) return [];
  return str.replace(/^'/, '').split(',').map(s => s.trim()).filter(s => s && !isNaN(s));
}

function shouldSkip(agentIds) {
  if (!agentIds) return true;
  const val = String(agentIds).trim().toLowerCase();
  return CONFIG.SKIP_VALUES.some(s => val === s.toLowerCase()) || parseAgentIds(agentIds).length === 0;
}

function sendErrorEmail(reason) {
  sendDistributionEmail(
    { totalProcessed: 0, successCount: 0, errorCount: 1, skippedCount: 0 },
    [{ distributionName: 'System', status: 'ERROR', reason: reason, agentCount: 0, leadPerOwner: 0, rowNumber: 0 }]
  );
}

function sendNoPlanEmail(sheetName) {
  sendDistributionEmail(
    { totalProcessed: 0, successCount: 0, errorCount: 0, skippedCount: 0, noPlan: true },
    []
  );
}

function log(msg) { console.log('[' + new Date().toISOString() + '] ' + msg); }
function logError(msg) { console.error('[' + new Date().toISOString() + '] ERROR: ' + msg); }
