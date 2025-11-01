// Debug script to check failed tweets and their error messages
const prisma = require('./src/lib/prisma');

async function checkFailedTweets() {
  try {
    console.log('Fetching failed tweets...\n');

    const failedTweets = await prisma.scheduledTweet.findMany({
      where: {
        status: 'FAILED'
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    });

    if (failedTweets.length === 0) {
      console.log('No failed tweets found.');
      return;
    }

    console.log(`Found ${failedTweets.length} failed tweets:\n`);
    console.log('='.repeat(80));

    failedTweets.forEach((tweet, index) => {
      console.log(`\n[${index + 1}] Tweet ID: ${tweet.id}`);
      console.log(`Provider: ${tweet.provider}`);
      console.log(`Scheduled: ${tweet.scheduledAt}`);
      console.log(`Updated: ${tweet.updatedAt}`);
      console.log(`Text: ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}`);
      console.log(`Error: ${tweet.errorMessage || 'No error message'}`);
      console.log('-'.repeat(80));
    });

    // Also check failed threads
    console.log('\n\nFetching failed threads...\n');

    const failedThreads = await prisma.scheduledThread.findMany({
      where: {
        status: 'FAILED'
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    if (failedThreads.length === 0) {
      console.log('No failed threads found.');
    } else {
      console.log(`Found ${failedThreads.length} failed threads:\n`);
      console.log('='.repeat(80));

      failedThreads.forEach((thread, index) => {
        console.log(`\n[${index + 1}] Thread ID: ${thread.id}`);
        console.log(`Provider: ${thread.provider}`);
        console.log(`Scheduled: ${thread.scheduledAt}`);
        console.log(`Updated: ${thread.updatedAt}`);
        console.log(`Tweets in thread: ${thread.tweets.length}`);
        console.log(`First tweet: ${thread.tweets[0]?.substring(0, 100)}${thread.tweets[0]?.length > 100 ? '...' : ''}`);
        console.log(`Error: ${thread.errorMessage || 'No error message'}`);
        console.log('-'.repeat(80));
      });
    }

  } catch (error) {
    console.error('Error fetching failed tweets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFailedTweets();
