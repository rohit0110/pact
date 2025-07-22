const BASE_URL = 'http://10.0.2.2:3000';

export const fetchPacts = async (pubkey: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/players/${pubkey}/pacts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch pacts:", e);
    throw e;
  }
};

export const fetchAllPacts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/pacts/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch pact details:", e);
    throw e;
  }
};
