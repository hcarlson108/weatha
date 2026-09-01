//grab the user input and button from index.html
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

/*
    look up a cities coordinates using Open-Mateo's geocoding API
    call an async function to getCoordinates of the entered city
*/

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

  const response = await fetch(url);
  const data = await response.json();

  //log data
  console.log(data);

  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for "${city}"`);
  }

  const { latitude, longitude, name, country } = data.results[0];
  return { latitude, longitude, name, country };
}

//add an event listent to the button
searchButton.addEventListener('click', () => {
  const city = searchInput.value.trim();

  //if there is no city entered, log to the console
  if (!city) {
    console.log('please enter a city...');
  }

  console.log(city);
});
