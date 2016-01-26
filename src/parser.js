"use strict";

var exports = module.exports = {};

exports.personastate = function(state) {
  var states = [
    "Offline", 
    "Online", 
    "Busy", 
    "Away",
    "Snooze",
    "Looking to trade"
    ];
  
  return states[state];
}

exports.timecreated = function(time) {
  var dateCreated = new Date(time * 1000);

  var year = dateCreated.getFullYear(),
      month = dateCreated.getMonth();

  var age = getAge(dateCreated);

  var dateString = getMonthName(month) + " " + year;
  return {dateCreated: dateString, age: age};
}

function getMonthName(month) {
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
    "December"
  ];

  return months[month];
}

function getAge(dateCreated) {
    var today = new Date();
    var years = today.getFullYear() - dateCreated.getFullYear();
    var months = today.getMonth() - dateCreated.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < dateCreated.getDate())) {
        years--;
        months += 12;
    }

    var age = years.toString() + '.' + 
      Math.floor((months - today.getMonth()) * 10000 / 12).toString().substr(0, 1) + 
      " years";

    return age;
}