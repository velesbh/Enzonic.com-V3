// Use built-in fetch (Node.js 18+)
const SEARXNG_BASE_URL = 'https://searx.be';

async function testSearXNG() {
  console.log('Testing SearXNG instance...');
  
  try {
    // Test 1: Check if the homepage is accessible
    console.log('\n1. Testing homepage access...');
    const homeResponse = await fetch(SEARXNG_BASE_URL);
    console.log(`Homepage status: ${homeResponse.status}`);
    
    // Test 2: Try a simple search with GET method
    console.log('\n2. Testing GET search...');
    const getParams = new URLSearchParams({
      q: 'test',
      format: 'json'
    });
    
    const getResponse = await fetch(`${SEARXNG_BASE_URL}/?${getParams.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    console.log(`GET search status: ${getResponse.status}`);
    console.log(`Content-Type: ${getResponse.headers.get('content-type')}`);
    
    if (getResponse.ok) {
      const contentType = getResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await getResponse.json();
        console.log(`Results found: ${data.results?.length || 0}`);
      } else {
        const text = await getResponse.text();
        console.log(`Received HTML response (length: ${text.length})`);
      }
    } else {
      const errorText = await getResponse.text();
      console.log(`Error response: ${errorText.substring(0, 200)}`);
    }
    
    // Test 3: Try POST to /search endpoint
    console.log('\n3. Testing POST to /search...');
    const postParams = new URLSearchParams({
      q: 'test',
      format: 'json'
    });
    
    const postResponse = await fetch(`${SEARXNG_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      body: postParams.toString()
    });
    
    console.log(`POST search status: ${postResponse.status}`);
    console.log(`Content-Type: ${postResponse.headers.get('content-type')}`);
    
    if (postResponse.ok) {
      const contentType = postResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await postResponse.json();
        console.log(`Results found: ${data.results?.length || 0}`);
      } else {
        const text = await postResponse.text();
        console.log(`Received HTML response (length: ${text.length})`);
      }
    } else {
      const errorText = await postResponse.text();
      console.log(`Error response: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSearXNG();