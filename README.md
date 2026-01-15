# DistributionAutomation

A Google Apps Script automation system for managing lead distribution in a CRM. This project automates the extraction, distribution, and reporting of leads from Google Sheets to a CRM API.

## Overview

This automation system handles:
- **Special Distribution**: Distributes leads to specific agents (agentIds)
- **Regular Distribution**: Distributes leads to agent groups (groupIds)
- **Scheduled Triggers**: Self-renewing daily triggers for automated execution
- **Email Notifications**: Sends detailed HTML reports with distribution results

## Files

| File | Description |
|------|-------------|
| `AutoDistroSpecial.js` | Special lead distribution to agents (scheduled daily) |
| `AutoDistroRegular.js` | Regular lead distribution to groups (scheduled daily) |
| `SchedulerService.js` | Centralized trigger management for both distribution types |
| `EmailNotification.js` | Email notification module for sending distribution reports |
| `ExtractSummary.js` | Utility script for manually extracting distribution summaries |
| `api-doc.md` | API documentation and example curl commands |
| `Backup/` | Backup copies of previous script versions |
| `Backup V2/` | Backup copies before OLD API migration |

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

### Scheduled Distribution

Both distributions run on self-renewing daily triggers managed by `SchedulerService.js`:

**Special Distribution** (`scheduledExtractAndDistribute`):
1. Clears the "Special Distro Status" sheet
2. Finds today's sheet (format: "Special Leads - DD-Mon-YYYY")
3. Extracts distribution data (filter names, agent IDs, leads per agent)
4. Calls the CRM API to distribute leads to agents
5. Sends an email report with results

**Regular Distribution** (`scheduledRegularDistribute`):
1. Clears the "Regular Distro Status" sheet
2. Finds today's sheet (format: "Regular Leads - DD-Mon-YYYY")
3. Extracts distribution data (filter names, group IDs, leads per agent)
4. Calls the CRM API to distribute leads to groups
5. Sends an email report with results

### Scheduler Functions

| Function | Description |
|----------|-------------|
| `initializeAllSchedules()` | Initialize both Regular and Special triggers |
| `initializeRegularSchedule()` | Initialize Regular distribution trigger only |
| `initializeSpecialSchedule()` | Initialize Special distribution trigger only |
| `listAllTriggers()` | View all current triggers |
| `deleteAllTriggers()` | Delete all triggers (cleanup) |

### Manual Extraction

Run `extractDistributionSummary()` to manually extract data from the active sheet to the Special Distro Status.

### Test Email

Run `testEmailNotification()` to send a test email with sample data.

## Sheet Format

**Special Leads**: `Special Leads - DD-Mon-YYYY` (e.g., "Special Leads - 12-Jan-2026")
- Distribution Name: Filter name in CRM
- Per Agent: Leads per agent
- Combined ID for CRM: Comma-separated agent IDs

**Regular Leads**: `Regular Leads - DD-Mon-YYYY` (e.g., "Regular Leads - 12-Jan-2026")
- Distribution Name: Filter name in CRM
- Per Agent: Leads per agent
- Group ID: Agent group IDs

## API Endpoints

Uses the OLD bulk-updates API for distribution:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/filters` | GET | Fetch filter list to match distribution names |
| `/filters/{id}` | GET | Fetch filter items for building query string |
| `/leads/bulk-updates` | PUT | Execute bulk lead distribution (with query params) |

## Email Reports

The system sends HTML-formatted emails with status indicators:
- `[Successful]` - All distributions succeeded
- `[Failed]` - All distributions failed
- `[Partial]` - Some succeeded, some failed
- `[Skipped]` - All distributions skipped
- `[No Plan]` - No sheet found for today

Email includes:
- Summary statistics (total, success, errors, skipped)
- Detailed lists of successful, failed, and skipped distributions
- Error reasons for failed distributions

## License

Private/Internal Use
