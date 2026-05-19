const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin", "pint"],
    version: "1.0",
    author: "ajmaul_here",
    countDown: 2,
    role: 0,
    description: "Search Pinterest and get image results",
    category: "image",
    guide: {
      en: "{pn} [keyword] — Get Pinterest image results\nExample: {pn} Naruto"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query)
      return api.sendMessage(
        "❗ Please provide a search keyword.\nExample: pinterest Naruto",
        event.threadID,
        event.messageID
      );

    try {
      const count = 5;
      const url = `https://betadash-api-swordslush-production.up.railway.app/pinterest?search=${encodeURIComponent(query)}&count=${count}`;

      const res = await axios.get(url);

      const imageList = res.data?.data;
      if (!Array.isArray(imageList) || imageList.length === 0) {
        return api.sendMessage(
          "❌ No results found!",
          event.threadID,
          event.messageID
        );
      }

      const attachments = [];
      const files = [];

      for (let i = 0; i < imageList.length; i++) {
        const imageRes = await axios.get(imageList[i], {
          responseType: "arraybuffer",
        });

        const filePath = path.join(__dirname, `pin_${i}.jpg`);
        fs.writeFileSync(filePath, imageRes.data);

        attachments.push(fs.createReadStream(filePath));
        files.push(filePath);
      }

      api.sendMessage(
        {
          body: `🔍 Pinterest results for: "${query}"`,
          attachment: attachments,
        },
        event.threadID,
        (err) => {
          // cleanup files safely
          files.forEach((file) => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage(
        "🚫 Error fetching from Pinterest API.",
        event.threadID,
        event.messageID
      );
    }
  },
};
