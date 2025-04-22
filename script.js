/* dom querys */
const form = document.querySelector('#chatform');
const chatbox = document.querySelector('#chat');
const commentInput = document.querySelector('#comment');
const emailInput = document.querySelector('#email');
const modal = document.querySelector('#gif-modal');
const gifContainer = document.querySelector('#gif-container');
const closeBtn = document.querySelector('#close-modal');
const clearBtn = document.querySelector('#clear');
const themeRadios = document.querySelectorAll('input[name="theme"]');

/* api key */
const GIPHY_API_KEY = 'O18nXgaMwDD7goG1HAFEEeCvfXXNz7wZ';

/* hash */
function md5(string) {
   return CryptoJS.MD5(string).toString();
}

/* gravatar avatar url */
function getGravatarurl(email) {
   const hash = md5(email.trim().toLowerCase());
   return `https://en.gravatar.com/avatar/${hash}?d=mp`;
}

/* gravatar displayname */
async function fetchGravatarDisplayName(email) {
   const hash = md5(email.trim().toLowerCase());
   const url = `https://en.gravatar.com/${hash}.json`;

   try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const profile = data.entry && data.entry[0];

      if (profile && profile.displayName) {
         return profile.displayName;
      } else {
         return email;
      }
   } catch (err) {
      console.warn(`Gravatar profile fetch failed:`, err.message);
      return email;
   }
}

/* main message function */
function createMessage(text, displayName, avatarurl, isgif = false) {
   let messageHtml;
   if (isgif == true) {
      messageHtml = `
      <div class="user_message">
         <img class="user_image" src="${avatarurl}" alt="profielfoto" data-displayname="${displayName}">
         <img src="${text}" alt="gif">
      </div>
   `;
   }
   else {
      messageHtml = `
      <div class="user_message">
         <img class="user_image" src="${avatarurl}" alt="profielfoto" data-displayname="${displayName}">
         <p>${text}</>
      </div>
   `;
   }

   chatbox.innerHTML += messageHtml;

   /* tippy for tooltips*/
   chatbox.querySelectorAll('.user_image').forEach(img => {
      tippy(img, { content: img.dataset.displayname });
   });
   
   localStorage.setItem('chatContent', chatbox.innerHTML);
}

/* eventlistener for submitting comment */
form.addEventListener('submit', async function (e) {
   e.preventDefault();

   const email = emailInput.value;
   const comment = commentInput.value;
   const gravatarurl = getGravatarurl(email)
   const displayName = await fetchGravatarDisplayName(email)

   createMessage(comment, displayName, gravatarurl, false);

   form.reset();

   localStorage.removeItem('email');
   localStorage.removeItem('comment');
});

/* localstorage save for unsubmitted comment */
commentInput.addEventListener('input', () => {
   localStorage.setItem('comment', commentInput.value);
});

/* localstorage save for unsubmitted email */
emailInput.addEventListener('input', () => {
   localStorage.setItem('email', emailInput.value);
});

/* function for opening the gif modal and fetching the gifs */
async function openGifModal(keyword, displayName, avatarurl) {
   modal.style.display = 'block';
   gifContainer.innerHTML = '<p>GIFs worden geladen...</p>';

   try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${keyword}&limit=20`);
      const data = await response.json();

      gifContainer.innerHTML = '';

      for (const gif of data.data) {

         gifContainer.innerHTML += `<img class="user_gif" src="${gif.images.fixed_height_small.url}" alt="gif">`;

         const images = document.querySelectorAll('.user_gif');
         images.forEach((img, number) => {
            const gifUrl = data.data[number].images.fixed_height.url;;
            img.addEventListener('click', () => {
               createMessage(gifUrl, displayName, avatarurl, true);
               modal.style.display = 'none';
               form.reset();
               localStorage.removeItem('email');
               localStorage.removeItem('comment');
            });
         });
      }
   } catch (error) {
      gifContainer.innerHTML = '<p>Er ging iets mis bij het ophalen van de GIFs.</p>';
      console.error('GIF ophalen mislukt:', error);
   }
}

/* function for opening the gif modal and fetching the gifs */
commentInput.addEventListener('dblclick', async () => {
   const email = emailInput.value;
   const displayName = await fetchGravatarDisplayName(email)
   const avatarurl = getGravatarurl(email);
   const selection = commentInput.value.substring(commentInput.selectionStart, commentInput.selectionEnd).trim();
   openGifModal(selection, displayName, avatarurl);
});

/* gif modal sluiten */
closeBtn.addEventListener('click', () => {
   modal.style.display = 'none';
})


/* localstorage loader */
window.addEventListener('load', () => {
   const savedChat = localStorage.getItem('chatContent');
   const savedEmail = localStorage.getItem('email');
   const savedComment = localStorage.getItem('comment');

   if (savedChat) chatbox.innerHTML = savedChat;
   if (savedEmail) emailInput.value = savedEmail;
   if (savedComment) commentInput.value = savedComment;
});

/* localstorage clearer */
clearBtn.addEventListener('click', () => {
   localStorage.clear();
   chatbox.innerHTML = '';
   emailInput.value = '';
   commentInput.value = '';
});

/* theme switcher */
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
   document.body.classList.add('dark');
   document.getElementById('dark').checked = true;
}

themeRadios.forEach(radio => {
   radio.addEventListener('change', (e) => {
      if (e.target.value === 'dark') {
         document.body.classList.add('dark');
         localStorage.setItem('theme', 'dark');
      } else {
         document.body.classList.remove('dark');
         localStorage.setItem('theme', 'light');
      }
   });
});
