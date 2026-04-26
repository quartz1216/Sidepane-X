// content.js

// --- 1. Click Interception ---
document.addEventListener('click', (e) => {
  // If window width is 990px or less, disable the extension and use normal X behavior
  if (window.innerWidth <= 990) {
    return;
  }

  // Find if the click is inside a tweet article
  const tweet = e.target.closest('article[data-testid="tweet"]');
  if (tweet) {
    // Let standard interactions pass (like, retweet, profile click, images, videos, external links)
    const isInteractive = e.target.closest('a:not([href*="/status/"]), a[href*="/photo/"], a[href*="/video/"], button, [role="button"], [role="link"]');
    if (isInteractive) {
      return;
    }

    // Find the status URL (usually in the timestamp)
    const timeLink = tweet.querySelector('a[href*="/status/"]');
    if (timeLink) {
      e.preventDefault();
      e.stopPropagation();

      const tweetUrl = timeLink.href;

      // Open in-page sidebar directly
      openSidebar(tweetUrl);
    }
  }
}, true); // use capture phase


// --- 2. In-Page Sidebar Implementation ---

let sidebarContainer = null;
let sidebarIframe = null;
let positionObserver = null;

function createSidebar() {
  if (sidebarContainer) return;

  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'x-sidepane-container';

  const header = document.createElement('div');
  header.id = 'x-sidepane-header';

  const title = document.createElement('span');
  title.innerText = 'Tweet Details';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'x-sidepane-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = closeSidebar;

  header.appendChild(title);
  header.appendChild(closeBtn);

  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'x-sidepane-iframe';

  // Inject CSS to hide navigation when the iframe loads
  sidebarIframe.onload = () => {
    try {
      const style = sidebarIframe.contentDocument.createElement('style');
      style.innerHTML = `
        /* Hide left navigation */
        header[role="banner"] { display: none !important; }
        
        /* Hide right sidebar */
        div[data-testid="sidebarColumn"] { display: none !important; }
        
        /* Hide bottom navigation (mobile view) */
        nav[role="navigation"] { display: none !important; }
        
        /* Expand the main content to fill the iframe */
        main[role="main"] { width: 100% !important; max-width: 100% !important; min-height: 100vh !important; }
        div[data-testid="primaryColumn"] { width: 100% !important; max-width: 100% !important; border: none !important; margin: 0 auto !important; }
        
        /* Hide the topbar/back button row if needed */
        div[data-testid="TopNavBar"] { display: none !important; }
      `;
      sidebarIframe.contentDocument.head.appendChild(style);
    } catch (e) {
      console.warn("Could not inject CSS into iframe. Might be cross-origin.", e);
    }
  };

  sidebarContainer.appendChild(header);
  sidebarContainer.appendChild(sidebarIframe);

  document.body.appendChild(sidebarContainer);
}

function openSidebar(url) {
  createSidebar();
  sidebarIframe.src = url;

  // Find where to insert it (replace the right sidebar)
  const sidebarColumn = document.querySelector('div[data-testid="sidebarColumn"]');
  if (sidebarColumn && sidebarColumn.parentNode) {
    // Insert our container right after the sidebarColumn
    sidebarColumn.parentNode.insertBefore(sidebarContainer, sidebarColumn.nextSibling);
  } else {
    // Fallback
    document.body.appendChild(sidebarContainer);
  }

  // Need a tiny delay for CSS transition to work if it was just created
  setTimeout(() => {
    sidebarContainer.classList.add('open');
    document.body.classList.add('x-sidepane-active');
  }, 10);
}

function closeSidebar() {
  if (sidebarContainer) {
    sidebarContainer.classList.remove('open');
    document.body.classList.remove('x-sidepane-active');
    setTimeout(() => {
      sidebarIframe.src = 'about:blank'; // Clear memory
      // Optionally move it back to body when hidden
      document.body.appendChild(sidebarContainer);
    }, 300);
  }
}

