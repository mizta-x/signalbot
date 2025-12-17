const axios = require('axios');
const qrcode = require('qrcode-terminal');
const readline = require('readline');

// --- Configurations ---
const API_URL = "http://localhost:8080";
const BOT_NUMBER = "+94785124764"; // ඔබගේ Signal අංකය මෙතනට ඇතුළත් කරන්න

/**
 * පණිවිඩයක් යැවීමේ ශ්‍රිතය
 */
async function sendMessage(recipient, message) {
    try {
        await axios.post(`${API_URL}/v2/send`, {
            message: message,
            number: BOT_NUMBER,
            recipients: [recipient]
        });
        console.log(`පණිවිඩය යැවුවා: ${recipient}`);
    } catch (error) {
        console.error("යැවීමේ දෝෂයක්:", error.response ? error.response.data : error.message);
    }
}

/**
 * නව උපාංගයක් ලෙස සම්බන්ධ වීම (Linking Process)
 */
async function linkDevice() {
    try {
        console.log("සම්බන්ධ වීමට අවශ්‍ය QR කේතය ලබා ගනිමින්...");
        const response = await axios.get(`${API_URL}/v1/devices/link?device_name=NodeJsBot`);
        const linkUri = response.data.uri;

        console.log("කරුණාකර පහත QR කේතය ඔබේ Signal App එකෙන් ස්කෑන් කරන්න:");
        qrcode.generate(linkUri, { small: true });

        console.log("ස්කෑන් කළ පසු මෙම Script එක නැවත ක්‍රියාත්මක කරන්න.");
        process.exit();
    } catch (error) {
        console.error("Linking දෝෂයක්:", error.message);
    }
}

/**
 * පණිවිඩ ලබා ගැනීම සහ පිළිතුරු දීම
 */
async function startBot() {
    console.log("බොට් සක්‍රීයයි...");

    // සම්බන්ධ වූ වහාම තමාගේම අංකයට (Self-chat) පණිවිඩයක් යැවීම
    await sendMessage(BOT_NUMBER, "✅ බොට් සාර්ථකව VPS එකෙහි ක්‍රියාත්මක විය!");

    setInterval(async () => {
        try {
            const response = await axios.get(`${API_URL}/v1/receive/${BOT_NUMBER}`);
            const messages = response.data;

            for (const msg of messages) {
                const envelope = msg.envelope;
                const sender = envelope.source;
                const text = envelope.dataMessage ? envelope.dataMessage.message : null;

                if (text && sender && sender !== BOT_NUMBER) {
                    console.log(`ලැබුණු පණිවිඩය: ${text} (සිට: ${sender})`);
                    
                    // සරල Logic එකක්
                    if (text.toLowerCase() === 'ping') {
                        await sendMessage(sender, 'Pong! 🏓');
                    } else if (text.toLowerCase() === 'hi') {
                        await sendMessage(sender, 'ආයුබෝවන්! මම Node.js වලින් ක්‍රියාත්මක වන බොට් කෙනෙක්.');
                    }
                }
            }
        } catch (error) {
            // නිහඬව සිටින්න (Polling error සාමාන්‍යයි)
        }
    }, 3000); // තත්පර 3කට වරක් පරීක්ෂා කරයි
}

/**
 * පියවර තීරණය කිරීම
 */
async function init() {
    try {
        // මුලින්ම පණිවිඩ ලබා ගැනීමට උත්සාහ කරමු, අසාර්ථක වුවහොත් Link කරන්න අවශ්‍යයි
        await axios.get(`${API_URL}/v1/receive/${BOT_NUMBER}`);
        startBot();
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log("මෙම අංකය තවම ලියාපදිංචි වී නැත.");
            linkDevice();
        } else {
            console.log("API එක සම්බන්ධ කර ගත නොහැක. Docker run වී ඇත්දැයි බලන්න.");
        }
    }
}

init();
