# Threads Carousel API - Quick Usage Guide

## Overview

The Threads Carousel API allows you to create multi-item posts (2-20 items) that users can swipe through. Unlike X threads, all items are published together as a single post.

---

## API Endpoint

**POST** `/api/threads/carousel`

**Authentication:** Required (Clerk Bearer token)

**Content-Type:** `application/json`

---

## Request Format

```json
{
  "items": [
    {
      "text": "First slide text",
      "mediaType": "TEXT"
    },
    {
      "text": "Second slide with image",
      "mediaUrl": "https://example.com/image.jpg",
      "mediaType": "IMAGE"
    },
    {
      "text": "Third slide with video",
      "mediaUrl": "https://example.com/video.mp4",
      "mediaType": "VIDEO"
    }
  ]
}
```

---

## Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | ✅ Yes | Text content for the item (max 500 chars) |
| `mediaUrl` | string | ❌ No | URL to image or video (must be publicly accessible) |
| `mediaType` | string | ❌ No | One of: `TEXT`, `IMAGE`, `VIDEO` (default: `TEXT`) |

---

## Validation Rules

- ✅ **Minimum items:** 2
- ✅ **Maximum items:** 20
- ✅ Each item **must have** a `text` field
- ✅ `mediaUrl` is optional (text-only items are allowed)
- ✅ If `mediaUrl` is provided, `mediaType` should match the content
- ✅ User must have an active Threads connection

---

## Response Format

### Success (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "17890123456789",
    "carousel_creation_id": "17890123456788",
    "child_media_ids": [
      "17890123456780",
      "17890123456781",
      "17890123456782"
    ],
    "item_count": 3
  }
}
```

### Error Responses

#### Missing Items Array (400)
```json
{
  "error": "MissingItems",
  "message": "items must be an array"
}
```

#### Too Few Items (400)
```json
{
  "error": "InvalidItems",
  "message": "Carousel requires at least 2 items"
}
```

#### Too Many Items (400)
```json
{
  "error": "InvalidItems",
  "message": "Carousel can have maximum 20 items"
}
```

#### Item Missing Text (400)
```json
{
  "error": "InvalidItems",
  "message": "Item 2 is missing required 'text' field"
}
```

#### No Threads Connection (404)
```json
{
  "error": "ThreadsConnectionNotFound"
}
```

#### Rate Limited (500)
```json
{
  "error": "ThreadsCarouselFailed",
  "message": "Rate limited by Threads API (retry after: 3600). Post limit: 250/24h"
}
```

---

## Usage Examples

### Example 1: Text-Only Carousel

```bash
curl -X POST http://localhost:3000/api/threads/carousel \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "text": "1/3: Introduction to our product",
        "mediaType": "TEXT"
      },
      {
        "text": "2/3: Key features and benefits",
        "mediaType": "TEXT"
      },
      {
        "text": "3/3: Get started today!",
        "mediaType": "TEXT"
      }
    ]
  }'
```

### Example 2: Mixed Media Carousel

```bash
curl -X POST http://localhost:3000/api/threads/carousel \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "text": "Check out our new collection!",
        "mediaType": "TEXT"
      },
      {
        "text": "Product shot 1",
        "mediaUrl": "https://example.com/product1.jpg",
        "mediaType": "IMAGE"
      },
      {
        "text": "Product shot 2",
        "mediaUrl": "https://example.com/product2.jpg",
        "mediaType": "IMAGE"
      },
      {
        "text": "See it in action!",
        "mediaUrl": "https://example.com/demo.mp4",
        "mediaType": "VIDEO"
      }
    ]
  }'
```

### Example 3: JavaScript/Node.js

```javascript
const createCarousel = async (items) => {
  const response = await fetch('http://localhost:3000/api/threads/carousel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Carousel creation failed: ${error.message}`);
  }

  return await response.json();
};

// Usage
const result = await createCarousel([
  { text: "Slide 1: Introduction", mediaType: "TEXT" },
  { text: "Slide 2: Details", mediaType: "TEXT" },
  { text: "Slide 3: Call to action", mediaType: "TEXT" }
]);

console.log('Carousel posted with ID:', result.data.id);
```

### Example 4: React Component

```jsx
import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

function CarouselCreator() {
  const { getToken } = useAuth();
  const [items, setItems] = useState([
    { text: '', mediaType: 'TEXT' },
    { text: '', mediaType: 'TEXT' }
  ]);
  const [loading, setLoading] = useState(false);

  const createCarousel = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/threads/carousel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      alert(`Carousel posted! ID: ${result.data.id}`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (items.length < 20) {
      setItems([...items, { text: '', mediaType: 'TEXT' }]);
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

  return (
    <div>
      <h2>Create Threads Carousel</h2>
      {items.map((item, index) => (
        <div key={index}>
          <h3>Slide {index + 1}</h3>
          <textarea
            value={item.text}
            onChange={(e) => updateItem(index, 'text', e.target.value)}
            placeholder="Enter text..."
          />
          <select
            value={item.mediaType}
            onChange={(e) => updateItem(index, 'mediaType', e.target.value)}
          >
            <option value="TEXT">Text Only</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
          </select>
          {item.mediaType !== 'TEXT' && (
            <input
              type="text"
              value={item.mediaUrl || ''}
              onChange={(e) => updateItem(index, 'mediaUrl', e.target.value)}
              placeholder="Media URL..."
            />
          )}
          {items.length > 2 && (
            <button onClick={() => removeItem(index)}>Remove</button>
          )}
        </div>
      ))}

      {items.length < 20 && (
        <button onClick={addItem}>Add Slide</button>
      )}

      <button onClick={createCarousel} disabled={loading}>
        {loading ? 'Posting...' : 'Post Carousel'}
      </button>
    </div>
  );
}
```

---

## Best Practices

### Content Strategy
1. **Hook in the first item** - Make it compelling to encourage swiping
2. **Optimal length:** 3-7 items for best engagement
3. **Visual variety:** Mix text-only and media items
4. **Clear progression:** Number your slides (1/5, 2/5, etc.)
5. **Strong CTA:** End with a clear call-to-action

### Technical Tips
1. **Pre-validate items** before making the API call
2. **Check Threads connection** exists before attempting to post
3. **Handle rate limits** gracefully (250 posts/24h)
4. **Use public URLs** for media (must be accessible to Threads servers)
5. **Keep text concise** (500 chars max per item recommended)
6. **Test with 2-3 items** first before creating longer carousels

### Media Requirements
- **Images:** JPG, PNG (max 8MB recommended)
- **Videos:** MP4, MOV (max 100MB, up to 60 seconds)
- **URLs must be HTTPS** and publicly accessible
- **Media must be hosted** on reliable servers

---

## Rate Limits

- **Posts:** 250 per 24 hours (each carousel counts as 1 post)
- **Deletes:** 100 per 24 hours
- **Rate limit headers:** Check `retry-after` in error responses

**Note:** A 10-item carousel uses only **1** of your daily quota, making carousels very efficient!

---

## Comparison with X Threads

| Feature | Threads Carousel | X Thread |
|---------|------------------|----------|
| **Items** | 2-20 items | Unlimited tweets |
| **Publishing** | Atomic (all at once) | Sequential (one by one) |
| **Timeline** | 1 post | N posts |
| **Engagement** | Shared across carousel | Individual per tweet |
| **Rate Limit** | 1 quota | N quota |
| **User Experience** | Swipe left/right | Scroll down |
| **Best For** | Visual stories, galleries | Long-form thoughts, news |

See [THREADS_VS_X_COMPARISON.md](THREADS_VS_X_COMPARISON.md) for detailed comparison.

---

## Troubleshooting

### "ThreadsConnectionNotFound"
**Solution:** User needs to connect their Threads account first via OAuth
```javascript
// Redirect to OAuth flow
window.location.href = '/api/auth/threads';
```

### "Rate limited by Threads API"
**Solution:** Wait until the `retry-after` time passes
```javascript
if (error.message.includes('retry after')) {
  const retryAfter = extractRetryAfter(error.message); // Parse from message
  console.log(`Wait ${retryAfter} seconds before retrying`);
}
```

### "Carousel item creation failed"
**Solution:** Check that:
- Media URLs are publicly accessible (HTTPS)
- Media files are in supported formats
- File sizes are within limits
- All items have valid text

### "Invalid or expired OAuth state"
**Solution:** User's session expired during OAuth flow
- Restart the OAuth flow from the beginning
- Check that cookies/localStorage are enabled

---

## Complete Working Example

```javascript
// Complete end-to-end carousel posting example
import { useAuth } from '@clerk/clerk-react';

const postCarousel = async () => {
  try {
    const { getToken } = useAuth();
    const token = await getToken();

    // Check if user has Threads connection
    const connectionResponse = await fetch('/api/threads/connection', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!connectionResponse.ok) {
      console.error('No Threads connection. Redirecting to OAuth...');
      window.location.href = '/api/auth/threads';
      return;
    }

    // Create carousel
    const items = [
      { text: "🎉 Exciting announcement!", mediaType: "TEXT" },
      {
        text: "Check out this amazing product!",
        mediaUrl: "https://example.com/product.jpg",
        mediaType: "IMAGE"
      },
      { text: "Link in bio to learn more!", mediaType: "TEXT" }
    ];

    const response = await fetch('/api/threads/carousel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Success! Carousel ID:', result.data.id);
    console.log('Posted', result.data.item_count, 'items');

    return result;
  } catch (error) {
    console.error('Failed to post carousel:', error.message);
    throw error;
  }
};
```

---

## Next Steps

1. ✅ Connect Threads account via OAuth
2. ✅ Test with 2-3 text-only items
3. ✅ Add images/videos to items
4. ✅ Implement frontend UI for carousel creation
5. ✅ Add carousel scheduling (future feature)

---

**Last Updated:** November 1, 2025
