//grab the user input and button from index.html
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

//look up a city's coordinates using Open-Meteo's geocoding API
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

  // await pauses here until fetch resolves, then again until the body is parsed as JSON
  const response = await fetch(url);
  const data = await response.json();

  console.log(data);

  // throwing rejects the promise this async function returns — callers catch it with try/catch
  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for "${city}"`);
  }

  // pick just the fields we need off the first match, ignore the rest
  const { latitude, longitude, name, country } = data.results[0];
  return { latitude, longitude, name, country };
}

//fetch the current weather for a set of coordinates using Open-Meteo's forecast API
async function getForecast(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

  const response = await fetch(url);
  const data = await response.json();

  console.log(data);

  // only current_weather is used for now; the rest of the response (hourly/daily) is unused
  return data.current_weather;
}
//add a click listener to the search button
searchButton.addEventListener('click', async () => {
  const city = searchInput.value.trim();

  if (!city) {
    console.log('please enter a city...');
    return;
  }
  try {
    // geocode first, then use those coordinates to fetch the forecast — each step depends on the last
    const coords = await getCoordinates(city);
    console.log(coords);

    const forecast = await getForecast(coords.latitude, coords.longitude);
    console.log(forecast);
  } catch (error) {
    // catches a bad city name from getCoordinates or a network failure from either fetch
    console.log(error.message);
  }
});
