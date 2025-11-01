# Threading Comparison: X vs Threads

## Overview

Both X (Twitter) and Threads support multi-post content, but they use **completely different mechanisms**:

- **X**: Sequential reply-based threads (one tweet replies to the previous)
- **Threads**: Carousel posts (all items bundled and published together)

---

## X (Twitter) Threading

### Mechanism
Posts are created sequentially, with each tweet replying to the previous one using `in_reply_to_tweet_id`.

### API Flow
```javascript
// Post first tweet
POST /2/tweets
{
  "text": "First tweet in thread"
}
// Response: { data: { id: "123" } }

// Post second tweet (replies to first)
POST /2/tweets
{
  "text": "Second tweet in thread",
  "reply": {
    "in_reply_to_tweet_id": "123"
  }
}
// Response: { data: { id: "456" } }

// Post third tweet (replies to second)
POST /2/tweets
{
  "text": "Third tweet in thread",
  "reply": {
    "in_reply_to_tweet_id": "456"
  }
}
```

### Characteristics
- ✅ Each tweet is a **separate post** with its own ID and URL
- ✅ Tweets appear **chronologically** in the timeline
- ✅ Users can like, reply to, or retweet **individual tweets** in the thread
- ✅ **No limit** on thread length (technically unlimited)
- ✅ Tweets are posted **sequentially** (one after another)
- ⚠️ If a middle tweet fails, the thread is **broken**
- ⚠️ Thread can be **interrupted** by other users replying

### Usage Example
```javascript
const result = await xService.postThread(accessToken, [
  "1/5 Thread about API design...",
  "2/5 First principle: Keep it simple",
  "3/5 Second principle: Be consistent",
  "4/5 Third principle: Document everything",
  "5/5 That's all folks!"
]);

// Returns:
{
  success: true,
  tweets: [
    { data: { id: "123", text: "1/5 Thread about..." } },
    { data: { id: "456", text: "2/5 First principle..." } },
    { data: { id: "789", text: "3/5 Second principle..." } },
    { data: { id: "012", text: "4/5 Third principle..." } },
    { data: { id: "345", text: "5/5 That's all folks!" } }
  ],
  threadId: "123", // ID of first tweet
  count: 5
}
```

---

## Threads Carousel Posts

### Mechanism
All items are created as media containers first, then bundled into a carousel and published as a **single post**.

### API Flow
```javascript
// Step 1: Create first carousel item
POST /v1.0/{user-id}/threads
{
  "media_type": "TEXT",
  "text": "First slide",
  "is_carousel_item": true
}
// Response: { id: "creation_id_1" }

// Step 2: Create second carousel item
POST /v1.0/{user-id}/threads
{
  "media_type": "TEXT",
  "text": "Second slide",
  "is_carousel_item": true
}
// Response: { id: "creation_id_2" }

// Step 3: Create carousel container
POST /v1.0/{user-id}/threads
{
  "media_type": "CAROUSEL",
  "children": "creation_id_1,creation_id_2"
}
// Response: { id: "carousel_creation_id" }

// Step 4: Publish the carousel
POST /v1.0/{user-id}/threads_publish
{
  "creation_id": "carousel_creation_id"
}
// Response: { id: "published_post_id" }
```

### Characteristics
- ✅ **Single post** with multiple swipeable items
- ✅ All items published **atomically** (all or nothing)
- ✅ **2-20 items** per carousel (enforced by API)
- ✅ User swipes/scrolls through items in the **same post**
- ✅ Likes/comments apply to the **entire carousel**, not individual items
- ✅ **Cleaner timeline** (one post instead of multiple)
- ⚠️ Cannot add items after publishing
- ⚠️ More complex API calls (4 steps vs 1 per tweet)

### Usage Example
```javascript
const result = await threadsService.createCarousel(accessToken, [
  {
    text: "Slide 1: Introduction to our product",
    mediaType: "TEXT"
  },
  {
    text: "Slide 2: Key features",
    mediaUrl: "https://example.com/image1.jpg",
    mediaType: "IMAGE"
  },
  {
    text: "Slide 3: Pricing",
    mediaType: "TEXT"
  },
  {
    text: "Slide 4: Get started today!",
    mediaUrl: "https://example.com/video.mp4",
    mediaType: "VIDEO"
  }
]);

// Returns:
{
  success: true,
  data: {
    id: "published_post_id",
    carousel_creation_id: "carousel_creation_id",
    child_media_ids: ["id1", "id2", "id3", "id4"],
    item_count: 4
  }
}
```

---

## Side-by-Side Comparison

| Feature | X Threads | Threads Carousels |
|---------|-----------|-------------------|
| **Publishing** | Sequential (one by one) | Atomic (all together) |
| **API Calls** | N calls for N tweets | 2N + 2 calls for N items |
| **Post Count** | N separate posts | 1 post with N items |
| **Individual URLs** | ✅ Each tweet has unique URL | ❌ Only carousel has URL |
| **Individual Engagement** | ✅ Like/reply to each tweet | ❌ Engagement on whole post |
| **Length Limit** | Unlimited | 2-20 items |
| **Timeline Impact** | N posts in timeline | 1 post in timeline |
| **User Experience** | Scroll down to read | Swipe left/right |
| **Failure Handling** | Partial thread possible | All or nothing |
| **Editing After** | Can continue thread | Cannot add items |
| **Media Support** | Text + 1 media per tweet | Text/image/video per item |

---

## When to Use Each

### Use X Threads When:
- ✅ Writing long-form content or essays
- ✅ You want each point to be individually shareable
- ✅ Chronological storytelling (news updates, live threads)
- ✅ You want to allow replies between tweets
- ✅ No specific length limit needed
- ✅ Content may be expanded later

### Use Threads Carousels When:
- ✅ Creating visual galleries or portfolios
- ✅ Step-by-step tutorials or guides
- ✅ Product showcases with multiple angles
- ✅ Before/after comparisons
- ✅ Want cleaner timeline presence
- ✅ Fixed set of related items (2-20)
- ✅ All content is ready to publish at once

---

## API Endpoint Comparison

### X (Twitter) API

**Endpoint:** `POST /api/x/thread`

**Request:**
```json
{
  "tweets": [
    "First tweet in thread",
    "Second tweet in thread",
    "Third tweet in thread"
  ]
}
```

**Implementation:**
```javascript
// backend/src/services/x.service.js
async function postThread(accessToken, tweets) {
  const postedTweets = [];
  let previousTweetId = null;

  for (const text of tweets) {
    const body = { text };

    // Reply to previous tweet
    if (previousTweetId) {
      body.reply = { in_reply_to_tweet_id: previousTweetId };
    }

    const response = await axios.post(`${X_API_BASE}/tweets`, body, {
      headers: authHeaders(accessToken)
    });

    postedTweets.push(response.data);
    previousTweetId = response.data.data.id;
  }

  return { tweets: postedTweets, threadId: postedTweets[0].data.id };
}
```

---

### Threads API

**Endpoint:** `POST /api/threads/carousel`

**Request:**
```json
{
  "items": [
    {
      "text": "First slide",
      "mediaType": "TEXT"
    },
    {
      "text": "Second slide with image",
      "mediaUrl": "https://example.com/image.jpg",
      "mediaType": "IMAGE"
    },
    {
      "text": "Third slide",
      "mediaType": "TEXT"
    }
  ]
}
```

**Implementation:**
```javascript
// backend/src/services/threads.service.js
async function createCarousel(accessToken, items) {
  const userId = (await getMe(accessToken)).data.id;
  const childMediaIds = [];

  // Step 1: Create each carousel item
  for (const item of items) {
    const response = await axios.post(
      `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads`,
      null,
      {
        params: {
          media_type: item.mediaType || 'TEXT',
          text: item.text,
          is_carousel_item: true,
          image_url: item.mediaType === 'IMAGE' ? item.mediaUrl : undefined,
          video_url: item.mediaType === 'VIDEO' ? item.mediaUrl : undefined,
          access_token: accessToken
        }
      }
    );
    childMediaIds.push(response.data.id);
  }

  // Step 2: Create carousel container
  const carouselResponse = await axios.post(
    `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads`,
    null,
    {
      params: {
        media_type: 'CAROUSEL',
        children: childMediaIds.join(','),
        access_token: accessToken
      }
    }
  );

  // Step 3: Publish carousel
  const publishResponse = await axios.post(
    `${THREADS_GRAPH_API_BASE}/v1.0/${userId}/threads_publish`,
    null,
    {
      params: {
        creation_id: carouselResponse.data.id,
        access_token: accessToken
      }
    }
  );

  return {
    success: true,
    data: {
      id: publishResponse.data.id,
      carousel_creation_id: carouselResponse.data.id,
      child_media_ids: childMediaIds,
      item_count: items.length
    }
  };
}
```

---

## Rate Limits

| Platform | Post Limit | Notes |
|----------|-----------|-------|
| **X (Free Tier)** | 50 tweets/24h | Each tweet in thread counts separately |
| **X (Basic Tier)** | 3,000 tweets/24h | Same as above |
| **Threads** | 250 posts/24h | Each carousel counts as **1 post** |

**Example:** A 10-item thread on X uses 10 of your quota, but a 10-item carousel on Threads uses only 1.

---

## Error Handling

### X Threads
```javascript
// If tweet 3 of 5 fails, you have tweets 1-2 posted but 3-5 failed
// You need to handle partial threads
try {
  const result = await xService.postThread(accessToken, tweets);
} catch (error) {
  // Check result.tweets to see how many succeeded
  console.error(`Failed at tweet ${result.tweets.length + 1}`);
}
```

### Threads Carousels
```javascript
// All-or-nothing: if any step fails, no post is published
try {
  const result = await threadsService.createCarousel(accessToken, items);
} catch (error) {
  // Either full carousel is posted or nothing
  console.error('Carousel creation failed:', error.message);
}
```

---

## Best Practices

### X Threads
1. ✅ Number your tweets (1/N, 2/N, etc.)
2. ✅ Make the first tweet self-contained (it's the most visible)
3. ✅ Keep each tweet valuable on its own
4. ✅ Use thread breaks for readability
5. ✅ Add a conclusion tweet with CTA
6. ⚠️ Don't exceed 280 characters per tweet

### Threads Carousels
1. ✅ Use 3-7 items for best engagement (not too short, not too long)
2. ✅ Put the hook in the first item
3. ✅ Make each item visually distinct
4. ✅ End with a CTA or conclusion
5. ✅ Mix text and media for variety
6. ⚠️ Keep within 2-20 item limit
7. ⚠️ Ensure all content is ready before publishing

---

## Summary

**Different names, different concepts:**

- **X "thread"** = Multiple individual tweets connected by replies
- **Threads "carousel"** = Single post with multiple swipeable items

Both allow multi-part content, but serve different purposes and user experiences. Choose based on your content type and engagement goals!

---

## Testing

### Test X Thread
```bash
curl -X POST http://localhost:3000/api/x/thread \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tweets": [
      "Thread test 1/3: Introduction",
      "Thread test 2/3: Body",
      "Thread test 3/3: Conclusion"
    ]
  }'
```

### Test Threads Carousel
```bash
curl -X POST http://localhost:3000/api/threads/carousel \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "text": "Carousel slide 1", "mediaType": "TEXT" },
      { "text": "Carousel slide 2", "mediaType": "TEXT" },
      { "text": "Carousel slide 3", "mediaType": "TEXT" }
    ]
  }'
```

---

**Last Updated:** November 1, 2025
