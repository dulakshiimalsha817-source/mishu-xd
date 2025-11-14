
const axios = require('axios');
const fs = require('fs');

module.exports = async (sock, m) => {
  try {
    const from = m.key.remoteJid;
    const type = Object.keys(m.message)[0];
    const body = type === 'conversation'
      ? m.message.conversation
      : m.message[type]?.text || '';
    const command = body.split(' ')[0].toLowerCase();
    const query = body.replace(command, '').trim();

    // group metadata
    const isGroup = from.endsWith('@g.us');
    let admins = [];
    if (isGroup) {
      const metadata = await sock.groupMetadata(from);
      admins = metadata.participants.filter(x => x.admin).map(x => x.id);
    }
    const isAdmin = admins.includes(m.key.participant);

    switch(command){

      case 'menu':
        return sock.sendMessage(from,{ text:`💠 *FULL MENU*
• song <name>
• tiktok <url>
• yt <url>
• sticker
• logo <text>
• promote
• demote
• tagall
• alive
• setting
• autoreply-on/off
• autorecat-on/off`});

      case 'alive':
        return sock.sendMessage(from,{ text:'Bot is Alive 🟢' });

      case 'setting':
        return sock.sendMessage(from,{ text:'⚙ Settings Loaded' });

      // ---- DOWNLOAD FUNCTIONS ----
      case 'song':
        if(!query) return sock.sendMessage(from,{text:'ѕαηηυ м∂ мιηι вσт'});
        try{
          let api = `https://api.viper-x.xyz/api/song?text=${encodeURIComponent(query)}`;
          let r = await axios.get(api);
          await sock.sendMessage(from,{audio:{url:r.data.result.download_url}, mimetype:'audio/mpeg'});
        }catch(e){ sock.sendMessage(from,{text:'Song download failed'}); }
        break;

      case 'tiktok':
        if(!query) return sock.sendMessage(from,{text:'TikTok url දාපන්'});
        try{
          let api = `https://api.viper-x.xyz/api/tiktok?url=${encodeURIComponent(query)}`;
          let r = await axios.get(api);
          await sock.sendMessage(from,{video:{url:r.data.result.video}});
        }catch(e){ sock.sendMessage(from,{text:'TT download failed'}); }
        break;

      case 'yt':
        if(!query) return sock.sendMessage(from,{text:'YT url දාපන්'});
        try{
          let api = `https://api.viper-x.xyz/api/ytmp4?url=${encodeURIComponent(query)}`;
          let r = await axios.get(api);
          await sock.sendMessage(from,{video:{url:r.data.result.url}});
        }catch(e){ sock.sendMessage(from,{text:'YT download failed'}); }
        break;

      // ---- STICKER ----
      case 'sticker':
        if (!m.message.imageMessage)
          return sock.sendMessage(from,{text:'Image එකට reply කරන්න "sticker" කියලා'});
        const buffer = await sock.downloadMediaMessage(m);
        await sock.sendMessage(from,{sticker:buffer});
        break;

      // ---- LOGO MAKER ----
      case 'logo':
        if(!query) return sock.sendMessage(from,{text:'Logo text දෙන්න'});
        try{
          let url = `https://api.viper-x.xyz/api/logo?text=${encodeURIComponent(query)}`;
          await sock.sendMessage(from,{image:{url}});
        }catch(e){ sock.sendMessage(from,{text:'Logo maker fail'}); }
        break;

      // ---- GROUP ADMIN ----
      case 'promote':
        if (!isGroup) return;
        if (!isAdmin) return;
        if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid)
          return sock.sendMessage(from,{text:'Tag user'});
        let promoteID = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        await sock.groupParticipantsUpdate(from,[promoteID],"promote");
        sock.sendMessage(from,{text:'Promoted ✓'});
        break;

      case 'demote':
        if (!isGroup) return;
        if (!isAdmin) return;
        if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid)
          return sock.sendMessage(from,{text:'Tag user'});
        let demoteID = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        await sock.groupParticipantsUpdate(from,[demoteID],"demote");
        sock.sendMessage(from,{text:'Demoted ✓'});
        break;

      case 'tagall':
        if (!isGroup) return;
        let mentions = admins;
        sock.sendMessage(from,{text:'TAGALL', mentions});
        break;

      // ---- AUTO FUNCTIONS ----
      case 'autoreply-on': global.autoReply = true; return sock.sendMessage(from,{text:'Auto Reply ON'});
      case 'autoreply-off': global.autoReply = false; return sock.sendMessage(from,{text:'Auto Reply OFF'});
      case 'autorecat-on': global.autoRecat = true; return sock.sendMessage(from,{text:'Auto Recat ON'});
      case 'autorecat-off': global.autoRecat = false; return sock.sendMessage(from,{text:'Auto Recat OFF'});
    }

    // Passive auto reply
    if(global.autoReply && body.length < 10){
      sock.sendMessage(from,{text:'🟢 Auto reply active'});
    }

    // Auto recat simple system
    if(global.autoRecat && body.includes('hi')){
      sock.sendMessage(from,{text:'Hello 👋'});
    }

  } catch(e){
    console.log(e);
  }
};
