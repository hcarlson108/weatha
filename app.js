//grab the user input and button from index.html
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

/*
    look up a cities coordinates using Open-Mateo's geocoding API

    call an async function to getCoordinates of the entered city

    
    c
*/

//add an event listent to the button
searchButton.addEventListener('click', () => {
  const city = searchInput.value.trim();

  //if there is no city entered, log to the console
  if (!city) {
    console.log('please enter a city...');
  }

  console.log(city);
});
