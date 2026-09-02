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
  /*
    current  -> data.current.{temperature_2m, weather_code, wind_speed_10m}
    daily    -> data.daily.{time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum}
    each daily field is a parallel array — data.daily.time[0] pairs with data.daily.temperature_2m_max[0], etc.
  */
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  const response = await fetch(url);
  const data = await response.json();

  console.log(data);

  return data;
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
    console.log('here are the cords:', coords);

    const forecast = await getForecast(coords.latitude, coords.longitude);
    console.log('here is the forcast:', forecast);
  } catch (error) {
    // catches a bad city name from getCoordinates or a network failure from either fetch
    console.log(error.message);
  }
});
