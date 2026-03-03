
const axios = require('axios');

async function test() {
    try {
        const response = await axios.post('http://localhost:5000/api/v1/user/login', {
            email: 'test@example.com',
            password: 'wrong'
        });
        console.log('Success:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Error Response:', error.response.status, error.response.data);
        } else {
            console.log('Network Error:', error.message);
        }
    }
}

test();
