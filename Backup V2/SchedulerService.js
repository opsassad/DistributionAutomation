/**
 * Scheduler Service
 *
 * Centralized trigger management for all distribution scripts.
 * Handles self-renewing exact-time triggers for both Regular and Special distributions.
 */

// ============================================================================
// SCHEDULE CONFIGURATION
// ============================================================================

const SCHEDULER_CONFIG = {
  // Regular Distribution (Group-based)
  REGULAR: {
    HOUR: 10,
    MINUTE: 0,
    FUNCTION_NAME: 'runRegularDistribution_Scheduled'
  },

  // Special Distribution (Agent-based)
  SPECIAL: {
    HOUR: 11,
    MINUTE: 0,
    FUNCTION_NAME: 'runSpecialDistribution_Scheduled'
  }
};

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

/**
 * REGULAR DISTRIBUTION - Called by exact-time trigger
 */
function runRegularDistribution_Scheduled() {
  const config = SCHEDULER_CONFIG.REGULAR;

  try {
    logScheduler('=== Starting Regular Distribution ===');

    // Run actual distribution (from AutoDistroRegular.js)
    if (typeof scheduledRegularDistribute === 'function') {
      scheduledRegularDistribute();
    } else {
      logScheduler('ERROR: scheduledRegularDistribute function not found');
    }

    logScheduler('Regular distribution completed');
  } catch (e) {
    logScheduler('ERROR in Regular distribution: ' + e.message);
  } finally {
    // ALWAYS renew trigger for tomorrow
    renewTrigger(config.FUNCTION_NAME, config.HOUR, config.MINUTE);
  }
}

/**
 * SPECIAL DISTRIBUTION - Called by exact-time trigger
 */
function runSpecialDistribution_Scheduled() {
  const config = SCHEDULER_CONFIG.SPECIAL;

  try {
    logScheduler('=== Starting Special Distribution ===');

    // Run actual distribution (from AutoDistroSpecial.js)
    if (typeof scheduledExtractAndDistribute === 'function') {
      scheduledExtractAndDistribute();
    } else {
      logScheduler('ERROR: scheduledExtractAndDistribute function not found');
    }

    logScheduler('Special distribution completed');
  } catch (e) {
    logScheduler('ERROR in Special distribution: ' + e.message);
  } finally {
    // ALWAYS renew trigger for tomorrow
    renewTrigger(config.FUNCTION_NAME, config.HOUR, config.MINUTE);
  }
}

// ============================================================================
// TRIGGER MANAGEMENT
// ============================================================================

/**
 * Creates/renews an exact-time trigger for tomorrow
 */
function renewTrigger(functionName, hour, minute) {
  try {
    // Delete existing triggers for this function
    ScriptApp.getProjectTriggers().forEach(trigger => {
      if (trigger.getHandlerFunction() === functionName) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Create trigger for tomorrow at exact time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, minute, 0, 0);

    ScriptApp.newTrigger(functionName)
      .timeBased()
      .at(tomorrow)
      .create();

    logScheduler('Trigger renewed: ' + functionName + ' for ' + tomorrow.toLocaleString());
  } catch (e) {
    logScheduler('ERROR renewing trigger: ' + e.message);
  }
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize Regular Distribution schedule
 */
function initializeRegularSchedule() {
  const config = SCHEDULER_CONFIG.REGULAR;
  renewTrigger(config.FUNCTION_NAME, config.HOUR, config.MINUTE);

  const timeStr = config.HOUR + ':' + String(config.MINUTE).padStart(2, '0');
  SpreadsheetApp.getUi().alert(
    'Regular Schedule Initialized',
    'Trigger set for ' + timeStr + ' AM tomorrow.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Initialize Special Distribution schedule
 */
function initializeSpecialSchedule() {
  const config = SCHEDULER_CONFIG.SPECIAL;
  renewTrigger(config.FUNCTION_NAME, config.HOUR, config.MINUTE);

  const timeStr = config.HOUR + ':' + String(config.MINUTE).padStart(2, '0');
  SpreadsheetApp.getUi().alert(
    'Special Schedule Initialized',
    'Trigger set for ' + timeStr + ' AM tomorrow.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Initialize BOTH schedules at once
 */
function initializeAllSchedules() {
  const regularConfig = SCHEDULER_CONFIG.REGULAR;
  const specialConfig = SCHEDULER_CONFIG.SPECIAL;

  renewTrigger(regularConfig.FUNCTION_NAME, regularConfig.HOUR, regularConfig.MINUTE);
  renewTrigger(specialConfig.FUNCTION_NAME, specialConfig.HOUR, specialConfig.MINUTE);

  SpreadsheetApp.getUi().alert(
    'All Schedules Initialized',
    'Triggers set for tomorrow:\n\n' +
    '• Regular Distribution: ' + regularConfig.HOUR + ':' + String(regularConfig.MINUTE).padStart(2, '0') + ' AM\n' +
    '• Special Distribution: ' + specialConfig.HOUR + ':' + String(specialConfig.MINUTE).padStart(2, '0') + ' AM',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * View all current triggers
 */
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let info = 'Current Triggers (' + triggers.length + '):\n\n';

  triggers.forEach((trigger, i) => {
    info += (i + 1) + '. ' + trigger.getHandlerFunction() + '\n';
  });

  if (triggers.length === 0) {
    info = 'No triggers found.';
  }

  SpreadsheetApp.getUi().alert('Trigger List', info, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Delete ALL triggers (cleanup)
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  SpreadsheetApp.getUi().alert('Deleted all ' + triggers.length + ' triggers.');
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test: Create a trigger for 2 minutes from now
 */
function testTriggerIn2Minutes() {
  const testTime = new Date();
  testTime.setMinutes(testTime.getMinutes() + 2);

  // Delete existing test triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'testTriggerFired') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('testTriggerFired')
    .timeBased()
    .at(testTime)
    .create();

  SpreadsheetApp.getUi().alert(
    'Test Trigger Created',
    'Trigger will fire at: ' + testTime.toLocaleString() + '\n\nCheck Executions log in ~2 minutes.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Test: Called by test trigger
 */
function testTriggerFired() {
  logScheduler('TEST: Trigger fired at ' + new Date().toLocaleString());

  // Renew for another 2 minutes
  const nextTime = new Date();
  nextTime.setMinutes(nextTime.getMinutes() + 2);

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'testTriggerFired') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('testTriggerFired')
    .timeBased()
    .at(nextTime)
    .create();

  logScheduler('TEST: Next trigger set for ' + nextTime.toLocaleString());
}

/**
 * Test: Cleanup test triggers
 */
function cleanupTestTriggers() {
  let count = 0;
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'testTriggerFired') {
      ScriptApp.deleteTrigger(trigger);
      count++;
    }
  });
  SpreadsheetApp.getUi().alert('Cleaned up ' + count + ' test triggers.');
}

// ============================================================================
// LOGGING
// ============================================================================

function logScheduler(msg) {
  console.log('[SCHEDULER] [' + new Date().toISOString() + '] ' + msg);
}
