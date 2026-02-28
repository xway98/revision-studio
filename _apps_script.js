/**
 * REVISION STUDIO - GOOGLE APPS SCRIPT EXPORTER
 * 
 * INSTRUCTIONS:
 * 1. Create a blank Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any code there and paste this entire script.
 * 4. Click the "Save" icon.
 * 5. Click "Deploy" > "New deployment" at the top right.
 * 6. "Select type" > "Web app".
 * 7. Set "Execute as" to "Me" and "Who has access" to "Anyone".
 * 8. Click "Deploy" and authorize the app if asked (Advanced > Go to script).
 * 9. Copy the resulting "Web app URL" and paste it into Revision Studio's Global Settings.
 */

function doPost(e) {
    try {
        // Apps script handles simple POST bodies via e.postData.contents
        const data = JSON.parse(e.postData.contents);

        // 1. Create a timestamp
        const timestamp = new Date().toLocaleString();
        const fileName = `${data.title || 'Revision Card'} - ${timestamp}.html`;

        // 2. Create the HTML file in the user's native Google Drive root folder
        const file = DriveApp.createFile(fileName, data.html, MimeType.HTML);

        // 3. Make the file public so "Anyone with the link can view"
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileUrl = file.getUrl();

        // 4. Record the entry in the attached Google Sheet
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        sheet.appendRow([timestamp, data.title, fileUrl]);

        // 5. Return success to the web app
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            fileUrl: fileUrl
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // Return error if something goes wrong
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Handle preflight options requests correctly for CORS
function doOptions(e) {
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.TEXT);
}
