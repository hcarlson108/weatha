//grab the user input and button from index.html
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

//object with keys that hold a nested object
const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
};

//function to get weather infor
function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: 'unknown', icon: '?' };
}

//converts Celsius to Fahrenheit, rounded to the nearest whole degree
function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9) / 5 + 32);
}

//picks a random funny caption for the current conditions — weather code wins over
//temperature (rain feels gloomy whether it's 50 or 80 out), temperature only decides
//the vibe when skies are clear/partly cloudy/overcast
function getWeatherVibe(weatherCode, fahrenheit) {
  const pick = (options) => options[Math.floor(Math.random() * options.length)];

  // shared message pools, one per vibe — several weather codes can point at the same pool
  // (e.g. light and moderate drizzle both feel "gloomby") without duplicating the lines
  const VIBE_POOLS = {
    thunderstorm: [
      "thor's throwin hands out there lol",
      'Zeus is for sure in the bathroom rn',
      'stay inside.. get cozy',
      'the sky is definitely mad about something aha',
    ],
    lightSnow: [
      'snow day szn, go be a menace',
      'frosty out here, bundle up champ',
      "winter's really testing us today",
      "sky's sprinkling powdered sugar",
    ],
    heavySnow: [
      'full blizzard cosplay outside',
      'the sky is just dumping glitter on us',
      'build a snowman or stay in bed, no in between',
      "mother nature said 'let it snow' and meant it",
    ],
    rain: [
      'gloomby..',
      "the sky's just having a cry rn",
      'grab an umbrella or just get built different',
      'moody weather, moodier playlist',
    ],
    heavyRain: [
      "it's not raining, the sky's just leaking",
      'puddle jumping weather, embrace it',
      'soggy socks incoming',
      'the clouds are absolutely sobbing',
    ],
    fog: [
      "can't see nothin but vibes",
      'spooky little fog moment',
      'mysterious weather arc unlocked',
      "the world's just one big soft-focus filter today",
    ],
    cloudy: [
      'moody out, kinda love it aha',
      "sun's playing hide n seek",
      'time to read',
      'the sun called out sick, time to get a big mac and cry',
    ],
  };

  const CODE_TO_VIBE_POOL = {
    95: 'thunderstorm',
    71: 'lightSnow',
    73: 'lightSnow',
    75: 'heavySnow',
    51: 'rain',
    53: 'rain',
    55: 'rain',
    61: 'rain',
    63: 'rain',
    80: 'rain',
    65: 'heavyRain',
    45: 'fog',
    48: 'fog',
    2: 'cloudy',
    3: 'cloudy',
  };

  const vibePool = CODE_TO_VIBE_POOL[weatherCode];
  if (vibePool) {
    return pick(VIBE_POOLS[vibePool]);
  }

  if (fahrenheit >= 95) {
    return pick([
      "it's basically the sun's front yard out there",
      'melt-your-face hot, stay hydrated',
      'hot enough to fry an egg on the sidewalk',
    ]);
  }
  if (fahrenheit >= 85) {
    return pick([
      "omg it's dang toasty out here, don't forget water",
      "summer's really flexing today aha",
      'sweaty..',
    ]);
  }
  if (fahrenheit >= 70) {
    return pick([
      "omg.. it's.. perfect",
      'certified ten out of ten weather',
      'put this weather in a museum aha',
    ]);
  }
  if (fahrenheit >= 60) {
    return pick([
      "get out that hypebeast sweatshirt, we've made it..",
      'pretty solid ngl',
      'this is it.',
    ]);
  }
  if (fahrenheit >= 45) {
    return pick([
      'a lil nippy, grab a hoodie',
      "where's my supa suit",
      'brisk but respectable',
    ]);
  }
  if (fahrenheit >= 32) {
    return pick([
      'nosedrippings will soon be chopsticks',
      'brrrr',
      'chilly but not for this guy',
    ]);
  }
  return pick([
    'arctic conditions.. time to man up',
    'your face will regret going outside',
    'penguins would feel at home rn.. lol',
  ]);
}

//turns an ISO date string (e.g. "2026-09-11") into a weekday name (e.g. "Thursday")
function getDayName(dateString) {
  // appending T00:00:00 (no Z) parses it as local time, not UTC — avoids the
  // date shifting a day backwards for users behind UTC
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=16&wind_speed_unit=mph`;

  const response = await fetch(url);
  const data = await response.json();

  console.log(data);

  return data;
}

//write current conditions into the #current container
function renderCurrent(data) {
  const { name, temperature, weatherCode, wind } = data;
  const { label, icon } = getWeatherInfo(weatherCode);

  const fahrenheit = celsiusToFahrenheit(temperature);

  document.getElementById('current').hidden = false;
  document.getElementById('current-city').textContent = name;
  document.getElementById('current-temp').innerHTML =
    `${fahrenheit}°F <span class="temp-secondary">${temperature}°C</span>`;
  document.getElementById('current-condition').textContent = `${icon} ${label}`;
  document.getElementById('current-wind').textContent = `Wind: ${wind} mph`;
  document.getElementById('current-vibe').textContent = getWeatherVibe(
    weatherCode,
    fahrenheit,
  );
}

//build a day-card for each entry in the daily arrays and append them into #forecast
function renderForecast(dailyData) {
  const {
    time,
    weather_code,
    temperature_2m_max,
    temperature_2m_min,
    precipitation_sum,
  } = dailyData;
  const forecastContainer = document.getElementById('forecast');

  time.forEach((date, i) => {
    const { label, icon } = getWeatherInfo(weather_code[i]);
    const card = document.createElement('div');

    card.className = 'day-card';
    card.innerHTML = `
      <p>${getDayName(date)}</p>
      <p>${date}</p>
      <p>${icon} ${label}</p>
      <p>High: ${celsiusToFahrenheit(temperature_2m_max[i])}°F <span class="temp-secondary">${temperature_2m_max[i]}°C</span></p>
      <p>Low: ${celsiusToFahrenheit(temperature_2m_min[i])}°F <span class="temp-secondary">${temperature_2m_min[i]}°C</span></p>
      <p>Precip: ${precipitation_sum[i]} mm</p>
    `;
    forecastContainer.appendChild(card);
  });
}

//blank out old results so repeated searches don't stack on top of each other
function clearResults() {
  document.getElementById('current-city').textContent = '';
  document.getElementById('current-temp').textContent = '';
  document.getElementById('current-condition').textContent = '';
  document.getElementById('current-wind').textContent = '';
  document.getElementById('current-vibe').textContent = '';
  document.getElementById('forecast').innerHTML = '';
}

//two functions to hide the loading element
function showLoading() {
  document.getElementById('loading').hidden = false;
}

function hideLoading() {
  document.getElementById('loading').hidden = true;
}

//add a click listener to the search button and grab input value
searchButton.addEventListener('click', async () => {
  const city = searchInput.value.trim();

  if (!city) {
    console.log('Oops, try again...');
    return;
  }

  clearResults();
  showLoading();

  try {
    // geocode first, then use those coordinates to fetch the forecast — each step depends on the last
    const coords = await getCoordinates(city);
    const forecast = await getForecast(coords.latitude, coords.longitude);

    renderCurrent({
      name: coords.name,
      temperature: forecast.current.temperature_2m,
      weatherCode: forecast.current.weather_code,
      wind: forecast.current.wind_speed_10m,
    });

    renderForecast(forecast.daily);
  } catch (error) {
    // catches a bad city name from getCoordinates or a network failure from either fetch
    console.log(error.message);
  } finally {
    hideLoading();
  }
});
