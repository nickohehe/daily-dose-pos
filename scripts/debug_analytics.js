
async function testAnalytics() {
    try {
        console.log('Testing period=today...');
        const res1 = await fetch('http://localhost:3000/api/admin/analytics?period=today');
        if (!res1.ok) {
            console.error('❌ Failed today:', res1.status, await res1.text());
        } else {
            console.log('✅ Today OK:', await res1.json());
        }

        console.log('\nTesting period=week...');
        const res2 = await fetch('http://localhost:3000/api/admin/analytics?period=week');
        if (!res2.ok) {
            console.error('❌ Failed week:', res2.status, await res2.text());
        } else {
            console.log('✅ Week OK:', await res2.json()); // Just snippet
        }

    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testAnalytics();
