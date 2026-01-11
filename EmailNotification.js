/**
 * Email Notification Module for Lead Distribution
 *
 * This module handles email notifications for distribution results.
 * Keep this in a separate file in your Apps Script project.
 */

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

const EMAIL_CONFIG = {
  // Recipients (comma-separated for multiple)
  RECIPIENT_EMAIL: 'md.assaduzzaman@shikho.com',

  // CC recipients (optional, leave empty if not needed)
  CC_EMAILS: 'ishmam@shikho.com',

  // Email subject prefix
  SUBJECT_PREFIX: '[Lead Distribution]',

  // Sender name (shown in email)
  SENDER_NAME: 'Distribution Bot',

  // Enable/disable email notifications
  ENABLED: true,

  // Only send email if there are errors (set to false to always send)
  ONLY_ON_ERRORS: false
};

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Sends distribution summary email
 * @param {Object} summary - Distribution summary object
 * @param {Array} results - Array of distribution results
 */
function sendDistributionEmail(summary, results) {
  if (!EMAIL_CONFIG.ENABLED) {
    console.log('Email notifications disabled');
    return;
  }

  // Skip if only_on_errors is true and there are no errors
  if (EMAIL_CONFIG.ONLY_ON_ERRORS && summary.errorCount === 0) {
    console.log('No errors, skipping email notification');
    return;
  }

  const subject = buildEmailSubject(summary);
  const htmlBody = buildEmailHtml(summary, results);

  const options = {
    htmlBody: htmlBody,
    name: EMAIL_CONFIG.SENDER_NAME
  };

  if (EMAIL_CONFIG.CC_EMAILS && EMAIL_CONFIG.CC_EMAILS.trim() !== '') {
    options.cc = EMAIL_CONFIG.CC_EMAILS;
  }

  try {
    MailApp.sendEmail(EMAIL_CONFIG.RECIPIENT_EMAIL, subject, '', options);
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Failed to send email: ' + error.message);
  }
}

/**
 * Builds the email subject line
 */
function buildEmailSubject(summary) {
  let status;
  if (summary.noPlan) {
    status = '[No Plan]';
  } else if (summary.successCount > 0 && summary.errorCount === 0) {
    status = '[Successful]';
  } else if (summary.errorCount > 0 && summary.successCount === 0) {
    status = '[Failed]';
  } else if (summary.successCount > 0 && summary.errorCount > 0) {
    status = '[Partial]';
  } else {
    status = '[Skipped]';
  }

  const now = new Date();
  const day = now.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  const dateTime = day + '-' + months[now.getMonth()] + '-' + now.getFullYear() + ' ' + hour12 + ':' + minutes + ' ' + ampm;

  return status + ' Special Lead Distro - ' + dateTime;
}


/**
 * Builds the HTML email body
 */
function buildEmailHtml(summary, results) {
  const successResults = results.filter(r => r.status === 'SUCCESS');
  const errorResults = results.filter(r => r.status === 'ERROR');
  const skippedResults = results.filter(r => r.status === 'SKIPPED');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #5050A2; padding: 28px 40px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">
                Special Lead Distro Report
              </h1>
              <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0 0; font-size: 13px;">
                ${formatDate(new Date())}
              </p>
            </td>
          </tr>
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #D94B8A 0%, #F5A623 100%);"></td>
          </tr>

          <!-- Summary Cards -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Total -->
                  <td width="25%" style="padding: 0 5px;">
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #333;">${summary.totalProcessed}</div>
                      <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
                    </div>
                  </td>
                  <!-- Success -->
                  <td width="25%" style="padding: 0 5px;">
                    <div style="background-color: #d4edda; border-radius: 8px; padding: 15px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #155724;">${summary.successCount}</div>
                      <div style="font-size: 12px; color: #155724; text-transform: uppercase; letter-spacing: 0.5px;">Success</div>
                    </div>
                  </td>
                  <!-- Errors -->
                  <td width="25%" style="padding: 0 5px;">
                    <div style="background-color: ${summary.errorCount > 0 ? '#f8d7da' : '#f8f9fa'}; border-radius: 8px; padding: 15px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: ${summary.errorCount > 0 ? '#721c24' : '#333'};">${summary.errorCount}</div>
                      <div style="font-size: 12px; color: ${summary.errorCount > 0 ? '#721c24' : '#666'}; text-transform: uppercase; letter-spacing: 0.5px;">Errors</div>
                    </div>
                  </td>
                  <!-- Skipped -->
                  <td width="25%" style="padding: 0 5px;">
                    <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; color: #856404;">${summary.skippedCount}</div>
                      <div style="font-size: 12px; color: #856404; text-transform: uppercase; letter-spacing: 0.5px;">Skipped</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Error Details Section -->
          ${errorResults.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #dc2626; padding: 12px 20px;">
                  <h3 style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">
                    Failed Distributions (${errorResults.length})
                  </h3>
                </div>
                <div style="padding: 15px 20px;">
                  ${errorResults.map(r => `
                  <div style="padding: 12px 0; border-bottom: 1px solid #fed7d7;">
                    <div style="font-weight: 600; color: #c53030; margin-bottom: 4px;">
                      ${escapeHtml(r.distributionName)}
                    </div>
                    <div style="font-size: 13px; color: #742a2a; background-color: #fff; padding: 8px 12px; border-radius: 4px; margin-top: 6px;">
                      <strong>Reason:</strong> ${escapeHtml(r.reason)}
                    </div>
                    <div style="font-size: 12px; color: #999; margin-top: 6px;">
                      Row ${r.rowNumber} • ${r.agentCount} agents • ${r.leadPerOwner} leads/agent
                    </div>
                  </div>
                  `).join('')}
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Success Details Section -->
          ${successResults.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #16a34a; padding: 12px 20px;">
                  <h3 style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">
                    Successful Distributions (${successResults.length})
                  </h3>
                </div>
                <div style="padding: 15px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                    <tr style="background-color: #c6f6d5;">
                      <td style="padding: 8px 12px; font-weight: 600; color: #276749;">Distribution Name</td>
                      <td style="padding: 8px 12px; font-weight: 600; color: #276749; text-align: center;">Agents</td>
                      <td style="padding: 8px 12px; font-weight: 600; color: #276749; text-align: center;">Per Agent</td>
                    </tr>
                    ${successResults.map((r, i) => `
                    <tr style="background-color: ${i % 2 === 0 ? '#fff' : '#f0fff4'};">
                      <td style="padding: 10px 12px; color: #2f855a;">${escapeHtml(r.distributionName)}</td>
                      <td style="padding: 10px 12px; color: #2f855a; text-align: center;">${r.agentCount}</td>
                      <td style="padding: 10px 12px; color: #2f855a; text-align: center;">${r.leadPerOwner}</td>
                    </tr>
                    `).join('')}
                  </table>
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Skipped Details Section -->
          ${skippedResults.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #d97706; padding: 12px 20px;">
                  <h3 style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">
                    Skipped Distributions (${skippedResults.length})
                  </h3>
                </div>
                <div style="padding: 15px 20px;">
                  ${skippedResults.map(r => `
                  <div style="padding: 8px 0; border-bottom: 1px solid #fcd34d; font-size: 13px;">
                    <span style="color: #92400e; font-weight: 500;">${escapeHtml(r.distributionName || 'Empty')}</span>
                    <span style="color: #b45309;"> - ${escapeHtml(r.reason)}</span>
                  </div>
                  `).join('')}
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">
                This is an automated notification from the Lead Distribution System.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #adb5bd;">
                Generated at ${new Date().toLocaleString()}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Formats a date for display
 */
function formatDate(date) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a distribution result object
 * @param {Object} params - Result parameters
 * @returns {Object} - Formatted result object
 */
function createDistributionResult(params) {
  return {
    rowNumber: params.rowNumber,
    distributionName: params.distributionName || '',
    status: params.status, // 'SUCCESS', 'ERROR', 'SKIPPED'
    reason: params.reason || '',
    agentCount: params.agentCount || 0,
    leadPerOwner: params.leadPerOwner || 0,
    filterId: params.filterId || null,
    timestamp: new Date()
  };
}

/**
 * Creates a summary object from results
 * @param {Array} results - Array of distribution results
 * @returns {Object} - Summary object
 */
function createDistributionSummary(results) {
  return {
    totalProcessed: results.length,
    successCount: results.filter(r => r.status === 'SUCCESS').length,
    errorCount: results.filter(r => r.status === 'ERROR').length,
    skippedCount: results.filter(r => r.status === 'SKIPPED').length,
    timestamp: new Date()
  };
}

/**
 * Test function to preview email (sends to configured email)
 */
function testEmailNotification() {
  const mockResults = [
    createDistributionResult({
      rowNumber: 2,
      distributionName: 'PAID - C10 SCI 2025 - Pitch C10 LGPA5',
      status: 'SUCCESS',
      agentCount: 15,
      leadPerOwner: 3,
      filterId: 3168
    }),
    createDistributionResult({
      rowNumber: 3,
      distributionName: 'PAID - C11 SCI 2025 - Pitch C12 LGPA5',
      status: 'SUCCESS',
      agentCount: 20,
      leadPerOwner: 3,
      filterId: 3169
    }),
    createDistributionResult({
      rowNumber: 4,
      distributionName: 'Test Filter Not Found',
      status: 'ERROR',
      reason: 'Filter not found in CRM system',
      agentCount: 10,
      leadPerOwner: 2
    }),
    createDistributionResult({
      rowNumber: 5,
      distributionName: 'EduTab - Interested',
      status: 'SKIPPED',
      reason: 'No valid agent IDs (Add List First)',
      agentCount: 0,
      leadPerOwner: 2
    }),
    createDistributionResult({
      rowNumber: 6,
      distributionName: 'API Error Test',
      status: 'ERROR',
      reason: 'HTTP 401 - Unauthorized: Token expired',
      agentCount: 5,
      leadPerOwner: 2
    })
  ];

  const summary = createDistributionSummary(mockResults);
  sendDistributionEmail(summary, mockResults);

  SpreadsheetApp.getUi().alert('Test Email Sent',
    'A test email has been sent to: ' + EMAIL_CONFIG.RECIPIENT_EMAIL,
    SpreadsheetApp.getUi().ButtonSet.OK);
}
