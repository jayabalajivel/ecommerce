import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function testApiDelete() {
  const token = jwt.sign(
    { phone: '6374948477', role: 'admin' },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '1h' }
  );

  console.log('Sending DELETE request to /api/products/26...');
  
  const res = await fetch('http://localhost:3001/api/products/26', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Response Status:', res.status);
  const text = await res.text();
  console.log('Response Body:', text);
}

testApiDelete().catch(console.error);
