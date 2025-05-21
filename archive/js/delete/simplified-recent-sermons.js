/**
 * Simplified Recent Sermons Display
 * This script embeds the YouTube channel's recent uploads playlist
 * without requiring a YouTube API key
 */

document.addEventListener('DOMContentLoaded', function() {
    const recentSermonsContainer = document.getElementById('recentSermonsContainer');
    
    if (!recentSermonsContainer) return;
    
    // Channel ID for Chris Mann (@chrismann9821)
    const channelId = 'UCqX4A_CZGiLZyKp1-XW4C4g'; // This is the actual channel ID for @chrismann9821
    
    // Create a simple header
    const header = document.createElement('h3');
    header.className = 'recent-sermons-header';
    header.textContent = 'Recent Sermons';
    recentSermonsContainer.appendChild(header);
    
    // Create description text
    const description = document.createElement('p');
    description.className = 'recent-sermons-description';
    description.textContent = 'The latest sermons from Fellowship Baptist Church';
    recentSermonsContainer.appendChild(description);
    
    // Create an iframe to embed the channel's uploads playlist
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '450';
    iframe.src = `https://www.youtube.com/embed/videoseries?list=UU${channelId.substring(2)}`;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    // Create container for iframe
    const embedContainer = document.createElement('div');
    embedContainer.className = 'embed-container';
    embedContainer.style.position = 'relative';
    embedContainer.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
    embedContainer.style.height = '0';
    embedContainer.style.overflow = 'hidden';
    embedContainer.style.maxWidth = '100%';
    embedContainer.style.marginTop = '1rem';
    embedContainer.style.marginBottom = '2rem';
    
    // Style the iframe to fit the container
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    
    // Add iframe to container
    embedContainer.appendChild(iframe);
    
    // Add embed container to sermons container
    recentSermonsContainer.appendChild(embedContainer);
    
    // Add link to full channel
    const channelLink = document.createElement('a');
    channelLink.href = 'https://www.youtube.com/@chrismann9821';
    channelLink.className = 'btn';
    channelLink.textContent = 'View All Sermons on YouTube';
    channelLink.target = '_blank';
    channelLink.style.display = 'block';
    channelLink.style.textAlign = 'center';
    channelLink.style.maxWidth = '300px';
    channelLink.style.margin = '0 auto';
    
    recentSermonsContainer.appendChild(channelLink);
  });