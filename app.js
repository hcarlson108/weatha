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
      "the world's just one big soft focus filter today",
    ],
    cloudy: [
      'moody out, kinda love it aha',
      "sun's playing hide n seek",
      'time to read',
      'the sun called out sick..',
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

//turns an ISO date string (e.g. "2026-09-11") into "Sep 11"
function getMonthDay(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

//shared geocoding call — count controls how many matches come back
//(1 for a direct search, more for the autocomplete dropdown)
async function geocodeCity(city, count) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=${count}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.results || [];
}

//look up a city's coordinates using Open-Meteo's geocoding API
async function getCoordinates(city) {
  const results = await geocodeCity(city, 1);

  // throwing rejects the promise this async function returns — callers catch it with try/catch
  if (results.length === 0) {
    throw new Error(`No results found for "${city}"`);
  }

  // pick just the fields we need off the first match, ignore the rest
  const { latitude, longitude, name, admin1, country } = results[0];
  return { latitude, longitude, name, admin1, country };
}

//maps full US state names (as returned in admin1) to their two-letter abbreviation
const US_STATE_ABBREVIATIONS = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX',
  Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
};

//builds the city label shown on the current-conditions card — appends
//", ST" for US results with a mapped state; otherwise just the city name
function formatCityLabel({ name, admin1, country }) {
  const abbreviation = US_STATE_ABBREVIATIONS[admin1];
  if (country === 'United States' && abbreviation) {
    return `${name}, ${abbreviation}`;
  }
  return name;
}

//builds the fuller label shown in the autocomplete dropdown, e.g.
//"Chesterton, Indiana, United States" — spelled out so cities that share
//a name in different countries/regions are easy to tell apart
function formatSuggestionLabel({ name, admin1, country }) {
  return [name, admin1, country].filter(Boolean).join(', ');
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
  const { name, admin1, country, temperature, weatherCode, wind } = data;
  const { label, icon } = getWeatherInfo(weatherCode);

  const fahrenheit = celsiusToFahrenheit(temperature);

  document.getElementById('current').hidden = false;
  document.getElementById('current-city').textContent = formatCityLabel({ name, admin1, country });
  document.getElementById('current-temp').innerHTML =
    `<span class="temp-primary">${fahrenheit}°F</span><span class="temp-secondary">${temperature}°C</span>`;
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
      <p class="day-name">${getDayName(date)}</p>
      <p class="day-date">${getMonthDay(date)}</p>
      <p class="day-icon">${icon}</p>
      <p>${label}</p>
      <p>H: ${celsiusToFahrenheit(temperature_2m_max[i])}°F <span class="temp-secondary">${temperature_2m_max[i]}°C</span></p>
      <p>L: ${celsiusToFahrenheit(temperature_2m_min[i])}°F <span class="temp-secondary">${temperature_2m_min[i]}°C</span></p>
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

//shared by both the Search button and picking a suggestion — fetches the
//forecast for known coordinates and renders it
async function renderWeatherForCoords(coords) {
  clearResults();
  showLoading();

  try {
    const forecast = await getForecast(coords.latitude, coords.longitude);

    renderCurrent({
      name: coords.name,
      admin1: coords.admin1,
      country: coords.country,
      temperature: forecast.current.temperature_2m,
      weatherCode: forecast.current.weather_code,
      wind: forecast.current.wind_speed_10m,
    });

    renderForecast(forecast.daily);
  } catch (error) {
    // catches a network failure from the forecast fetch
    console.log(error.message);
  } finally {
    hideLoading();
  }
}

//add a click listener to the search button and grab input value
searchButton.addEventListener('click', async () => {
  const city = searchInput.value.trim();

  if (!city) {
    console.log('Oops, try again...');
    return;
  }

  hideSuggestions();

  try {
    // geocode the typed text (takes the first match — ambiguous names should
    // be resolved by picking a suggestion instead)
    const coords = await getCoordinates(city);
    await renderWeatherForCoords(coords);
  } catch (error) {
    // catches a bad city name from getCoordinates
    console.log(error.message);
  }
});

//---- autocomplete dropdown ----

const suggestionsList = document.getElementById('suggestions');
let suggestionTimer;
let activeSuggestionIndex = -1;

function hideSuggestions() {
  suggestionsList.innerHTML = '';
  suggestionsList.hidden = true;
  activeSuggestionIndex = -1;
}

//user picked a suggestion — fill the input, close the dropdown, and go straight
//to rendering, since we already have exact coordinates (no need to re-geocode)
function selectSuggestion(result) {
  const { name, admin1, country, latitude, longitude } = result;

  searchInput.value = formatSuggestionLabel({ name, admin1, country });
  hideSuggestions();
  renderWeatherForCoords({ name, admin1, country, latitude, longitude });
}

function renderSuggestions(results) {
  suggestionsList.innerHTML = '';
  activeSuggestionIndex = -1;

  if (results.length === 0) {
    suggestionsList.hidden = true;
    return;
  }

  results.forEach((result) => {
    const item = document.createElement('li');
    item.textContent = formatSuggestionLabel(result);
    item.addEventListener('click', () => selectSuggestion(result));
    suggestionsList.appendChild(item);
  });

  suggestionsList.hidden = false;
}

async function fetchSuggestions(query) {
  const results = await geocodeCity(query, 5);
  renderSuggestions(results);
}

//debounce so we're not hitting the API on every single keystroke
searchInput.addEventListener('input', () => {
  clearTimeout(suggestionTimer);
  const query = searchInput.value.trim();

  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  suggestionTimer = setTimeout(() => fetchSuggestions(query), 300);
});

//arrow keys move a highlighted suggestion, Enter selects it (or runs a plain
//search if nothing's highlighted), Escape closes the list
searchInput.addEventListener('keydown', (event) => {
  const items = suggestionsList.querySelectorAll('li');
  const dropdownOpen = !suggestionsList.hidden && items.length > 0;

  if (event.key === 'Enter') {
    event.preventDefault();
    if (dropdownOpen && activeSuggestionIndex >= 0) {
      items[activeSuggestionIndex].click();
    } else {
      searchButton.click();
    }
    return;
  }

  if (!dropdownOpen) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
  } else if (event.key === 'Escape') {
    hideSuggestions();
    return;
  } else {
    return;
  }

  items.forEach((item, index) => item.classList.toggle('active', index === activeSuggestionIndex));
});

//clicking anywhere outside the search box closes the dropdown
document.addEventListener('click', (event) => {
  if (!document.getElementById('search-wrapper').contains(event.target)) {
    hideSuggestions();
  }
});
