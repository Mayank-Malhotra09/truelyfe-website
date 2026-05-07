/**
 * ====================================================
 * TrueLyfe Waitlist & Survey — Google Apps Script
 * ====================================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://sheets.google.com and open "TrueLyfe Waitlist"
 * 2. Rename the first sheet tab to "Waitlist"
 * 3. Create a second sheet tab named "Survey Responses"
 * 4. In "Waitlist", add headers: Timestamp | Name | Email | Phone | Age Bracket
 * 5. In "Survey Responses", add headers: 
 *    Timestamp | Name | Email | Q1_Type | Q2_Freq | Q3_Spend | Q4_Drivers | Q5_Price | Q6_Disappointed | Q7_Variant | Q8_Channel | Q9_Loyalty | Q10_Concerns | Q11_Alternative | Q12_Benefit
 * 6. Make sure your Gmail account has "mayank@truelyfe.in" set up as a "Send mail as" alias in Gmail Settings.
 * 
 * ====================================================
 */

const FROM_EMAIL = 'mayank@truelyfe.in';
const FROM_NAME = 'Mayank from TrueLyfe';
const SURVEY_URL = 'https://truelyfe.in/survey'; // Cloudflare Pages strips .html extension

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        var action = data.action || 'signup';
        
        var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

        if (action === 'signup') {
            var waitlistSheet = spreadsheet.getSheetByName("Waitlist") || spreadsheet.getSheets()[0];
            waitlistSheet.appendRow([
                new Date(),
                data.name || '',
                data.email || '',
                data.phone || '',
                data.age || ''
            ]);

            // Auto-send survey email
            if (data.email) {
                sendSurveyEmail(data.name || 'there', data.email);
            }

            var count = Math.max(0, waitlistSheet.getLastRow() - 1);
            return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: count }))
                .setMimeType(ContentService.MimeType.JSON);

        } else if (action === 'survey') {
            var surveySheet = spreadsheet.getSheetByName("Survey Responses");
            if (!surveySheet) {
                surveySheet = spreadsheet.insertSheet("Survey Responses");
                // Insert headers if newly created
                surveySheet.appendRow(['Timestamp', 'Name', 'Email', 'Q1_Type', 'Q2_Freq', 'Q3_Spend', 'Q4_Drivers', 'Q5_Price', 'Q6_Disappointed', 'Q7_Variant', 'Q8_Channel', 'Q9_Loyalty', 'Q10_Concerns', 'Q11_Alternative', 'Q12_Benefit']);
            }
            
            surveySheet.appendRow([
                new Date(),
                data.name || '',
                data.email || '',
                data.q1 || '',
                data.q2 || '',
                data.q3 || '',
                data.q4 || '',
                data.q5 || '',
                data.q6 || '',
                data.q7 || '',
                data.q8 || '',
                data.q9 || '',
                data.q10 || '',
                data.q11 || '',
                data.q12 || ''
            ]);

            // ─── Mark survey completion in the Waitlist sheet ───
            markSurveyCompleted(spreadsheet, data.email || '');

            return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
                .setMimeType(ContentService.MimeType.JSON);
        }

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    try {
        var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        var waitlistSheet = spreadsheet.getSheetByName("Waitlist") || spreadsheet.getSheets()[0];
        var count = Math.max(0, waitlistSheet.getLastRow() - 1);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: count }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', count: 0, message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Finds the user's email in the Waitlist sheet and marks column F
 * with "Yes" and column G with the survey completion timestamp.
 * 
 * Waitlist headers should be:
 * A: Timestamp | B: Name | C: Email | D: Phone | E: Age Bracket | F: Survey Completed | G: Survey Date
 */
function markSurveyCompleted(spreadsheet, email) {
    if (!email) return;

    try {
        var waitlistSheet = spreadsheet.getSheetByName("Waitlist") || spreadsheet.getSheets()[0];
        var data = waitlistSheet.getDataRange().getValues();

        // Ensure headers exist in columns F and G (row 1)
        if (data.length > 0) {
            var headerF = waitlistSheet.getRange(1, 6).getValue();
            if (!headerF || headerF === '') {
                waitlistSheet.getRange(1, 6).setValue('Survey Completed');
                waitlistSheet.getRange(1, 7).setValue('Survey Date');
            }
        }

        // Search for matching email (column C = index 2)
        for (var i = 1; i < data.length; i++) {
            if (data[i][2] && data[i][2].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
                waitlistSheet.getRange(i + 1, 6).setValue('Yes');           // Column F
                waitlistSheet.getRange(i + 1, 7).setValue(new Date());      // Column G
                Logger.log("Marked survey completed for: " + email);
                break;
            }
        }
    } catch (e) {
        console.error("Error marking survey completion: " + e.message);
    }
}

/**
 * Sends a premium HTML email using the Gmail alias
 */
function sendSurveyEmail(name, emailAddress) {
    var subject = "You're on the list! Help us build the perfect milk for you";
    
    // We add the user's email to the query string so the survey page can pre-fill it!
    var personalizedSurveyUrl = SURVEY_URL + "?email=" + encodeURIComponent(emailAddress) + "&name=" + encodeURIComponent(name);
    
    // A clean, branded HTML email template
    var htmlBody = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="text-align: center; padding: 30px 0;">
            <h2 style="color: #008B8B; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">TrueLyfe</h2>
        </div>
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi ${name},</p>
            <p style="font-size: 16px; line-height: 1.6;">Thank you for joining the TrueLyfe early access waitlist for Delhi NCR!</p>
            <p style="font-size: 16px; line-height: 1.6;">We're currently perfecting our ultra-filtered, 2X protein cow milk. Before we launch, we want to make sure we're building exactly what <strong>you</strong> need.</p>
            <p style="font-size: 16px; line-height: 1.6;">Could you take 2 minutes to answer a few quick questions? Your feedback will directly shape our launch strategy.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${personalizedSurveyUrl}" style="background-color: #008B8B; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block;">Take the 2-Minute Survey</a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">Stay tuned for more updates as we get closer to launch.</p>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 10px;">Best,<br><strong>Mayank</strong><br>Founder, TrueLyfe</p>
        </div>
        <div style="text-align: center; padding: 20px 0; color: #6b7280; font-size: 12px;">
            <p>© 2026 TrueLyfe. All rights reserved.</p>
        </div>
    </div>
    `;

    try {
        GmailApp.sendEmail(emailAddress, subject, "Please view this email in an HTML-capable email client.", {
            from: FROM_EMAIL,
            name: FROM_NAME,
            htmlBody: htmlBody
        });
    } catch (e) {
        console.error("Failed to send email to: " + emailAddress + " - " + e.message);
        // Fallback to default sender if alias isn't configured correctly yet
        try {
            MailApp.sendEmail({
                to: emailAddress,
                subject: subject,
                htmlBody: htmlBody,
                name: FROM_NAME
            });
        } catch (err) {
            console.error("Fallback email also failed: " + err.message);
        }
    }
}

/**
 * Sends the survey email to signups who have NOT yet completed the survey.
 * Skips anyone with "Yes" in Column F (Survey Completed).
 * Run this manually from the Apps Script editor.
 */
function sendBulkSurveyEmails() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var waitlistSheet = spreadsheet.getSheetByName("Waitlist") || spreadsheet.getSheets()[0];
    
    var data = waitlistSheet.getDataRange().getValues();
    
    // Row 1 = headers
    // Index 1 = Name, Index 2 = Email, Index 5 = Survey Completed (Column F)
    var emailsSent = 0;
    var skipped = 0;
    
    for (var i = 1; i < data.length; i++) {
        var name = data[i][1];
        var email = data[i][2];
        var surveyCompleted = (data[i][5] || '').toString().trim().toLowerCase();
        
        // Skip if already completed the survey
        if (surveyCompleted === 'yes') {
            skipped++;
            Logger.log("Skipped (already completed): " + email);
            continue;
        }
        
        // Basic email validation
        if (email && email.indexOf('@') > 0) {
            try {
                sendSurveyEmail(name, email);
                emailsSent++;
                Logger.log("Sent to: " + email);
                // Small delay to prevent hitting rate limits
                Utilities.sleep(1000); 
            } catch (e) {
                console.error("Failed sending to " + email + ": " + e.message);
            }
        }
    }
    
    Logger.log("──────────────────────────");
    Logger.log("✅ Bulk send complete!");
    Logger.log("Emails sent: " + emailsSent);
    Logger.log("Skipped (already completed survey): " + skipped);
    Logger.log("──────────────────────────");
}

/**
 * TEST FUNCTION — Run this ONCE from the Apps Script editor to:
 * 1. Trigger Gmail authorization (you'll see a permission popup)
 * 2. Send a test email to yourself to verify everything works
 * 
 * Select this function from the dropdown above and click ▶️ Run
 */
function testEmailSetup() {
    var testEmail = 'mkmalhotra65@gmail.com'; // Your email for testing
    var testName = 'Mayank';
    
    Logger.log("Starting email test...");
    Logger.log("Sending from: " + FROM_EMAIL);
    Logger.log("Sending to: " + testEmail);
    Logger.log("Survey URL: " + SURVEY_URL);
    
    sendSurveyEmail(testName, testEmail);
    
    Logger.log("✅ Test email sent successfully! Check your inbox.");
}

/**
 * BACKFILL FUNCTION — Run this from the Apps Script editor to mark
 * all people who have ALREADY filled the survey in the Waitlist sheet.
 * 
 * It reads the "Survey Responses" tab, collects all emails,
 * then finds them in the "Waitlist" tab and marks columns F & G.
 * 
 * Select this function from the dropdown above and click ▶️ Run
 */
function backfillSurveyStatus() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var waitlistSheet = spreadsheet.getSheetByName("Waitlist") || spreadsheet.getSheets()[0];
    var surveySheet = spreadsheet.getSheetByName("Survey Responses");
    
    if (!surveySheet) {
        Logger.log("No 'Survey Responses' sheet found. Nothing to backfill.");
        return;
    }
    
    // Ensure headers exist in columns F and G
    var headerF = waitlistSheet.getRange(1, 6).getValue();
    if (!headerF || headerF === '') {
        waitlistSheet.getRange(1, 6).setValue('Survey Completed');
        waitlistSheet.getRange(1, 7).setValue('Survey Date');
    }
    
    // Collect all survey emails + their timestamps
    var surveyData = surveySheet.getDataRange().getValues();
    var surveyEmails = {}; // email -> timestamp
    
    for (var s = 1; s < surveyData.length; s++) {
        var surveyEmail = (surveyData[s][2] || '').toString().toLowerCase().trim();
        var surveyTimestamp = surveyData[s][0]; // Column A = Timestamp
        if (surveyEmail) {
            surveyEmails[surveyEmail] = surveyTimestamp;
        }
    }
    
    Logger.log("Found " + Object.keys(surveyEmails).length + " survey responses to match.");
    
    // Match against Waitlist
    var waitlistData = waitlistSheet.getDataRange().getValues();
    var marked = 0;
    
    for (var i = 1; i < waitlistData.length; i++) {
        var waitlistEmail = (waitlistData[i][2] || '').toString().toLowerCase().trim();
        
        if (waitlistEmail && surveyEmails[waitlistEmail]) {
            waitlistSheet.getRange(i + 1, 6).setValue('Yes');
            waitlistSheet.getRange(i + 1, 7).setValue(surveyEmails[waitlistEmail]);
            marked++;
        }
    }
    
    Logger.log("✅ Backfill complete! Marked " + marked + " people as survey completed in the Waitlist sheet.");
}
