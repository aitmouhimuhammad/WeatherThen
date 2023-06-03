const OPENCAGE_API_KEY = "c63dbf6378a842a29b485cee41540844";
const OPENWEATHERMAP_API_KEY = "6841e5450643e5d4ff59981dbf58944e";

const DEFAULT_LAT =  34.02236;
const DEFAULT_LON = -6.8340222;

function capitalizeEachWord(str) {
  var words = str.split(" ");
  var capitalizedWords = [];

  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
    capitalizedWords.push(capitalizedWord);
  }

  return capitalizedWords.join(" ");
}

function getWeatherIconUrl(iconCode) {
  var iconBaseUrl = "https://openweathermap.org/img/wn/";
  var iconSize = "@2x.png";

  var iconUrl = iconBaseUrl + iconCode + iconSize;
  return iconUrl;
}

function getCityFromCoordinates(lat, lon) {
  var apiUrl = "https://api.opencagedata.com/geocode/v1/json";

  var params = {
    key: OPENCAGE_API_KEY,
    q: lat + "," + lon,
    no_annotations: 1,
    language: "en",
    limit: 1,
  };

  $.get(apiUrl, params, function (data) {
    if (data.results.length > 0) {
      var city = data.results[0].components.city;
      var country = data.results[0].components.country_code.toUpperCase();
      var cityFormat = city + ", " + country;

      $("#location").text(cityFormat);
    }
  });
}

function updateCity(cityName) {
  var apiUrl = 'https://api.opencagedata.com/geocode/v1/json';

  var params = {
    key: OPENCAGE_API_KEY,
    q: cityName,
    limit: 1
  };

  return $.get(apiUrl, params)
    .then(function(response) {
      if (response.results.length > 0) {
        var result = response.results[0];
        var lat = result.geometry.lat;
        var lon = result.geometry.lng;

        getCityFromCoordinates(lat, lon);
        getForecast(lat, lon);
        getCurrentWeather(lat, lon);
      } else {
        return undefined;
      }
    });
}


function getFormattedDate() {
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  var now = new Date();
  var day = now.getDate();
  var month = months[now.getMonth()];
  var year = now.getFullYear();

  return day + " " + month + " " + year;
}

function getCurrentTime() {
  var now = new Date();
  var hours = now.getHours().toString().padStart(2, "0");
  var minutes = now.getMinutes().toString().padStart(2, "0");

  return hours + ":" + minutes;
}

function getCurrentWeather(lat, lon) {
  var apiUrl = "https://api.openweathermap.org/data/2.5/weather";

  var params = {
    lat: lat,
    lon: lon,
    appid: OPENWEATHERMAP_API_KEY,
    units: "metric",
  };

  $.get(apiUrl, params, function (data) {
    var temperature = data.main.temp;
    var weatherDescription = data.weather[0].description;
    var weatherIcon = data.weather[0].icon;

    $("#todays-weather-temperature").text(temperature + " °C");
    $("#todays-weather-hint").text(capitalizeEachWord(weatherDescription));
    $("#todays-weather-icon")[0].src = getWeatherIconUrl(weatherIcon);
  });
}

function getForecast(lat, lon) {
  var apiUrl = "https://api.openweathermap.org/data/2.5/onecall";

  var params = {
    lat: lat,
    lon: lon,
    appid: OPENWEATHERMAP_API_KEY,
    exclude: "current,minutely,hourly",
    units: "metric",
  };

  $.get(apiUrl, params, function (data) {
    var forecast = [];
    var dailyForecast = data.daily.slice(1, 4);
    var i = 1;

    dailyForecast.forEach(function (day) {
      var date = new Date(day.dt * 1000);
      var dayOfMonth = date.getDate();
      var month = date.toLocaleString("default", { month: "long" });

      var forecastObj = {
        date: dayOfMonth + " " + month,
        weatherDescription: capitalizeEachWord(day.weather[0].description),
        temperature: day.temp.day,
        icon: day.weather[0].icon,
      };

      $("#forecast-" + i)
        .find(".forecast-hint")
        .text(forecastObj.weatherDescription);
      $("#forecast-" + i)
        .find(".forecast-temperature")
        .text(forecastObj.temperature + " °C");
      $("#forecast-" + i)
        .find(".forecast-date")
        .text(forecastObj.date);
      $("#forecast-" + i).find(".forecast-icon")[0].src = getWeatherIconUrl(
        forecastObj.icon
      );
      forecast.push(forecastObj);

      i += 1;
    });
  });
}

$(document).ready(function () {
  getCityFromCoordinates(DEFAULT_LAT, DEFAULT_LON);
  getForecast(DEFAULT_LAT, DEFAULT_LON);
  getCurrentWeather(DEFAULT_LAT, DEFAULT_LON);

  $("#time").text(getCurrentTime());
  $("#date").text(getFormattedDate());

  $("#change-location-btn").click(function () {
    $("#myModal").css("display", "block");

    $("#cityInput").autocomplete({
      source: function (request, response) {
        $.ajax({
          url: "https://api.opencagedata.com/geocode/v1/json",
          dataType: "json",
          data: {
            q: request.term,
            key: OPENCAGE_API_KEY,
          },
          success: function (data) {
            var suggestions = data.results.map(function (result) {
              return result.components.city;
            });

            var filtredSuggestions = suggestions.filter(function (element) {
              return element !== undefined;
            });

            response(filtredSuggestions);
          },
        });
      },
      minLength: 2,
    });
  });

  $(window).click(function (event) {
    if (event.target == $("#myModal")[0]) {
      $("#myModal").css("display", "none");

      var city = $("#cityInput").val();
      updateCity(city);

    }
  });
});
