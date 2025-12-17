const axios = require('axios');
const qrcode = require('qrcode-terminal');

// --- Configurations ---
const API_URL = "http://127.0.0.1:8080";
const BOT_NUMBER = "+94785124764"; // ඔබගේ Signal අංකය

/**
 * පණිවිඩයක් යැවීමේ ශ්‍රිතය (Function to send messages)
 */
async function sendMessage(recipient, message) {
    try {
        await axios.post(`${API_URL}/v2/send`, {
            message: message,
            number: BOT_NUMBER,
            recipients: [recipient]
        });
        console.log(`✅ පණිවිඩය යැවුවා: ${recipient}`);
    } catch (error) {
        console.error("❌ පණිවිඩය යැවීමේදී දෝෂයක්:", error.response ? error.response.data : error.message);
    }
}

/**
 * නව උපාංගයක් ලෙස සම්බන්ධ වීම (Linking Process)
 */
async function linkDevice() {
    try {
        console.log("🔗 සම්බන්ධ වීමට අවශ්‍ය QR කේතය ලබා ගනිමින්...");
        const response = await axios.get(`${API_URL}/v1/devices/link?device_name=VPS_Signal_Bot`);
        const linkUri = response.data.uri;

        console.log("\n👇 පහත QR කේතය ඔබේ Signal App එකෙන් ස්කෑන් කරන්න (Settings > Linked Devices):");
        qrcode.generate(linkUri, { small: true });
        
        console.log("\nස්කෑන් කළ පසු මෙම Script එක නතර කර (Ctrl+C) නැවත 'node signal.js' ලෙස run කරන්න.");
    } catch (error) {
        console.error("❌ Linking දෝෂයක්: API එක සක්‍රීයදැයි පරීක්ෂා කරන්න.");
    }
}

/**
 * බොට්ගේ ප්‍රධාන ක්‍රියාවලිය (Main Bot Logic)
 */
async function startBot() {
    console.log("🚀 බොට් සාර්ථකව සම්බන්ධ වී ඇත!");
    
    // 1. තමාගේම චැට් එකට (Note to Self) මැසේජ් එකක් යැවීම
    await sendMessage(BOT_NUMBER, "✅ Signal Bot සාර්ථකව ඔබේ VPS එකෙහි PM2 මගින් ක්‍රියාත්මක විය!");

    // 2. නව පණිවිඩ ලබා ගැනීම සඳහා Polling Loop එකක් පවත්වා ගැනීම
    setInterval(async () => {
        try {
            const response = await axios.get(`${API_URL}/v1/receive/${BOT_NUMBER}`);
            const messages = response.data;

            for (const msg of messages) {
                const envelope = msg.envelope;
                const sender = envelope.source;
                const text = envelope.dataMessage ? envelope.dataMessage.message : null;

                // හිස් පණිවිඩ සහ තමා විසින්ම එවන පණිවිඩ මග හැරීම
                if (text && sender && sender !== BOT_NUMBER) {
                    console.log(`📩 පණිවිඩයක් ලැබුණා: ${text} (සිට: ${sender})`);
                    
                    // සරල විධාන කිහිපයක් (Commands)
                    const command = text.toLowerCase().trim();
                    if (command === 'hi' || command === 'hello') {
                        await sendMessage(sender, 'ආයුබෝවන්! මම VPS එකේ සිට වැඩ කරන ඔබේ Signal සහායකයා.');
                    } else if (command === 'status') {
                        await sendMessage(sender, 'බොට් ඉතා හොඳින් ක්‍රියාත්මක වේ. 🟢');
                    }
                }
            }
        } catch (error) {
            // නිහඬව සිටින්න (Polling errors සාමාන්‍යයි)
        }
    }, 3000); // සෑම තත්පර 3 කට වරක් පණිවිඩ පරීක්ෂා කරයි
}

/**
 * ආරම්භක පරීක්ෂාව (Initialization)
 */
async function init() {
    console.log("⏳ Signal API සම්බන්ධතාවය පරීක්ෂා කරමින්...");
    
    try {
        // අංකය දැනටමත් ලියාපදිංචි වී ඇත්දැයි බැලීමට උත්සාහ කරයි
        await axios.get(`${API_URL}/v1/receive/${BOT_NUMBER}`);
        startBot();
    } catch (error) {
        if (error.response && error.response.status === 403) {
            // අංකය ලියාපදිංචි නැතිනම් ලින්ක් කරන්න අවශ්‍යයි
            console.log("⚠️ මෙම අංකය තවම ලියාපදිංචි වී නැත.");
            linkDevice();
        } else {
            console.error("❌ API එක සම්බන්ධ කර ගත නොහැක. කරුණාකර තව තත්පර කිහිපයක් සිට උත්සාහ කරන්න.");
            console.log("Docker එක සම්පූර්ණයෙන්ම Load වීමට විනාඩියක් පමණ ගත විය හැක.");
        }
    }
}

// බොට් ආරම්භ කරන්න
init();
