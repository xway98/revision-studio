/**
 * REVISION STUDIO - HUB & SPOKE APPS SCRIPT BACKEND
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Create 4 Tabs EXACTLY named: "Users", "Physics", "Chemistry", "Biology"
 *    - In the "Users" tab, put "User ID" in A1, "Password" in B1. List valid IDs in column A, and Passwords in column B.
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this code.
 * 5. Change MASTER_ADMIN_ID below to your secret Admin passcode.
 * 6. Deploy as Web App (Execute as: Me, Access: Anyone).
 */

const MASTER_ADMIN_ID = "admin123"; // CHANGE THIS 
const ROOT_FOLDER_NAME = "RevisionStudioApp";

function doPost(e) {
    try {
        const p = JSON.parse(e.postData.contents);
        const action = p.action;
        const userId = p.userId;
        const password = p.password;

        if (!userId) return err("Missing User ID");
        if (!password) return err("Missing Password");

        // 1. VERIFY USER
        const isAdmin = (userId === "admin" && password === MASTER_ADMIN_ID);
        if (!isAdmin && !isValidUser(userId, password)) {
            return err("Invalid User ID or Password");
        }

        // Process actions
        if (action === 'verify_user') {
            return ok({ isAdmin: isAdmin });
        }

        if (action === 'list') {
            return ok(listUserTopics(userId, isAdmin));
        }

        if (action === 'save') {
            return ok(saveTopicData(userId, p.subject, p.chapter, p.topic, p.jsonData));
        }

        if (action === 'load') {
            return ok(loadTopicData(userId, p.subject, p.chapter, p.topic));
        }

        if (action === 'publish') {
            return ok(publishToSheet(userId, p.subject, p.chapter, p.topic, p.htmlData));
        }

        return err("Unknown action: " + action);

    } catch (error) {
        return err(error.toString());
    }
}

function doOptions(e) {
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}

// --- HELPERS ---

function ok(data) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
        .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: msg }))
        .setMimeType(ContentService.MimeType.JSON);
}

function isValidUser(userId, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    if (!sheet) return false;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { // Skip header
        if (data[i][0] && data[i][0].toString().trim() === userId.trim()) {
            if (data[i][1] && data[i][1].toString().trim() === password.trim()) {
                return true;
            }
        }
    }
    return false;
}

function getRootFolder() {
    const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function getUserFolder(userId) {
    const root = getRootFolder();
    const folders = root.getFoldersByName(userId);
    if (folders.hasNext()) return folders.next();
    return root.createFolder(userId);
}

function getPathFolder(userId, subject, chapter) {
    let f = getUserFolder(userId);

    // Navigate/Create Subject
    let subF = f.getFoldersByName(subject);
    f = subF.hasNext() ? subF.next() : f.createFolder(subject);

    // Navigate/Create Chapter
    let chapF = f.getFoldersByName(chapter);
    f = chapF.hasNext() ? chapF.next() : f.createFolder(chapter);

    return f;
}

// --- CORE ACTIONS ---

function listUserTopics(userId, isAdmin) {
    // If admin, they could theoretically see everything, but for now we list the folder structure
    // of the requested userId. If requested userId IS the admin, it lists admin's own files.
    // A future upgrade could allow Admin to list ALL users' folders.

    const userFolder = getUserFolder(userId);
    let tree = {};

    const subjects = userFolder.getFolders();
    while (subjects.hasNext()) {
        let sub = subjects.next();
        tree[sub.getName()] = {};

        let chapters = sub.getFolders();
        while (chapters.hasNext()) {
            let chap = chapters.next();
            tree[sub.getName()][chap.getName()] = [];

            let files = chap.getFiles();
            while (files.hasNext()) {
                let file = files.next();
                let name = file.getName();
                if (name.endsWith('.json')) {
                    tree[sub.getName()][chap.getName()].push(name.replace('.json', ''));
                }
            }
        }
    }
    return tree;
}

function saveTopicData(userId, subject, chapter, topic, jsonData) {
    if (!subject || !chapter || !topic || !jsonData) throw new Error("Missing parameters for save");

    const folder = getPathFolder(userId, subject, chapter);
    const fileName = topic + ".json";

    const existing = folder.getFilesByName(fileName);
    if (existing.hasNext()) {
        let file = existing.next();
        file.setContent(jsonData);
        return { message: "Updated existing topic" };
    } else {
        folder.createFile(fileName, jsonData, MimeType.PLAIN_TEXT);
        return { message: "Created new topic" };
    }
}

function loadTopicData(userId, subject, chapter, topic) {
    if (!subject || !chapter || !topic) throw new Error("Missing parameters for load");

    const folder = getPathFolder(userId, subject, chapter);
    const fileName = topic + ".json";

    const existing = folder.getFilesByName(fileName);
    if (existing.hasNext()) {
        return { json: existing.next().getBlob().getDataAsString() };
    } else {
        throw new Error("Topic not found");
    }
}

function publishToSheet(userId, subject, chapter, topic, htmlData) {
    if (!subject || !chapter || !topic || !htmlData) throw new Error("Missing parameters for publish");

    // 1. Save HTML to an "Exports" folder inside the Chapter folder
    const folder = getPathFolder(userId, subject, chapter);
    let exportsFolderIt = folder.getFoldersByName("Exports");
    let exportsFolder = exportsFolderIt.hasNext() ? exportsFolderIt.next() : folder.createFolder("Exports");

    const timestamp = new Date().toLocaleString();
    const fileName = `${topic} - ${timestamp}.html`;
    const file = exportsFolder.createFile(fileName, htmlData, MimeType.HTML);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();

    // 2. Add to Google Sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(subject);

    if (!sheet) throw new Error(`Sheet tab '${subject}' not found. Please create it.`);

    const data = sheet.getDataRange().getValues();
    let inserted = false;

    // Find chapter header and insert below it
    for (let i = 0; i < data.length; i++) {
        // If we find the exact Chapter name as a header (assuming Chapter name is alone in col A)
        if (data[i][0] == chapter && !data[i][1]) {
            // Insert right below the header
            sheet.insertRowAfter(i + 1);
            sheet.getRange(i + 2, 1, 1, 4).setValues([["", topic, timestamp, fileUrl]]);
            inserted = true;
            break;
        }
    }

    if (!inserted) {
        // Chapter not found, append it to the bottom as a new section
        sheet.appendRow([chapter]); // Header row
        sheet.getRange(sheet.getLastRow(), 1).setFontWeight("bold").setBackground("#f3f3f3");
        sheet.appendRow(["", topic, timestamp, fileUrl]); // Data row
    }

    return { fileUrl: fileUrl };
}
