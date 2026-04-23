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
const SURVEY_URL = 'https://truelyfe.in/survey.html'; // Ensure this URL matches where you host the survey

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
 * Sends a premium HTML email using the Gmail alias
 */
function sendSurveyEmail(name, emailAddress) {
    var subject = "You're on the list! Help us build the perfect milk for you 🥛";
    
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
 * Utility function to send the survey email to ALL existing signups in the Waitlist tab.
 * You can run this manually from the Apps Script editor.
 */
function sendBulkSurveyEmails() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var waitlistSheet = spreadsheet.getSheetByName("Waitlist") || spreadsheet.getSheets()[0];
    
    // Get all data
    var data = waitlistSheet.getDataRange().getValues();
    
    // Assuming Row 1 is headers
    // Index 1 = Name, Index 2 = Email
    var emailsSent = 0;
    
    for (var i = 1; i < data.length; i++) {
        var name = data[i][1];
        var email = data[i][2];
        
        // Basic email validation
        if (email && email.indexOf('@') > 0) {
            try {
                sendSurveyEmail(name, email);
                emailsSent++;
                // Small delay to prevent hitting rate limits too quickly
                Utilities.sleep(1000); 
            } catch (e) {
                console.error("Failed sending bulk to " + email);
            }
        }
    }
    
    Logger.log("Successfully sent " + emailsSent + " survey emails.");
}
