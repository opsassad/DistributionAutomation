# DistributionAutomation

A Google Apps Script automation system for managing lead distribution in a CRM. This project automates the extraction, distribution, and reporting of leads from Google Sheets to a CRM API.

## Overview

This automation system handles:
- **Data Extraction**: Extracts distribution data from specially formatted Google Sheets
- **Lead Distribution**: Distributes leads to agents via CRM API bulk operations
- **Email Notifications**: Sends detailed HTML reports with distribution results

## Files

| File | Description |
|------|-------------|
| `AutoDistroSpecial.js` | Main distribution automation script with scheduled triggers |
| `EmailNotification.js` | Email notification module for sending distribution reports |
| `ExtractSummary.js` | Utility script for manually extracting distribution summaries |
| `api-doc.md` | API documentation and example curl commands |
| `Backup/` | Backup copies of previous script versions |

## Setup

### Prerequisites
- Google Sheets with distribution data
- CRM API access with a valid Bearer token
- Google Apps Script environment

### Configuration

1. **API Configuration** (in `AutoDistroSpecial.js`):
   ```javascript
   const CONFIG = {
     API_BASE_URL: 'https://crm-api.shikho.com/api/v1',
     AUTH_TOKEN: 'YOUR_BEARER_TOKEN_HERE',
     // ...
   };
   ```

2. **Email Configuration** (in `EmailNotification.js`):
   ```javascript
   const EMAIL_CONFIG = {
     RECIPIENT_EMAIL: 'your-email@example.com',
     CC_EMAILS: 'cc-email@example.com',
     ENABLED: true,
     // ...
   };
   ```

### Google Apps Script Deployment

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Copy the contents of each `.js` file into separate script files
4. Save and authorize the scripts
5. Set up a time-driven trigger for `scheduledExtractAndDistribute`

## Usage

### Automatic Distribution (Scheduled)

The main function `scheduledExtractAndDistribute()` runs on a schedule and:

1. Clears the "Special Distro Status" sheet
2. Finds today's sheet (format: "Special Leads - DD-Mon-YYYY")
3. Extracts distribution data (filter names, agent IDs, leads per agent)
4. Calls the CRM API to distribute leads
5. Sends an email report with results

### Manual Extraction

Run `extractDistributionSummary()` to manually extract data from the active sheet to the Special Distro Status.

### Test Email

Run `testEmailNotification()` to send a test email with sample data.

## Sheet Format

Source sheets should be named: `Special Leads - DD-Mon-YYYY` (e.g., "Special Leads - 12-Jan-2026")

Required columns in each distribution block:
- **Distribution Name**: The filter name in the CRM
- **Per Agent**: Number of leads to assign per agent
- **Combined ID for CRM**: Comma-separated agent IDs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/filters` | GET | Fetch filter list to match distribution names |
| `/leads/bulk-distributes` | PUT | Execute bulk lead distribution |

## Email Reports

The system sends HTML-formatted emails with:
- Summary statistics (total, success, errors, skipped)
- Detailed lists of successful, failed, and skipped distributions
- Error reasons for failed distributions

## License

Private/Internal Use
