const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { ethers } = require('ethers');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const baseURL = 'https://b2b-api.staging-riseworks.io/v1';
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY);

// Basic authentication route
app.get('/auth/basic', async (req, res) => {
  try {
    const getResp = await axios.get(`${baseURL}/auth/api/siwe`, {
      params: { wallet: wallet.address }
    });
    const { message, wallet: returnedWallet } = getResp.data.data;
    if (returnedWallet.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Invalid wallet returned by API');
    }
    const signature = await wallet.signMessage(message);
    const postResp = await axios.post(`${baseURL}/auth/api/siwe`, {
      wallet: wallet.address,
      message,
      signature
    });
    const token = postResp.data.data.token;
    return res.json({ token });
  } catch (err) {
    console.error('Basic auth error:', err);
    return res.status(500).json({ error: err.toString() });
  }
});

// Impersonation authentication route
app.get('/auth/impersonate', async (req, res) => {
  try {
    const { RISE_ID, RISE_IMPERSONATE_EMAIL } = process.env;
    if (!RISE_ID || !RISE_IMPERSONATE_EMAIL) {
      return res.status(400).json({ error: 'Missing RISE_ID or RISE_IMPERSONATE_EMAIL in environment' });
    }
    const getResp = await axios.get(`${baseURL}/auth/api/siwe`, {
      params: {
        wallet: wallet.address,
        rise_id: RISE_ID,
        impersonate: RISE_IMPERSONATE_EMAIL
      }
    });
    const { message, wallet: returnedWallet } = getResp.data.data;
    if (returnedWallet.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Invalid wallet returned by API');
    }
    const signature = await wallet.signMessage(message);
    const postResp = await axios.post(`${baseURL}/auth/api/siwe`, {
      wallet: wallet.address,
      message,
      signature
    });
    const token = postResp.data.data.token;
    return res.json({ token });
  } catch (err) {
    console.error('Impersonation auth error:', err);
    return res.status(500).json({ error: err.toString() });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
