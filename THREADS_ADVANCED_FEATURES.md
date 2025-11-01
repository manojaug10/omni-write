# Threads Advanced Features Guide

Complete guide to all Threads API features including topic tags, link attachments, GIF attachments, and media specifications.

---

## Table of Contents

1. [Single Posts](#single-posts)
2. [Carousel Posts](#carousel-posts)
3. [Topic Tags (Hashtags)](#topic-tags)
4. [Link Attachments](#link-attachments)
5. [GIF Attachments](#gif-attachments)
6. [Media Specifications](#media-specifications)

---

## Single Posts

### Basic Text Post

```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Threads API!",
    "mediaType": "TEXT"
  }'
```

### Image Post

```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this image!",
    "mediaUrl": "https://example.com/image.jpg",
    "mediaType": "IMAGE"
  }'
```

### Video Post

```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Watch this video!",
    "mediaUrl": "https://example.com/video.mp4",
    "mediaType": "VIDEO"
  }'
```

---

## Topic Tags

Add hashtags to your posts for better discoverability.

### Features
- **Length:** 1-50 characters
- **Forbidden characters:** Periods (.) and Ampersands (&)
- **One tag per post:** Only one topic tag allowed

### Example with Topic Tag

```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Exploring the latest web development trends",
    "mediaType": "TEXT",
    "topicTag": "WebDevelopment"
  }'
```

### JavaScript Example

```javascript
const createPostWithTag = async () => {
  const response = await fetch('/api/threads/post', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Building something cool with React!",
      mediaType: "TEXT",
      topicTag: "ReactJS"  // No # symbol needed
    })
  });

  const result = await response.json();
  console.log('Posted with tag:', result.data.id);
};
```

---

## Link Attachments

Add link previews to text-only posts.

### Limitations
- **TEXT posts only:** Does not work with IMAGE, VIDEO, or CAROUSEL posts
- **One link per post:** Only one link attachment allowed
- **Must be publicly accessible:** Link must be a valid, public URL

### Example

```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this amazing article!",
    "mediaType": "TEXT",
    "linkAttachment": "https://example.com/article"
  }'
```

### JavaScript Example

```javascript
const postWithLink = async () => {
  const response = await fetch('/api/threads/post', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Just published a new blog post!",
      mediaType: "TEXT",
      linkAttachment: "https://myblog.com/new-post",
      topicTag: "Blogging"  // Can combine with topic tag
    })
  });

  return await response.json();
};
```

---

## GIF Attachments

Add animated GIFs from Tenor to text-only posts.

### Limitations
- **TEXT posts only:** Does not work with IMAGE, VIDEO, or CAROUSEL posts
- **Tenor only:** Currently, only Tenor GIFs are supported
- **Requires GIF ID:** Must use the ID from Tenor API response

### Get GIF ID from Tenor

```javascript
// 1. Get Tenor API key from https://tenor.com/developer/dashboard
// 2. Search for GIFs
const searchGifs = async (query) => {
  const response = await fetch(
    `https://tenor.googleapis.com/v2/search?q=${query}&key=YOUR_TENOR_API_KEY&limit=10`
  );
  const data = await response.json();

  // Get the first GIF's ID
  const gifId = data.results[0].id;
  return gifId;
};
```

### Example with GIF

```bash
curl -X POST http://localhost:3000/api/threads/post \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is how I feel right now!",
    "mediaType": "TEXT",
    "gifAttachment": {
      "gifId": "12345678901234567",
      "provider": "TENOR"
    }
  }'
```

### JavaScript Example

```javascript
const postWithGif = async (gifId) => {
  const response = await fetch('/api/threads/post', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Happy Friday everyone!",
      mediaType: "TEXT",
      gifAttachment: {
        gifId: gifId,
        provider: "TENOR"  // Default is TENOR
      },
      topicTag: "FridayFeeling"
    })
  });

  return await response.json();
};
```

---

## Carousel Posts

Create multi-item swipeable posts with 2-20 images or videos.

### Features
- **2-20 items:** Minimum 2, maximum 20 items
- **Images & Videos:** Can mix IMAGE and VIDEO types
- **No TEXT items:** Carousel items must have media (IMAGE or VIDEO only)
- **Optional text per item:** Each item can have optional caption
- **Overall text:** Carousel itself can have text
- **Topic tags supported:** Can add hashtag to entire carousel

### Basic Carousel Example

```bash
curl -X POST http://localhost:3000/api/threads/carousel \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "mediaUrl": "https://example.com/photo1.jpg",
        "mediaType": "IMAGE",
        "text": "First photo"
      },
      {
        "mediaUrl": "https://example.com/photo2.jpg",
        "mediaType": "IMAGE",
        "text": "Second photo"
      },
      {
        "mediaUrl": "https://example.com/video.mp4",
        "mediaType": "VIDEO",
        "text": "Watch this!"
      }
    ],
    "text": "My vacation photos and videos!",
    "topicTag": "TravelDiaries"
  }'
```

### JavaScript Example - Product Showcase

```javascript
const createProductCarousel = async (products) => {
  const items = products.map(product => ({
    mediaUrl: product.imageUrl,
    mediaType: "IMAGE",
    text: `${product.name} - $${product.price}`
  }));

  const response = await fetch('/api/threads/carousel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: items,
      text: "Check out our new collection!",
      topicTag: "NewArrivals"
    })
  });

  return await response.json();
};

// Usage
createProductCarousel([
  { name: "Product 1", price: 29.99, imageUrl: "https://..." },
  { name: "Product 2", price: 39.99, imageUrl: "https://..." },
  { name: "Product 3", price: 49.99, imageUrl: "https://..." }
]);
```

### React Component Example

```jsx
import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

function CarouselCreator() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([
    { mediaUrl: '', mediaType: 'IMAGE', text: '' },
    { mediaUrl: '', mediaType: 'IMAGE', text: '' }
  ]);
  const [carouselText, setCarouselText] = useState('');
  const [topicTag, setTopicTag] = useState('');

  const addItem = () => {
    if (items.length < 20) {
      setItems([...items, { mediaUrl: '', mediaType: 'IMAGE', text: '' }]);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    if (items.length > 2) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const createCarousel = async () => {
    const token = await getToken();

    const response = await fetch('/api/threads/carousel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: items.filter(item => item.mediaUrl), // Only include items with URLs
        text: carouselText,
        topicTag: topicTag
      })
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Carousel created! ID: ${result.data.id}`);
    }
  };

  return (
    <div className="carousel-creator">
      <h2>Create Carousel</h2>

      <div>
        <label>Carousel Text (Optional):</label>
        <textarea
          value={carouselText}
          onChange={(e) => setCarouselText(e.target.value)}
          placeholder="Overall caption for the carousel..."
        />
      </div>

      <div>
        <label>Topic Tag (Optional):</label>
        <input
          type="text"
          value={topicTag}
          onChange={(e) => setTopicTag(e.target.value)}
          placeholder="e.g., Photography (no # needed)"
          maxLength={50}
        />
      </div>

      <h3>Carousel Items ({items.length}/20)</h3>

      {items.map((item, index) => (
        <div key={index} className="carousel-item">
          <h4>Item {index + 1}</h4>

          <select
            value={item.mediaType}
            onChange={(e) => updateItem(index, 'mediaType', e.target.value)}
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
          </select>

          <input
            type="url"
            value={item.mediaUrl}
            onChange={(e) => updateItem(index, 'mediaUrl', e.target.value)}
            placeholder={`${item.mediaType} URL (required)`}
            required
          />

          <input
            type="text"
            value={item.text}
            onChange={(e) => updateItem(index, 'text', e.target.value)}
            placeholder="Caption for this item (optional)"
          />

          {items.length > 2 && (
            <button onClick={() => removeItem(index)}>Remove</button>
          )}
        </div>
      ))}

      {items.length < 20 && (
        <button onClick={addItem}>Add Item</button>
      )}

      <button onClick={createCarousel} disabled={items.length < 2}>
        Create Carousel
      </button>
    </div>
  );
}
```

---

## Media Specifications

### Image Requirements

| Property | Specification |
|----------|--------------|
| **Format** | JPEG, PNG |
| **File Size** | 8 MB maximum |
| **Aspect Ratio** | 10:1 maximum |
| **Minimum Width** | 320px (scaled up if needed) |
| **Maximum Width** | 1440px (scaled down if needed) |
| **Color Space** | sRGB (auto-converted) |

### Video Requirements

| Property | Specification |
|----------|--------------|
| **Container** | MOV or MP4 (MPEG-4 Part 14) |
| **Video Codec** | HEVC or H264 |
| **Audio Codec** | AAC, 48khz max, mono or stereo |
| **Frame Rate** | 23-60 FPS |
| **Max Resolution** | 1920px horizontal |
| **Aspect Ratio** | 0.01:1 to 10:1 (9:16 recommended) |
| **Video Bitrate** | VBR, 100 Mbps maximum |
| **Audio Bitrate** | 128 kbps |
| **Duration** | 5 minutes maximum |
| **File Size** | 1 GB maximum |

---

## Complete Example - All Features

### Comprehensive Post with All Options

```javascript
const createComprehensivePost = async () => {
  const token = await getToken();

  // Example 1: Text post with link, GIF, and topic tag
  const textPost = await fetch('/api/threads/post', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Check out this amazing resource!",
      mediaType: "TEXT",
      linkAttachment: "https://docs.example.com",
      gifAttachment: {
        gifId: "12345678",
        provider: "TENOR"
      },
      topicTag: "LearnToCode"
    })
  });

  // Example 2: Image post with topic tag
  const imagePost = await fetch('/api/threads/post', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Sunset at the beach",
      mediaUrl: "https://example.com/sunset.jpg",
      mediaType: "IMAGE",
      topicTag: "Photography"
    })
  });

  // Example 3: Carousel with topic tag and overall text
  const carouselPost = await fetch('/api/threads/carousel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [
        {
          mediaUrl: "https://example.com/img1.jpg",
          mediaType: "IMAGE",
          text: "Before"
        },
        {
          mediaUrl: "https://example.com/img2.jpg",
          mediaType: "IMAGE",
          text: "After"
        }
      ],
      text: "Transformation Tuesday!",
      topicTag: "BeforeAndAfter"
    })
  });

  return {
    textPost: await textPost.json(),
    imagePost: await imagePost.json(),
    carouselPost: await carouselPost.json()
  };
};
```

---

## Error Handling

### Common Errors

```javascript
const postWithErrorHandling = async (postData) => {
  try {
    const response = await fetch('/api/threads/post', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.error) {
        case 'MissingText':
          console.error('Text is required');
          break;
        case 'ThreadsConnectionNotFound':
          console.error('Connect your Threads account first');
          break;
        case 'ThreadsPostFailed':
          if (error.message.includes('Rate limited')) {
            console.error('Rate limit reached. Try again later.');
          } else if (error.message.includes('Topic tag')) {
            console.error('Invalid topic tag format');
          } else if (error.message.includes('Link attachments')) {
            console.error('Link attachments only work with TEXT posts');
          }
          break;
        default:
          console.error('Unknown error:', error.message);
      }

      throw new Error(error.message);
    }

    return await response.json();
  } catch (err) {
    console.error('Failed to create post:', err.message);
    throw err;
  }
};
```

---

## Best Practices

### Topic Tags
1. ✅ Use relevant, discoverable tags
2. ✅ Keep tags concise (1-50 chars)
3. ❌ Don't use periods or ampersands
4. ❌ Don't include the # symbol (API adds it)

### Link Attachments
1. ✅ Use only with TEXT posts
2. ✅ Ensure URLs are publicly accessible
3. ✅ Use HTTPS URLs
4. ❌ Don't use with IMAGE/VIDEO/CAROUSEL posts

### GIF Attachments
1. ✅ Get GIF ID from Tenor API
2. ✅ Use only with TEXT posts
3. ✅ Combine with topic tags for better engagement
4. ❌ Can't use with link attachments (one or the other)

### Carousels
1. ✅ Use 3-7 items for best engagement
2. ✅ Mix images and videos for variety
3. ✅ Add captions to each item
4. ✅ Use topic tags for discoverability
5. ❌ Don't use TEXT mediaType for items (IMAGE/VIDEO only)
6. ❌ Don't exceed 20 items

### Media Files
1. ✅ Host on reliable servers (use CDN)
2. ✅ Use HTTPS URLs
3. ✅ Keep images under 8MB
4. ✅ Keep videos under 1GB and 5 minutes
5. ✅ Use recommended formats (JPEG/PNG, MP4/MOV)
6. ✅ Optimize for mobile viewing (9:16 aspect ratio)

---

## Rate Limits

| Action | Limit |
|--------|-------|
| **Posts** | 250 per 24 hours |
| **Deletes** | 100 per 24 hours |
| **Carousel posts** | Counts as 1 post (not N posts) |

**Note:** A 10-item carousel uses only 1/250 of your daily quota, making carousels very efficient!

---

## Summary

Your Threads integration now supports:

✅ **Single Posts:** TEXT, IMAGE, VIDEO
✅ **Carousel Posts:** 2-20 items with mixed media
✅ **Topic Tags:** Hashtags for discoverability
✅ **Link Attachments:** Preview cards for TEXT posts
✅ **GIF Attachments:** Tenor GIFs for TEXT posts
✅ **Media Support:** Images (8MB) and videos (1GB, 5min)
✅ **Rate Limits:** 250 posts/24h, 100 deletes/24h

All features follow the official Threads API specifications and are production-ready! 🎉

---

**Last Updated:** November 1, 2025
