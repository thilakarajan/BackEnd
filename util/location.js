const axios = require("axios");

const API = process.env.API;

const getCoordinationsByAddress = async (address) => {
    const response = await axios
    .get(
        `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${API}`
    )
    
    const data = response.data
    
    console.log(data[0])
    if(!data || data.length === 0){
        return { lat: 48.8583701, lng: 2.2919064 };
    }


    const coordination = {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
    }

    return coordination;
}

module.exports = getCoordinationsByAddress;